# ===== Stage 1: Frontend Build =====
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/public/ ./public/
COPY frontend/src/ ./src/

RUN npm run build

# ===== Stage 2: Production =====
FROM node:20-alpine

WORKDIR /app

COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/src/ ./src/

# フロントエンドのビルド成果物をコピー（Express が配信）
COPY --from=frontend-builder /frontend/build ./public

RUN mkdir -p logs && chmod +x src/start.sh

# Cloud Run が PORT 環境変数を注入（デフォルト 8080）
EXPOSE 8080

# 起動時にマイグレーション・シードを実行してからサーバーを起動
CMD ["sh", "src/start.sh"]
