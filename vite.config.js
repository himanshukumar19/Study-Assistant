import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Don't load or watch .env — all secrets live in the backend only
  envDir: false,
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
