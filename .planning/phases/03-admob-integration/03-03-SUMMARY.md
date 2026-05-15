---
phase: 03-admob-integration
plan: 03
subsystem: ui
tags: [admob, capacitor, android, banner, audio]

requires:
  - phase: 03-02
    provides: useBannerHeight hook and AdMob init sequence

provides:
  - Banner ad wired into App.tsx with show/hide/resume lifecycle
  - appStateChange listener for background/foreground banner management
  - Spacer div reserving banner height in layout
  - Physical device verification: banner visible, audio audible, lifecycle correct

affects: phase-4-signing

tech-stack:
  added: []
  patterns: [window.__admobReady flag for guarding native calls against failed init]

key-files:
  modified:
    - src/App.tsx
    - src/main.tsx

key-decisions:
  - "window.__admobReady flag gates showBanner — prevents native NPE crash when AdMob.initialize() fails"
  - "UMP consent wrapped in own try/catch — consent failure no longer blocks AdMob.initialize()"
  - "masterGain raised from 0.2 to 1.0 — Android hardware attenuates audio; max clean gain needed"

patterns-established:
  - "Native SDK guard pattern: set window flag on successful init, check it before all native calls"

requirements-completed:
  - ADM-05
  - ADM-06
  - ADM-07
  - ADM-08

duration: ~60min
completed: 2026-05-15
---

# Phase 3 Plan 03: App.tsx Banner Wiring + Physical Device Verification

**Test banner visible at bottom, gameplay unobscured, background/foreground lifecycle working, audio audible on physical Android device**

## Performance

- **Duration:** ~60 min (including debug iterations)
- **Completed:** 2026-05-15
- **Tasks:** 2 (1 auto + 1 human checkpoint)
- **Files modified:** 2

## Accomplishments

- Wired `useBannerHeight()` hook and banner `useEffect` into `App.tsx` with `showBanner`/`hideBanner`/`resumeBanner`/`removeBanner` lifecycle
- Fixed native NPE crash: `AdMob.initialize()` was failing silently, leaving `mViewGroup=null` in `BannerExecutor`; added `window.__admobReady` guard
- Fixed root cause: UMP `requestConsentInfo()` throws when no GDPR forms configured in AdMob console; wrapped consent in own try/catch so `initialize()` always runs
- Raised master audio gain from 0.2 → 1.0 for audible sound on Android hardware
- Human checkpoint passed: test banner visible, pads not obscured, lifecycle correct, audio audible

## Task Commits

1. **Task 1: Wire banner into App.tsx** — `a69e63b`
2. **Fix: Guard showBanner + improve error logging** — `c3dbdb7`
3. **Fix: Make UMP consent non-blocking** — `219a9a2`
4. **Fix: Raise master volume to 1.0** — `1d591e5`

## Files Modified

- `src/App.tsx` — banner useEffect, appStateChange listener, spacer div, volume 1.0, `__admobReady` guard
- `src/main.tsx` — `window.__admobReady` flag, non-blocking consent try/catch, improved error logging

## Decisions Made

- `window.__admobReady` as a simple cross-module flag (avoids circular imports between main.tsx and App.tsx)
- UMP consent non-blocking: publisher must configure GDPR forms in AdMob console before Phase 4 (Play Store requirement)
- `masterGain = 1.0`: maximum clean gain; Android hardware volume controls apply on top

## Issues Encountered

1. **Native NPE crash on `showBanner`** — `BannerExecutor.mViewGroup` null because `AdMob.initialize()` never completed. Root cause: `requestConsentInfo()` threw `Publisher misconfiguration` (no UMP forms). Fix: non-blocking consent + `__admobReady` guard.
2. **Audio too quiet** — `masterGain = 0.2` inaudible on Android. Fixed to `1.0`.

## Next Phase Readiness

- Phase 4 (Signing + Play Store Submission) is unblocked
- **Required before Phase 4:** Configure GDPR consent form in AdMob → Privacy & messaging (Play Store requirement for EEA users)
- Phase 4 will replace `initializeForTesting: true` → `false` and test banner ID → production ID

---
*Phase: 03-admob-integration*
*Completed: 2026-05-15*
