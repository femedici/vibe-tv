// Adapted from Couchroot 83906b468836869933012da03a4018fb339462b3; see ../COUCHROOT-LICENSE.txt.
using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

internal static class NamespaceRootProbe
{
    const string PublicKey = "/usr/share/sdbd/public.pem";
    const string Passwd = "/etc/passwd";
    const string Archive = "/home/owner/share/tmp/sdk_tools/on-demand/vibe-home-proof.tar.gz";
    [DllImport("libc.so.6", SetLastError = true)] static extern int unshare(int flags);
    [DllImport("libc.so.6", SetLastError = true)] static extern int mount(string source, string target, string fs, UIntPtr flags, string data);
    [DllImport("libc.so.6", SetLastError = true)] static extern int umount2(string path, int flags);

    static void Check(string operation, int result)
    {
        int error = Marshal.GetLastWin32Error();
        Guard.Require(result == 0, operation + " failed, errno=" + error);
    }
    static void RunControl(uint expected)
    {
        var start = new ProcessStartInfo("/usr/sbin/sdbd-tarlauncher")
        {
            UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true
        };
        foreach (string arg in new[] { "--package_name", "vibe-home-proof", "-xzf", Archive,
            "--to-command=/usr/bin/dotnet " + Guard.Stage + "/RootIdentity.dll" })
            start.ArgumentList.Add(arg);
        using (var process = Process.Start(start))
        {
            var elapsed = Stopwatch.StartNew();
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(30000))
            {
                try { process.Kill(true); }
                catch { throw new Exception("UNCERTAIN: cannot terminate timed-out root helper; inspect processes"); }
                Guard.Require(process.WaitForExit(3000), "UNCERTAIN: helper did not stop after deadline");
                throw new Exception("UNCERTAIN: helper deadline exceeded; inspect before retry");
            }
            int remaining = Math.Max(0, 30000 - (int)elapsed.ElapsedMilliseconds);
            Guard.Require(Task.WaitAll(new Task[] { stdout, stderr }, remaining), "UNCERTAIN: helper pipes did not close before deadline");
            string output = stdout.GetAwaiter().GetResult();
            string error = stderr.GetAwaiter().GetResult();
            Guard.Require(output.Length <= 16384 && error.Length <= 4096, "Unexpected helper output size");
            Console.Write(output);
            Console.Error.Write(error);
            Guard.Identity(output, expected, expected == 5001 ? (uint)100 : expected);
            Guard.Require(process.ExitCode == 0, "Control operation failed; inspect result before retry");
        }
    }
    static int Main(string[] args)
    {
        bool keyMounted = false, passwdMounted = false;
        string passwdHash = null, keyHash = null;
        int result = 1;
        try
        {
            Guard.Require(args.Length == 0, "Arguments are not accepted");
            Guard.Machine();
            Guard.Identity(File.ReadAllText("/proc/self/status"), 901);
            Guard.Require(Guard.getuid() == 901, "Expected SDK UID901");
            Guard.Require((File.GetAttributes(Guard.Stage) & FileAttributes.ReparsePoint) == 0, "Indirect staging directory");
            foreach (string file in new[] { Guard.Stage + "/RootIdentity.dll", Guard.Stage + "/public.pem", Archive, Archive + ".signature" })
                Guard.RegularFile(file);
            passwdHash = Guard.Hash(Passwd);
            keyHash = Guard.Hash(PublicKey);
            string ownerView = Guard.OwnerView(File.ReadAllText(Passwd));
            using (var stream = new FileStream(Guard.Stage + "/passwd-view", FileMode.CreateNew, FileAccess.Write))
            using (var writer = new StreamWriter(stream)) writer.Write(ownerView);

            Check("Private namespace", unshare(0x20000));
            Check("Private propagation", mount(null, "/", null, new UIntPtr(0x44000), null));
            Guard.Require(!File.ReadAllText("/proc/self/mountinfo").Contains(" shared:"), "Shared mounts remain");
            Check("Private test key", mount(Guard.Stage + "/public.pem", PublicKey, null, new UIntPtr(4096), null));
            keyMounted = true;
            RunControl(5001);
            Check("Private owner view", mount(Guard.Stage + "/passwd-view", Passwd, null, new UIntPtr(4096), null));
            passwdMounted = true;
            RunControl(0);
            result = 0;
        }
        catch (Exception e) { Console.Error.WriteLine("NAMESPACE_STOP: " + e.Message); }
        finally
        {
            // A failed unmount must not be hidden by a successful operation result.
            if (passwdMounted && umount2(Passwd, 2) != 0) { Console.Error.WriteLine("UNCERTAIN: owner view unmount failed"); result = 2; }
            if (keyMounted && umount2(PublicKey, 2) != 0) { Console.Error.WriteLine("UNCERTAIN: key view unmount failed"); result = 2; }
            if (passwdHash != null && keyHash != null)
            {
                try
                {
                    Guard.Require(Guard.Hash(Passwd) == passwdHash && Guard.Hash(PublicKey) == keyHash, "Original authentication file hash mismatch");
                    Console.WriteLine("AUTH_VIEWS=restored");
                }
                catch (Exception e) { Console.Error.WriteLine("UNCERTAIN: " + e.Message); result = 2; }
            }
        }
        Console.WriteLine("NAMESPACE_EXIT=" + result);
        return result;
    }
}
