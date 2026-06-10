## REMOVED Requirements

### Requirement: GitHub Actions 自动部署
**Reason**: 项目已转为全栈 Next.js 应用（含 API Routes、数据库连接），GitHub Pages 仅支持静态文件托管，无法承载服务端逻辑。转为 Docker 容器化部署替代。

**Migration**: 使用 `docker pull encaik/wanjie-mud:latest` 拉取镜像，通过 `docker run -p 3000:3000 encaik/wanjie-mud:latest` 启动容器。CI 自动构建推送替代 GitHub Pages 自动部署。

### Requirement: basePath 配置
**Reason**: basePath 仅服务于 GitHub Pages 的仓库二级路径部署。Docker 容器部署在根路径运行，不再需要。

**Migration**: 移除 `next.config.ts` 中的 `basePath` 和 `trailingSlash` 配置项。容器部署使用根路径。

### Requirement: 构建产物完整性
**Reason**: `.nojekyll` 文件仅 GitHub Pages 需要，Docker 部署无此需求。

**Migration**: 无需替代操作。
