## ADDED Requirements

### Requirement: Next.js 静态导出配置
项目 SHALL 配置 `next.config.ts` 以支持 `output: 'export'`，构建后生成纯静态文件到 `out/` 目录。

#### Scenario: 成功构建静态站点
- **WHEN** 运行 `pnpm build` 命令
- **THEN** Next.js SHALL 将每个页面预渲染为静态 HTML 文件，输出到 `out/` 目录
- **THEN** 构建过程 SHALL 不依赖任何 Node.js 运行时功能（如 `cookies()`、`headers()`、`fs`）

#### Scenario: 动态路由预生成
- **WHEN** 项目中存在使用 `[param]` 的动态路由页面
- **THEN** 该页面 SHALL 通过 `generateStaticParams` 预生成所有可能的静态路径
- **THEN** 对于无法预知的动态参数，SHALL 提供 fallback 机制或静态提示页面

### Requirement: 客户端兼容性
所有页面 SHALL 标记为客户端组件（`'use client'`）或使用静态渲染，确保无服务端逻辑依赖。

#### Scenario: 页面加载不依赖服务端
- **WHEN** 用户在浏览器中打开任意页面
- **THEN** 页面 SHALL 正常渲染，不触发服务端 API 调用
- **THEN** 所有数据获取 SHALL 通过客户端 Supabase SDK 或静态 JSON 文件完成

### Requirement: 构建脚本标准化
`package.json` 中的 scripts SHALL 使用标准 Next.js CLI 命令，不再依赖外部 bash 脚本。

#### Scenario: 使用标准命令开发
- **WHEN** 运行 `pnpm dev`
- **THEN** SHALL 启动 Next.js 内置开发服务器（`next dev`）
- **THEN** 不再执行 `scripts/dev.sh` 或任何自定义启动逻辑

#### Scenario: 使用标准命令构建
- **WHEN** 运行 `pnpm build`
- **THEN** SHALL 执行 `next build` 进行生产构建
- **THEN** 不再调用 `tsup` 编译自定义服务器
