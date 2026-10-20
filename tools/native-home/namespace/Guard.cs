using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

internal static class Guard
{
    internal const string Stage = "/home/owner/share/tmp/sdk_tools/vibe-home-proof";
    internal const string FirmwareVersion = "Version=T-NKLAUABC-2310.0;";
    internal const string DotnetHash = "d2a35114d788c22d22d329acdb2f379c17b75b7099997fb8252cbd6dd940702e";
    internal const string LauncherHash = "3580e6dcf5d9c6d5d0a606d43a3d878641f35eeac07317a405fb45bbed69a653";
    [DllImport("libc.so.6")] internal static extern uint getuid();

    internal static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
    internal static string OwnerView(string original)
    {
        var lines = original.Split('\n');
        int changed = 0;
        for (int i = 0; i < lines.Length; i++)
        {
            var fields = lines[i].Split(':');
            if (fields[0] != "owner") continue;
            Require(fields.Length == 7 && fields[2] == "5001" && fields[3] == "100", "Unexpected owner record");
            fields[2] = fields[3] = "0";
            lines[i] = string.Join(":", fields);
            changed++;
        }
        Require(changed == 1, "Expected exactly one owner record");
        return string.Join("\n", lines);
    }
    internal static void Firmware(string value)
    {
        var versions = value.Split('\n').Where(line => line.StartsWith("Version=", StringComparison.Ordinal)).ToArray();
        Require(versions.Length == 1 && versions[0] == FirmwareVersion, "Unsupported firmware");
    }
    internal static void Identity(string status, uint expected, uint? expectedGroup = null)
    {
        foreach (string field in new[] { "Uid:", "Gid:" })
        {
            var lines = status.Split('\n').Where(line => line.StartsWith(field, StringComparison.Ordinal)).ToArray();
            Require(lines.Length == 1, "Missing or duplicate " + field);
            var parts = lines[0].Split((char[])null, StringSplitOptions.RemoveEmptyEntries);
            uint value = field == "Gid:" ? expectedGroup ?? expected : expected;
            Require(parts.Length == 5 && parts.Skip(1).All(part => part == value.ToString(CultureInfo.InvariantCulture)), "Unexpected " + field);
        }
    }
    internal static void RegularFile(string path)
    {
        Require(File.Exists(path) && (File.GetAttributes(path) & (FileAttributes.ReparsePoint | FileAttributes.Directory)) == 0,
            "Missing or indirect file: " + Path.GetFileName(path));
    }
    internal static void Absent(string path)
    {
        try { File.GetAttributes(path); }
        catch (FileNotFoundException) { return; }
        catch (DirectoryNotFoundException) { return; }
        throw new InvalidOperationException("Output already exists: " + Path.GetFileName(path));
    }
    internal static string Hash(string path)
    {
        RegularFile(path);
        using (var sha = SHA256.Create())
        using (var stream = File.OpenRead(path))
            return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
    }
    internal static void Machine()
    {
        Require(RuntimeInformation.ProcessArchitecture == Architecture.Arm && IntPtr.Size == 4, "Requires ARM32");
        Firmware(File.ReadAllText("/etc/prd_info.ini"));
        Require(Hash("/usr/bin/dotnet") == DotnetHash, "Unexpected dotnet binary");
        Require(Hash("/usr/sbin/sdbd-tarlauncher") == LauncherHash, "Unexpected tar launcher");
    }
}
