# Local validation

Requires Node 22+; no npm install. Run `node --test tests/*.test.cjs`, then `node tools/package-tizen.cjs` to validate/package local source. The result is unsigned and cannot establish TV installation.

Run `node tools/preview.cjs`, open http://127.0.0.1:4173. Confirm preview label, empty history, eight defaults, arrow/Enter/Back controls, themes, reordering/removal/addition of known defaults, reload persistence and honest unavailable launch messages. Capture dark/light/PS5/preferences and narrow layout. Native added apps can only be enumerated on Tizen; local preview must not invent inventory.

Hardware tests are blocked pending recovery decision, developer-mode/certificate setup and explicit install authorization. Later test inventory, each service session, real HDMI2/PS5 video, Home/Volume/Power, cold start, storage and removal of only Vibe. Never reset Smart Hub or clear apps as a test.
