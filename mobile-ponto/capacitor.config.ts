import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.ponto',
  appName: 'Ponto - Spa do Colchão',
  webDir: '../out',
  server: {
    url: 'https://spadocolchao.vercel.app',
    cleartext: true
  },
  appendUserAgent: 'CapacitorPonto'
};

export default config;
