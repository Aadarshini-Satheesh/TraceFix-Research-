import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Explicitly set output directory (keeps Netlify config in sync)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  // Local dev: proxy /api → FastAPI so CORS/auth cookies work seamlessly
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
