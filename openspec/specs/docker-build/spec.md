# docker-build

**Purpose**: 定义项目的 Docker 多阶段构建配置，确保跨平台一致的容器化部署体验。

## ADDED Requirements

### Requirement: 多阶段 Docker 构建
项目 SHALL 包含 `Dockerfile`，使用多阶段构建模式，将 Next.js 项目编译为生产就绪的 Node.js 容器镜像。最终镜像 SHALL 基于 `node:20-alpine` 以获得最小体积。

#### Scenario: 构建阶段
- **WHEN** 执行 `docker build .`
- **THEN** 第一阶段（deps）SHALL 使用 `pnpm` 安装所有生产依赖
- **THEN** 第二阶段（builder）SHALL 执行 `pnpm build` 编译 Next.js 应用
- **THEN** 第三阶段（runner）SHALL 仅复制编译产物和生产依赖，产出最终镜像

#### Scenario: 最终镜像内容
- **WHEN** Docker 构建完成
- **THEN** 最终镜像 SHALL 仅包含 `.next/standalone` 独立构建产物、`public/` 静态资源、`.next/static` 静态文件
- **THEN** 镜像 SHALL 不含 `node_modules/.dev`、`.git`、源码 TypeScript 文件等构建无关内容

#### Scenario: 容器启动
- **WHEN** 运行 `docker run <image>`
- **THEN** 容器 SHALL 在端口 3000 启动 Next.js 生产服务器
- **THEN** 应用 SHALL 正常响应 HTTP 请求

### Requirement: 环境变量声明
Dockerfile SHALL 声明项目运行时所需的环境变量，必要的变量提供合理默认值，可选的外部服务变量留空由用户提供。

#### Scenario: 默认环境变量
- **WHEN** 容器启动时未显式设置 `NODE_ENV`
- **THEN** SHALL 默认为 `production`
- **WHEN** 容器启动时未显式设置 `WANJIE_DATA_DIR`
- **THEN** SHALL 默认为 `/app/data`

#### Scenario: 可选外部服务变量
- **WHEN** 容器启动时未设置 `NEXT_PUBLIC_SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **THEN** Supabase 相关功能 SHALL 不可用但不影响容器正常启动
- **WHEN** 容器启动时未设置 `ANTHROPIC_API_KEY`
- **THEN** AI 相关功能 SHALL 不可用但不影响容器正常启动

### Requirement: .dockerignore 排除文件
项目 SHALL 包含 `.dockerignore` 文件，排除构建上下文中的无关文件和目录，加速构建并减少镜像体积。

#### Scenario: 构建排除
- **WHEN** Docker 构建上下文被发送到 Docker daemon
- **THEN** SHALL 排除 `node_modules/`
- **THEN** SHALL 排除 `.git/`
- **THEN** SHALL 排除 `.next/`（本地开发产物）
- **THEN** SHALL 排除 `out/`（GitHub Pages 旧产物）
- **THEN** SHALL 排除 IDE 配置文件和临时文件
