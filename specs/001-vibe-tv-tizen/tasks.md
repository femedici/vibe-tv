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
  - status: done; owner: root; dependencies: T007; acceptance: no secrets/serial in tracked files, handoff accurate, commit and push verified, local preview running; verification: diff/privacy checks passed; source commit 5beaa78321e959cc205417774c797eb4e85e532a pushed and remote SHA matched; handoff and screenshots present; preview active; blockers: none for local phase; next: ongoing physical checks in T009; certificate and installation now complete.

## Phase 6: Physical TV (installation now authorized)
- [ ] T009 Validate backup/recovery, authorize installation, then verify physical TV integrations and startup.
  - status: in_progress; owner: root + user; dependencies: T008; scope: physical Samsung TV, signing tools, recovery/spec/docs; acceptance: revised recovery decision recorded, signed WGT installed, real apps/sessions/HDMI/remote/boot checks with honest limits; verification: valid Samsung profile; versions 1.0.0–1.0.3 signed/installed/launched; native inventory and icon paths inspected; owner confirmed 1.0.2 artwork and native YouTube opening; 1.0.3 direct update completed and new process launched; blockers: PS5/video/CEC/performance, other service sessions and startup still unverified; next: collect physical result of 1.0.4 PS5 click; owner subsequently reported correct YouTube opening (T016 retains repeated-cycle check). Owner confirmed selector/direction correct. Official tools: extension 10.4.3, arm64 server 10.4.5, SDB 4.2.36, tz CLI.

## Dependencies and execution
T001 -> {T002,T003,T004,T005} -> T006 -> T007 -> T008. T009 is independently gated by recovery/installation authorization. T002/T003/T004 use isolated writer worktrees from the same committed base; T005 stays with coordinator. No parallel edits to shared files. UI uses the committed contracts, not another agent's uncommitted code.

## Requirement coverage
T001/T008: FR001. T002/T004: FR003-005,FR008,FR015. T003/T004: FR002,FR006-007,FR009-011. T005/T009: FR012,FR014,FR016. T006/T007/T008: FR013 and SC001-006. T009 preserves unmet original hardware requirements.

## Phase 7: Review remediation
- [x] T010 Distinguish HDMI favorites from installed apps when deduplicating additions (FR-005/FR-006).
  - status: done; owner: root; dependencies: T004; files: tizen/navigation.js, tests/navigation.test.cjs; acceptance: a real app named PlayStation 5 remains addable while HDMI2 exists; verification: RED 5/6 then GREEN 6/6; browser fixture confirms same-name app remains addable and default YouTube is not duplicated; blocker: none; next: final review.
- [x] T011 Preserve keyboard focus after a successful app launch (FR-009 / US3 AC2).
  - status: done; owner: root; dependencies: T006; files: tizen/app.js; acceptance: success updates hero and leaves a usable focused favorite; verification: browser RED focus became body; GREEN focused favorite-youtube/favorite-ps5 after success with preserved history; blocker: none; next: final review.

## Phase 8: Owner feedback on the physical TV
- [x] T012 [P] Correct artwork and resolve observed duplicate app labels.
  - status: done; owner: root; dependencies: T009 first launch; files: tizen/app.js, styles.css, state.js, navigation.js, tests/navigation.test.cjs, tests/ui-fixture.cjs; acceptance: original assets for known apps, available native icons for extra apps, neutral fallback, PS5 art preserved, real inventory IDs; verification: actual TV paths/dimensions and missing Prime file inspected; RED/GREEN alias/fallback tests; owner confirmed correct artwork and YouTube launch in 1.0.2; coordinator reviewed diff and 44/44 suite; blockers: none; next: remaining physical services in T009.
- [x] T013 [P] Verify supported Samsung Home/startup alternatives.
  - status: done; owner: audit_platform_recovery (read-only), root integration; dependencies: T009 first launch; scope: official Samsung/Tizen documentation, compatibility/recovery/spec; acceptance: supported versus unavailable behavior distinguished, no firmware/root change; verification: coordinator inspected both X references, upstream CATEGORY_HOME/set-home-activity implementation and official Samsung CO-GE-07/autorun/API sources; owner observed Home still opens Smart Hub; blockers: global launcher replacement unavailable through supported public TV APIs; next: retain supported app and test conditional autorun in T009.

## Phase 9: Native-style refinement requested 2026-10-20
- [x] T014 Simplify the hub and correct artwork, remote navigation and unnecessary redraws.
  - status: done; owner: root; dependencies: T012,T013; files: tizen/index.html, app.js, navigation.js, styles.css, assets/, tests/controller.test.cjs, tests/navigation.test.cjs, tests/ui-fixture.cjs; acceptance: one large last-app card, original artwork with intact proportions, no marketing copy/invented viewing history, top-right controls, Down directly to apps, subtle item focus without external outline; verification: coordinator reviewed all diffs, 44/44 tests, browser RED/GREEN Down→YouTube and Up→hero, five themes, 1280×720/390×844 checks, screenshots, valid signed 1.0.3 installed/launched; blocker: none for implementation, physical feedback tracked T009; next: T015 publication.
- [x] T015 Review, document and publish the refinement; install when the TV responds.
  - status: done; owner: root, independent read-only reviewers; dependencies: T014; files: docs/vibe-tv/, specs/001-vibe-tv-tizen/, outputs/HANDOFF.md, screenshots; acceptance: accurate evidence/Home/provider-history limits, reviewed diff, checks, branch commit/push, installed update; verification: 44/44 tests, syntax/XML/CRC and 20 unchanged runtime files, browser captures, signed 1.0.3 native update/launch, owner accepted navigation/focus; commit 28941a40a781225d6bbf9a21435329c48285110e pushed and remote SHA matched; blocker: none for publication, new YouTube second-opening failure explicitly tracked T016; next: diagnose T016 from runtime evidence.

## Phase 10: Reopening a native app
- [ ] T016 Diagnose and correct YouTube failing on a second opening after returning to Vibe.
  - status: pending; owner: root; dependencies: T014, physical user feedback; files: tizen/app.js, platform.js and focused tests only as diagnosis requires; acceptance: two native open/return/open cycles without stale pending/inventory state; verification: owner now reports “abriu corretamente”; previous failure was not reproduced and no speculative fix was applied; blocker: none currently observed; next: retain repeated-cycle validation under T009; no established root cause or correction to claim.

## Phase 11: PS5 without an active HDMI signal
- [ ] T017 Correct the PS5 shortcut and validate physical HDMI selection and wake separately.
  - status: in_progress; owner: root; dependencies: T014; files: tizen/platform.js, app.js/config.xml version, tests/platform.test.cjs, specs/docs/handoff; acceptance: unique enumerated HDMI2 can reach setSource without video signal; callbacks/errors/timeouts preserved; native viewer opens only after selection; report physical source and CEC wake evidence separately; verification: live TV enumerates HDMI2 in disconnected; original click reproduces unavailable toast and source remains TV; RED 15/18 then GREEN 18/18 platform, full 45/45, independent read-only review clean, simulated UI HDMI2/viewer/hero/focus verified; signed 1.0.4 direct update completed and runtime version confirmed; blocker: Inspector disconnected after physical click, image and CEC wake unconfirmed; next: owner reports visual/power result; do not count disconnect as success.
