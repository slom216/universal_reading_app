/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Offline support, like the other DeuLern apps: the app shell is precached. Each
    // language's texts chunk (1–2 MB, see manualChunks) is cached the first time that
    // language is opened instead, so a visitor does not download all fifteen up front;
    // every language they have read works offline. A new version waits until every tab
    // is closed; there is no "update ready" prompt.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      manifest: {
        name: 'DeuLern Polyglot',
        short_name: 'Polyglot',
        description: 'Graded reading texts and everyday phrases in fifteen languages.',
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
        globIgnores: ['**/texts-*.js'],
        runtimeCaching: [
          {
            // File names carry a content hash, so a cached chunk never goes stale;
            // the limit drops chunks left over from earlier deploys.
            urlPattern: /\/assets\/texts-[\w-]+\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'texts', expiration: { maxEntries: 30 } },
          },
        ],
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
