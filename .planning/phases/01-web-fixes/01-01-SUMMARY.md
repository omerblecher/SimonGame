---
phase: 01-web-fixes
plan: 01
subsystem: build
tags: [typescript, vite, react, tsconfig]

# Dependency graph
requires: []
provides:
  - "Passing npm run build with zero TypeScript errors"
  - "JSX compiler option configured for React 19"
  - "Clean src/ directory with no dead Vite scaffold files"
affects: [01-02, 02-capacitor-baseline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tsconfig.json uses 'jsx': 'react-jsx' for React 19 automatic JSX transform"

key-files:
  created: []
  modified:
    - tsconfig.json

key-decisions:
  - "Added 'jsx': 'react-jsx' immediately after 'types' line to fix ~150 TS17004 errors blocking all subsequent plans"
  - "Deleted src/main.ts, src/counter.ts, and src/typescript.svg together atomically — main.ts imports counter.ts so both must go simultaneously"

patterns-established:
  - "All Phase 1 changes are verified by npm run build passing with zero TypeScript errors"

requirements-completed: [UI-01, UI-02, AUDIO-01, TOUCH-01, VIEWPORT-01]

# Metrics
duration: 5min
completed: 2026-05-15
---

# Phase 1 Plan 01: Build Unblock Summary

**Added "jsx": "react-jsx" to tsconfig.json and removed three dead Vite template stubs, unblocking npm run build from ~150 TS17004 errors to a clean zero-error pass**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-15T10:35:00Z
- **Completed:** 2026-05-15T10:40:00Z
- **Tasks:** 1
- **Files modified:** 4 (1 modified, 3 deleted)

## Accomplishments
- Fixed tsconfig.json: added `"jsx": "react-jsx"` inside compilerOptions so TypeScript knows the JSX transform to use with React 19
- Deleted src/main.ts — original Vite scaffold entry that conflicted with src/main.tsx and imported the dead counter
- Deleted src/counter.ts — unused Vite template counter module
- Deleted src/typescript.svg — SVG asset referenced only by the deleted main.ts
- `npm run build` now exits 0, producing dist/ with 203 kB JS, 32 kB CSS

## Task Commits

1. **Task 1: Add JSX compiler option and delete dead scaffold files** - `b2148e4` (chore)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `tsconfig.json` — Added `"jsx": "react-jsx"` after the `"types"` line in compilerOptions
- `src/main.ts` — Deleted (Vite template stub, never used by actual app)
- `src/counter.ts` — Deleted (Vite template stub, imported only by deleted main.ts)
- `src/typescript.svg` — Deleted (referenced only by deleted main.ts)

## Decisions Made
- Added `"jsx": "react-jsx"` (not `"preserve"` or `"react"`) because Vite's transform expects the automatic React 19 JSX runtime
- Deleted all three scaffold files atomically in a single commit to avoid leaving a broken import between main.ts and counter.ts mid-deletion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Build is now unblocked — Plan 01-02 (active pad glow fix + AudioContext await) can be verified with `npm run build`
- No blockers for Plan 01-02

---
*Phase: 01-web-fixes*
*Completed: 2026-05-15*
