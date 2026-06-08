## ADDED Requirements

### Requirement: GitHub Actions 自动部署
项目 SHALL 包含 `.github/workflows/deploy.yml` 工作流，在推送到 main 分支时自动构建并部署到 GitHub Pages。

#### Scenario: 自动部署触发
- **WHEN** 代码被推送到 main 分支
- **THEN** GitHub Actions SHALL 自动执行构建流程
- **THEN** 构建产物 SHALL 部署到 GitHub Pages

#### Scenario: 构建流程
- **WHEN** GitHub Actions 工作流运行
- **THEN** SHALL 使用 `pnpm` 安装依赖
- **THEN** SHALL 执行 `pnpm build` 生成静态站点
- **THEN** SHALL 将 `out/` 目录上传为 Pages artifact

### Requirement: basePath 配置
`next.config.ts` SHALL 支持通过 `basePath` 配置项适配 GitHub Pages 的仓库路径前缀。

#### Scenario: 仓库级 Pages 部署
- **WHEN** 站点部署在 `https://<username>.github.io/<repo-name>/`
- **THEN** `next.config.ts` 中的 `basePath` SHALL 设置为 `/<repo-name>`
- **THEN** 所有资源引用（CSS、JS、图片）SHALL 正确包含路径前缀

### Requirement: 构建产物完整性
构建输出的 `out/` 目录 SHALL 包含 `.nojekyll` 文件，阻止 GitHub Pages 对 `_next/` 等下划线开头的目录进行 Jekyll 处理。

#### Scenario: 静态资源可访问
- **WHEN** 站点部署到 GitHub Pages 后
- **THEN** `_next/static/` 下的 JS/CSS 文件 SHALL 正常加载
- **THEN** 不会出现 404 错误
