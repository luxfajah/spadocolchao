import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.entregador',
  appName: 'Entregas - Spa do Colchão',
  webDir: '../out',
  server: {
    url: 'https://spadocolchao.vercel.app',
    cleartext: true
  },
  appendUserAgent: 'CapacitorEntregador'
};

export default config;
