---
plan: 04-06
status: complete
completed: 2026-05-16
---

# Plan 04-06 Summary — Release AAB Build

## What was done
- Ran full release build pipeline: `npm run build` → `npx cap sync android` → `gradlew bundleRelease`
- Verified test banner ID NOT in `dist/` (production ID ca-app-pub-4227443066128564/6099199595 baked in correctly)
- Signed release AAB built at `android/app/build/outputs/bundle/release/app-release.aab` (6.46 MB)
- Built release APK via `gradlew assembleRelease` for device verification
- Resolved INSTALL_FAILED_UPDATE_INCOMPATIBLE: uninstalled debug APK before installing release APK
- Release app verified on emulator: launches correctly, Simon pads work, banner ad loads
- 2 Play Store screenshots captured at `C:\Users\omerb\OneDrive\תמונות\SimonScreenShots`

## Key facts for downstream plans
- AAB path: `android/app/build/outputs/bundle/release/app-release.aab` (6.46 MB)
- Screenshots location: `C:\Users\omerb\OneDrive\תמונות\SimonScreenShots`
- Store listing icon: `assets/icons/simon-icon-512.png`
- Feature graphic: `assets/icons/feature-graphic.png`
- This AAB is uploaded to Play Console in Plan 04-08

## Requirements satisfied
- SIGN-04: `gradlew bundleRelease` succeeds; signed AAB exists at expected path ✓
- META-04: Simon icon confirmed in app drawer ✓
- STORE-04 partial: screenshots captured; upload to Play Console in Plan 04-08 ✓
