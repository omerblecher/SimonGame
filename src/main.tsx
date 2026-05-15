import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

async function initializeAdMob(): Promise<void> {
  // UMP consent — may throw if no forms configured in AdMob console yet
  try {
    const consentInfo = await AdMob.requestConsentInfo();
    if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable === true) {
      await AdMob.showConsentForm();
    }
  } catch (consentErr) {
    const msg = consentErr instanceof Error ? consentErr.message : String(consentErr);
    console.warn('UMP consent check failed, proceeding without consent:', msg);
  }
  // Initialize regardless of consent outcome
  await AdMob.initialize({
    initializeForTesting: true, // Phase 3 only — set false in Phase 4
  });
}

const rootEl = document.getElementById('app') as HTMLElement;
const root = ReactDOM.createRoot(rootEl);

(async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await initializeAdMob();
      (window as { __admobReady?: boolean }).__admobReady = true;
    } catch (err) {
      // Graceful degradation: always render the game
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.warn('AdMob initialization failed, rendering without ads:', msg);
    }
  }
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
