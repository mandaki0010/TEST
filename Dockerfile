# ===== Stage 1: Frontend Build =====
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/public/ ./public/
COPY frontend/src/ ./src/

# 同一オリジンのため REACT_APP_API_URL は /api のまま（デフォルト）
RUN npm run build

# ===== Stage 2: Backend Dependencies =====
FROM node:20-alpine AS backend-deps

WORKDIR /app

# better-sqlite3 のコンパイルに必要
RUN apk add --no-cache python3 make g++

COPY backend/package.json ./
RUN npm install --omit=dev

# ===== Stage 3: Production =====
FROM node:20-alpine

WORKDIR /app

# バックエンド依存関係とソースをコピー
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/src/ ./src/
COPY backend/package.json ./

# フロントエンドのビルド成果物をコピー（Express が配信）
COPY --from=frontend-builder /frontend/build ./public

# SQLite DB とログのディレクトリ
RUN mkdir -p data logs

# Cloud Run が PORT 環境変数を注入（デフォルト 8080）
EXPOSE 8080

CMD ["node", "src/index.js"]
