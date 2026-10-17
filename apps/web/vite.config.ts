import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const appDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  envDir: path.resolve(appDir, '../..'),
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Cadence',
        short_name: 'Cadence',
        description: 'Focus, tasks, goals, and time tracking',
        display: 'standalone',
        start_url: '/',
        background_color: '#020617',
        theme_color: '#020617',
      },
    }),
  ],
})
