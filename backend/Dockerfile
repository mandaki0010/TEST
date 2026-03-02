# ----- Build stage (native modules) -----
FROM node:20-alpine AS deps

WORKDIR /app

# better-sqlite3 requires compilation tools
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# ----- Production stage -----
FROM node:20-alpine

WORKDIR /app

# Copy compiled native modules from build stage
COPY --from=deps /app/node_modules ./node_modules

COPY src/ ./src/
COPY package.json ./

# Create directories for SQLite DB and logs
RUN mkdir -p data logs

# Cloud Run injects PORT; fallback to 3001 for local
EXPOSE 3001

CMD ["node", "src/index.js"]
