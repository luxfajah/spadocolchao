import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.entregador',
  appName: 'Entregador Colchão',
  webDir: '../out',
  server: {
    url: 'https://spadocolchao.vercel.app',
    cleartext: true
  },
  appendUserAgent: 'CapacitorEntregador'
};

export default config;
