---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Android Release
status: executing
last_updated: "2026-05-15"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 4
  completed_plans: 2
  percent: 25
---

# State — Simon Game Android Release

## Project Reference

**Core value:** A polished, playable Simon game that works flawlessly on Android devices — responsive pads that glow correctly, clear audio feedback, and a smooth Play Store experience.
**Current focus:** Phase 2 — Capacitor Android Baseline

---

## Current Position

**Milestone:** 1 — v1.0 Android Release
**Phase:** 2 — Capacitor Android Baseline — Ready to execute
**Plan:** 2 plans created (02-01, 02-02) — ready for execution
**Status:** Phase 2 planned; ready to execute

```
Progress: [==>--] 25% — Phase 1 of 4 complete; Phase 2 planned (0/2 plans done)
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 4 |
| Phases complete | 1 |
| Requirements total | 24 |
| Requirements complete | 5 |

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

### Active TODOs

- Before executing Phase 2 Plan 01: verify `java -version` is 17+ and `ANDROID_HOME` env var is set
- Phase 2 Plan 02 Task 3 requires manual emulator verification (human checkpoint)

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

**Last updated:** 2026-05-15
**Last action:** Phase 2 planned — 2 plans created covering CAP-01 through CAP-06; research confirmed Capacitor 8 required
**Next action:** Execute Phase 2 — run `/gsd:execute-phase 2` (verify java 17+ and ANDROID_HOME before starting)

---

## Phase History

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Web Fixes | Complete | 2026-05-15 |
| 2. Capacitor Android Baseline | Planned (ready to execute) | - |
| 3. AdMob Integration | Not started | - |
| 4. Signing + Play Store Submission | Not started | - |
