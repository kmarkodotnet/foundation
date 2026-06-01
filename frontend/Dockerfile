# syntax=docker/dockerfile:1
# ARM64 (Raspberry Pi) + AMD64 kompatibilis

FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build:prod

# -------------------------------------------------------
FROM nginx:alpine AS final

COPY --from=build /app/dist/grant-management/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1
