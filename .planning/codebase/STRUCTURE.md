# Codebase Structure

**Analysis Date:** 2026-05-15

## Directory Layout

```
C:\code\cursor\SimonGame/
├── src/                    # Application source code
│   ├── App.tsx            # Main game component (entire game implementation)
│   ├── main.tsx           # React entry point - mounts App to DOM
│   ├── main.ts            # Legacy Vite template entry point (not used)
│   ├── counter.ts         # Legacy Vite template counter utility (not used)
│   ├── style.css          # Global styles with Tailwind and custom components
│   └── typescript.svg     # Legacy Vite template asset
├── public/                # Static assets served as-is
│   └── vite.svg          # Vite logo
├── index.html             # HTML entry point - contains #app root element
├── package.json           # Project dependencies and build scripts
├── tsconfig.json          # TypeScript compiler configuration
├── tailwind.config.cjs    # Tailwind CSS theme configuration
├── postcss.config.cjs     # PostCSS plugins configuration (Tailwind)
└── .planning/            # Planning and analysis documents
    └── codebase/         # Generated codebase analysis documents
```

## Directory Purposes

**src/:**
- Purpose: All application source code and styles
- Contains: React components (TSX), TypeScript logic, CSS stylesheets
- Key files: `App.tsx` (100% of game logic), `main.tsx` (React bootstrap), `style.css` (Tailwind + custom components)

**public/:**
- Purpose: Static assets that bypass the build process
- Contains: SVG logos and images
- Key files: `vite.svg` (unused branding asset)

**.planning/codebase/:**
- Purpose: Generated codebase analysis and architecture documentation
- Generated: Yes (by GSD analysis tools)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: HTML document root - defines `<div id="app"></div>` container and loads `src/main.tsx`
- `src/main.tsx`: React entry point - mounts App component to #app element via ReactDOM.createRoot()
- `src/App.tsx`: Game component exported as named export `App`

**Configuration:**
- `tsconfig.json`: TypeScript compiler strict mode, ES2022 target, no emit (transpiling via Vite)
- `tailwind.config.cjs`: Scans `./index.html` and `./src/**/*.{js,ts,jsx,tsx}` for classes
- `postcss.config.cjs`: Registers @tailwindcss/postcss plugin
- `package.json`: Build scripts (dev, build, preview), dependencies, module type ESM

**Core Logic:**
- `src/App.tsx`: Complete game implementation including:
  - Game state (sequence, turn tracking, rounds, streaks, status)
  - UI rendering (4 colored pads, control buttons, stats display)
  - Audio synthesis (Web Audio API oscillators)
  - Event handlers (pad clicks, start/reset buttons)
  - Game flow (sequence generation, turn validation, win/lose conditions)

**Styling:**
- `src/style.css`: Tailwind CSS import with custom component layers:
  - `@layer base`: Dark mode defaults, dark color scheme
  - `@layer components`: `.glass-panel` (frosted glass effect), `.stat-label`, `.stat-value`
- Inline Tailwind classes in `App.tsx` JSX (grid layout, spacing, colors, transitions)

**Testing:**
- No test files present in codebase

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `App.tsx`)
- TypeScript files: camelCase (e.g., `counter.ts`)
- Styles: lowercase (e.g., `style.css`)
- Config files: camelCase with .cjs extension for CommonJS (e.g., `tailwind.config.cjs`)

**Directories:**
- Lowercase with clear purpose (src, public, .planning)

**TypeScript Types & Constants:**
- Type aliases: PascalCase (e.g., `ColorId`, `Pad`)
- Constants: UPPER_SNAKE_CASE (e.g., `PADS`, `COLOR_TONES`, `ERROR_TONE`, `PAD_POSITION_CLASSES`)

**React/Functions:**
- Component names: PascalCase (e.g., `App`)
- Hook names: camelCase starting with "use" (e.g., `useCallback`, `useState`)
- Handler functions: camelCase starting with "handle" (e.g., `handleStart`, `handlePadClick`)
- Utility functions: camelCase (e.g., `playTone`, `randomColor`, `resetGame`)
- Callback/ref names: camelCase with suffix (e.g., `audioCtxRef`, `ensureAudioContext`, `playColorTone`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/App.tsx` (if game-related) or new component file `src/[Feature].tsx`
- Tests: Create `src/[Feature].test.tsx` or `src/__tests__/[Feature].spec.tsx`
- Styles: Add to `src/style.css` custom components layer or inline in component

**New Component/Module:**
- Implementation: `src/[ComponentName].tsx` as named export
- Split logic: Extract callbacks into separate utility file `src/utils/[name].ts` if complex
- Example: Audio utilities could move to `src/utils/audio.ts` with `playTone`, `playColorTone`, `ensureAudioContext`

**Utilities:**
- Shared helpers: `src/utils/[name].ts` (e.g., `src/utils/audio.ts`, `src/utils/gameLogic.ts`)
- Type definitions: `src/types/[name].ts` (e.g., `src/types/game.ts` for ColorId, Pad)

**Styles:**
- Component styles: `src/style.css` in `@layer components`
- Tailwind directives: Use inline className in JSX
- Custom CSS: Minimal - prefer Tailwind utilities

## Special Directories

**.planning/:**
- Purpose: GSD planning and codebase analysis artifacts
- Generated: Yes (by mapping/planning tools)
- Committed: Yes (planning documents are versioned)

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

**.git/:**
- Purpose: Git version control metadata
- Generated: Yes
- Committed: N/A (git internals)

## Import Patterns

**React imports:**
- Component imports: `import React, { useCallback, useMemo, useRef, useState } from 'react'`
- DOM imports: `import ReactDOM from 'react-dom/client'`

**Style imports:**
- CSS: `import './style.css'` (relative to source file)
- Assets: `import viteLogo from '/vite.svg'` (absolute paths for public assets)

**No path aliases configured:** Use relative paths (./App.tsx not @/App.tsx)

---

*Structure analysis: 2026-05-15*
