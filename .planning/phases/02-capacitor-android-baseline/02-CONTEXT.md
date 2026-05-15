# Phase 2: Capacitor Android Baseline - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Package the existing React Simon game as a native Android app via Capacitor — fully playable on an Android emulator, no ads yet. All Capacitor wiring, Android project scaffolding, and build pipeline work happens here.

What this phase delivers:
- `capacitor.config.ts` configured with the correct app identity
- Android project scaffolded (`npx cap add android`)
- Build pipeline working end-to-end: `npm run build` → `npx cap sync android` → emulator run
- Game plays correctly on Android emulator: pads respond, audio works, no visual regressions
- Portrait-locked, full-screen (edge-to-edge) display

What this phase does NOT deliver:
- AdMob or any ads (Phase 3)
- Release signing (Phase 4)
- App icon or splash screen customization (Phase 4 — META-04)
- Physical device testing (emulator is the verification target)

</domain>

<decisions>
## Implementation Decisions

### App Identity
- **D-01:** Package ID is `com.otis.brooke.simon.game` — permanent, set in `capacitor.config.ts` and `android/app/build.gradle`. Never change after Play Store submission.
- **D-02:** App display name is `Simon Memory Game` — set in `capacitor.config.ts` (`appName`) and `android/app/src/main/res/values/strings.xml` (`app_name`).

### Capacitor Version
- **D-03:** Researcher must run `npm show @capacitor-community/admob peerDependencies` before installing any Capacitor packages to determine whether to use Capacitor 6 or Capacitor 7. Install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` at the same major version (whichever the AdMob plugin requires). This check is non-negotiable — the wrong Capacitor version will block Phase 3.

### Verification Target
- **D-04:** Verification is via Android emulator (AVD). Android Studio is already installed with AVD configured — the plan does NOT need to include Android Studio setup steps. The plan documents the `npx cap run android` (or equivalent) command to launch on the emulator.
- **D-05:** Audio on emulator is the risk to watch. If emulator audio is silent, this should be noted in the plan output but does not block completion — physical device audio is validated in Phase 3 or later.

### Screen Orientation
- **D-06:** Portrait-only orientation lock. Set `android:screenOrientation="portrait"` on the `MainActivity` entry in `AndroidManifest.xml`. The game's 4-pad grid is designed for portrait; landscape is not supported.

### WebView Display
- **D-07:** Full-screen / edge-to-edge display — the system status bar and navigation bar should be hidden. Implement via Capacitor's `backgroundColor` config and Android window flags. The game should fill the entire screen.

### Claude's Discretion
- Exact mechanism for full-screen on Android (Capacitor `server.androidScheme`, `StatusBar` plugin, or `window.flags` in `MainActivity.java`) — researcher should identify the current best practice for Capacitor 6/7.
- Whether `capacitor.config.ts` needs a `server` block or `plugins` block for Phase 2 (no ads yet) — keep minimal; Phase 3 will extend it for AdMob.
- Whether `main.tsx` needs any Capacitor platform initialization for Phase 2 — if needed, keep it minimal and structured so Phase 3's `AdMob.initialize()` can slot in cleanly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Goals
- `.planning/REQUIREMENTS.md` §Phase 2 — Capacitor Android Baseline — 6 requirements: CAP-01 through CAP-06 (version compat check, package install, config, scaffold, build pipeline, emulator run)
- `.planning/ROADMAP.md` §Phase 2: Capacitor Android Baseline — goal statement and 4 success criteria
- `.planning/PROJECT.md` §Constraints — Capacitor is mandatory (not React Native); Android only

### Pre-Phase Critical Check
- Run `npm show @capacitor-community/admob peerDependencies` first — determines Capacitor major version (6 or 7). This is CAP-01 and gates everything else.

### Source Files to Create / Modify
- `capacitor.config.ts` — CREATE: `appId: 'com.otis.brooke.simon.game'`, `appName: 'Simon Memory Game'`, `webDir: 'dist'`
- `android/app/src/main/AndroidManifest.xml` — ADD `android:screenOrientation="portrait"` to MainActivity; configure edge-to-edge/full-screen flags
- `android/app/src/main/res/values/strings.xml` — VERIFY `app_name` = "Simon Memory Game" (scaffolded by `cap add android`, may need manual update)
- `android/app/build.gradle` — VERIFY `applicationId = 'com.otis.brooke.simon.game'` after scaffold (Capacitor usually writes this from config)

### Source Files Unchanged (read for integration awareness)
- `src/main.tsx` — current entry point; may need minimal Capacitor platform detection if required
- `index.html` — HTML entry; Capacitor's WebView loads this as the app root

### Prior Phase Artifacts
- `.planning/phases/01-web-fixes/01-CONTEXT.md` — Phase 1 decisions (pad glow, audio await, touch-action, viewport) — all done, no regressions expected

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main.tsx` — React DOM entry point; minimal (8 lines). Integration point if Capacitor platform init is needed in Phase 2.
- `dist/` — Vite build output directory; `webDir: 'dist'` in capacitor.config.ts points here.
- `npm run build` — already runs `tsc && vite build`; no changes needed to build script.

### Established Patterns
- TypeScript throughout — `capacitor.config.ts` (not `.json`) is consistent with the project's TS-first approach.
- No existing native integrations — this is the first native layer. Keep `src/` changes minimal; Capacitor wraps the web output, not the source.
- `src/App.tsx` is monolithic (463 lines) — do not refactor or split it in Phase 2; Capacitor doesn't require it.

### Integration Points
- `src/main.tsx` — if Capacitor platform detection is needed (e.g., `Capacitor.isNativePlatform()`), add it here so Phase 3's AdMob init can extend the same pattern.
- `index.html` — Capacitor injects its bridge script; no manual changes needed here beyond what Phase 1 already set (viewport meta tag is correct).
- `android/` directory — created by `npx cap add android`; Capacitor manages its contents via `cap sync`.

</code_context>

<specifics>
## Specific Ideas

- Package ID `com.otis.brooke.simon.game` uses a non-standard 4-segment reverse-domain format. This is valid for Android but researcher should confirm Capacitor/Gradle accepts it without issues.
- Emulator audio limitation: Android emulators often have unreliable audio. Plan should document this as a known limitation and note that audio verification on physical device is deferred to Phase 3 (or a manual spot-check step).
- The full-screen / edge-to-edge requirement interacts with the viewport meta tag already set in Phase 1 (`viewport-fit=cover`). The plan should ensure Android window flags are consistent with this.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Capacitor Android Baseline*
*Context gathered: 2026-05-15*
