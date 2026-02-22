import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Strip the Domain attribute from every Set-Cookie header in the
        // backend's response.  Without this, Django may set a cookie with
        // Domain=localhost:8000; the browser then stores it scoped to port
        // 8000 and never sends it on requests to the Vite dev server
        // (localhost:5173), which makes all authenticated requests fail.
        // An empty string removes the Domain attribute entirely, so the
        // browser scopes the cookie to the current origin (localhost:5173)
        // and includes it in every subsequent proxied request.
        cookieDomainRewrite: { '*': '' },
      },
    },
  },
})
