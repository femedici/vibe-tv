# Data model

Preferences follow contracts/modules.md. Only order, custom favorites, theme and last successful launch are persisted. Default catalog is local; native app identity is resolved from current inventory. Unknown data is sanitized on load; corrupt storage falls back without throwing. Never store provider credentials, viewing progress, device serial, network tokens or TV settings. State functions return new objects; platform success precedes recordLaunch. Availability is live and never persisted as proof of installation.
