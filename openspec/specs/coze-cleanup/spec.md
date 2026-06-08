## ADDED Requirements

### Requirement: 移除扣子平台专有依赖
项目 SHALL 从 `package.json` 中移除 `coze-coding-dev-sdk`、`react-dev-inspector`、`@react-dev-inspector/babel-plugin`、`@react-dev-inspector/middleware` 等扣子平台专有依赖。

#### Scenario: 依赖清理验证
- **WHEN** 运行 `pnpm install`
- **THEN** SHALL 不安装任何 `coze-*` 或 `react-dev-inspector` 相关包
- **THEN** 项目功能 SHALL 不受影响

### Requirement: 移除自定义服务器代码
项目 SHALL 删除 `src/server.ts` 和 `src/ws-handlers/` 目录，不再使用自定义 HTTP + WebSocket 服务器。

#### Scenario: 自定义服务器代码已删除
- **WHEN** 检查源码目录
- **THEN** `src/server.ts` SHALL 不存在
- **THEN** `src/ws-handlers/` 目录 SHALL 不存在
- **THEN** 无源码文件 import 来自 `ws-handlers/` 的模块

### Requirement: 移除扣子平台环境变量依赖
项目 SHALL 移除所有 `COZE_*` 前缀的环境变量引用（`COZE_WORKSPACE_PATH`、`COZE_PROJECT_ENV`、`COZE_SUPABASE_URL`、`COZE_SUPABASE_ANON_KEY`）。

#### Scenario: 环境变量清理
- **WHEN** 搜索项目源码中的 `COZE_` 前缀
- **THEN** SHALL 无任何引用
- **THEN** 开发者 SHALL 使用 `.env.local` 和标准 `NEXT_PUBLIC_*` 变量

### Requirement: 移除扣子配置文件
项目 SHALL 删除 `.coze` 配置文件，该文件仅在扣子编程平台中使用。

#### Scenario: 配置文件清理
- **WHEN** 检查项目根目录
- **THEN** `.coze` 文件 SHALL 不存在

### Requirement: 移除扣子品牌引用
项目 SHALL 更新 `src/app/layout.tsx` 中的元数据，移除 "Coze Code Team"、"Coze Code"、`code.coze.cn` 等扣子品牌信息。

#### Scenario: 元数据不含扣子品牌
- **WHEN** 查看页面 `<head>` 中的 `<meta>` 标签
- **THEN** `generator` SHALL 为 `Next.js` 或已移除
- **THEN** `authors` SHALL 不包含 "Coze" 字样
- **THEN** `openGraph.url` SHALL 指向 GitHub Pages 实际域名

### Requirement: 标准化 .npmrc
`.npmrc` SHALL 使用标准 npm registry（或 pnpm 默认 registry），移除 `npmmirror.com` 中国镜像配置。

#### Scenario: registry 配置
- **WHEN** 运行 `pnpm install` 在非中国网络环境
- **THEN** SHALL 从默认 registry 下载包，不依赖 npmmirror 镜像

### Requirement: 标准化 build/dev 脚本
`scripts/` 目录中的 bash 脚本 SHALL 被移除或简化为辅助脚本，构建和开发命令 SHALL 在 `package.json` scripts 中直接定义。

#### Scenario: package.json scripts 直接可用
- **WHEN** 运行 `pnpm dev` 或 `pnpm build`
- **THEN** SHALL 不依赖任何 bash 脚本
- **THEN** 命令 SHALL 在 Windows/macOS/Linux 上均可用
