# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rob Run Planner (v2): an external, manual-input helper for the game ROB RUN (Kefir, Steam Early Access). It has:
- a progression route planner: tasks › subtasks per wipe, with dependencies, catalog items and validation;
- production timers and calculators for grow tables, contraband repack benches and the chemical lab.

UI text and docs are in Spanish.

**Hard constraint (game EULA + Easy Anti-Cheat):** never read game memory, files, network or screen; never automate input; never modify or touch the game process. All data is typed in by the player or comes from public sources. Any feature must stay "pen and paper" level.

## Layout and architecture

The app has no build step, no runtime dependencies and no backend. It runs from `file://`, from any browser, and inside the WebView2 wrapper. The page loads four classic scripts in order (no ES modules, because `file://` blocks them):

1. **`catalogo.js`** → `globalThis.RR_CATALOG`. This is the single source of game data:
   - `items`: research/buy cost, `tier`, `requires`, `effect: {speed|freeze|slots}`, `unique`;
   - `defaults` (production values), `notoriety` (Fence/Smuggler bonus by level), `limits`, `bases` (workbench slots), and `SOURCES`.
   - Every value carries `conf` (`confirmado`/`una-fuente`/`discrepancia`/`jugador`/`estimado`/`pendiente`), `src` and optionally `alt`. The research behind it and the update procedure are in `DATOS.md`.
2. **`core.js`** → `globalThis.RR` (also `module.exports` for node). It holds all logic and is pure (no DOM):
   - **Schema and normalization:** `normState`/`normRoute`/`normStep`/`normStation`/`normFarm`. These never throw and clamp, sanitize, dedupe ids and drop broken refs.
   - **Migration:** `migrate(raw, bundled)` upgrades v1 (no `schema`) and v2 to `SCHEMA = 3`.
   - **Farm per route (profile):** `S.farm` is always the active route's farm, so all farm code just uses `S.farm`. Other routes' farms live in `S.farms[routeId]`, and `S.farmOf === S.cur`. `syncFarm(S)` swaps them and must run after anything that changes `S.cur` (the route ops and `syncIncluded` already do; `normState` does it too). Deleting a route drops its farm; duplicating copies it with timers stopped; a new wipe starts empty. `timerList(S)` covers every farm.
   - **Step status:** `statuses()`/`baseStatus()`. For non-plant steps, `done` is only the *manual* flag; completion by target or subtasks is computed. The rules are documented in the comment above `plantCount`.
   - **Validation:** `validateRoute(route, farm)` and `validateFarm(farm)` return `{level: error|warn|info, code, msg, stepId|stationId, fix}`.
     - Errors are demonstrably impossible states: dependency cycle; a dependency or *confirmed* catalog requirement placed later in the route; a *confirmed* game limit exceeded.
     - Unconfirmed data only ever yields warnings.
     - An item with `tier > 1` implicitly requires `land_title_<tier>`.
   - **Mutations:** `ops.*` (and `ops.applyFix(fix)`) are the only mutation functions.
   - **Calculations:** `calc(station, farm)`, `investment`, `upgradeOptions`, `stationComparison`, `routeSummary`, `bottlenecks`.
   - **Import and export:** `parseImport` (never throws; routes with errors come back as `draft`) and `exportRoute`.
   - **Bundled routes:** `syncIncluded`/`addIncludedVersion`, keyed by stable `id` + `version`; a newer version is added as a separate route, never overwriting.
   - **`checkInvariants(S)`:** used by tests and on load.
3. **`iconos.js`** → `globalThis.RR_ICONS`: our own SVG icons (not the game's; see DATOS.md › Iconos). `items` maps catalog id → icon, `cats` gives the fallback icon + colour class per category, plus `types`/`kinds`/`phases`. The page injects `sprite()` once and uses `<use href="#i-name">`. It must keep working if this file is missing. A test checks every catalog item has an icon.
4. **`rutas-incluidas.js`** → `window.RUTAS`, generated from `ruta-2-granjas.json` (see Commands).

**`ruta-escalado.html`** is UI only.
- **Design system:** CSS tokens on `:root` (colours, spacing, radii, rarity/category colours), fluid root font size (`clamp`, follows window width and DPI), reusable classes (`.card`, `.kpi(s)`, `.tile`, `.badge`, `.chip`, `.issue`, `.bar`). Breakpoints: <1024 nav on top, ≥1024 icon rail + side panel (`.split` with sticky `.panel`), ≥1360 sidebar with labels (collapsible, stored in `localStorage['robrun-ui']`, a per-screen pref, not user data). Step lists use container queries (1/2/3 columns).
- **Item picker:** `<dialog id="picker">`, `openPicker(cb, opts)`; the datalist inputs stay as the keyboard path (tests use them).
- E2E selectors to keep: `.step` on step and station cards, `[data-f]`, `[data-act]`, `[data-tact]`, `[data-add]`, `[data-addst]`, `[data-g]`, `#issues`, `#notices`, `#tables [data-timer]`. Buttons matched by exact `textContent` (e.g. «Ya lo tengo») must not get extra text; icons are `<svg>` without text.
- **Every change goes through `commit(fn, opt)`.** It clones `S`, runs `fn` (which calls `RR.ops.*`), then `normState`, then validates. It rejects the change atomically if the change adds a *new* route error to a non-draft route (unless `opt.allowErrors`) or a new farm error (always), and offers "save as draft". Otherwise it pushes the undo stack (60 entries), saves and renders.
- **Never mutate `S` outside `commit`.** The one exception is `tick()` setting `t.notified`.
- **Storage:**
  - The state lives in `localStorage['robrun-rutas-v1']`. The key is unchanged since v1; the format version is inside, as `schema`.
  - Backups go to `localStorage['robrun-backups']` (max 6). They are taken daily, before migration, before restore, before reset, and when stored data is corrupt.
- `window.RRApp` exposes `S`, `commit`, `undo`, `showTab`, `backups` and more for tests.
- Rendering is full re-render per tab with `esc()` on every interpolated string; keep it that way (XSS: imported routes are untrusted).

**`app/`** is the native Windows wrapper (.NET 10 WinForms + WebView2, `Program.cs` only).
- It maps the exe's folder to `https://robrun.app/`. That folder must contain `ruta-escalado.html`, `catalogo.js`, `core.js`, `iconos.js` and `rutas-incluidas.js`.
- **Data location:** WebView2 data defaults to `%LOCALAPPDATA%\RobRunPlanner`; `ROBRUN_DATA_DIR` overrides it.
- **Alerts:** the page posts `{timers:[{id,due,text}]}` (from `RR.timerList`) whenever its timer list changes. The host checks them every second, even when minimized, and alerts with a tray balloon, a generated chime (or `aviso.wav` next to the exe) and a taskbar flash. `ROBRUN_TEST_LOG` appends each alert to a file.
- **External links:** links outside `robrun.app` open in the system browser.
- `make-icon.ps1` draws `icon.ico`.

## Commands

```powershell
npm test                 # unit + integration + property/fuzz tests (node --test, no deps)
npm run test:e2e         # Edge headless on file:// with a temp profile
npm run test:webview2    # copies the exe + web files to a temp dir and drives it via CDP (needs RobRunPlanner.exe built)
node --test --test-name-pattern="migración" "tests/*.test.js"   # single test by name
```

The E2E scripts use the tiny CDP client in `tests/cdp.mjs` (Node ≥ 22: global `WebSocket`/`fetch`). They override `confirm`/`prompt` via `Page.addScriptToEvaluateOnNewDocument`: a native dialog would hang the run.

**Build the exe:**

```powershell
dotnet publish D:\Proyectos\GitHub\RobRunPlugins\app -c Release -o D:\Proyectos\GitHub\RobRunPlugins\app\out
```

- Copy `app\out\RobRunPlanner.exe` to the repo root and delete `out`.
- Do **not** use `-o ..`: the publish dir is excluded from the compile glob, so the build fails with `CS5001`.
- Stop any running `RobRunPlanner` first.

**Regenerate bundled routes** with `npm run rutas` (`tools/gen-rutas.js`; the bundled list is `FILES` there: `ruta-2-granjas.json`, `ruta-reempaquetado.json`, `ruta-taller-quimico.json`). Bump a route's `version` when you change it so existing users get the "new version" notice. A test checks that every bundled route imports with no errors or warnings.

**Release and auto-update:**
- Public repo `daviddaco1/rob-run-planner`. `RR.REPO` in core.js and `Repo` in Program.cs must match. The exe, `app/bin|obj|out`, `release/`, zips and `.lnk` are git-ignored.
- To publish: bump `APP_VERSION` in core.js (plus package.json and CHANGELOG), commit and push, then run `.\tools\release.ps1`. It tests, builds, zips `release\RobRunPlanner.zip` and runs `gh release create v<APP_VERSION>`.
- The page checks `releases/latest` at most every 6 h (`robrun-update-check` in localStorage) and on demand from the Copias tab. `RR.isNewer(tag)` only accepts strict `vX.Y.Z`. In a browser it links to the release; in the app it posts `{update:true}`.
- The host then downloads only the `RobRunPlanner.zip` asset of that repo, extracts it to %TEMP%, writes `robrun-update.cmd` (waits for the PID to exit, robocopies over the exe folder, relaunches) and closes. Errors come back as `{updateError}`. User data in %LOCALAPPDATA% is never touched.

**Distributable:** `%USERPROFILE%\OneDrive\Escritorio\Rob Run Planner\` is the user's local install, with the same layout as the release zip (exe, 4 web files, docs, `schema\`, `rutas\`). It updates itself from releases.

## Conventions

- **New game data** goes in `catalogo.js` with `conf` and `src`, never hard-coded in `core.js`/HTML. Follow DATOS.md. Never present an estimate as confirmed.
- **New mechanic or rule** goes in `core.js`, with a test in `tests/core.test.js`. If it mutates state, add the op to the random-ops list in `tests/property.test.js`.
- **New step fields** need changes in `normStep` and `exportRoute`, plus `schema/ruta.schema.json` and `COMO-CREAR-RUTAS.md`. The guide's "Mi ruta: primera granja" example is imported by a test.
- **Format changes** need a `SCHEMA` bump and a migration branch in `migrate()` covered by a test. Old data must never be dropped silently.
