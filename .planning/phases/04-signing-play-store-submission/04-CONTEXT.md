# Phase 4: Signing + Play Store Submission - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a signed release AAB with production ad IDs and submit the app to Google Play Store.

What this phase delivers:
- Custom app icon (Python Pillow script → 512×512, 1024×500 feature graphic, all mipmap densities) — META-04
- Release keystore generated, stored outside repo, backed up to 2 locations — SIGN-01
- Signing config via `keystore.properties` (not hardcoded) — SIGN-02
- `*.jks` added to `.gitignore` — SIGN-03
- Release AAB builds cleanly via `gradlew bundleRelease` — SIGN-04
- Enrolled in Google Play App Signing on first submission — SIGN-05
- Privacy policy hosted at GitHub Pages HTTPS URL — STORE-01
- Data Safety form completed in Play Console — STORE-02
- IARC content rating completed — STORE-03
- Store listing complete: short description, long description, 2+ screenshots (manual), feature graphic — STORE-04
- Production AdMob banner unit ID replaces test ID in release build only — STORE-05
- App submitted to Google Play — STORE-06

What this phase does NOT deliver:
- iOS / App Store submission (out of scope for v1)
- Interstitial or rewarded ads (out of scope for v1)
- New gameplay features or UI changes

Already done from prior phases (no work needed):
- `applicationId`, `versionCode 1`, `versionName "1.0"` already set in `android/app/build.gradle` — META-01 ✓
- `compileSdkVersion 36`, `targetSdkVersion 36` already set in `android/variables.gradle` — META-02 ✓ (exceeds requirement of 35)
- `app_name = "Simon Memory Game"` already in `strings.xml` — META-03 ✓
- Production AdMob App ID `ca-app-pub-4227443066128564~6206781899` already in `strings.xml`

</domain>

<decisions>
## Implementation Decisions

### App Icon (META-04)
- **D-01:** Generate app icon using a **Python Pillow script** — no existing icon asset. Script is committed to the repo for reproducibility.
- **D-02:** Icon style: **4 colored quadrants** — green (top-left), red (top-right), yellow (bottom-left), blue (bottom-right) on dark background (`#0f172a`, matching the game's slate-900). Classic Simon board layout, immediately recognizable.
- **D-03:** Python script generates ALL required assets in one run:
  - `512×512` PNG — Play Store listing icon
  - `1024×500` PNG — Play Store feature graphic (required)
  - Mipmap densities: mdpi (48px), hdpi (72px), xhdpi (96px), xxhdpi (144px), xxxhdpi (192px) — both `ic_launcher.png` and `ic_launcher_round.png`
- **D-04:** Screenshots captured **manually from the physical Android device** — cannot be generated; must show real gameplay. Plan includes a checklist of what to capture (gameplay sequence running, game-over state).

### Privacy Policy (STORE-01)
- **D-05:** Host on **GitHub Pages on this repo** — plan includes creating `docs/privacy-policy.html` and enabling GitHub Pages from the `docs/` folder.
  URL pattern: `https://{github-username}.github.io/SimonGame/privacy-policy.html`
  Planner should determine the GitHub username from git remote config (`git remote get-url origin`).
- **D-06:** Content scope: **AdMob data collection only.** Policy states: app collects no personal data itself; Google AdMob collects device identifiers to serve ads; GDPR consent dialog shown for EEA/UK users. Link to Google's AdMob privacy policy included.

### Production AdMob Banner Unit ID (STORE-05)
- **D-07:** User has the production banner unit ID ready — it will be provided at plan execution time. Plan uses `YOUR_PRODUCTION_BANNER_UNIT_ID` as placeholder.
- **D-08:** **Build-type switching** — debug build variant uses the Google test banner ID (`ca-app-pub-3940256099942544/6300978111`); release build variant uses the production ID. Implemented via Gradle `resValue` or `buildConfigField` in the `release` block of `android/app/build.gradle`. Zero risk of shipping test IDs to the store.
- **D-09:** `initializeForTesting` in `src/main.tsx` must change from `true` (Phase 3) to `false` in the release build. Can be paired with the build-type switch (D-08) or handled via a separate `BuildConfig` constant.
- **D-10:** Required before execution: configure the GDPR consent form in AdMob console → Privacy & messaging (needed for Play Store EEA compliance). This was flagged as a prerequisite in Phase 3's final summary.

### Signing Config (SIGN-01 → SIGN-04)
- **D-11:** Credentials stored in **`keystore.properties`** file at project root (NOT committed to git). File holds: `storeFile`, `storePassword`, `keyAlias`, `keyPassword`. `android/app/build.gradle` reads from this file via `Properties`. `keystore.properties` added to `.gitignore`.
- **D-12:** Keystore file (`.jks`) stored **outside the project directory**: `C:\Users\omerb\keystores\simon-release.jks`. Completely separate from git repo — no risk of accidental commit even if `.gitignore` is misconfigured.
- **D-13:** Backup strategy: copy `simon-release.jks` + `keystore.properties` (with passwords) to **local drive + cloud storage** (Google Drive or OneDrive, private folder). This is a required manual step documented in the plan — must complete before moving to store submission.

### Claude's Discretion
- Exact Gradle `resValue` vs. `buildConfigField` syntax for injecting banner unit IDs per build type.
- Whether `initializeForTesting` uses a `BuildConfig` boolean or a separate `resValue` string constant.
- Exact HTML structure and styling of the privacy policy page.
- Foreground vs. background layer setup for adaptive icon XML (`ic_launcher.xml` in `mipmap-anydpi-v26/`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Goals
- `.planning/REQUIREMENTS.md` §Phase 4 — Signing + Play Store Submission — 16 requirements: META-01 through STORE-06
- `.planning/ROADMAP.md` §Phase 4: Signing + Play Store Submission — goal statement and 5 success criteria

### Source Files to Modify
- `android/app/build.gradle` — ADD: signing config block reading from `keystore.properties`; ADD: `resValue` or `buildConfigField` for banner unit ID per build type; already has `versionCode 1`, `versionName "1.0"`, `applicationId` — do NOT change those
- `android/variables.gradle` — already has `compileSdkVersion 36` / `targetSdkVersion 36` — do NOT change
- `android/app/src/main/res/values/strings.xml` — already has `app_name`, `admob_app_id` — no changes needed here
- `src/main.tsx` — UPDATE: `initializeForTesting` from `true` to `false` (or tie to BuildConfig)

### New Files to Create
- `android/keystore.properties` — signing credentials (added to `.gitignore`; NOT committed)
- `docs/privacy-policy.html` — privacy policy page for GitHub Pages
- `scripts/generate_icon.py` — Python Pillow script generating all icon assets

### Mipmap Files to Replace
- `android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` — replace default Capacitor icons with Simon-themed ones
- `android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher_round.png` — same (round variant)
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — adaptive icon XML (foreground + background layers)

### Prior Phase Artifacts
- `.planning/phases/03-admob-integration/03-CONTEXT.md` — D-07 (test banner unit ID), D-08 (production banner ID in Phase 4), D-09 (`initializeForTesting: true` → Phase 4 changes to `false`)
- `.planning/phases/03-admob-integration/03-03-SUMMARY.md` — Phase 3 final state; notes GDPR form prerequisite for Phase 4

### Build Config
- `android/variables.gradle` — SDK versions (compileSdk 36, targetSdk 36, minSdk 24)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `android/app/build.gradle` — already has `applicationId`, `versionCode`, `versionName`, `buildTypes.release` block. Signing config slots into the existing `release` block.
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — adaptive icon XML exists; planner updates foreground/background layers to point to new assets.
- `src/main.tsx` — `initializeForTesting: true` on line ~20 (Phase 3 IIFE). One-line change to `false` for release.
- `window.__admobReady` guard pattern (from Phase 3) — no changes needed; production IDs work with the same guard.

### Established Patterns
- `@string/admob_app_id` indirection in `AndroidManifest.xml` — keeps IDs in `strings.xml` for cleaner environment switching. The same pattern does NOT apply to the banner unit ID because that changes per build type (handled via Gradle `resValue` in `build.gradle`).
- `Capacitor.isNativePlatform()` guard — all AdMob calls already gated; no changes needed.
- JAVA_HOME must point to Java 21 (`C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot`) for Gradle builds — established in Phase 2.

### Integration Points
- `android/app/build.gradle` `buildTypes.release` — where signing config and production ID injection both land.
- `docs/` directory (new) — GitHub Pages source for privacy policy.
- `scripts/` directory (new) — Python icon generation script.

</code_context>

<specifics>
## Specific Ideas

- Keystore location: `C:\Users\omerb\keystores\simon-release.jks` — outside the project directory entirely.
- `keystore.properties` path referenced in `build.gradle` should use a path relative to the root project or an absolute path that `build.gradle` reads via `file(rootProject.file('keystore.properties'))`.
- The Python icon script should output a `assets/icons/` directory with all generated PNGs labeled by size, then copy to the correct mipmap directories. Keep the source 1024×1024 master PNG in `assets/icons/` for future re-generation.
- Play Store feature graphic (1024×500) can reuse the same 4-quadrant design with the app name "Simon Memory Game" as text overlay in a clean font.
- The GDPR consent form in AdMob console → Privacy & messaging must be configured BEFORE building the release AAB. Without it, EEA users will see no consent dialog (Play Store requirement).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Signing + Play Store Submission*
*Context gathered: 2026-05-16*
