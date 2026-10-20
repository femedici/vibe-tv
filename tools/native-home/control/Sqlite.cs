using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal sealed class Sqlite : IDisposable
{
    internal IntPtr Handle;
    const string Library = "libsqlite3.so.0";
    static readonly Stopwatch Lifetime = Stopwatch.StartNew();
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int Progress(IntPtr unused);
    readonly Progress progress = _ => Lifetime.ElapsedMilliseconds >= 20000 ? 1 : 0;
    [DllImport(Library)] static extern int sqlite3_open_v2(string path, out IntPtr db, int flags, IntPtr vfs);
    [DllImport(Library)] static extern int sqlite3_close(IntPtr db);
    [DllImport(Library)] static extern int sqlite3_busy_timeout(IntPtr db, int ms);
    [DllImport(Library)] static extern int sqlite3_exec(IntPtr db, string sql, IntPtr callback, IntPtr data, out IntPtr error);
    [DllImport(Library)] static extern void sqlite3_free(IntPtr error);
    [DllImport(Library)] static extern int sqlite3_prepare_v2(IntPtr db, string sql, int bytes, out IntPtr statement, IntPtr tail);
    [DllImport(Library)] static extern int sqlite3_step(IntPtr statement);
    [DllImport(Library)] static extern int sqlite3_finalize(IntPtr statement);
    [DllImport(Library)] static extern int sqlite3_column_count(IntPtr statement);
    [DllImport(Library)] static extern int sqlite3_column_type(IntPtr statement, int column);
    [DllImport(Library)] static extern IntPtr sqlite3_column_blob(IntPtr statement, int column);
    [DllImport(Library)] static extern IntPtr sqlite3_column_text(IntPtr statement, int column);
    [DllImport(Library)] static extern int sqlite3_column_bytes(IntPtr statement, int column);
    [DllImport(Library)] static extern IntPtr sqlite3_backup_init(IntPtr destination, string destinationName, IntPtr source, string sourceName);
    [DllImport(Library)] static extern int sqlite3_backup_step(IntPtr backup, int pages);
    [DllImport(Library)] static extern int sqlite3_backup_finish(IntPtr backup);
    [DllImport(Library)] static extern void sqlite3_progress_handler(IntPtr db, int instructions, Progress callback, IntPtr context);

    internal Sqlite(string path, bool readOnly)
    {
        Guard.RegularFile(path);
        Guard.Require(new FileInfo(path).Length <= 16 * 1024 * 1024, "Routing DB exceeds 16MiB safety limit");
        int code = sqlite3_open_v2(path, out Handle, readOnly ? 1 : 2, IntPtr.Zero);
        if (code != 0) { Dispose(); throw new Exception("Cannot open existing SQLite DB: " + code); }
        Guard.Require(sqlite3_busy_timeout(Handle, 2000) == 0, "Cannot bound SQLite lock wait");
        sqlite3_progress_handler(Handle, 1000, progress, IntPtr.Zero);
    }
    internal static Sqlite Create(string path)
    {
        using (var file = new FileStream(path, FileMode.CreateNew, FileAccess.Write)) { }
        return new Sqlite(path, false);
    }
    internal void Exec(string sql)
    {
        IntPtr error;
        int code = sqlite3_exec(Handle, sql, IntPtr.Zero, IntPtr.Zero, out error);
        string message = error == IntPtr.Zero ? "" : Marshal.PtrToStringAnsi(error);
        if (error != IntPtr.Zero) sqlite3_free(error);
        if (code != 0) throw new Exception("SQLite " + code + ": " + message);
    }
    static byte[] Bytes(IntPtr statement, int column)
    {
        IntPtr value = sqlite3_column_type(statement, column) == 4
            ? sqlite3_column_blob(statement, column) : sqlite3_column_text(statement, column);
        int count = sqlite3_column_bytes(statement, column);
        var bytes = new byte[count];
        if (count > 0) Marshal.Copy(value, bytes, 0, count);
        return bytes;
    }
    internal List<string> Rows(string sql)
    {
        IntPtr statement;
        Guard.Require(sqlite3_prepare_v2(Handle, sql, -1, out statement, IntPtr.Zero) == 0, "Cannot prepare SQLite read");
        try
        {
            var rows = new List<string>();
            int code;
            while ((code = sqlite3_step(statement)) == 100)
            {
                var cells = new List<string>();
                for (int i = 0; i < sqlite3_column_count(statement); i++)
                    cells.Add(sqlite3_column_type(statement, i) + ":" + Convert.ToBase64String(Bytes(statement, i)));
                rows.Add(string.Join("|", cells));
            }
            Guard.Require(code == 101, "SQLite read did not finish: " + code);
            return rows;
        }
        finally { sqlite3_finalize(statement); }
    }
    internal string Scalar(string sql)
    {
        IntPtr statement;
        Guard.Require(sqlite3_prepare_v2(Handle, sql, -1, out statement, IntPtr.Zero) == 0, "Cannot prepare scalar read");
        try
        {
            Guard.Require(sqlite3_column_count(statement) == 1 && sqlite3_step(statement) == 100, "Expected one SQLite value");
            string value = Encoding.UTF8.GetString(Bytes(statement, 0));
            Guard.Require(sqlite3_step(statement) == 101, "Expected exactly one SQLite row");
            return value;
        }
        finally { sqlite3_finalize(statement); }
    }
    internal string Snapshot()
    {
        Guard.Require(Scalar("SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('key_filter','managed_app','task_filter')") == "3", "Missing routing tables");
        Guard.Require(Scalar("SELECT count(*) FROM sqlite_master WHERE type IN ('trigger','view') OR (type='table' AND name NOT IN ('key_filter','managed_app','task_filter'))") == "0", "Unexpected routing schema objects");
        var parts = new List<string>();
        parts.AddRange(Rows("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name"));
        foreach (string table in new[] { "key_filter", "managed_app", "task_filter" })
        {
            int columns = table == "key_filter" ? 8 : table == "managed_app" ? 3 : 7;
            Guard.Require(Rows("PRAGMA table_info(" + table + ")").Count == columns, "Unexpected routing columns");
            parts.Add(table);
            parts.AddRange(Rows("SELECT rowid,* FROM " + table + " ORDER BY rowid"));
        }
        return string.Join("\n", parts);
    }
    internal void Integrity()
    {
        Guard.Require(Scalar("PRAGMA integrity_check") == "ok", "SQLite integrity check failed");
    }
    internal void Backup(string destination)
    {
        using (var target = Create(destination))
        {
            IntPtr backup = sqlite3_backup_init(target.Handle, "main", Handle, "main");
            Guard.Require(backup != IntPtr.Zero, "Cannot initialize consistent backup");
            int code = -1;
            int finish;
            try
            {
                var elapsed = Stopwatch.StartNew();
                do
                {
                    Guard.Require(elapsed.ElapsedMilliseconds < 10000, "Backup deadline exceeded; partial file is not a recovery backup");
                    code = sqlite3_backup_step(backup, 256);
                    if (code == 5 || code == 6) Thread.Sleep(20);
                } while (code == 0 || code == 5 || code == 6);
            }
            finally { finish = sqlite3_backup_finish(backup); }
            Guard.Require(code == 101 && finish == 0, "Consistent backup did not complete");
            target.Integrity();
            target.Snapshot();
        }
    }
    public void Dispose()
    {
        if (Handle != IntPtr.Zero) { sqlite3_close(Handle); Handle = IntPtr.Zero; }
    }
}
