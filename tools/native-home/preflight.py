"""Exact AU8000 read-only diagnostics via one staged SDK shell script."""
import argparse
from pathlib import Path
from transport import Session

SCRIPT=r'''set -eu
[ "$(id -u)" = 901 ]
grep -qx 'Version=T-NKLAUABC-2310.0;' /etc/prd_info.ini
[ "$(uname -m)" = armv7l ]
[ "$(sha256sum /usr/bin/dotnet | cut -d ' ' -f 1)" = d2a35114d788c22d22d329acdb2f379c17b75b7099997fb8252cbd6dd940702e ]
[ "$(sha256sum /usr/sbin/sdbd-tarlauncher | cut -d ' ' -f 1)" = 3580e6dcf5d9c6d5d0a606d43a3d878641f35eeac07317a405fb45bbed69a653 ]
id
printf 'PROCESS_CONTEXT\n'
grep -E '^(Uid|Gid|Cap|Seccomp)' /proc/self/status
cat /proc/self/attr/current
printf '\nRUNTIME\n'
ls -d /usr/share/dotnet/shared/Microsoft.NETCore.App/*
printf 'FILE_CAPABILITIES\n'
if command -v getcap >/dev/null 2>&1; then getcap /usr/bin/dotnet /usr/sbin/sdbd-tarlauncher; fi
printf 'DB_METADATA\n'
stat -c '%u %g %a %n' /opt/dbspace/.app-context.db /etc/passwd /usr/share/sdbd/public.pem
if command -v getfattr >/dev/null 2>&1; then getfattr -n security.SMACK64 /opt/dbspace/.app-context.db; getfattr -n security.capability -e hex /usr/bin/dotnet /usr/sbin/sdbd-tarlauncher; fi
printf 'ORIGINAL_HASHES\n'
sha256sum /etc/passwd /usr/share/sdbd/public.pem
printf 'OWNER_RECORD\n'
awk -F: '$1=="owner" {print $1,$3,$4;count++} END {if(count!=1)exit 1}' /etc/passwd
printf 'STAGING\n'
test ! -e /home/owner/share/tmp/sdk_tools/vibe-home-proof
test ! -e /home/owner/share/tmp/sdk_tools/on-demand
printf 'PREFLIGHT_DONE\n'
'''
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--host',required=True);args=parser.parse_args()
    private=Path(__file__).resolve().parents[2]/'.dev/native-home'
    output,folder=Session(args.host,private).capture(SCRIPT,'preflight')
    print(output);print('Private evidence:',folder)
