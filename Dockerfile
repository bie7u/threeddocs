# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy the compiled frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# The official nginx image processes *.template files in /etc/nginx/templates/
# at container start using envsubst, writing the result to /etc/nginx/conf.d/.
# BACKEND_URL must be set at runtime (e.g. docker run -e BACKEND_URL=http://backend:3000
# or via the environment section in docker-compose.yml).
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
