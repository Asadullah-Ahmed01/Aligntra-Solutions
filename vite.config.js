import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  envPrefix: 'NEXT_PUBLIC_',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
      },
    },
  },
});
