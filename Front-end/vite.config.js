import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'ELEVEN — Built Different',
        short_name: 'ELEVEN',
        description: 'ELEVEN sneaker & streetwear storefront.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0B0B0C',
        theme_color: '#0B0B0C',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // This is a client-side routed SPA (react-router BrowserRouter),
        // so unknown routes must fall back to index.html.
        navigateFallback: '/index.html',
        // Never let the SW intercept/cache calls to the separately-hosted
        // Django API on Render — those must always hit the network live.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Product images served from the Django /media/ folder — safe to
            // cache since they rarely change once uploaded. Must be listed
            // BEFORE the catch-all rule below (Workbox matches in order).
            urlPattern: ({ url }) =>
              url.origin === 'https://eleven-with-backend.onrender.com' &&
              url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'eleven-product-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Everything else on the API origin (products, cart, orders,
            // auth, etc.) must always hit the network live — never cached.
            urlPattern: ({ url }) => url.origin === 'https://eleven-with-backend.onrender.com',
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false, // flip to true only if you want to test SW in `npm run dev`
      },
    }),
  ],
})
