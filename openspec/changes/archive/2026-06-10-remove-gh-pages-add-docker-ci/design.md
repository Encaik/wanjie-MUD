## Context

项目从纯前端静态导出（`next build` → `out/`）转为全栈 Next.js 应用后，GitHub Pages 仅能托管静态文件，无法运行 API Routes 和服务端逻辑。当前 `.github/workflows/deploy.yml` 仍配置为 GitHub Pages 部署，`next.config.ts` 中保留了为 GitHub Pages 服务的 `basePath` / `trailingSlash` 配置。需要全面转向 Docker 容器化部署。

约束：
- 目标镜像仓库：Docker Hub `encaik/wanjie-mud`
- 包管理器：pnpm 9.x
- 运行时：Node.js 20（与现有 CI 一致）
- 项目含原生模块 `better-sqlite3`，需编译环境
- 构建流程含前置脚本：`sync-version.ts` + `build-mods.ts` → `next build`

## Goals / Non-Goals

**Goals:**
- 创建生产就绪的 Docker 镜像，体积尽量小
- 每次推送到 main 分支自动构建并推送镜像至 Docker Hub
- 清理所有 GitHub Pages 相关配置和脚本
- 镜像支持 `docker run` 一键启动，端口 3000

**Non-Goals:**
- 不涉及 docker-compose 多服务编排（数据库等外部服务连接通过环境变量配置）
- 不涉及 Kubernetes / Helm 等复杂编排
- 不改变业务代码逻辑

## Decisions

### 1. Docker 多阶段构建（3 阶段）

**选择**：deps → builder → runner 三阶段

**理由**：
- `better-sqlite3` 是原生模块，需要在 deps 阶段安装构建工具（python3, make, g++），但最终镜像不应包含这些
- builder 阶段执行 `pnpm build`（含 sync-version + build-mods + next build）
- runner 阶段仅复制 standalone 输出 + static 文件 + 生产 node_modules，镜像体积最小

**备选方案**：
- 二阶段构建（build → run）：最终镜像会包含构建工具链，体积大 ~200MB
- 单阶段 + `.dockerignore`：无法分离构建依赖和运行依赖

### 2. Next.js Standalone 输出模式

**选择**：在 `next.config.ts` 中配置 `output: 'standalone'`

**理由**：Next.js standalone 模式自动追踪构建产物的依赖关系，生成自包含的 `.next/standalone` 目录，只需复制该目录 + `public/` + `.next/static` 即可运行。`next start` 或 `node server.js` 直接启动。

**备选方案**：
- 完整源码 + `next start`：镜像需要包含全部源码和 devDependencies，体积巨大
- `output: 'export'`（原模式）：仅产出静态文件，无法运行服务端，不可行

### 3. 基础镜像选择

**选择**：`node:20-alpine`

**理由**：
- 体积小（~50MB vs ~350MB for debian-slim vs ~1GB for full）
- 项目已使用 Alpine 兼容的原生模块
- `better-sqlite3` 在 Alpine 上编译需要 `build-base` + `python3`（在 deps 阶段安装即可）

### 4. GitHub Actions 工作流设计

**选择**：使用 `docker/build-push-action@v6` + `docker/login-action@v3`

**理由**：
- `docker/build-push-action` 是 Docker 官方维护的构建推送 Action，支持 BuildKit、缓存、多平台
- `docker/login-action` 安全处理 Docker Hub 认证
- 与现有 deploy.yml 同仓库、同触发条件（push to main），行为一致

**备选方案**：
- 直接用 `docker build && docker push` shell 命令：缺少 BuildKit 缓存、元数据注入
- 使用第三方 CI 服务（GitLab CI、CircleCI）：切换成本高，GitHub Actions 原生集成最好

### 5. Tag 策略

**选择**：`<version>` + `latest`，版本号从 `package.json` 提取

**理由**：
- `<version>` tag 用于精确回滚和版本追踪（如 `0.1.0`、`0.2.0`）
- `latest` tag 始终指向最新构建，用于一键部署 `docker pull encaik/wanjie-mud:latest`
- 版本号从 `package.json` 提取，与代码版本一致，通过 `jq` 工具读取

**备选方案**：
- Git commit SHA：精确但不可读，部署时需要查 SHA
- `latest` only：无法回滚
- 语义化 tag on Git tag push：更规范但操作复杂，后续可扩展

### 6. next.config.ts 清理

**选择**：移除 `basePath`、`trailingSlash` 配置，新增 `output: 'standalone'`

**理由**：
- `basePath`：GitHub Pages 需要 `/wanjie-MUD` 前缀，Docker 部署无此需求
- `trailingSlash`：仅为 GitHub Pages 静态文件路由设置，standalone 模式下不需要
- `output: 'standalone'`：Next.js 服务端独立运行模式，Docker 部署必需

**保留** `images.unoptimized: true`：Docker 容器内无 sharp 依赖时仍可正常提供图片。

### 7. 多平台构建

**选择**：同时构建 `linux/amd64` 和 `linux/arm64` 两个平台

**理由**：
- `linux/amd64` 覆盖传统 x86 服务器和大多数云主机
- `linux/arm64` 覆盖 Apple Silicon Mac（Docker Desktop）、AWS Graviton、树莓派等 ARM 设备
- Docker Buildx + QEMU 可在 GitHub Actions 中无痛支持多平台构建，仅构建时间增加约 2 倍
- 无需维护两套 Dockerfile

**备选方案**：
- 仅 `linux/amd64`：更快的 CI 构建，但 ARM 用户无法直接使用
- 每个平台单独 tag：管理复杂，不推荐

### 8. GitHub Pages 构建脚本处理

**选择**：删除 `package.json` 中的 `build:github` 脚本

**理由**：
- `build:github` 仅设置 `BASE_PATH=/wanjie-MUD` 用于 GitHub Pages 二级目录部署
- 常规 `build` 脚本无需修改，仍包含 `sync-version` + `build-mods` + `next build`

### 9. 环境变量默认值

**选择**：在 Dockerfile 中声明项目实际使用的环境变量及其默认值

**理由**：根据项目源码分析，以下环境变量直接影响运行行为：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | `production` | Node 运行模式，production 关闭 dev 日志 |
| `WANJIE_DATA_DIR` | `/app/data` | SQLite 数据库文件目录，Docker 内持久化挂载点 |

以下变量无默认值（用户必须通过 `-e` 或 `--env-file` 提供）：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（需 Supabase 功能时提供） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥（需 Supabase 功能时提供） |
| `ANTHROPIC_API_KEY` | AI 功能 API 密钥（需 AI 功能时提供） |

Supabase 和 AI 功能采用懒加载模式（仅在调用时才读取环境变量），因此未设置时不会导致容器启动崩溃，仅相关功能不可用。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| `better-sqlite3` Alpine 编译失败 | 镜像构建中断 | deps 阶段预先安装 `build-base python3`；若持续失败可换 `node:20-slim` |
| Docker Hub 限流（未认证用户 100 pulls/6h） | 频繁部署时拉取受限 | 使用认证用户推送，拉取方建议也用认证 |
| 镜像体积过大（预估 ~250-350MB） | 推送/拉取慢 | 多阶段构建 + Alpine 已是最优；`.dockerignore` 排除无关文件 |
| standalone 模式引入兼容问题 | 运行时错误 | 构建后本地 `docker run` 测试通过再推送 |
| 版本号未更新导致 tag 重复 | 推送覆盖旧版本 | 小问题，latest tag 覆盖是预期行为 |

## Migration Plan

1. **准备阶段**：在 GitHub 仓库设置中添加 Secrets：`DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`
2. **实施阶段**：创建 Dockerfile 和相关文件，删除 deploy.yml，创建新 CI 工作流
3. **验证阶段**：本地 `docker build -t encaik/wanjie-mud:test .` 构建测试，`docker run -p 3000:3000 encaik/wanjie-mud:test` 启动测试
4. **上线阶段**：合并到 main 分支触发自动构建推送，确认 Docker Hub 上出现镜像
5. **回滚策略**：如需回滚，恢复 `deploy.yml` 文件和 `next.config.ts` 变更即可（GitHub Pages 部署能力不受 Docker 化影响，可并行存在一段时间）

## Resolved Questions

1. ~~是否需要同时支持 `linux/arm64` 多平台构建？~~ → ✅ **支持** `linux/amd64` + `linux/arm64`
2. ~~是否需要 Git tag 触发版本发布？~~ → ❌ **仅 main 分支推送触发**，不需要 tag 触发
3. ~~数据库环境变量是否需要声明默认值？~~ → ✅ **按项目实际情况声明**：`NODE_ENV=production`、`WANJIE_DATA_DIR=/app/data`；Supabase/AI 变量声明但无默认值（懒加载，不设也不影响容器启动）
