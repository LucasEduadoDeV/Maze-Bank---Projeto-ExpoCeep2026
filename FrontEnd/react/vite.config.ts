import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
      },
      '/api': 'http://backend:3000',
    },
  },
})
