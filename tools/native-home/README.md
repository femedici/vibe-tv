# AU8000: bounded native Home test

This is an owner-authorized, unofficial native routing experiment for **UN50AU8000GXZD / T-NKLAUABC-2310.0 / ARM32**. It does not replace firmware. It is outside the WGT and never runs merely by opening Vibe TV. Do not use on another TV or remove the guards.

The regular signed app and this experiment have separate recovery paths. The routing backup covers three SQLite tables, not firmware, settings or streaming logins. A factory reset is not a guaranteed repair for a failed native modification. Restore the original route before uninstalling Vibe.

## Sources

- Couchroot `83906b468836869933012da03a4018fb339462b3`: private mount namespace and guarded QN90A database route. See `COUCHROOT-LICENSE.txt`.
- CleanFrame `fa537d1892b71d2de2bf94c24cbff3812e9f70d5`: bounded SDK callback transport. See `CLEANFRAME-LICENSE.txt`.

The adaptation pins this TV's firmware and executable hashes, checks the actual owner 5001/group100 and separates SDK execution 901 from SDB transfer 5001. It omits block-device access, persistent root services, boot relay, firmware writes and unrelated app changes.

## Sequence and safeguards

The coordinator reviews the source and exact device identity before execution. `run.py` only accepts `identity`, `backup`, `apply`, `restore`; it never retries. A private preexisting device identity in `.dev/native-home/device.json` must match HTTP model, device ID, Developer Mode and this Mac's address. Evidence, disposable signing keys and databases stay in ignored/private `.dev/`.

1. `identity`: SDK-owned staging, pinned binary hashes, disposable key, private namespace, harmless tar member. Baseline owner identity must be correct before the temporary root identity. No database writes.
2. `backup`: SQLite backup API and integrity/schema verification; transfer SHA and device binding verified locally. Source ownership/mode and SMACK are recorded. This is a routing backup only.
3. `apply --backup <private-directory>`: verify original backup and installed Vibe launch. Compile the exact backup SHA into the helper. Compare live schema/rows against the backup inside an immediate transaction; change only short Home and add Vibe to managed apps; notify context-manager. A separate consistent snapshot verifies all three resulting tables and rowids.
4. `restore --backup <private-directory>`: require the exact Vibe route and reject unknown dependent references; restore Samsung short Home and remove only Vibe's managed registration. Notify and verify a consistent snapshot against the original rows.

The live database is never replaced wholesale. Long Home and unrelated rows remain intact. A failed notification attempts a guarded inverse transaction and a newly toggled notification; secondary failures remain uncertain. SQLite locks, backups, root child execution, pipes and callback have deadlines. Any uncertainty requires state inspection before another action.

SDB file-transfer may return exit 0 with `error:`; the transport rejects that. Incoming files briefly use a writable staging subdirectory, then are copied to SDK-owned protected files, checked against local SHA and removed before privilege elevation. Snapshot files are owner 5001:100/mode600 for the actual transfer identity. Before cleanup, no helper may remain active and the original global authentication hashes must match. Only named task artifacts are removed; unexpected files prevent `rmdir` completion.

## Local verification

```sh
python3 -m unittest discover -s tests -p 'native*_test.py'
dotnet run --project tools/native-home/control/selftest/SelfTest.csproj -c Release
```

The C# selftest currently uses macOS's system SQLite. It verifies transactions, conflict/refusal behavior, notification failures and consistent snapshots. It does not simulate ARM privileges or the physical remote.

Local builds use the existing .NET SDK and netcoreapp3.1 reference packages. The TV runtime is already 3.1.3. `HomeMode` is fixed at compilation; APPLY without a 64-digit approved backup SHA is rejected. Do not deploy a test build with a dummy SHA.

See [actual device results and limitations](../../docs/vibe-tv/cleanframe-home.md). A native API or database success is not evidence of physical Home, PS5 wake or startup behavior.
