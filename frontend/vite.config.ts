import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    // In production VITE_API_URL must be set in the Vercel/host env vars
    // to the Render backend URL, e.g. https://careermitra-backend.onrender.com
    // In development it falls back to localhost:5000 via the proxy above.
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || ''
      ),
    },
  }
})
