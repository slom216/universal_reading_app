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
    // every language they have read works offline. A new version takes over as soon as it
    // installs (skipWaiting + clientsClaim), so returning visitors never stay on an old build.
    VitePWA({
      registerType: 'autoUpdate',
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
          {
            // Every route has its own prerendered HTML (scripts/prerender.mjs) with its own
            // title, canonical and description, so fetch it; the cached shell is only the
            // offline fallback. Files opened directly (sitemap.xml, robots.txt) are left alone.
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && !/\.\w+$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: { maxEntries: 50 },
              precacheFallback: { fallbackURL: 'index.html' },
            },
          },
        ],
        // vite-plugin-pwa defaults this to index.html, which would win over the route above.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
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
