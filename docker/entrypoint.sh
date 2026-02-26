#!/bin/sh
# Entrypoint for the nginx container.
#
# 1. Injects BACKEND_URL into the nginx config templates via envsubst.
# 2. Appends the HTTPS server block only when a non-empty SSL certificate and
#    private key are present at /etc/nginx/ssl/cert.pem and key.pem.
# 3. Validates the resulting nginx config and then execs nginx in the
#    foreground so Docker can manage the process lifecycle.

set -e

CONF=/etc/nginx/conf.d/default.conf
HTTP_TMPL=/etc/nginx/http.conf.template
SSL_TMPL=/etc/nginx/ssl.conf.template

# Always generate the HTTP (port 80) server block.
envsubst '${BACKEND_URL}' < "$HTTP_TMPL" > "$CONF"

# Append the HTTPS (port 443) server block only when both the certificate and
# the private key are present and non-empty (-s tests size > 0).
# This allows running HTTP-only by simply not mounting the ssl/ volume.
if [ -s /etc/nginx/ssl/cert.pem ] && [ -s /etc/nginx/ssl/key.pem ]; then
    echo "SSL certificates found — enabling HTTPS on port 443."
    envsubst '${BACKEND_URL}' < "$SSL_TMPL" >> "$CONF"
else
    echo "No SSL certificates found — running HTTP only on port 80."
fi

# Verify the generated config before starting.
nginx -t

exec nginx -g 'daemon off;'
