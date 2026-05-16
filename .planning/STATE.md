---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Android Release
status: executing
last_updated: "2026-05-16T08:20:00.367Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 16
  completed_plans: 10
  percent: 63
---

# State — Simon Game Android Release

## Project Reference

**Core value:** A polished, playable Simon game that works flawlessly on Android devices — responsive pads that glow correctly, clear audio feedback, and a smooth Play Store experience.
**Current focus:** Phase 3 — AdMob Integration

---

## Current Position

**Milestone:** 1 — v1.0 Android Release
**Phase:** 4 — Signing + Play Store Submission — Ready to execute
**Plan:** Execute Phase 4 next (9 plans, 6 waves)
**Status:** Phase 4 planned — ready to execute

```
Progress: [██████░░░░] 63%
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 4 |
| Phases complete | 2 |
| Requirements total | 24 |
| Requirements complete | 11 |

---

## Accumulated Context

### Decisions Logged

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Capacitor over React Native | Preserves existing React codebase, no rewrite needed | Pre-planning |
| Banner ads only | Least intrusive to gameplay; interstitials break immersion | Pre-planning |
| Active pad stays bright, others stay normal | User's explicit preference — no dimming of inactive pads | Pre-planning |
| tsconfig uses "jsx": "react-jsx" | Required for React 19 automatic JSX transform via Vite; fixes TS17004 errors | Phase 1 Plan 01 |
| Deleted main.ts + counter.ts atomically | main.ts imports counter.ts — deleting only one would leave a broken import; both deleted together | Phase 1 Plan 01 |
| Active pad excluded from disabled+opacity — gesture handlers own AudioContext lifecycle | Pad stays interactive during sequence so glow renders; resume() moved to handleStart/handlePadClick with await+try/catch | Phase 1 Plan 02 |
| Capacitor 8 (not 6 or 7) | @capacitor-community/admob@8.0.0 (Dec 2025) requires @capacitor/core ^8.0.0 — wrong version would block Phase 3 AdMob | Phase 2 Planning |
| Emulator audio silence acceptable for Phase 2 | AVD audio unreliable; physical device audio check deferred to Phase 3 | Phase 2 Planning |
| capacitor.config.ts created manually (no npx cap init) | Locks appId and appName deterministically without interactive prompts; TypeScript config consistent with TS-first project | Phase 2 Plan 01 |
| Java 21 is installed but JAVA_HOME points to Java 8 | Java 21 at C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot must be used for Gradle builds; set JAVA_HOME before Plan 02 | Phase 2 Plan 01 |
| Emulator audio silence accepted for Phase 2; physical device deferred | AVD audio unreliable (D-05); game interaction fully verified on AVD; audio check deferred to Phase 3 | Phase 2 Plan 02 |
| @string/admob_app_id indirection in AndroidManifest | App ID in strings.xml referenced via @string/admob_app_id — keeps ID out of XML attributes for cleaner environment switching | Phase 3 Plan 01 |
| Pre-render body background slate-900 (#0f172a) not slate-950 | 1-second pre-render delta imperceptible; inline style overridden by Tailwind at runtime | Phase 3 Plan 01 |
| IIFE over top-level await in main.tsx | IIFE safer with strict TypeScript mode; avoids TS1378 even if tsconfig target changes | Phase 3 Plan 02 |
| BannerAdPluginEvents.SizeChanged (not bannerAdLoaded) for banner height | bannerAdLoaded is () => void with no payload; SizeChanged carries { width, height } | Phase 3 Plan 02 |
| initializeForTesting: true Phase 3 only | Test mode in Phase 3; replaced with false in Phase 4 per planning key decision #9 | Phase 3 Plan 02 |

### Active TODOs

- Phase 3: Verify audio on physical Android device during AdMob integration (emulator audio silent per D-05)
- Phase 3: Register AdMob App ID for appId=com.otis.brooke.simon.game before starting Phase 3

### Known Blockers

None at start.

### Key Risks (from research)

| Risk | Severity | Mitigation |
|------|----------|------------|
| AdMob plugin requires Capacitor 8 | RESOLVED | Research confirmed: admob@8.0.0 requires @capacitor/core ^8.0.0 — Phase 2 plan uses Capacitor 8 |
| AudioContext suspended on Android — silent audio | CRITICAL | `await audioCtxRef.current.resume()` in gesture handlers; lazy-create on first user gesture |
| Keystore loss — can never update app | CRITICAL | Back up to 2 locations; enroll in Google Play App Signing |
| GDPR/UMP consent must precede `AdMob.initialize()` | CRITICAL | Strict order: consent → initialize → showBanner |
| Privacy policy URL missing — Play Store rejection | CRITICAL | Host on GitHub Pages before first submission |
| `targetSdkVersion` below 35 — rejected at upload | CRITICAL | Set `targetSdkVersion 35` in `build.gradle` |

---

## Session Continuity

**Last updated:** 2026-05-16
**Last action:** Planned Phase 4 — 9 plans (04-01 through 04-09) in 6 waves; verification passed (16/16 requirements, 13/13 decisions covered)
**Next action:** Execute Phase 4 — start with Wave 1 (04-01: .gitignore + keystore; 04-02: account prereqs + production banner ID)

---

## Phase History

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Web Fixes | Complete | 2026-05-15 |
| 2. Capacitor Android Baseline | Complete | 2026-05-15 |
| 3. AdMob Integration | Complete | 2026-05-15 |
| 4. Signing + Play Store Submission | Not started | - |
