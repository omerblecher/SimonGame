# Simon Game — Android Release

## Project

React Simon game being packaged as an Android app via Capacitor, with Google AdMob banner ads and Google Play Store deployment.

See `.planning/PROJECT.md` for full context.

## GSD Workflow

This project uses the Get Shit Done (GSD) planning framework.

### Planning artifacts
- `.planning/PROJECT.md` — project context and requirements
- `.planning/ROADMAP.md` — 4-phase roadmap
- `.planning/REQUIREMENTS.md` — all v1 requirements with REQ-IDs
- `.planning/STATE.md` — current project state
- `.planning/research/` — Capacitor, AdMob, Play Store research

### Phase commands
```
/gsd:plan-phase 1    # Plan Phase 1: Web Fixes
/gsd:plan-phase 2    # Plan Phase 2: Capacitor Android Baseline
/gsd:plan-phase 3    # Plan Phase 3: AdMob Integration
/gsd:plan-phase 4    # Plan Phase 4: Signing + Play Store Submission
```

### Current phase
**Phase 1: Web Fixes** — Fix active pad glow bug + AudioContext suspend on Android

## Key Technical Context

### UI Bug (Phase 1)
`isDisabled` is `true` during sequence playback, applying `opacity-40` to all pads including the active one. Fix: exclude active pad from opacity-40, remove `disabled` attribute from active pad.

### Audio Bug (Phase 1)
`audioCtxRef.current.resume()` is not awaited — silent on Android WebView. Fix: `await` the call inside gesture handlers.

### Android Stack
- Capacitor (v6 or v7 — verify `@capacitor-community/admob` peer deps first)
- `@capacitor-community/admob` for banner ads
- Build: `npm run build` → `npx cap sync android` → `gradlew bundleRelease`

### Critical Pre-Phase-2 Check
```bash
npm show @capacitor-community/admob peerDependencies
# Determines whether to install Capacitor 6 or 7
```

## Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript 5.9 + Tailwind CSS v4 |
| Build | Vite 7 |
| Audio | Web Audio API (oscillator-based, no audio files) |
| Android | Capacitor (version TBD — check AdMob compat first) |
| Ads | Google AdMob — `@capacitor-community/admob` |
| Target | Android, Google Play Store |

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite build → dist/
npm run preview      # Preview built app
```
