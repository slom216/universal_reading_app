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
    // ponytail: the icons are Grammatik's "G", copied until Polyglot has its own.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      manifest: {
        name: 'DeuLern Polyglot',
        short_name: 'Polyglot',
        description: 'Graded reading texts and everyday phrases in eleven languages.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#e6ddcc',
        background_color: '#e6ddcc',
        lang: 'en',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
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
