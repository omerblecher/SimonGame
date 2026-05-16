# Phase 4: Signing + Play Store Submission - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 4-Signing + Play Store Submission
**Areas discussed:** App icon, Privacy policy, Production AdMob banner unit ID, Signing config approach

---

## App Icon

| Option | Description | Selected |
|--------|-------------|----------|
| No — generate a Simon-themed one | Plan includes a step to generate a 512×512 SVG/PNG with 4 colored quadrants matching the game | ✓ |
| Yes — I'll provide a PNG/SVG file | Plan assumes user drops an icon file at a known path | |

**User's choice:** Generate a Simon-themed icon

| Option | Description | Selected |
|--------|-------------|----------|
| 4 colored quadrants — classic Simon board | Green/Red/Yellow/Blue on dark background | ✓ |
| Single bold letter 'S' on dark background | Minimal text-based icon | |
| You decide | Claude picks best option | |

**User's choice:** 4 colored quadrants — classic Simon board

| Option | Description | Selected |
|--------|-------------|----------|
| Python script using Pillow | Generates 512×512, feature graphic, all mipmap densities | ✓ |
| Node.js script using Sharp/Canvas | Node-based image generation | |
| Manual — I'll generate the icon myself | Plan documents required sizes only | |

**User's choice:** Python Pillow
**Notes:** User clarified they need all Play Store required sizes — 512×512 icon, 1024×500 feature graphic, and all mipmap densities. Screenshots must be captured manually from the device.

---

## Privacy Policy

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Pages on this repo | `docs/privacy-policy.html` deployed to GitHub Pages | ✓ |
| I have an existing website | Host on user's own site | |
| Separate GitHub repository / Gist | Dedicated privacy policy repo or Gist | |

**User's choice:** GitHub Pages on this repo

| Option | Description | Selected |
|--------|-------------|----------|
| AdMob only | Policy covers AdMob data collection only | ✓ |
| AdMob + general app data statement | Broader policy stating app collects no personal data | |

**User's choice:** AdMob only

---

## Production AdMob Banner Unit ID

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — I have it ready | Production banner unit ID available at execution time | ✓ |
| No — I need to create one in AdMob | Plan includes step to create banner ad unit | |

**User's choice:** Yes — ID ready (will be provided during plan execution)
**Notes:** User confirmed they did not need to provide the ID during discussion — plan uses `YOUR_PRODUCTION_BANNER_UNIT_ID` placeholder.

| Option | Description | Selected |
|--------|-------------|----------|
| Build type — debug uses test ID, release uses production | Gradle resValue/buildConfigField per build variant | ✓ |
| Single constant — replace test ID directly in code | Simpler but requires discipline | |

**User's choice:** Build type switching — debug uses test ID, release uses production

---

## Signing Config Approach

| Option | Description | Selected |
|--------|-------------|----------|
| keystore.properties file | Gradle standard — reads file, not hardcoded; file in .gitignore | ✓ |
| OS environment variables | CI-friendly but more friction for local dev | |

**User's choice:** keystore.properties file

| Option | Description | Selected |
|--------|-------------|----------|
| Outside the project directory | `C:\Users\omerb\keystores\simon-release.jks` — no risk of accidental commit | ✓ |
| Inside the project, excluded via .gitignore | Convenient but relies on .gitignore being correct | |

**User's choice:** Outside the project directory (`C:\Users\omerb\keystores\simon-release.jks`)

| Option | Description | Selected |
|--------|-------------|----------|
| Local drive + cloud storage | Copy .jks to Google Drive / OneDrive private folder | ✓ |
| Local drive + encrypted email to self | Email .jks as encrypted attachment | |
| You decide | Claude picks a reasonable backup strategy | |

**User's choice:** Local drive + cloud storage

---

## Claude's Discretion

- Exact Gradle `resValue` vs. `buildConfigField` syntax for banner unit ID injection per build type
- Whether `initializeForTesting` uses a `BuildConfig` boolean or a separate `resValue`
- HTML structure and styling of the privacy policy page
- Adaptive icon XML (`ic_launcher.xml`) foreground vs. background layer setup

## Deferred Ideas

None — discussion stayed within phase scope.
