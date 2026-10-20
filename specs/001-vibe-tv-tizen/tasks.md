# Tasks: Vibe TV Tizen

Single authoritative tracker. Coordinator alone updates status after inspecting diffs and fresh checks.

## Phase 1: Setup
- [x] T001 Establish approved spec, research and module contracts in `specs/001-vibe-tv-tizen/` and `.specify/`.
  - status: done; owner: root; dependencies: none; acceptance: local-only scope and backup barrier recorded; verification: resolved Spec Kit templates, user approvals, spec checklist 7/7, consistency inspection; next: parallel implementation.

## Phase 2: Foundations and personal preferences (US1/US2/US3)
- [ ] T002 [P] [US1] Implement validated state/history/favorites/themes with RED/GREEN tests in `tizen/state.js`, `tests/state.test.cjs`.
  - status: in_progress; owner: audit_platform_recovery; dependencies: T001; acceptance: exact initial order, safe persistence, reorder/add/remove, only explicit success history, corrupt/blocked storage safe; verification: node --test tests/state.test.cjs; blockers: none; next: implement contract.
- [ ] T003 [P] [US4] Implement public Tizen boundaries and tests in `tizen/platform.js`, `tizen/config.xml`, `tests/platform.test.cjs`.
  - status: in_progress; owner: audit_ui_capabilities; dependencies: T001; acceptance: real inventory/IDs, error/timeout propagation, exact HDMI2, native viewer, preview rejects, no resets/account access; verification: node --test tests/platform.test.cjs; blockers: hardware verification deferred to T009; next: implement contract.

## Phase 3: TV interface (US1/US2/US3)
- [ ] T004 [P] [US2] Build cinematic remote-friendly hub in `tizen/index.html`, `tizen/styles.css`, `tizen/app.js`, `tizen/navigation.js`, `tizen/assets/`, `tests/navigation.test.cjs`.
  - status: in_progress; owner: tv_interface; dependencies: T001 (module contracts); acceptance: all requested shortcuts/PS5 art/themes; explicit empty state/preview; reordering/add/remove; semantic focus, Back and narrow layout; verification: node --test tests/navigation.test.cjs then live browser integration; blockers: none; next: implement against contracts, coordinator integrates T002/T003 before browser validation.

## Phase 4: Tooling and preservation documentation (US4)
- [ ] T005 [P] [US4] Add local server, unsigned package validation and safety documentation in `tools/preview.cjs`, `tools/package-tizen.cjs`, `tests/tooling.test.cjs`, `README.md`, `docs/vibe-tv/`.
  - status: in_progress; owner: root; dependencies: T001; acceptance: loopback local preview, scoped unsigned artifact, no automatic installation, explicit backup/settings/session limitations and licensing; verification: node --test tests/tooling.test.cjs, package inspection; blockers: none; next: implement tooling and docs.

## Phase 5: Integration and delivery
- [ ] T006 Integrate each task branch and verify all local workflows; save actual captures in `outputs/` and evidence in `docs/vibe-tv/validation.md`.
  - status: pending; owner: root; dependencies: T002,T003,T004,T005; acceptance: tests/package pass, keyboard and pointer flows, five themes, reload, no fake launches, desktop and narrow screenshots; verification: node --test tests/*.test.cjs, live browser; blockers: none; next: await implementations.
- [ ] T007 Independently review/converge implementation against spec in `specs/001-vibe-tv-tizen/` and remediate verified gaps.
  - status: pending; owner: root + independent reviewer; dependencies: T006; acceptance: no unresolved local-scope correctness findings, device limits explicitly retained; verification: diff review, spec/plan/tasks/code comparison, relevant rechecks; blockers: none; next: review integrated build.
- [ ] T008 Publish reviewed task branch and complete `outputs/HANDOFF.md` with evidence and local run instructions.
  - status: pending; owner: root; dependencies: T007; acceptance: no secrets/serial in tracked files, handoff accurate, commit and push verified, local preview running; verification: git diff --check, git status, git ls-remote comparison; blockers: none; next: deliver local phase.

## Phase 6: Physical TV (original goal, explicitly blocked)
- [ ] T009 Validate backup/recovery, authorize installation, then verify physical TV integrations and startup.
  - status: blocked; owner: root + user; dependencies: T008 plus backup prerequisite; scope: physical Samsung TV; acceptance: genuinely restorable backup or explicit revised requirement, signed WGT, real apps/sessions/HDMI/remote/boot/recovery; verification: hardware checklist in docs/vibe-tv/; blocker: no integral backup or service-session restore path verified; next: user recovery decision, then necessary SDK/certificate/device approvals. Do not execute in this phase.

## Dependencies and execution
T001 -> {T002,T003,T004,T005} -> T006 -> T007 -> T008. T009 is independently gated by recovery/installation authorization. T002/T003/T004 use isolated writer worktrees from the same committed base; T005 stays with coordinator. No parallel edits to shared files. UI uses the committed contracts, not another agent's uncommitted code.

## Requirement coverage
T001/T008: FR001. T002/T004: FR003-005,FR008,FR015. T003/T004: FR002,FR006-007,FR009-011. T005/T009: FR012,FR014,FR016. T006/T007/T008: FR013 and SC001-006. T009 preserves unmet original hardware requirements.
