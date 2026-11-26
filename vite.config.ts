import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias pour les imports
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    // Augmenter la limite de taille des chunks pour FFmpeg.wasm
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Exclure FFmpeg.wasm du bundle
      external: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
    }
  },
  optimizeDeps: {
    // Exclure Babylon.js des dépendances optimisées
    exclude: [
      '@babylonjs/core',
      '@babylonjs/gui',
      '@babylonjs/loaders',
      '@babylonjs/serializers'
    ]
  }
});
