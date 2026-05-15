# Phase 1: Web Fixes - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three classes of bugs in the existing React codebase before any native tooling is introduced. All changes are verifiable in a desktop or mobile browser:
1. Pad glow visual state — active pad must glow bright; inactive pads must stay at normal brightness
2. AudioContext initialization — `resume()` must be awaited in all gesture handlers
3. Mobile browser optimizations — touch delay elimination and viewport configuration

Also remove the unused `src/counter.ts` scaffolding stub.

No native tooling, no Capacitor, no Android emulator needed.

</domain>

<decisions>
## Implementation Decisions

### Inactive Pad Visual State
- **D-01:** During sequence playback, inactive pads stay at **full normal brightness** — no `opacity-40` or any other dimming applied. The active pad stands out through its colored glow (`brightness-125` + `glowClass` box shadow) alone, not by contrast against dimmed others.
- **D-02:** This decision **overrides REQUIREMENTS.md UI-01's mention of `opacity-40` on inactive pads**. The authoritative behavior is from PROJECT.md: "Active pad stays bright, others stay normal — no dimming of inactive pads."
- **D-03:** The `isDisabled` flag (currently applied uniformly via `useMemo`) must NOT apply `opacity-40` to any pad. The active pad also must not receive the HTML `disabled` attribute during sequence playback (REQUIREMENTS.md UI-02).

### AudioContext Error Handling
- **D-04:** `await audioCtxRef.current.resume()` wrapped in `try/catch` — silent failure, no UI feedback if the resume fails. The game may start without audio but won't crash. Applies in all gesture handlers where audio is triggered (Start button, pad clicks).
- **D-05:** AudioContext is lazy-created on first user gesture (not at component mount). No change to this pattern — just ensure `resume()` is awaited.

### Cleanup Scope
- **D-06:** Delete `src/counter.ts` — unused Vite template scaffolding stub, never imported. Include in Phase 1 commit.

### Claude's Discretion
- `touch-action: manipulation` implementation approach (Tailwind class vs. inline style vs. CSS rule) — Tailwind CSS v4 does not have a built-in `touch-manipulation` utility; planner should choose the correct approach (likely inline `style={{ touchAction: 'manipulation' }}` on pad buttons).
- Exact location to wrap `resume()` (which handlers call it) — planner to identify all gesture handlers in `App.tsx` that trigger audio.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Goals
- `.planning/REQUIREMENTS.md` §Phase 1 — v1 requirements with REQ-IDs: UI-01, UI-02, AUDIO-01, TOUCH-01, VIEWPORT-01
- `.planning/ROADMAP.md` §Phase 1: Web Fixes — goal statement and 4 success criteria
- `.planning/PROJECT.md` §Requirements and §Key Decisions — user-level preferences that override spec details (especially "no dimming of inactive pads")

### Source Files to Modify
- `src/App.tsx` — pad rendering (class construction ~lines 323-345), audio context (`audioCtxRef`, `ensureAudioContext`, `playColorTone`, `handlePadClick`, `handleStart`), `isDisabled` useMemo
- `index.html` — `<meta name="viewport">` tag (add `user-scalable=no`, `viewport-fit=cover`)
- `src/counter.ts` — DELETE this file (unused stub)

### Codebase Analysis
- `.planning/codebase/CONCERNS.md` — known bugs: audio context user gesture requirement, performance notes
- `.planning/codebase/CONVENTIONS.md` — class name patterns (`.join(' ')` array pattern), naming conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isDisabled` (useMemo in App.tsx): currently `true` during sequence playback — drives the opacity class applied to all pads. Must be refactored to exclude the active pad from receiving opacity-40 (or remove opacity-40 entirely per D-01).
- `activePad` state: identifies which pad is currently highlighted during sequence playback. Key input for the fix — check `activePad === pad.id` to determine if a pad is active.
- `audioCtxRef`, `masterGainRef`: persistent refs across renders. `resume()` is called within audio helper functions.
- `glowClass` per pad (in PADS constant): defines the colored box-shadow class for each pad. Already set up — just needs to be applied correctly when a pad is active.

### Established Patterns
- Dynamic class assembly: `[baseClasses, interactiveClasses, activeClasses, PAD_POSITION_CLASSES[pad.id], pad.baseClass].join(' ')` — planner should follow this exact pattern when modifying pad class logic.
- Guard clauses: extensive use of early returns (`if (!isUserTurn || isPlayingSequence) return;`) — continue this pattern.
- `useCallback` with explicit dependency arrays: all event handlers use this — maintain when touching handlers.
- TypeScript strict mode: `noUnusedLocals`, `noUnusedParameters` — removing counter.ts will eliminate any lingering type warnings from it.

### Integration Points
- `index.html` `<meta name="viewport">`: modify existing tag (do not add a second one).
- Pad button JSX (~lines 323-345 in App.tsx): where `disabled` attribute and class names are applied — the fix for UI-01 and UI-02 happens here.
- All handlers that call `ensureAudioContext()` or directly touch `audioCtxRef`: these are the sites where `await resume()` + try/catch must be applied.

</code_context>

<specifics>
## Specific Ideas

- The glow fix must handle two separate issues: (a) the class-level fix (stop applying `opacity-40` to the active pad), and (b) the attribute-level fix (stop passing `disabled` attribute to the active pad's `<button>` element). These are independent changes.
- `touch-action: manipulation` removes the 300ms tap delay on Android Chrome — this is a CSS-only change and does not affect game logic.
- `viewport-fit=cover` ensures the game fills the full screen on devices with notches/rounded corners (relevant for Android too).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Web Fixes*
*Context gathered: 2026-05-15*
