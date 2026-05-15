# Phase 3: AdMob Integration - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a Google AdMob banner ad at the bottom of the screen with a GDPR/UMP consent flow. The game must remain fully playable with the ad visible. This phase targets the Android emulator/device with Capacitor — no Play Store submission yet.

What this phase delivers:
- `@capacitor-community/admob` installed and wired up (ADM-01)
- AdMob App ID declared in `AndroidManifest.xml` (ADM-02)
- GDPR/UMP consent flow runs before `AdMob.initialize()` (ADM-03)
- `AdMob.initialize()` awaited in `main.tsx` before React renders (ADM-04)
- Test banner ad displayed at bottom of screen (ADM-05)
- Bottom spacer/padding ensures 50dp+ gap between banner and game pads (ADM-06)
- `bannerAdLoaded` event used for dynamic spacer height (ADM-07)
- Banner hidden/shown on app pause/resume (ADM-08)
- Physical device audio verification (deferred from Phase 2)

What this phase does NOT deliver:
- Production AdMob App ID / banner unit ID (Phase 4 — STORE-05)
- Release signing (Phase 4)
- App icon, screenshots, store listing (Phase 4)
- iOS support (out of scope)

</domain>

<decisions>
## Implementation Decisions

### Banner Layout
- **D-01:** Banner **pushes game content up** — it does NOT overlay game content. A spacer `<div>` at the bottom of the App.tsx JSX reserves the banner's height so pads are never obscured. This satisfies ADM-06 (50dp minimum gap).
- **D-02:** The spacer pre-reserves the standard banner height (~50px / 50dp) before the banner loads to prevent layout shift. The `bannerAdLoaded` event (ADM-07) then updates the spacer to the actual banner height. Default → actual: smooth, no jump.
- **D-03:** The banner spacer `<div>` lives inside `App.tsx` JSX, at the bottom of the game container. All layout logic stays in one file.
- **D-04:** A custom `useBannerHeight()` hook handles the `bannerAdLoaded` listener and returns the current height as a number. Keeps the banner concern isolated from game logic. Called in `App.tsx`; returns `0` in browser (see D-06).

### Dev Mode Compatibility
- **D-05:** All AdMob calls are wrapped in `if (Capacitor.isNativePlatform())` guards. `npm run dev` in the browser continues to work normally — no AdMob code executes and no errors are thrown.
- **D-06:** `useBannerHeight()` returns `0` when `!Capacitor.isNativePlatform()`. The banner spacer has zero height in browser dev — the game fills the full viewport. Only on native (emulator/device) does the spacer activate.

### AdMob App ID
- **D-07:** User has an AdMob account and will register the Simon game in the AdMob console to obtain a real App ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`). The plan uses `YOUR_ADMOB_APP_ID` as a placeholder in `AndroidManifest.xml` — user replaces it before executing the plan.
- **D-08:** The banner ad unit ID during Phase 3 uses Google's test banner unit ID (`ca-app-pub-3940256099942544/6300978111`) per ADM-05 requirement. The real production banner unit ID (created in AdMob console → Simon app → Ad units → Banner) will replace the test ID in Phase 4 (STORE-05).

### Consent Dialog Timing
- **D-09:** The UMP consent flow runs **before React renders**. `main.tsx` awaits the full sequence — consent check → (optional dialog) → `AdMob.initialize()` — before calling `ReactDOM.createRoot(...).render(...)`. Loading state during this time is a blank dark screen (matches the game's dark `background-color`). Typically completes in < 1 second on device.
- **D-10:** Always run the UMP flow regardless of the user's region. The UMP SDK auto-detects EEA/UK and shows the consent dialog only when legally required. Non-EEA users (e.g., US) see no dialog — initialization completes immediately. No explicit region-detection code needed in the app.

### Physical Device Audio (From Phase 2 Deferred TODO)
- **D-11:** Phase 3 must verify audio playback on a physical Android device (emulator audio was unreliable per Phase 2 D-05). This is a success criterion for Phase 3, not just a nice-to-have.

### Claude's Discretion
- Exact async pattern in `main.tsx` for sequencing UMP consent + `AdMob.initialize()` before render (use try/catch; if consent or init fails, render the game anyway without ads).
- Whether `useBannerHeight()` uses `AdMob.addListener` or `Capacitor` event bus — use whichever the `@capacitor-community/admob` plugin documents.
- Exact `AndroidManifest.xml` changes beyond App ID (any required `<uses-permission>` entries) — researcher to identify from plugin docs.
- Whether `AppStateChange` listener for banner hide/show (ADM-08) lives in the same hook as banner height or a separate `useAppStateAds()` hook — keep simple; inline is fine.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Goals
- `.planning/REQUIREMENTS.md` §Phase 3 — AdMob Integration — 8 requirements: ADM-01 through ADM-08
- `.planning/ROADMAP.md` §Phase 3: AdMob Integration — goal statement and 4 success criteria
- `.planning/PROJECT.md` §Constraints — banner-only ads, AdMob required, Android target

### Prior Phase Artifacts
- `.planning/phases/02-capacitor-android-baseline/02-CONTEXT.md` — Capacitor 8 version decision (D-03), App ID `com.otis.brooke.simon.game` (D-01), `main.tsx` entry point pattern
- `.planning/phases/02-capacitor-android-baseline/02-SUMMARY.md` (02-02) — current state of `android/` directory and build pipeline

### Source Files to Modify
- `src/main.tsx` — ADD: UMP consent + `AdMob.initialize()` before `ReactDOM.createRoot().render()`. Currently 8 lines; will grow to ~30 lines.
- `src/App.tsx` — ADD: `useBannerHeight()` hook call + banner spacer `<div>` at bottom of JSX. Do NOT refactor existing 463-line monolith.
- `android/app/src/main/AndroidManifest.xml` — ADD: `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID">` with `YOUR_ADMOB_APP_ID` placeholder; any required permissions.

### New Files to Create
- `src/hooks/useBannerHeight.ts` — Custom hook: registers `bannerAdLoaded` listener, returns height (0 in browser).

### Plugin Documentation
- Researcher must check `@capacitor-community/admob` v8 docs for: initialization API, UMP consent API, banner API, `bannerAdLoaded` event schema, `AppStateChange` API.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main.tsx` — Current entry point (8 lines). The AdMob initialization sequence slots in before the `ReactDOM.createRoot().render()` call. Platform guard (`Capacitor.isNativePlatform()`) wraps all AdMob calls.
- `src/App.tsx` — Monolithic 463-line component. Adding `useBannerHeight()` hook call and a spacer `<div>` are the only required changes. Do not refactor; Capacitor doesn't require it.
- `audioCtxRef` / `ensureAudioContext()` in App.tsx — The audio-on-gesture pattern from Phase 1 is the established precedent for async initialization. The AdMob init pattern is analogous but at the app level rather than gesture level.

### Established Patterns
- Platform guard: `Capacitor.isNativePlatform()` — new pattern for Phase 3. Keeps all native-only code behind this guard; browser dev server works normally.
- TypeScript strict mode throughout — `useBannerHeight.ts` must be typed properly (no `any`).
- `useCallback` + explicit deps in App.tsx — if any AdMob listener teardown is needed in the hook, follow the same `useEffect` + cleanup return pattern used in App.tsx.
- `src/hooks/` directory does not exist yet — create it for `useBannerHeight.ts`. Keep hook files minimal (one concern per file).

### Integration Points
- `src/main.tsx` — where AdMob initialization sequence + React mount both live. The consent → init → render flow is entirely here.
- Bottom of App.tsx JSX — where the banner spacer `<div>` is added. It must be outside all game interaction areas so it never intercepts touch events.
- `android/app/src/main/AndroidManifest.xml` — already modified in Phase 2 (portrait lock). Add App ID meta-data in the `<application>` block.

</code_context>

<specifics>
## Specific Ideas

- The `useBannerHeight()` hook's initial value should be `50` (standard banner height in px) when on native platform, `0` in browser. This pre-reserves space before the actual banner height is known from `bannerAdLoaded`.
- The blank loading state before React renders needs to match the game's dark background color. `index.html` body background should be set to the same dark color (`#0f172a` or equivalent from Tailwind's `slate-900`) so there's no flash of white before the game loads.
- UMP consent `try/catch` behavior: if consent fails (e.g., network error), the app should proceed without ads rather than blocking the user. Graceful degradation — game must always be playable.
- `AdMob.initialize()` `initializeForTesting` flag should be `true` in Phase 3 (dev/test builds) and `false` only in the Phase 4 production build.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-AdMob Integration*
*Context gathered: 2026-05-15*
