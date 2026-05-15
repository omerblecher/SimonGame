# Research Summary — Simon Game Android Release

**Synthesized:** 2026-05-15

## Executive Summary

Wrap the existing React 19 + TypeScript + Tailwind v4 + Vite 7 Simon game as a native Android app using Capacitor, monetize with a Google AdMob banner, and submit to the Play Store. The approach is sound — Capacitor treats the web app as a black box, Web Audio API works in Android's Chromium WebView, and `@capacitor-community/admob` is the only maintained AdMob plugin in the ecosystem. All work is additive.

One pre-existing UI bug must be fixed first: during sequence playback, `opacity-40` is applied to the active pad, making the glow invisible. Two-line fix, verifiable in the browser.

**Highest project risk:** Capacitor 7 / `@capacitor-community/admob` version pairing — the plugin may only support Capacitor 6. Resolve with one `npm show` command before installing anything.

---

## Recommended Stack

| Package | Version | Role |
|---------|---------|------|
| `@capacitor/core` | ^7.x (or ^6.x — see Open Questions) | Web-to-native bridge runtime |
| `@capacitor/cli` | same major as core | CLI (`npx cap` commands) — devDependency |
| `@capacitor/android` | same major as core | Generates and manages `android/` project |
| `@capacitor-community/admob` | ^6.x (verify Capacitor 7 compat) | AdMob banner, GDPR consent, lifecycle |

All three `@capacitor/*` packages must be on the same major version.

**Android toolchain minimums:** Java 17, AGP 8.x, Gradle 8.2+, compile SDK 35, target SDK 35, min SDK 23.

---

## UI Bug Fix

`isDisabled` is `true` during sequence playback, unconditionally applying `opacity-40` to every pad — including the active one. Fix is two lines in `App.tsx`:

```typescript
// BEFORE (broken):
const interactiveClasses = isDisabled
  ? 'cursor-not-allowed opacity-40'
  : 'cursor-pointer hover:brightness-110';

// AFTER (fixed):
const interactiveClasses = isDisabled
  ? isActive ? 'cursor-default' : 'cursor-not-allowed opacity-40'
  : 'cursor-pointer hover:brightness-110';
```

```tsx
// BEFORE:
<button disabled={isDisabled} ...>
// AFTER:
<button disabled={isDisabled && !isActive} ...>
```

`handlePadClick`'s existing early-return guard still blocks clicks during playback — removing `disabled` from the active pad creates no interaction vulnerability.

---

## Build Pipeline

```
1. npm run build              → Vite compiles → dist/
2. npx cap sync android       → Copies dist/ into android/app/src/main/assets/public/
3. cd android
   gradlew.bat bundleRelease  → android/app/build/outputs/bundle/release/app-release.aab
```

Add to `package.json`:
```json
"build:android": "npm run build && npx cap sync android"
```

Never run `npx cap sync` without a preceding `npm run build`.

---

## Key Risks

| # | Risk | Severity | Mitigation |
|---|------|---------|------------|
| 1 | AdMob plugin not yet compatible with Capacitor 7 | CRITICAL | Run `npm show @capacitor-community/admob peerDependencies` first; pin to Capacitor 6 if needed |
| 2 | AudioContext starts suspended on Android — silent audio | CRITICAL | `await audioCtxRef.current.resume()` in gesture handlers; lazy-create on first user gesture |
| 3 | Keystore loss = can never update app | CRITICAL | Back up to 2 locations; enroll in Google Play App Signing |
| 4 | GDPR/UMP consent must precede `AdMob.initialize()` | CRITICAL | Strict order: consent → initialize → showBanner |
| 5 | Privacy policy URL missing → Play Store rejection | CRITICAL | Host on GitHub Pages before first submission |
| 6 | `targetSdkVersion` below 35 → rejected at upload | CRITICAL | Set `targetSdkVersion 35` in `build.gradle` |
| 7 | Banner adjacent to game pads → AdMob policy violation | CRITICAL | 50dp minimum gap between banner and interactive elements |
| 8 | Test ad IDs shipped in production | CRITICAL | `process.env.NODE_ENV === 'production'` conditional |
| 9 | Java/Gradle version mismatch | CRITICAL (setup) | Verify `java -version` is 17+ before starting |
| 10 | 300ms tap delay on older Android | MODERATE | `touch-action: manipulation` on pad buttons |

---

## Phase Ordering

**Phase 1 — Web Fixes** (browser only, no native tooling)
- Fix active pad glow (two-line change)
- Fix `AudioContext` suspend handling (`await resume()`)
- Add `touch-action: manipulation` and viewport meta

**Phase 2 — Capacitor Android Baseline**
- Verify Capacitor/AdMob version compatibility first
- Install Capacitor, `npx cap add android`, configure `capacitor.config.ts`
- Confirm game plays on Android emulator

**Phase 3 — AdMob Integration**
- Install plugin, wire `AndroidManifest.xml`, implement consent → init → showBanner
- Add bottom spacer to layout
- Use test IDs throughout

**Phase 4 — Signing + Play Store Submission**
- Set `targetSdkVersion 35`, create keystore, configure signing
- Generate icons, screenshots, store listing
- Host privacy policy, complete Data Safety form and IARC rating
- Swap test → production ad IDs, build AAB, submit

---

## Open Questions — Run Before Phase 2

```bash
npm show @capacitor-community/admob peerDependencies
# If output shows ^6.x → install all Capacitor packages at v6
# If output shows ^7.x → install at v7

java -version   # Must be 17+
```

---

## Confidence

| Area | Level |
|------|-------|
| UI bug fix | HIGH — diagnosed from code |
| Capacitor package names + pipeline | HIGH |
| AdMob plugin choice | HIGH |
| Capacitor 7 / AdMob compat | LOW — must verify |
| Play Store SDK 35 requirement | HIGH |
| Privacy policy + Data Safety | HIGH |
| Web Audio on Android WebView | HIGH |
