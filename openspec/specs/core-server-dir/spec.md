# core-server-dir

## Purpose

为服务端非业务核心代码建立统一存放目录，避免散落在 `src/` 根目录。

## Requirements

### Requirement: 服务端核心代码目录

项目 SHALL 在 `src/core/server/` 下建立统一的服务器端非业务核心代码存放目录。

#### Scenario: 目录结构
- **WHEN** 查看 `src/core/` 目录
- **THEN** 存在 `server/` 子目录，与 `calculation/`、`engine/`、`events/` 等核心子目录平级

#### Scenario: 目录定位
- **WHEN** 需要放置服务器端基础设施代码
- **THEN** 优先放入 `src/core/server/`，而非散落在 `src/` 根目录或其他位置

### Requirement: instrumentation.ts 迁移

项目 SHALL 将 `src/instrumentation.ts` 的实际实现迁移到 `src/core/server/instrumentation.ts`，并在原位置保留薄层 re-export 以兼容 Next.js 约定。

#### Scenario: 实现迁移
- **WHEN** 系统启动时 Next.js 调用 `register()`
- **THEN** 执行逻辑位于 `src/core/server/instrumentation.ts` 中的 `register` 函数

#### Scenario: 根目录保留钩子
- **WHEN** Next.js 在 `src/` 下查找 `instrumentation.ts`
- **THEN** `src/instrumentation.ts` 存在且仅包含重导出语句：`export { register } from '@/core/server/instrumentation';`

#### Scenario: 功能不变
- **WHEN** 执行 `register()` 钩子
- **THEN** 行为与迁移前完全一致：在 Node.js 运行时调用 `ensureWorldSystemInitialized()` 初始化世界系统

### Requirement: core/server 默认导出

`src/core/server/` SHALL 包含 `index.ts` 桶导出文件，统一导出该目录下的公开接口。

#### Scenario: 桶文件存在
- **WHEN** 导入 `@/core/server`
- **THEN** 可访问该目录下所有公开导出（至少包含 `register`）
