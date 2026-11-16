import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative paths so the same build works at a domain root or under /repo-name/ on GitHub Pages.
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      // The app asks before switching to a new version, so a lesson in progress is never interrupted.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pontino',
        short_name: 'Pontino',
        description: 'A little bridge to Japanese and Italian.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBF8F1',
        theme_color: '#0C8388',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app itself is cached on first load: code, lessons, fonts and photos.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // Voice clips are many small files. Installing a new version must not wait for all of them,
        // so they are saved separately, in the background (see saveAudioOffline in src/lib/pwa.svelte.ts).
        runtimeCaching: [
          {
            urlPattern: /\/audio\/[a-z0-9]+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pontino-audio',
              // Audio players ask for byte ranges; this answers them from the saved whole file.
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              matchOptions: { ignoreSearch: true, ignoreVary: true },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC') },
  build: { target: 'es2022' },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
