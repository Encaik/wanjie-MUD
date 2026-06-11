# github-pages-deploy

**Status**: 🗑 已弃用 (2026-06-10)

**Reason**: 项目已转为全栈 Next.js 应用（含 API Routes、数据库连接），GitHub Pages 仅支持静态文件托管，无法承载服务端逻辑。

**Migration**: 使用 Docker 容器化部署替代。
- 拉取镜像: `docker pull encaik/wanjie-mud:latest`
- 启动容器: `docker run -p 3000:3000 encaik/wanjie-mud:latest`
- CI 自动构建推送替代 GitHub Pages 自动部署
- 参考规格: `docker-build`、`docker-ci-publish`
