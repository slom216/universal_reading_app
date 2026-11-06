/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Offline support, like the other DeuLern apps: everything is precached, including
    // every language's texts chunk (see manualChunks), so all texts work offline after
    // the first visit. A new version waits until every tab is closed; there is no
    // "update ready" prompt.
    // ponytail: no web manifest or 192/512 icons yet, so the app works offline but
    // browsers will not offer to install it. Add both when there is a real icon.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // A language's texts chunk is a few MB, over Workbox's 2 MB default.
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const lang = /content\/texts\/(\w+)\//.exec(id)?.[1];
          return lang ? `texts-${lang}` : undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
