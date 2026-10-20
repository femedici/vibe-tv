using System;
using System.IO;
using System.Runtime.InteropServices;

internal static class SelfTest
{
    static int checks;
    static void Equal(string expected, string actual, string label)
    {
        if (expected != actual) throw new Exception(label);
        checks++;
    }
    static void Reject(Action action, string label)
    {
        try { action(); } catch { checks++; return; }
        throw new Exception("Accepted " + label);
    }
    static void RejectContains(Action action, string expected)
    {
        try { action(); }
        catch (Exception e)
        {
            if (!e.Message.Contains(expected)) throw new Exception("Wrong failure: " + e.Message);
            checks++;
            return;
        }
        throw new Exception("Missing failure: " + expected);
    }
    static int Main()
    {
        try
        {
            string original = "root:x:0:0:root:/root:/bin/sh\nowner:x:5001:100:owner:/home/owner:/bin/sh\n";
            Equal(original.Replace("owner:x:5001:100:", "owner:x:0:0:"), Guard.OwnerView(original), "owner view must change only owner UID/GID");
            Reject(() => Guard.OwnerView(original + "owner:x:5001:100:o:/home/owner:/bin/sh\n"), "duplicate owner");
            Reject(() => Guard.OwnerView(original.Replace(":5001:100:", ":5001:99:")), "unexpected owner GID");
            Reject(() => Guard.OwnerView("root:x:0:0:root:/root:/bin/sh\n"), "missing owner");
            Guard.Firmware("Version=T-NKLAUABC-2310.0;\nModel=ignored;\n");
            Reject(() => Guard.Firmware("Version=T-NKM2AKUC-2301.1;\n"), "other firmware");
            Reject(() => Guard.Firmware("Version=T-NKLAUABC-2310.0;\nVersion=T-NKLAUABC-2310.0;\n"), "duplicate firmware");
            Guard.Identity("Uid:\t901\t901\t901\t901\nGid:\t901\t901\t901\t901\n", 901);
            Guard.Identity("Uid:\t5001\t5001\t5001\t5001\nGid:\t100\t100\t100\t100\n", 5001, 100);
            Reject(() => Guard.Identity("Uid:\t901\t0\t901\t901\nGid:\t901\t901\t901\t901\n", 901), "mixed credentials");
            Reject(() => Guard.Identity("Uid:\t901\t901\t901\t901\n", 901), "missing GID");
            NativeLibrary.SetDllImportResolver(typeof(Sqlite).Assembly, (name, assembly, path) =>
                name == "libsqlite3.so.0" ? NativeLibrary.Load("/usr/lib/libsqlite3.dylib") : IntPtr.Zero);
            string folder = Path.Combine(Path.GetTempPath(), "vibe-home-test-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(folder);
            try
            {
                string live = Path.Combine(folder, "live.db");
                string backup = Path.Combine(folder, "backup.db");
                using (var db = Sqlite.Create(live))
                {
                    Reject(() => Guard.Absent(live), "existing snapshot output");
                    string dangling = Path.Combine(folder, "dangling.db");
                    File.CreateSymbolicLink(dangling, Path.Combine(folder, "missing.db"));
                    Reject(() => Guard.Absent(dangling), "dangling snapshot symlink");
                    Guard.Absent(Path.Combine(folder, "absent.db"));
                    db.Exec("CREATE TABLE managed_app(appid TEXT NOT NULL,ui_type TEXT,source TEXT,UNIQUE(appid,ui_type,source));" +
                        "CREATE TABLE key_filter(appid TEXT NOT NULL,key TEXT NOT NULL,longpress TEXT,override TEXT,on_selector TEXT,request TEXT NOT NULL,target_selector TEXT NOT NULL,args TEXT,UNIQUE(appid,key,longpress,override,on_selector,request,target_selector,args));" +
                        "CREATE TABLE task_filter(appid TEXT NOT NULL,source_selector TEXT NOT NULL,source_event TEXT NOT NULL,request TEXT NOT NULL,target_selector TEXT,target TEXT,args TEXT,UNIQUE(appid,source_selector,source_event,request,target_selector,target,args));" +
                        "INSERT INTO managed_app VALUES('com.samsung.tv.csfs','partial',NULL);" +
                        "INSERT INTO key_filter(rowid,appid,key,longpress,override,on_selector,request,target_selector,args) VALUES(79,'com.samsung.tv.csfs','XF86Home',NULL,NULL,'','launch','package:com.samsung.tv.csfs','entry_point:smarthub_key');" +
                        "INSERT INTO key_filter VALUES('org.tizen.remote-management','XF86Home','5300',NULL,'~with-package:org.tizen.remote-management','launch','package:org.tizen.remote-management',NULL);");
                    string originalRows = db.Snapshot();
                    db.Backup(backup);
                    Equal("True", File.Exists(backup).ToString(), "consistent backup file must be created");
                    using (var saved = new Sqlite(backup, true)) { saved.Integrity(); Equal(originalRows, saved.Snapshot(), "backup rows and schema"); }
                    string hash = Guard.Hash(backup);
                    Reject(() => db.Backup(backup), "overwriting existing backup");
                    Equal(hash, Guard.Hash(backup), "existing backup must remain byte-identical");
                    int notifications = 0;
                    Route.Apply(db, backup, hash, () => notifications++);
                    Equal("package:VibeTV2026.VibeTV", db.Scalar("SELECT target_selector FROM key_filter WHERE rowid=79"), "Home must target Vibe");
                    Equal("1", notifications.ToString(), "one apply notification");
                    string observed = Path.Combine(folder, "observed.db");
                    using (var readOnly = new Sqlite(live, true)) readOnly.Backup(observed);
                    using (var captured = new Sqlite(observed, true)) Equal(db.Snapshot(), captured.Snapshot(), "consistent observation after apply");
                    Equal(hash, Guard.Hash(backup), "observation must preserve original backup");
                    Reject(() => Route.Apply(db, backup, hash, () => notifications++), "repeating apply");
                    Route.Restore(db, () => notifications++);
                    Equal(originalRows, db.Snapshot(), "exact restore of rows, rowid and schema");
                    Equal("2", notifications.ToString(), "one restore notification");
                    Reject(() => Route.Apply(db, backup, new string('0', 64), () => notifications++), "wrong pinned backup hash");
                    db.Exec("INSERT INTO managed_app VALUES('new.app',NULL,NULL)");
                    string changed = db.Snapshot();
                    Reject(() => Route.Apply(db, backup, hash, () => notifications++), "stale backup");
                    Equal(changed, db.Snapshot(), "stale backup must not mutate anything");
                    db.Exec("DELETE FROM managed_app WHERE appid='new.app'");
                    int calls = 0;
                    Reject(() => Route.Apply(db, backup, hash, () => { if (++calls == 1) throw new Exception("notification failed"); }), "reported notification failure");
                    Equal(originalRows, db.Snapshot(), "notification failure must reverse the applied rows");
                    Equal("2", calls.ToString(), "notify restored state once");
                    int signal = 0;
                    bool firstHighRead = true;
                    Reject(() => Route.Apply(db, backup, hash, () => Notification.Send(
                        () => { if (signal == 1 && firstHighRead) { firstHighRead = false; throw new Exception("readback failed"); } return signal; },
                        value => signal = value)), "setter success then readback failure");
                    Equal("0", signal.ToString(), "inverse must emit a fresh notification");
                    Equal(originalRows, db.Snapshot(), "inverse rows after readback failure");
                    RejectContains(() => Route.Apply(db, backup, hash, () => { throw new Exception("signal unavailable"); }),
                        "UNCERTAIN: inverse SQL committed but reload notification failed");
                    Equal(originalRows, db.Snapshot(), "double notification failure leaves reversed SQL");
                    RejectContains(() => Route.Apply(db, backup, hash, () =>
                    {
                        db.Exec("UPDATE key_filter SET args='concurrent-change' WHERE rowid=79");
                        throw new Exception("signal unavailable");
                    }), "UNCERTAIN: notification and inverse SQL failed");
                    Equal("concurrent-change", db.Scalar("SELECT args FROM key_filter WHERE rowid=79"), "inverse conflict must preserve the conflicting state");
                    db.Exec("UPDATE key_filter SET args=NULL WHERE rowid=79");
                    Route.Restore(db, () => { });
                    Route.Apply(db, backup, hash, () => { });
                    db.Exec("CREATE TRIGGER unexpected_change AFTER DELETE ON managed_app BEGIN UPDATE managed_app SET ui_type='unexpected'; END;");
                    Reject(() => Route.Restore(db, () => { }), "restore with unexpected trigger");
                    Equal("partial", db.Scalar("SELECT ui_type FROM managed_app WHERE appid='com.samsung.tv.csfs'"), "trigger must never fire during rejected restore");
                    Equal("package:VibeTV2026.VibeTV", db.Scalar("SELECT target_selector FROM key_filter WHERE rowid=79"), "trigger refusal must preserve applied route");
                    db.Exec("DROP TRIGGER unexpected_change;");
                    db.Exec("INSERT INTO managed_app VALUES('new.app',NULL,NULL)");
                    Route.Restore(db, () => { });
                    Equal("1", db.Scalar("SELECT count(*) FROM managed_app WHERE appid='new.app'"), "restore must preserve subsequent unrelated rows");
                }
            }
            finally { Directory.Delete(folder, true); }
            Console.WriteLine("PASS " + checks + " assertions");
            return 0;
        }
        catch (Exception e) { Console.Error.WriteLine("FAIL " + e.Message); return 1; }
    }
}
