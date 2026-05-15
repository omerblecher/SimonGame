# Phase 2: Capacitor Android Baseline — Research

**Phase:** 2 — Capacitor Android Baseline
**Researched:** 2026-05-15
**Requirements:** CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06

---

## TL;DR — Critical Decision First

**Use Capacitor 8.** `@capacitor-community/admob` latest release is **v8.0.0** (December 27, 2025), which specifies `@capacitor/core: ^8.0.0` in its dependencies. Installing Capacitor 6 or 7 will block Phase 3's AdMob integration.

When the user runs `npm show @capacitor-community/admob peerDependencies` they may get an empty result (the plugin uses `dependencies` not `peerDependencies`), but checking `npm show @capacitor-community/admob` will confirm version 8 is the latest release. **Install Capacitor 8.**

---

## 1. Capacitor Version Determination (CAP-01)

**Result:** Capacitor **8** is required.

- `@capacitor-community/admob` v8.0.0 was released December 27, 2025.
- Its `package.json` lists `"@capacitor/core": "^8.0.0"` in dependencies.
- The plugin versions track Capacitor major versions: admob@6 → Capacitor 6, admob@7 → Capacitor 7, admob@8 → Capacitor 8.
- The Capacitor official docs now default to v8 as the current version.

**Verification command for CAP-01:**
```powershell
npm show @capacitor-community/admob
# Look for "latest: 8.x.x" in output — confirms Capacitor 8 is required
```

---

## 2. Installation Commands (CAP-02)

Install all Capacitor packages at the same major version (8):

```powershell
# Step 1: Install core + Android platform
npm install @capacitor/core @capacitor/android

# Step 2: Install CLI as dev dependency
npm install -D @capacitor/cli
```

**Note:** Do NOT run `npx cap init` — this project will create `capacitor.config.ts` manually (see §3) to maintain TypeScript consistency and lock in D-01/D-02 decisions without interactive prompts.

**Package.json result after install:**
```json
{
  "dependencies": {
    "@capacitor/core": "^8.x.x",
    "@capacitor/android": "^8.x.x"
  },
  "devDependencies": {
    "@capacitor/cli": "^8.x.x"
  }
}
```

**Verification for CAP-02:**
```powershell
node -e "const p = require('./package.json'); const v = p.dependencies['@capacitor/core']?.replace(/[\^~]/,'').split('.')[0]; console.log(v === '8' ? 'PASS: Capacitor 8' : 'FAIL: ' + v)"
```

---

## 3. capacitor.config.ts (CAP-03)

Create `capacitor.config.ts` at the project root (not `.json` — TypeScript is consistent with project conventions):

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otis.brooke.simon.game',
  appName: 'Simon Memory Game',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      hidden: true,
    },
  },
};

export default config;
```

**Notes:**
- `appId: 'com.otis.brooke.simon.game'` — 4-segment reverse-domain format. This is valid for Android/Gradle (minimum 2 segments required). Gradle accepts any valid Java package name format; 4 segments pose no issues.
- `webDir: 'dist'` — Vite outputs to `dist/`; matches project's `npm run build` output.
- `plugins.SystemBars.hidden: true` — Capacitor 8 built-in SystemBars plugin hides status bar and navigation bar at app launch (replaces the older StatusBar plugin approach; no external plugin needed).

**Verification for CAP-03:**
```powershell
node -e "const c = require('./capacitor.config.ts'); console.log(c)" 
# Or simply: Test-Path capacitor.config.ts && grep -c "com.otis.brooke.simon.game" capacitor.config.ts
```
- `capacitor.config.ts` exists at project root
- Contains `appId: 'com.otis.brooke.simon.game'`
- Contains `appName: 'Simon Memory Game'`
- Contains `webDir: 'dist'`

---

## 4. Android Project Scaffolding (CAP-04)

```powershell
# After installing packages and creating capacitor.config.ts:
npx cap add android
```

This creates the `android/` directory with:
- `android/app/build.gradle` — auto-populated with `applicationId "com.otis.brooke.simon.game"` from config
- `android/app/src/main/AndroidManifest.xml` — needs manual edits (see §6)
- `android/app/src/main/res/values/strings.xml` — may default to folder name; **manually verify** `app_name` = `"Simon Memory Game"`
- `android/app/src/main/res/values/styles.xml` — theme config

**Verification for CAP-04:**
```powershell
Test-Path android/app/build.gradle
# AND
Select-String "com.otis.brooke.simon.game" android/app/build.gradle
```

---

## 5. AndroidManifest.xml Modifications

After `npx cap add android`, make these edits to `android/app/src/main/AndroidManifest.xml`:

### Portrait Lock (D-06)
Add `android:screenOrientation="portrait"` to the `<activity>` tag for `MainActivity`:
```xml
<activity
    android:name=".MainActivity"
    android:screenOrientation="portrait"
    ...>
```

### Full-Screen / Edge-to-Edge (D-07)
Capacitor 8's `SystemBars: { hidden: true }` in `capacitor.config.ts` handles the JavaScript-side hiding. For a game that should launch fully immersive, also ensure the activity theme uses a no-action-bar style (Capacitor scaffold already sets this via `AppTheme.NoActionBar`).

No additional AndroidManifest flags are required beyond the portrait lock — Capacitor 8's SystemBars plugin handles status bar and navigation bar hiding natively.

---

## 6. Build Pipeline (CAP-05)

Full build-and-sync pipeline:

```powershell
# Step 1: Build web assets
npm run build

# Step 2: Sync to Android project (copies dist/ into android/ assets)
npx cap sync android

# Step 3a: Run directly on connected emulator or device
npx cap run android

# Step 3b: Alternative — open in Android Studio, then click Run
npx cap open android
```

**Windows-specific notes:**
- `npx cap run android` on Windows will list available emulators/devices — select the running AVD.
- If `npx cap run android` hangs or doesn't find the emulator, use `npx cap open android` instead and launch from Android Studio's Run button.
- Ensure `ANDROID_HOME` environment variable is set (typically `C:\Users\<user>\AppData\Local\Android\Sdk`).
- Java 17+ is required. Verify: `java -version`.

**Iterative development workflow:**
```powershell
npm run build && npx cap sync android
# Then re-run from Android Studio (no need to repeat cap open each time)
```

**Verification for CAP-05:**
```powershell
npm run build
if ($?) { npx cap sync android } else { Write-Error "Build failed" }
# Exits 0 with no errors = PASS
```

---

## 7. Emulator Run and Audio Risk (CAP-06, D-05)

**Run command:**
```powershell
npx cap run android
# Select the running AVD when prompted
```

**Audio on emulators — Known Limitation:**
Web Audio API is frequently silent on Android AVD emulators. This is a systemic emulator limitation, not a code bug:
- The Phase 1 fix (`await audioCtxRef.current.resume()`) is required for real devices and does not degrade emulator behavior.
- If emulator audio is silent, document as known limitation — does NOT block CAP-06 completion.
- Physical device audio test is deferred to Phase 3 per D-05.

**Game verification checklist on emulator (CAP-06):**
1. App installs and launches without crash
2. Game UI visible — 4 colored pads render correctly, no visual regressions
3. Start button initiates sequence playback — pads light up in sequence (glow visible)
4. User can tap pads during input phase — game accepts input
5. Score increments correctly on correct sequence
6. Incorrect pad triggers game-over state; reset works
7. Audio: note in verification whether tones are audible or silent (emulator caveat)

---

## 8. main.tsx Changes

**No changes to `src/main.tsx` required for Phase 2.**

Capacitor's WebView bridge injects automatically — no manual platform detection needed. When Phase 3 adds AdMob, `main.tsx` will be extended with:
```typescript
// Phase 3 will add: import { AdMob } from '@capacitor-community/admob';
// await AdMob.initialize(...);
```
Keep `main.tsx` unchanged now so Phase 3 can extend it cleanly.

---

## 9. strings.xml and build.gradle Verification

After `npx cap add android`, verify these were auto-populated correctly:

**`android/app/src/main/res/values/strings.xml`:**
```xml
<string name="app_name">Simon Memory Game</string>
```
If it defaults to the folder name instead, manually update it.

**`android/app/build.gradle`:**
```groovy
applicationId "com.otis.brooke.simon.game"
```
Capacitor writes this from `appId` in the config — should be correct but verify.

---

## 10. Environment Prerequisites (Check Before Running)

| Prerequisite | Verify Command | Required Version |
|-------------|---------------|-----------------|
| Java JDK | `java -version` | 17+ |
| Android Studio | Visual check | Giraffe 2022.3.1+ |
| AVD configured | `emulator -list-avds` | API 24+ image |
| ANDROID_HOME | `echo $env:ANDROID_HOME` | Must be set |
| Node.js | `node -v` | 18+ |

---

## 11. Validation Architecture

Concrete commands to verify all 6 requirements at the end of Phase 2:

```powershell
# CAP-01: AdMob version check — confirms Capacitor 8 is the correct choice
npm show @capacitor-community/admob | Select-String "latest"
# Expected: "latest: 8.x.x"

# CAP-02: Capacitor packages installed at major version 8
node -e "const p=require('./package.json'); ['@capacitor/core','@capacitor/android'].forEach(k=>{ const v=p.dependencies[k]; console.log(k, v, v?.startsWith('^8') ? 'PASS' : 'FAIL') })"

# CAP-03: Config file exists with correct values
Select-String "com.otis.brooke.simon.game" capacitor.config.ts
Select-String "Simon Memory Game" capacitor.config.ts
Select-String "dist" capacitor.config.ts

# CAP-04: Android platform scaffolded
Test-Path android/app/build.gradle
Select-String "com.otis.brooke.simon.game" android/app/build.gradle

# CAP-05: Build pipeline runs cleanly
npm run build; npx cap sync android
# Both must exit 0

# CAP-06: Manual verification on emulator
# Run: npx cap run android (or npx cap open android)
# Check: app installs, game renders, pads interactive, score works, game-over resets
```

---

## 12. Plan Structure Recommendation

This phase maps cleanly to **2 plans**:

**Plan 1 (Wave 1): Environment + Install + Config**
- Verify prerequisites (Java 17, ANDROID_HOME)
- Run `npm show @capacitor-community/admob` to confirm Capacitor version (CAP-01)
- Install `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` at Capacitor 8 (CAP-02)
- Create `capacitor.config.ts` with appId, appName, webDir, SystemBars hidden (CAP-03)
- Run `npx cap add android` (CAP-04)
- Fix `strings.xml` if app_name is wrong

**Plan 2 (Wave 2): AndroidManifest + Build + Emulator Run**
- Add portrait lock to AndroidManifest.xml (D-06)
- Verify build.gradle applicationId is correct
- Run build pipeline: `npm run build && npx cap sync android` (CAP-05)
- Run on emulator: `npx cap run android` (CAP-06)
- Document emulator audio status (pass or known limitation)

---

## RESEARCH COMPLETE

All 6 requirements (CAP-01 through CAP-06) and all 8 research priorities addressed.
Key finding: **Use Capacitor 8** — aligns with `@capacitor-community/admob@8.0.0` released December 2025.
