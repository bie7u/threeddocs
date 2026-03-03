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
        configure: (proxy) => {
          // Rewrite Set-Cookie attributes so that browsers accept the cookies
          // over plain HTTP during local development:
          //
          // 1. Strip "Secure" — browsers silently discard cookies marked
          //    Secure on non-HTTPS connections, which causes auth tokens to
          //    never be stored and every subsequent request to get a 401.
          //
          // 2. Replace "SameSite=None" with "SameSite=Lax" — Chrome 80+
          //    enforces that SameSite=None cookies MUST also carry the Secure
          //    attribute (RFC 6265bis §5.3.7).  After step 1 removes Secure,
          //    any remaining SameSite=None cookie is treated as invalid and
          //    silently dropped by the browser.  Downgrading to SameSite=Lax
          //    is safe for local dev because all requests are same-origin
          //    (the Vite proxy rewrites /api/* as same-origin from the
          //    browser's perspective).
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map((cookie) =>
                cookie
                  .replace(/;\s*Secure/gi, '')
                  .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
              );
            }
          });
        },
      },
    },
  },
})
