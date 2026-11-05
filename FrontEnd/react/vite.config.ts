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
      '/me': 'http://backend:3000',
      '/api/register': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/login': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/logout': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/transaction': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/cards': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/bills': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/invoices': {
        target: 'http://backend:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
