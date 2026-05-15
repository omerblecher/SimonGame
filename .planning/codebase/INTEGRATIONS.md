# Integrations

## External Services

**None.** This is a fully client-side application with no backend, database, or third-party service dependencies.

## Browser APIs

### Web Audio API
- **Usage**: Synthesizes tones for the 4 Simon pads, error buzzer, and victory melody
- **Location**: `src/App.tsx` — `ensureAudioContext()`, `playTone()`, `playColorTone()`, `playErrorTone()`, `playJoyMelody()`
- **Pattern**: Lazy-initialized singleton `AudioContext` stored in `audioCtxRef`. Master `GainNode` at 0.2 volume. Each tone creates a short-lived `OscillatorNode` + per-tone `GainNode`.
- **Limitations**: `AudioContext` must be created or resumed after a user gesture (browser policy). The code handles this in `ensureAudioContext()`.
- **Compatibility**: `window.webkitAudioContext` fallback included for older Safari.

## Data Persistence

**None.** All game state is in-memory React state. `bestStreak` resets on page reload — there is no `localStorage` or cookie storage.

## Authentication

**None.**

## Analytics / Monitoring

**None.**
