# Phase 1: Web Fixes - Research

**Researched:** 2026-05-15
**Domain:** React / Web Audio API / Mobile browser compatibility
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** During sequence playback, inactive pads stay at full normal brightness — no `opacity-40` or any other dimming. The active pad stands out through its colored glow alone.
- **D-02:** This overrides REQUIREMENTS.md UI-01's mention of `opacity-40` on inactive pads. The authoritative behavior is from PROJECT.md: "Active pad stays bright, others stay normal — no dimming of inactive pads."
- **D-03:** `isDisabled` must NOT apply `opacity-40` to any pad. Active pad must not receive `disabled` attribute during sequence playback.
- **D-04:** `await audioCtxRef.current.resume()` wrapped in `try/catch` — silent failure, no UI feedback. Game may start without audio but will not crash. Applies in all gesture handlers.
- **D-05:** AudioContext lazy-created on first user gesture (not at component mount). No change to this pattern — just ensure `resume()` is awaited.
- **D-06:** Delete `src/counter.ts` — unused Vite template stub, never imported. Include in Phase 1 commit.

### Claude's Discretion
- `touch-action: manipulation` implementation approach (Tailwind class vs. inline style vs. CSS rule).
- Exact location to wrap `resume()` (which handlers call it).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Active pad shows full brightness + glow during sequence playback (`brightness-125`, glow shadow visible). `opacity-40` is only applied to *inactive* pads. | Overridden by D-01/D-02: NO opacity-40 on any pad. Active pad identified via `activePad === pad.id`. |
| UI-02 | Active pad does not receive the HTML `disabled` attribute during sequence playback. | Fix: `disabled={isDisabled && !isActive}` — see Class Assembly Rule below. |
| AUDIO-01 | `AudioContext.resume()` is awaited in all gesture handlers before any tone is played. `AudioContext` is lazy-created on first user gesture. | Fix: `ensureAudioContext` already lazy-creates. Must be made `async` and `await resume()` wrapped in try/catch. Handlers that call it: `handleStart` and `handlePadClick`. |
| TOUCH-01 | All pad buttons have `touch-action: manipulation` to eliminate 300ms tap delay on Android. | Tailwind CSS v4 has no built-in `touch-manipulation` utility. Use `style={{ touchAction: 'manipulation' }}` inline on each pad `<button>`. |
| VIEWPORT-01 | `<meta name="viewport">` includes `user-scalable=no` and `viewport-fit=cover`. | Modify existing single tag in `index.html` line 6. |
</phase_requirements>

---

## Summary

Phase 1 is a surgical code-only fix — four discrete changes in two files (`src/App.tsx`, `index.html`) plus deletion of one dead file (`src/counter.ts`). No new dependencies. No new packages. All changes are verifiable in a standard browser.

The codebase is in a clean, well-understood state except for one pre-existing build blocker: `tsconfig.json` is missing `"jsx": "react-jsx"`, causing `tsc --noEmit` to fail with hundreds of TS17004 errors. This means `npm run build` currently fails at the TypeScript check step. Vite itself builds fine (`npx vite build` succeeds). The plan must fix `tsconfig.json` first (or alongside the other changes) so `npm run build` becomes a reliable verification command.

The audio fix has a subtle scope: `ensureAudioContext` is the sole call site for `resume()`, but it is synchronous. Making it `async` and awaiting `resume()` inside it means all callers (`handleStart`, `handlePadClick`, and transitively `playTone` → `ensureAudioContext`) would need updating. The correct approach — confirmed by reading the code — is to move the `await resume()` + try/catch directly into the two top-level gesture handlers (`handleStart` and `handlePadClick`), not into `ensureAudioContext`, because only those two functions are invoked from user gestures. `playSequence` is not a gesture handler and must not create the AudioContext.

**Primary recommendation:** Fix `tsconfig.json` first (add `"jsx": "react-jsx"`), then apply the four functional fixes in a single commit.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pad visual state (glow/dim) | Browser / Client (React render) | — | Pure CSS class computation in JSX; no server or native layer involved |
| AudioContext initialization | Browser / Client (Web Audio API) | — | WebAudio is a browser API; lazy-create on gesture is a browser-side pattern |
| Touch delay elimination | Browser / Client (CSS) | — | `touch-action` is a CSS property interpreted by the browser engine |
| Viewport configuration | Browser / Client (HTML meta) | — | `<meta name="viewport">` is a browser directive in `index.html` |
| Dead file removal | Build / Source | — | Deleting `src/counter.ts` affects TypeScript compilation scope only |

---

## Standard Stack

No new packages are installed in Phase 1. All fixes use the existing stack.

### Existing Stack (relevant to Phase 1)

| Library | Installed Version | Purpose | Phase 1 Use |
|---------|------------------|---------|-------------|
| React | 19.2.4 | UI framework | Pad JSX, hooks |
| TypeScript | ~5.9.3 | Type checker | `tsconfig.json` fix needed |
| Tailwind CSS | ^4.1.18 | Utility CSS | Class assembly for pads |
| Vite | ^7.3.1 | Build + dev server | `npm run build` verification |
| Web Audio API | browser built-in | Tone synthesis | `AudioContext.resume()` fix |

### Package Legitimacy Audit

> No packages are installed in Phase 1. This section confirms: none required.

**Packages installed:** None
**Packages removed due to slopcheck [SLOP] verdict:** None
**Packages flagged as suspicious [SUS]:** None

---

## Architecture Patterns

### System Architecture Diagram

```
User gesture (tap pad / click Start)
        │
        ▼
  React event handler
  (handleStart / handlePadClick)
        │
        ├─► await ensureAudioContext()   ← must await resume() here
        │         │
        │         ▼
        │   AudioContext (lazy-created or resumed)
        │         │
        │         ▼
        │   playTone() → oscillator → masterGain → destination
        │
        └─► setState updates
                  │
                  ▼
           React re-render
                  │
                  ▼
         Pad JSX (className computed per pad)
         ├── isActive (activePad === pad.id)
         ├── isDisabled (!isUserTurn || isPlayingSequence)
         └── class assembly → browser renders glow/no-glow
```

### Recommended Project Structure (unchanged)
```
src/
├── App.tsx          # All game logic + UI (modified in Phase 1)
├── main.tsx         # React entry point (unchanged)
├── style.css        # Global styles + .glass-panel, .stat-label (unchanged)
├── counter.ts       # DELETE — unused Vite scaffolding stub
└── main.ts          # Vite template entry (exists but not used by React app)
index.html           # Modified: viewport meta tag
```

### Pattern 1: Pad Class Assembly (fixed version)

**What:** Compute CSS classes per pad from three independent concerns: base styles, interactive state, active state. Then join.

**Current (buggy) — lines 325-331 in App.tsx:**
```typescript
// Source: direct codebase read — src/App.tsx lines 325-331
const interactiveClasses = isDisabled
  ? 'cursor-not-allowed opacity-40'   // BUG: dims ALL pads including active
  : 'cursor-pointer hover:brightness-110';
// ...
disabled={isDisabled}  // BUG: disables active pad during sequence playback
```

**Required fix (per D-01, D-02, D-03, UI-SPEC Class Assembly Rule):**
```typescript
// isActive is computed above the class strings: const isActive = activePad === pad.id;
const interactiveClasses =
  isDisabled && !isActive
    ? 'cursor-not-allowed'               // idle/inactive: no pointer, no opacity change
    : !isDisabled
      ? 'cursor-pointer hover:brightness-110'  // user's turn: normal interactive
      : '';                              // isDisabled && isActive: being shown, no cursor class

// disabled attribute — active pad must NOT be disabled
// disabled={isDisabled && !isActive}
```

Key rule: `opacity-40` must never appear in any branch.

The `isActive` local variable is already computed on line 322 of `App.tsx` (`const isActive = activePad === pad.id;`). No new state or computation needed — just reference it.

### Pattern 2: AudioContext Resume (fixed version)

**What:** Ensure AudioContext is resumed with `await` and `try/catch` before any audio is produced.

**Current (buggy) — lines 87-89 in App.tsx:**
```typescript
// Source: direct codebase read — src/App.tsx lines 87-89
if (audioCtxRef.current.state === 'suspended') {
  void audioCtxRef.current.resume();  // BUG: not awaited — silent on Android WebView
}
```

`ensureAudioContext` is currently synchronous. The `void` suppresses the unhandled promise warning but loses the await. On Android WebView, the AudioContext can remain in `suspended` state when the tone starts, so the tone plays silently.

**Correct fix — convert `ensureAudioContext` to async OR move await to callers:**

The better approach (less churn) is to keep `ensureAudioContext` as-is for context creation, but make the resume portion async. Since `ensureAudioContext` is called from `playTone` which is called from many places, the cleanest path per D-04 is to call `resume()` explicitly in the two gesture-initiated handlers before any audio work.

Option A — Make `ensureAudioContext` async (touches all `useCallback` dependency chains):
```typescript
// This would require making playTone async, playColorTone async, etc. — ripple effect.
```

Option B — Call resume at the gesture boundary only (recommended, minimal change):
```typescript
// In handleStart and handlePadClick, before any audio call:
// Source: analysis of src/App.tsx call graph
if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
  try {
    await audioCtxRef.current.resume();
  } catch (_err) {
    // D-04: silent failure — game starts without audio
  }
}
```

Both handlers are already `async` functions (lines 197 and 209 in App.tsx), so `await` is valid without any signature change.

`ensureAudioContext` still handles lazy-creation (fine as-is). The `void audioCtxRef.current.resume()` line inside it should be removed or replaced with a sync best-effort call — since the handlers now await resume first, by the time `ensureAudioContext` is called from `playTone`, the context will already be resumed.

Simplest safe fix for `ensureAudioContext` line 87-89:
```typescript
// Remove the entire if-block — resume is now handled by gesture handlers.
// OR leave it as a sync fallback (harmless, belt-and-suspenders):
if (audioCtxRef.current?.state === 'suspended') {
  void audioCtxRef.current.resume(); // belt-and-suspenders; gesture handlers already awaited
}
```

### Pattern 3: touch-action: manipulation

**What:** CSS property that eliminates the 300ms tap delay on Android Chrome (and iOS Safari) by telling the browser not to wait for double-tap zoom gesture disambiguation.

**Tailwind CSS v4 status:** No built-in `touch-manipulation` utility class exists in Tailwind CSS v4. [ASSUMED — based on training knowledge + confirmed by UI-SPEC.md which states the same]. The correct approach is inline style.

**Implementation:**
```tsx
// Add to each pad <button> element in the PADS.map() in App.tsx
<button
  // ... existing props ...
  style={{ touchAction: 'manipulation' }}
>
```

Applied to pad buttons only. The Start Game and Reset buttons do not require it (no timing sensitivity per UI-SPEC).

### Pattern 4: Viewport Meta Tag

**What:** Browser directive controlling viewport scaling behavior.

**Current state (index.html line 6):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Required state (per VIEWPORT-01 and UI-SPEC):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

- `user-scalable=no` — prevents accidental pinch-zoom and double-tap zoom on pad taps
- `viewport-fit=cover` — fills safe area on notched/rounded-corner devices (Android 9+ with display cutouts)

Do not add a second `<meta name="viewport">` tag. Modify the existing one.

### Pattern 5: tsconfig.json JSX Fix (pre-existing blocker)

**What:** `tsconfig.json` is missing `"jsx": "react-jsx"`. Without it, `tsc --noEmit` fails with TS17004 on every JSX expression in `App.tsx`. Vite's own transform handles JSX correctly so `npx vite build` works, but `npm run build` runs `tsc && vite build` — the `tsc` step fails, blocking the build command.

**Fix:** Add `"jsx": "react-jsx"` to `compilerOptions` in `tsconfig.json`.

**Verification:** `tsc --noEmit --jsx react-jsx` produces zero errors (confirmed by running it). [VERIFIED: direct execution]

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "useDefineForClassFields": true,
    // ... rest unchanged
  }
}
```

### Anti-Patterns to Avoid

- **Adding `opacity-40` in any state:** The UI-SPEC Class Assembly Rule explicitly bans `opacity-40` in all pad states. Do not restore it even for "inactive during playback."
- **Awaiting `resume()` inside `playTone` or `playColorTone`:** These are called in a loop from `playSequence` which is NOT a user gesture handler. Attempting to resume there will not work (browser blocks resume outside gesture context) and would require making the entire audio call chain async unnecessarily.
- **Adding a second `<meta name="viewport">` tag:** Browsers use the first one; duplicates cause undefined behavior. Modify the existing tag at line 6 of `index.html`.
- **Making `ensureAudioContext` return a Promise that callers must await:** This would require making `playTone` async, which would require making `playColorTone` async, rippling to `playSequence` and beyond. The gesture-boundary approach (Option B above) is cleaner.
- **Deleting `src/main.ts` (the Vite scaffolding entry):** This file is NOT compiled by TypeScript because `tsconfig.json` `include: ["src"]` includes it. However, `main.ts` is also not the React entry point — that is `main.tsx`. After deleting `counter.ts`, `main.ts` will still have an import of `counter.ts` that will cause a TypeScript error. Check: should `main.ts` also be deleted? See "Edge Cases" below.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch delay on Android | Custom pointer event timing logic | `touch-action: manipulation` CSS | Single CSS property, zero JS, supported in all modern Android Chrome versions |
| AudioContext unlock | Manual gesture-unlock state machine | `await AudioContext.resume()` | The Web Audio API's own lifecycle method; handles all browser quirks |
| Viewport safe-area | JS-based padding adjustments | `viewport-fit=cover` + CSS env() | Browser handles it natively; no JS needed for Phase 1 |

---

## Runtime State Inventory

> Not a rename/refactor/migration phase — no runtime state affected. This section is included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — no databases, no localStorage | None |
| Live service config | None — no external services | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | `dist/` — existing build artifacts may be stale | `npm run build` at end of phase regenerates them |

---

## Common Pitfalls

### Pitfall 1: TypeScript Build Failure (pre-existing — must fix first)
**What goes wrong:** Running `npm run build` fails immediately with ~150 TS17004 errors ("Cannot use JSX unless the '--jsx' flag is provided"). No Phase 1 fix can be verified via `npm run build` until this is resolved.
**Why it happens:** `tsconfig.json` is missing `"jsx": "react-jsx"`. Vite internally injects the JSX transform but `tsc --noEmit` (run first in the build script) does not.
**How to avoid:** Add `"jsx": "react-jsx"` to `tsconfig.json` as the first task of the plan. Verify with `npm run build` — should produce zero tsc errors.
**Warning signs:** The existing test command `npm run build` fails at the `tsc` step before Vite even runs.

### Pitfall 2: `main.ts` imports `counter.ts` — deleting counter.ts alone causes a new TS error
**What goes wrong:** `src/main.ts` line 4 contains `import { setupCounter } from './counter.ts'`. After deleting `counter.ts`, `tsc --noEmit` will report a module-not-found error on `main.ts`.
**Why it happens:** `main.ts` is in the `src/` directory and is therefore included in `tsconfig.json`'s `include: ["src"]` glob.
**How to avoid:** Either delete `main.ts` alongside `counter.ts` (it is also unused — the React app uses `main.tsx`), or remove the import from `main.ts`. Deleting both `counter.ts` and `main.ts` is cleaner since neither file is part of the React app. Verify: `main.tsx` (with `x`) is the actual React entry point in `index.html`.
**Warning signs:** `tsc --noEmit` reports `Cannot find module './counter.ts'` after deleting `counter.ts`.

### Pitfall 3: Ripple effect of making `ensureAudioContext` async
**What goes wrong:** If `ensureAudioContext` is made async, `playTone` must `await` it, making `playTone` async, which propagates to `playColorTone`, `playErrorTone`, and into `playSequence`. The `useCallback` dependency arrays grow and the timing of `playSequence`'s loop changes.
**Why it happens:** JavaScript `async/await` propagates upward through the call chain.
**How to avoid:** Use the gesture-boundary pattern (Option B): add the `await resume()` + try/catch directly in `handleStart` and `handlePadClick` before calling audio functions. Do not touch `ensureAudioContext`'s signature.

### Pitfall 4: `disabled` attribute on active pad causes UA stylesheet dimming
**What goes wrong:** Even with `opacity-40` removed from class names, an active pad with `disabled={true}` may still appear visually muted because user-agent stylesheets apply their own opacity or filter to disabled buttons.
**Why it happens:** Browsers apply `button:disabled { opacity: 0.5; cursor: default; }` or similar. Tailwind's reset does not guarantee this is zeroed out.
**How to avoid:** Ensure `disabled={isDisabled && !isActive}` so the active pad never receives `disabled`. This is UI-02.

### Pitfall 5: `noUnusedLocals` TypeScript flag — removing `counter.ts` exposes dead imports
**What goes wrong:** `tsconfig.json` has `"noUnusedLocals": true` and `"noUnusedParameters": true`. If any import or variable is left unused after the cleanup, `tsc --noEmit` will fail.
**Why it happens:** Strict TypeScript mode is enabled.
**How to avoid:** After deleting `counter.ts` (and `main.ts`), run `tsc --noEmit` to confirm zero errors before finishing the phase.

---

## Code Examples

### Current pad render loop (lines 321-349, App.tsx) — annotated for planned changes

```typescript
// Source: direct codebase read — src/App.tsx lines 321-349
{PADS.map((pad) => {
  const isActive = activePad === pad.id;  // ← already exists, line 322
  const baseClasses =
    'absolute w-1/2 h-1/2 border-[8px] border-zinc-950 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

  // CURRENT (buggy):
  const interactiveClasses = isDisabled
    ? 'cursor-not-allowed opacity-40'           // ← BUG: apply to ALL including active
    : 'cursor-pointer hover:brightness-110';

  // CURRENT (buggy):
  // disabled={isDisabled}                      // ← BUG: disables active pad

  const activeClasses = isActive
    ? `${pad.glowClass} scale-[1.03] brightness-125`
    : 'shadow-[0_0_22px_rgba(0,0,0,0.8)]';

  return (
    <button
      key={pad.id}
      type="button"
      disabled={isDisabled}                     // ← BUG
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
```

### Fixed pad render loop

```typescript
// FIXED (implements D-01, D-02, D-03, UI-01, UI-02, TOUCH-01):
{PADS.map((pad) => {
  const isActive = activePad === pad.id;  // unchanged
  const baseClasses =
    'absolute w-1/2 h-1/2 border-[8px] border-zinc-950 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

  // FIXED: no opacity-40 in any branch; active pad gets empty string (no cursor class)
  const interactiveClasses =
    isDisabled && !isActive
      ? 'cursor-not-allowed'
      : !isDisabled
        ? 'cursor-pointer hover:brightness-110'
        : '';

  const activeClasses = isActive
    ? `${pad.glowClass} scale-[1.03] brightness-125`
    : 'shadow-[0_0_22px_rgba(0,0,0,0.8)]';  // unchanged

  return (
    <button
      key={pad.id}
      type="button"
      disabled={isDisabled && !isActive}        // FIXED: active pad is never disabled
      onClick={() => handlePadClick(pad.id)}
      aria-label={pad.label}
      style={{ touchAction: 'manipulation' }}   // ADDED: TOUCH-01
      className={[
        baseClasses,
        interactiveClasses,
        activeClasses,
        PAD_POSITION_CLASSES[pad.id],
        pad.baseClass,
      ].join(' ')}
    >
```

### Audio fix — handleStart and handlePadClick

Both handlers are already declared `async`. Add the resume block before any audio call.

```typescript
// handleStart — add after the early return guard, before setSequence:
const handleStart = useCallback(async () => {
  if (isPlayingSequence) return;

  // ADDED: AUDIO-01 — await resume before first audio (D-04)
  if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
    try {
      await audioCtxRef.current.resume();
    } catch (_err) {
      // silent failure per D-04
    }
  }

  const startingSequence: ColorId[] = [randomColor()];
  // ... rest unchanged
}, [isPlayingSequence, playSequence, randomColor]);
```

```typescript
// handlePadClick — add after the early return guard:
const handlePadClick = useCallback(
  async (color: ColorId) => {
    if (!isUserTurn || isPlayingSequence) return;

    // ADDED: AUDIO-01 — await resume before pad tone (D-04)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch (_err) {
        // silent failure per D-04
      }
    }

    setActivePad(color);
    playColorTone(color, 220);
    // ... rest unchanged
  },
  [ /* dependency array unchanged */ ],
);
```

Note: `audioCtxRef` is a `useRef` — it is stable across renders and does NOT need to be added to any `useCallback` dependency array.

Also update `ensureAudioContext` to remove the now-redundant `void resume()` call (or leave it as a harmless fallback — either is acceptable):

```typescript
// ensureAudioContext — remove the void resume() line since gesture handlers handle it
const ensureAudioContext = useCallback(() => {
  if (!audioCtxRef.current) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(ctx.destination);
    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
  }
  // Removed: void audioCtxRef.current.resume() — gesture handlers now await this
  return audioCtxRef.current;
}, []);
```

### tsconfig.json fix

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `void ctx.resume()` (fire-and-forget) | `await ctx.resume()` in gesture handler | Browser AudioContext policies require resume to complete before audio nodes start |
| Disable all pads during playback | Disable only non-active pads | Avoids UA stylesheet dimming of the active pad |
| `user-scalable=yes` (default) | `user-scalable=no` | Prevents double-tap zoom on game pads |

**Deprecated/outdated:**
- `webkitAudioContext`: Still included as a fallback (`window as any` cast) for very old WebKit. Fine to keep — it is in the existing code and causes no issues.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tailwind CSS v4 has no built-in `touch-manipulation` utility class | Standard Stack / Pattern 3 | If v4 added one, inline style still works correctly — low risk |
| A2 | Deleting `main.ts` (Vite scaffolding entry) is safe — the React app uses `main.tsx` exclusively | Common Pitfalls / Pitfall 2 | If something else references `main.ts`, deleting it would break that reference. Confirmed safe by reading `index.html` which loads `/src/main.tsx` |

---

## Open Questions

1. **Should `main.ts` be deleted or just have its `counter.ts` import removed?**
   - What we know: `main.ts` is a Vite scaffolding stub (renders old non-React HTML). It imports `counter.ts`. It is NOT the React entry point (`main.tsx` is). Deleting `main.ts` is cleaner.
   - What's unclear: Whether deleting both or keeping `main.ts` with the import removed is preferred style.
   - Recommendation: Delete both `counter.ts` and `main.ts`. They are both scaffolding stubs, neither is imported by the React app.

2. **Should `src/typescript.svg` also be deleted?**
   - What we know: It is only referenced from `main.ts` (`import typescriptLogo from './typescript.svg'`). If `main.ts` is deleted, `typescript.svg` becomes unused.
   - Recommendation: Delete alongside `main.ts` and `counter.ts` for a clean scaffolding purge. Out of Phase 1 scope unless D-06 is interpreted broadly, but low risk either way.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm run build, npm run dev | Yes | v22.17.0 | — |
| npm | Package management | Yes | (bundled with Node 22) | — |
| Vite | `npm run build`, `npm run dev` | Yes | 7.3.1 (installed) | — |
| TypeScript compiler | `npm run build` (tsc step) | Yes | ~5.9.3 (installed) | — |
| Browser (Chrome/Edge) | Manual verification of glow fix, audio, touch | Yes | (developer machine) | Firefox for visual; Android Chrome needed for full TOUCH-01/AUDIO-01 verification |

**Missing dependencies with no fallback:** None.

**Notes:**
- Android Chrome (physical device or emulator) is needed for full confidence on TOUCH-01 and AUDIO-01, but both can be approximated in desktop Chrome DevTools mobile emulation mode for initial verification.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in config — treated as enabled.

The REQUIREMENTS.md explicitly states "Unit / E2E test suite — Not blocking Play Store submission; deferred to v2." There is no test infrastructure in the project. All validation for Phase 1 is manual.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no test framework installed |
| Config file | None |
| Quick run command | `npm run build` (TypeScript check + Vite build — proxy for compile-time correctness) |
| Full suite command | Manual browser verification per checklist below |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| UI-01 | Active pad glows at full brightness during playback; no dimming on any pad | Manual — visual | `npm run dev` then observe | DevTools mobile emulation sufficient |
| UI-02 | Active pad button lacks `disabled` attribute during playback | Manual — DevTools inspect | `npm run dev` then inspect DOM | Check Elements panel during sequence |
| AUDIO-01 | Audio plays on first game start in mobile Chrome with no workaround | Manual — device | `npm run dev` then test on phone | Desktop Chrome with DevTools throttling is acceptable proxy |
| TOUCH-01 | No 300ms tap delay on pad buttons | Manual — device / DevTools | DevTools → Performance panel | `touch-action: manipulation` visible in Computed Styles |
| VIEWPORT-01 | No zoom on pad tap; safe-area filled | Manual — device or DevTools | DevTools → mobile emulation | Verify `user-scalable=no` in rendered meta |

### Wave 0 Gaps

No Wave 0 test files to create — tests are deferred to v2 per project decision. Manual verification checklist serves as the phase gate.

**Manual verification checklist (phase gate — all must pass before `/gsd:verify-work`):**
- [ ] `npm run build` exits with code 0 (no tsc errors, no Vite errors)
- [ ] `npm run dev` starts without errors
- [ ] Open browser → Start Game → sequence plays → active pad glows with colored shadow at full brightness
- [ ] Inactive pads do NOT dim during sequence playback (inspect: no `opacity-40` class, no `opacity` in computed styles)
- [ ] DOM inspector during playback: active pad `<button>` has no `disabled` attribute
- [ ] DOM inspector: every pad `<button>` has `style="touch-action: manipulation;"` (or equivalent)
- [ ] Page source: `<meta name="viewport">` contains `user-scalable=no` and `viewport-fit=cover`
- [ ] On mobile Chrome (or DevTools emulation): audio plays on very first "Start Game" tap
- [ ] `src/counter.ts` does not exist
- [ ] `src/main.ts` does not exist (if deleted per Open Question 1 resolution)

---

## Security Domain

> This phase makes no changes to authentication, session management, data persistence, or network communication. No ASVS categories apply.

| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V2 Authentication | No | No auth in this app |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access control |
| V5 Input Validation | No | Only button clicks; no user text input |
| V6 Cryptography | No | No crypto |

The audio fix (await resume) and pad class fix introduce no new attack surface.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/App.tsx` — all code analysis, line numbers, and behavior claims are from the actual file read in this session
- Direct codebase read: `index.html` — viewport tag current state confirmed
- Direct codebase read: `tsconfig.json` — missing `"jsx"` field confirmed
- Direct execution: `npx tsc --noEmit --jsx react-jsx` returned zero errors [VERIFIED: direct execution]
- Direct execution: `npx vite build` succeeded [VERIFIED: direct execution]
- `.planning/phases/01-web-fixes/01-CONTEXT.md` — locked decisions D-01 through D-06
- `.planning/phases/01-web-fixes/01-UI-SPEC.md` — Class Assembly Rule, Touch and Viewport Contract

### Secondary (MEDIUM confidence)
- `.planning/codebase/CONCERNS.md` — AudioContext user gesture requirement documented
- `.planning/codebase/CONVENTIONS.md` — class assembly pattern, useCallback patterns confirmed

### Tertiary (LOW confidence — training knowledge)
- Tailwind CSS v4 has no built-in `touch-manipulation` utility [ASSUMED] — consistent with UI-SPEC which states the same; confirmed by `src/style.css` which shows no such class defined

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; existing packages confirmed by `package.json`
- Architecture: HIGH — all claims derived from direct codebase reads
- Code changes: HIGH — exact line numbers and current code confirmed by file reads; proposed fixes derived from locked decisions in CONTEXT.md and UI-SPEC.md
- Pitfalls: HIGH — pre-existing tsc failure confirmed by direct execution; `main.ts`/`counter.ts` dependency confirmed by direct file reads
- Touch-action approach: MEDIUM — Tailwind v4 no-utility claim is [ASSUMED] but consistent with UI-SPEC, and inline style works regardless

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable domain — React, Web Audio API, HTML viewport meta are not fast-moving)
