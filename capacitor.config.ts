import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otis.brooke.simon.game',
  appName: 'Simon Memory Game',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      hidden: true,
    },
  },
};

export default config;
