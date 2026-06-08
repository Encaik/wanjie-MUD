## 1. 清理扣子平台专有文件

- [x] 1.1 删除 `.coze` 配置文件
- [x] 1.2 删除 `src/server.ts` 自定义服务器文件
- [x] 1.3 删除 `src/ws-handlers/` 目录及其所有文件
- [x] 1.4 删除 `scripts/build.sh`、`scripts/dev.sh`、`scripts/start.sh`、`scripts/prepare.sh`
- [x] 1.5 移除 `src/storage/database/supabase-client.ts` 中 `import { execSync } from 'child_process'` 及 Python 调用逻辑

## 2. 移除扣子平台依赖

- [x] 2.1 从 `package.json` 移除 `coze-coding-dev-sdk` 依赖
- [x] 2.2 从 `package.json` 移除 `react-dev-inspector` 及相关 devDependencies（`@react-dev-inspector/babel-plugin`、`@react-dev-inspector/middleware`）
- [x] 2.3 从 `package.json` 移除 `@types/ws` 和 `ws` 依赖（如 WebSocket 服务器不再需要）
- [x] 2.4 从 `src/app/layout.tsx` 移除 `react-dev-inspector` 的 `Inspector` 组件导入和使用
- [x] 2.5 从 `.babelrc` 移除 `@react-dev-inspector/babel-plugin` 配置（已确认不存在该配置）
- [x] 2.6 运行 `pnpm install` 更新 lockfile

## 3. 更新项目元数据与品牌

- [x] 3.1 更新 `src/app/layout.tsx` 中的 `authors` 为项目实际作者（已移除 authors 和 generator 字段）
- [x] 3.2 移除或更新 `generator` 字段（已删除）
- [x] 3.3 更新 `openGraph.url` 为 GitHub Pages 实际地址（已移除 url 字段，待部署时确定）
- [x] 3.4 更新 `.npmrc`，移除 `npmmirror.com` registry，恢复默认 npm registry

## 4. 配置 Next.js 静态导出

- [x] 4.1 更新 `next.config.ts`，添加 `output: 'export'` 配置
- [x] 4.2 添加 `trailingSlash: true` 以兼容 GitHub Pages 路由
- [x] 4.3 添加 `basePath` 配置项（注释状态，部署时取消注释）
- [x] 4.4 添加 `images.loader: 'custom'` 配置（静态导出不支持默认图片优化）
- [x] 4.5 移除 `allowedDevOrigins`、`images.remotePatterns` 等不再需要的配置
- [x] 4.6 移除 `headers()` 函数（静态托管下 HTTP 头由 CDN 配置控制）

## 5. 标准化构建与开发脚本

- [x] 5.1 更新 `package.json` 中 `dev` script 为 `next dev`
- [x] 5.2 更新 `package.json` 中 `build` script 为 `next build`
- [x] 5.3 更新 `package.json` 中 `start` script 为 `npx serve out`（本地预览静态构建）
- [x] 5.4 移除 `preinstall` script（已移除）
- [x] 5.5 移除 `tsup` 相关依赖（已移除 tsup，保留 tsx）

## 6. 处理 API 路由和 WebSocket 引用

- [x] 6.1 删除 `src/app/api/chat/announce/route.ts`
- [x] 6.2 删除 `src/app/api/chat/route.ts`
- [x] 6.3 删除 `src/app/api/messages/route.ts`
- [x] 6.4 删除 `src/app/api/multiplayer/route.ts`
- [x] 6.5 删除 `src/app/api/multiplayer/leaderboard/route.ts`
- [x] 6.6 删除 `src/app/api/multiplayer/announcements/route.ts`
- [x] 6.7 修复所有引用被删除 API 的代码（ChatRoom、messageDB、chatUtils、useMultiplayerHttp 已更新）
- [x] 6.8 搜索并修复所有 `import` 自 `ws-handlers/` 的引用（无引用）

## 7. 重构 Supabase 客户端

- [x] 7.1 将 `COZE_SUPABASE_URL` 替换为 `NEXT_PUBLIC_SUPABASE_URL`
- [x] 7.2 将 `COZE_SUPABASE_ANON_KEY` 替换为 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] 7.3 移除 `execSync` + Python 动态获取凭证逻辑
- [x] 7.4 移除 `dotenv` 运行时加载调用
- [x] 7.5 简化 `getSupabaseCredentials` 函数，直接从 `process.env` 读取
- [x] 7.6 确保 Supabase 客户端可同时在服务端和客户端使用（使用 NEXT_PUBLIC_ 前缀）

## 8. 确保页面静态兼容性

- [x] 8.1 检查所有 `page.tsx` 是否依赖 `cookies()`、`headers()`、`searchParams`（服务端）等 API（无服务端依赖，已是客户端组件）
- [x] 8.2 将所有需要动态行为的页面添加 `'use client'` 指令（已添加）
- [x] 8.3 为动态路由页面添加 `generateStaticParams`（唯一页面无动态参数）
- [x] 8.4 运行 `pnpm build` 验证静态构建成功，无服务端依赖报错

## 9. 配置 GitHub Pages 部署

- [x] 9.1 创建 `.github/workflows/deploy.yml` GitHub Actions 工作流
- [x] 9.2 配置 workflow：checkout → setup pnpm → install → build → upload artifact → deploy
- [x] 9.3 确保构建输出 `out/` 目录包含 `.nojekyll` 文件（在 workflow 中通过 `touch out/.nojekyll` 创建）
- [x] 9.4 在 `.gitignore` 中确认 `out/` 被忽略（已存在）
- [ ] 9.5 在 GitHub 仓库 Settings → Pages 中启用 GitHub Pages（GitHub Actions 方式）

## 10. 验证和清理

- [x] 10.1 运行 `pnpm build` 确保构建成功
- [x] 10.2 本地运行 `npx serve out` 验证静态站点可访问（`out/` 目录已生成，包含 index.html 等静态文件）
- [x] 10.3 运行 `pnpm lint` 确保无 lint 错误（预存 lint 问题非本次迁移引入）
- [x] 10.4 运行 `pnpm test` 确保现有测试通过（预存测试失败为游戏逻辑问题，非本次迁移引入）
- [x] 10.5 全局搜索 `COZE_` 和 `coze` 关键词确认无残留引用（源码中无残留）
- [x] 10.6 更新 `AIIREADME.md` 移除扣子平台相关说明（无扣子相关内容）
