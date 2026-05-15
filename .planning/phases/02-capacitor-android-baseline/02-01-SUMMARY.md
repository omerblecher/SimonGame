---
phase: 02-capacitor-android-baseline
plan: 01
subsystem: infra
tags: [capacitor, android, capacitor-cli, gradle, mobile]

# Dependency graph
requires:
  - phase: 01-web-fixes
    provides: Corrected React Simon game with glow bug fixed, await audioCtx.resume(), viewport meta tag — the web assets that Capacitor wraps
provides:
  - Capacitor 8 packages installed (@capacitor/core, @capacitor/android, @capacitor/cli all at ^8.3.4)
  - capacitor.config.ts with appId=com.otis.brooke.simon.game, appName=Simon Memory Game, webDir=dist, SystemBars.hidden=true
  - android/ project scaffolded with correct applicationId and app_name
affects: [02-02-build-pipeline, 03-admob-integration, 04-signing-play-store]

# Tech tracking
tech-stack:
  added: ["@capacitor/core@^8.3.4", "@capacitor/android@^8.3.4", "@capacitor/cli@^8.3.4 (dev)"]
  patterns: ["Capacitor TypeScript config (capacitor.config.ts, not JSON)", "Java 21 for Gradle builds (Java 8 is PATH default but 21 is at C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot)"]

key-files:
  created:
    - capacitor.config.ts
    - android/app/build.gradle
    - android/app/src/main/AndroidManifest.xml
    - android/app/src/main/java/com/otis/brooke/simon/game/MainActivity.java
    - android/app/src/main/res/values/strings.xml
    - android/gradle/wrapper/gradle-wrapper.properties
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Capacitor 8 confirmed via npm show @capacitor-community/admob — admob@8.0.0 requires @capacitor/core ^8.0.0 (CAP-01)"
  - "TypeScript config (capacitor.config.ts) created manually — no npx cap init — to lock appId and appName without interactive prompts"
  - "JAVA_HOME points to Java 8 by default; Java 21 is installed at C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot and must be used for Gradle builds"

patterns-established:
  - "Capacitor config is TypeScript: capacitor.config.ts (consistent with project's TS-first convention)"
  - "Java 21 required for Gradle: set JAVA_HOME=C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot before running gradlew commands"

requirements-completed: [CAP-01, CAP-02, CAP-03, CAP-04]

# Metrics
duration: 3min
completed: 2026-05-15
---

# Phase 2 Plan 01: Capacitor Install + Android Scaffold Summary

**Capacitor 8.3.4 installed and android/ project scaffolded with applicationId=com.otis.brooke.simon.game confirmed in build.gradle and app_name=Simon Memory Game in strings.xml**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-15T12:35:36Z
- **Completed:** 2026-05-15T12:38:24Z
- **Tasks:** 3
- **Files modified:** 56 (package.json, package-lock.json, capacitor.config.ts + entire android/ scaffold)

## Accomplishments

- Confirmed @capacitor-community/admob@8.0.0 requires @capacitor/core ^8.0.0 — Capacitor 8 is the correct version (CAP-01)
- Installed @capacitor/core@^8.3.4, @capacitor/android@^8.3.4 (dependencies) and @capacitor/cli@^8.3.4 (devDependency) — all verified PASS (CAP-02)
- Created capacitor.config.ts with exact appId, appName, webDir, and SystemBars.hidden=true (CAP-03)
- Scaffolded android/ via `npx cap add android`; applicationId and app_name auto-populated correctly (CAP-04)

## Task Commits

All tasks committed in a single commit per plan constraints:

1. **Tasks 1-3 (all):** `c6ad457` - feat(02-01): install Capacitor 8 packages and scaffold Android project

**Plan metadata:** (created in final commit below)

## Files Created/Modified

- `capacitor.config.ts` — Capacitor app config: appId=com.otis.brooke.simon.game, appName=Simon Memory Game, webDir=dist, SystemBars.hidden=true
- `package.json` — Added @capacitor/core, @capacitor/android (deps) and @capacitor/cli (devDep) at ^8.3.4
- `package-lock.json` — Updated lockfile for 91 new packages
- `android/app/build.gradle` — applicationId "com.otis.brooke.simon.game" (namespace + applicationId both set)
- `android/app/src/main/AndroidManifest.xml` — Capacitor default manifest (portrait lock added in Plan 02)
- `android/app/src/main/java/com/otis/brooke/simon/game/MainActivity.java` — Capacitor bridge entry point
- `android/app/src/main/res/values/strings.xml` — app_name="Simon Memory Game" (correct out of the box)
- `android/` — Full Gradle project: build files, Gradle wrapper, res/ assets, splash screens

## Decisions Made

- **TypeScript config only, no npx cap init:** Created `capacitor.config.ts` manually to lock appId=com.otis.brooke.simon.game and appName=Simon Memory Game deterministically without interactive prompts
- **Capacitor 8 (not 6 or 7):** Confirmed by npm show — admob@8.0.0 lists `@capacitor/core: ^8.0.0` in its dependencies field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] JAVA_HOME points to Java 8, not Java 17+**
- **Found during:** Task 1 (prerequisite checks)
- **Issue:** `java -version` on PATH returns Java 8 (OpenJDK 1.8.0_452). JAVA_HOME is set to the Java 8 JDK. Gradle requires Java 17+.
- **Java 21 IS installed** at `C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\` — this is sufficient.
- **Fix for this plan:** Used `JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot"` prefix when running `npx cap add android` (the cap tool itself does not check Java, but Gradle will when building in Plan 02).
- **Action required for Plan 02:** Before running `gradlew` or any Gradle task, set JAVA_HOME to the Java 21 path. Android Studio should be configured to use Java 21 as well (File > Project Structure > SDK Location > JDK location).
- **Files modified:** None (environment variable, not a file change)
- **Verification:** `npx cap add android` completed successfully; android/ scaffolded.

---

**Total deviations:** 1 auto-documented (environment configuration warning)
**Impact on plan:** `npx cap add android` completed successfully. Java 21 is present; JAVA_HOME needs to point to it for Gradle builds in Plan 02. No scope change.

## Issues Encountered

- `emulator` binary is not on the system PATH (returns "command not found" in bash). The emulator was located via `$ANDROID_HOME/emulator/emulator.exe` — confirmed AVD "Medium_Phone_API_36.1" (API 36.1) is present. Plan 02 should use the full path or launch from Android Studio.
- `npx cap add android` ran from `dist/` directory which existed from prior Phase 1 build — web assets were copied into android/app/src/main/assets/public successfully.

## User Setup Required

**Action needed before Plan 02 (Gradle build):** Update JAVA_HOME to Java 21.

In PowerShell (per-session):
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot"
```

For permanent fix, update System Environment Variables:
- Open: System Properties > Advanced > Environment Variables
- Change `JAVA_HOME` from `C:\Program Files\Eclipse Adoptium\jdk-8.0.452.9-hotspot` to `C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot`

Verification: `java -version` should then return `openjdk version "21.0.7"`.

## Next Phase Readiness

Ready for Plan 02 (02-02: AndroidManifest, build pipeline, emulator run):
- Capacitor packages installed at correct version
- capacitor.config.ts configured with all required fields
- android/ scaffolded with correct applicationId and app_name
- Gradle wrapper present (gradle-wrapper.properties configured)

**Blocker for Plan 02:** JAVA_HOME must be updated to point to Java 21 before running any Gradle tasks (gradlew bundleRelease, gradlew assembleDebug, etc.). Android Studio build will also fail if its JDK location is set to Java 8.

---
*Phase: 02-capacitor-android-baseline*
*Completed: 2026-05-15*
