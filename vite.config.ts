import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const base = mode === 'github-pages' ? '/ligretto-scoreboard/' : '/'

  return {
    base,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: 'Ligretto Scoreboard',
          short_name: 'Ligretto',
          description: 'Segnapunti veloce per le tue partite a Ligretto.',
          theme_color: '#ead2b9',
          background_color: '#fff8ef',
          display: 'standalone',
          id: `${base}#/`,
          scope: base,
          start_url: `${base}#/`,
          lang: 'it'
        },
        workbox: {
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,woff2}'],
          runtimeCaching: []
        }
      })
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
  }
})
