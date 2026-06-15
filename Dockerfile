# ============================================
# 万界修行录 - Docker 多阶段构建
# ============================================
# 阶段 1: deps — 安装生产依赖（含原生模块编译）
# 阶段 2: builder — 编译 Next.js 应用
# 阶段 3: runner — 最小化生产运行时
# ============================================

# --------------------------------------------
# 阶段 1: 依赖安装
# --------------------------------------------
FROM node:22-alpine AS deps

# 安装原生模块编译工具（better-sqlite3 需要）
RUN apk add --no-cache python3 build-base

# 启用 pnpm
RUN corepack enable

WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装全部依赖（含 devDependencies，构建阶段需要 tsx 等）
RUN pnpm install --frozen-lockfile

# --------------------------------------------
# 阶段 2: 构建
# --------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# 从 deps 阶段复制 node_modules（含 devDependencies）
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# 复制源码
COPY . .

# 构建应用（sync-version → build-mods → next build）
RUN pnpm build

# 精简为生产依赖（移除 devDependencies）
RUN pnpm prune --prod

# 删除 standalone 自带的 node_modules，避免与根 node_modules 的 pnpm 符号链接冲突
# server.js 将在运行时从 /app/node_modules（精简后的根目录）解析所有模块
RUN rm -rf /app/.next/standalone/node_modules

# --------------------------------------------
# 阶段 3: 生产运行时
# --------------------------------------------
FROM node:22-alpine AS runner

# 安装运行时系统依赖（better-sqlite3 运行时需要）
RUN apk add --no-cache python3

RUN corepack enable

WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/data

# 从 builder 复制精简后的生产依赖（pnpm prune --prod 后不含 devDependencies）
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 复制 standalone 构建产物（node_modules 已消除符号链接）
COPY --from=builder /app/.next/standalone ./

# 复制静态文件（standalone 模式需要手动复制）
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# --------------------------------------------
# 环境变量
# --------------------------------------------
ENV NODE_ENV=production

# SQLite 数据目录（挂载卷或覆盖以持久化）
ENV WANJIE_DATA_DIR=/app/data

# 外部服务（可选，未设置时相关功能不可用但不影响启动）
ENV NEXT_PUBLIC_SUPABASE_URL=
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=
ENV ANTHROPIC_API_KEY=

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动 Next.js 生产服务器
CMD ["node", "server.js"]
