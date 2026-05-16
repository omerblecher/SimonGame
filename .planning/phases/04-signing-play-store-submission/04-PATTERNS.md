# Phase 4: Signing + Play Store Submission - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 11 (7 new, 4 modified)
**Analogs found:** 8 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `android/app/build.gradle` | config | batch (build-time) | `android/build.gradle` | role-match |
| `src/main.tsx` | config (one-line edit) | request-response | `src/main.tsx` itself (already read) | exact (self) |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | config | transform | `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | exact |
| `android/app/src/main/res/mipmap-*/ic_launcher.png` | asset | file-I/O | existing Capacitor default PNGs (replace-in-place) | structural-match |
| `android/app/src/main/res/mipmap-*/ic_launcher_round.png` | asset | file-I/O | existing Capacitor default PNGs (replace-in-place) | structural-match |
| `android/keystore.properties` | config (secret) | — | `android/.gitignore` patterns (no code analog) | none |
| `docs/privacy-policy.html` | static page | — | none in codebase | none |
| `scripts/generate_icon.py` | utility | file-I/O + transform | none in codebase | none |
| `src/config.ts` | utility | — | `src/hooks/useBannerHeight.ts` (Capacitor import style) | partial |
| `.env.development` | config (env) | — | none in codebase | none |
| `.env.production` | config (env) | — | none in codebase | none |

---

## Pattern Assignments

### `android/app/build.gradle` (config, build-time)

**Analog:** `android/app/build.gradle` itself (current state, lines 1–55) + `android/build.gradle` (top-level Groovy DSL conventions)

**Existing file — full current state** (`android/app/build.gradle` lines 1–55):
```groovy
apply plugin: 'com.android.application'

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
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**What to ADD — signing properties loader (insert BEFORE the `android {}` block):**
- Source: RESEARCH.md §Signing Config Pattern
- `rootProject.file('keystore.properties')` is the correct Groovy reference to a file at the Android project root (one level above `app/`)
- Guard with `if (keystorePropertiesFile.exists())` so debug builds do not fail when the file is absent
```groovy
def keystorePropertiesFile = rootProject.file('keystore.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

**What to ADD — `signingConfigs` block (inside `android {}`, BEFORE `buildTypes`):**
- CRITICAL: `signingConfigs` MUST appear before `buildTypes` in Groovy DSL — forward reference will fail
- `storeFile` requires `file(...)` wrapper to convert String → File object
```groovy
signingConfigs {
    release {
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
    }
}
```

**What to MODIFY — existing `buildTypes.release` block (add 2 lines) + add `debug` block:**
- `signingConfig signingConfigs.release` references the block declared above
- `resValue "string", "admob_banner_id", "..."` generates `R.string.admob_banner_id` (native use only; JS reads from `src/config.ts` instead)
- Both release and debug blocks get `resValue` so the resource always exists at runtime regardless of build variant
```groovy
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
```

**Unchanged sections** — do NOT modify these lines:
- Line 1: `apply plugin: 'com.android.application'`
- Lines 4–18: `namespace`, `compileSdk`, entire `defaultConfig` block
- Lines 27–43: `repositories`, `dependencies`
- Line 45: `apply from: 'capacitor.build.gradle'`
- Lines 47–54: `google-services.json` try/catch block

---

### `src/main.tsx` (one-line edit, line 21)

**Analog:** `src/main.tsx` itself (already read, lines 1–44)

**Current line 21:**
```typescript
    initializeForTesting: true, // Phase 3 only — set false in Phase 4
```

**Target line 21 (exact replacement):**
```typescript
    initializeForTesting: false,
```

**Context surrounding the change** (lines 19–23 for orientation):
```typescript
  // Initialize regardless of consent outcome
  await AdMob.initialize({
    initializeForTesting: false,
  });
```

All other code in `src/main.tsx` (lines 1–20, 22–44) is unchanged.

---

### `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (config, adaptive icon XML)

**Analog:** `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` (lines 1–5 — identical structure)

**Current file** (`ic_launcher.xml` lines 1–5):
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

**Target file** (change only the `foreground` drawable reference):
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher"/>
</adaptive-icon>
```

**Also update `ic_launcher_round.xml`** with the round variant reference:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_round"/>
</adaptive-icon>
```

**Also update `android/app/src/main/res/values/ic_launcher_background.xml`** (current value `#FFFFFF` → `#0f172a`):

Current (`ic_launcher_background.xml` lines 1–4):
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
```

Target:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f172a</color>
</resources>
```

---

### `android/app/src/main/res/mipmap-*/ic_launcher.png` and `ic_launcher_round.png` (assets, file-I/O)

**Analog:** Existing Capacitor default PNGs at the same paths — replace in-place. No XML/code change; the Python script writes directly to these paths.

**Mipmap density → pixel size table** (from RESEARCH.md):
| Directory | `ic_launcher.png` | `ic_launcher_round.png` |
|-----------|-------------------|------------------------|
| `mipmap-mdpi` | 48×48 | 48×48 |
| `mipmap-hdpi` | 72×72 | 72×72 |
| `mipmap-xhdpi` | 96×96 | 96×96 |
| `mipmap-xxhdpi` | 144×144 | 144×144 |
| `mipmap-xxxhdpi` | 192×192 | 192×192 |

The Python script writes these paths; planner should note the script's `RES_DIR` constant references the Android res directory relative to the repo root.

---

### `android/keystore.properties` (config, secret — NOT committed)

**Analog:** `android/local.properties` pattern (present in `android/.gitignore` line 27 as `local.properties`) — same concept: a properties file with local secrets excluded from git.

**No codebase analog to read.** Use the exact format from RESEARCH.md §Signing Config Pattern:
```properties
storeFile=C:/Users/omerb/keystores/simon-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=simon-release
keyPassword=YOUR_KEY_PASSWORD
```

**Key constraint:** Use forward slashes in the `storeFile` path — Java `Properties` treats `\` as an escape character.

**`.gitignore` additions required** (root `.gitignore`, after line 20 `*.local`):
```
# Keystore files — never commit
*.jks
*.keystore
keystore.properties
```

**`android/.gitignore` additions** (uncomment lines 57–58, add `keystore.properties`):
```
# Keystore files
*.jks
*.keystore
keystore.properties
```

---

### `src/config.ts` (utility, Vite env export)

**Analog:** `src/hooks/useBannerHeight.ts` (lines 1–4) — shows the project's Capacitor import style and TypeScript module export pattern.

**Import style to copy from** `src/hooks/useBannerHeight.ts` lines 1–3:
```typescript
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPluginEvents } from '@capacitor-community/admob';
```

**Target file** `src/config.ts` — no React imports needed; plain TS module:
```typescript
// src/config.ts
// Vite bakes VITE_ADMOB_BANNER_ID at build time:
//   npm run dev  → reads .env.development  (test ID)
//   npm run build → reads .env.production  (production ID)
export const ADMOB_BANNER_ID =
  import.meta.env.VITE_ADMOB_BANNER_ID ??
  'ca-app-pub-3940256099942544/6300978111'; // fallback to test ID if env missing
```

**How it is consumed** — in `src/App.tsx`, the existing hardcoded constant on line 297:
```typescript
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
```
...is replaced with an import from `src/config.ts`:
```typescript
import { ADMOB_BANNER_ID } from './config';
// ...
const bannerOptions: BannerAdOptions = {
  adId: ADMOB_BANNER_ID,
  // ...
  isTesting: false,   // also change from true → false
};
```

---

### `.env.development` (config, Vite env)

**Analog:** None in codebase. Standard Vite convention — `VITE_` prefix required for env vars to be exposed to client code.

```bash
# .env.development — loaded by `npm run dev` and `npx cap run android` (debug)
VITE_ADMOB_BANNER_ID=ca-app-pub-3940256099942544/6300978111
```

This file is safe to commit (contains only the public Google test ID).

---

### `.env.production` (config, Vite env)

**Analog:** None in codebase. Standard Vite convention — loaded by `npm run build`.

```bash
# .env.production — loaded by `npm run build` (baked into dist/ web assets)
VITE_ADMOB_BANNER_ID=YOUR_PRODUCTION_BANNER_UNIT_ID
```

**Add `.env.production` to root `.gitignore`** — production AdMob banner unit IDs are technically public (visible in APK) but should not be in version control as a best practice. Add after the `.env.development` line:
```
.env.production
```

---

### `scripts/generate_icon.py` (utility, file-I/O + transform)

**Analog:** None in codebase. No existing Python scripts. Pattern comes entirely from RESEARCH.md §Python Pillow Script.

**Complete script pattern** (from RESEARCH.md lines 591–655, verified against Pillow 11.3.0):
```python
# scripts/generate_icon.py
# Run from repo root: python scripts/generate_icon.py
from PIL import Image, ImageDraw
import os

BACKGROUND = '#0f172a'   # slate-900 — matches game's CSS background
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
```

**Key Pillow save conventions:**
- `ic_launcher.png` (square): `make_simon_icon(size).convert('RGB').save(path)` — RGB, no alpha
- `ic_launcher_round.png` (round): `make_round_icon(size).save(path)` — RGBA, keep alpha for round crop
- Store listing icon 512×512: `.convert('RGB').save(...)` — no alpha (Play Store requirement)
- Feature graphic 1024×500: `.convert('RGB').save(...)` — no alpha (Play Store requirement)
- LANCZOS is not needed if generating at exact target size (integer pixel output per density)

---

### `docs/privacy-policy.html` (static page)

**Analog:** None in codebase. `docs/` directory does not yet exist.

**Key content requirements** (from RESEARCH.md §Privacy Policy HTML Content, decision D-06):
- App name: Simon Memory Game
- Data collected by app itself: none
- Data collected by Google AdMob: Android Advertising ID, IP address, interaction data, diagnostic data
- User controls: Android device settings → Privacy → Ads → Reset/opt out of Ad ID
- Links required: `https://policies.google.com/privacy` and `https://support.google.com/admob/answer/6128543`
- GDPR note: EEA/UK users shown UMP consent dialog before ads are displayed
- Contact email: omerblecher@gmail.com
- URL this page will be live at: `https://omerblecher.github.io/SimonGame/privacy-policy.html`

**HTML structure pattern** — plain HTML5, no framework, no JavaScript, no external CSS (static GitHub Pages):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — Simon Memory Game</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 1.5rem; } h2 { font-size: 1.1rem; margin-top: 2rem; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>App:</strong> Simon Memory Game &nbsp;|&nbsp; <strong>Last updated:</strong> [DATE]</p>
  <!-- sections: Overview, What We Collect, AdMob Data Collection, User Controls, EEA/GDPR, Contact -->
</body>
</html>
```

---

## Shared Patterns

### Capacitor Platform Guard
**Source:** `src/App.tsx` lines 293–295 and `src/hooks/useBannerHeight.ts` lines 12–13
**Apply to:** Any new TypeScript code that calls AdMob or native APIs
```typescript
if (!Capacitor.isNativePlatform()) return;
if (!(window as { __admobReady?: boolean }).__admobReady) return;
```

### AdMob Import Style
**Source:** `src/App.tsx` lines 2–4
**Apply to:** `src/config.ts` (import style reference), any future AdMob-touching files
```typescript
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
```

### Groovy DSL File Reference
**Source:** `android/build.gradle` line 18
**Apply to:** `android/app/build.gradle` — how to reference sibling Gradle files
```groovy
apply from: "variables.gradle"           // top-level uses relative path
rootProject.file('keystore.properties')  // from app/build.gradle, rootProject navigates up one level
```

### XML Resource Naming Convention
**Source:** `android/app/src/main/res/values/strings.xml` lines 1–8
**Apply to:** Any new Android XML resource files — use single-quoted attribute values, 4-space indent, UTF-8 encoding header
```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="admob_app_id">ca-app-pub-4227443066128564~6206781899</string>
</resources>
```
Note: `ic_launcher_background.xml` uses double quotes — either convention is valid; match the file being edited.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `android/keystore.properties` | config (secret) | — | No secrets-file pattern exists in codebase; `local.properties` is the closest structural concept but not readable |
| `docs/privacy-policy.html` | static page | — | No HTML files in this React/TS codebase; `docs/` directory does not yet exist |
| `scripts/generate_icon.py` | utility | file-I/O | No Python scripts exist in codebase; pattern comes from RESEARCH.md |
| `.env.development` | config | — | No Vite env files in codebase yet |
| `.env.production` | config | — | No Vite env files in codebase yet |

---

## Metadata

**Analog search scope:** `android/`, `src/`, `.gitignore` files at root and `android/` level
**Files read:** 14 (build.gradle ×2, variables.gradle, src/main.tsx, src/App.tsx, src/hooks/useBannerHeight.ts, strings.xml, ic_launcher_background.xml, ic_launcher.xml ×2 (square + round), .gitignore root, android/.gitignore)
**Pattern extraction date:** 2026-05-16
