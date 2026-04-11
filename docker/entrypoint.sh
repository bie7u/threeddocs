#!/bin/sh
# Entrypoint for the nginx container.
#
# 1. Injects BACKEND_URL into the nginx config templates via envsubst.
# 2. When SSL certificates are present:
#      - port 80  → permanent redirect to HTTPS
#      - port 443 → serves the app with TLS (HTTP/2 enabled)
#    When no SSL certificates are present:
#      - port 80  → serves the app over plain HTTP
# 3. Validates the resulting nginx config and then execs nginx in the
#    foreground so Docker can manage the process lifecycle.

set -e

CONF=/etc/nginx/conf.d/default.conf
HTTP_TMPL=/etc/nginx/http.conf.template
REDIRECT_TMPL=/etc/nginx/redirect.conf.template
SSL_TMPL=/etc/nginx/ssl.conf.template

# Append the HTTPS (port 443) server block only when both the certificate and
# the private key are present and non-empty (-s tests size > 0).
# This allows running HTTP-only by simply not mounting the ssl/ volume.
if [ -s /etc/nginx/ssl/cert.pem ] && [ -s /etc/nginx/ssl/key.pem ]; then
    echo "SSL certificates found — enabling HTTPS on port 443 and redirecting HTTP on port 80."
    # Port 80: redirect all traffic to HTTPS.
    envsubst '${BACKEND_URL}' < "$REDIRECT_TMPL" > "$CONF"
    # Port 443: serve the app over TLS.
    envsubst '${BACKEND_URL}' < "$SSL_TMPL" >> "$CONF"
else
    echo "No SSL certificates found — running HTTP only on port 80."
    envsubst '${BACKEND_URL}' < "$HTTP_TMPL" > "$CONF"
fi

# Verify the generated config before starting.
nginx -t

exec nginx -g 'daemon off;'
