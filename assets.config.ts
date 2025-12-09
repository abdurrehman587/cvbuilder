import { defineConfig } from '@capacitor/assets';

const config = defineConfig({
  iconBackgroundColor: '#ffffff',
  iconBackgroundColorDark: '#667eea',
  splashBackgroundColor: '#ffffff',
  splashBackgroundColorDark: '#667eea',
  android: {
    icon: {
      source: './public/images/glory-logo.png',
      target: './android/app/src/main/res',
      padding: '20%', // Simple design needs less padding
    },
    splash: {
      source: './public/images/glory-logo.png',
      target: './android/app/src/main/res',
      width: 512,
      height: 512,
      padding: '20%', // Simple design needs less padding
    },
  },
});

export default config;

