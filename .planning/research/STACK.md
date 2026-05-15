# Stack Research — Capacitor + AdMob

**Researched:** 2026-05-15
**Research method:** Training data only (Bash, WebSearch, WebFetch all blocked in this environment).
**CRITICAL:** All version numbers below are from training data with cutoff August 2025.
Before installing anything, run `npm show <package> version` to confirm current latest.

---

## Recommended Stack

### Capacitor Core Packages

| Package | Version (verify) | Role | Install as |
|---------|-----------------|------|-----------|
| `@capacitor/core` | ^7.x | Runtime bridge between web and native | dependency |
| `@capacitor/cli` | ^7.x | CLI tool: `npx cap ...` commands | devDependency |
| `@capacitor/android` | ^7.x | Android platform layer (generates `android/` project) | dependency |

> Capacitor 7 was the current major release as of mid-2025. All three packages must be on the same major version — mismatches cause build failures.

### AdMob Plugin

| Package | Version (verify) | Role | Install as |
|---------|-----------------|------|-----------|
| `@capacitor-community/admob` | ^6.x | AdMob SDK integration (banners, interstitials, rewarded) | dependency |

> `@capacitor-community/admob` is the canonical community plugin. It wraps Google's native AdMob SDK on Android. Version 6.x tracks Capacitor 6; a v7-compatible release may exist — **verify against Capacitor 7 compatibility before installing**.

### Vite Build Output Configuration

| Item | Value | Purpose |
|------|-------|---------|
| `vite.config.ts` `base` | `'/'` (already default) | Required: Capacitor serves from root |
| `vite.config.ts` `build.outDir` | `'dist'` (already default) | Capacitor's `webDir` must match this |
| `capacitor.config.ts` `webDir` | `'dist'` | Points Capacitor at Vite's output |

No Vite plugin for Capacitor is needed — Capacitor reads the static build output directly.

---

## Key Versions

### Android Toolchain

| Tool | Recommended Version | Notes |
|------|---------------------|-------|
| Android Studio | Ladybug (2024.2.x) or newer | Required for correct Gradle/AGP support |
| Android Gradle Plugin (AGP) | 8.5.x or 8.7.x | Capacitor 7 generates projects targeting AGP 8.x |
| Gradle wrapper | 8.9 or 8.11 | Set by Capacitor's generated `gradle/wrapper/gradle-wrapper.properties` |
| Android compile SDK | 35 (Android 15) | Capacitor 7 targets SDK 35 |
| Android min SDK | 23 (Android 6.0) | Capacitor 7 default minSdk |
| Android target SDK | 35 | Required for Play Store submissions in 2025 |
| Java / JDK | 17 (LTS) | Android Studio ships its own JDK 17; use that |
| Build Tools | 35.0.0 | Installed via Android Studio SDK Manager |

### Node.js

| Requirement | Value | Notes |
|-------------|-------|-------|
| Minimum Node.js | 18.x LTS | Capacitor 7 requires Node 18+; Vite 7 also requires 18+ |
| Recommended Node.js | 20.x LTS or 22.x LTS | 20 is most widely tested against Capacitor in 2025 |

### Google Mobile Ads SDK (Android)

The `@capacitor-community/admob` plugin automatically adds the Google Mobile Ads SDK as a Gradle dependency — you do not add it manually. As of mid-2025 the plugin pulls in:

| SDK | Version pulled by plugin |
|-----|--------------------------|
| `play-services-ads` | 23.x (verify in plugin's `build.gradle`) |

AdMob **requires** your `AndroidManifest.xml` to declare your AdMob App ID:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

---

## AdMob Banner Ad Sizes

| Size Constant | Dimensions | Best For |
|---------------|-----------|----------|
| `BANNER` | 320x50 dp | Standard — works on all phones |
| `ADAPTIVE_BANNER` | Full width x auto-height | Recommended for 2025: fills width, adapts height |
| `LARGE_BANNER` | 320x100 dp | More visible, still non-intrusive |
| `SMART_BANNER` | screen-width x 32/50/90 dp | Deprecated — replaced by ADAPTIVE_BANNER |

**Recommendation:** Use `ADAPTIVE_BANNER` anchored to the bottom of the screen. It fills the screen width automatically and Google's own 2025 guidance promotes it over fixed-size banners. For a 480px-wide phone it renders at approximately 320x50; wider tablets get a taller banner proportionally.

Position: `BannerAdPosition.BOTTOM_CENTER` — keeps ads out of gameplay area.

---

## Rationale

### Why Capacitor (not React Native, not TWA)

- **Preserves codebase**: React 19 + Tailwind + Vite code runs as-is inside Capacitor's WebView. Zero rewrite.
- **TWA alternative**: Trusted Web Activity requires a live HTTPS URL and doesn't easily support native AdMob SDK calls. Capacitor provides a native plugin bridge that makes real AdMob SDK calls.
- **React Native**: Would require rewriting all UI components as React Native primitives. Rejected by project constraints.

### Why `@capacitor-community/admob` over alternatives

- It is the only actively-maintained AdMob plugin in the Capacitor ecosystem as of 2025.
- Alternatives such as `capacitor-admob` (cordova shim) and direct Cordova plugins are not compatible with Capacitor 7's plugin API.
- The `@capacitor-community/` namespace is the semi-official community umbrella — plugins here have Capacitor team awareness even if not first-party.

### Why ADAPTIVE_BANNER

- Google deprecated SMART_BANNER and recommends ADAPTIVE_BANNER as its replacement.
- Fills the full device width for better fill rates and revenue.
- No hardcoded pixel dimensions required — the SDK measures the container.

### Why Android SDK 35 / minSdk 23

- Google Play Store requires `targetSdkVersion` >= 35 for new app submissions in 2025.
- minSdk 23 covers Android 6.0+ (~99% of active Android devices as of 2025).
- Capacitor 7 sets these defaults in its generated `android/variables.gradle`.

### Vite + Capacitor compatibility

Capacitor does not care about the frontend build tool — it consumes the static `dist/` output. Vite 7 produces standard ES module bundles that WebView (Chromium) handles correctly. No special Vite config needed beyond ensuring `build.outDir = 'dist'` (already the default).

**Web Audio API in Android WebView**: The existing Web Audio API usage (`AudioContext`, `OscillatorNode`) works in Android's Chromium-based WebView on API 23+. Audio playback requires a user gesture to start the `AudioContext` — the existing button-tap interaction satisfies this requirement naturally.

### React 19 compatibility

Capacitor is framework-agnostic at the runtime level. React 19 runs in WebView the same as in a desktop browser. No known incompatibilities as of August 2025.

---

## Installation Command Reference

```bash
# 1. Verify latest versions first
npm show @capacitor/core version
npm show @capacitor/cli version
npm show @capacitor/android version
npm show @capacitor-community/admob version

# 2. Install Capacitor
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

# 3. Initialize Capacitor (run once, in project root)
npx cap init "Simon Game" "com.yourname.simongame" --web-dir dist

# 4. Add Android platform
npx cap add android

# 5. Install AdMob plugin
npm install @capacitor-community/admob

# 6. After every Vite build, sync web assets to Android project
npm run build
npx cap sync android

# 7. Open in Android Studio
npx cap open android
```

---

## Compatibility Risk: Capacitor 7 + @capacitor-community/admob

**This is the highest-risk dependency pairing.** The community AdMob plugin tracks Capacitor major versions but lags by weeks to months. Before committing to Capacitor 7:

1. Check the plugin's GitHub releases: `https://github.com/capacitor-community/admob/releases`
2. Confirm a v7-compatible release exists (the plugin's `peerDependencies` should list `@capacitor/core@^7`)
3. If only Capacitor 6 is supported, pin Capacitor to v6 for the entire project — do not mix majors.

**Fallback**: If `@capacitor-community/admob` v7 does not exist at time of implementation, use Capacitor 6 (`@capacitor/core@^6`, `@capacitor/android@^6`, `@capacitor/cli@^6`). Capacitor 6 also meets all Play Store requirements.

---

## Confidence

| Area | Confidence | Reason |
|------|-----------|--------|
| Capacitor package names (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`) | HIGH | Stable since Capacitor 3; naming convention is fixed |
| Capacitor major version being 7.x | MEDIUM | Was current as of mid-2025 training data; verify with `npm show @capacitor/core version` |
| `@capacitor-community/admob` as the correct plugin | HIGH | Only maintained AdMob plugin in the Capacitor ecosystem; stable choice since 2021 |
| AdMob plugin version compatible with Capacitor 7 | LOW | Could still be on v6 (Capacitor 6 compat) at time of implementation — must check GitHub releases |
| ADAPTIVE_BANNER recommendation | HIGH | Google's official current guidance; deprecated SMART_BANNER in 2020 |
| Android target SDK 35 requirement | HIGH | Google Play policy documented for 2025 submissions |
| minSdk 23 default | HIGH | Capacitor's documented default; widely confirmed |
| JDK 17 requirement | HIGH | Android Gradle Plugin 8.x mandates JDK 17+ |
| Node.js 18+ requirement | HIGH | Vite 7 and Capacitor 7 both require Node 18+ |
| Android Studio "Ladybug" version | MEDIUM | Was current Android Studio release in mid-2025; a newer release may exist |
| Web Audio API works in Android WebView | HIGH | Chromium WebView supports Web Audio API since API level 21 |
| React 19 + Capacitor compatibility | HIGH | Capacitor is framework-agnostic; React version is irrelevant to it |
| Vite 7 + Capacitor compatibility | HIGH | Capacitor reads static build output; build tool version is irrelevant |

---

## Verification Checklist (run before implementing)

```bash
# Confirm current latest versions
npm show @capacitor/core version         # Should be 7.x or 6.x
npm show @capacitor/android version      # Must match core's major
npm show @capacitor/cli version          # Must match core's major
npm show @capacitor-community/admob version  # Check peerDeps match Capacitor version

# Check AdMob plugin Capacitor compatibility
# Visit: https://github.com/capacitor-community/admob#readme
# Look for: "Capacitor 7" or "peerDependencies": {"@capacitor/core": "^7.x.x"}

# Confirm Play Store target SDK requirement
# Visit: https://developer.android.com/google/play/requirements/target-sdk
```
