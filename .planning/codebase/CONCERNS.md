# Codebase Concerns

**Analysis Date:** 2026-05-15

## Tech Debt

**Unused Legacy Code:**
- Issue: `src/counter.ts` is a scaffolding stub from project template and is not imported or used anywhere
- Files: `src/counter.ts`
- Impact: Adds unnecessary file to codebase, increases cognitive load, may confuse developers
- Fix approach: Remove `src/counter.ts` entirely as it serves no purpose in the Simon game application

**Monolithic App Component:**
- Issue: All game logic and UI rendering consolidated in single `src/App.tsx` file (463 lines)
- Files: `src/App.tsx`
- Impact: Difficult to test, hard to maintain, poor separation of concerns. Component mixes game state management, audio handling, and presentation
- Fix approach: Extract game logic into custom hooks (e.g., `useSimonGame`, `useAudioContext`), extract pad components into separate component, separate styles

**Hardcoded Magic Numbers:**
- Issue: Timing delays, animation durations, and calculations scattered throughout code without named constants
- Files: `src/App.tsx` (lines 178-179, 216, 233, 266, etc.)
- Impact: Makes it difficult to adjust game difficulty, timing, or balance without understanding the code. Values like `220`, `550`, `450`, `850` appear without explanation
- Fix approach: Move all numeric constants to top of file or separate `constants.ts` with descriptive names (e.g., `INITIAL_PAD_ON_MS`, `SEQUENCE_DELAY_MS`, `ERROR_FEEDBACK_DELAY_MS`)

**Inline CSS Class Generation:**
- Issue: Tailwind classes built dynamically via array joins throughout render (e.g., lines 339-345)
- Files: `src/App.tsx` (lines 323-345)
- Impact: Prevents Tailwind from optimizing class usage, makes it harder to track which classes are actually used, reduces build optimization
- Fix approach: Use template literals or classname utility library, extract button styling to separate styled component

## Known Bugs

**Audio Context Not Properly Cleaned Up:**
- Symptoms: AudioContext persists across component unmounts, potential memory leak if component remounts
- Files: `src/App.tsx` (lines 74-91)
- Trigger: Remount component (e.g., fast refresh during development, route changes in larger app)
- Workaround: None - application is single-route, but problematic pattern for reuse

**Missing Ref Cleanup in useCallback:**
- Symptoms: `isCelebratingRef` can be left in `true` state if component unmounts during melody playback
- Files: `src/App.tsx` (lines 130-150)
- Trigger: Navigate away or unmount app while celebration melody is playing
- Workaround: Wait for melody to complete before navigating

**Race Condition in bestStreak Updates:**
- Symptoms: If user makes error while melody is playing, `currentStreakSnapshot` captured on line 228 may be stale or incorrect
- Files: `src/App.tsx` (lines 228-231)
- Trigger: Rapidly trigger wrong pad press while `playJoyMelody()` is executing
- Workaround: None - timing-dependent bug

## Security Considerations

**No Input Validation:**
- Risk: Although game only has button clicks (not text input), no validation of game state changes or sequence data
- Files: `src/App.tsx` (entire file)
- Current mitigation: Limited surface area - only local state manipulation possible
- Recommendations: Add assertions for sequence length limits, pad color validation

**Audio Context User Gesture Requirement:**
- Risk: Audio autoplay blocked in browsers without user gesture; current code will fail silently
- Files: `src/App.tsx` (lines 87-89)
- Current mitigation: `audioCtxRef.current.resume()` called, but error not handled
- Recommendations: Add try-catch around `resume()`, provide user feedback if audio fails to initialize

**No Content Security Policy:**
- Risk: Application can load arbitrary audio via Web Audio API
- Files: `src/App.tsx`
- Current mitigation: Only uses programmatic tone generation (safe), no external audio files
- Recommendations: None needed for current implementation - safe pattern used

## Performance Bottlenecks

**Excessive Re-renders from State Updates:**
- Problem: Each game action (pad click, sequence step) triggers multiple `useState` calls sequentially, causing batched re-renders
- Files: `src/App.tsx` (lines 209-283, 157-166)
- Cause: State updates in event handlers don't batch, each `setState` triggers reconciliation
- Improvement path: Use `useReducer` to consolidate state updates into single dispatch, reducing render cycles

**Delay Functions Using setTimeout:**
- Problem: Multiple nested `setTimeout` calls and async/await chains create waterfall timing, blocking UI responsiveness
- Files: `src/App.tsx` (lines 174, 216, 233, 266)
- Cause: Sequential delays compound - playSequence waits 450ms, then iterates with delays, then waits 850ms before next sequence
- Improvement path: Consider using `requestAnimationFrame` for visual timing, consolidate delays into animation state machine

**Dynamic Class String Construction in Render:**
- Problem: Button classes generated on every render (lines 339-345), even if no state changed
- Files: `src/App.tsx` (lines 323-345)
- Cause: Array join happens during JSX evaluation every render
- Improvement path: Memoize class construction or use CSS modules/styled components

**No Lazy Loading or Code Splitting:**
- Problem: All code (React, Tailwind, app logic) bundled together in single bundle
- Files: `src/main.tsx`, build pipeline
- Cause: Project size is small, but pattern doesn't scale
- Improvement path: Add dynamic imports for non-critical features if app grows (e.g., instructions modal)

## Fragile Areas

**Audio Playback Timing:**
- Files: `src/App.tsx` (lines 93-117, 130-150, 168-195)
- Why fragile: Relies on precise setTimeout/delay timing which varies by browser and system load. Audio envelope ramps (lines 106-108) are hardcoded with no adjustment mechanism
- Safe modification: Any changes to delay values must be tested across browsers and device types. Consider adding audio ramp time constants for adjustment
- Test coverage: Zero - no unit tests for timing behavior

**Game State Transitions:**
- Files: `src/App.tsx` (entire game logic)
- Why fragile: Complex state machine (isPlayingSequence, isUserTurn, userIndex, activePad) lacks explicit state management. Race conditions possible if user clicks during async operations
- Safe modification: Must test all click sequences: during sequence playback, during user turn, rapid clicks, clicks after errors
- Test coverage: Zero - no automated tests

**React StrictMode Warnings:**
- Files: `src/main.tsx` (line 7)
- Why fragile: StrictMode will cause audio context initialization and effects to run twice in development, potentially causing errors
- Safe modification: Ensure audioCtxRef checks prevent double-initialization (currently safe at line 79)
- Test coverage: Requires manual testing in development

## Scaling Limits

**Sequence Growth Without Bounds:**
- Current capacity: No maximum sequence length enforced
- Limit: Browser memory and user patience - theoretically can reach thousands of steps
- Scaling path: Add `MAX_SEQUENCE_LENGTH` constant, prevent sequence growth beyond limit, show warning at high levels

**Audio Oscillators Not Cleaned Up:**
- Current capacity: Multiple oscillators created per tone, no explicit cleanup
- Limit: Browser audio node limits (hundreds to thousands depending on browser)
- Scaling path: Implement oscillator pool/reuse, ensure all created nodes are connected to master gain and properly stopped

## Dependencies at Risk

**TypeScript 5.9.3 with Strict Mode:**
- Risk: TypeScript strict mode forces exhaustive type checking; future changes might break on type errors
- Impact: Can't easily suppress type warnings, must refactor to pass checks
- Migration plan: Current setup is good - no migration needed, but be aware strict mode prevents type-unsafe patterns

**Vite 7.3.1 (Recent Release):**
- Risk: Project uses recent Vite version which may have stability issues
- Impact: Build pipeline changes, plugin compatibility
- Migration plan: Monitor for minor releases, update regularly during active development

**React 19.2.4 (Latest Major):**
- Risk: Bleeding-edge React version with potential compatibility issues with libraries
- Impact: Cannot easily add libraries that don't support React 19
- Migration plan: Version is stable for single-component app, monitor for any reported issues

## Missing Critical Features

**No Persistence:**
- Problem: Best streak resets on page refresh
- Blocks: Can't track long-term progress, frustrating for players
- Fix: Add localStorage persistence of `bestStreak` (low complexity, high user value)

**No Mobile Optimization:**
- Problem: Touch events not explicitly handled, tap targeting on small pads is difficult
- Blocks: Poor experience on mobile/tablet
- Fix: Increase touch target sizes, test on mobile devices, add touch-specific visual feedback

**No Sound Muting Control:**
- Problem: No way to disable audio (e.g., in quiet environments)
- Blocks: Users must mute browser to silence game
- Fix: Add mute toggle button, store preference in localStorage

**No Game Difficulty Settings:**
- Problem: Game only has one difficulty (classic mode)
- Blocks: Can't adjust game speed or sequence growth rate
- Fix: Add easy/hard/custom difficulty modes that adjust timing constants

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Game logic, state transitions, audio functions, scoring/streak logic
- Files: `src/App.tsx` (entire component), `src/main.tsx`
- Risk: Regressions go undetected, refactoring is unsafe, behavior is undocumented
- Priority: **High** - Core game logic has no automated verification

**No Integration Tests:**
- What's not tested: Full game flow (start → sequence playback → user input → round progression), error handling
- Files: `src/App.tsx`
- Risk: Can't verify complete gameplay loops work after changes
- Priority: **High** - Game is a flow-heavy app

**No Audio Testing:**
- What's not tested: Tone generation, frequency accuracy, audio context initialization
- Files: `src/App.tsx` (audio functions)
- Risk: Audio could break silently (browser context issues, oscillator problems)
- Priority: **Medium** - Core game feature but browser-dependent

**No Accessibility Testing:**
- What's not tested: Keyboard navigation, screen reader compatibility, focus management
- Files: `src/App.tsx` (entire component)
- Risk: App inaccessible to users with disabilities
- Priority: **Medium** - UI-heavy app, accessibility important

**No E2E Tests:**
- What's not tested: Full user workflows, UI responsiveness, timing accuracy
- Files: All source files
- Risk: Can't verify game works end-to-end in real browser environment
- Priority: **Medium** - Would catch timing/UI issues

---

*Concerns audit: 2026-05-15*
