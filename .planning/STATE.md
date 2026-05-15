---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Android Release
status: Ready to begin
last_updated: "2026-05-15T09:01:36.654Z"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State — Simon Game Android Release

## Project Reference

**Core value:** A polished, playable Simon game that works flawlessly on Android devices — responsive pads that glow correctly, clear audio feedback, and a smooth Play Store experience.
**Current focus:** Phase 1 — Web Fixes

---

## Current Position

**Milestone:** 1 — v1.0 Android Release
**Phase:** 1 — Web Fixes
**Plan:** Not started
**Status:** Ready to begin

```
Progress: [----] 0% — Phase 1 of 4
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 4 |
| Phases complete | 0 |
| Requirements total | 24 |
| Requirements complete | 0 |

---

## Accumulated Context

### Decisions Logged

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Capacitor over React Native | Preserves existing React codebase, no rewrite needed | Pre-planning |
| Banner ads only | Least intrusive to gameplay; interstitials break immersion | Pre-planning |
| Active pad stays bright, others stay normal | User's explicit preference — no dimming of inactive pads | Pre-planning |

### Active TODOs

- Before starting Phase 2: run `npm show @capacitor-community/admob peerDependencies` to confirm Capacitor version (6 or 7) before installing any packages
- Before starting Phase 2: verify `java -version` is 17+

### Known Blockers

None at start.

### Key Risks (from research)

| Risk | Severity | Mitigation |
|------|----------|------------|
| AdMob plugin not compatible with Capacitor 7 | CRITICAL | Run `npm show @capacitor-community/admob peerDependencies` before Phase 2 install |
| AudioContext suspended on Android — silent audio | CRITICAL | `await audioCtxRef.current.resume()` in gesture handlers; lazy-create on first user gesture |
| Keystore loss — can never update app | CRITICAL | Back up to 2 locations; enroll in Google Play App Signing |
| GDPR/UMP consent must precede `AdMob.initialize()` | CRITICAL | Strict order: consent → initialize → showBanner |
| Privacy policy URL missing — Play Store rejection | CRITICAL | Host on GitHub Pages before first submission |
| `targetSdkVersion` below 35 — rejected at upload | CRITICAL | Set `targetSdkVersion 35` in `build.gradle` |

---

## Session Continuity

**Last updated:** 2026-05-15
**Last action:** Roadmap created, STATE.md initialized
**Next action:** Begin Phase 1 — run `/gsd:plan-phase 1`

---

## Phase History

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Web Fixes | Not started | - |
| 2. Capacitor Android Baseline | Not started | - |
| 3. AdMob Integration | Not started | - |
| 4. Signing + Play Store Submission | Not started | - |
