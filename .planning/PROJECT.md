# Simon Game — Android App

## What This Is

A classic Simon memory game built in React + TypeScript + Tailwind CSS, being packaged as a native Android application via Capacitor and published to the Google Play Store. The game plays color/tone sequences that the player must repeat; difficulty increases as sequences grow longer. AdMob banner ads will be displayed at the bottom of the screen.

## Core Value

A polished, playable Simon game that works flawlessly on Android devices — responsive pads that glow correctly, clear audio feedback, and a smooth Play Store experience.

## Requirements

### Validated

- ✓ Simon game sequence playback with Web Audio API tones — existing
- ✓ 4-pad colored gameplay (green, red, yellow, blue) — existing
- ✓ User input validation and sequence matching — existing
- ✓ Streak and best streak tracking — existing
- ✓ Error feedback (buzzer tone) and game reset — existing
- ✓ Celebration melody on round completion — existing
- ✓ Glass-morphism UI with Tailwind CSS — existing
- ✓ TypeScript strict mode throughout — existing

### Active

- [ ] Active pad glows bright when sequence plays; inactive pads stay at normal brightness (not dimmed)
- [ ] App packaged as native Android APK/AAB via Capacitor
- [ ] Google AdMob banner ad displayed at the bottom of the screen
- [ ] App built and signed for release on Google Play Store

### Out of Scope

- iOS deployment — not requested, focus is Android only
- React Native rewrite — Capacitor chosen to preserve existing React code
- Interstitial / rewarded ads — banner-only to minimize gameplay disruption
- Multiplayer or backend — single-player, no server needed

## Context

- **Existing codebase**: Fully working React Simon game at `src/App.tsx` (React 19, TypeScript 5.9, Tailwind v4, Vite 7)
- **Existing accounts**: Google Play Console account and Google AdMob account already set up by user
- **Codebase map**: Full analysis available in `.planning/codebase/` (architecture, stack, concerns, conventions)
- **Known concern**: Active pad currently appears *darker* when highlighted during sequence playback — this is the UI bug to fix first
- **Known concern**: Monolithic 463-line `App.tsx` — Capacitor wrapping does not require refactoring this, but keep in mind

## Constraints

- **Tech Stack**: Must use Capacitor for Android packaging (not React Native or TWA)
- **Ads**: Google AdMob only (user already has account)
- **Platform**: Android target (Google Play Store)
- **Existing code**: React + TypeScript + Tailwind must be preserved — no full rewrite

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Capacitor over React Native | Preserves existing React codebase, no rewrite needed | — Pending |
| Banner ads only | Least intrusive to gameplay; interstitial ads break immersion | — Pending |
| Active pad stays bright, others stay normal | User's explicit preference — no dimming of inactive pads | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 after initialization*
