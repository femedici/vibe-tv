# Feature Specification: Vibe TV para Samsung Tizen

**Feature Branch**: `agent/vibe-tv-cleanframe`
**Created**: 2026-10-19
**Status**: CleanFrame-style 1.1.0 installed/launched; native short-Home route applied; consistent backup, apply, restore and reapply verified; physical Home/PS5 wake/startup pending.
**Input**: Clone free-my-tv into femedici/vibe-tv, rebuild the TV hub around the last accessed app, preserve all settings and logins, PS5 HDMI 2 artwork, editable favorite order and themes, document, capture and publish.

## Clarifications
### Session 2026-10-19
- User chose Spec Kit and explicitly authorized initialization of v1.0.3.
- TV model confirmed by user and read-only LAN identification: Samsung UN50AU8000GXZD, Tizen.
- User chose investigation of a separate Tizen app preserving Smart Hub and existing applications instead of an Android streamer.
- Initially, user approved developing and testing locally: last access recorded through Vibe TV, requested favorites/PS5/themes, actual resume only with proven integration; TV installation was then blocked by the backup requirement.
- Subsequent decision: user accepted documented factory reset instead of an integral backup, after receiving the settings/login/firmware limitations, then explicitly requested installation on the TV.
- No factory-system or session backup has been created. Standalone Vibe TV installation and necessary developer connection are authorized; reset, firmware changes, credential extraction and replacement of Smart Hub remain outside execution scope.
- After the first installation, owner confirmed correct rendering, requested actual installed-app icons (except PS5), and asked to replace the system. Investigate supported startup/launcher options separately; no unreviewed firmware/root procedure is authorized. Native shortcuts must keep opening the existing apps and preserve their sessions.

## User Scenarios & Testing
### Refinement 2026-10-20
- Owner requested the best supported native-style experience if global Home replacement is unavailable. References are the Android launchers shown by SimbasJungles and gathint on X.
- The main screen becomes one large rectangular, directly actionable last-app card above app tiles. Remove “Sua TV. Do seu jeito.”, “Escolher um app”, descriptive marketing and technical explanations from the main screen. Keep limitations in Ajustes.
- Before any successful launch, show the first favorite as a shortcut labeled “Acesso rápido”; never call it a previous access.
- Show original local brand assets without stretching. Device inspection found low-resolution square icons (several 117×117) and a missing Prime icon, so use bundled official artwork for the known brands. Unknown apps use their installed icon, or a neutral app symbol and their real name if unavailable.
- Recent video/episode art is allowed only with a proven authorized provider integration. None exists currently; use app artwork without representing it as watched content.
- Keep supplied PS5 art, native launch APIs, preferences and five themes. Avoid rebuilding the app shelf on launch/theme changes or an unchanged inventory.

### User Story 1 - Return to my last app (Priority: P1)
As the TV owner I want the largest area to show the last app successfully opened through Vibe TV with relevant artwork and an honest available action.
**Why this priority**: Replaces irrelevant recommendations with personal navigation.
**Independent Test**: Successful launch records the item; failure does not; reopen preserves it. Browser preview identifies unavailable TV actions.
**Acceptance Scenarios**:
1. Given a successful app launch, when I return, then its identity/art is the primary hero and I can reopen it.
2. Given no launches, when I open Vibe TV, then I see an explicit empty-history state without fictional viewing history.
3. Given an unavailable provider integration, then episode resume/progress is not fabricated; opening the existing application remains the supported action.

### User Story 2 - Arrange apps and PS5 (Priority: P1)
I want favorites in the requested order, remote-accessible rearrangement, addition/removal, and my PS5 artwork on HDMI 2.
**Why this priority**: Makes the hub useful for the owner's existing setup.
**Independent Test**: Reorder, remove and add an item; reload and verify order. PS5 uses supplied art and selects only the actual HDMI 2 object enumerated by the TV, including without an active video signal.
**Acceptance Scenarios**:
1. First run order: YouTube, PS5, Netflix, Prime Video, HBO Max, Samsung TV Plus, Disney+, Spotify.
2. Reordering persists and every item remains reachable with directional navigation, including when overflowing the row.
3. Adding an installed app uses its actual identity. Unknown/unavailable apps are never claimed installed.
4. PS5 uses the supplied transparent logo and background; HDMI selection failure is visible and does not record a successful launch.

### User Story 3 - Choose a comfortable theme (Priority: P2)
I want light, dark, medium gray, pastel and wine skins with readable focus and smooth restrained transitions.
**Independent Test**: Select every theme, reload and verify persistence and remote navigation.
**Acceptance Scenarios**:
1. Theme selection updates the whole hub and persists after reload.
2. Keyboard/remote focus is visible across skins; reduced-motion preference suppresses transitions.
3. Main hub and controls remain usable in TV landscape and a narrow local preview.

### User Story 4 - Preserve my television and know what is tested (Priority: P1)
I want existing apps, sessions and factory controls preserved, and an accurate record of local versus hardware validation.
**Independent Test**: Inspect behavior/configuration and documentation for zero system resets, disable commands or credential handling; verify local preview cannot send device commands.
**Acceptance Scenarios**:
1. Power/Volume remain system-owned. Only short Home may use the separately authorized exact-device route. Preserve Smart Hub and expose its settings destination from Vibe; physical access must be verified.
2. Local preview has an explicit preview label; clicks cannot claim real TV launch success.
3. Build/package output is clearly an unsigned local artifact when no certificate exists; no install script runs automatically.
4. Documentation states startup, provider resume, physical HDMI performance, sessions and recovery are unverified until hardware checks.

### Edge Cases
- Missing or removed app, ambiguous app name, unavailable HDMI 2, unknown signal status, API failure/timeout.
- Corrupt or blocked local storage; duplicate favorites; long names; catalog changes; missing logo.
- Reorder at either end, remove selected item, empty favorites, overflowing favorites, returning from background.
- Browser without Tizen APIs, old TV engine, cancellation or failure after source selection.

## Requirements
### Functional Requirements
- **FR-001** Preserve original repository history/license and publish changes on agent/vibe-tv.
- **FR-002** Provide a signed Tizen hub and label local preview. Investigate native Home routing using the CleanFrame/Couchroot references for this exact TV; preserve Smart Hub as a recovery/settings destination. Native Home replacement remains unmet until validated on the physical remote.
- **FR-003** Largest hero reflects the last successful launch through Vibe TV; maintain an honest empty state.
- **FR-004** Use application-relevant art and the two supplied PS5 assets.
- **FR-005** Provide initial order exactly as US2 specifies; support persistent reorder, add and remove.
- **FR-006** Identify installed apps from the TV inventory; prevent ambiguous/unavailable targets from silent substitution.
- **FR-007** Select the unique actual HDMI 2 object enumerated in connected or disconnected sources, including absent/unknown video signal, and then open the native viewer. Expose API errors/timeouts and never substitute another port or invent a source. A successful source selection does not prove PS5 power-on: HDMI-CEC wake must be verified separately on the physical console.
- **FR-008** Offer and persist dark, light, gray, pastel and wine themes.
- **FR-009** Support directional navigation, OK and Back; preserve Power/Volume and long Home; short Home follows FR-002. Down from the large card must go directly to the first app. Organize/Add/Appearance/Settings stay in the upper right, above the card. Focus highlights the item itself with a restrained 150 ms transform/opacity transition, without an external rectangular outline; reduced motion disables the transition.
- **FR-010** Display unavailable integrations honestly; never fabricate episode names, watch progress or login transfer.
- **FR-011** Preserve system/settings/sessions by avoiding destructive commands and account/token access.
- **FR-012** Honor the revised recovery decision: install the app with a valid Samsung certificate. The separately approved native test may change only short Home after verified identity/backup. Restore and verify the original route before removing Vibe; preserve all other system/apps/accounts. Factory reset is a documented fallback, never an automatic test. Do not claim an integral backup or preserved sessions after reset.
- **FR-013** Provide local run, focused automated checks, responsive checks, reduced-motion handling and screenshots.
- **FR-017** Use bundled original brand artwork for known favorites and accessible installed icons for other apps, preserving aspect ratio and the user's PS5 artwork. Unknown apps with an unavailable icon use a neutral app symbol. Resolve known duplicate app labels using IDs observed on the TV and still present in the inventory; never invent an installed app.
- **FR-014** Document build/package, device prerequisites, recovery limits and hardware test procedure; publish handoff.
- **FR-015** Validate state at storage/inventory boundaries and recover gracefully from failures without losing previous valid state.
- **FR-016** Clearly distinguish Home routing from boot autorun. Routing was applied and its database reversal verified; physical Home and boot remain separate unverified acceptance checks.

### Key Entities
- Favorite: stable identity, display name, kind (application/input), associated art and platform target when verified.
- Preferences: favorite order, added favorites and selected skin.
- Recent access: favorite identity and time of last successful launch through this hub.
- Capability: available, unavailable or unverified platform action with understandable failure.

## Success Criteria
### Measurable Outcomes
- **SC-001** All eight initial favorites appear in the exact requested order and are reachable with directional navigation.
- **SC-002** Reordering, adding/removing favorites and all five theme choices survive reopening.
- **SC-003** Successful launches update the hero; failed/unavailable launches never update viewing history.
- **SC-004** Every advertised local workflow passes its targeted check and has actual interface captures.
- **SC-005** No local preview operation changes the physical TV, and hardware-dependent acceptance items distinguish observed results from remaining unverified checks.
- **SC-006** The task branch contains the reviewed source, documentation, captures and handoff with no secrets or serial number.

## Assumptions
- The local phase is complete. Signed versions 1.0.0–1.0.2 were installed; the owner confirmed corrected artwork and native YouTube opening in 1.0.2. Remaining physical checks are tracked separately.
- The TV's installed-app inventory, exact per-app launch behavior, native HDMI quality, startup and restoration require authorized hardware validation later.
- No provider has supplied an authorized continue-watching integration; the interface offers app opening without fabricated content.
- Full backup/session restoration are not proven. The owner explicitly replaced this prerequisite with documented factory reset as a fallback.

## Verified local implementation

38 automated checks passed, plus live Edge keyboard/pointer, five skins/reload, favorites/empty/overflow and 1920×1080/390×844 checks. A separate explicitly simulated fixture verified successful/failed launch history, exact extra app identity, HDMI2/viewer sequence and exit UI. The production preview never fabricates native capabilities. See `docs/vibe-tv/validation.md` for evidence and `tasks.md` for publication/hardware state. Physical installation, native inventory, artwork and YouTube opening have now been verified; startup, other provider sessions, physical HDMI behavior and full backup remain unverified. Latest focus/layout refinement is tracked in T014/T015.

## Refinement evidence (2026-10-20)
44 automated checks passed. Browser Down from hero reaches the first app; Up returns to hero. Header controls and focus motion checked at 1280×720 and 390×844 plus desktop. Signed 1.0.3 installed by direct update and launched. Owner accepted the latest focus/navigation; owner later reported correct YouTube opening after an earlier second-opening failure; no reproducible cause or code correction was established in T016. See validation.md for exact limits.

## PS5 follow-up (2026-10-20)
Owner requests HDMI 2 selection to wake PS5 as Smart Hub did, and again requests global Home replacement. Actual TV inspection reproduced the Vibe precondition failure with HDMI2 in disconnected and source remaining TV1. Version 1.0.4 removes only that incorrect guard, retains native APIs/error handling, and passes 45 tests. Signed direct update and runtime version confirmed. Physical post-click image and wake await owner confirmation; Inspector disconnection alone is not success evidence. No supported public mechanism for global Home replacement was found in Samsung documentation; that requested outcome remains unmet, not silently removed from scope.

## CleanFrame redesign and native Home investigation (2026-10-20)
- Owner explicitly requests rebuilding from Nathan Clark’s CleanFrame and its native Home method, then chooses **keep the large last-access card with CleanFrame style and adjustments**. This authorizes the visual redesign and compatibility investigation; it does not establish AU8000 root-method compatibility or authorize an unreviewed privilege-escalation script.
- Approved design: retain hero + requested favorite order, PS5 assets, five themes, upper-right controls and successful-launch-only history; adapt CleanFrame’s quiet utilities, dock spacing/materials and restrained focus. Keep native adapter, storage key, signed application identity and installed service sessions. No Frame-only Art Mode, regional sample catalog, private fonts or fictional media history.
- CleanFrame MIT source pinned at fa537d1892b71d2de2bf94c24cbff3812e9f70d5; its Tizen 6.5 manifest and modern CSS cannot be copied blindly into Tizen 6.0/Chromium 76. Preserve asset notices and provenance.
- Actual read-only preflight: AU8000 firmware T-NKLAUABC-2310.0, armv7/Tizen 6.0. Its libaul lacks aul_get_default_app, which CleanFrame’s guarded net6 helper requires. CleanFrame’s reported non-root success concerns a 2024 The Frame, not this TV.
- Couchroot’s QN90A Tizen 6 reference uses different root-assisted database routing. This is evidence to review, not proof for AU8000. No native Home setting, database, privilege or firmware was changed during preflight.
- Earlier public-API findings remain correct but are insufficient to rule out undocumented native routing. Existing requirements saying Home remains system-owned describe the current implementation, not removal of the owner’s replacement goal.

- Subsequent explicit approval: owner authorizes the bounded temporary-root test, identity and consistent backup first, only short-Home change and restore. No firmware, boot relay, other application changes or global authentication-file changes. Abort on guard/backup failure; preserve uncertain outcomes instead of retrying.

- CleanFrame presentation integrated and signed1.1.0 direct update launched. 48 application tests,14 Python transport/routing tests and38 C# assertions passed. UI screenshots are explicitly browser preview/fixture, not TV photos. SDK transfer is owner5001:100 while command execution is901:901; staging accounts for that difference and checks artifacts before root. Actual IDENTITY baseline→root→unmount→global hash checks→cleanup succeeded; no Home routing change during that proof.

- Exact-device result: consistent private routing backup; APPLY→RESTORE→APPLY, post-operation SQLite snapshots match all three tables/rowids, notifications accepted, authentication hashes unchanged and temporary helpers/staging removed. Current short-Home target is Vibe. Physical YouTube→Home question pending; no claim of firmware replacement, complete backup or proven boot/CEC.
