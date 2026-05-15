# Phase 3: AdMob Integration - Research

**Researched:** 2026-05-15
**Domain:** @capacitor-community/admob v8 · Google UMP consent · Capacitor App plugin · Android manifest configuration
**Confidence:** HIGH — all critical API signatures verified from published package source (dist/esm/*.d.ts extracted from npm tarball)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Banner pushes game content up — does NOT overlay. Spacer `<div>` at bottom of App.tsx reserves height.
- **D-02:** Spacer pre-reserves 50px before banner loads. `bannerAdLoaded` (or `bannerAdSizeChanged` — see critical finding below) updates to actual height.
- **D-03:** Spacer `<div>` lives inside App.tsx JSX at the bottom of the game container.
- **D-04:** `useBannerHeight()` hook handles the banner-loaded listener and returns height as `number`. Returns `0` in browser.
- **D-05:** All AdMob calls wrapped in `if (Capacitor.isNativePlatform())`. Browser dev server continues to work.
- **D-06:** `useBannerHeight()` returns `0` when `!Capacitor.isNativePlatform()`.
- **D-07:** User obtains real AdMob App ID from AdMob console. Plan uses `YOUR_ADMOB_APP_ID` placeholder.
- **D-08:** Phase 3 uses test banner unit ID `ca-app-pub-3940256099942544/6300978111`.
- **D-09:** UMP consent runs before React renders. `main.tsx` awaits full sequence before `ReactDOM.createRoot().render()`.
- **D-10:** Always run UMP flow regardless of region — UMP SDK auto-detects EEA/UK.
- **D-11:** Phase 3 must verify audio on a physical Android device.

### Claude's Discretion

- Exact async pattern in `main.tsx` for sequencing UMP consent + `AdMob.initialize()` before render (use try/catch; if consent or init fails, render anyway).
- Whether `useBannerHeight()` uses `AdMob.addListener` or `Capacitor` event bus — use whichever the plugin documents.
- Exact `AndroidManifest.xml` changes beyond App ID.
- Whether `AppStateChange` listener lives in the same hook or a separate one — keep simple; inline is fine.

### Deferred Ideas (OUT OF SCOPE)

None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADM-01 | `@capacitor-community/admob` installed at version compatible with Capacitor 8 | v8.0.0 confirmed, no peer deps beyond @capacitor/core ^8.0.0 |
| ADM-02 | AdMob App ID declared as `<meta-data>` in `AndroidManifest.xml` | Exact meta-data format + strings.xml pattern verified from plugin source |
| ADM-03 | GDPR/UMP consent flow before `AdMob.initialize()` | Exact method sequence: `requestConsentInfo()` → `showConsentForm()` verified |
| ADM-04 | `AdMob.initialize()` awaited in `main.tsx` before React renders | `initialize(options?)` Promise<void> confirmed; async main.tsx pattern documented |
| ADM-05 | Banner at bottom using test ad unit ID | `showBanner(BannerAdOptions)` with `BannerAdPosition.BOTTOM_CENTER` and test ID |
| ADM-06 | 50dp+ gap between banner and pads | 50px spacer pre-reserve satisfies policy; `BANNER` size is 320×50dp |
| ADM-07 | `bannerAdLoaded` event for dynamic spacer height | **Critical:** `bannerAdLoaded` has no payload. Use `bannerAdSizeChanged` for height. |
| ADM-08 | Banner hidden/shown on app pause/resume | `App.addListener('appStateChange', ...)` from `@capacitor/app` — must be installed |
</phase_requirements>

---

## Summary

Phase 3 integrates `@capacitor-community/admob` v8.0.0 into the React Simon game running on Capacitor 8. The integration has three moving parts: (1) a pre-render initialization sequence in `main.tsx` that runs UMP GDPR consent then `AdMob.initialize()` before React mounts, (2) a banner ad displayed at bottom of screen via `showBanner()`, and (3) a custom `useBannerHeight()` hook that listens for banner size events and returns the height for a spacer `<div>` in App.tsx.

One critical deviation from the CONTEXT.md description is required: the `bannerAdLoaded` event carries **no payload** — verified from the published TypeScript definitions in the npm package. The actual banner height is delivered by the `bannerAdSizeChanged` event, which carries `{ width: number; height: number }`. The `useBannerHeight` hook should listen to `bannerAdSizeChanged` (not `bannerAdLoaded`) to get the exact pixel height. `bannerAdLoaded` can still be used as a signal that the banner rendered successfully if desired.

The `AppStateChange` event for ADM-08 is **not** part of the admob plugin — it comes from the Capacitor core `@capacitor/app` package, which is **not yet installed** in this project. Installing it is a required task.

**Primary recommendation:** Install `@capacitor-community/admob@8.0.0` and `@capacitor/app@latest`, add `<meta-data>` + `admob_app_id` string resource to Android, implement the consent→init→render sequence in `main.tsx`, show the banner after initialization, and hook `bannerAdSizeChanged` (not `bannerAdLoaded`) for the dynamic spacer height.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| UMP consent flow | Native Android (UMP SDK via plugin) | main.tsx (orchestration) | Dialog is rendered natively; main.tsx only calls the plugin methods |
| AdMob initialization | Native Android (Google SDK) | main.tsx (lifecycle) | SDK init happens in native layer; JS awaits the Promise |
| Banner display | Native Android (AdMob overlay) | App.tsx JSX (spacer) | Ad renders in native layer above WebView; spacer div is DOM-only |
| Banner height detection | @capacitor-community/admob plugin | useBannerHeight hook | Plugin fires bannerAdSizeChanged; hook receives and exposes the value |
| App pause/resume detection | @capacitor/app plugin | useBannerHeight (or inline) | App plugin provides appStateChange; admob plugin has no such event |
| Banner spacer layout | Browser / React (DOM) | — | The spacer div is pure CSS/React; no native involvement |

---

## Standard Stack

### Core (new in Phase 3)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@capacitor-community/admob` | 8.0.0 | AdMob banner ads + UMP consent API | Only maintained Capacitor AdMob plugin; community-official, 5yr history |
| `@capacitor/app` | ^8.1.0 | `appStateChange` event for banner hide/show | Official Capacitor plugin; provides lifecycle events for native app state |

### Existing (already installed, used in Phase 3)

| Library | Version | Purpose |
|---------|---------|---------|
| `@capacitor/core` | ^8.3.4 | `Capacitor.isNativePlatform()` guard |
| `react` | ^19.2.4 | `useEffect`, `useState` for hook |

### Installation

```bash
npm install @capacitor-community/admob@8.0.0
npm install @capacitor/app
npx cap sync android
```

No additional `npm install` commands needed. The plugin's `build.gradle` already declares its own Google Play Services Ads and UMP SDK dependencies — they are pulled in automatically when Gradle builds the Android project.

### Version Verification

```
@capacitor-community/admob: 8.0.0 (published 2025-12-27) [VERIFIED: npm registry]
@capacitor/app: 8.1.0 (published 2026-03-25) [VERIFIED: npm registry]
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@capacitor-community/admob` | npm | 6 yrs (2020-06-27) | Substantial | github.com/capacitor-community/admob | [OK] | Approved |
| `@capacitor/app` | npm | 5+ yrs (Ionic team) | Very high | github.com/ionic-team/capacitor-plugins | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No `postinstall` scripts found on either package.

---

## Architecture Patterns

### System Architecture Diagram

```
main.tsx (before React render)
  │
  ├─► Capacitor.isNativePlatform()? ──No──► ReactDOM.render() immediately
  │
  Yes
  │
  ├─► AdMob.requestConsentInfo()
  │      ↓ AdmobConsentInfo { canRequestAds, isConsentFormAvailable, status }
  ├─► (if !canRequestAds && isConsentFormAvailable) AdMob.showConsentForm()
  │      ↓ native UMP dialog shown (EEA users only)
  ├─► AdMob.initialize({ initializeForTesting: true })
  │      ↓ Google AdMob SDK initialized
  └─► ReactDOM.createRoot().render(<App />) ← React mounts here

App.tsx (after mount)
  │
  ├─► useBannerHeight() hook
  │      ├─► AdMob.addListener('bannerAdSizeChanged', (size) => setHeight(size.height))
  │      └─► returns bannerHeight (0 in browser, 50 default pre-load, actual post-load)
  │
  ├─► useEffect on mount (if isNativePlatform)
  │      └─► AdMob.showBanner({ adId: TEST_ID, position: BOTTOM_CENTER, adSize: BANNER })
  │
  ├─► App.addListener('appStateChange', ({ isActive }) => {
  │      isActive ? AdMob.resumeBanner() : AdMob.hideBanner()
  │   })
  │
  └─► JSX: <div style={{ height: `${bannerHeight}px` }} aria-hidden="true" />
```

### Recommended Project Structure

```
src/
├── main.tsx          # Modified: UMP consent + AdMob.initialize() before render
├── App.tsx           # Modified: useBannerHeight() call + spacer div (no refactor)
├── hooks/
│   └── useBannerHeight.ts   # New: bannerAdSizeChanged listener, returns number
└── style.css         # Unchanged
android/
├── app/src/main/AndroidManifest.xml   # Modified: meta-data for App ID
├── app/src/main/res/values/strings.xml  # Modified: admob_app_id string
└── variables.gradle  # Unchanged (plugin uses its own defaults)
index.html            # Modified: body background-color #0f172a
```

### Pattern 1: UMP Consent + AdMob Initialize Sequence (main.tsx)

**What:** Full pre-render async sequence in main.tsx
**When to use:** Always — this is the only correct ordering per ADM-03 + ADM-04

```typescript
// Source: @capacitor-community/admob dist/esm/consent/consent-definition.interface.d.ts
// + dist/esm/definitions.d.ts (verified from npm tarball 8.0.0)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

async function initializeAdMob(): Promise<void> {
  // UMP consent — auto-detects EEA/UK; non-EEA returns immediately
  const consentInfo = await AdMob.requestConsentInfo();
  if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
    await AdMob.showConsentForm();
  }
  // Initialize after consent resolves
  await AdMob.initialize({
    initializeForTesting: true, // Phase 3 only — set false in Phase 4
  });
}

const rootEl = document.getElementById('app') as HTMLElement;
const root = ReactDOM.createRoot(rootEl);

if (Capacitor.isNativePlatform()) {
  try {
    await initializeAdMob();
  } catch (err) {
    // Graceful degradation: always render the game
    console.warn('AdMob initialization failed, rendering without ads:', err);
  }
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

> Note: Top-level `await` requires `"module": "ESNext"` in tsconfig (already `"module": "ESNext"` based on Vite 7 default). Verify tsconfig.json if TypeScript errors appear.

### Pattern 2: useBannerHeight Hook

**What:** Registers `bannerAdSizeChanged` listener, returns current height as number
**Critical finding:** Use `bannerAdSizeChanged` (not `bannerAdLoaded`) for height. `bannerAdLoaded` has no payload.

```typescript
// Source: dist/esm/banner/banner-definitions.interface.d.ts
// dist/esm/banner/banner-ad-plugin-events.enum.d.ts
// dist/esm/banner/banner-size.interface.d.ts — all verified from npm tarball
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPluginEvents } from '@capacitor-community/admob';

const BANNER_HEIGHT_DEFAULT = 50; // standard banner dp, pre-reserves before load

export function useBannerHeight(): number {
  const [bannerHeight, setBannerHeight] = useState<number>(
    Capacitor.isNativePlatform() ? BANNER_HEIGHT_DEFAULT : 0,
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | null = null;

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      setBannerHeight(size.height);
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return bannerHeight;
}
```

### Pattern 3: showBanner + AppStateChange in App.tsx

**What:** Show banner after mount; hide/resume on app state changes
**Note:** `App` (from `@capacitor/app`) is a separate import from `AdMob`

```typescript
// Source: dist/esm/banner/banner-definitions.interface.d.ts (AdMob)
// Source: https://capacitorjs.com/docs/apis/app (App.addListener)
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
} from '@capacitor-community/admob';

// In App.tsx useEffect on mount:
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const bannerOptions: BannerAdOptions = {
    adId: 'ca-app-pub-3940256099942544/6300978111', // test ID — replace in Phase 4
    adSize: BannerAdSize.BANNER,   // 320×50dp
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true, // Phase 3 only
  };

  AdMob.showBanner(bannerOptions).catch(console.error);

  // App state listener for banner visibility
  let appStateHandle: { remove: () => Promise<void> } | null = null;
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      AdMob.resumeBanner().catch(console.error);
    } else {
      AdMob.hideBanner().catch(console.error);
    }
  }).then((h) => {
    appStateHandle = h;
  });

  return () => {
    AdMob.removeBanner().catch(console.error);
    appStateHandle?.remove();
  };
}, []);
```

### Pattern 4: AndroidManifest.xml + strings.xml

**What:** Required Android native configuration for AdMob SDK
**Why strings.xml:** The standard pattern (verified from plugin README and Google docs) — keeps the App ID out of XML attributes for easier environment switching

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<!-- Add inside <application> block, before </application> -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="@string/admob_app_id"/>
```

```xml
<!-- android/app/src/main/res/values/strings.xml -->
<!-- Add inside <resources> -->
<string name="admob_app_id">YOUR_ADMOB_APP_ID</string>
<!-- Replace YOUR_ADMOB_APP_ID with real value e.g. ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX -->
```

**Permissions:** The plugin's own `AndroidManifest.xml` declares `ACCESS_NETWORK_STATE` and `INTERNET`. The app manifest already has `INTERNET`. Capacitor merges plugin manifests during sync — no manual permission additions required.

**build.gradle:** No changes required in `android/app/build.gradle`. The plugin's `android/build.gradle` already declares Google Play Services Ads (`play-services-ads:24.9.+`) and UMP SDK (`user-messaging-platform:4.0.0`) as its own dependencies. These are pulled in automatically via Gradle dependency resolution when `npx cap sync android` is run.

**variables.gradle:** No changes required. The project's `variables.gradle` does not need `playServicesAdsVersion` or `userMessagingPlatformVersion` entries — the plugin uses its own defaults if these properties are not set in the root project.

### Anti-Patterns to Avoid

- **Using `bannerAdLoaded` to get height:** This event has no payload. It fires when the ad loads but delivers no size info. Use `bannerAdSizeChanged` instead.
- **Calling `showBanner()` before `AdMob.initialize()`:** Results in silence (no ad, no error). Always init first.
- **Calling `showBanner()` in a `useEffect` without `isNativePlatform()` guard:** Crashes in browser. Always guard.
- **Direct `android:value` for App ID in AndroidManifest:** Works but couples the ID to the file. Use `@string/admob_app_id` + strings.xml for clean separation.
- **Using `removeBanner()` on app background:** `removeBanner()` destroys the ad object; `hideBanner()` keeps it ready for resume. Use `hideBanner()` on background, `resumeBanner()` on foreground. Use `removeBanner()` only on component unmount.
- **Importing `App` from `@capacitor/app` as just `App`:** Conflicts with the React `App` component import in `App.tsx`. Use `import { App as CapacitorApp } from '@capacitor/app'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GDPR consent dialog | Custom consent UI | `AdMob.requestConsentInfo()` + `AdMob.showConsentForm()` | UMP SDK handles EEA detection, form rendering, consent storage, IAB TCF compliance |
| App foreground/background detection | `window.visibilitychange` or `document.addEventListener` | `App.addListener('appStateChange', ...)` from `@capacitor/app` | Web visibility events are unreliable in Capacitor WebView; native lifecycle hooks are authoritative |
| Banner sizing calculation | Fixed px constants or screen size math | `bannerAdSizeChanged` event from admob plugin | Actual size varies by device density and ad network response; only the SDK knows the rendered size |
| Ad unit testing | Mock ad implementations | `isTesting: true` in `AdMob.initialize()` + test unit ID | Google's test infrastructure returns real-looking test ads; mocking misses SDK-level bugs |

**Key insight:** The Google UMP SDK (bundled inside the admob plugin) handles all complexity of consent: region detection, form display, consent storage, and the IAB TCF 2.0 signal that SSPs require. Writing a custom consent dialog would not satisfy IAB compliance requirements.

---

## Common Pitfalls

### Pitfall 1: `bannerAdLoaded` Has No Height Payload

**What goes wrong:** Hook listens to `bannerAdLoaded` expecting `{ height }` on the event — field is `undefined`, spacer stays at `50px` forever (or crashes if height is used in arithmetic expecting a number).

**Why it happens:** CONTEXT.md references `bannerAdLoaded` for height (D-02, ADM-07). The plugin's type definition shows `bannerAdLoaded` listener as `listenerFunc: () => void` — no arguments. Height is in `bannerAdSizeChanged` whose listener is `listenerFunc: (info: AdMobBannerSize) => void`.

**How to avoid:** Use `BannerAdPluginEvents.SizeChanged` (`"bannerAdSizeChanged"`) in `useBannerHeight`. The two events fire together when the banner loads: `bannerAdSizeChanged` fires first with dimensions, then `bannerAdLoaded` fires as a completion signal.

**Warning signs:** `size` parameter is `undefined` in listener; TypeScript would catch this at compile time if types are imported correctly.

### Pitfall 2: `@capacitor/app` Not Installed

**What goes wrong:** `import { App } from '@capacitor/app'` throws a module resolution error at build time. The project's `package.json` currently has no `@capacitor/app` entry.

**Why it happens:** `AppStateChange` for ADM-08 is in the Capacitor App plugin (`@capacitor/app`), not in the admob plugin. This is not mentioned in most AdMob-only tutorials.

**How to avoid:** Run `npm install @capacitor/app` as a required setup step before any code changes.

**Warning signs:** `Module not found: @capacitor/app` error during `npm run build`.

### Pitfall 3: Top-Level `await` in main.tsx TypeScript Config

**What goes wrong:** `await initializeAdMob()` at the top level of `main.tsx` produces TypeScript error `TS1378: Top-level 'await' expressions are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', 'nodenext', or 'preserve'`.

**Why it happens:** The Vite project may have `"module": "ESNext"` (correct) but the TypeScript `"target"` may be too low. Both must be at least `ES2017` for `await` and `ESNext`/`ES2022` for top-level await.

**How to avoid:** Check `tsconfig.json` — `"module"` must be `"ESNext"` and `"target"` must be `"ES2022"` or higher. Alternatively, wrap the entire init in an IIFE: `(async () => { ... })()` which works with any target.

**Warning signs:** `TS1378` error during `npm run build`.

**Safe alternative pattern:**
```typescript
(async () => {
  if (Capacitor.isNativePlatform()) {
    try { await initializeAdMob(); } catch { /* proceed anyway */ }
  }
  root.render(<React.StrictMode><App /></React.StrictMode>);
})();
```

### Pitfall 4: `APP_ID` vs `AD_UNIT_ID` Confusion in AndroidManifest

**What goes wrong:** AdMob App ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`, contains `~`) is placed in `AndroidManifest.xml`. Ad Unit ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`, contains `/`) goes in `showBanner({ adId: ... })`. Swapping them causes: AdMob SDK crash at launch (if Ad Unit ID in manifest) or no ads with cryptic error (if App ID in showBanner).

**How to avoid:** App ID always goes in `strings.xml` / `AndroidManifest.xml`. Ad Unit ID always goes in the TypeScript `showBanner` call. The `~` vs `/` delimiter is a reliable distinguisher.

### Pitfall 5: Import Name Collision (`App` from `@capacitor/app` vs React's `App` component)

**What goes wrong:** `import { App } from '@capacitor/app'` in App.tsx collides with the exported `App` component itself.

**How to avoid:** Use `import { App as CapacitorApp } from '@capacitor/app'` whenever this import appears in `App.tsx`.

### Pitfall 6: `hideBanner()` vs `removeBanner()` on App Background

**What goes wrong:** Calling `removeBanner()` on app background destroys the banner object. When the app returns to foreground, `resumeBanner()` throws because there is no banner to resume. A new `showBanner()` call is needed instead, which triggers another ad request and a visible load delay.

**How to avoid:** On app background: `hideBanner()`. On app foreground: `resumeBanner()`. `removeBanner()` only on component unmount cleanup.

---

## Code Examples

### Complete BannerAdOptions type (from verified source)

```typescript
// Source: dist/esm/banner/banner-ad-options.interface.d.ts + shared/ad-options.interface.d.ts
// Verified from @capacitor-community/admob@8.0.0 npm tarball

interface BannerAdOptions {
  adId: string;                    // Required — test: 'ca-app-pub-3940256099942544/6300978111'
  adSize?: BannerAdSize;           // Default: ADAPTIVE_BANNER — use BANNER (320×50dp) for Phase 3
  position?: BannerAdPosition;     // Default: TOP_CENTER — use BOTTOM_CENTER
  margin?: number;                 // px margin from position edge, default 0
  isTesting?: boolean;             // default false — set true in Phase 3
  npa?: boolean;                   // Non-Personalized Ads, default false
  immersiveMode?: boolean;         // Immersive mode for full-screen, default false
}

enum BannerAdSize {
  BANNER = "BANNER",               // 320×50dp — standard banner
  FULL_BANNER = "FULL_BANNER",     // 468×60dp
  LARGE_BANNER = "LARGE_BANNER",   // 320×100dp
  MEDIUM_RECTANGLE = "MEDIUM_RECTANGLE", // 300×250dp
  LEADERBOARD = "LEADERBOARD",     // 728×90dp
  ADAPTIVE_BANNER = "ADAPTIVE_BANNER",   // full-width auto-height (default)
  SMART_BANNER = "SMART_BANNER",   // deprecated, use ADAPTIVE_BANNER
}

enum BannerAdPosition {
  TOP_CENTER = "TOP_CENTER",
  CENTER = "CENTER",
  BOTTOM_CENTER = "BOTTOM_CENTER", // use this for ADM-05
}
```

### Complete AdMobInitializationOptions (verified)

```typescript
// Source: dist/esm/definitions.d.ts — verified from @capacitor-community/admob@8.0.0 npm tarball
interface AdMobInitializationOptions {
  testingDevices?: string[];       // device IDs for test ads (optional)
  initializeForTesting?: boolean;  // default false — set true in Phase 3
  tagForChildDirectedTreatment?: boolean;
  tagForUnderAgeOfConsent?: boolean;
  maxAdContentRating?: MaxAdContentRating;
}
```

### Complete Consent API (verified)

```typescript
// Source: dist/esm/consent/consent-definition.interface.d.ts — verified from npm tarball
// AdmobConsentInfo shape:
interface AdmobConsentInfo {
  status: AdmobConsentStatus;          // NOT_REQUIRED | OBTAINED | REQUIRED | UNKNOWN
  isConsentFormAvailable?: boolean;
  canRequestAds: boolean;              // true = safe to show ads
  privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus;
}

// Correct consent flow:
const consentInfo = await AdMob.requestConsentInfo(); // no options needed for Phase 3
if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
  await AdMob.showConsentForm(); // returns updated AdmobConsentInfo
}
// Then call AdMob.initialize()
```

### AppStateChange listener (Capacitor App plugin)

```typescript
// Source: https://capacitorjs.com/docs/apis/app (CITED: capacitorjs.com/docs/apis/app)
import { App as CapacitorApp } from '@capacitor/app';

const handle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    AdMob.resumeBanner().catch(console.error);
  } else {
    AdMob.hideBanner().catch(console.error);
  }
});
// Cleanup: handle.remove()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `requestConsentInfoUpdate()` (v4-era) | `requestConsentInfo()` | v5.0.0 | Simpler API; same functionality |
| `showConsentForm()` always | Check `canRequestAds` first, then `showConsentForm()` | v7.0.3 (added `canRequestAds`) | Avoids showing unnecessary dialog to users who already consented |
| Hardcoded `android:value` for App ID | `@string/admob_app_id` + strings.xml | Ongoing best practice | Keeps IDs out of AndroidManifest for easier env switching |
| SMART_BANNER size | ADAPTIVE_BANNER (default) | v3+ | SMART_BANNER deprecated; ADAPTIVE_BANNER is full-width responsive |
| Capacitor v6/v7 admob plugin | v8 with Capacitor 8 | Dec 2025 (v8.0.0 published 2025-12-27) | Same API shape; peerDep bump only — no breaking API changes found |

**Deprecated/outdated:**
- `BannerAdSize.SMART_BANNER`: deprecated in the plugin, use `ADAPTIVE_BANNER` or `BANNER`.
- `requestConsentInfoUpdate`: not present in v5+ API — use `requestConsentInfo`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `BannerAdSize.BANNER` renders at exactly 50dp height | Pitfalls, UI-SPEC | Spacer pre-reserve of 50px could be wrong; `bannerAdSizeChanged` corrects this at runtime anyway |
| A2 | No `build.gradle` or `variables.gradle` changes required in app project — plugin's own defaults are sufficient | Standard Stack, Patterns | If Gradle version conflict occurs with `playServicesAdsVersion: 24.9.+`, user may need to pin a version in project `variables.gradle` |
| A3 | v8 has no breaking API changes vs v7 beyond the Capacitor peer dep bump | State of the Art | If v8 changed any method signature, code patterns here would be wrong — verified from dist types, confidence HIGH |

---

## Open Questions (RESOLVED)

1. **tsconfig.json `module` setting**
   - What we know: Top-level `await` in main.tsx requires `"module": "ESNext"` or higher.
   - What's unclear: The current tsconfig.json was not read — it may or may not already have the correct setting.
   - Recommendation: Planner should include a verification step to read tsconfig.json. If `"module"` is not `"ESNext"`, use the IIFE pattern instead of top-level await.

2. **`bannerAdSizeChanged` vs `bannerAdLoaded` discrepancy with CONTEXT.md**
   - What we know: `bannerAdLoaded` has `listenerFunc: () => void` — no payload. `bannerAdSizeChanged` has `listenerFunc: (info: AdMobBannerSize) => void`.
   - What's unclear: CONTEXT.md D-02 and ADM-07 reference `bannerAdLoaded` for height. This is technically incorrect per the plugin's type definitions.
   - Recommendation: Use `bannerAdSizeChanged` for height. `bannerAdLoaded` can optionally be used as a "banner is ready" signal but not for height. The planner should note this deviation from CONTEXT.md.

3. **`initializeForTesting` vs `isTesting` in AdOptions**
   - What we know: `AdMobInitializationOptions.initializeForTesting` controls SDK-wide test mode. `AdOptions.isTesting` on banner options also exists as a per-ad flag.
   - What's unclear: Whether both flags must be set, or just one.
   - Recommendation: Set both `initializeForTesting: true` in `initialize()` AND `isTesting: true` in `BannerAdOptions` during Phase 3. This matches the pattern in the existing PITFALLS.md research.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Java 21 | Plugin build.gradle (`JavaVersion.VERSION_21`) | ✓ | JDK 21.0.7 at C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot | — |
| Android SDK (compileSdk 36) | Plugin build.gradle (`compileSdk = 36`) | Verify | Plugin defaults to 36; project variables.gradle has 36 | Update SDK Manager |
| npm / Node.js | Package installation | ✓ | In use | — |
| Physical Android device | ADM-08, D-11 audio verification | Human action | — | Emulator (audio may be silent per known limitation) |

**Missing dependencies with no fallback:**
- Physical Android device for D-11 audio verification — emulator audio is known to be unreliable (per Phase 2 D-05).

**Missing dependencies with fallback:**
- Android SDK Platform 36 — may need to be downloaded in Android Studio SDK Manager if not present. Fallback: set `compileSdkVersion = 35` in `variables.gradle` (both project and plugin accept this). However, plugin defaults to 36.

**Note on compileSdk 36:** The plugin's `build.gradle` defaults to `compileSdk = 36`. The project's `variables.gradle` already has `compileSdkVersion = 36`. These match — no conflict. Android SDK Platform 36 must be installed in Android Studio.

---

## Validation Architecture

The project's REQUIREMENTS.md and CLAUDE.md explicitly defer unit/e2e tests to v2. The phase has no test framework configured and no `workflow.nyquist_validation` key in `.planning/config.json`.

Manual verification steps substitute for automated tests in this phase:

| Req ID | Behavior | Verification |
|--------|----------|--------------|
| ADM-01 | Package installed | `npm list @capacitor-community/admob` shows 8.0.0 |
| ADM-02 | App ID in manifest | Check AndroidManifest.xml for meta-data + strings.xml for value |
| ADM-03 | Consent before init | Code review of main.tsx sequence |
| ADM-04 | Init before render | Code review of main.tsx ordering |
| ADM-05 | Test banner visible | Run on emulator/device, observe green "Test Ad" banner at bottom |
| ADM-06 | 50dp+ gap | Visual inspection — pads must not be obscured |
| ADM-07 | Dynamic spacer height | Observe layout after banner loads — no gap between game and banner |
| ADM-08 | Banner hides on background | Press home button, return to app — banner hides then reappears |

---

## Security Domain

AdMob and UMP handle all privacy/consent compliance internally via the Google SDK. No custom security controls are required in the app code.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not applicable |
| V3 Session Management | No | Not applicable |
| V4 Access Control | No | Not applicable |
| V5 Input Validation | No | No user input in AdMob integration layer |
| V6 Cryptography | No | SDK handles its own transport security (HTTPS) |

**Threat patterns specific to AdMob integration:**

| Pattern | Risk | Mitigation |
|---------|------|------------|
| Ad unit ID exposure in source code | LOW — test ID is public by design; prod ID exposure risks invalid traffic policy violation | Use test ID in Phase 3; Phase 4 plan should use env var or build config for prod ID |
| AdMob App ID exposure | LOW — App IDs are not secrets; they are visible in any APK | Acceptable — no mitigation needed |
| UMP consent bypass | Users who deny consent must not see personalized ads | UMP SDK enforces this; `npa: true` flag in `AdOptions` can be used to explicitly request non-personalized ads |

---

## Sources

### Primary (HIGH confidence)

- `@capacitor-community/admob@8.0.0` npm tarball — `dist/esm/banner/*.d.ts`, `dist/esm/consent/*.d.ts`, `dist/esm/definitions.d.ts`, `android/build.gradle` — all API signatures, event names, payload shapes, and build.gradle variables verified from published package source. [VERIFIED: npm registry]
- `@capacitor/app@8.1.0` npm registry — package description, peerDependencies confirmed. [VERIFIED: npm registry]
- `capacitorjs.com/docs/apis/app` — `appStateChange` event name, `AppState.isActive` property, `App.addListener` signature. [CITED: capacitorjs.com/docs/apis/app]

### Secondary (MEDIUM confidence)

- `github.com/capacitor-community/admob` README via WebFetch — installation instructions, AndroidManifest pattern (strings.xml approach), UMP consent example flow. Cross-verified against extracted package source.
- `github.com/capacitor-community/admob` releases page — v8.0.0 release date (Dec 27, 2024), Capacitor 8 support confirmation.

### Tertiary (LOW confidence — not relied upon for API decisions)

- Pre-existing `.planning/research/PITFALLS.md` — pitfall descriptions, test IDs, placement policy guidance. Used for reference; API specifics superseded by verified source.

---

## Metadata

**Confidence breakdown:**
- Standard stack / versions: HIGH — verified from npm registry directly
- API signatures (`showBanner`, `BannerAdOptions`, consent methods, event names/payloads): HIGH — extracted from published TypeScript declaration files in npm tarball
- AndroidManifest / strings.xml pattern: HIGH — verified from plugin README + cross-checked against plugin's own AndroidManifest
- `AppStateChange` API: HIGH — verified from official Capacitor docs
- build.gradle changes (none needed): HIGH — verified from plugin's own build.gradle declaring its own deps
- v8 vs v7 breaking changes: MEDIUM — no explicit BREAKING.md found; release notes sparse; API types show no breaking changes vs documented v7 API

**Research date:** 2026-05-15
**Valid until:** 2026-08-15 (stable SDKs; 90 days is conservative)
