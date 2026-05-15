# Phase 3: User Setup Required

**Generated:** 2026-05-15
**Phase:** 03-admob-integration
**Status:** Incomplete

Complete these items before running the Android build in Plan 03-03. Claude automated all package installation, Android manifest configuration, and code changes — these items require human access to the AdMob console.

## Dashboard Configuration

- [ ] **Register Simon game in AdMob console**
  - Location: https://admob.google.com → Apps → Add App
  - Platform: Android
  - App name: Simon Memory Game
  - Package name: `com.otis.brooke.simon.game`
  - Result: You receive an App ID in format `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX` (note the tilde `~` separator — this distinguishes App ID from Ad Unit ID which uses `/`)

## Replace Placeholder

- [ ] **Update strings.xml with real AdMob App ID**
  - File: `android/app/src/main/res/values/strings.xml`
  - Find: `<string name="admob_app_id">YOUR_ADMOB_APP_ID</string>`
  - Replace: `YOUR_ADMOB_APP_ID` with your actual App ID (e.g., `ca-app-pub-1234567890123456~1234567890`)
  - Important: Keep the full `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX` format including the prefix

## Verification

After completing setup, verify the strings.xml update took effect:

```powershell
# Check the strings.xml contains your real App ID (not the placeholder)
Select-String -Path "android/app/src/main/res/values/strings.xml" -Pattern "admob_app_id"
```

Expected: Output should show your real App ID, not `YOUR_ADMOB_APP_ID`.

The build in Plan 03-03 will fail at Gradle compile time if the placeholder is still present (the AdMob SDK validates App ID format at runtime, but the `@string/admob_app_id` reference itself will compile regardless — the validation happens at app launch on device).

---

**Once all items complete:** Mark status as "Complete" at top of file.
