# Requirements — Simon Game Android Release

**Version:** v1
**Created:** 2026-05-15

---

## v1 Requirements

### Phase 1 — Web Fixes

- [x] **UI-01**: Active pad shows full brightness + glow during sequence playback (`brightness-125`, glow shadow visible). `opacity-40` is only applied to *inactive* pads.
- [x] **UI-02**: Active pad does not receive the HTML `disabled` attribute during sequence playback (prevents UA stylesheet dimming).
- [x] **AUDIO-01**: `AudioContext.resume()` is awaited in all gesture handlers before any tone is played. `AudioContext` is lazy-created on first user gesture, not at component mount.
- [x] **TOUCH-01**: All pad buttons have `touch-action: manipulation` to eliminate 300ms tap delay on Android.
- [x] **VIEWPORT-01**: `<meta name="viewport">` includes `user-scalable=no` and `viewport-fit=cover`.

### Phase 2 — Capacitor Android Baseline

- [ ] **CAP-01**: Capacitor version compatibility with `@capacitor-community/admob` verified before installation (`npm show @capacitor-community/admob peerDependencies`).
- [ ] **CAP-02**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` installed at the same major version.
- [ ] **CAP-03**: `capacitor.config.ts` configured with `appId` (e.g. `com.omerblecher.simongame`), `appName`, and `webDir: 'dist'`.
- [ ] **CAP-04**: Android project scaffolded via `npx cap add android`.
- [ ] **CAP-05**: `npm run build && npx cap sync android` pipeline works end-to-end.
- [ ] **CAP-06**: Game plays correctly on Android emulator or physical device (audio works, pads respond, no visual regressions).

### Phase 3 — AdMob Integration

- [ ] **ADM-01**: `@capacitor-community/admob` installed at version compatible with chosen Capacitor major.
- [ ] **ADM-02**: AdMob App ID declared as `<meta-data>` in `AndroidManifest.xml`.
- [ ] **ADM-03**: GDPR/UMP consent flow implemented before `AdMob.initialize()` is called.
- [ ] **ADM-04**: `AdMob.initialize()` is awaited in `main.tsx` before React renders.
- [ ] **ADM-05**: Banner ad displayed at bottom of screen using test ad unit ID during development.
- [ ] **ADM-06**: Bottom spacer/padding added to game layout so banner never obscures game pads (minimum 50dp gap between banner and nearest interactive element per AdMob policy).
- [ ] **ADM-07**: `bannerAdLoaded` event used to set bottom padding dynamically from actual banner height.
- [ ] **ADM-08**: Banner hidden/shown on app pause/resume via `appStateChange` listener.

### Phase 4 — Signing + Play Store Submission

- [ ] **META-01**: `applicationId`, `versionCode 1`, `versionName "1.0"` set in `android/app/build.gradle`.
- [ ] **META-02**: `targetSdkVersion 35` and `compileSdkVersion 35` set in `android/app/build.gradle`.
- [ ] **META-03**: App display name set in `android/app/src/main/res/values/strings.xml`.
- [ ] **META-04**: App icon (512×512 and mipmap density set) and splash screen configured.
- [ ] **SIGN-01**: Release keystore generated (`keytool -genkey`), backed up to at least two locations.
- [ ] **SIGN-02**: Signing config set in `build.gradle` using environment variables (keystore path/password not hardcoded).
- [ ] **SIGN-03**: `*.jks` added to `.gitignore`.
- [ ] **SIGN-04**: Release AAB builds cleanly via `gradlew bundleRelease`.
- [ ] **SIGN-05**: Enrolled in Google Play App Signing during first Play Console submission.
- [ ] **STORE-01**: Privacy policy hosted at a public HTTPS URL (covers AdMob data collection).
- [ ] **STORE-02**: Data Safety form in Play Console completed (declare AdMob device identifier collection).
- [ ] **STORE-03**: IARC content rating questionnaire completed (declare ads — expected rating: Everyone/3+).
- [ ] **STORE-04**: Store listing complete (short description, long description, 2+ screenshots, 1024×500 feature graphic).
- [ ] **STORE-05**: Production AdMob App ID and banner ad unit ID (from AdMob console) replace test IDs in release build.
- [ ] **STORE-06**: App submitted to Google Play and approved.

---

## v2 Requirements (Deferred)

- Interstitial ads between games — deferred; banner-only chosen for v1
- Rewarded ads for hints — deferred
- iOS / App Store deployment — deferred; Android-only for v1
- LocalStorage best-streak persistence — useful but not blocking v1
- Difficulty settings — out of scope for v1
- Sound mute toggle — out of scope for v1

---

## Out of Scope

- **iOS / App Store** — Android only; iOS would require Apple Developer Program enrollment
- **React Native rewrite** — Capacitor chosen to preserve existing React codebase
- **Interstitial / rewarded ads** — Banner-only; interstitials would require more invasive UX changes
- **Backend / multiplayer** — Single-player game, no server needed
- **Unit / E2E test suite** — Not blocking Play Store submission; deferred to v2

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| UI-01 | Phase 1 — Web Fixes | Pending |
| UI-02 | Phase 1 — Web Fixes | Pending |
| AUDIO-01 | Phase 1 — Web Fixes | Pending |
| TOUCH-01 | Phase 1 — Web Fixes | Pending |
| VIEWPORT-01 | Phase 1 — Web Fixes | Pending |
| CAP-01 | Phase 2 — Capacitor Android Baseline | Pending |
| CAP-02 | Phase 2 — Capacitor Android Baseline | Pending |
| CAP-03 | Phase 2 — Capacitor Android Baseline | Pending |
| CAP-04 | Phase 2 — Capacitor Android Baseline | Pending |
| CAP-05 | Phase 2 — Capacitor Android Baseline | Pending |
| CAP-06 | Phase 2 — Capacitor Android Baseline | Pending |
| ADM-01 | Phase 3 — AdMob Integration | Pending |
| ADM-02 | Phase 3 — AdMob Integration | Pending |
| ADM-03 | Phase 3 — AdMob Integration | Pending |
| ADM-04 | Phase 3 — AdMob Integration | Pending |
| ADM-05 | Phase 3 — AdMob Integration | Pending |
| ADM-06 | Phase 3 — AdMob Integration | Pending |
| ADM-07 | Phase 3 — AdMob Integration | Pending |
| ADM-08 | Phase 3 — AdMob Integration | Pending |
| META-01 | Phase 4 — Signing + Play Store Submission | Pending |
| META-02 | Phase 4 — Signing + Play Store Submission | Pending |
| META-03 | Phase 4 — Signing + Play Store Submission | Pending |
| META-04 | Phase 4 — Signing + Play Store Submission | Pending |
| SIGN-01 | Phase 4 — Signing + Play Store Submission | Pending |
| SIGN-02 | Phase 4 — Signing + Play Store Submission | Pending |
| SIGN-03 | Phase 4 — Signing + Play Store Submission | Pending |
| SIGN-04 | Phase 4 — Signing + Play Store Submission | Pending |
| SIGN-05 | Phase 4 — Signing + Play Store Submission | Pending |
| STORE-01 | Phase 4 — Signing + Play Store Submission | Pending |
| STORE-02 | Phase 4 — Signing + Play Store Submission | Pending |
| STORE-03 | Phase 4 — Signing + Play Store Submission | Pending |
| STORE-04 | Phase 4 — Signing + Play Store Submission | Pending |
| STORE-05 | Phase 4 — Signing + Play Store Submission | Pending |
| STORE-06 | Phase 4 — Signing + Play Store Submission | Pending |
