import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000'

  return {
    plugins: [react()],
    server: {
      // Local HTTPS for testing admin flows: VITE_LOCAL_HTTPS=true npm run dev
      https: env.VITE_LOCAL_HTTPS === 'true',
      // Browser calls same-origin /api → forwarded to Express (avoids CORS in dev)
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
