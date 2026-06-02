import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.erp',
  appName: 'Spa do Colchao',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    url: 'https://spadocolchao.vercel.app/app-vendedor/pdv',
    cleartext: true
  }
};

export default config;
