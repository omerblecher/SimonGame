# Architecture Research — Capacitor Android

**Project:** Simon Game — React 19 + TypeScript 5.9 + Vite 7 wrapped via Capacitor
**Researched:** 2026-05-15
**Overall confidence:** HIGH for structure and pipeline (Capacitor 6.x stable patterns); MEDIUM for exact Gradle/SDK version numbers (verify against current Capacitor release notes before running)

---

## Project Structure

### What `npx cap add android` Creates

Running `npx cap add android` from the project root creates a top-level `android/` directory alongside `src/`, `public/`, etc. The full tree:

```
SimonGame/
├── android/                          ← entire Android native project
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml   ← permissions, app metadata, AdMob app ID
│   │   │       ├── assets/
│   │   │       │   └── public/           ← WEB BUILD LANDS HERE (dist/ is copied here)
│   │   │       ├── java/
│   │   │       │   └── com/your/packageid/
│   │   │       │       └── MainActivity.java  ← extends BridgeActivity; usually untouched
│   │   │       └── res/
│   │   │           ├── drawable/         ← splash screen XML / vector drawables
│   │   │           ├── mipmap-*/         ← launcher icons (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi)
│   │   │           ├── values/
│   │   │           │   ├── strings.xml   ← app name string resource
│   │   │           │   └── styles.xml    ← splash screen theme
│   │   │           └── xml/
│   │   │               └── file_paths.xml  ← Capacitor file provider config
│   │   └── build.gradle                  ← per-app build config, signingConfigs, versionCode
│   ├── capacitor.settings.gradle         ← Capacitor Gradle plugin reference
│   ├── build.gradle                      ← top-level Gradle config (Gradle plugin version)
│   ├── gradle/
│   │   └── wrapper/
│   │       └── gradle-wrapper.properties ← Gradle distribution version pinned here
│   ├── gradlew                           ← Unix Gradle wrapper
│   ├── gradlew.bat                       ← Windows Gradle wrapper
│   └── variables.gradle                  ← SDK versions & library versions (KEY FILE)
├── capacitor.config.ts                   ← Capacitor root config (appId, appName, webDir)
├── src/
├── public/
└── package.json
```

### Where the Web Build Output Goes

`cap sync` (or `cap copy`) takes whatever directory `webDir` points to in `capacitor.config.ts` and copies its entire contents into `android/app/src/main/assets/public/`.

For this project, Vite outputs to `dist/` by default. The config must declare:

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.simongame',    // reverse-domain; must be unique on Play Store
  appName: 'Simon Memory',
  webDir: 'dist',                     // matches Vite's output directory
};

export default config;
```

After `npm run build`, `android/app/src/main/assets/public/` will contain:
- `index.html`
- `assets/` (Vite-hashed JS/CSS bundles)
- any files from `public/` (vite.svg, etc.)

The Capacitor bridge JS (`capacitor.js`, plugin JS) is automatically injected into this folder by `cap sync`.

### Files to Modify for App Metadata

| What to Change | File to Edit | Notes |
|----------------|-------------|-------|
| App name (display name on device) | `android/app/src/main/res/values/strings.xml` | Change `<string name="app_name">` |
| Package / Application ID | `android/app/build.gradle` → `applicationId` | Must match `capacitor.config.ts` `appId` |
| App version number (user-visible) | `android/app/build.gradle` → `versionName` | e.g. `"1.0"` |
| App version code (integer for Play) | `android/app/build.gradle` → `versionCode` | Increment on every Play Store upload |
| Permissions (Internet, AdMob) | `android/app/src/main/AndroidManifest.xml` | Add `<uses-permission>` and AdMob meta-data |
| Launcher icon | `android/app/src/main/res/mipmap-*/` | Replace `ic_launcher.png` in each density folder |
| Splash screen image | `android/app/src/main/res/drawable/` + `styles.xml` | Use `@capacitor/splash-screen` plugin or manual |
| Compile/target SDK, min SDK | `android/variables.gradle` | Centralised; Capacitor defaults are already reasonable |
| AdMob App ID | `android/app/src/main/AndroidManifest.xml` | Required meta-data tag (see AdMob section) |

### Standard Application ID Format

Format: `com.<developer>.<appname>` — all lowercase, reverse-domain notation.
Example for this project: `com.omerblecher.simongame`

Rules enforced by Play Store:
- Must be unique across all Play Store apps (permanent once published)
- Only lowercase letters, numbers, and dots
- Each segment must start with a letter
- Cannot be changed after first publish — choose carefully

---

## Build Pipeline

### Full Build Sequence

Every code change requires this full sequence to get updated web code into the Android app:

```
Step 1: Build the web app
  npm run build
  → Runs: tsc && vite build
  → Output: dist/ directory (index.html + hashed assets)

Step 2: Sync web build into Android project
  npx cap sync android
  → Copies dist/ → android/app/src/main/assets/public/
  → Updates Capacitor plugins (downloads/updates native plugin code)
  → Updates capacitor.settings.gradle if plugins changed

  (Use `npx cap copy android` instead of sync if plugins haven't changed — faster)

Step 3a: Open in Android Studio (for device testing / GUI signing)
  npx cap open android
  → Opens android/ as a Gradle project in Android Studio
  → Run on emulator or connected device from there

Step 3b: Build release AAB from command line (preferred for CI/release)
  cd android
  ./gradlew bundleRelease        (on Windows: gradlew.bat bundleRelease)
  → Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Shorthand Script Additions to package.json

Add these convenience scripts:

```json
{
  "scripts": {
    "build:android": "npm run build && npx cap sync android",
    "open:android": "npx cap open android",
    "bundle:release": "npm run build && npx cap sync android && cd android && gradlew bundleRelease"
  }
}
```

### Release AAB vs Debug APK

| Format | Use Case | Signing |
|--------|----------|---------|
| `.apk` (debug) | Local device testing | Auto-signed with debug keystore |
| `.aab` (release) | Play Store submission | Must be signed with release keystore |
| `.apk` (release) | Sideloading / direct install | Must be signed with release keystore |

Play Store requires `.aab` format since August 2021 for new apps.

---

## Signing & Keystore

### Why a Keystore Is Required

Google Play requires every release AAB to be signed with a private keystore. The same keystore must be used for all future updates to the same app — losing the keystore means you cannot update the app on Play Store (you would have to publish as a new app with a new package ID).

### Creating a Keystore (one-time setup)

Use the `keytool` command bundled with the JDK (installed with Android Studio):

```bash
keytool -genkey -v \
  -keystore simon-release-key.jks \
  -alias simon-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Prompts will ask for:
- Keystore password (store this securely — cannot be recovered)
- Key alias password (can be same as keystore password)
- Distinguished name fields (name, org, city, country — can be informal for indie apps)

On Windows use `keytool` from Android Studio's bundled JDK path, or from any installed JDK.

### Storing the Keystore Safely

| What | Where |
|------|-------|
| `simon-release-key.jks` file | Never commit to Git. Store in a password manager or secure file storage. |
| Keystore password | Password manager (1Password, Bitwarden, etc.) |
| Key alias name | Document in `.planning/` or password manager notes |
| Key alias password | Password manager |

Add to `.gitignore`:
```
*.jks
*.keystore
```

### Configuring Gradle to Sign the Release Build

Edit `android/app/build.gradle` to add signing config:

```groovy
android {
    // ... existing config ...

    signingConfigs {
        release {
            storeFile file("../../simon-release-key.jks")   // path relative to app/build.gradle
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "yourpassword"
            keyAlias "simon-key"
            keyPassword System.getenv("KEY_PASSWORD") ?: "yourkeypassword"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Using environment variables (`System.getenv(...)`) keeps passwords out of committed code. The `?: "fallback"` Groovy syntax provides a local fallback for development.

### Command-Line Release Build (no Android Studio GUI needed)

```powershell
# From project root (Windows PowerShell)
npm run build
npx cap sync android
cd android
$env:KEYSTORE_PASSWORD = "yourpassword"
$env:KEY_PASSWORD = "yourkeypassword"
.\gradlew.bat bundleRelease
```

Output AAB location: `android\app\build\outputs\bundle\release\app-release.aab`

Upload this file directly to Play Console → Production → Create new release.

### Play App Signing (Recommended)

Google Play offers "Play App Signing" — you upload your keystore to Google once, and Google re-signs your AAB with a Google-managed key for distribution. Benefits:
- If you lose your keystore, Google can still distribute the app
- Smaller APKs delivered to users via APK splits
- Upload key (what you sign with locally) can be rotated

Enrollment happens in Play Console → Setup → App signing. Strongly recommended for new apps.

### Current Gradle and SDK Versions

These are the values Capacitor 6.x scaffolds by default (verify against `android/variables.gradle` after running `cap add android` — Capacitor updates these periodically):

| Variable | Typical Capacitor 6 Default | Notes |
|----------|---------------------------|-------|
| Gradle wrapper | 8.2.1 | In `gradle-wrapper.properties` |
| Android Gradle Plugin | 8.2.x | In top-level `build.gradle` |
| `compileSdkVersion` | 34 | In `variables.gradle` |
| `targetSdkVersion` | 34 | In `variables.gradle` |
| `minSdkVersion` | 22 | Covers ~99% of active Android devices |
| `sourceCompatibility` | JavaVersion.VERSION_17 | |

CONFIDENCE NOTE: These version numbers were accurate for Capacitor 6 as of mid-2025. Run `npx cap doctor` after setup to see what was actually scaffolded, and check `android/variables.gradle` — it is the single source of truth for this project's SDK versions.

---

## AdMob Integration Points

### Plugin to Use

`@capacitor-community/admob` is the standard community plugin for AdMob in Capacitor apps. It wraps the native Google Mobile Ads SDK for Android.

Install:
```bash
npm install @capacitor-community/admob
npx cap sync android
```

### Where Initialization Code Goes

**`capacitor.config.ts`** — static plugin config (not secret values):
```typescript
const config: CapacitorConfig = {
  appId: 'com.omerblecher.simongame',
  appName: 'Simon Memory',
  webDir: 'dist',
  plugins: {
    AdMob: {
      // Optional: testing mode flag — does NOT go here (use initializeAdMob options)
    },
  },
};
```

**`AndroidManifest.xml`** — AdMob App ID (required by Google Mobile Ads SDK, app crashes without it):
```xml
<manifest>
  <application>
    <!-- Existing content -->
    <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" />  <!-- your real App ID -->
  </application>
</manifest>
```

**`src/main.tsx`** — AdMob initialization before React mounts (runs once at app start):
```typescript
import { AdMob } from '@capacitor-community/admob';

// Initialize AdMob before React renders — ensures SDK is ready
async function initAdMob() {
  await AdMob.initialize({
    testingDevices: ['YOUR_DEVICE_ID'],  // optional: whitelist test device
    initializeForTesting: false,          // true only during development
  });
}

// Call before rendering React tree
void initAdMob();

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Alternatively, initialize inside `App.tsx` using a `useEffect` with an empty dependency array — but `main.tsx` is cleaner because it keeps AdMob setup outside the React component tree.

**`src/App.tsx`** — banner ad display logic (inside the component):
```typescript
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Inside App component, in a useEffect:
useEffect(() => {
  const showBanner = async () => {
    const options: BannerAdOptions = {
      adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',  // your banner unit ID
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,  // set true during development
    };
    await AdMob.showBanner(options);
  };
  void showBanner();

  return () => {
    void AdMob.removeBanner();
  };
}, []);
```

### How the Banner Overlay Interacts with React Web Content

This is the most architecturally important AdMob consideration:

**The banner is a native Android View, not a DOM element.** It is rendered by the Google Mobile Ads SDK as a native layer that sits on top of the Capacitor WebView. It is not part of the React virtual DOM and cannot be styled with CSS.

**The overlap problem:** By default, the native banner will render over the bottom of the WebView, obscuring React content behind it. The standard banner height is 50dp (BANNER size) or 90dp (LARGE_BANNER).

**The fix — add bottom padding to the web content:** The web layout must reserve space at the bottom equal to the banner height. This is done with CSS, not JavaScript:

```css
/* In src/style.css — add safe area for banner */
body {
  padding-bottom: env(safe-area-inset-bottom, 0px); /* existing safe-area handling */
}

/* Add a fixed bottom spacer that clears the banner */
.banner-safe-area {
  height: 60px;  /* slightly more than 50dp standard banner, accounts for density */
}
```

Or in `App.tsx`, add a spacer div at the bottom of the layout:
```tsx
<div className="min-h-screen ...">
  {/* ... game content ... */}
  <div className="h-[60px] shrink-0" aria-hidden="true" /> {/* banner spacer */}
</div>
```

The `@capacitor-community/admob` plugin also fires events (`admob.banner.ad.loaded`, etc.) that include the banner height in pixels — these can be used to dynamically set the padding if exact sizing matters.

**Key constraint for Simon Game layout:** The current layout uses `min-h-screen flex items-center justify-center` in App.tsx. With a bottom banner, the vertical centering will be optically off (center of viewport ≠ center of available space above banner). The spacer div approach corrects this by making the viewport effectively shorter for layout purposes.

### AdMob Ad Unit IDs vs App ID

| ID Type | Where It Comes From | Where It Goes |
|---------|---------------------|---------------|
| AdMob App ID | AdMob Console → App → App settings | `AndroidManifest.xml` meta-data |
| Banner Ad Unit ID | AdMob Console → App → Ad units → Banner | `AdMob.showBanner()` call in code |

Use Google's test IDs during development:
- Test App ID: `ca-app-pub-3940256099942544~3347511713`
- Test Banner Unit ID: `ca-app-pub-3940256099942544/6300978111`

Replace with real IDs only in the production release build.

---

## Summary: Files Touched Per Phase

| Phase | Files Modified |
|-------|---------------|
| Capacitor setup | `capacitor.config.ts` (new), `package.json` (scripts + deps), `android/` (generated) |
| App metadata | `android/app/src/main/res/values/strings.xml`, `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml` |
| Icons & splash | `android/app/src/main/res/mipmap-*/ic_launcher*.png`, `android/app/src/main/res/drawable/` |
| Keystore / signing | `android/app/build.gradle` (signingConfigs), `.gitignore`, `simon-release-key.jks` (outside repo) |
| AdMob | `android/app/src/main/AndroidManifest.xml`, `src/main.tsx`, `src/App.tsx`, `src/style.css` |
| Release build | `android/app/build.gradle` (versionCode bump), `gradlew bundleRelease` command |

---

*Confidence: HIGH for Capacitor project structure, file locations, build commands, keystore workflow, and AdMob architecture — these are stable patterns in Capacitor 5/6. MEDIUM for exact Gradle/AGP/SDK version numbers — verify against `android/variables.gradle` after scaffolding.*
