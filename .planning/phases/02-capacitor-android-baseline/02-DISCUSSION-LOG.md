# Phase 2: Capacitor Android Baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 2-Capacitor Android Baseline
**Areas discussed:** App identity, Verification target, Screen orientation, WebView display

---

## App Identity

### Package ID

| Option | Description | Selected |
|--------|-------------|----------|
| com.omerblecher.simongame | Matches email domain pattern. Clear and conventional. | |
| com.omerblecher.simon | Shorter. Fine if you want brevity. | |
| Something else | User has a different package name in mind. | ✓ |

**User's choice:** `com.otis.brooke.simon.game` (free-text, 4-segment format)
**Notes:** Non-standard 4-segment reverse-domain format; valid for Android/Play Store. Researcher should confirm Capacitor/Gradle accepts it without issue.

### Display Name

| Option | Description | Selected |
|--------|-------------|----------|
| Simon Game | Clear and descriptive. Fits well on most home screens. | |
| Simon | Shorter, cleaner. Might be confused with other Simon apps. | |
| Simon Memory Game | Most descriptive but may truncate on small screens. | ✓ |

**User's choice:** Simon Memory Game
**Notes:** None.

---

## Verification Target

### Test Platform

| Option | Description | Selected |
|--------|-------------|----------|
| Physical Android device | More reliable for audio testing. Requires USB debugging and ADB. | |
| Android emulator (AVD) | No phone needed. Audio can be tricky in emulators. | ✓ |
| Both | Emulator for iteration, device for final check. | |

**User's choice:** Android emulator (AVD)

### Android Studio Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Already installed — Android Studio + AVD ready | Plan skips setup, focuses on Capacitor wiring and run command. | ✓ |
| Needs setup — Android Studio not installed yet | Plan includes Android Studio install and AVD creation steps. | |

**User's choice:** Already installed — plan skips Android Studio setup.
**Notes:** Emulator audio unreliability is a known risk; noted in CONTEXT.md as deferred to physical device check in Phase 3.

---

## Screen Orientation

| Option | Description | Selected |
|--------|-------------|----------|
| Portrait only — lock it | Set screenOrientation=portrait in AndroidManifest.xml. | ✓ |
| Free rotation | No lock. Layout may need extra work in landscape. | |

**User's choice:** Portrait only — lock it
**Notes:** Consistent with the 4-pad grid design which is portrait-optimized.

---

## WebView Display

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen / edge-to-edge | Hides status bar and nav bar. Maximizes game area. Feels like a proper mobile game. | ✓ |
| Standard Android chrome | Status bar and nav bar stay visible. Simpler setup, slightly less immersive. | |

**User's choice:** Full-screen / edge-to-edge
**Notes:** Interacts with `viewport-fit=cover` already set in Phase 1. Android window flags must be consistent.

---

## Claude's Discretion

- Exact mechanism for full-screen on Android (Capacitor `StatusBar` plugin, `window.flags` in `MainActivity.java`, or other) — researcher identifies current best practice for chosen Capacitor version.
- Whether `capacitor.config.ts` needs a `server` or `plugins` block for Phase 2 — keep minimal; Phase 3 extends for AdMob.
- Whether `main.tsx` needs Capacitor platform detection in Phase 2 — minimal if needed; structure for Phase 3 extension.

## Deferred Ideas

None — discussion stayed within phase scope.
