# AU8000 Home routing — offline preparation only

These two transactions adapt Couchroot’s QN90A Home route to the actual Vibe app identity. They are **not installed or executed on the TV**, contain no device transport and are not included in the WGT. No firmware or privilege compatibility is implied by a passing SQL test.

Source: https://github.com/splitcipher/couchroot/tree/83906b468836869933012da03a4018fb339462b3/research/qn90a-home-route
Retain COUCHROOT-LICENSE.txt. Adaptation changes the target from MiniHub001.Hub to VibeTV2026.VibeTV and adds conservative guards against additional Vibe references before unregistering.

`apply.sql` accepts exactly the observed stock Samsung short-Home rule, changes its target/arguments and registers Vibe as managed. It leaves the Samsung registering app, long-Home and all other rows untouched. `restore.sql` requires the exact applied state and refuses unknown dependencies, then restores the original target/arguments and removes only the Vibe registration. On an SQL error the caller MUST roll back/close the connection; do not continue an open failed transaction.

Before actual device use, a separately reviewed exact-model/firmware runner must establish runtime/capability/SMACK prerequisites, verify app availability, obtain a consistent SQLite backup with original permissions/xattrs and backup hashes, and verify the original route. It must notify context-manager after commit, distinguish uncertain notification/rollback from success, and verify state before any retry. A copied live SQLite file is evidence, not a verified recovery backup. No remote runner or root primitive is provided here.

Run the offline tests:

```sh
python3 -m unittest discover -s tests -p native_home_test.py
```

The owner has explicitly approved a bounded temporary-root identity, consistent backup, short-Home and restore test. Execution still requires all exact-device prerequisites and reviewed safeguards. See ../../docs/vibe-tv/cleanframe-home.md for actual findings, proposed scope and unresolved recovery limits.
