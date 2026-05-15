# Coding Conventions

**Analysis Date:** 2026-05-15

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `App.tsx`)
- Utility functions: camelCase (e.g., `counter.ts`)
- CSS/styling files: lowercase with extension (e.g., `style.css`)
- SVG assets: camelCase (e.g., `typescript.svg`)

**Functions:**
- Event handlers: `handle[Action]` pattern (e.g., `handleStart`, `handlePadClick`)
- Callback creators: use `useCallback` wrapper names directly (e.g., `playTone`, `randomColor`)
- Setup functions: `setup[Component]` pattern (e.g., `setupCounter`)
- Helper functions: camelCase verbs (e.g., `ensureAudioContext`, `playColorTone`)

**Variables:**
- State variables: camelCase (e.g., `sequence`, `isPlayingSequence`, `bestStreak`)
- Constants: UPPER_SNAKE_CASE (e.g., `PADS`, `COLOR_TONES`, `ERROR_TONE`, `PAD_POSITION_CLASSES`)
- Type unions: single quotes in string literals (e.g., `'green' | 'red' | 'yellow' | 'blue'`)
- Refs: `[name]Ref` suffix (e.g., `audioCtxRef`, `masterGainRef`, `isCelebratingRef`)

**Types:**
- Type aliases: PascalCase (e.g., `ColorId`, `Pad`)
- Union types: inline string unions (e.g., `type ColorId = 'green' | 'red' | 'yellow' | 'blue'`)
- Object shape definitions: explicit type definitions with properties documented (e.g., `type Pad`)

## Code Style

**Formatting:**
- No linter or formatter configured in project
- Manual formatting follows consistent patterns:
  - 2-space indentation (observed in all files)
  - Semicolons used consistently at end of statements
  - Single quotes preferred for imports and string literals
  - Space after `import` keyword

**Linting:**
- TypeScript strict mode enabled in `tsconfig.json`:
  - `strict: true` - enforces all strict type checks
  - `noUnusedLocals: true` - variables must be used
  - `noUnusedParameters: true` - function parameters must be used
  - `noFallthroughCasesInSwitch: true` - switch cases must have breaks
  - `noUncheckedSideEffectImports: true` - side effects must be explicit

## Import Organization

**Order:**
1. External libraries (React, ReactDOM)
2. Local files (relative imports with `./`)
3. CSS/styling files
4. Asset imports (SVG, images)

**Example from `App.tsx`:**
```typescript
import React, { useCallback, useMemo, useRef, useState } from 'react';
// (constants and types defined after imports)
```

**Example from `main.tsx`:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';
```

**Path Aliases:**
- None configured in `tsconfig.json` - all imports use relative paths with `./`

## Error Handling

**Patterns:**
- Guard clauses used extensively (e.g., `if (!isUserTurn || isPlayingSequence) return;`)
- Optional chaining for safe property access (e.g., `PADS[index]!.id`)
- Non-null assertion (`!`) used when type checker requires it but logic guarantees value exists
- Null checks for audio context: `if (!ctx || !masterGain) return;`
- Conditional rendering based on state (e.g., `if (!expectedColor || expectedColor !== color)`)

**Error Tone:**
- Distinct audio feedback for errors (`ERROR_TONE = 120`, low frequency buzz)
- UI status message updates on error (e.g., `'Oops! Wrong move. Sequence reset.'`)

## Logging

**Framework:** `console` not used - no logging framework present

**Patterns:**
- Status message state variable tracks user-facing messages
- No debug logging in production code
- Comments explain complex logic (e.g., tone frequency documentation)

## Comments

**When to Comment:**
- Explain non-obvious constants with their source/reasoning
- Document complex audio frequency values with musical note equivalents
- Mark JSX sections with semantic descriptions (e.g., `{/* Colored quadrants */}`)

**JSDoc/TSDoc:**
- Not extensively used in this codebase
- Single-line comments (`//`) preferred over block comments
- Comments appear above or inline with the code they describe

**Example from `App.tsx`:**
```typescript
// Frequencies approximate the original Simon game tones (A major triad) per Wikipedia:
// Blue: E (higher), Yellow: C#, Red: A, Green: E (lower)
const COLOR_TONES: Record<ColorId, number> = {
  // blue: E4, yellow: C#4, red: A3, green: E3
  blue: 329.63,
  yellow: 277.18,
  red: 220.0,
  green: 164.81,
};
```

## Function Design

**Size:** Functions are moderate length, typically 10-40 lines. Callback functions extracted into `useCallback` hooks for reusability and proper dependency tracking.

**Parameters:**
- Explicit parameter types always specified in React/TypeScript context
- Callback parameters are straightforward (e.g., `color: ColorId`, `frequency: number`)
- Destructuring not used extensively - simple parameter passing preferred

**Return Values:**
- Async functions return `Promise<void>` when no value needed
- Functions with side effects (state updates) typically return void
- Pure utility functions like `randomColor` return typed values (`ColorId`)

**Async/Await:**
- Used in callback functions for sequencing audio playback and delays
- Promises created with `new Promise` for setTimeout wrapping
- `await` used to pause execution between tone playback and visual state changes

## Module Design

**Exports:**
- Named exports for functions: `export function setupCounter(...)`
- Named exports for React components: `export const App: React.FC = () => {...}`
- Single file modules are simple and self-contained

**Barrel Files:**
- Not used in this small codebase
- Direct imports from source files preferred

## React/Component Patterns

**Hooks:**
- `useState` for game state management (sequence, round, streak, etc.)
- `useCallback` for all event handlers and tone-playing functions with explicit dependencies
- `useRef` for audio context (which must persist across renders)
- `useMemo` for derived values (e.g., `isDisabled` computed state)

**Dependency Arrays:**
- All `useCallback` hooks include explicit dependency arrays
- Dependencies are comprehensive and include all variables/functions used

**Component Structure:**
- Single functional component `App` contains all game logic
- State and callbacks defined before JSX
- JSX organized into semantic sections with comments

**Class Names:**
- Tailwind utility classes used exclusively for styling
- Dynamic class names assembled with `.join(' ')` pattern
- Base/interactive/active class combinations for state-dependent styling

**Example pattern from `App.tsx`:**
```typescript
const baseClasses = '...classes...';
const interactiveClasses = isDisabled ? '...' : '...';
const activeClasses = isActive ? `${pad.glowClass} ...` : '...';

return (
  <button
    className={[
      baseClasses,
      interactiveClasses,
      activeClasses,
      PAD_POSITION_CLASSES[pad.id],
      pad.baseClass,
    ].join(' ')}
  >
```

---

*Convention analysis: 2026-05-15*
