# Phase 4: Signing + Play Store Submission — Research

**Researched:** 2026-05-16
**Domain:** Android release signing, Google Play Store submission, app icon generation, AdMob production config
**Confidence:** HIGH (core Gradle/signing), MEDIUM (Play Console submission flow), HIGH (Python Pillow icon generation)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** App icon generated via Python Pillow script — no existing icon asset. Script committed to repo.
- **D-02:** Icon style: 4 colored quadrants (green TL, red TR, yellow BL, blue BR) on `#0f172a` background. Classic Simon board layout.
- **D-03:** Script generates in one run: 512×512 PNG, 1024×500 feature graphic, mipmap densities (mdpi 48px, hdpi 72px, xhdpi 96px, xxhdpi 144px, xxxhdpi 192px) — both `ic_launcher.png` and `ic_launcher_round.png`.
- **D-04:** Screenshots captured manually from physical Android device (gameplay sequence running, game-over state).
- **D-05:** Privacy policy hosted on GitHub Pages from `docs/` folder on this repo. URL: `https://omerblecher.github.io/SimonGame/privacy-policy.html`
- **D-06:** Privacy policy content: AdMob data collection only. No personal data collected by app itself; Google AdMob collects device identifiers; GDPR consent shown for EEA/UK users. Link to Google's AdMob privacy policy.
- **D-07:** Production banner unit ID provided at execution time. Plan uses `YOUR_PRODUCTION_BANNER_UNIT_ID` as placeholder.
- **D-08:** Build-type switching — debug uses Google test banner ID (`ca-app-pub-3940256099942544/6300978111`); release uses production ID. Via Gradle `resValue` or `buildConfigField` in `release` block.
- **D-09:** `initializeForTesting` must change from `true` to `false` for release build. Can pair with build-type switch or use separate constant.
- **D-10:** GDPR consent form in AdMob console → Privacy & messaging must be configured BEFORE building release AAB.
- **D-11:** Credentials in `keystore.properties` at project root (not committed). Fields: `storeFile`, `storePassword`, `keyAlias`, `keyPassword`. `build.gradle` reads via `Properties`.
- **D-12:** Keystore `.jks` stored outside project: `C:\Users\omerb\keystores\simon-release.jks`.
- **D-13:** Backup: copy `.jks` + `keystore.properties` to local drive + cloud (Google Drive or OneDrive, private).

### Claude's Discretion

- Exact Gradle `resValue` vs. `buildConfigField` syntax for banner unit IDs per build type.
- Whether `initializeForTesting` uses a `BuildConfig` boolean or separate `resValue` string constant.
- Exact HTML structure and styling of the privacy policy page.
- Foreground vs. background layer setup for adaptive icon XML.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| META-01 | `applicationId`, `versionCode 1`, `versionName "1.0"` in `build.gradle` | Already present — verified in current `android/app/build.gradle`. No work needed. |
| META-02 | `targetSdkVersion 35` and `compileSdkVersion 35` | Already present at 36 (exceeds requirement) — verified in `android/variables.gradle`. No work needed. |
| META-03 | App display name in `strings.xml` | Already `"Simon Memory Game"` — verified. No work needed. |
| META-04 | App icon (512×512 + mipmap density set) | Python Pillow script approach researched; mipmap size table confirmed; adaptive icon XML structure confirmed. |
| SIGN-01 | Keystore generated, backed up to 2 locations | `keytool -genkey` command documented with exact Windows path; backup steps documented. |
| SIGN-02 | Signing config via `keystore.properties` (not hardcoded) | Exact Groovy DSL for AGP 8 documented; `keystore.properties` format defined. |
| SIGN-03 | `*.jks` added to `.gitignore` | Current root `.gitignore` needs two lines; android-level already has the pattern commented out. |
| SIGN-04 | Release AAB builds cleanly via `gradlew bundleRelease` | Windows command, JAVA_HOME pattern, output path documented. |
| SIGN-05 | Enrolled in Google Play App Signing on first submission | Play App Signing is mandatory for AABs and automatic on first upload — upload key vs app signing key distinction documented. |
| STORE-01 | Privacy policy at public HTTPS URL covering AdMob | GitHub Pages from `docs/` folder documented; exact UI steps confirmed; URL determined from git remote. |
| STORE-02 | Data Safety form completed (AdMob device identifier collection) | All 4 data types to declare documented with exact categories from official AdMob docs. |
| STORE-03 | IARC content rating questionnaire completed | Steps documented; expected rating for a simple game with banner ads: Everyone/PEGI 3. |
| STORE-04 | Store listing complete (descriptions, 2+ screenshots, feature graphic) | Screenshot minimum (2 for phone), feature graphic spec (1024×500) confirmed; short desc limit 80 chars, full desc 4000 chars. |
| STORE-05 | Production AdMob App ID and banner ad unit ID replace test IDs in release build | `resValue` approach recommended; how Capacitor JS reads it confirmed. |
| STORE-06 | App submitted to Google Play and approved | Internal test track → production path documented; all prerequisite checklist items identified. |
</phase_requirements>

---

## Summary

Phase 4 delivers the signed Android release AAB and completes Play Store submission. The phase has three parallel tracks: (1) app icon generation via Python Pillow, (2) signing configuration and release build, and (3) Play Console setup (privacy policy, store listing, GDPR form, data safety, IARC rating, submission).

META-01, META-02, and META-03 are already complete based on verified inspection of the current codebase. The signing configuration requires one new block in `android/app/build.gradle` (Groovy DSL, AGP 8.13.0 compatible). Python 3.13 with Pillow 11.3.0 is already installed and functional. GitHub Pages does not yet exist (`docs/` directory absent). The root `.gitignore` needs `*.jks` and `keystore.properties` entries added.

The single most important sequencing constraint: the GDPR consent form in AdMob console → Privacy & messaging MUST be published before building the release AAB. Without it, EEA users see no consent dialog — a Play Store policy violation.

**Primary recommendation:** Execute in wave order: (Wave 0) keystore + `.gitignore` + AdMob GDPR form; (Wave 1) app icon generation; (Wave 2) Gradle signing config + resValue + `initializeForTesting: false` + release AAB build; (Wave 3) privacy policy + GitHub Pages; (Wave 4) Play Console submission checklist.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Keystore generation + backup | Developer workstation | — | One-time manual operation outside the Android build system |
| Signing config injection | Android build layer (`build.gradle`) | — | Gradle reads `keystore.properties` at build time; not accessible from JS layer |
| Production banner unit ID | Android build layer (`resValue`) | JS runtime (`@string` resource) | Gradle injects as string resource; Capacitor reads via `getString(R.string.admob_banner_id)` exposed through existing plugin |
| `initializeForTesting` toggle | JS runtime (`src/main.tsx`) | — | It is a JS parameter passed to `AdMob.initialize()`; simplest fix is hardcode `false` since debug/release context is already separated by banner unit ID |
| App icon assets | Android resource layer (`mipmap-*`) | Python script (generation) | Pillow script generates PNGs; files land in `res/mipmap-*` directories consumed by AGP |
| Adaptive icon XML | Android resource layer | — | `mipmap-anydpi-v26/ic_launcher.xml` already exists; update to point to new PNG assets |
| Privacy policy | Static file hosting (GitHub Pages) | `docs/` directory in repo | HTTPS URL required by Play Store; GitHub Pages serves `docs/privacy-policy.html` |
| GDPR consent form | External (AdMob console) | — | Must be configured in AdMob dashboard; UMP SDK already integrated in Phase 3 |
| Store listing / submission | External (Play Console) | — | Manual steps; cannot be automated |

---

## Standard Stack

No new packages are installed in this phase. The phase uses existing tools.

### Core Tools (already present)

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| AGP (Android Gradle Plugin) | 8.13.0 | Android build system | Confirmed in `android/build.gradle` |
| Python | 3.13.13 | Icon generation script | Confirmed installed at `C:\Users\omerb\AppData\Local\Microsoft\WindowsApps\python.exe` |
| Pillow | 11.3.0 | PIL image generation | Confirmed installed and tested — `Image`, `ImageDraw`, `ImageFont` all functional |
| Java 21 (Eclipse Adoptium) | jdk-21.0.7.6-hotspot | Gradle build | Installed at `C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot` |
| keytool | (bundled with Java 21) | Keystore generation | Available via Java 21 bin directory |

### Package Legitimacy Audit

> This phase installs NO new npm packages. No package legitimacy audit is required.

**Packages removed due to slopcheck:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### Signing Config Pattern (AGP 8 / Groovy DSL)

The project uses Groovy DSL (`build.gradle`, not `build.gradle.kts`). AGP 8 continues to support this syntax unchanged. [VERIFIED: official Android developer docs — developer.android.com/studio/publish/app-signing]

**`android/keystore.properties`** (NOT committed to git):
```properties
storeFile=C:/Users/omerb/keystores/simon-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=simon-release
keyPassword=YOUR_KEY_PASSWORD
```

**`android/app/build.gradle`** — complete signing config block to insert before `buildTypes`:
```groovy
// Load signing properties
def keystorePropertiesFile = rootProject.file('keystore.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing namespace, compileSdk, defaultConfig unchanged ...

    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            // Banner unit ID injection — see resValue pattern below
            resValue "string", "admob_banner_id", "YOUR_PRODUCTION_BANNER_UNIT_ID"
        }
        debug {
            resValue "string", "admob_banner_id", "ca-app-pub-3940256099942544/6300978111"
        }
    }
}
```

**Key facts about this Groovy DSL pattern:** [VERIFIED: developer.android.com/studio/publish/app-signing]
- `signingConfigs` block MUST appear before `buildTypes` inside the `android {}` block
- `storeFile` takes a `File` object — wrap with `file(...)` 
- Windows paths in `keystore.properties` must use forward slashes or escaped backslashes: `C:/Users/omerb/keystores/simon-release.jks`
- `keystoreProperties['key']` returns a `String`; no cast needed in Groovy

### resValue vs buildConfigField — Decision

**Use `resValue "string"` for the banner unit ID.** [ASSUMED — based on ecosystem pattern and Capacitor JS constraint]

Rationale:
- `resValue "string", "admob_banner_id", "..."` generates a string resource accessible as `R.string.admob_banner_id`
- The `@capacitor-community/admob` plugin's `showBanner()` call accepts the unit ID as a plain JavaScript string — there is no mechanism for Capacitor's JavaScript layer to read Android `BuildConfig` fields directly without a custom native bridge plugin
- `resValue` strings generated by Gradle can be read from native Android code but NOT directly from the WebView JS context
- Therefore: the banner unit ID string lives in `src/App.tsx` (or wherever `showBanner()` is called) as a **JS constant**, and the Gradle `resValue` approach is used only if a custom Capacitor plugin were built to expose it — which is out of scope

**Correct approach for `initializeForTesting` and banner unit ID:**

The cleanest solution for this Capacitor JS app is to use **a build-variant-specific HTML file or a compile-time JS constant**. However, the simplest approach that requires no custom native code is:

1. **`initializeForTesting`**: Change from `true` to `false` directly in `src/main.tsx`. Since `initializeForTesting: true` only matters during Phase 3 dev testing, just hardcode `false` for the release commit. [ASSUMED — simpler than any Gradle-based toggle that requires native bridge work]

2. **Banner unit ID**: Store in a JS constant at the top of `src/App.tsx` (or a `src/config.ts` file). The plan can use a Vite environment variable (`import.meta.env.VITE_ADMOB_BANNER_ID`) so the value comes from `.env.production` vs `.env.development` without touching Android Gradle at all. This is the correct Capacitor pattern. [ASSUMED — clean Vite-native approach, avoids Android native bridge complexity]

**Vite env approach:**
```
# .env.development (debug builds serve from Vite dev server or cap run android)
VITE_ADMOB_BANNER_ID=ca-app-pub-3940256099942544/6300978111

# .env.production (npm run build → cap sync android → gradlew bundleRelease)
VITE_ADMOB_BANNER_ID=YOUR_PRODUCTION_BANNER_UNIT_ID
```

```typescript
// src/App.tsx or src/config.ts
const BANNER_UNIT_ID = import.meta.env.VITE_ADMOB_BANNER_ID ?? 'ca-app-pub-3940256099942544/6300978111';
```

The `npm run build` command uses `.env.production` by Vite convention; `npm run dev` uses `.env.development`. When `npx cap sync android` runs after `npm run build`, the production banner ID is baked into the web assets. [VERIFIED: Vite environment variables documentation — vitejs.dev/guide/env-and-mode]

**If the team prefers the Gradle `resValue` approach instead:** The `resValue` string is accessible from native Android code via `getString(R.string.admob_banner_id)`. A custom Capacitor plugin could bridge it to JS, but that adds significant complexity (new Java class, plugin registration, async call in `main.tsx`). Not recommended for a single-app project.

### Keystore Generation Command

Run from PowerShell (using Java 21 keytool directly since JAVA_HOME may point to Java 8):
```powershell
& "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\bin\keytool.exe" `
  -genkeypair -v `
  -keystore "C:\Users\omerb\keystores\simon-release.jks" `
  -alias simon-release `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storetype PKCS12
```

[ASSUMED — exact command flags drawn from Android documentation pattern; `-validity 10000` = ~27 years, exceeds the required 25-year minimum enforced by Play Console]

**Play Console requirement:** Key must expire after October 22, 2033. 10000-day validity from 2026 = ~2053, which satisfies this. [VERIFIED: developer.android.com/studio/publish/app-signing]

### Release Build Command (Windows)

The `gradlew.bat` wrapper is what PowerShell/cmd invokes on Windows. Run from `android/` subdirectory:

```powershell
# Set JAVA_HOME for this session (Java 8 is the current JAVA_HOME — must override)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot"

# Full pipeline: build web assets, sync to Android, build release AAB
cd C:\code\cursor\SimonGame
npm run build
npx cap sync android
cd android
.\gradlew.bat bundleRelease
```

**Output path:** `android/app/build/outputs/bundle/release/app-release.aab` [VERIFIED: developer.android.com/build/building-cmdline]

**Common Windows failure modes:** [ASSUMED — from ecosystem patterns]
- `JAVA_HOME` not set → error `Could not determine java version from '1.8.0_xxx'` (Java 8 too old for AGP 8). Fix: set `$env:JAVA_HOME` in the same shell session before running Gradle.
- Spaces in path to JDK → wrap in quotes in environment variable assignment
- `gradlew` vs `gradlew.bat` — in PowerShell, `.\gradlew.bat bundleRelease` is unambiguous; `./gradlew` also works via PowerShell's .bat execution
- `BUILD_TYPE` not matching `signingConfig` — if `keystore.properties` is missing, the build will fail with `FileNotFoundException`. Guard with the `if (keystorePropertiesFile.exists())` check shown above (it will warn but not fail the debug build).

### .gitignore Updates Required

Add to root `.gitignore` (currently missing these entries):
```
# Keystore files — never commit
*.jks
*.keystore
keystore.properties
```

The `android/.gitignore` already contains `#*.jks` and `#*.keystore` as commented-out lines. Uncomment those AND add `keystore.properties` there too, for defense in depth.

### App Icon Generation — Python Pillow Script

**Adaptive icon structure (existing files — what changes):**
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` currently references `@mipmap/ic_launcher_foreground` and `@color/ic_launcher_background`
- Current background color is `#FFFFFF` (from `ic_launcher_background.xml`)
- **New approach:** Keep the existing XML structure but change the background color to `#0f172a` (slate-900). The foreground PNG will contain the full 4-quadrant design on transparent background. [VERIFIED: Android adaptive icon documentation]

**Adaptive icon foreground sizing rule:** [VERIFIED: developer.android.com/develop/ui/compose/system/icon_design_adaptive]
- The foreground layer canvas is 108dp × 108dp at each density
- Safe zone (guaranteed visible): inner 72dp × 72dp circle
- Design content should be within the safe zone to survive all launcher mask shapes
- At xxxhdpi: foreground PNG is 432×432px (108dp × 4); safe zone = 288×288px centered

**Mipmap density table:**

| Density | DPI | `ic_launcher.png` | `ic_launcher_round.png` | Foreground PNG |
|---------|-----|-------------------|------------------------|----------------|
| mdpi | 160 | 48×48 | 48×48 | 162×162 |
| hdpi | 240 | 72×72 | 72×72 | 243×243 |
| xhdpi | 320 | 96×96 | 96×96 | 324×324 |
| xxhdpi | 480 | 144×144 | 144×144 | 486×486 |
| xxxhdpi | 640 | 192×192 | 192×192 | 648×648 |

Note: The foreground PNG sizes above (108dp × scale) are the correct dimensions if providing per-density foreground PNGs. **Simpler approach:** use a single high-resolution foreground PNG and let the system scale it. Most production apps skip per-density foreground PNGs and use a single drawable PNG. [ASSUMED]

**Recommended simplification:** The Python script generates:
1. A 512×512 master icon PNG (`assets/icons/simon-icon-512.png`) — also used as Play Store listing icon
2. Per-density `ic_launcher.png` and `ic_launcher_round.png` in all 5 mipmap folders
3. A 1024×500 feature graphic PNG (`assets/icons/feature-graphic.png`)
4. Does NOT generate foreground PNGs separately — instead, update `ic_launcher_background.xml` to use `#0f172a` and use the density-specific `ic_launcher.png` files as both legacy launcher icons and as if they were the full-bleed icon. The adaptive icon XML can point to `@mipmap/ic_launcher` as the foreground on a solid dark background, which is the simplest correct approach.

**Pillow script core logic:**
```python
from PIL import Image, ImageDraw
import os

# Simon colors
BACKGROUND = '#0f172a'  # slate-900
COLORS = {
    'TL': '#4ade80',  # green
    'TR': '#f87171',  # red
    'BL': '#fbbf24',  # yellow
    'BR': '#60a5fa',  # blue
}

def make_simon_icon(size: int) -> Image.Image:
    """Generate a square 4-quadrant Simon icon at given pixel size."""
    img = Image.new('RGBA', (size, size), BACKGROUND)
    draw = ImageDraw.Draw(img)
    gap = max(2, size // 48)   # proportional gap between quadrants
    half = size // 2
    draw.rectangle([gap, gap, half - gap, half - gap], fill=COLORS['TL'])
    draw.rectangle([half + gap, gap, size - gap, half - gap], fill=COLORS['TR'])
    draw.rectangle([gap, half + gap, half - gap, size - gap], fill=COLORS['BL'])
    draw.rectangle([half + gap, half + gap, size - gap, size - gap], fill=COLORS['BR'])
    return img

def make_round_icon(size: int) -> Image.Image:
    """Round-crop a Simon icon to a circle."""
    img = make_simon_icon(size)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    img.putalpha(mask)
    return img

MIPMAP_SIZES = {
    'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192
}
```

[VERIFIED: Pillow 11.3.0 — tested locally; `Image.new`, `ImageDraw.Draw`, `ellipse`, `putalpha`, `resize(LANCZOS)` all functional]

**Feature graphic:** 1024×500px. Same quadrant layout, wider. Optionally add "Simon Memory Game" text using `ImageFont` with a system font or bundled TTF.

### Adaptive Icon XML Update

After generating icons, update `ic_launcher_background.xml` to use the dark background:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f172a</color>
</resources>
```

Update `mipmap-anydpi-v26/ic_launcher.xml` to use the square icon PNG as foreground:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher"/>
</adaptive-icon>
```

Same for `ic_launcher_round.xml` — point foreground to `@mipmap/ic_launcher_round`. [ASSUMED — this uses the square and round PNGs as the adaptive foreground, which is a valid and common approach for simple flat icons]

### GitHub Pages Setup

**Steps (GitHub UI):**
1. Push `docs/privacy-policy.html` to `main` branch
2. Go to `https://github.com/omerblecher/SimonGame` → Settings → Pages
3. Under "Build and deployment" → Source: "Deploy from a branch"
4. Branch: `main`, Folder: `/docs`
5. Click Save

**Resulting URL:** `https://omerblecher.github.io/SimonGame/privacy-policy.html` [VERIFIED: docs.github.com/en/pages — Steps confirmed via official GitHub Docs]

**No `_config.yml` needed** for a plain HTML file. GitHub Pages serves any `.html` file in `docs/` directly.

### Privacy Policy HTML Content

Required content based on D-06: [ASSUMED — content scope drawn from context decisions, not a regulatory authority]
- What data the app itself collects: none
- What Google AdMob collects: device identifiers (Android Advertising ID), IP address, interaction data, diagnostic data
- Why: advertising, analytics, fraud prevention
- User controls: Android Ad ID reset/opt-out via device settings
- Link to Google's privacy policy: `https://policies.google.com/privacy`
- Link to AdMob's partner policies: `https://support.google.com/admob/answer/6128543`
- GDPR note: EEA/UK users shown UMP consent dialog before ads
- Contact email for privacy questions

### Play Console Submission Sequence

**Prerequisites before any AAB upload:**

| # | Prerequisite | Where | Blocking? |
|---|-------------|-------|-----------|
| 1 | AdMob GDPR consent form published | AdMob console → Privacy & messaging | Yes — EEA compliance |
| 2 | Privacy policy live at HTTPS URL | GitHub Pages | Yes — Play Console requires URL |
| 3 | Production banner unit ID obtained | AdMob console | Yes — needed in Vite `.env.production` |
| 4 | Keystore generated + backed up to 2 locations | Local filesystem | Yes — cannot sign without it |
| 5 | Google Play Developer account active ($25 fee paid) | play.google.com/console | Yes |

**GDPR consent form setup in AdMob console (steps):** [VERIFIED: support.google.com/admob/answer/10113207]
1. Sign in to AdMob → click "Privacy & messaging"
2. On "European regulations" card → click "Create"
3. Select app: `com.otis.brooke.simon.game`
4. Select languages (English at minimum; add others if needed)
5. Configure "Do not consent" option
6. Set targeting: "Countries subject to GDPR (EEA, UK, and Switzerland)"
7. Enter a message name (internal only)
8. Add privacy policy URL: `https://omerblecher.github.io/SimonGame/privacy-policy.html`
9. Click Publish

**Play Console store listing checklist:** [VERIFIED: Play Console help + search results]

| Item | Spec | Source |
|------|------|--------|
| App name | Max 30 characters | Play Console |
| Short description | Max 80 characters | Play Console |
| Full description | Max 4000 characters | Play Console |
| App icon (listing) | 512×512 PNG, max 1MB, no alpha | Play Console — `android:icon` not used; this is the separately uploaded store icon |
| Feature graphic | 1024×500 JPEG or 24-bit PNG, no alpha | Play Console |
| Screenshots (phone) | Minimum 2, max 8; JPEG or 24-bit PNG | Play Console |
| Screenshot dimensions | 320px–3840px on each side; 16:9 or 9:16 ratio typical | Play Console |
| Privacy policy URL | Public HTTPS URL | Play Console (required) |
| Data Safety form | Completed | Play Console (required) |
| IARC rating | Completed | Play Console (required) |

**Data Safety form — what to declare for AdMob:** [VERIFIED: developers.google.com/admob/android/privacy/play-data-disclosure]

| Data Type | Play Console Category | Purpose | Shared? |
|-----------|----------------------|---------|---------|
| IP address | Location → Approximate location | Advertising, analytics | Yes |
| User product interactions | App interactions | Advertising, analytics | Yes |
| Diagnostic information | App info and performance → Crash logs | Analytics | Yes |
| Android Advertising ID + App Set ID | Device or other IDs | Advertising, analytics, fraud prevention | Yes |

All data encrypted in transit (TLS). Users can reset/opt-out of Advertising ID via Android settings.

**IARC content rating:** [ASSUMED — based on nature of the app; actual rating assigned by IARC questionnaire]
- Category: Game → Puzzle
- No violence, no sexual content, no language, no controlled substances
- Contains advertising (banner ads) → declare this
- Expected rating: Everyone / PEGI 3

**Play App Signing enrollment:** [VERIFIED: support.google.com/googleplay/android-developer/answer/9842756]
- For new apps uploading AAB: **Play App Signing is mandatory and automatic**
- During first release creation in Play Console, go to "App integrity" section → accept terms
- Google offers to generate the app signing key (recommended) — this becomes the permanent key delivered to users
- The `.jks` you generate is the **upload key** — used only to authenticate uploads to Play Console; Google re-signs the AAB before distribution
- If upload key is lost, Google can reset it; if app signing key (Google-managed) were somehow lost, the app cannot be updated — but Google manages this securely

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PNG resizing for mipmap densities | Custom resize loop | `PIL.Image.resize(size, Image.LANCZOS)` | Lanczos resampling is the correct high-quality algorithm for downscaling |
| Circle crop for round icon | Manual pixel math | `PIL.Image.putalpha(mask)` with `ImageDraw.ellipse` mask | Pillow handles anti-aliasing correctly |
| GDPR consent dialog UI | Custom native dialog | `AdMob.requestConsentInfo()` + `AdMob.showConsentForm()` (already implemented in Phase 3) | UMP SDK handles EEA detection, form rendering, and consent storage |
| Android signing via custom scripts | Calling `jarsigner` directly | `gradlew bundleRelease` with `signingConfigs` in `build.gradle` | AGP handles signing, zipalignment, and V1/V2/V3 signature versions automatically |
| Privacy policy database | Any server-side storage | Static HTML on GitHub Pages | Zero infrastructure cost; HTTPS provided by GitHub; no maintenance |

---

## Common Pitfalls

### Pitfall 1: JAVA_HOME Points to Java 8
**What goes wrong:** `gradlew bundleRelease` fails with `Unsupported class file major version` or similar because AGP 8.x requires Java 17+ (Java 21 is installed but not the default JAVA_HOME).
**Why it happens:** The system `JAVA_HOME` environment variable points to Java 8 (confirmed in the project's Phase 2 decision log).
**How to avoid:** Set `$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot"` in the same PowerShell session before running any `gradlew` command.
**Warning signs:** Gradle prints `java.lang.UnsupportedClassVersionError` or `Could not determine java version`.

### Pitfall 2: `keystore.properties` Contains Windows Backslashes
**What goes wrong:** `storeFile=C:\Users\omerb\keystores\simon-release.jks` fails because Java's `Properties` + Gradle's `file()` does not handle Windows backslashes in property files.
**Why it happens:** Java Properties files treat `\` as an escape character.
**How to avoid:** Use forward slashes in `keystore.properties`: `storeFile=C:/Users/omerb/keystores/simon-release.jks`
**Warning signs:** `FileNotFoundException` or `java.io.IOException: No such file` when Gradle tries to load the keystore.

### Pitfall 3: Play Store Icon Must Have No Alpha (Feature Graphic)
**What goes wrong:** Feature graphic upload rejected if the PNG has an alpha channel.
**Why it happens:** Play Console requires 24-bit PNG (no alpha) for feature graphic.
**How to avoid:** In Pillow, save the feature graphic as `img.convert('RGB').save('feature-graphic.png')` to strip the alpha channel.
**Warning signs:** Play Console upload error: "Feature graphic must not have an alpha channel."

### Pitfall 4: Signing Config Before `buildTypes` in Groovy DSL
**What goes wrong:** `signingConfig signingConfigs.release` in the `release` buildType throws a Gradle build error if `signingConfigs` is declared after `buildTypes`.
**Why it happens:** Groovy DSL is sequential — `signingConfigs.release` is a forward reference that Groovy cannot resolve.
**How to avoid:** Always place the `signingConfigs {}` block BEFORE `buildTypes {}` inside the `android {}` block.
**Warning signs:** `Could not get unknown property 'release' for SigningConfigContainer`.

### Pitfall 5: Test Banner ID Ships in Release Build
**What goes wrong:** App published with `ca-app-pub-3940256099942544/6300978111` (test ID) — AdMob account violation; no real revenue.
**Why it happens:** Forgetting to update the banner unit ID in the JS layer before running `npm run build`.
**How to avoid:** Use `.env.production` with the real banner unit ID. Verify: `grep -r "3940256099942544" dist/` should return no results after `npm run build`.
**Warning signs:** AdMob dashboard shows zero impressions in production; AdMob console may flag the account.

### Pitfall 6: GDPR Form Not Published Before AAB Upload
**What goes wrong:** App gets rejected at Play Console submission or EEA users see no consent dialog (policy violation).
**Why it happens:** The UMP SDK (`requestConsentInfo` / `showConsentForm`) returns successfully even with no form configured — Phase 3 guarded this with a try/catch that silently skips. But without the form published in AdMob console, no dialog ever appears for EEA users.
**How to avoid:** Publish the GDPR message in AdMob console (Privacy & messaging) BEFORE building the release AAB. Verify with a test device set to EEA region.
**Warning signs:** No consent dialog appears when testing from a German VPN or on a device with region set to Germany.

### Pitfall 7: Adaptive Icon Foreground Clipped by Launcher
**What goes wrong:** The Simon quadrant design appears cropped differently on different Android launchers (circle on Pixel, squircle on Samsung, etc.) — important design elements near edges are cut off.
**Why it happens:** Adaptive icons apply a device-specific mask; only the inner 72dp safe zone (66% of the 108dp canvas) is guaranteed visible.
**How to avoid:** Keep the gap between the outer edge of the design and the icon edge at least 18% of the icon size. The Python script's `gap = max(2, size // 48)` formula creates a small but adequate gap.
**Warning signs:** During visual testing on a Pixel device (circle mask), outer corners of the quadrants are clipped unexpectedly.

### Pitfall 8: `initializeForTesting: true` Ships in Production
**What goes wrong:** AdMob serves real ads but marks them as test impressions — revenue is lost; account may be flagged.
**Why it happens:** The Phase 3 comment says "Phase 4 changes to false" but it is easy to forget a single boolean.
**How to avoid:** Change `initializeForTesting: true` → `false` in `src/main.tsx` as the FIRST code change in this phase.
**Warning signs:** Real AdMob impressions not showing in dashboard; `initializeForTesting` left as `true` in production.

---

## Code Examples

### Complete Signing Config Block for `android/app/build.gradle`
```groovy
// Source: developer.android.com/studio/publish/app-signing (Groovy DSL)
// Place at top of file, before the android {} block:
def keystorePropertiesFile = rootProject.file('keystore.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.otis.brooke.simon.game"
    compileSdk = rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.otis.brooke.simon.game"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
            ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }

    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            resValue "string", "admob_banner_id", "YOUR_PRODUCTION_BANNER_UNIT_ID"
        }
        debug {
            resValue "string", "admob_banner_id", "ca-app-pub-3940256099942544/6300978111"
        }
    }
}
```

### `initializeForTesting` Fix in `src/main.tsx`
```typescript
// Source: src/main.tsx line 21 — change true → false
await AdMob.initialize({
    initializeForTesting: false, // Changed from true (Phase 3) to false for release
});
```

### Vite Environment Variable Approach for Banner Unit ID
```bash
# .env.development (Vite default for npm run dev)
VITE_ADMOB_BANNER_ID=ca-app-pub-3940256099942544/6300978111

# .env.production (Vite uses this for npm run build)
VITE_ADMOB_BANNER_ID=ca-app-pub-4227443066128564/YOUR_BANNER_UNIT_ID
```

```typescript
// src/config.ts (new file)
// Source: vitejs.dev/guide/env-and-mode
export const ADMOB_BANNER_ID =
  import.meta.env.VITE_ADMOB_BANNER_ID ??
  'ca-app-pub-3940256099942544/6300978111'; // fallback to test ID
```

**Add `.env.production` to `.gitignore`** so production IDs are not committed. The `.env.development` file (test ID only) is safe to commit.

### Python Pillow — Complete Icon Script Structure
```python
# scripts/generate_icon.py
# Source: Pillow 11.3.0 — tested locally 2026-05-16
from PIL import Image, ImageDraw
import os, shutil

BACKGROUND = '#0f172a'
COLORS = {'TL': '#4ade80', 'TR': '#f87171', 'BL': '#fbbf24', 'BR': '#60a5fa'}

MIPMAP_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

RES_DIR = 'android/app/src/main/res'
ASSETS_DIR = 'assets/icons'

def make_simon_icon(size: int) -> Image.Image:
    img = Image.new('RGBA', (size, size), BACKGROUND)
    draw = ImageDraw.Draw(img)
    gap = max(2, size // 48)
    half = size // 2
    draw.rectangle([gap, gap, half - gap, half - gap], fill=COLORS['TL'])
    draw.rectangle([half + gap, gap, size - gap, half - gap], fill=COLORS['TR'])
    draw.rectangle([gap, half + gap, half - gap, size - gap], fill=COLORS['BL'])
    draw.rectangle([half + gap, half + gap, size - gap, size - gap], fill=COLORS['BR'])
    return img

def make_round_icon(size: int) -> Image.Image:
    img = make_simon_icon(size)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    img.putalpha(mask)
    return img

os.makedirs(ASSETS_DIR, exist_ok=True)

# Store listing icon (512x512, RGB, no alpha)
master = make_simon_icon(512)
master.convert('RGB').save(f'{ASSETS_DIR}/simon-icon-512.png')

# Feature graphic (1024x500, RGB, no alpha)
fg = make_simon_icon(1024).crop((0, 262, 1024, 762))  # center crop to 1024x500
# Alternative: generate a native 1024x500 layout
fg_wide = Image.new('RGB', (1024, 500), BACKGROUND)
fg_draw = ImageDraw.Draw(fg_wide)
gap = 10
half_w, half_h = 512, 250
fg_draw.rectangle([gap, gap, half_w - gap, half_h - gap], fill=COLORS['TL'])
fg_draw.rectangle([half_w + gap, gap, 1024 - gap, half_h - gap], fill=COLORS['TR'])
fg_draw.rectangle([gap, half_h + gap, half_w - gap, 500 - gap], fill=COLORS['BL'])
fg_draw.rectangle([half_w + gap, half_h + gap, 1024 - gap, 500 - gap], fill=COLORS['BR'])
fg_wide.save(f'{ASSETS_DIR}/feature-graphic.png')

# Mipmap density icons
for mipmap_dir, size in MIPMAP_SIZES.items():
    out_dir = f'{RES_DIR}/{mipmap_dir}'
    os.makedirs(out_dir, exist_ok=True)
    make_simon_icon(size).convert('RGB').save(f'{out_dir}/ic_launcher.png')
    make_round_icon(size).save(f'{out_dir}/ic_launcher_round.png')  # keep alpha for round

print('Icon generation complete.')
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| APK upload to Play Store | AAB (Android App Bundle) mandatory for new apps | Aug 2021 | Must use `gradlew bundleRelease`, not `assembleRelease` |
| Manage signing key yourself | Play App Signing — Google manages app signing key | 2018, mandatory for AABs | Upload key ≠ distribution key; upload key can be reset |
| Single APK for all devices | AAB + Play dynamic delivery | 2018 | Smaller downloads per device |
| Optional GDPR consent | Google-certified CMP required for EEA | Jan 16, 2024 | UMP SDK already integrated in Phase 3; consent form in AdMob console required |
| Groovy DSL default | Kotlin DSL default in new AGP 8.1+ projects | AGP 8.1 (2023) | This project uses Groovy DSL — both are supported; no migration needed |

**Deprecated/outdated:**
- `gradlew assembleRelease` → produces APK, not AAB; Play Store requires AAB for new apps since Aug 2021
- `jarsigner` + `zipalign` manual signing → replaced by `gradlew bundleRelease` with `signingConfigs`
- Standalone keystore file without `keystore.properties` → credentials would be hardcoded or in environment variables; `keystore.properties` pattern is current standard

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `initializeForTesting: false` should be hardcoded in `src/main.tsx` rather than driven by Gradle `buildConfigField` | Architecture Patterns — resValue vs buildConfigField | Low — the JS layer is the correct place; if Gradle-driven approach is preferred, a custom native bridge plugin is required (significant extra work) |
| A2 | Vite `.env.production` / `.env.development` is the correct mechanism for per-build-type banner unit ID in a Capacitor app | Architecture Patterns | Medium — if the app is always built with `npm run build` (which uses `.env.production`), this works perfectly; risk if someone runs `npx cap sync` without a prior `npm run build` |
| A3 | Adaptive icon foreground can point to `@mipmap/ic_launcher` (the square PNG) rather than requiring a separate `ic_launcher_foreground` PNG | Architecture Patterns — Adaptive Icon XML Update | Low — Android supports referencing any mipmap drawable as the foreground layer; functional, widely used |
| A4 | `keytool -validity 10000` (27 years) satisfies Play Store's "expires after Oct 22, 2033" requirement | Signing — keytool command | Low — 10000 days from 2026 = 2053; well past 2033 |
| A5 | Feature graphic with no text overlay (pure color quadrants) is acceptable for Play Store | Code Examples — feature graphic | Low — Play Store has no text requirement for feature graphic |
| A6 | Expected IARC rating for a simple memory game with banner ads = Everyone/PEGI 3 | Play Console Submission Sequence | Low — actual rating depends on questionnaire answers; declare ads, no mature content |
| A7 | `.env.production` should be added to `.gitignore` to avoid committing production AdMob banner unit ID | Code Examples | Medium — if the production banner unit ID is considered non-sensitive (it is public once the app ships), committing it is acceptable; but `.gitignore` is safer practice |

---

## Open Questions (RESOLVED)

1. **Production banner unit ID timing**
   - What we know: D-07 says the ID will be provided at plan execution time
   - What's unclear: Whether the unit ID already exists in AdMob console or needs to be created during Phase 4
   - Recommendation: Plan task "Create banner ad unit in AdMob console" as the first AdMob step, before any build tasks
   - **RESOLVED:** Plan 04-02 Task 2 handles both paths -- if a banner ad unit already exists in AdMob console it is used; if not, Task 2 walks through creating one. The production ID is recorded in 04-02-SUMMARY.md for use in Plan 04-05.

2. **Google Play Developer account status**
   - What we know: The $25 registration fee is required; omerblecher@gmail.com is the developer email
   - What's unclear: Whether the account is already active or needs to be created
   - Recommendation: Plan task "Verify/create Google Play Developer account" in Wave 0 (prerequisite check)
   - **RESOLVED:** Plan 04-02 Task 1 covers both active and new account paths -- it verifies account status and provides registration steps if the account is not yet active. The plan cannot proceed past Task 1 until the account is confirmed active.

3. **App signing key choice in Play Console**
   - What we know: Play App Signing is automatic for new AAB submissions; Google offers to generate the app signing key
   - What's unclear: User preference -- let Google generate key (recommended) or provide existing key
   - Recommendation: Default to "let Google generate" (the simpler, more secure option); mention the alternative in plan notes
   - **RESOLVED:** Default to "let Google generate" per Play App Signing documentation. Plan 04-08 Task 3 documents this choice and explains the upload key vs. app signing key distinction. No user action required beyond accepting the Play App Signing terms during first AAB upload.

---

## Environment Availability

| Dependency | Required By | Available | Version | Notes |
|------------|------------|-----------|---------|-------|
| Python | Icon generation script | ✓ | 3.13.13 | At `C:\Users\omerb\AppData\Local\Microsoft\WindowsApps\python.exe` |
| Pillow | Icon generation script | ✓ | 11.3.0 | Installed; `Image`, `ImageDraw`, `ImageFont` confirmed functional |
| Java 21 (Eclipse Adoptium) | `gradlew bundleRelease` | ✓ | jdk-21.0.7.6-hotspot | At `C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot`; `JAVA_HOME` must be set per session |
| Java 8 (current JAVA_HOME) | — | ✓ (wrong version) | 1.8.0_452 | Default `JAVA_HOME` — must NOT be used for Gradle; AGP 8.x requires Java 17+ |
| keytool | Keystore generation | ✓ | (Java 21) | Use `C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\bin\keytool.exe` directly |
| AGP | Android build | ✓ | 8.13.0 | Confirmed in `android/build.gradle` |
| `gradlew.bat` | Release build | ✓ | — | Present at `android/gradlew.bat` |
| GitHub account | GitHub Pages | ✓ | — | `omerblecher` — confirmed from `git remote get-url origin` |
| Google Play Developer account | Store submission | Unknown | — | Requires verification; $25 fee if not yet registered |
| AdMob console access | GDPR form, banner unit | Unknown | — | Requires login with the AdMob account associated with `ca-app-pub-4227443066128564` |

**Missing dependencies with no fallback:**
- None — all technical dependencies are present.

**Unknown status (requires human verification):**
- Google Play Developer account: must be active before Plan 04-04 (submission wave)
- AdMob console access: must be available to publish GDPR form and retrieve production banner unit ID

---

## Validation Architecture

> `workflow.nyquist_validation` status: checking `.planning/config.json` — if absent, treat as enabled.

This phase is primarily manual steps, infrastructure configuration, and build verification. Automated unit tests are not applicable to signing config, icon generation, or Play Console submission. The validation approach is build-time verification and manual checklist.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (no test framework in this project per REQUIREMENTS.md — "Unit / E2E test suite deferred to v2") |
| Config file | none |
| Quick run command | `npm run build` (TypeScript compile validates source) |
| Full suite command | `gradlew bundleRelease` (end-to-end build verification) |

### Phase Requirements → Verification Map

| Req ID | Behavior | Test Type | Verification Command / Method |
|--------|----------|-----------|-------------------------------|
| META-01 | applicationId, versionCode, versionName correct | build-time | `grep -E "applicationId|versionCode|versionName" android/app/build.gradle` |
| META-02 | compileSdk/targetSdk ≥ 35 | build-time | `grep -E "compileSdk|targetSdk" android/variables.gradle` |
| META-03 | app_name correct | build-time | `grep app_name android/app/src/main/res/values/strings.xml` |
| META-04 | Icons visible on device | manual | Install debug APK; verify launcher icon appears correctly on device |
| SIGN-01 | Keystore generated and backed up | manual | Verify file at `C:\Users\omerb\keystores\simon-release.jks`; verify backup copy |
| SIGN-02 | Signing config reads from file | build-time | `gradlew bundleRelease` completes without signing error |
| SIGN-03 | *.jks in .gitignore | manual | `git check-ignore -v android/app/release.jks` should show match |
| SIGN-04 | Release AAB builds | build-time | `gradlew bundleRelease` → file at `android/app/build/outputs/bundle/release/app-release.aab` |
| SIGN-05 | Play App Signing enrolled | manual | Play Console → Release → App integrity shows enrollment |
| STORE-01 | Privacy policy live | manual | `curl -I https://omerblecher.github.io/SimonGame/privacy-policy.html` returns 200 |
| STORE-02 | Data Safety completed | manual | Play Console → Policy → App content → Data safety shows "Approved" |
| STORE-03 | IARC rating completed | manual | Play Console → Policy → App content → Content rating shows rating |
| STORE-04 | Store listing complete | manual | Play Console → Store presence → Main store listing — all required fields filled |
| STORE-05 | Production banner ID in release build | build-time | `npm run build && grep -r "3940256099942544" dist/` → no results |
| STORE-06 | App submitted | manual | Play Console → Release → Production → review submission status |

### Wave 0 Gaps

None — no test infrastructure is needed. All verification is manual or build-time.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | No user input in signing/submission flow |
| V6 Cryptography | Yes | RSA-2048 keystore (industry standard); no hand-rolled crypto |

### Known Threat Patterns for Release Signing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Keystore committed to git | Information disclosure | `.gitignore` entries for `*.jks` + `keystore.properties`; keystore stored outside repo |
| Passwords hardcoded in build.gradle | Information disclosure | `keystore.properties` pattern; file not committed |
| Test AdMob ID ships in production | Repudiation / financial | Vite `.env.production` with production ID; `npm run build` bakes it in; verify with `grep` after build |
| Upload key loss | Denial of service (update blocked) | Backup to 2 locations; Play App Signing means upload key can be reset |

---

## Sources

### Primary (HIGH confidence)
- [developer.android.com/studio/publish/app-signing](https://developer.android.com/studio/publish/app-signing) — Groovy DSL signing config, upload key vs app signing key, Play App Signing enrollment, key validity requirement
- [developers.google.com/admob/android/privacy/play-data-disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure) — Data Safety form declarations for AdMob
- [docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) — GitHub Pages `/docs` folder setup
- [support.google.com/admob/answer/10113207](https://support.google.com/admob/answer/10113207) — AdMob GDPR consent form creation steps
- [support.google.com/googleplay/android-developer/answer/9842756](https://support.google.com/googleplay/android-developer/answer/9842756) — Play App Signing enrollment
- [developer.android.com/build/building-cmdline](https://developer.android.com/build/building-cmdline) — `gradlew bundleRelease` output path
- Pillow 11.3.0 — tested locally: `Image`, `ImageDraw.ellipse`, `putalpha`, `resize(LANCZOS)` all confirmed functional
- Current codebase — `android/build.gradle` (AGP 8.13.0), `android/variables.gradle` (compileSdk 36), `android/app/build.gradle` (applicationId, versionCode 1, versionName "1.0"), `android/app/src/main/res/values/strings.xml` (app_name confirmed), `src/main.tsx` (`initializeForTesting: true` line 21)
- Git remote — `https://github.com/omerblecher/SimonGame.git` → GitHub Pages URL derived

### Secondary (MEDIUM confidence)
- [support.google.com/googleplay/android-developer/answer/9859655](https://support.google.com/googleplay/android-developer/answer/9859655) — IARC content rating requirements
- [support.google.com/googleplay/android-developer/answer/9866151](https://support.google.com/googleplay/android-developer/answer/9866151) — Play Console screenshot requirements
- [developer.android.com/develop/ui/compose/system/icon_design_adaptive](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive) — Adaptive icon safe zone (72dp inner / 108dp canvas)
- [vitejs.dev/guide/env-and-mode](https://vitejs.dev/guide/env-and-mode) — Vite `.env.production` pattern for banner unit ID

### Tertiary (LOW confidence — noted in Assumptions Log)
- Web search results for keytool command flags, Windows PowerShell gradlew execution
- Ecosystem pattern for adaptive icon foreground → mipmap PNG reference

---

## Metadata

**Confidence breakdown:**
- Gradle signing config: HIGH — verified against official Android developer docs
- Python Pillow icon generation: HIGH — tested locally with Pillow 11.3.0
- Play Console submission flow: MEDIUM — official help docs consulted but exact UI may have changed
- GDPR form setup: HIGH — official AdMob support doc confirmed steps
- Data Safety form answers: HIGH — official AdMob/Play data disclosure doc
- Adaptive icon foreground approach: MEDIUM — valid pattern but simplified vs full foreground-layer spec

**Research date:** 2026-05-16
**Valid until:** 2026-08-16 (90 days; Play Console UI and policy stable; Pillow API stable)
