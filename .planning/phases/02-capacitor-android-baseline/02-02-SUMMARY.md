---
phase: 02-capacitor-android-baseline
plan: 02
subsystem: infra
tags: [capacitor, android, androidmanifest, portrait, emulator, avd, build-pipeline]

# Dependency graph
requires:
  - phase: 02-capacitor-android-baseline/02-01
    provides: Capacitor 8 installed, android/ scaffolded, capacitor.config.ts with appId/appName/SystemBars.hidden=true
  - phase: 01-web-fixes
    provides: Corrected React Simon game (glow fix, await audio, viewport tag) — the web assets built and synced here
provides:
  - android:screenOrientation="portrait" on MainActivity in AndroidManifest.xml (D-06, CAP-05 pre-req)
  - npm run build + npx cap sync android pipeline verified end-to-end (CAP-05)
  - Game confirmed fully playable on Android emulator AVD — Round 2 / Streak 1 observed (CAP-06)
  - Emulator audio status documented: known limitation per D-05 (silent on AVD; deferred to Phase 3)
affects: [03-admob-integration, 04-signing-play-store]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build pipeline: npm run build → npx cap sync android — both must exit 0 before any native run"
    - "Portrait lock via android:screenOrientation=portrait on MainActivity, not via window flags"

key-files:
  created: []
  modified:
    - android/app/src/main/AndroidManifest.xml

key-decisions:
  - "Emulator audio silence is a known limitation per D-05 — does not block CAP-06 completion; physical device audio deferred to Phase 3"
  - "Portrait lock implemented via android:screenOrientation=portrait on the activity element, not via manifest theme flags, consistent with D-07 (SystemBars handles full-screen)"

patterns-established:
  - "Cap sync pattern: always run npm run build first; never sync a broken build (T-02-04 mitigation)"
  - "Portrait orientation locked at the activity level — no additional window flags needed when SystemBars plugin is configured"

requirements-completed: [CAP-05, CAP-06]

# Metrics
duration: ~10min (Tasks 1-2 automated; Task 3 human checkpoint on emulator)
completed: 2026-05-15
---

# Phase 2 Plan 02: Build Pipeline + Emulator Run Summary

**Portrait lock added to AndroidManifest.xml, build pipeline (npm run build + npx cap sync android) verified exit-0, and Simon game confirmed playable end-to-end on Android AVD (Round 2 / Streak 1 reached — all visual and interaction checks pass)**

## Performance

- **Duration:** ~10 min (Tasks 1-2 automated; Task 3 human checkpoint on emulator)
- **Started:** 2026-05-15
- **Completed:** 2026-05-15
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 1 (AndroidManifest.xml)

## Accomplishments

- Added `android:screenOrientation="portrait"` to the MainActivity activity element in AndroidManifest.xml (D-06, CAP-05 pre-req)
- `npm run build` (tsc + Vite) and `npx cap sync android` both exit 0; `dist/index.html` and `android/app/src/main/assets/public/index.html` both confirmed present (CAP-05)
- Game installed and launched on Android AVD without crash; 4 colored pads rendered, portrait orientation locked, edge-to-edge screen, score/round/streak visible; sequence play, pad input, score increment, and game-over/reset all confirmed working (CAP-06)
- Emulator audio status documented as known limitation — AVD audio silent; physical device audio check deferred to Phase 3 per D-05

## Task Commits

1. **Task 1: Add portrait orientation lock to AndroidManifest.xml** - `a61e773` (feat)
2. **Task 2: Run build pipeline end-to-end** - `353f9f1` (feat)
3. **Task 3: Emulator verification** - Human checkpoint; no separate commit (results documented in this SUMMARY)

## Files Created/Modified

- `android/app/src/main/AndroidManifest.xml` — Added `android:screenOrientation="portrait"` to MainActivity activity element; no other attributes changed

## Decisions Made

- **Emulator audio silence accepted as known limitation (D-05):** All VISUAL and INTERACTION checklist items passed. Audio silence on AVD is documented and deferred — not a CAP-06 blocker. Physical device audio will be verified in Phase 3 when the app is run on a real device for AdMob testing.
- **Portrait lock on activity element only:** `android:screenOrientation="portrait"` placed on the `<activity>` tag for MainActivity. No window flags added — SystemBars plugin (plugins.SystemBars.hidden=true in capacitor.config.ts) already handles full-screen/edge-to-edge per D-07.

## Deviations from Plan

None — plan executed exactly as written. Both automated tasks matched acceptance criteria exactly. Human checkpoint checklist results: all VISUAL and INTERACTION items passed; audio noted as known limitation per D-05.

## Issues Encountered

None. Both `npm run build` and `npx cap sync android` exited 0 on first run. App launched on emulator without crash.

## Emulator Verification Results (CAP-06, D-05)

**VISUAL: all pass**
- App launched without crash
- 4 colored pads (green, red, yellow, blue) rendered correctly
- Portrait orientation locked — cannot rotate to landscape
- Edge-to-edge layout — status bar and navigation bar hidden
- Score/round/streak display visible

**INTERACTION: all pass**
- Start button initiated sequence playback
- Active pad glowed at full brightness during sequence (no opacity-40 on active pad — Phase 1 fix confirmed)
- Pad taps registered during user input phase
- Score incremented on correct sequence
- Game-over triggered on incorrect pad; reset/restart worked
- Reached Round 2, Streak 1 on emulator (confirmed via screenshot)

**AUDIO: KNOWN LIMITATION**
- Emulator audio silent during sequence playback and user input
- Expected behavior per D-05: AVD audio unreliable; silence is documented, not a blocker
- Physical device audio deferred to Phase 3

## User Setup Required

None for this plan. Java 21 JAVA_HOME update (flagged in Plan 01) was resolved by the user prior to Plan 02 emulator run.

## Next Phase Readiness

Phase 2 is now complete. All 6 CAP requirements satisfied:
- CAP-01: Admob compat verified (Plan 01)
- CAP-02: Capacitor 8 packages installed (Plan 01)
- CAP-03: capacitor.config.ts configured (Plan 01)
- CAP-04: android/ scaffolded (Plan 01)
- CAP-05: Build pipeline verified end-to-end (this plan)
- CAP-06: Game playable on AVD (this plan)

Ready for Phase 3 (AdMob Integration):
- Android project is correctly configured and buildable
- appId=com.otis.brooke.simon.game is locked in both capacitor.config.ts and build.gradle (required for AdMob App ID registration)
- Physical device audio should be verified in Phase 3 when running on real hardware

**Known deferred item:** Emulator audio silence — expected to work on physical device; verify in Phase 3 during AdMob testing.

---
*Phase: 02-capacitor-android-baseline*
*Completed: 2026-05-15*
