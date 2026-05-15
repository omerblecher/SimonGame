# Roadmap — Simon Game Android Release

## Milestone 1: v1.0 Android Release

### Phases

- [x] **Phase 1: Web Fixes** - Fix active pad glow bug and AudioContext suspend issue in browser before touching native tooling
- [ ] **Phase 2: Capacitor Android Baseline** - Package the game as a working Android app via Capacitor, fully playable on emulator or device
- [ ] **Phase 3: AdMob Integration** - Add Google AdMob banner ad with GDPR consent flow at the bottom of the screen
- [ ] **Phase 4: Signing + Play Store Submission** - Build a signed release AAB and submit to Google Play Store

---

## Phase Details

### Phase 1: Web Fixes
**Goal:** Fix the active pad glow bug and AudioContext Android issue in the existing React codebase — all changes verifiable in a desktop or mobile browser with no native tooling needed
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** UI-01, UI-02, AUDIO-01, TOUCH-01, VIEWPORT-01
**Success Criteria** (what must be TRUE):
1. During sequence playback the active pad glows at full brightness with its colored glow shadow visible; inactive pads remain at normal brightness (not dimmed)
2. Audio plays correctly on the first game start in mobile Chrome without any user gesture workaround
3. Pad buttons register taps with no 300ms delay on Android Chrome
4. The viewport does not zoom or shift when tapping pads on a mobile device
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — Unblock build: add "jsx": "react-jsx" to tsconfig.json, delete dead Vite scaffold files
- [x] 01-02-PLAN.md — Apply all five bug fixes: pad glow (UI-01/UI-02), audio await (AUDIO-01), touch-action (TOUCH-01), viewport tag (VIEWPORT-01)
**UI hint:** yes

### Phase 2: Capacitor Android Baseline
**Goal:** Package the game as a working Android app via Capacitor — game fully playable on an Android emulator or physical device, no ads yet
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06
**Success Criteria** (what must be TRUE):
1. The app installs on an Android emulator or device via ADB without errors
2. The game plays correctly end-to-end on device: sequence plays, pads respond, score increments, game over resets correctly
3. Audio (tones and buzzer) is audible on the Android device during gameplay
4. The build pipeline (`npm run build` → `npx cap sync android` → emulator run) completes without errors and is documented in a reproducible script or README section
**Plans:** TBD

### Phase 3: AdMob Integration
**Goal:** Add a Google AdMob banner ad at the bottom of the screen with a GDPR consent flow — game remains fully playable with the ad visible
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06, ADM-07, ADM-08
**Success Criteria** (what must be TRUE):
1. A test banner ad renders at the bottom of the screen on the Android device
2. Game pads and interactive elements are not obscured by the banner (minimum 50dp gap enforced)
3. A GDPR/UMP consent dialog appears on first app launch before any ad is shown
4. The banner disappears when the app is backgrounded and reappears when the app returns to the foreground
**Plans:** TBD
**UI hint:** yes

### Phase 4: Signing + Play Store Submission
**Goal:** Build a signed release AAB with production ad IDs and submit the app to Google Play Store
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** META-01, META-02, META-03, META-04, SIGN-01, SIGN-02, SIGN-03, SIGN-04, SIGN-05, STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, STORE-06
**Success Criteria** (what must be TRUE):
1. A signed release AAB builds cleanly via `gradlew bundleRelease` with no signing or compilation errors
2. The app passes the internal test track in Play Console (installs and runs correctly on a test device)
3. The store listing is complete with short description, long description, at least 2 screenshots, and a 1024x500 feature graphic
4. A privacy policy is hosted at a public HTTPS URL and linked in the Play Console listing
5. The app is submitted to Google Play and status shows "Under review" or better
**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Web Fixes | 2/2 | Complete | 2026-05-15 |
| 2. Capacitor Android Baseline | 0/? | Not started | - |
| 3. AdMob Integration | 0/? | Not started | - |
| 4. Signing + Play Store Submission | 0/? | Not started | - |
