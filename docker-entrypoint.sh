#!/bin/sh
# Generate nginx config from templates and start nginx.
set -e

# ── HTTP ──────────────────────────────────────────────────────────────────────
envsubst '${BACKEND_URL}' \
  < /etc/nginx/templates/http.conf.template \
  > /etc/nginx/conf.d/default.conf

# ── HTTPS (optional) ──────────────────────────────────────────────────────────
# Append the HTTPS server block only when certificate files are present.
SSL_CERT="${SSL_CERT:-}"
SSL_KEY="${SSL_KEY:-}"
if [ -f "${SSL_CERT}" ] && [ -f "${SSL_KEY}" ]; then
  envsubst '${BACKEND_URL} ${SSL_CERT} ${SSL_KEY}' \
    < /etc/nginx/templates/https.conf.template \
    >> /etc/nginx/conf.d/default.conf
fi

# ── Start nginx ───────────────────────────────────────────────────────────────
exec nginx -g 'daemon off;'
