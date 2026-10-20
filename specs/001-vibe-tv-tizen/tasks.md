# Tasks: Vibe TV Tizen

Single authoritative tracker. Coordinator alone updates status after inspecting diffs and fresh checks.

## Phase 1: Setup
- [x] T001 Establish approved spec, research and module contracts in `specs/001-vibe-tv-tizen/` and `.specify/`.
  - status: done; owner: root; dependencies: none; acceptance: local-only scope and backup barrier recorded; verification: resolved Spec Kit templates, user approvals, spec checklist 7/7, consistency inspection; next: parallel implementation.

## Phase 2: Foundations and personal preferences (US1/US2/US3)
- [x] T002 [P] [US1] Implement validated state/history/favorites/themes with RED/GREEN tests in `tizen/state.js`, `tests/state.test.cjs`.
  - status: done; owner: audit_platform_recovery; dependencies: T001; acceptance: exact initial order, safe persistence, reorder/add/remove, only explicit success history, corrupt/blocked storage safe; verification: coordinator reviewed full diff and ran 13/13 state tests after merge (32/32 combined); blockers: none; next: integrated UI verification.
- [x] T003 [P] [US4] Implement public Tizen boundaries and tests in `tizen/platform.js`, `tizen/config.xml`, `tests/platform.test.cjs`.
  - status: done; owner: audit_ui_capabilities; dependencies: T001; acceptance: real inventory/IDs, error/timeout propagation, exact HDMI2, native viewer, preview rejects, no resets/account access; verification: coordinator reviewed full diff and ran 17/17 platform tests after merge (32/32 combined); blockers: hardware verification deferred to T009; next: integrated UI verification.

## Phase 3: TV interface (US1/US2/US3)
- [x] T004 [P] [US2] Build cinematic remote-friendly hub in `tizen/index.html`, `tizen/styles.css`, `tizen/app.js`, `tizen/navigation.js`, `tizen/assets/`, `tests/navigation.test.cjs`.
  - status: done; owner: tv_interface; dependencies: T001 (module contracts); acceptance: all requested shortcuts/PS5 art/themes; explicit empty state/preview; reordering/add/remove; semantic focus, Back and narrow layout; verification: coordinator reviewed full code; navigation 6/6 and live Edge keyboard/pointer/persistence checks passed; blockers: none; next: delivered local phase.

## Phase 4: Tooling and preservation documentation (US4)
- [x] T005 [P] [US4] Add local server, unsigned package validation and safety documentation in `tools/preview.cjs`, `tools/package-tizen.cjs`, `tests/tooling.test.cjs`, `README.md`, `docs/vibe-tv/`.
  - status: done; owner: root; dependencies: T001; acceptance: loopback local preview, scoped unsigned artifact, no automatic installation, explicit backup/settings/session limitations and licensing; verification: tooling 2/2; actual unsigned WGT 13 files, unzip integrity passed; independent review clean; blockers: none; next: delivered local phase.

## Phase 5: Integration and delivery
- [x] T006 Integrate each task branch and verify all local workflows; save actual captures in `outputs/` and evidence in `docs/vibe-tv/validation.md`.
  - status: done; owner: root; dependencies: T002,T003,T004,T005; acceptance: tests/package pass, keyboard and pointer flows, five themes, reload, no fake launches, desktop and narrow screenshots; verification: 38/38 tests, syntax/XML/hash checks, live Edge at 1920x1080/390x844, five themes/reload/edit/empty/overflow and isolated simulated callbacks; screenshots saved; blockers: physical checks T009; next: final review.
- [x] T007 Independently review/converge implementation against spec in `specs/001-vibe-tv-tizen/` and remediate verified gaps.
  - status: done; owner: root + independent reviewer; dependencies: T006; acceptance: no unresolved local-scope correctness findings, device limits explicitly retained; verification: independent review fixes T010/T011 accepted; fresh 38/38 tests; spec/plan/constitution comparison has no open local implementation gaps; blockers: T009 remains separate; next: T008 publication.
- [x] T008 Publish reviewed task branch and complete `outputs/HANDOFF.md` with evidence and local run instructions.
  - status: done; owner: root; dependencies: T007; acceptance: no secrets/serial in tracked files, handoff accurate, commit and push verified, local preview running; verification: diff/privacy checks passed; source commit 5beaa78321e959cc205417774c797eb4e85e532a pushed and remote SHA matched; handoff and screenshots present; preview active; blockers: none for local phase; next: hardware remains T009 blocked.

## Phase 6: Physical TV (original goal, explicitly blocked)
- [ ] T009 Validate backup/recovery, authorize installation, then verify physical TV integrations and startup.
  - status: blocked; owner: root + user; dependencies: T008 plus backup prerequisite; scope: physical Samsung TV; acceptance: genuinely restorable backup or explicit revised requirement, signed WGT, real apps/sessions/HDMI/remote/boot/recovery; verification: hardware checklist in docs/vibe-tv/; blocker: no integral backup or service-session restore path verified; next: user recovery decision, then necessary SDK/certificate/device approvals. Do not execute in this phase.

## Dependencies and execution
T001 -> {T002,T003,T004,T005} -> T006 -> T007 -> T008. T009 is independently gated by recovery/installation authorization. T002/T003/T004 use isolated writer worktrees from the same committed base; T005 stays with coordinator. No parallel edits to shared files. UI uses the committed contracts, not another agent's uncommitted code.

## Requirement coverage
T001/T008: FR001. T002/T004: FR003-005,FR008,FR015. T003/T004: FR002,FR006-007,FR009-011. T005/T009: FR012,FR014,FR016. T006/T007/T008: FR013 and SC001-006. T009 preserves unmet original hardware requirements.

## Phase 7: Review remediation
- [x] T010 Distinguish HDMI favorites from installed apps when deduplicating additions (FR-005/FR-006).
  - status: done; owner: root; dependencies: T004; files: tizen/navigation.js, tests/navigation.test.cjs; acceptance: a real app named PlayStation 5 remains addable while HDMI2 exists; verification: RED 5/6 then GREEN 6/6; browser fixture confirms same-name app remains addable and default YouTube is not duplicated; blocker: none; next: final review.
- [x] T011 Preserve keyboard focus after a successful app launch (FR-009 / US3 AC2).
  - status: done; owner: root; dependencies: T006; files: tizen/app.js; acceptance: success updates hero and leaves a usable focused favorite; verification: browser RED focus became body; GREEN focused favorite-youtube/favorite-ps5 after success with preserved history; blocker: none; next: final review.
