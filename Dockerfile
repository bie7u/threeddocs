# ── Stage 1: build the React / Vite app ───────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine

# gettext ships envsubst, which the entrypoint uses to inject BACKEND_URL into
# the nginx config templates at container start-up.
RUN apk add --no-cache gettext

# Serve the compiled SPA.
COPY --from=build /app/dist /usr/share/nginx/html

# nginx config templates.  The custom entrypoint processes these at run-time.
COPY nginx/http.conf.template /etc/nginx/http.conf.template
COPY nginx/ssl.conf.template  /etc/nginx/ssl.conf.template

# Remove the default site so our generated config is the only one loaded.
RUN rm /etc/nginx/conf.d/default.conf

# Custom entrypoint: generates /etc/nginx/conf.d/default.conf from the
# templates above, then execs nginx.
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
