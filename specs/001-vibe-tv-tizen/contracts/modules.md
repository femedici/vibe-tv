# Module contracts

Browser globals and CommonJS exports for tests. ES2015 supported by Chromium 76; no optional chaining.

## VibeState (`tizen/state.js`)
- `catalog`: array of defaults `{id,name,kind,aliases}`. IDs in order `youtube,ps5,netflix,prime,max,samsung,disney,spotify`. `ps5.kind=input`, `ps5.input=2`; others kind app. Aliases normalize installed names, not guessed application IDs.
- `themes`: array `dark,light,gray,pastel,wine`.
- `defaults()` -> fresh `{version:1,theme:'dark',order:[ids],custom:[],last:null}`.
- `items(state)` -> ordered default/custom item objects.
- `load(storage)` -> valid state or safe defaults; storage key `vibe-tv.preferences.v1`.
- `save(storage,state)` -> boolean success, catches failures.
- `setTheme(state,theme)`, `move(state,id,delta)`, `add(state,item)`, `remove(state,id)`, `recordLaunch(state,id,time)` -> new sanitized state, no mutation. Invalid arguments return equivalent state safely.
- Custom item `{id:'app:'+appId,name,kind:'app',appId,iconPath?}`; cap textual input and reject duplicate targets. Removed defaults can be re-added using `add(state,catalogItem)`.
- `last` is null or `{id,at}`. Only UI calls recordLaunch after platform Promise success. Removing an item clears last if it matches; no invented default recent.

## VibePlatform (`tizen/platform.js`)
- `create(tizenApi)` -> `{native:boolean,listApps(),launchApp(appId),launchInput(number),exit()}`.
- `listApps()` -> Promise of sanitized `{id,name,iconPath}` from getAppsInfo; no fixtures. No API: reject readable error.
- `launchApp(appId)` -> resolves only success callback from application.launch. Input validation, exceptions and bounded timeout reject.
- `launchInput(2)` -> enumerate VIDEOSOURCE, use the unique actual HDMI 2 object across connected/disconnected (absent/unknown signal allowed), setSource(source,...,'MAIN'), then launch documented `org.tizen.tv-viewer`. Reject missing/ambiguous sources and each API failure with stage context; no claim of success if viewer fails after source changed, and no claim of CEC wake from the source callback alone.
- `exit()` -> explicitly invokes current application's exit; no system app kill or reset.
- No pairing, tokens, ADB, filesystem outside own app, fetch or device network code. Tizen privileges public only.

## UI
- Uses actual inventory, exact normalized alias matching; zero/multiple candidates remain unavailable rather than guessing.
- Browser preview cannot launch TV apps. Inspecting artwork must not update last launch.
- Reorder/add/remove controls use state module; error toast uses role=status and does not silently mutate recent state.
- Native settings guidance refers to Samsung remote/Home, no invented settings package ID.
- External Home/Power/Volume keys never consumed.
