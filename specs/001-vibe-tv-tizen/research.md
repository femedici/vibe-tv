# Platform research and approved decisions

2026-10-19. The owner and read-only LAN metadata identify Samsung UN50AU8000GXZD, Tizen. No device modification was performed. Network identifiers/serial are deliberately excluded.

## Platform
Decision: separate Tizen Web app, local preview using same source. The upstream Android APK cannot run on Tizen; its own README recommends an HDMI Google TV streamer for Samsung. Owner chose Tizen app and then approved local development, with install blocked.
Sources: https://github.com/simbasjungles/free-my-tv#any-tv ; https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html
2021 TVs use Tizen 6.0 / Chromium 76. Browser preview lacks Tizen APIs: https://developer.samsung.com/smarttv/develop/faq/user-interaction.html

## Apps and history
Use public installed-app inventory and launch callbacks. App IDs must come from the device, not catalog guesses. Last access only includes successful Vibe launches. Usage history is not a public TV continue-watching API; provider private data is unavailable.
Source: https://github.com/Samsung/tizen-docs/blob/master/docs/application/web/api/6.0/device_api/tv/tizen/application.html

## HDMI
Enumerate VIDEOSOURCE, match HDMI number 2, call tvwindow.setSource and launch documented org.tizen.tv-viewer. This is an implementation candidate needing hardware validation, especially HDR/Game Mode/latency. Do not equate PiP playback with native gaming.
Sources: https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/systeminfo-api.html ; https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/tvwindow-api.html ; https://developer.samsung.com/smarttv/develop/faq/other-features.html

## Startup and remote
Home/Power/Volume stay native. Set directional/Enter/Back handling only. Autorun Last App is a user setting and depends on app/model; it does not pin Vibe as Home. Prelaunch is unsupported since 2019. No background watcher.
Sources: https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html ; https://www.samsung.com/au/support/tv-audio-video/use-autorun-start-screen-options-on-your-samsung-tv/ ; https://developer.samsung.com/smarttv/develop/guides/fundamentals/prelaunching-applications.html

## Backup and safety
No full backup was obtained. Samsung Cloud settings backup does not establish firmware/private session recovery. Smart Hub reset signs users out. Upstream HomeMode saves launcher/screensaver references and disabled packages, not full firmware/accounts; applyOriginal deletes screensaver_components rather than restoring exact prior selection, and re-enables packages without original enabled state. Therefore no upstream installer or switch is run.
Sources: https://www.samsung.com/ae/support/tv-audio-video/how-can-i-manage-a-samsung-account-on-my-tv/ ; https://www.samsung.com/au/support/tv-audio-video/reset-smart-hub-samsung-tv/ ; https://www.samsung.com/br/support/model/UN50AU8000GXZD/

## Alternatives
Android streamer runs the original app but needs separate service sign-ins and does not automatically control Samsung HDMI/settings. Firmware/ISO replacement conflicts with preservation and lacks a verified recovery path. Neither was selected.

## Physical installation follow-up
The owner accepted the documented factory reset fallback after the Samsung model manual was checked (settings backup p45; TV reset p130; Smart Hub account removal p183), then explicitly authorized installing the separate app. No full backup exists and reset does not guarantee recovering sessions or earlier firmware. See docs/vibe-tv/recovery.md.

Official Tizen VS Code extension 10.4.3 was installed on the Mac. Its local engine selected the official darwin-arm64 server 10.4.5. The existing web source passed the independent package/API review; the unsigned archive must still be signed with a Samsung author/distributor profile valid for the actual TV. Device Developer Mode and Samsung authentication require owner participation.

## Refinement / device evidence 2026-10-20
Certificate profile was successfully created on the second authentication attempt (the first timed out waiting for the local callback). Versions 1.0.0, 1.0.1 and 1.0.2 were signed/installed/launched. The current new CLI attempts uninstall before install: use the documented Samsung/Wits push + vd_appinstall sequence for updates, without the Wits full-start uninstall step. Source: https://github.com/Samsung/Wits/blob/c18cf03eced66aa66c3603c94fccf4c14d193f00/lib/appLaunchHelper.js

The TV's LAN address changed; read-only SSDP rediscovered the exact model and SDB reconnected. Existing registration still appeared after the owner reported removing Vibe. Device Web Inspector proved getAppsInfo and its paths work, but known square icons are too small for the requested wide artwork and Prime points to a missing file. Use bundled official logos/art for known brands, native icons for extra apps, correct aspect ratios and neutral failure fallback. The 1.0.2 runtime uses a single actionable last-app card and avoids unnecessary shelf reconstruction.

Both X references were inspected in the browser. Android CATEGORY_HOME / set-home-activity do not exist as public WGT launcher selection on this Samsung. TMDB trending/discover in the upstream is not the user's private viewing history. Official Home requirement: https://developer.samsung.com/smarttv/develop/development-checklist/common.html . Startup remains the conditional Samsung Autorun Last App setting, already enabled by the owner but not yet verified with Vibe on a cold start.

## Second-opening report after 1.0.3
Owner accepted direction/focus changes, then reported YouTube opened once but not again. No native error or failing state captured yet. Fresh diagnostic instance reported version 1.0.3, no busy element and empty toast; Inspector later disconnected, which alone does not prove app termination or successful navigation. application.launch is not documented as single-use. Samsung FAQ Q22 requires background-support="disable" for TV; hidden apps are paused automatically, so changing this manifest setting is not a justified fix. Sources: https://developer.samsung.com/smarttv/develop/faq/other-features.html and https://developer.samsung.com/smarttv/develop/guides/fundamentals/multitasking.html . Preserve existing API/settings until T016 has runtime evidence.
