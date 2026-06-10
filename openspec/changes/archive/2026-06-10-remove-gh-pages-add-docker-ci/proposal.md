## Why

项目已从纯前端静态导出转为全栈 Next.js 项目（含 API Routes、数据库连接、服务端逻辑），GitHub Pages 仅支持静态托管，已无法承载后端能力。需要移除无效的 GitHub Pages 部署配置，并用 Docker 容器化替代，实现每次提交自动构建镜像并推送至 Docker Hub，方便在任意支持 Docker 的服务器上部署。

## What Changes

- **移除** GitHub Pages 部署工作流（`.github/workflows/deploy.yml`）——**BREAKING**
- **移除** `next.config.ts` 中 basePath/trailingSlash 等仅服务于 GitHub Pages 的配置（保留 images.unoptimized 给 Docker 用）
- **移除** `package.json` 中 `build:github` 脚本
- **新增** Dockerfile — 多阶段构建，产出基于 Node.js 的精简生产镜像
- **新增** `.dockerignore` — 排除 node_modules、.git 等构建无关文件
- **新增** Docker 构建推送 CI 工作流（`.github/workflows/docker-publish.yml`）— 每次推送到 main 分支时自动构建并推送 `encaik/wanjie-mud` 镜像，tag 使用 `package.json` 中的版本号 + `latest`

## Capabilities

### New Capabilities

- `docker-build`: 项目 Docker 化，包含多阶段构建 Dockerfile、.dockerignore，产出可直接运行的生产镜像
- `docker-ci-publish`: GitHub Actions 工作流，每次推送到 main 分支时自动构建 Docker 镜像并推送至 Docker Hub（`encaik/wanjie-mud`），tag 策略为版本号 + latest

### Modified Capabilities

- `github-pages-deploy`: **移除** GitHub Pages 部署能力和相关配置，转向 Docker 容器化部署

## Impact

- 受影响文件：`.github/workflows/deploy.yml`（删除）、`.github/workflows/docker-publish.yml`（新增）、`Dockerfile`（新增）、`.dockerignore`（新增）、`next.config.ts`（修改）、`package.json`（修改）
- CI/CD：GitHub Actions 不再部署 Pages，改为构建推送 Docker 镜像
- 部署方式：从静态文件托管变为 Docker 容器部署
- 依赖：需要 Docker Hub 账号 `encaik`，需在 GitHub Secrets 中配置 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`
