import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.vendedor',
  appName: 'Vendedor Colchão',
  webDir: '../out',
  server: {
    url: 'https://spadocolchao.vercel.app',
    cleartext: true
  },
  appendUserAgent: 'CapacitorVendedor'
};

export default config;
