using System;
using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;

internal static class Route
{
    static string Body(string mode)
    {
        using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("VibeHome." + mode + ".sql"))
        using (var reader = new StreamReader(stream))
        {
            string sql = reader.ReadToEnd();
            int begin = sql.IndexOf("BEGIN IMMEDIATE;", StringComparison.Ordinal);
            int end = sql.LastIndexOf("COMMIT;", StringComparison.Ordinal);
            Guard.Require(begin >= 0 && end > begin && sql.Substring(end + 7).Trim().Length == 0, "Unexpected reviewed transaction shape");
            return sql.Substring(begin + 16, end - begin - 16);
        }
    }
    static void Transaction(Sqlite db, string mode, string backup = null, string hash = null)
    {
        if (backup != null)
        {
            Guard.Require(hash != null && Regex.IsMatch(hash, "\\A[0-9a-f]{64}\\z"), "Missing pinned backup SHA256");
            Guard.Require(Guard.Hash(backup) == hash, "Backup SHA256 differs from compiled approval");
        }
        db.Exec("BEGIN IMMEDIATE;");
        try
        {
            string current = db.Snapshot();
            if (backup != null)
            {
                using (var original = new Sqlite(backup, true))
                {
                    original.Integrity();
                    Guard.Require(current == original.Snapshot(), "Live routing state differs from original backup");
                }
                Guard.Require(Guard.Hash(backup) == hash, "Backup changed while checking");
            }
            db.Exec(Body(mode));
            db.Exec("COMMIT;");
        }
        catch
        {
            try { db.Exec("ROLLBACK;"); }
            catch { throw new Exception("UNCERTAIN: transaction rollback failed; inspect state before retry"); }
            throw;
        }
    }
    static void Change(Sqlite db, string mode, Action notify, string backup = null, string hash = null)
    {
        Transaction(db, mode, backup, hash);
        try { notify(); }
        catch
        {
            try
            {
                Transaction(db, mode == "apply" ? "restore" : "apply");
            }
            catch
            {
                throw new Exception("UNCERTAIN: notification and inverse SQL failed; inspect DB and reload key before retry");
            }
            try { notify(); }
            catch
            {
                throw new Exception("UNCERTAIN: inverse SQL committed but reload notification failed; inspect before retry");
            }
            throw new Exception("ROLLED_BACK: notification failed; inverse SQL committed and reload accepted");
        }
    }
    internal static void Apply(Sqlite database, string backup, string hash, Action notify)
    {
        Change(database, "apply", notify, backup, hash);
    }
    internal static void Restore(Sqlite database, Action notify)
    {
        Change(database, "restore", notify);
    }
}

internal static class Notification
{
    internal static void Send(Func<int> read, Action<int> write)
    {
        int previous = read();
        Guard.Require(previous == 0 || previous == 1, "Unexpected context reload notification value");
        int next = previous == 0 ? 1 : 0;
        write(next);
        Guard.Require(read() == next, "Context reload notification failed");
    }
}
