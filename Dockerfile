# ── Stage 1: build the Vite/React SPA ─────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ──────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default config shipped with nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy the built SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config templates
COPY nginx.conf     /etc/nginx/templates/http.conf.template
COPY nginx.ssl.conf /etc/nginx/templates/https.conf.template

# Copy custom entrypoint that applies env-var substitution at container start
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

CMD ["/docker-entrypoint.sh"]
