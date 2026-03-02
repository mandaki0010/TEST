# ----- Build stage -----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY public/ ./public/
COPY src/ ./src/

# REACT_APP_API_URL:
#   - docker-compose: 未設定のまま（nginx が /api/ をバックエンドへプロキシ）
#   - Cloud Run: ビルド引数でバックエンドの Cloud Run URL を渡す
#     例: --build-arg REACT_APP_API_URL=https://backend-xxxx-xx.a.run.app/api
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ----- Production stage -----
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
