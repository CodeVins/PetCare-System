FROM node:24-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite는 VITE_* 값을 빌드 시점에 번들에 넣음 — CI가 GitHub secret KAKAO_JS_KEY를 build-arg로 넘김
ARG VITE_KAKAO_JS_KEY
RUN npm run build

FROM caddy:2
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv
