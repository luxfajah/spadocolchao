import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spadocolchao.entregador',
  appName: 'Entregador - SPA',
  webDir: 'public', // In a real Next.js export, this might be 'out'
  server: {
    url: 'https://spadocolchao.vercel.app/app-entregador', // The URL to the entregador section
    cleartext: true
  },
  appendUserAgent: 'SpaDoColchaoEntregadorApp/1.0',
  plugins: {
    Camera: {
      promptLabelPhoto: 'Tirar Foto',
      promptLabelPicture: 'Tirar Foto',
      promptLabelHeader: 'Anexar Comprovante',
      promptLabelCancel: 'Cancelar'
    }
  }
};

export default config;
