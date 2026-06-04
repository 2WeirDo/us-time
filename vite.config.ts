import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/us-time/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large vendor libraries into separate cacheable chunks
          'framer-motion': ['framer-motion'],
          leaflet: ['leaflet'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'UsTime - 我们的时光',
        short_name: 'UsTime',
        description: '属于两个人的私密空间，记录在一起的每一天',
        theme_color: '#E85D75',
        background_color: '#FFF5F7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/us-time/',
        scope: '/us-time/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
