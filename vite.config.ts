import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  base: './', // Para garantir que no Hostinger ele ache o caminho relativo dos assets
  build: {
    assetsInlineLimit: 0, 
  }
})
