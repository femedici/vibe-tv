using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal static class HomeControl
{
#if (HOME_IDENTITY && (HOME_BACKUP || HOME_APPLY || HOME_RESTORE)) || (HOME_BACKUP && (HOME_APPLY || HOME_RESTORE)) || (HOME_APPLY && HOME_RESTORE)
#error Exactly one fixed mode is allowed.
#endif
    const string Database = "/opt/dbspace/.app-context.db";
    const string Backup = Guard.Stage + "/app-context-original.db";
    const string BackupHash = Guard.Stage + "/app-context-original.sha256";
    const string Observed = Guard.Stage + "/app-context-observed.db";
    const string Changed = "memory/appfw/app_context_db_change";
#if HOME_IDENTITY
    const string Mode = "IDENTITY";
#elif HOME_BACKUP
    const string Mode = "BACKUP";
#elif HOME_APPLY
    const string Mode = "APPLY";
#elif HOME_RESTORE
    const string Mode = "RESTORE";
#else
#error A fixed HomeMode must be selected at build time.
#endif
    [DllImport("libvconf.so.0")] static extern int vconf_get_int(string key, out int value);
    [DllImport("libvconf.so.0")] static extern int vconf_set_int(string key, int value);
    [DllImport("libc.so.6", SetLastError = true)] static extern IntPtr lgetxattr(string path, string name, [Out] byte[] value, UIntPtr size);
    [DllImport("libc.so.6", SetLastError = true)] static extern int chown(string path, uint owner, uint group);
    [DllImport("libc.so.6", SetLastError = true)] static extern int chmod(string path, uint mode);

    static string Smack()
    {
        long size = lgetxattr(Database, "security.SMACK64", null, UIntPtr.Zero).ToInt64();
        if (size == -1 && Marshal.GetLastWin32Error() == 61) return "ABSENT_ENODATA";
        Guard.Require(size >= 0 && size <= 256, "Cannot read original SMACK metadata");
        var value = new byte[(int)size];
        long read = lgetxattr(Database, "security.SMACK64", value, new UIntPtr((uint)size)).ToInt64();
        Guard.Require(read == size, "Original SMACK metadata changed while reading");
        return "BASE64:" + Convert.ToBase64String(value);
    }
    static void MakeTransferPrivate(string path)
    {
        Guard.Require(path == Backup || path == BackupHash || path == Observed, "Only new snapshot artifacts may change ownership");
        Guard.RegularFile(path);
        // SDB file transfer runs as owner5001:100; SDK command execution uses901:901.
        Guard.Require(chmod(path, 384) == 0 && chown(path, 5001, 100) == 0, "Cannot make completed snapshot privately readable by SDB transfer");
    }
    static void SaveBackup()
    {
        Guard.Absent(Backup);
        Guard.Absent(BackupHash);
        string smack = Smack();
        using (var db = new Sqlite(Database, true)) db.Backup(Backup);
        string hash = Guard.Hash(Backup);
        using (var stream = new FileStream(BackupHash, FileMode.CreateNew, FileAccess.Write))
        {
            byte[] bytes = Encoding.ASCII.GetBytes(hash + "\n");
            stream.Write(bytes, 0, bytes.Length);
            stream.Flush(true);
        }
        MakeTransferPrivate(Backup);
        MakeTransferPrivate(BackupHash);
        Console.WriteLine("BACKUP_SHA256=" + hash);
        Console.WriteLine("SOURCE_SMACK64=" + smack);
        Console.WriteLine("BACKUP_RESULT=consistent_integrity_ok");
    }
    static int ReadSignal()
    {
        int value;
        Guard.Require(vconf_get_int(Changed, out value) == 0 && (value == 0 || value == 1), "Invalid or unreadable context reload key");
        return value;
    }
    static void Change()
    {
        Guard.Absent(Observed);
        ReadSignal();
        Action notify = () => Notification.Send(ReadSignal, value =>
        {
            Guard.Require(vconf_set_int(Changed, value) == 0, "Context reload setter failed");
        });
        using (var db = new Sqlite(Database, false))
        {
#if HOME_APPLY
            string hash = Assembly.GetExecutingAssembly().GetCustomAttributes<AssemblyMetadataAttribute>()
                .Single(attribute => attribute.Key == "ExpectedBackupSha256").Value;
            Route.Apply(db, Backup, hash, notify);
#elif HOME_RESTORE
            Route.Restore(db, notify);
#endif
        }
        try
        {
            using (var readOnly = new Sqlite(Database, true)) readOnly.Backup(Observed);
            string hash = Guard.Hash(Observed);
            MakeTransferPrivate(Observed);
            Console.WriteLine("OBSERVED_SHA256=" + hash);
            Console.WriteLine("OBSERVED_RESULT=consistent_integrity_ok");
        }
        catch (Exception e)
        {
            throw new Exception("UNCERTAIN: Home transaction and reload completed but observed snapshot failed: " + e.Message);
        }
        Console.WriteLine("HOME_RESULT=" + Mode + "_committed_reload_accepted");
        Console.WriteLine("VERIFY_AFTER_SECONDS=6");
    }
    static int Main(string[] args)
    {
        // The SDK parent may not have CAP_KILL for the root child.
        using (var deadline = new Timer(_ =>
        {
            Console.Error.WriteLine("CONTROL_TIMEOUT=uncertain; inspect DB and reload key before retry");
            Environment.Exit(124);
        }, null, 25000, Timeout.Infinite))
        {
            try
            {
                Guard.Require(args.Length == 0, "Arguments are not accepted");
                Guard.Machine();
                uint uid = Guard.getuid();
                Guard.Require(uid == 0 || uid == 5001, "Expected root or owner baseline");
                string status = File.ReadAllText("/proc/self/status");
                Guard.Identity(status, uid, uid == 5001 ? (uint)100 : 0);
                Console.WriteLine("CONTROL_MODE=" + Mode);
                foreach (string line in status.Split('\n'))
                    if (new[] { "Uid:", "Gid:", "CapInh:", "CapPrm:", "CapEff:", "CapBnd:", "NoNewPrivs:", "Seccomp:" }.Any(prefix => line.StartsWith(prefix, StringComparison.Ordinal)))
                        Console.WriteLine(line);
                string context = File.ReadAllText("/proc/self/attr/current").TrimEnd('\0', '\n');
                Guard.Require(context.Length <= 128 && context.All(character => character >= 32 && character <= 126), "Unexpected security context");
                Console.WriteLine("SMACK_CONTEXT=" + context);
                if (uid != 0) { Console.WriteLine("BASELINE=no_action"); return 0; }
#if HOME_BACKUP
                SaveBackup();
#elif HOME_APPLY || HOME_RESTORE
                Change();
#else
                Console.WriteLine("IDENTITY_RESULT=root");
#endif
                return 0;
            }
            catch (Exception e) { Console.Error.WriteLine("CONTROL_STOP: " + e.Message); return 1; }
        }
    }
}
