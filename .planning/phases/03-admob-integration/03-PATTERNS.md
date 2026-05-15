# Phase 3: AdMob Integration - Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 6 new/modified files
**Analogs found:** 5 / 6 (strings.xml has no analog — it IS the first strings.xml entry)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/main.tsx` | config/bootstrap | request-response (init sequence) | `src/main.tsx` (current 8-line version) | self — extend in place |
| `src/App.tsx` | component | event-driven (banner height) | `src/App.tsx` existing `useEffect` + `useCallback` patterns | self — additive change only |
| `src/hooks/useBannerHeight.ts` | hook | event-driven | `src/App.tsx` lines 78–88 (`ensureAudioContext` + `useCallback`) and lines 194–204 (`handleStart` async/try-catch) | role-match |
| `android/app/src/main/AndroidManifest.xml` | config | — | `android/app/src/main/AndroidManifest.xml` lines 33–36 (existing `<meta-data>` block) | exact — same XML element type |
| `android/app/src/main/res/values/strings.xml` | config | — | `android/app/src/main/res/values/strings.xml` lines 3–6 (existing `<string>` entries) | exact — same resource file, additive |
| `index.html` | config | — | `index.html` lines 9–11 (existing `<body>` element) | exact — inline style attribute on same element |

---

## Pattern Assignments

### `src/main.tsx` (bootstrap, init sequence)

**Analog:** `src/main.tsx` — current version (the file being extended)

**Current state** (lines 1–10 — read in full above):
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Key facts for the modified version:**
- `tsconfig.json` has `"module": "ESNext"` and `"target": "ES2022"` — top-level `await` is valid without any IIFE wrapper. Pitfall 3 from RESEARCH.md does NOT apply.
- The root element id is `app` (confirmed line 6 above and `index.html` line 10).
- The existing import of `{ App }` from `'./App'` must be preserved.

**Pattern to apply — add before the render call:**
```tsx
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

async function initializeAdMob(): Promise<void> {
  const consentInfo = await AdMob.requestConsentInfo();
  if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
    await AdMob.showConsentForm();
  }
  await AdMob.initialize({ initializeForTesting: true });
}

const rootEl = document.getElementById('app') as HTMLElement;
const root = ReactDOM.createRoot(rootEl);

if (Capacitor.isNativePlatform()) {
  try {
    await initializeAdMob();
  } catch (err) {
    console.warn('AdMob initialization failed, rendering without ads:', err);
  }
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Source for this pattern:** RESEARCH.md Pattern 1 (lines 183–224), verified from `@capacitor-community/admob@8.0.0` TypeScript declarations.

---

### `src/App.tsx` (component — additive changes only)

**Analog:** `src/App.tsx` — same file, existing patterns

**Rule: Do NOT refactor the 464-line monolith.** Two additive changes only:
1. Call `useBannerHeight()` hook at the top of the component body.
2. Add a spacer `<div>` at the very bottom of the returned JSX, after the outermost closing wrapper.

**Existing import pattern to extend** (lines 1–1):
```tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
```
Add to this line: `useEffect` (needed for `showBanner` + `AppStateChange` listener).
Add new import lines for `Capacitor`, `AdMob`, `CapacitorApp`, and `useBannerHeight`.

**Existing async try-catch pattern** (lines 203–204) — analog for the `showBanner` useEffect:
```tsx
try { await audioCtxRef.current?.resume(); } catch (_) {}
```
The AdMob calls follow the same "call and swallow errors gracefully" idiom, using `.catch(console.error)` on Promises inside a `useEffect`.

**Existing useEffect teardown pattern** — App.tsx does not currently have a `useEffect` with cleanup, but the hook analog below covers that. The `showBanner` useEffect in App.tsx uses the same pattern seen in RESEARCH.md Pattern 3.

**Spacer div placement:** After the closing `</div>` of the outermost wrapper (currently line 462), before the component's `return` closes. The spacer must be a sibling of the game container, not nested inside it, so it does not intercept touch events on the game.

**Pattern to add inside App component body:**
```tsx
// At top of component, after existing useState/useRef lines:
const bannerHeight = useBannerHeight();

// New useEffect for banner show + AppStateChange (after existing callbacks):
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const bannerOptions: BannerAdOptions = {
    adId: 'ca-app-pub-3940256099942544/6300978111', // test ID — replace in Phase 4
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true,
  };

  AdMob.showBanner(bannerOptions).catch(console.error);

  let appStateHandle: { remove: () => Promise<void> } | null = null;
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      AdMob.resumeBanner().catch(console.error);
    } else {
      AdMob.hideBanner().catch(console.error);
    }
  }).then((h) => { appStateHandle = h; });

  return () => {
    AdMob.removeBanner().catch(console.error);
    appStateHandle?.remove();
  };
}, []);
```

**Pattern to add at bottom of JSX return** (after line 462's closing `</div>`):
```tsx
{/* Banner ad spacer — reserves height so pads are never obscured */}
<div style={{ height: `${bannerHeight}px` }} aria-hidden="true" />
```

**Import collision note:** `import { App as CapacitorApp } from '@capacitor/app'` — the alias is required because this file already exports the `App` component. Confirmed by RESEARCH.md Pitfall 5.

---

### `src/hooks/useBannerHeight.ts` (hook, event-driven)

**Analog:** `src/App.tsx` — `ensureAudioContext` callback (lines 78–88) and `handleStart` async pattern (lines 194–204)

The closest pattern is the `useCallback` + `useRef` async initialization with try-catch in App.tsx. The hook adapts this to a `useState` + `useEffect` + cleanup return, which is the standard React hook shape for event listeners.

**No existing hooks directory** — `src/hooks/` must be created. Confirmed: `Glob("src/hooks/**/*")` returned no results.

**Imports pattern** — model on App.tsx line 1 but use only what's needed:
```ts
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPluginEvents } from '@capacitor-community/admob';
```

**Core pattern** — `useState` initial value is platform-conditional (analog: App.tsx's conditional `useMemo` at line 284):
```ts
const BANNER_HEIGHT_DEFAULT = 50; // standard BANNER size is 320×50dp

export function useBannerHeight(): number {
  const [bannerHeight, setBannerHeight] = useState<number>(
    Capacitor.isNativePlatform() ? BANNER_HEIGHT_DEFAULT : 0,
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | null = null;

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      setBannerHeight(size.height);
    }).then((h) => { handle = h; });

    return () => {
      handle?.remove();
    };
  }, []);

  return bannerHeight;
}
```

**Critical event name:** `BannerAdPluginEvents.SizeChanged` (= `"bannerAdSizeChanged"`) — NOT `bannerAdLoaded`. `bannerAdLoaded` has no payload (RESEARCH.md Pitfall 1, lines 371–378). TypeScript will enforce this if types are imported correctly.

**TypeScript rules from tsconfig.json:**
- `"strict": true` — no implicit `any`
- `"noUnusedLocals": true` — do not declare variables not used
- `"noUnusedParameters": true` — hook function takes no parameters (returns `number` only)
- `"verbatimModuleSyntax": true` — use `import type` for type-only imports if applicable

---

### `android/app/src/main/AndroidManifest.xml` (config — additive)

**Analog:** `android/app/src/main/AndroidManifest.xml` lines 33–36 — the existing `<meta-data>` block inside `<provider>`:
```xml
<meta-data
    android:name="android.support.FILE_PROVIDER_PATHS"
    android:resource="@xml/file_paths"></meta-data>
```

**Pattern to apply:** Add a new `<meta-data>` element inside the `<application>` block, before `</application>` (line 37). Use the same indentation style (4-space) as the existing manifest.

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="@string/admob_app_id"/>
```

**Placement:** Inside `<application>`, after the closing `</provider>` tag (line 36), before `</application>` (line 37).

**Permissions:** The existing manifest already has `INTERNET` (line 41). The admob plugin's own manifest declares `ACCESS_NETWORK_STATE` — Capacitor merges it during `cap sync`. No manual permission additions required. RESEARCH.md Pattern 4 confirms this.

---

### `android/app/src/main/res/values/strings.xml` (config — additive)

**Analog:** `android/app/src/main/res/values/strings.xml` lines 3–6 — existing `<string>` entries:
```xml
<string name="app_name">Simon Memory Game</string>
<string name="title_activity_main">Simon Memory Game</string>
<string name="package_name">com.otis.brooke.simon.game</string>
<string name="custom_url_scheme">com.otis.brooke.simon.game</string>
```

**Pattern to apply:** Add one `<string>` entry inside `<resources>`, after the existing entries, before `</resources>`:
```xml
<string name="admob_app_id">YOUR_ADMOB_APP_ID</string>
```

**User action required:** Replace `YOUR_ADMOB_APP_ID` with the real App ID from the AdMob console. Format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX` (contains `~`, not `/`). The `~` vs `/` delimiter distinguishes App ID from Ad Unit ID — see RESEARCH.md Pitfall 4.

---

### `index.html` (config — additive)

**Analog:** `index.html` lines 9–11 — the existing `<body>` tag:
```html
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

**Pattern to apply:** Add `style="background-color: #0f172a;"` inline on the `<body>` tag. This matches Tailwind's `slate-950` (`from-slate-950`) used as the outermost gradient color in App.tsx line 287. Eliminates the white flash during the AdMob init blank screen before React mounts (CONTEXT.md Specifics, line 113).

```html
<body style="background-color: #0f172a;">
```

**Color verification:** App.tsx line 287 uses `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`. The `#0f172a` value is Tailwind's `slate-950` token, matching the darkest background color in the game.

---

## Shared Patterns

### Platform Guard
**Source:** CONTEXT.md D-05 / RESEARCH.md Pattern 1 and Pattern 2
**Apply to:** `src/main.tsx`, `src/hooks/useBannerHeight.ts`, `src/App.tsx` useEffect
```ts
if (Capacitor.isNativePlatform()) {
  // native-only AdMob code here
}
// OR as early return in hook:
if (!Capacitor.isNativePlatform()) return;
```

### Graceful Degradation (try-catch, never block render)
**Source:** `src/App.tsx` lines 203–204 (inline try-catch on audio resume)
**Apply to:** `src/main.tsx` `initializeAdMob()` wrapper, `src/App.tsx` `showBanner` call
```ts
// Existing analog in App.tsx:
try { await audioCtxRef.current?.resume(); } catch (_) {}

// Pattern for AdMob Promise calls:
AdMob.showBanner(options).catch(console.error);
// Or for the full init sequence:
try { await initializeAdMob(); } catch (err) { console.warn(...); }
```

### useEffect + Listener + Cleanup Return
**Source:** RESEARCH.md Pattern 2 (lines 248–261) — no current analog in the codebase (App.tsx has no useEffect with cleanup). This is a new pattern for this project.
**Apply to:** `src/hooks/useBannerHeight.ts`, `src/App.tsx` (banner + AppStateChange useEffect)
```ts
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  let handle: { remove: () => Promise<void> } | null = null;
  SomePlugin.addListener('eventName', handler).then((h) => { handle = h; });

  return () => { handle?.remove(); };
}, []);
```

### XML `<meta-data>` Block
**Source:** `android/app/src/main/AndroidManifest.xml` lines 33–36
**Apply to:** `android/app/src/main/AndroidManifest.xml` (AdMob App ID entry)
```xml
<meta-data
    android:name="KEY_NAME"
    android:value="@string/resource_name"/>
```

---

## No Analog Found

No files fall into this category. All 6 files either have a direct analog in the existing codebase or are additive changes to existing files where the existing content serves as the analog.

---

## tsconfig.json Verification (Open Question from RESEARCH.md)

**Resolved:** `tsconfig.json` has `"module": "ESNext"` (line 4) and `"target": "ES2022"` (line 3). Top-level `await` in `src/main.tsx` is fully supported. The IIFE fallback pattern from RESEARCH.md Pitfall 3 is NOT needed. Use direct top-level `await` as shown in the modified `main.tsx` pattern above.

---

## Metadata

**Analog search scope:** `src/`, `android/app/src/main/`, `index.html`, `tsconfig.json`
**Files read:** `src/main.tsx`, `src/App.tsx`, `index.html`, `tsconfig.json`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/res/values/strings.xml`, `.planning/phases/03-admob-integration/03-CONTEXT.md`, `.planning/phases/03-admob-integration/03-RESEARCH.md`
**Pattern extraction date:** 2026-05-15
