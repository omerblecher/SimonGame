# Phase 3: AdMob Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 3-AdMob Integration
**Areas discussed:** Banner layout fit, Dev mode compatibility, AdMob App ID readiness, Consent dialog timing

---

## Banner Layout Fit

### Q1: When the banner loads, what should happen to the game content above it?

| Option | Description | Selected |
|--------|-------------|----------|
| Push content up | Banner sits at bottom; spacer div reserves height. Game fills remaining viewport. Pads never obscured. | ✓ |
| Float over content | Banner overlays bottom. Static padding prevents obscuring. Less dynamic. | |
| You decide | Claude picks based on existing full-screen layout. | |

**User's choice:** Push content up

---

### Q2: What should the spacer height be before the banner loads?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-reserve a fixed height | Default spacer = standard banner height (~50px). bannerAdLoaded adjusts to actual height. No layout jump. | ✓ |
| Start at 0, animate in | Spacer starts at 0; layout shifts when bannerAdLoaded fires. More noticeable shift. | |
| You decide | Claude picks for smoothest UX. | |

**User's choice:** Pre-reserve a fixed height

---

### Q3: Where should the banner spacer live in the component tree?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside App.tsx | Spacer div at bottom of App return JSX. bannerAdLoaded listener updates height via React state. One place. | ✓ |
| In index.html | Static spacer in HTML shell, updated from main.tsx event listener. Harder to sync. | |
| You decide | Claude picks cleanest integration. | |

**User's choice:** Inside App.tsx

---

### Q4: How should App.tsx receive the banner height for the spacer?

| Option | Description | Selected |
|--------|-------------|----------|
| Custom hook | useBannerHeight() hook registers listener, returns height. Clean, isolated from game logic. | ✓ |
| useState in App.tsx directly | bannerHeight state + inline useEffect. Simpler, ~10 lines added to existing monolith. | |
| You decide | Claude picks based on intrusiveness to monolith. | |

**User's choice:** Custom hook (useBannerHeight)

---

## Dev Mode Compatibility

### Q1: When running `npm run dev`, AdMob APIs don't exist. Preferred approach?

| Option | Description | Selected |
|--------|-------------|----------|
| Add platform guards | Wrap all AdMob calls in Capacitor.isNativePlatform(). Browser dev server works normally. | ✓ |
| Emulator-only from here | No guards. Dev workflow is build + sync + emulator only. Browser dev server throws errors. | |
| You decide | Claude picks for simplest codebase. | |

**User's choice:** Add platform guards

---

### Q2: Should the banner spacer still reserve space in browser?

| Option | Description | Selected |
|--------|-------------|----------|
| No spacer in browser | useBannerHeight() returns 0 when not native. Game fills full height in browser dev. | ✓ |
| Show placeholder spacer in browser | Returns default 50dp in browser too. Dev layout matches emulator. | |

**User's choice:** No spacer in browser

---

## AdMob App ID Readiness

### Q1: Have you registered the AdMob app (STATE.md TODO)?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — I have my AdMob App ID | Plan uses real App ID. Test ad unit IDs still used for banners in Phase 3. | ✓ |
| No — use test placeholder | Plan uses Google test App ID as placeholder. Replace before Phase 4. | |
| Not sure / explain | Clarify what's needed and when. | |

**User's choice:** Yes — has AdMob account. Will create the app in AdMob console.
**Notes:** User asked how to add a new application in AdMob. Guidance provided: admob.google.com → Apps → Add app → Android → Not listed → name "Simon Memory Game" → copy App ID. Also advised to create a Banner ad unit (Simon Banner) and copy ad unit ID for Phase 4.

---

### Q2: How should the plan handle the AdMob App ID?

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder — I'll fill it in | Plan writes YOUR_ADMOB_APP_ID. User replaces before running plan. | ✓ |
| Provide App ID now | Share App ID here; plan includes exact value. | |
| Use Google test App ID for now | Plan uses ca-app-pub-3940256099942544~3347511. Swap in Phase 4. | |

**User's choice:** Placeholder

---

## Consent Dialog Timing

### Q1: When should the UMP consent dialog appear on first launch?

| Option | Description | Selected |
|--------|-------------|----------|
| Before any game UI renders | Brief loading state; game renders after consent + init complete. Clean user flow. | ✓ |
| After the game UI loads | Consent dialog overlays loaded game. Simpler code, less polished. | |
| You decide | Claude picks based on main.tsx entry point. | |

**User's choice:** Before any game UI renders

---

### Q2: What should the loading state look like during consent + init?

| Option | Description | Selected |
|--------|-------------|----------|
| Blank/dark screen | Dark background only. Simple, no extra UI. Typically < 1 second. | ✓ |
| Simon logo or title | Show app name/logo while initializing. More polished, requires extra component. | |
| You decide | Claude picks simplest approach. | |

**User's choice:** Blank/dark screen

---

### Q3: What happens for users NOT in a GDPR region?

| Option | Description | Selected |
|--------|-------------|----------|
| Always run UMP flow | UMP auto-detects region. Non-EEA users: no dialog, instant completion. One global code path. | ✓ |
| Only show in EEA/UK | Explicit region detection to skip consent for non-EEA. More complex, fragile, unnecessary. | |
| You decide | Claude decides based on AdMob best practices. | |

**User's choice:** Always run UMP flow

---

## Claude's Discretion

- Exact async pattern in `main.tsx` for sequencing UMP consent + `AdMob.initialize()` before render
- Try/catch graceful degradation if consent or init fails (game renders without ads)
- Whether `AppStateChange` listener for ADM-08 is inline or a separate hook
- Exact `AndroidManifest.xml` permissions required by the plugin

## Deferred Ideas

None — discussion stayed within phase scope.
