import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({

  base: '/debate-sorteggio/',

  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // Aggiorna l'app automaticamente se cambi codice
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Gestione Torneo',
        short_name: 'Torneo',
        description: 'Applicazione per gestire tornei e sorteggi',
        theme_color: '#0d0f14', // Colore della barra di stato (Dark Theme)
        background_color: '#0d0f14',
        display: 'standalone', // Sembra una app nativa (senza barra browser)
        orientation: 'portrait', // Blocca in verticale su mobile (opzionale)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Importante per Android moderno
          }
        ]
      }
    })
  ]
})