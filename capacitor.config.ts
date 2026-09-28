import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.hbq.mentalmath',
  appName: 'Mental Math',
  webDir: 'dist',
  android: {
    // Android 15 draws edge to edge; let Capacitor keep the web view clear of the status and navigation bars.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
