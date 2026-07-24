import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: true,
        },
        includeAssets: ['favicon.ico', 'favicon.png', 'Logo.png', 'Logo-white.png', 'icons/**/*'],
        manifest: {
          id: '/',
          start_url: '/',
          scope: '/',
          name: 'Genda - Gestão & Agendamentos',
          short_name: 'Genda',
          description: 'Um sistema completo de agendamentos e controle de negócios desenvolvido para profissionais independentes.',
          version: '0.9.5',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          categories: ['business', 'productivity', 'utilities'],
          icons: [
            {
              src: 'icons/android/launchericon-48x48.png',
              sizes: '48x48',
              type: 'image/png'
            },
            {
              src: 'icons/android/launchericon-72x72.png',
              sizes: '72x72',
              type: 'image/png'
            },
            {
              src: 'icons/android/launchericon-96x96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: 'icons/android/launchericon-144x144.png',
              sizes: '144x144',
              type: 'image/png'
            },
            {
              src: 'icons/android/launchericon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/android/launchericon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/ios/180.png',
              sizes: '180x180',
              type: 'image/png'
            },
            {
              src: 'icons/ios/1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        } as any,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
