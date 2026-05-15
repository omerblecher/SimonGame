---
phase: 03-admob-integration
plan: 01
subsystem: android
tags: [admob, capacitor, android, capacitor-community-admob, capacitor-app]

# Dependency graph
requires:
  - phase: 02-capacitor-android-baseline
    provides: Android project with Capacitor 8 wired, package.json with @capacitor/core@^8.3.4

provides:
  - "@capacitor-community/admob@8.0.0 installed and registered in Capacitor Android project"
  - "@capacitor/app@8.1.0 installed for AppStateChange lifecycle events"
  - "AndroidManifest.xml AdMob Application ID meta-data pointing to @string/admob_app_id"
  - "strings.xml admob_app_id string resource (placeholder value — user must replace before Plan 03-03 build)"
  - "index.html body pre-render background #0f172a (slate-900) preventing white flash during AdMob init"

affects:
  - 03-02-admob-integration (imports AdMob and App packages added here)
  - 03-03-android-build (requires real App ID in strings.xml before building)

# Tech tracking
tech-stack:
  added:
    - "@capacitor-community/admob@8.0.0 — AdMob banner ads + UMP consent API"
    - "@capacitor/app@8.1.0 — appStateChange lifecycle events for banner hide/show"
  patterns:
    - "Android string resource indirection: App ID in strings.xml, referenced via @string/admob_app_id in AndroidManifest (not hardcoded in XML attribute)"
    - "Pre-render body background: inline style on <body> prevents white flash before Tailwind CSS loads"

key-files:
  created: []
  modified:
    - "package.json — added @capacitor-community/admob@8.0.0 and @capacitor/app@8.1.0"
    - "package-lock.json — lockfile updated for 7 new packages"
    - "android/app/capacitor.build.gradle — cap sync registered both new plugins"
    - "android/capacitor.settings.gradle — cap sync registered both new plugins"
    - "android/app/src/main/AndroidManifest.xml — AdMob APPLICATION_ID meta-data added inside <application>"
    - "android/app/src/main/res/values/strings.xml — admob_app_id string resource added"
    - "index.html — body background-color #0f172a inline style added"

key-decisions:
  - "Use @string/admob_app_id reference in AndroidManifest (not hardcoded ID) per RESEARCH.md D-07 and Pattern 4 — enables clean environment switching"
  - "Use YOUR_ADMOB_APP_ID placeholder in strings.xml — user replaces with real ca-app-pub-XXXX~XXXX before Plan 03-03 build"
  - "Pre-render background set to slate-900 (#0f172a), not slate-950 — intentional delta per UI-SPEC.md, overridden by Tailwind at runtime"

requirements-completed:
  - ADM-01
  - ADM-02

# Metrics
duration: 8min
completed: 2026-05-15
---

# Phase 3 Plan 01: Install AdMob Packages and Configure Android Native Summary

**@capacitor-community/admob@8.0.0 and @capacitor/app@8.1.0 installed, AndroidManifest wired with APPLICATION_ID meta-data via @string/admob_app_id, and index.html body pre-render background set to slate-900**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-15T00:00:00Z
- **Completed:** 2026-05-15T00:08:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Installed `@capacitor-community/admob@8.0.0` and `@capacitor/app@8.1.0`; both plugins registered by `npx cap sync android`
- Added AdMob `APPLICATION_ID` meta-data inside AndroidManifest `<application>` block referencing `@string/admob_app_id`
- Added `admob_app_id` placeholder string to `strings.xml` (user replaces before Plan 03-03 build)
- Set `index.html` body `background-color: #0f172a` to prevent white flash during AdMob UMP init window
- All three acceptance criteria: `npm run build` exits 0, `npx cap sync android` exits 0, grep confirms all XML changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Install admob and @capacitor/app packages** - `8a2e759` (feat)
2. **Task 2: Add AdMob App ID to AndroidManifest.xml and strings.xml** - `ffbb3d5` (feat)
3. **Task 3: Add pre-render body background to index.html** - `740490d` (feat)

**Plan metadata:** (docs commit — created with SUMMARY)

## Files Created/Modified

- `package.json` — Added `@capacitor-community/admob@8.0.0` and `@capacitor/app@8.1.0` to dependencies
- `package-lock.json` — Lockfile updated for 7 new packages (admob, app, and transitive deps)
- `android/app/capacitor.build.gradle` — cap sync registered both new Capacitor plugins
- `android/capacitor.settings.gradle` — cap sync registered both new Capacitor plugins
- `android/app/src/main/AndroidManifest.xml` — `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>` added inside `<application>` before `</application>`
- `android/app/src/main/res/values/strings.xml` — `<string name="admob_app_id">YOUR_ADMOB_APP_ID</string>` added after existing strings
- `index.html` — `<body style="background-color: #0f172a;">` (was `<body>`)

## Decisions Made

- Used `@string/admob_app_id` indirection pattern in `AndroidManifest.xml` rather than hardcoding the App ID directly in `android:value`. This matches RESEARCH.md Pattern 4 and D-07 — keeps App ID out of XML attributes for cleaner environment switching and is the standard pattern recommended by the plugin docs.
- Placeholder `YOUR_ADMOB_APP_ID` in `strings.xml` stays until user registers Simon game in AdMob console. Documented in `03-USER-SETUP.md`.
- Body background uses `#0f172a` (Tailwind slate-900), not `#020617` (slate-950). UI-SPEC.md documents this intentional delta — the 1-second pre-render window where slate-900 shows is imperceptible, and the inline style is overridden by Tailwind once it loads.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All three tasks completed without errors. `npx cap sync android` reported both plugins found:
```
[info] Found 2 Capacitor plugins for android:
       @capacitor-community/admob@8.0.0
       @capacitor/app@8.1.0
```

## User Setup Required

**External services require manual configuration.** See [03-USER-SETUP.md](./03-USER-SETUP.md) for:

- Register Simon Memory Game in AdMob console (admob.google.com) with package `com.otis.brooke.simon.game`
- Replace `YOUR_ADMOB_APP_ID` placeholder in `android/app/src/main/res/values/strings.xml` with real App ID (`ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)

This must be done before the Android build in Plan 03-03. Plan 03-02 (JS integration) can proceed without it.

## Next Phase Readiness

- Ready for Plan 03-02: AdMob JS integration (`useBannerHeight` hook, `main.tsx` UMP consent + initialize sequence, App.tsx banner show/hide)
- Plan 03-02 can import `AdMob` from `@capacitor-community/admob` and `App as CapacitorApp` from `@capacitor/app` — both packages are now installed
- Plan 03-03 (Android build) requires user to complete `03-USER-SETUP.md` (replace `YOUR_ADMOB_APP_ID`) before running Gradle build

---
*Phase: 03-admob-integration*
*Completed: 2026-05-15*

## Self-Check: PASSED

Verified:
- `package.json` contains `@capacitor-community/admob` and `@capacitor/app` — FOUND
- `AndroidManifest.xml` contains `com.google.android.gms.ads.APPLICATION_ID` — count: 1 PASS
- `strings.xml` contains `admob_app_id` — count: 1 PASS
- `index.html` body contains `background-color: #0f172a` — count: 1 PASS
- Commits `8a2e759`, `ffbb3d5`, `740490d` — all in git log
- `npm run build` — exits 0 (confirmed twice: after Task 1 and after Task 3)
- `npx cap sync android` — exits 0, both plugins registered
