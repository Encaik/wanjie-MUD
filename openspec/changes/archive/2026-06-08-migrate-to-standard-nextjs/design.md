## Context

项目最初在扣子编程平台上开发，使用了平台特定的工具链：
- `.coze` 配置文件定义运行时和构建命令
- 自定义 HTTP 服务器（`src/server.ts`）通过 `tsup` 编译后在 Node.js 上运行，同时托管 Next.js 和 WebSocket
- `COZE_*` 系列环境变量由平台注入
- Supabase 凭证通过 Python `coze_workload_identity` 库动态获取
- 构建/开发命令通过 bash 脚本间接调用
- `react-dev-inspector` 在 Coze 开发环境中提供调试面板

目标：将项目改造为纯静态 Next.js 站点，通过 `output: 'export'` 生成静态文件，部署至 GitHub Pages。

### 约束条件
- GitHub Pages 仅支持静态文件托管（HTML/CSS/JS），不支持 Node.js 服务端运行时
- 不能使用 Next.js API Routes、Middleware、Server Components 中的服务端逻辑
- WebSocket 无法直接在静态托管中运行，需要替代方案
- 动态路由需要 `generateStaticParams` 预生成所有路径

## Goals / Non-Goals

**Goals:**
- 项目可通过 `next build` 直接构建，生成 `out/` 静态目录
- 构建产物可在任何静态文件服务器（包括 GitHub Pages）上运行
- 移除所有扣子编程平台专有依赖和代码
- 保留游戏核心功能：角色、修行、战斗、装备、成就等
- 保留 Supabase 作为数据后端（客户端直连）
- 添加 GitHub Actions 自动部署流程
- 项目可使用标准 `pnpm dev` / `pnpm build` 工作流

**Non-Goals:**
- 不保留 WebSocket 实时多人功能（改为轮询或移除）
- 不保留自定义服务器和相关部署逻辑
- 不迁移到其他后端（仍使用 Supabase）
- 不改变游戏核心玩法逻辑
- 不改变 UI 组件库（保留 shadcn/ui + Tailwind）

## Decisions

### 1. 静态导出模式：`output: 'export'` + `trailingSlash: true`
- **决定**：在 `next.config.ts` 中设置 `output: 'export'`，启用 `trailingSlash: true` 以确保 GitHub Pages 正确处理路由
- **替代方案**：`output: 'standalone'` + Cloudflare/Vercel — 但用户明确要求 GitHub Pages
- **理由**：GitHub Pages 免费、无需额外服务，且项目以客户端交互为主（游戏 UI），适合 SPA 式静态部署

### 2. 移除自定义服务器，使用 `next dev` 标准开发命令
- **决定**：删除 `src/server.ts` 和 `scripts/{dev,start,build,prepare}.sh`，package.json scripts 改为直接调用 `next dev` / `next build`
- **理由**：标准 Next.js 项目不需要自定义服务器；WebSocket 功能在静态导出后无法使用，自定义服务器的唯一附加价值已消失

### 3. WebSocket 功能降级为客户端轮询 + Supabase Realtime
- **决定**：移除 `src/ws-handlers/`，对于需要实时更新的场景（如多人排行榜），改用 Supabase Realtime 订阅或客户端定时轮询
- **替代方案**：完全移除实时功能 — 但会损失多人交互体验
- **理由**：Supabase 已提供 Realtime 功能，客户端直连即可；无需维护自定义 WebSocket 服务器

### 4. API Routes 处理策略
- **决定**：移除 `src/app/api/` 下的所有 Route Handler，业务逻辑改为客户端直接调用 Supabase SDK
- **理由**：静态导出不支持 API Routes；当前 API 主要是 Supabase 的薄包装，客户端直连 Supabase 更简洁
- **注意**：Supabase anon key 会暴露在客户端，需要配置 RLS 策略保护数据安全

### 5. Supabase 客户端重构
- **决定**：移除 `COZE_SUPABASE_URL` / `COZE_SUPABASE_ANON_KEY`，改用 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **决定**：移除 Python `coze_workload_identity` 动态获取凭证逻辑，改为从环境变量直接读取
- **决定**：移除 `execSync` 调用，使用标准 `process.env` 读取
- **理由**：静态导出后所有 Supabase 调用都在客户端，需要 `NEXT_PUBLIC_` 前缀暴露给浏览器；Coze workload identity 在标准环境中不可用

### 6. 包依赖清理
- **移除**：`coze-coding-dev-sdk`（未被源码直接引用，为平台运行时依赖）
- **移除**：`react-dev-inspector`、`@react-dev-inspector/babel-plugin`、`@react-dev-inspector/middleware`（Coze 开发调试工具）
- **保留**：`ws` 类型定义可移除（`@types/ws`），因为 WebSocket 服务器不再需要

### 7. 部署流程
- **决定**：通过 GitHub Actions 在 push 到 main 时自动构建并部署到 GitHub Pages
- **使用** `actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages`
- **理由**：GitHub 官方 Actions 提供原生 Pages 部署支持

## Risks / Trade-offs

- **[风险] 多人游戏功能受损** → 缓解：将多人功能降级为 "展示型"，使用 Supabase Realtime 替代 WebSocket 推送；排行榜等数据通过客户端轮询获取
- **[风险] Supabase anon key 暴露** → 缓解：在 Supabase 中配置严格的 Row Level Security (RLS) 策略，确保客户端只能访问授权数据；anon key 本身就是公开的（anon = anonymous）
- **[风险] 部分页面可能依赖服务端渲染** → 缓解：检查所有 `page.tsx` 确保无 `cookies()`、`headers()` 等服务端 API 调用；动态路由使用 `generateStaticParams`
- **[风险] 构建产物过大** → 缓解：启用 Next.js 图片优化（静态导出支持的 `images.loader: 'custom'`），合理分割客户端组件
- **[取舍] 失去服务端计算能力**：战斗数值计算等逻辑必须在客户端执行，无法防止作弊 — 接受此限制（单机文字游戏，作弊不影响他人）

## Open Questions

1. Supabase 实例是否仍在运行？如果 Supabase 不可用，是否需要将数据改为纯客户端 JSON 文件？
2. 是否需要保留用户登录功能？静态导出下需要 Supabase Auth 客户端模式
3. GitHub Pages 域名是 `<username>.github.io/<repo>` 还是自定义域名？影响 `basePath` 和 `assetPrefix` 配置
