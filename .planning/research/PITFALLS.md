# Pitfalls Research — Capacitor + AdMob + Play Store

**Project:** Simon Game — React 19 + TypeScript 5.9 + Tailwind v4 + Vite 7
**Researched:** 2026-05-15
**Confidence:** HIGH for Capacitor/Android and Play Store requirements (stable, mature); MEDIUM for AdMob timing (approval timelines vary)

---

## Capacitor / Android Pitfalls

### CRITICAL — Pitfall C1: Running `cap sync` Without a Fresh Web Build

**What goes wrong:**
`npx cap sync` copies whatever is currently in the `dist/` folder into the Android `assets/` directory. If you run `cap sync` without first running `npm run build`, the WebView loads stale JS/CSS from a previous build — or nothing at all if `dist/` does not exist. Symptoms are invisible during `cap sync`; the error only shows at runtime on device.

**Why it happens:**
Capacitor does not know whether your web build is current. It blindly copies `dist/` (or whatever `webDir` is set to in `capacitor.config.ts`). Developers often run `cap sync` after changing native code and forget the web assets are also stale.

**Consequences:**
- App opens to a blank white screen on device
- App opens to an old version of the UI (cached from previous build)
- Audio context or game logic from old build runs against new native plugins, causing silent failures

**Prevention:**
Always use a compound command. Set up an npm script:
```json
"android": "npm run build && npx cap sync android && npx cap open android"
```
Never run `npx cap sync` standalone during development iteration.

**Detection warning signs:**
- UI on device doesn't reflect code changes you just made
- Blank white screen in Android emulator immediately after launch
- Android Studio logcat shows `ERR_FILE_NOT_FOUND` for `index.html`

**Phase affected:** Capacitor setup phase; persists as a workflow risk throughout all phases.

---

### CRITICAL — Pitfall C2: Java / Gradle Version Conflicts

**What goes wrong:**
Capacitor 6+ requires Java 17 and Gradle 8.x. If the developer machine has Java 11 (the previous LTS commonly installed for older Android projects), the Gradle build fails with cryptic errors like `Unsupported class file major version 61` or `Could not resolve com.android.tools.build:gradle`.

**Why it happens:**
Android Studio bundles its own JDK (currently JDK 17/21), but command-line `gradle` invocations use the system `JAVA_HOME`. These are different paths on most machines. Capacitor scaffolds a `gradle/wrapper/gradle-wrapper.properties` that pins a specific Gradle version; if the system JDK is older, the version matrix breaks.

**Consequences:**
- Gradle sync fails in Android Studio with no useful error shown in the IDE (must check Build output tab)
- `npx cap build android` fails with exit code 1
- The error message points to Gradle, not Java, so developers chase the wrong problem

**Prevention:**
1. Install Java 17+ from Adoptium (Temurin) and set `JAVA_HOME` to that path
2. In Android Studio: File → Project Structure → SDK Location → set JDK to the bundled Android Studio JDK (usually `C:\Program Files\Android\Android Studio\jbr` on Windows)
3. Verify with: `java -version` (system) vs Android Studio terminal

**Capacitor 6 requirements (HIGH confidence — from Capacitor docs):**
- Java 17+
- Android Gradle Plugin (AGP) 8.x
- Gradle 8.2+
- `compileSdkVersion` 34+
- `minSdkVersion` 23+

**Detection warning signs:**
- `Unsupported class file major version` in Gradle output
- `Minimum supported Gradle version is X.X` error
- Android Studio shows "Gradle JDK" as a red configuration warning

**Phase affected:** Initial Capacitor/Android setup (blocker if unresolved).

---

### CRITICAL — Pitfall C3: Web Audio API — AudioContext Suspended on Android

**What goes wrong:**
Android WebView (and all modern browsers) enforce the Autoplay Policy: an `AudioContext` created before a user gesture starts in `suspended` state. Calling `oscillator.start()` on a suspended context is a no-op — no error is thrown, but no sound plays. This is already partially documented in the project's CONCERNS.md but becomes more severe in Capacitor's WebView than in a desktop browser.

**Why it is worse in Capacitor than in browser:**
The Capacitor WebView is stricter about what constitutes a "user gesture." A `touchstart` event on a pad does qualify, but only if the `AudioContext` is resumed synchronously within the same event handler call stack. Any `async/await` or `setTimeout` hop between the touch event and `audioCtx.resume()` breaks the gesture-link, and the resume is silently ignored on some Android WebView versions.

**Current code risk (from `src/App.tsx` lines 87-89):**
The existing code calls `audioCtxRef.current.resume()` but does not await it and does not handle errors. In a browser this works because the context is usually already running; in Android WebView, the context starts suspended every time and `resume()` returns a Promise that must be awaited.

**Consequences:**
- Game starts but all pads play silently
- Error buzzer and celebration melody are silent
- No UI indication of failure — game appears broken with no explanation

**Prevention:**
```typescript
// In handlePadClick and handleStart — both must be direct event handlers
const handlePadClick = async (color: ColorId) => {
  if (audioCtxRef.current) {
    await audioCtxRef.current.resume(); // must await, must be in gesture handler
  }
  // then proceed to play tone
};
```

Also create the `AudioContext` lazily on first user gesture, not at component mount:
```typescript
if (!audioCtxRef.current) {
  audioCtxRef.current = new AudioContext();
}
await audioCtxRef.current.resume();
```

**Detection warning signs:**
- Sound works in browser dev mode but is silent on Android device
- `audioCtxRef.current.state === 'suspended'` is true after user interaction
- Android WebView console shows `AudioContext was not allowed to start`

**Phase affected:** Android packaging phase (must fix before functional testing on device); also relevant for the UI bug fix phase since the current `App.tsx` has this pattern.

---

### MODERATE — Pitfall C4: Touch/Click Events — 300ms Tap Delay

**What goes wrong:**
Older Android WebView versions (before Chrome 32) added a 300ms delay between `touchend` and the synthesized `click` event to allow for double-tap zoom detection. Capacitor apps use the system WebView, which on Android 7-8 devices may still exhibit this delay. For a Simon game where timing precision matters (the player's pad press must register immediately), this 300ms delay makes the game feel sluggish and unresponsive.

**Why it happens:**
The delay only fires if the viewport meta tag does not explicitly disable scaling:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```
Without `user-scalable=no` or `touch-action: manipulation` on interactive elements, the browser waits to see if the tap is a double-tap.

**Current code risk:**
`index.html` has `<meta name="viewport" content="width=device-width, initial-scale=1.0">` without `user-scalable=no`. The CSS also does not set `touch-action` on pad buttons.

**Consequences:**
- Pad presses feel delayed by ~300ms on older Android WebViews
- Affects game playback feel significantly (pads light up late relative to touch)
- Cannot be fixed after the fact by adjusting game timing constants

**Prevention:**
1. Update viewport meta: add `user-scalable=no` (or `maximum-scale=1`)
2. Add to CSS on all interactive buttons: `touch-action: manipulation`
3. Use `touchstart`/`touchend` event handlers directly instead of relying on synthesized `click`

**Detection warning signs:**
- Pad presses feel "laggy" but audio plays promptly
- Delay only noticeable on device, not in browser simulation
- More noticeable on cheaper/older Android devices

**Phase affected:** Android packaging phase (discovered on first device test).

---

### MODERATE — Pitfall C5: Viewport and Safe Area Issues (Notch, Navigation Bar)

**What goes wrong:**
Android devices with notches, punch-hole cameras, curved displays, and gesture navigation bars cut into the usable screen area. Capacitor apps run in a full-screen WebView, and without safe area handling, the game's UI elements can be hidden behind system chrome or physically overlapped by the navigation bar.

For this Simon game, the AdMob banner at the bottom is at highest risk — it can be covered by the Android gesture navigation bar, making it invisible (and potentially violating AdMob placement policy since hidden ads are against ToS).

**Why it happens:**
CSS `padding: env(safe-area-inset-bottom)` is not applied by default. The Capacitor WebView reports `window.innerHeight` as the full screen height including the area behind the system navigation bar, so the layout appears correct in code but is physically obscured.

**Consequences:**
- Bottom AdMob banner is partially or fully hidden by navigation bar
- Game pads near screen edges are unresponsive (tap lands outside WebView)
- UI looks broken on newer Android devices with gesture navigation

**Prevention:**
In `capacitor.config.ts`:
```typescript
server: {
  androidScheme: 'https'
},
android: {
  captureInput: true
}
```

In CSS (add to `src/style.css`):
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

In `index.html`, add `viewport-fit=cover` to the viewport meta:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

**Detection warning signs:**
- Bottom of UI is cut off on full-screen Android devices
- Testing on emulator with nav bar enabled shows overlap
- AdMob banner appears at bottom but is partially obscured

**Phase affected:** AdMob integration phase (banner placement); Android layout polish phase.

---

### MODERATE — Pitfall C6: CORS and Mixed-Content in Capacitor WebView

**What goes wrong:**
Capacitor Android apps serve web assets from `https://localhost` (or `capacitor://localhost` on older versions). Requests from this origin to any external URL must have CORS headers. More importantly, if the app ever tries to load any resource over plain `http://`, Android blocks it as mixed content — the entire request is silently dropped.

**Why it happens:**
Capacitor sets `androidScheme: 'https'` by default in v5/v6. This is correct for security, but means any hardcoded `http://` URLs in the app (CDN resources, API calls, image sources) are blocked without error.

For this specific Simon game: the game uses only Web Audio API (no external network calls), so CORS is not currently a concern. However, if AdMob's SDK ever tries to load ads over HTTP, those will be blocked. AdMob loads ads via its own WebView layer, not the main WebView, so this is generally handled internally.

**Current risk level:** LOW for this specific app (no external API calls, audio is synthesized). Monitor if CDN fonts or analytics are added later.

**Prevention:**
- Never use `http://` URLs in app code — always `https://`
- Add to `AndroidManifest.xml` if needed: `android:usesCleartextTraffic="false"` (already default false in API 28+)
- If an external API is added: ensure the server sends `Access-Control-Allow-Origin: *` or the specific Capacitor origin

**Detection warning signs:**
- Network requests fail silently on device but work in browser
- Android logcat shows `net::ERR_CLEARTEXT_NOT_PERMITTED`
- Resources load in Chrome DevTools but 404 in Android WebView

**Phase affected:** Not a current blocker, but relevant if external APIs are added.

---

## AdMob Pitfalls

### CRITICAL — Pitfall A1: AdMob Not Initialized Before Banner Display

**What goes wrong:**
The `@capacitor-community/admob` plugin (the standard Capacitor AdMob plugin) requires `AdMob.initialize()` to complete before any `AdMob.showBanner()` call. If `showBanner()` is called before initialization resolves, the call is silently ignored on Android — no error, no ad, no visible feedback. This is the most common AdMob integration bug.

**Why it happens:**
`AdMob.initialize()` is async and takes 200-800ms to complete because it contacts Google's ad servers. Developers call `initialize()` at app start and `showBanner()` immediately after without awaiting — or place them in separate React lifecycle effects that don't coordinate.

**Consequences:**
- No banner appears at the bottom of the screen
- No error thrown or logged
- Works intermittently (passes sometimes when network is fast, fails when slow)
- Impossible to reproduce in test environment since ad loading varies

**Prevention:**
Always await initialization before showing a banner:
```typescript
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// In your app initialization (e.g., useEffect on mount):
const initAdMob = async () => {
  await AdMob.initialize({
    testingDevices: ['EMULATOR'],
    initializeForTesting: true, // remove for production
  });

  const options: BannerAdOptions = {
    adId: 'ca-app-pub-3940256099942544/6300978111', // test ID
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true, // remove for production
  };

  await AdMob.showBanner(options);
};

useEffect(() => {
  initAdMob();
}, []);
```

**Detection warning signs:**
- `AdMob.showBanner()` returns no error but no banner appears
- Android logcat shows "AdMob SDK not initialized" warning
- Banner appears sometimes but not consistently across app restarts

**Phase affected:** AdMob integration phase (first integration attempt).

---

### CRITICAL — Pitfall A2: Test Ad IDs vs Production Ad IDs

**What goes wrong:**
Google provides specific test ad unit IDs that always return a test ad (a green banner reading "Test Ad"). If you submit an app to the Play Store with test IDs, no real ads serve, and you earn zero revenue. Conversely, if you use production IDs during development and testing, you risk violating AdMob policy — clicking your own ads, even accidentally, can result in account suspension.

**Test banner ID (Android):** `ca-app-pub-3940256099942544/6300978111`
**Real IDs:** Found in AdMob console under Apps → Ad Units

**Why it happens:**
Developers hardcode the test ID during development (correct) but forget to replace it before release. Or they copy the App ID instead of the Ad Unit ID (these are different things).

There are two separate IDs to configure:
1. **App ID** — goes in `AndroidManifest.xml` as `com.google.android.gms.ads.APPLICATION_ID` meta-data
2. **Ad Unit ID** — goes in the `AdMob.showBanner()` call

**Consequences:**
- Using test IDs in production: app ships, no revenue, no crash, but zero ad income
- Using real IDs in development: risk of invalid traffic detection, potential AdMob account policy violation
- Using App ID where Ad Unit ID is expected: AdMob SDK crashes at runtime with a clear error, but the error message is easy to misread

**Prevention:**
Use environment variables or a build-time constant to switch IDs:
```typescript
// constants.ts
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const ADMOB_APP_ID = IS_PRODUCTION
  ? 'ca-app-pub-REAL_APP_ID~REAL_APP_ID'
  : 'ca-app-pub-3940256099942544~3347511713'; // test app ID

export const ADMOB_BANNER_ID = IS_PRODUCTION
  ? 'ca-app-pub-REAL_ACCOUNT~REAL_UNIT_ID'
  : 'ca-app-pub-3940256099942544/6300978111'; // test banner ID
```

Also set `isTesting: true` in `AdMob.initialize()` during development — this enables test mode even with real IDs.

**Detection warning signs:**
- Banner shows "Test Ad" label after production release
- No impressions or revenue in AdMob console after app is live
- AdMob console shows impressions but all from test devices

**Phase affected:** AdMob integration phase (setup); Play Store submission phase (final checklist).

---

### CRITICAL — Pitfall A3: AdMob Policy — Ad Placement Near Game Controls

**What goes wrong:**
Google AdMob policy (and Play Store policy) explicitly prohibits ads that are "accidentally clicked due to proximity to interactive content." Placing a banner ad directly adjacent to game control buttons — especially in a fast-reaction game like Simon — violates this policy and can result in ad serving being disabled for the app or AdMob account suspension.

**Specific risk for this app:**
The Simon game pads are the main UI element. If the AdMob banner is placed at the bottom of the screen and game pads extend to the bottom, players reaching for the bottom pads may accidentally click the banner. This is exactly the scenario AdMob prohibits.

**AdMob policy quote (paraphrased from current policy):**
"Ads must not be placed in a way that could result in accidental clicks. Ads may not be placed near interactive elements where users are likely to click."

**Consequences:**
- AdMob sends a warning email, then disables ad serving on the specific app unit
- Repeated violations result in AdMob account suspension
- Appeal process takes 2-4 weeks and is not guaranteed to succeed

**Prevention:**
1. Add a minimum 50dp (density-independent pixels) gap between the banner ad and the nearest interactive game element
2. In the Simon game layout: add visible padding/separator between the game pad grid and the banner area
3. Test on small-screen devices (4.7") where the gap is naturally smaller
4. Use `BannerAdPosition.BOTTOM_CENTER` with `margin` set to account for safe area

**Layout recommendation:**
```
[Game pads area]       ← interactive
[16-24px gap]          ← minimum separator
[Score / status text]  ← non-interactive buffer
[AdMob Banner]         ← bottom of screen
```

**Detection warning signs:**
- Email from AdMob with subject "Earnings at risk" or "Policy violation warning"
- Banner ads stop showing after initial display on a new device
- Play Store review rejected with "ad placement" cited

**Phase affected:** UI design phase (layout); AdMob integration phase (placement implementation).

---

### MODERATE — Pitfall A4: AdMob Approval Timing and First-Show Delay

**What goes wrong:**
After submitting an app to the Play Store, AdMob does not immediately serve real ads. There are two separate approval gates:

1. **Play Store review:** 3-7 days for new apps (can be faster for updates)
2. **AdMob app review:** After Play Store approval, AdMob itself reviews the app. This takes an additional 1-5 business days. Until both are approved, the `showBanner()` call returns no ad (blank banner area or nothing) — not a crash, just silence.

**Why it matters:**
Developers often submit the app, see no ads, assume the integration is broken, and attempt to re-integrate or change IDs. This creates a cycle of resubmissions that extends the delay further.

**Also:** AdMob requires the app to be **published and live** on the Play Store (not just in internal testing track) for the AdMob app review to proceed. Ads will not serve on the internal testing or closed testing tracks with unreviewed apps.

**Consequences:**
- 1-2 week period after first Play Store submission with no ad revenue
- Developers waste time debugging a working integration
- Re-submitting with changed ad unit IDs resets the AdMob review clock

**Prevention:**
1. After Play Store submission, do NOT change AdMob integration — wait for the review period
2. Use test ads (`isTesting: true`) to verify integration is correct before submission
3. Monitor AdMob console: once the app is reviewed, status changes to "Ready" under Apps
4. Set expectation: zero revenue for the first 1-2 weeks after launch is normal

**Detection warning signs:**
- App is live on Play Store, integration looks correct, but no impressions in AdMob dashboard
- AdMob console shows app status as "Pending review" or "Not verified"
- Test ads (`isTesting: true`) show correctly, but production ads do not

**Phase affected:** Play Store submission phase (post-submission period).

---

## Play Store Submission Pitfalls

### CRITICAL — Pitfall P1: Target API Level Requirement (2025)

**What goes wrong:**
Google Play enforces a minimum target API level for all app submissions. As of 2025, new apps must target **API level 35 (Android 15)**. Apps submitted with `targetSdkVersion` below this requirement are rejected at upload time — not during review, but immediately when uploading the AAB.

**Current Capacitor defaults:**
Capacitor 6 scaffolds `targetSdkVersion = 34` by default (Android 14). This was valid in 2024 but may be insufficient for new submissions in mid-2025 onward.

**Exact 2025 requirements (HIGH confidence — this is a published Google policy):**
- New apps submitted from August 2025 onward: must target API 35
- App updates: must target API 34 minimum until they adopt 35 requirement deadline
- `minSdkVersion`: Capacitor 6 minimum is 23 (Android 6.0) — this is acceptable

**In `android/app/build.gradle` (after Capacitor scaffolding):**
```gradle
android {
    compileSdkVersion 35      // must be >= targetSdkVersion
    defaultConfig {
        targetSdkVersion 35   // must meet Google's minimum
        minSdkVersion 23      // Capacitor 6 minimum, acceptable
    }
}
```

**Consequences:**
- AAB upload rejected with: "Your app currently targets API level X and must target at least API level Y"
- Error appears at upload, not during review — fast to discover but embarrassing right before launch
- Changing this after signing may require re-signing

**Prevention:**
1. Set `targetSdkVersion 35` and `compileSdkVersion 35` before the first build
2. Download Android SDK Platform 35 in Android Studio SDK Manager
3. Verify: check `android/app/build.gradle` before every release build

**Detection warning signs:**
- Play Console upload screen shows red error badge immediately after AAB upload
- Error message explicitly states the API level requirement

**Phase affected:** Play Store submission phase (release build preparation).

---

### CRITICAL — Pitfall P2: AAB Required — APK Not Accepted for New Apps

**What goes wrong:**
Since August 2021, Google Play requires all new apps to be published as **Android App Bundle (AAB)** format, not APK. Attempting to upload a `.apk` file to Play Console for a new app listing results in an immediate rejection error.

**Capacitor command:**
```bash
# Wrong (produces APK):
npx cap build android

# Correct (produces AAB):
npx cap build android --prod
# Or in Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle
```

**Note:** APK files are still valid for sideloading and testing on specific devices, but cannot be uploaded to Play Console for new apps.

**AAB signing:**
The AAB must be signed with a release keystore. A debug keystore (the default) is rejected by Play Console. The signing process:
1. Generate a keystore once: `keytool -genkey -v -keystore release.keystore ...`
2. Store keystore passwords securely — if lost, you cannot update the app
3. Configure signing in `android/app/build.gradle`

**Google Play App Signing:**
Consider enrolling in Google Play App Signing (recommended) — Google manages the final signing key and you upload a "upload key." This protects against keystore loss.

**Consequences:**
- APK uploaded to Play Console → immediate rejection, clear error message
- Unsigned AAB → rejected at upload
- Lost keystore → cannot publish updates to existing app listing (must create new listing)

**Prevention:**
1. Generate release keystore before first submission — store it in a secure location with passwords backed up
2. Use `Build → Generate Signed Bundle (AAB)` in Android Studio, not the APK option
3. Enable Google Play App Signing during the first submission wizard — this is easier before first publish

**Detection warning signs:**
- Play Console upload shows "APK not accepted for new apps" error
- AAB upload shows "certificate not found" → unsigned build

**Phase affected:** Play Store submission phase (release build and upload).

---

### CRITICAL — Pitfall P3: Content Rating and Age Declaration

**What goes wrong:**
Play Console requires every app to complete a **Content Rating Questionnaire** (via IARC) before the app can be published. If you skip this, the app is published without a rating and may be restricted in visibility or removed. For a game app, the questionnaire is mandatory.

**What the questionnaire covers for a simple game:**
- Violence (no)
- Sexuality (no)
- Language (no)
- Gambling (no — Simon is not gambling)
- User-generated content (no)
- Ads shown to users (yes — AdMob)

**The ads disclosure question is critical:**
You MUST declare that the app shows ads. Failure to declare this when AdMob is integrated is a policy violation that can result in removal.

**Age rating outcome for Simon:**
A clean game like Simon will receive "Everyone" (E) or "3+" rating across all rating systems (ESRB, PEGI, USK, etc.). This is the best outcome for discoverability.

**Consequences:**
- Skipping questionnaire → app cannot be published
- Lying about ads → policy violation, potential removal after publish
- Wrong age rating (too restrictive) → app hidden from younger demographics and family search categories

**Prevention:**
1. Complete the IARC questionnaire during the Play Console setup flow — it takes 5 minutes
2. Answer "yes" to the ads question
3. Record your answers — if you update the app later, you may need to re-certify

**Phase affected:** Play Store submission phase (metadata/listing setup).

---

### CRITICAL — Pitfall P4: Privacy Policy Requirement

**What goes wrong:**
Any app that collects or shares user data — and **any app that serves ads** — is required to have a publicly accessible privacy policy URL in the Play Console listing. AdMob by definition collects user data (device identifiers, ad interaction data). Without a privacy policy URL, the app will be rejected during review.

**Why developers miss this:**
The privacy policy field in Play Console appears to be optional during form fill-out (it accepts blank), but it is enforced during the review phase — not at upload. So the error appears 3-7 days after submission.

**Requirements:**
1. A live URL (not localhost, not a Google Doc requiring login) pointing to a privacy policy document
2. The privacy policy must mention: what data is collected, how it is used, third-party sharing (AdMob / Google)
3. The URL must be https

**For this app specifically:**
Since the game itself stores nothing (no account, no server), the policy only needs to cover AdMob data collection. A minimal policy generator (e.g., privacypolicygenerator.info or app-privacy-policy-generator) is sufficient.

**Consequences:**
- App rejected during review with "Privacy Policy required" reason
- 3-7 day delay to add policy and resubmit
- Rejection does not reset the review queue position (resubmit goes to front), but still causes launch delay

**Prevention:**
1. Generate privacy policy before first submission
2. Host it on GitHub Pages (free, https, reliable) or any static host
3. Add the URL to Play Console: Store Presence → Store Listing → Privacy Policy
4. Also add the URL inside the app (link in About/Settings section) — this is a Play Store best practice

**Detection warning signs:**
- Review rejection email with "Data safety" or "Privacy policy" cited
- Play Console shows "App content" section with incomplete status

**Phase affected:** Play Store submission phase (metadata setup, before first submission).

---

### MODERATE — Pitfall P5: Data Safety Declaration

**What goes wrong:**
In addition to a privacy policy, Play Console requires completing the **Data Safety** form (separate from the IARC content rating). This form asks you to declare exactly what data the app collects and shares. Since the app uses AdMob, you must declare that device identifiers and ad interaction data are collected and shared with Google.

**Why it catches developers:**
The Data Safety section has questions that map to specific AdMob data types. If you don't declare AdMob's data collection, Google may flag a discrepancy (they can detect AdMob SDK presence in the AAB) and reject the app or add a warning to the listing.

**What to declare for an AdMob-enabled app:**
- Device or other identifiers → Collected, shared with Google (advertising purpose)
- Personal information → Not collected (no account)
- App activity → Collected (ad interactions), shared with Google

**Consequences:**
- Incomplete form → app blocked from publishing
- Mismatched declaration vs SDK capabilities → app flagged in post-publish audit, potential removal

**Prevention:**
1. Complete Data Safety form during Play Console setup, before first submission
2. Use Google's AdMob data safety guidance document to fill in the form correctly
3. Select "Data is used for advertising or marketing" for any ad-related data types

**Phase affected:** Play Store submission phase (metadata setup).

---

### MODERATE — Pitfall P6: Required Store Listing Assets

**What goes wrong:**
Play Console will not allow you to submit the app for review until all required listing assets are provided. Missing any one item blocks submission — the Submit button is grayed out. Developers often discover this at the last moment and have to scramble for screenshots.

**Mandatory assets (as of 2025):**
| Asset | Requirement |
|-------|-------------|
| App icon | 512x512 PNG, ≤1MB, no alpha, no rounded corners (Play adds rounding) |
| Feature graphic | 1024x500 PNG or JPG (required for all apps) |
| Screenshots | Minimum 2 phone screenshots, recommended 4-8 |
| Short description | Max 80 characters |
| Full description | Max 4000 characters |
| App category | Must select a category (Games → Puzzle, for Simon) |
| Contact email | Valid email address |
| Privacy policy URL | https URL (see Pitfall P4) |

**Screenshot requirements:**
- Phone screenshots: 16:9 or 9:16 aspect ratio, minimum 320px per side, maximum 3840px per side
- Must show actual app content (not marketing art, not stock photos)
- Cannot show devices frames unless they are actual device hardware (no photoshop frames)

**Consequences:**
- Missing any item → Submit for Review button disabled, no clear error message (form just shows red indicators)
- Wrong icon format (alpha channel present) → rejected at upload
- Screenshots that don't show actual gameplay → rejected during review

**Prevention:**
1. Use Android emulator screenshots for initial submission (acceptable)
2. Generate feature graphic with a simple tool (Canva, Figma, or Play Store's built-in graphic builder)
3. Check Play Console's "Store Listing" completion indicator — must show 100% before submission attempt
4. Test icon: ensure it is exactly 512x512 and has no transparency

**Phase affected:** Play Store submission phase (store listing setup, 1-2 days before first submission).

---

### MINOR — Pitfall P7: App Signing Keystore Loss

**What goes wrong:**
If you lose the release keystore file or its password, you permanently lose the ability to publish updates to that app listing. Play Store matches the app signature on each upload — a different key means a different app. There is no recovery path (unless you enrolled in Google Play App Signing before first publish).

**Why it happens:**
The keystore is generated once and lives as a local file. Developers generate it, put it somewhere on their machine, and forget about it until 6 months later when they need to publish an update.

**Consequences:**
- Cannot publish any updates to the existing Play Store listing
- Must create a new listing (new app ID, lose all ratings and downloads)
- All users of old version cannot receive automatic updates

**Prevention:**
1. Immediately after generating the keystore: back it up to at least two locations (password manager, cloud storage encrypted)
2. Store the keystore alias name and both passwords (keystore password + key password) in a password manager
3. Enroll in Google Play App Signing during first submission — this is the best protection

**Phase affected:** Release build phase (keystore generation, before first submission).

---

## Phase-Specific Warnings Summary

| Phase | Top Pitfall | Mitigation |
|-------|-------------|------------|
| UI bug fix (App.tsx) | AudioContext suspended on Android — fix `resume()` await now, not later | Add `await audioCtxRef.current.resume()` in gesture handlers |
| Capacitor setup | Java/Gradle version mismatch blocks Android Studio sync | Verify Java 17+ at JAVA_HOME before running `cap add android` |
| Capacitor setup | `cap sync` without fresh build deploys stale assets | Script `npm run build && npx cap sync` as single command |
| Android layout | Touch 300ms delay + safe area gaps | Add `touch-action: manipulation`, viewport-fit=cover, safe area CSS |
| AdMob integration | Not awaiting `AdMob.initialize()` before `showBanner()` | Always `await initialize()` then `await showBanner()` in sequence |
| AdMob integration | Banner too close to game pads (policy violation) | 50dp minimum gap between banner and interactive elements |
| Release build | APK instead of AAB submitted to Play Console | Use "Generate Signed Bundle" → AAB in Android Studio |
| Release build | `targetSdkVersion` below Google's 2025 minimum (35) | Set `targetSdkVersion 35` in `android/app/build.gradle` before build |
| Store listing | Privacy policy URL missing | Host policy page before first submission attempt |
| Store listing | Data Safety form incomplete (AdMob not declared) | Complete form with Google's AdMob data safety guidance |
| Post-submission | Test ad IDs left in production build | Audit ad ID constants before release build |
| Post-launch | No ads showing for 1-2 weeks | Wait for AdMob app review; do not change integration |

---

*Confidence note: Capacitor pitfalls C1-C3 are HIGH confidence (well-documented in Capacitor official docs and widely reported). Play Store API level (P1), AAB requirement (P2), and privacy policy (P4) are HIGH confidence (published Google policy). AdMob approval timing (A4) is MEDIUM confidence (timing varies). All pitfalls reflect the ecosystem state as of May 2026.*
