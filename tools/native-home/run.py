#!/usr/bin/env python3
"""Owner-authorized, fixed AU8000 identity/backup/Home test. Never retries."""
import argparse
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shlex
import sqlite3
import subprocess
import tarfile
import uuid

from transport import REMOTE, Session

ROOT = Path(__file__).resolve().parents[2]
FIRMWARE = "T-NKLAUABC-2310.0"
STAGE = REMOTE + "vibe-home-proof"
ARCHIVE = REMOTE + "on-demand/vibe-home-proof.tar.gz"
TABLES = ("key_filter", "managed_app", "task_filter")
AUTH = {
    "/etc/passwd": "610fe3305c96f9101c0ca5f65ae8eaa7111a9c8b8ced673f01d9e2553ba2ffad",
    "/usr/share/sdbd/public.pem": "c83cab64331f092ba99f666b8bb20a49dd1fff04030336c2ea34f6b55ca09d09",
}
GUARD = r"""set -eu
[ "$(id -u)" = 901 ]
grep -qx 'Version=T-NKLAUABC-2310.0;' /etc/prd_info.ini
[ "$(uname -m)" = armv7l ]
[ "$(sha256sum /usr/bin/dotnet | cut -d ' ' -f 1)" = d2a35114d788c22d22d329acdb2f379c17b75b7099997fb8252cbd6dd940702e ]
[ "$(sha256sum /usr/sbin/sdbd-tarlauncher | cut -d ' ' -f 1)" = 3580e6dcf5d9c6d5d0a606d43a3d878641f35eeac07317a405fb45bbed69a653 ]
[ "$(stat -c '%u %g %a' /opt/dbspace/.app-context.db)" = '0 0 644' ]
"""
for auth_file, digest in AUTH.items():
    GUARD += '[ "$(sha256sum ' + auth_file + " | cut -d ' ' -f 1)\" = " + digest + " ]\n"

# Read-only process inspection. No kill permission or guessed process name is
# treated as proof that a privileged child stopped.
QUIET = r"""
for proc in /proc/[0-9]*/cmdline; do
  test -r "$proc" || continue
  command_line=$(tr '\000' ' ' < "$proc" 2>/dev/null) || continue
  case "$command_line" in
    *NamespaceRootProbe.dll*|*RootIdentity.dll*|*sdbd-tarlauncher*)
      printf 'UNCERTAIN: related helper remains active\n'; exit 76;;
  esac
done
printf 'HELPERS=absent\n'
"""


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inspect_db(path):
    try:
        with sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True) as db:
            if db.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
                raise ValueError("Routing backup integrity check failed")
            tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if tables != set(TABLES):
                raise ValueError("Unexpected routing backup tables")
            return {name: db.execute("SELECT rowid,* FROM " + name + " ORDER BY rowid").fetchall() for name in TABLES}
    except sqlite3.Error as error:
        raise ValueError("Invalid routing backup database") from error


def verify_backup(folder, device_id):
    folder = Path(folder)
    file = folder / "app-context-original.db"
    metadata = json.loads((folder / "verified.json").read_text())
    if (metadata.get("device_id_sha256") != hashlib.sha256(device_id.encode()).hexdigest()
            or metadata.get("firmware") != FIRMWARE
            or metadata.get("sha256") != sha(file)):
        raise ValueError("Backup does not match this device, firmware or verified bytes")
    inspect_db(file)
    return metadata["sha256"]


def local(command, folder, label):
    result = subprocess.run(command, capture_output=True, text=True, timeout=120)
    (folder / (label + ".log")).write_text(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(label + " failed; inspect private evidence")
    return result.stdout


def build(mode, folder, backup_hash):
    artifacts = {}
    for project, assembly in (("namespace", "NamespaceRootProbe"), ("control", "RootIdentity")):
        output = folder / project
        command = ["dotnet", "build", str(ROOT / "tools/native-home" / project / (assembly + ".csproj")),
                   "-c", "Release", "--nologo", "-v", "quiet", "-o", str(output),
                   "-p:BaseIntermediateOutputPath=" + str(output / "obj") + "/"]
        if project == "control":
            command += ["-p:HomeMode=" + mode]
            if mode == "APPLY":
                command += ["-p:ExpectedBackupSha256=" + backup_hash]
        local(command, folder, "build-" + project)
        for suffix in (".dll", ".deps.json", ".runtimeconfig.json"):
            artifacts[output / (assembly + suffix)] = STAGE + "/" + assembly + suffix
    archive = folder / "vibe-home-proof.tar.gz"
    payload = b"Owner-authorized, bounded AU8000 Home test.\n"
    with tarfile.open(archive, "w:gz") as tar:
        entry = tarfile.TarInfo("identity-proof.txt")
        entry.size, entry.mode = len(payload), 0o644
        tar.addfile(entry, io.BytesIO(payload))
    private, public = folder / "disposable-private.pem", folder / "public.pem"
    signature = folder / (archive.name + ".signature")
    local(["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048",
           "-out", str(private)], folder, "key-generation")
    local(["openssl", "pkey", "-in", str(private), "-pubout", "-out", str(public)], folder, "public-key")
    local(["openssl", "dgst", "-sha256", "-sign", str(private), "-out", str(signature), str(archive)], folder, "sign")
    local(["openssl", "dgst", "-sha256", "-verify", str(public), "-signature", str(signature), str(archive)], folder, "verify")
    artifacts.update({public: STAGE + "/public.pem", archive: ARCHIVE, signature: ARCHIVE + ".signature"})
    return artifacts


def check_result(mode, output):
    expected = {"IDENTITY": "IDENTITY_RESULT=root", "BACKUP": "BACKUP_RESULT=consistent_integrity_ok",
                "APPLY": "HOME_RESULT=APPLY_committed_reload_accepted",
                "RESTORE": "HOME_RESULT=RESTORE_committed_reload_accepted"}[mode]
    for marker in (expected, "AUTH_VIEWS=restored", "NAMESPACE_EXIT=0", "BASELINE=no_action"):
        if output.splitlines().count(marker) != 1:
            raise RuntimeError("Missing unique helper result; state uncertain, no automatic retry")
    if "UNCERTAIN" in output or "CONTROL_STOP:" in output or "NAMESPACE_STOP:" in output:
        raise RuntimeError("Helper reported uncertainty; inspect saved evidence")


def launched(output):
    return re.fullmatch(r"\.\.\. successfully launched pid = [1-9][0-9]* with debug 0\s*", output) is not None


def cleanup_journal(path):
    file = shlex.quote(path)
    # Samsung SQLite leaves PERSIST journals after closing a snapshot.
    # Only task-local, inactive (zero header) journals may be removed.
    return ("if test -e " + file + " || test -L " + file + "; then\n"
            "test -f " + file + "\ntest ! -L " + file + "\n"
            '[ "$(od -An -tx1 -N8 ' + file + " | tr -d ' \\n')\" = 0000000000000000 ]\n"
            "rm -f " + file + "\nfi\n")


def readback(session, folder, backup, mode, output):
    file = folder / "routing-readback.db"
    # The root helper snapshots the committed live DB via sqlite3_backup, so
    # committed WAL pages are included. A direct live-file pull is not proof.
    if output.splitlines().count("OBSERVED_RESULT=consistent_integrity_ok") != 1:
        raise RuntimeError("Missing consistent post-change snapshot")
    hashes = re.findall(r"^OBSERVED_SHA256=([a-f0-9]{64})$", output, re.MULTILINE)
    if len(hashes) != 1:
        raise RuntimeError("Missing unique post-change snapshot checksum")
    session.pull(STAGE + "/app-context-observed.db", file)
    if sha(file) != hashes[0]:
        raise RuntimeError("Post-change snapshot transfer checksum mismatch")
    actual = inspect_db(file)
    with sqlite3.connect(":memory:") as expected:
        with sqlite3.connect((backup / "app-context-original.db").resolve().as_uri() + "?mode=ro", uri=True) as original:
            original.backup(expected)
        if mode == "APPLY":
            expected.executescript((ROOT / "tools/native-home/apply.sql").read_text())
        wanted = {name: expected.execute("SELECT rowid,* FROM " + name + " ORDER BY rowid").fetchall() for name in TABLES}
    if actual != wanted:
        raise RuntimeError("Live routing differs from expected three-table state; inspect before any retry")
    (folder / "readback-verified.txt").write_text(mode + ": all three tables and rowids match\n")


def execute(mode, host, backup=None):
    os.umask(0o077)
    private = ROOT / ".dev/native-home"
    private.mkdir(exist_ok=True, mode=0o700)
    with (private / "operation.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        session = Session(host, private)
        if mode in ("APPLY", "RESTORE") and backup is None:
            raise ValueError("The verified original backup directory is required")
        backup_hash = verify_backup(backup, session.expected) if backup else None
        folder = private / (mode.lower() + "-" + uuid.uuid4().hex[:16])
        folder.mkdir(mode=0o700)
        print("Private evidence:", folder, flush=True)
        artifacts = build(mode, folder, backup_hash)
        if mode == "APPLY":
            artifacts[backup / "app-context-original.db"] = STAGE + "/app-context-original.db"
            # Confirm the exact installed app can launch before routing Home.
            tz = Path.home() / ".tizen-extension-platform/server/sdktools/data/tools/tizen-core/tz"
            output = local([str(tz), "run", "--serial", session.serial, "--package-id", "VibeTV2026"], folder, "app-launch")
            if not launched(output):
                raise RuntimeError("Vibe launch was not confirmed; Home left unchanged")
        session.capture(GUARD + QUIET + "\ntest ! -e " + STAGE + "\ntest ! -e " + REMOTE + "on-demand\n"
                        + "mkdir -m 755 " + STAGE + " " + REMOTE + "on-demand\n"
                        + "mkdir -m 777 " + STAGE + "/upload\n", "prepare")
        # A failure from here keeps evidence/staging for manual inspection.
        # Never delete a possibly live helper or erase an unverified backup.
        for source, target in artifacts.items():
            # SDB file transfer uses owner5001, while SDK execution uses901.
            # Copy into SDK-owned protected files and remove this writable
            # incoming directory before any privilege-elevated execution.
            session.push(source, STAGE + "/upload/" + Path(target).name)
        script = GUARD + QUIET
        for source, target in artifacts.items():
            incoming = shlex.quote(STAGE + "/upload/" + Path(target).name)
            quoted = shlex.quote(target)
            script += "\ntest -f " + incoming + "\ntest ! -L " + incoming + "\n"
            script += "test ! -e " + quoted + "\ntest ! -L " + quoted + "\n"
            script += "cp " + incoming + " " + quoted + "\nchmod 644 " + quoted + "\n"
            script += '[ "$(sha256sum ' + quoted + " | cut -d ' ' -f 1)\" = " + sha(source) + " ]\n"
            script += "rm -f " + incoming + "\n"
        script += "rmdir " + STAGE + "/upload\n"
        script += "/usr/bin/dotnet " + STAGE + "/NamespaceRootProbe.dll\n"
        output, capture = session.capture(script, mode.lower(), timeout=45)
        (folder / "capture-path.txt").write_text(str(capture) + "\n")
        check_result(mode, output)
        session.capture(GUARD + QUIET + "\nprintf 'GLOBAL_AUTH=unchanged\\n'\n", "postflight")
        print(output, flush=True)
        if mode == "BACKUP":
            for name in ("app-context-original.db", "app-context-original.sha256"):
                session.pull(STAGE + "/" + name, folder / name)
            digest = (folder / "app-context-original.sha256").read_text().strip()
            if not re.fullmatch("[a-f0-9]{64}", digest) or digest != sha(folder / "app-context-original.db"):
                raise ValueError("Transferred backup checksum mismatch")
            if output.splitlines().count("BACKUP_SHA256=" + digest) != 1:
                raise ValueError("Backup checksum differs from successful helper result")
            inspect_db(folder / "app-context-original.db")
            smack = [line.split("=", 1)[1] for line in output.splitlines() if line.startswith("SOURCE_SMACK64=")]
            if len(smack) != 1:
                raise ValueError("Missing original security metadata")
            metadata = {"sha256": digest, "device_id_sha256": hashlib.sha256(session.expected.encode()).hexdigest(),
                        "firmware": FIRMWARE, "source_uid": 0, "source_gid": 0, "source_mode": "644",
                        "source_smack": smack[0], "scope": "routing SQLite only, not firmware/accounts"}
            (folder / "verified.json").write_text(json.dumps(metadata, indent=2) + "\n")
            verify_backup(folder, session.expected)
            print("Verified routing backup:", folder, flush=True)
        if mode in ("APPLY", "RESTORE"):
            # Notification acceptance is not a physical Home or boot test.
            readback(session, folder, backup, mode, output)
        known = list(artifacts.values()) + [STAGE + "/passwd-view"]
        if mode == "BACKUP":
            known += [STAGE + "/app-context-original.db", STAGE + "/app-context-original.sha256"]
        if mode in ("APPLY", "RESTORE"):
            known += [STAGE + "/app-context-observed.db"]
        cleanup = GUARD + QUIET + "\n"
        for name in ("app-context-original.db-journal", "app-context-observed.db-journal"):
            cleanup += cleanup_journal(STAGE + "/" + name)
        for file in known:
            cleanup += "rm -f " + shlex.quote(file) + "\n"
        cleanup += "rmdir " + STAGE + " " + REMOTE + "on-demand\nprintf 'STAGING=removed\\n'\n"
        session.capture(cleanup, "cleanup")
        (folder / "complete.txt").write_text(mode + ": helper, global auth, readback/backup and cleanup verified\n")
        print(mode + " completed with verified cleanup. Physical Home/CEC still require hardware observation.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("identity", "backup", "apply", "restore"))
    parser.add_argument("--host", required=True)
    parser.add_argument("--backup", type=Path)
    args = parser.parse_args()
    execute(args.mode.upper(), args.host, args.backup.resolve() if args.backup else None)
