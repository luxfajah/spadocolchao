import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.erp',
  appName: 'Vendas - SPA',
  webDir: 'public',
  server: {
    url: 'https://spadocolchao.vercel.app/app-vendedor/pdv',
    cleartext: true
  }
};

export default config;
