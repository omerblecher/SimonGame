---
phase: 03-admob-integration
plan: "02"
subsystem: ui
tags: [react, capacitor, admob, gdpr, ump, banner-ads, hooks, typescript]

# Dependency graph
requires:
  - phase: 03-admob-integration plan 01
    provides: @capacitor-community/admob@8.0.0 and @capacitor/app@8.1.0 installed; Capacitor 8 configured

provides:
  - useBannerHeight() hook in src/hooks/useBannerHeight.ts — BannerAdPluginEvents.SizeChanged listener, returns 0 in browser / 50 pre-load on native / actual height post-event
  - Pre-render GDPR/UMP consent + AdMob.initialize() sequence in src/main.tsx using IIFE pattern
  - Graceful degradation — root.render() always executes regardless of AdMob init success

affects:
  - 03-03: App.tsx banner display plan — consumes useBannerHeight() hook; depends on AdMob already initialized in main.tsx
  - 04-signing: Production build — initializeForTesting must be set to false in Phase 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IIFE async pattern for pre-render initialization in main.tsx (safer than top-level await for TypeScript strict mode)
    - isNativePlatform() guard pattern — all AdMob calls wrapped to keep browser dev server working
    - BannerAdPluginEvents.SizeChanged (not bannerAdLoaded) for banner height — bannerAdLoaded has no payload
    - useState initial value conditioned on Capacitor.isNativePlatform() for correct SSR-safe defaults

key-files:
  created:
    - src/hooks/useBannerHeight.ts
  modified:
    - src/main.tsx

key-decisions:
  - "Use IIFE pattern in main.tsx instead of top-level await — avoids TS1378 risk with strict mode; both compile identically at runtime"
  - "isConsentFormAvailable === true (strict equality) — matches optional boolean type from AdmobConsentInfo; avoids truthy-on-undefined"
  - "initializeForTesting: true in Phase 3 only — replaced with false in Phase 4 (key decision #9 from planning)"
  - "BannerAdPluginEvents.SizeChanged used for banner height (not bannerAdLoaded) — bannerAdLoaded listener is () => void with no payload"

patterns-established:
  - "Pattern 1: IIFE-based pre-render async initialization — consent→init→render ordering with try/catch graceful degradation"
  - "Pattern 2: Capacitor listener hook with nullable handle and cleanup — AdMob.addListener().then(h => { handle = h }) + handle?.remove() in useEffect cleanup"

requirements-completed:
  - ADM-03
  - ADM-04
  - ADM-07
  - ADM-08

# Metrics
duration: 8min
completed: 2026-05-15
---

# Phase 03 Plan 02: useBannerHeight Hook and AdMob Init Sequence Summary

**UMP GDPR consent flow and AdMob.initialize() sequenced before React render via IIFE in main.tsx; BannerAdPluginEvents.SizeChanged hook returns banner height (0 browser / 50 pre-load native / actual post-event)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-15T00:00:00Z
- **Completed:** 2026-05-15T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `src/hooks/useBannerHeight.ts` — React hook that listens to `BannerAdPluginEvents.SizeChanged` (not `bannerAdLoaded` which has no payload), returns banner height as a number; initial value is 50 on native, 0 in browser; cleanup calls `handle?.remove()` to prevent stale listeners across StrictMode double-invocations
- Rewrote `src/main.tsx` with IIFE pattern — `requestConsentInfo()` → conditional `showConsentForm()` → `AdMob.initialize({ initializeForTesting: true })` → `root.render()`; all AdMob calls behind `Capacitor.isNativePlatform()` guard; `root.render()` unconditional and outside try/catch
- `npm run build` exits 0 with zero TypeScript errors (tsc strict mode + noUnusedLocals + noUnusedParameters all pass)

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: useBannerHeight hook and AdMob init sequence** - `a56c729` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/hooks/useBannerHeight.ts` — New hook; exports `useBannerHeight(): number`; listens to `BannerAdPluginEvents.SizeChanged`; returns 0 in browser, 50 pre-load on native, actual height post-event
- `src/main.tsx` — Full rewrite; IIFE with UMP consent sequence before React render; graceful degradation on AdMob failure

## Decisions Made

- **IIFE over top-level await:** Plan specified IIFE explicitly for TypeScript strict mode safety (avoids TS1378). The tsconfig.json confirms `"module": "ESNext"` and `"target": "ES2022"` which would support top-level await, but IIFE is safer and was mandated.
- **`isConsentFormAvailable === true`:** Used strict equality against the optional boolean (can be `true | false | undefined`) to be explicit with TypeScript's type system; avoids treating `undefined` as truthy.
- **`initializeForTesting: true`:** Phase 3 only, per planning key decision #9. This serves Google test ads and carries no user data exposure risk.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — both files compiled cleanly on first attempt. TypeScript strict mode constraints (noUnusedLocals, noUnusedParameters) passed without requiring adjustments since the hook pattern from RESEARCH.md Pattern 2 was followed precisely.

## Threat Coverage

All mitigations from the plan's threat model are satisfied:

| Threat ID | Mitigation Implemented |
|-----------|----------------------|
| T-03-04 | IIFE try/catch ensures root.render() always executes even if initializeAdMob() throws |
| T-03-05 | initializeForTesting: true — Phase 3 only; noted for Phase 4 replacement |
| T-03-06 | useEffect cleanup calls handle?.remove() to deregister BannerAdPluginEvents.SizeChanged listener |
| T-03-SC | No new package installs in this plan — packages from Plan 01 |

## User Setup Required

None — no external service configuration required in this plan.

## Next Phase Readiness

- `useBannerHeight()` hook is ready to consume in App.tsx (Plan 03-03)
- AdMob initialized before React renders — Plan 03-03 can call `AdMob.showBanner()` in a `useEffect` without worrying about initialization ordering
- `dist/index.html` present — web build verified

---
*Phase: 03-admob-integration*
*Completed: 2026-05-15*
