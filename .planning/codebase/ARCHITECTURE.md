# Architecture

**Analysis Date:** 2026-05-15

## Pattern Overview

**Overall:** Single-page application (SPA) with monolithic component architecture

**Key Characteristics:**
- Centralized game state management within a single React component
- Web Audio API for tone generation and playback
- Direct DOM manipulation through React hooks (useState, useCallback, useRef)
- Tailwind CSS for responsive styling with glass-morphism design
- No external backend dependencies or API integration

## Layers

**Presentation Layer:**
- Purpose: Render the Simon game UI with interactive pads, status display, and controls
- Location: `src/App.tsx`
- Contains: React component with JSX markup, Tailwind classes, button interactions
- Depends on: React, Web Audio API (via window.AudioContext)
- Used by: Browser through React DOM entry point

**Logic Layer:**
- Purpose: Manage game flow, sequence generation, user input validation, and audio playback
- Location: `src/App.tsx` (all game logic embedded in single component)
- Contains: Game state (sequence, turn tracking, rounds, streaks), audio synthesis callbacks, game flow functions
- Depends on: React hooks (useState, useCallback, useRef), Web Audio API
- Used by: Presentation layer through event handlers

**Styling Layer:**
- Purpose: Define visual styles and design system
- Location: `src/style.css` (Tailwind directives), `tailwind.config.cjs` (theme configuration)
- Contains: Base styles, component layers (glass-panel, stat-label, stat-value), Tailwind configuration
- Depends on: Tailwind CSS v4.1.18, PostCSS
- Used by: All components through className attributes

## Data Flow

**Game Initialization Flow:**

1. User clicks "Start Game" button
2. `handleStart()` creates initial random ColorId and calls `setSequence()`
3. `playSequence()` is invoked with the generated sequence
4. Sequence plays through: activate pad → play tone → wait → deactivate pad
5. UI updates `isUserTurn` to true, `status` to "Your turn"

**User Input Flow:**

1. User clicks a colored pad during their turn
2. `handlePadClick(color)` is invoked
3. Pad activates, tone plays (220ms duration)
4. Pad deactivates after 200ms delay
5. Function validates: `sequence[userIndex] === color`
6. If correct:
   - If `userIndex < sequence.length - 1`: increment userIndex, continue turn
   - If sequence complete: increment streak, generate next sequence, call `playSequence()` again
7. If incorrect: play error tone, reset game after 900ms delay

**Error/Reset Flow:**

1. User selects wrong pad or makes an error
2. `playErrorTone()` plays low 120Hz tone (500ms)
3. Best streak is updated if current streak exceeds it
4. `resetGame()` clears all state after delay
5. Status updates to "Press Start to begin"

**State Management:**
- All game state stored in component-level useState hooks
- No external state management (Redux, Zustand, etc.)
- References (audioCtxRef, masterGainRef, isCelebratingRef) stored in useRef for audio context persistence and celebration flag
- Dependencies carefully managed in useCallback arrays to prevent infinite loops

## Key Abstractions

**Color Identity (ColorId):**
- Purpose: Type-safe representation of the four game pads
- Examples: 'green', 'red', 'yellow', 'blue'
- Pattern: Union type enforced through TypeScript

**Pad Configuration:**
- Purpose: Centralized metadata for each colored pad
- Examples: `PADS` constant array with id, label, description, baseClass, glowClass
- Pattern: Data-driven UI - pad properties define both visual styling and audio tone mapping

**Tone Mapping:**
- Purpose: Map ColorId to audio frequency for authentic Simon game tones
- Examples: `COLOR_TONES` (green: 164.81 Hz, red: 220.0 Hz, yellow: 277.18 Hz, blue: 329.63 Hz)
- Pattern: Constant lookup table matching original Simon game frequencies (A major triad)

**Audio Playback:**
- Purpose: Encapsulate Web Audio API complexity
- Pattern: Three-layer abstraction:
  1. `playTone(frequency, durationMs)`: Low-level oscillator creation and gain ramping
  2. `playColorTone(color, durationMs)`: Map color to frequency
  3. `playErrorTone()`, `playJoyMelody()`: High-level semantic sounds

## Entry Points

**Application Root:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`, script mounts React app
- Responsibilities: Initialize React DOM, render App component into #app div

**HTML Entry:**
- Location: `index.html`
- Triggers: Initial page load
- Responsibilities: Provide DOM container, load React and game script

**Game Component:**
- Location: `src/App.tsx`, exported as `App`
- Triggers: React renders the App component from main.tsx
- Responsibilities: Entire game implementation - state management, rendering, event handling

## Error Handling

**Strategy:** Defensive validation with graceful fallbacks

**Patterns:**
- Audio context suspended state handled: `if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()`
- User input validation during turn: Check `isUserTurn && !isPlayingSequence` before processing pad clicks
- Sequence validation: Compare `sequence[userIndex]` with user input, reset game on mismatch
- Null/undefined checks: `!expectedColor || expectedColor !== color` gate error handling
- Async safety: Celebrating flag (`isCelebratingRef.current`) prevents overlapping celebration melodies

## Cross-Cutting Concerns

**Logging:** None implemented. Status messages managed through `status` state variable displayed in UI.

**Validation:** Input validation on pad clicks:
- Validate game state before processing (turn state, sequence playing state)
- Validate color against expected sequence element
- Best streak persistence across game resets

**Authentication:** Not applicable. Single-player game with no backend.

**Timing & Delays:** Critical to game feel:
- Base pad durations scale with sequence length: 550ms - (length × 25ms), minimum 220ms
- Off-time between pads: 260ms - (length × 15ms), minimum 120ms
- User pad duration: 220ms with 200ms delay before validation
- Celebration melody plays with delays between notes (dur + 40ms)

---

*Architecture analysis: 2026-05-15*
