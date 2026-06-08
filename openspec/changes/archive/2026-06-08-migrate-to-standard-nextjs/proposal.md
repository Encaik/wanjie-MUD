## Why

该项目最初在扣子编程（Coze Code）平台上开发，包含大量平台定制内容（自定义服务器、Coze SDK、Coze 专有环境变量和构建脚本）。现导出上传至 GitHub，需要改造为标准 Next.js 项目，使其能通过静态导出（`output: 'export'`）部署到 GitHub Pages 上使用。

## What Changes

- **BREAKING**: 配置 `next.config.ts` 为 `output: 'export'` 静态导出模式，所有页面预渲染为静态 HTML
- **BREAKING**: 移除自定义服务器 `src/server.ts`（GitHub Pages 不支持 Node.js 运行时）
- **BREAKING**: 移除所有 API 路由（`src/app/api/`），静态导出不支持服务端 API
- **BREAKING**: 移除 WebSocket 功能（`src/ws-handlers/`），静态托管无法维持长连接
- 移除扣子编程专有依赖：`coze-coding-dev-sdk`、`react-dev-inspector`
- 移除扣子专有环境变量：`COZE_WORKSPACE_PATH`、`COZE_PROJECT_ENV`、`COZE_SUPABASE_URL`、`COZE_SUPABASE_ANON_KEY`
- 标准化构建脚本：用标准 `next build` / `next dev` 命令替代 bash 脚本
- 更新 `.npmrc`：移除 npmmirror 镜像，使用标准 npm registry
- 更新 `layout.tsx` 元数据：移除 Coze Code 品牌信息
- 重构 Supabase 客户端：移除 Coze workload identity 依赖
- 添加 GitHub Actions 工作流用于自动部署到 GitHub Pages

## Capabilities

### New Capabilities

- `static-export-build`: 配置 Next.js `output: 'export'`，确保所有页面可静态预渲染，生成的 `out/` 目录可直接作为静态站点部署
- `github-pages-deploy`: GitHub Actions 工作流，在 push 到 main 分支时自动构建并部署到 GitHub Pages
- `coze-cleanup`: 移除所有扣子编程平台专有依赖、脚本、环境变量和品牌引用，使项目成为独立的标准 Next.js 项目
- `supabase-client-refactor`: 重构 Supabase 客户端初始化逻辑，移除 Coze workload identity，改为标准环境变量配置

### Modified Capabilities

（无现有 specs 需要修改，`openspec/specs/` 为空）

## Impact

- **配置文件**: `next.config.ts`、`package.json`、`tsconfig.json`、`.npmrc`、`components.json`
- **源码文件**: `src/server.ts`（删除）、`src/ws-handlers/`（删除）、`src/app/api/`（删除/替换）、`src/app/layout.tsx`（修改元数据）、`src/storage/database/supabase-client.ts`（重构）
- **脚本文件**: `scripts/` 目录（简化或删除 bash 脚本）
- **部署文件**: 新增 `.github/workflows/deploy.yml`
- **依赖变更**: 移除 `coze-coding-dev-sdk`、`react-dev-inspector`、`@react-dev-inspector/babel-plugin`、`@react-dev-inspector/middleware`
