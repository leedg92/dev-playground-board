# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# package.json을 먼저 복사하고 설치
COPY package*.json ./
RUN npm ci

# 나머지 파일들 복사
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Production/Development
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# package.json과 의존성 설치
COPY package*.json ./
RUN npm ci

# 빌드된 파일들과 소스 코드 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY tsconfig.json ./
COPY .env* ./

USER node

EXPOSE 8000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:8000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
