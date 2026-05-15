import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

async function initializeAdMob(): Promise<void> {
  // UMP consent — auto-detects EEA/UK; non-EEA returns immediately
  const consentInfo = await AdMob.requestConsentInfo();
  if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable === true) {
    await AdMob.showConsentForm();
  }
  // Initialize after consent resolves
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
    } catch (err) {
      // Graceful degradation: always render the game
      console.warn('AdMob initialization failed, rendering without ads:', err);
    }
  }
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
