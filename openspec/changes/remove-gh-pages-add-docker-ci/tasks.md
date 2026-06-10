## 1. Docker 构建基础设施

- [x] 1.1 创建 `.dockerignore`：排除 `node_modules/`、`.git/`、`.next/`、`out/`、IDE 配置文件、`openspec/`、`scripts/`
- [x] 1.2 创建 `Dockerfile`：三阶段构建（deps → builder → runner），基于 `node:20-alpine`，使用 pnpm，输出 standalone 模式，声明 `ENV NODE_ENV=production`、`WANJIE_DATA_DIR=/app/data`，以及 Supabase/AI 相关可选变量
- [x] 1.3 配置 `next.config.ts`：新增 `output: 'standalone'` 以支持 Docker 独立运行
- [ ] 1.4 本地构建验证：执行 `docker build -t encaik/wanjie-mud:test .` 确保构建成功（⚠ 需在本地执行，当前环境无 Docker）
- [ ] 1.5 本地运行验证：执行 `docker run -p 3000:3000 encaik/wanjie-mud:test` 确保应用在 `http://localhost:3000` 正常访问（⚠ 需在本地执行，当前环境无 Docker）

## 2. 移除 GitHub Pages 相关配置

- [x] 2.1 删除 `.github/workflows/deploy.yml` —— GitHub Pages 自动部署工作流
- [x] 2.2 清理 `next.config.ts`：移除 `basePath`、`trailingSlash`、`turbopack` 等不再需要的配置项
- [x] 2.3 删除 `package.json` 中的 `build:github` 脚本
- [ ] 2.4 运行 `pnpm build` 确保常规构建流程不受影响（⚠ Windows 缺少 VS C++ 工具链，better-sqlite3 无法本地编译。Docker Linux 构建不受影响）

## 3. CI/CD Docker 多平台自动发布

- [x] 3.1 创建 `.github/workflows/docker-publish.yml`：配置 push to main 触发 + workflow_dispatch 手动触发
- [x] 3.2 工作流包含：checkout → 提取版本号（jq 读取 `package.json`） → 设置 QEMU（多平台模拟） → 设置 Docker Buildx → 登录 Docker Hub → 构建并推送 `linux/amd64` + `linux/arm64` 双平台镜像（tag: version + latest）
- [ ] 3.3 在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`（⚠ 需用户手动操作）
- [ ] 3.4 推送至 GitHub 触发 CI，确认 Docker Hub 上出现 `encaik/wanjie-mud:latest` 和 `encaik/wanjie-mud:<version>` 多平台镜像（⚠ 需推送后在 GitHub Actions 和 Docker Hub 验证）

## 4. 收尾验证

- [ ] 4.1 拉取公开镜像验证：`docker pull encaik/wanjie-mud:latest` 并启动，确认功能正常（⚠ 需 CI 成功推送后执行）
- [ ] 4.2 运行 `pnpm ts-check` 和 `pnpm build` 确保 TypeScript 类型检查和构建均通过（⚠ 需在配置了 VS C++ 工具链的 Windows 环境或 Linux 环境中执行）
