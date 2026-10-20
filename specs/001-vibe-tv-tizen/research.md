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
