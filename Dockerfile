# DeSci Platform Dockerfile
FROM node:18-alpine AS base

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S desci -u 1001

# 阶段1: 依赖安装
FROM base AS deps
COPY package*.json ./
COPY backend-package.json ./
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# 阶段2: 构建合约
FROM base AS contracts
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY hardhat.config.js ./
RUN npm run compile && \
    rm -rf node_modules

# 阶段3: 生产镜像
FROM base AS production

# 复制已安装的依赖
COPY --from=deps --chown=desci:nodejs /app/node_modules ./node_modules

# 复制应用代码 (排除不必要的文件)
COPY --chown=desci:nodejs package*.json ./
COPY --chown=desci:nodejs backend-package.json ./
COPY --chown=desci:nodejs hardhat.config.js ./
COPY --chown=desci:nodejs contracts/ ./contracts/
COPY --chown=desci:nodejs scripts/ ./scripts/
COPY --chown=desci:nodejs frontend/ ./frontend/
COPY --chown=desci:nodejs backend-api.js ./
COPY --chown=desci:nodejs check-status.js ./
COPY --chown=desci:nodejs sample-research-data.json ./
COPY --chown=desci:nodejs start-production.js ./
COPY --chown=desci:nodejs .env.production ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 切换到非root用户
USER desci

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "start-production.js", "start"]
