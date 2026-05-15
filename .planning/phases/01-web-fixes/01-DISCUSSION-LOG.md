# Phase 1: Web Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-Web Fixes
**Areas discussed:** Inactive pad opacity, AudioContext error handling, Cleanup scope

---

## Inactive Pad Opacity

| Option | Description | Selected |
|--------|-------------|----------|
| Active glows, inactive fully normal | All pads at 100% opacity during sequence playback. Active pad stands out through colored glow (brightness-125 + box shadow) alone. Matches PROJECT.md "no dimming of inactive pads". | ✓ |
| Active glows, inactive at opacity-40 | Inactive pads dimmed to opacity-40. Active pad stands out through glow AND contrast against subdued others. Matches REQUIREMENTS.md "opacity-40 applied to inactive pads only". Classic Simon behavior. | |

**User's choice:** Active glows, inactive fully normal
**Notes:** This resolves a conflict between PROJECT.md ("no dimming of inactive pads") and REQUIREMENTS.md (opacity-40 on inactive pads). PROJECT.md's explicit user preference takes precedence. CONTEXT.md documents this override.

---

## AudioContext Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Silent catch — await + try/catch, no UI | Resume awaited and wrapped in try/catch. If it fails, game starts silently with no audio. No UI change. | ✓ |
| Show 'tap to hear audio' hint | If resume() fails, show a small dismissible message prompting the user to tap. Recovers gracefully on Android WebView. | |
| Just await, no catch | Minimum viable fix: just add await. If resume() throws, it surfaces. | |

**User's choice:** Silent catch — await + try/catch, no UI
**Notes:** Game may start without audio but won't crash. Applies in all gesture handlers where audio is triggered.

---

## Cleanup Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — remove counter.ts | Delete src/counter.ts (unused Vite template stub, never imported). Include in Phase 1 commit. | ✓ |
| No — stay focused on bug fixes | Phase 1 scope is the 5 requirements only. Keep the diff minimal. | |

**User's choice:** Yes — remove it
**Notes:** Simple housekeeping, no risk.

---

## Claude's Discretion

- `touch-action: manipulation` implementation approach — Tailwind CSS v4 lacks a built-in `touch-manipulation` utility; planner to choose correct approach (likely inline `style={{ touchAction: 'manipulation' }}` on pad buttons).
- Exact handlers in App.tsx where `resume()` needs to be wrapped — planner to identify all audio-triggering gesture handlers.

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
