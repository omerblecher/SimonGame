# Features Research — AdMob + UI Fix

**Researched:** 2026-05-15
**Project:** SimonGame (React 19 + Tailwind v4 + Vite 7, targeting Capacitor Android)
**Confidence:** MEDIUM-HIGH — AdMob from authoritative plugin docs knowledge; UI bug diagnosis is HIGH confidence from direct code inspection.

---

## AdMob Banner Integration

### Overview

The standard plugin for Capacitor is `@capacitor-community/admob`. It wraps the native Google Mobile Ads SDK for Android (and iOS). As of Capacitor 5/6, it is fully supported and actively maintained.

### Installation

```bash
npm install @capacitor-community/admob
npx cap sync android
```

The `npx cap sync` step copies the plugin's native AAR into the Android project and patches `android/app/build.gradle` and `AndroidManifest.xml` automatically.

### Android Manifest (manual step required)

Add your AdMob App ID inside `<application>` in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

This is **required before the app will launch** — Google's SDK crashes the process at startup if this tag is missing, with a message like "The Google Mobile Ads SDK was initialized incorrectly."

### Initialization Order

Call `AdMob.initialize()` once, as early as possible — ideally inside the Capacitor `App` plugin's `appStateChange` listener or directly in `main.tsx` / the root component's `useEffect`. It must run after the Capacitor bridge is ready (after `DOMContentLoaded`).

```typescript
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// In main.tsx or App root, after React mounts:
async function initAds() {
  await AdMob.initialize({
    // initializeForTesting: false — set true only for unit tests
    // tagForChildDirectedTreatment: false
    // tagForUnderAgeOfConsent: false
  });
}
```

`AdMob.initialize()` is safe to call on web (it no-ops) so you do not need a platform guard during development.

### Showing a Banner Ad

```typescript
async function showBanner() {
  const options: BannerAdOptions = {
    adId: 'ca-app-pub-3940256099942544/6300978111', // TEST ID — replace for production
    adSize: BannerAdSize.BANNER,                    // 320x50
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,                                      // pixels from edge
    isTesting: true,                                // forces test ads regardless of adId
  };
  await AdMob.showBanner(options);
}
```

Call `showBanner()` after `initialize()` resolves. It is safe to call once per session; the banner persists until `AdMob.removeBanner()` is called.

### Test Ad Unit IDs (development only)

Google publishes official test IDs that always return a real test ad. Never use a real ad unit ID during development — doing so risks account suspension.

| Format | Test Ad Unit ID |
|--------|----------------|
| Banner | `ca-app-pub-3940256099942544/6300978111` |
| Interstitial | `ca-app-pub-3940256099942544/1033173712` |
| Rewarded | `ca-app-pub-3940256099942544/5224354917` |

For production, create ad units in the AdMob console (admob.google.com) and use those IDs. The App ID (manifest meta-data) is different from the ad unit ID.

### Banner Size Options

`BannerAdSize` enum values (from the plugin):

| Value | Dimensions | Notes |
|-------|-----------|-------|
| `BANNER` | 320×50 | Standard — use for most games |
| `LARGE_BANNER` | 320×100 | Taller, more prominent |
| `ADAPTIVE_BANNER` | Device width | Recommended by Google for 2024+ |
| `SMART_BANNER` | Deprecated | Do not use |

Recommendation: Use `ADAPTIVE_BANNER` for new implementations. It fills the device width, earns higher CPMs, and Google's guidance explicitly deprecates fixed-size banners.

### Lifecycle Events

Register event listeners before calling `showBanner()`. The plugin emits these events:

```typescript
import { AdMob, AdLoadInfo, AdMobBannerSize } from '@capacitor-community/admob';

// Ad loaded successfully
AdMob.addListener('bannerAdLoaded', (info: AdMobBannerSize) => {
  // info.height tells you how many px the banner occupies
  // Use this to push your content up (see Layout section)
  console.log('Banner height:', info.height);
});

// Ad failed to load
AdMob.addListener('bannerAdFailedToLoad', (error) => {
  console.warn('Banner failed:', error.code, error.message);
  // Do not crash — treat as silent failure, content still works
});

// Banner opened a full-screen ad
AdMob.addListener('bannerAdOpened', () => { /* pause game */ });

// Full-screen closed
AdMob.addListener('bannerAdClosed', () => { /* resume game */ });
```

For a game, the most important events are `bannerAdOpened` / `bannerAdClosed` — pause the Simon sequence when an overlay opens to avoid state corruption.

App pause/resume via Capacitor's `App` plugin:

```typescript
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    AdMob.resumeBanner();
  } else {
    AdMob.hideBanner();
  }
});
```

### GDPR / User Consent (2025 requirement)

**This is mandatory for apps distributed in the EU/EEA.** Google requires apps to use the User Messaging Platform (UMP) SDK before showing ads to users where GDPR applies. Failure to comply can result in ad serving being blocked by Google.

The `@capacitor-community/admob` plugin exposes UMP through:

```typescript
await AdMob.requestConsentInfo({
  debugGeography: AdmobConsentDebugGeography.EEA, // only for testing
  testDeviceIdentifiers: ['YOUR_TEST_DEVICE_HASH'],
});

const { isConsentFormAvailable } = await AdMob.loadConsentForm();

if (isConsentFormAvailable) {
  await AdMob.showConsentForm();
}
```

**Order of operations:**
1. `requestConsentInfo()` — checks if consent is needed
2. `loadConsentForm()` — loads the Google-managed consent dialog
3. `showConsentForm()` — shows the dialog (only if available)
4. `initialize()` — initialize AdMob **after** consent flow completes
5. `showBanner()` — show ad

For apps targeting only non-EEA regions (e.g., US-only), you can skip UMP, but the plugin still requires `initialize()` before `showBanner()`.

### How the Banner Affects Layout

The banner overlays content by default — it renders in a native layer above the WebView. Your React content **does not get pushed up automatically**.

To prevent the banner from covering game content:

**Option A — CSS padding (recommended for this app):**
Listen for `bannerAdLoaded` which returns the banner height in dp, then add equivalent padding to your root container:

```typescript
AdMob.addListener('bannerAdLoaded', (size: AdMobBannerSize) => {
  // size.height is in CSS pixels on most devices
  document.documentElement.style.setProperty('--admob-banner-height', `${size.height}px`);
});
```

In CSS (or Tailwind via inline style):
```css
.root-container {
  padding-bottom: var(--admob-banner-height, 0px);
}
```

For this Simon game, the root `<div className="min-h-screen ...">` in `App.tsx` should gain `pb-[var(--admob-banner-height,0px)]` or equivalent inline style.

**Option B — Safe area inset:**
On some Capacitor setups, the plugin uses `SafeArea` API to push content. This is inconsistent across devices. Option A is more reliable.

---

## UI Glow Fix

### Root Cause (Diagnosed from Code)

The bug is in `App.tsx` lines 323–345. There are two interacting problems:

**Problem 1 — `opacity-40` applied to all pads including the active one.**

```typescript
// Line 325–326 (current broken code):
const interactiveClasses = isDisabled
  ? 'cursor-not-allowed opacity-40'   // ← applied to ALL pads when sequence plays
  : 'cursor-pointer hover:brightness-110';
```

`isDisabled` is `true` whenever `!isUserTurn || isPlayingSequence`. During sequence playback, `isPlayingSequence` is `true`, so every pad — including the one that is currently `activePad` — gets `opacity-40`. The glow class is there, but it is nearly invisible through 40% opacity.

**Problem 2 — The HTML `disabled` attribute suppresses CSS filters on the active pad.**

```tsx
<button disabled={isDisabled} ...>
```

When `disabled={true}`, many browsers apply their own UA stylesheet override that dims the element, which compounds with `opacity-40`. Additionally, `brightness-125` (a CSS filter) may be suppressed or overridden in some browser/WebView combinations when `disabled` is set.

### The Fix

The solution is to **exclude the active pad from the disabled visual treatment** during sequence playback. The button still should not be interactable (which the `handlePadClick` guard already enforces), but it should not be visually suppressed.

**Corrected class logic:**

```typescript
const isActive = activePad === pad.id;

// Only apply dim/disabled styling when NOT the active pad
const interactiveClasses = isDisabled
  ? isActive
    ? 'cursor-default'                       // active pad: no dimming, no cursor change
    : 'cursor-not-allowed opacity-40'        // inactive pads: dimmed as before
  : 'cursor-pointer hover:brightness-110';

const activeClasses = isActive
  ? `${pad.glowClass} scale-[1.03] brightness-125`
  : 'shadow-[0_0_22px_rgba(0,0,0,0.8)]';
```

Additionally, remove `disabled` from the button element itself (rely on the JS guard in `handlePadClick` instead), or conditionally set it only when `isDisabled && !isActive`:

```tsx
<button
  disabled={isDisabled && !isActive}  // active pad is never HTML-disabled
  ...
>
```

This preserves the interaction guard (clicks are blocked by `handlePadClick`'s early return) while letting the active pad render at full brightness with the glow shadow.

### Tailwind Glow Pattern (Standard Approach)

The existing glow implementation in the codebase is already the correct Tailwind pattern — arbitrary `shadow-[...]` values with colored RGBA. The issue is not the glow class itself, it is the `opacity-40` overriding it.

For reference, the standard Tailwind v4 pattern for a glowing active state:

```typescript
// In PADS constant (already correct in codebase):
glowClass: 'shadow-[0_0_30px_rgba(52,211,153,0.9)]',  // green

// Applied correctly as:
const activeClasses = isActive
  ? `${pad.glowClass} scale-[1.03] brightness-125`
  : 'shadow-[0_0_22px_rgba(0,0,0,0.8)]';
```

`brightness-125` is a Tailwind utility for `filter: brightness(1.25)`. It makes the element 25% brighter than its base color, which combined with the colored box-shadow creates a convincing "lit up" effect. This is the correct approach — the implementation was right, only the opacity conflict was wrong.

**Alternative glow techniques (for reference):**

| Technique | Tailwind Class | Effect | When to Use |
|-----------|---------------|--------|-------------|
| Box shadow | `shadow-[0_0_30px_rgba(R,G,B,0.9)]` | Outer glow around element | Current approach — correct |
| Ring | `ring-4 ring-emerald-400/80` | Outline glow | Good for focused state |
| Brightness | `brightness-125` | Make element lighter | Combine with shadow for best result |
| Scale | `scale-[1.03]` | Slight pop effect | Combine with shadow |

The combination of `shadow + brightness-125 + scale-[1.03]` that is already in the codebase is the best approach for game pads. No changes needed to the glow classes — only the opacity/disabled conflict needs fixing.

### Ensuring Active Pad is Always Bright

The complete corrected pad render logic:

```typescript
{PADS.map((pad) => {
  const isActive = activePad === pad.id;

  const baseClasses =
    'absolute w-1/2 h-1/2 border-[8px] border-zinc-950 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

  // KEY FIX: active pad is never dimmed, even during sequence playback
  const interactiveClasses = isDisabled
    ? isActive
      ? 'cursor-default'
      : 'cursor-not-allowed opacity-40'
    : 'cursor-pointer hover:brightness-110';

  const activeClasses = isActive
    ? `${pad.glowClass} scale-[1.03] brightness-125`
    : 'shadow-[0_0_22px_rgba(0,0,0,0.8)]';

  return (
    <button
      key={pad.id}
      type="button"
      disabled={isDisabled && !isActive}  // KEY FIX: never disable the active pad
      onClick={() => handlePadClick(pad.id)}
      aria-label={pad.label}
      className={[
        baseClasses,
        interactiveClasses,
        activeClasses,
        PAD_POSITION_CLASSES[pad.id],
        pad.baseClass,
      ].join(' ')}
    >
      <div className="absolute inset-0 rounded-[999px] bg-gradient-to-br from-white/20 via-transparent to-black/20 mix-blend-soft-light pointer-events-none" />
    </button>
  );
})}
```

---

## Edge Cases

### Consent / GDPR

- If the user declines consent in EEA regions, `showBanner()` will still work but Google serves non-personalized ads (lower CPM). This is expected behavior — do not block the game on consent result.
- Consent state is cached by the UMP SDK. You do not need to show the consent dialog on every launch — `requestConsentInfo()` returns `isConsentFormAvailable: false` once the user has already responded.
- For the US (California/CCPA), Google handles opt-out automatically through the UMP flow with `requestConsentInfo()`. No separate implementation required.

### Ad Load Failure

- Always handle `bannerAdFailedToLoad`. Common error codes: `ERROR_CODE_NO_FILL` (no ad available for this inventory), `ERROR_CODE_NETWORK_ERROR`, `ERROR_CODE_INVALID_REQUEST`.
- On failure, do not remove the CSS padding immediately — the ad may reload. The plugin automatically retries with exponential back-off.
- If you added bottom padding for the banner and the banner never loads, that padding creates empty dead space. Guard it with a state flag:

```typescript
const [bannerHeight, setBannerHeight] = useState(0);

AdMob.addListener('bannerAdLoaded', (size) => setBannerHeight(size.height));
AdMob.addListener('bannerAdFailedToLoad', () => setBannerHeight(0));
```

### Layout Shift During Load

- The banner appears after a network round-trip (50–300ms typical). Avoid a content jump by pre-reserving the space: set a fixed-height placeholder div at the bottom matching the expected banner height (50px for `BANNER`, proportional for `ADAPTIVE_BANNER`).
- `ADAPTIVE_BANNER` height is device-dependent — use `bannerAdLoaded` event to get the actual height rather than hardcoding.

### App Pause / Resume

- When the app is backgrounded (Android home button), call `AdMob.hideBanner()`. When foregrounded, call `AdMob.resumeBanner()`. Failure to do this can result in ad impression fraud flags.
- The Simon game's sequence playback must be paused when the app goes to background. Combine the AdMob pause handler with the game pause logic in a single `appStateChange` listener.

### WebView vs. Native Rendering

- The AdMob banner is a **native Android View** rendered above the WebView, not a DOM element. It is not affected by React's render cycle, z-index, or CSS. This is why CSS-based attempts to overlay or hide it will not work — use the plugin's `hideBanner()` / `removeBanner()` methods instead.
- During the Simon celebration melody (`playJoyMelody`), the overlay is not an issue since no full-screen ad is shown. Only if `bannerAdOpened` fires (user taps the banner) does a full-screen overlay appear.

### Testing Without Physical Device

- The test ad ID `ca-app-pub-3940256099942544/6300978111` works in Android emulators. Set `isTesting: true` in `BannerAdOptions` to guarantee test ads even if device hash is not registered.
- On web (browser dev mode), `AdMob` calls are no-ops — the game runs normally without ads.

### Capacitor Setup Prerequisite

This app does not currently have Capacitor installed (no `capacitor.config.ts` or `android/` directory visible). Before the AdMob plugin can be added, the following steps are needed:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init SimonGame com.example.simongame --web-dir dist
npm run build
npx cap add android
```

Only after this foundation is in place can `@capacitor-community/admob` be installed and synced.
