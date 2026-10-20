# Implementation Plan: Vibe TV Tizen local phase

**Branch**: `agent/vibe-tv` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

## Summary
Build an independent Tizen Web hub and the identical local browser preview, retaining upstream Android code. Use no runtime dependencies or backend. The separate device installation is now authorized; all integrations fail honestly outside Tizen.

## Technical Context
**Language/Version**: HTML/CSS and JavaScript compatible with Chromium 76 (Tizen 6.0); Node 22 built-in tests/tools.
**Primary Dependencies**: browser DOM and Tizen public APIs only; inherited local font/icons.
**Storage**: versioned localStorage for hub preferences, never service credentials.
**Testing**: node --test for state and platform boundaries, package checks, live browser navigation/screenshots.
**Target Platform**: local desktop browser; Samsung AU8000 Tizen 6.0. Signed installation/launch and initial rendering confirmed; integrations/startup still under physical verification.
**Project Type**: packaged TV web application.
**Performance Goals**: responsive remote interaction; animate only transform/opacity, no infinite animation or heavy filters. Actual TV performance requires hardware evidence.
**Constraints**: no optional chaining, modern CSS-only functions without fallback, flex-gap dependency, firmware/ADB mutation, private app tokens, network API or new frameworks.
**Scale/Scope**: one owner, eight initial favorites, expandable favorite shelf, five skins.

## Constitution Check
PASS for the completed local design: side-by-side Tizen approach, no invented content, all requested controls and unresolved requirements documented. Constitution 1.1.0 records the subsequent installation authorization and revised recovery decision. Local demo status remains visible outside Tizen. Immutable upstream history/license retained; all changes on work branch.

## Project Structure
- `tizen/index.html`, `styles.css`, `app.js`: semantic TV UI, remote focus, panels, integration.
- `tizen/state.js`: pure validated preference/history model, UMD export.
- `tizen/platform.js`: public Tizen callback APIs wrapped in bounded Promises, honest browser rejection.
- `tizen/config.xml`: application package metadata and only necessary public privileges.
- `tizen/assets/`: original user-supplied PS5 assets, inherited font and license.
- `tests/state.test.cjs`, `tests/platform.test.cjs`: focused RED/GREEN checks.
- `tools/preview.cjs`, `tools/package-tizen.cjs`: standard-library local server and unsigned archive preparation; no install action.
- `README.md`, `docs/vibe-tv/`: user guide, backup limits, capabilities, validation.
- `outputs/`: real captures and handoff, no credentials/device serial.

## Execution
T001 governance/contracts baseline. T002 state, T003 platform and T004 interface run in isolated worktrees; T005 tooling/docs stays with the coordinator. Tests precede nontrivial logic. T006 integrates each branch separately, reruns checks and validates the live UI/package with screenshots. T007 performs independent review/convergence and remediation. T008 commits, pushes and completes the handoff. T009 prepares the official development tools and Samsung certificate, connects only the identified TV, installs the signed app and validates physical integrations. Developer Mode and Samsung account authentication require owner interaction. Do not update firmware, reset or remove existing applications.

## Complexity Tracking
No runtime dependencies, server-side application, provider integration scaffold or speculative abstraction. The two small modules isolate pure state and actual hardware calls for testing.

## Follow-up after first device launch
T012 initially used sanitized iconPath but the owner reported different icons after 1.0.1. T014 removes approximate logos and bundles original brand artwork for known apps; native inventory icons remain for other apps and PS5 assets are preserved. Real device inspection proved several native icons are 117px squares and Prime’s file is missing. One large actionable card replaces the marketing hero. The first favorite is explicitly labeled quick access until a launch succeeds. The existing renderer skips unchanged shelf/hero data, reducing image churn, and remote movement uses edge distance to reach a wide hero. Focused RED/GREEN and the browser fixture verify navigation, fallback, successful/failed launch history and unchanged DOM before signed update. T013 compares both Android reference projects with official Samsung Home/startup and provider-data boundaries. T015 reviews, documents, captures and commits/pushes the complete branch. Use direct Samsung vd_appinstall for updates; the new tz install wrapper attempts uninstall first and is unsuitable for preserving Vibe preferences.

Owner confirmation on 1.0.2 accepted artwork and native YouTube opening. The 1.0.3 follow-up moves Organize/Add/Themes/Settings to the upper-right header so Down from hero reaches the first app, and replaces external focus outlines with subtle item transform/opacity feedback (150 ms). Browser RED/GREEN covers the actual DOM layout; three small VM tests cover storage-warning and asynchronous-focus regressions. Signed direct update and launch succeeded; other physical checks remain separate.
