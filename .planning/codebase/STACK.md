# Stack

## Language & Runtime

- **Language**: TypeScript 5.9 (strict mode)
- **Runtime**: Browser (no Node.js server)
- **Module system**: ESNext with Vite bundler mode (`verbatimModuleSyntax`)
- **Target**: ES2022

## Frameworks & Libraries

| Package | Version | Role |
|---------|---------|------|
| React | ^19.2.4 | UI rendering |
| ReactDOM | ^19.2.4 | DOM mounting |
| Vite | ^7.3.1 | Dev server & bundler |
| Tailwind CSS | ^4.1.18 | Utility-first styling (v4, PostCSS plugin) |
| TypeScript | ~5.9.3 | Static typing |
| PostCSS | ^8.5.6 | CSS processing |
| autoprefixer | ^10.4.24 | CSS vendor prefixing |

## TypeScript Config Highlights

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- `erasableSyntaxOnly: true` — no decorators or enums
- `noEmit: true` — Vite handles transpilation
- `allowImportingTsExtensions: true` — imports use `.ts`/`.tsx` extensions

## Styling

- Tailwind CSS v4 via `@tailwindcss/postcss` plugin (new config-less approach)
- CSS file: `src/style.css` — imports `tailwindcss`, defines base/component layers
- Custom classes: `.glass-panel`, `.stat-label`, `.stat-value`
- Dark-mode-first design (`color-scheme: dark`)

## Build & Dev

- `npm run dev` → Vite dev server (HMR)
- `npm run build` → `tsc && vite build`
- `npm run preview` → Vite preview server
- Entry point: `src/main.tsx` → mounts `<App>` into `#app`
- `index.html` must define `<div id="app">`

## Browser APIs Used

- **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`) — generates tones for Simon pads, error buzzer, and celebration melody. No external audio files.
- `window.webkitAudioContext` fallback for legacy Safari
