## Why

部署到云环境（Vercel/Serverless）后，世界系统初始化和世界生成出现两个阻塞性错误：
1. `dataFiles` 中的数组值被直接传给 `path.join()` 导致 `ERR_INVALID_ARG_TYPE`；
2. 数据库模块尝试在只读文件系统 `/var/task/` 下创建 `.data` 目录导致 `ENOENT`。
此外，Mod 数据在服务端（init.ts）和客户端（ModLoader）重复加载，违背 Mod 一次性加载原则；后端 API 路由大量使用裸 `console.log` 而非 `core/logger` 统一输出。

## What Changes

- 修复 `src/app/api/init.ts` 中 `loadJsonArray`/`loadJsonObject` 对数组类型 `dataFiles` 值的不兼容处理，对齐浏览器端 `ModLoader` 的数组归一化逻辑
- 修复 `src/app/api/db/index.ts` 在 Serverless 环境下 `.data` 目录不可写的问题，改为使用 `/tmp/` 或可配置的数据目录
- 移除客户端 Mod 加载逻辑（`ModInitProvider`、`useModLoader`），Mod 数据仅在服务端加载一次
- 将 `src/app/api/` 下所有 `console.log/warn/error` 替换为 `core/logger` 的 `createLogger()` 统一输出
- `src/instrumentation.ts` 和所有 API 路由使用统一的日志实例

## Capabilities

### New Capabilities
- `serverless-db-storage`: 数据库文件存储在 Serverless 兼容路径（可配置环境变量），支持 `/tmp/` 临时目录和内存回退
- `backend-logger-unification`: 后端所有 API 模块统一使用 `core/logger` 日志系统，替换裸 `console` 调用

### Modified Capabilities
- `logger-core`: 扩展 Logger 使用范围到后端 Node.js 服务端（当前 spec 仅提及浏览器 F12 控制台），确保 `createLogger` 在 Node.js 环境同样可用
- `mod-data-bundling`: 明确 Mod 数据加载为服务端一次性行为，客户端不再执行 `ModLoader.loadAll()` 的 fetch 加载管线

## Impact

- **修改文件**: `src/app/api/init.ts`, `src/app/api/db/index.ts`, `src/instrumentation.ts`, `src/app/api/v1/worlds/generate/basic/route.ts`, `src/app/api/v1/worlds/generate/route.ts`, `src/app/api/v1/worlds/generate/details/route.ts`, `src/app/api/v1/worlds/route.ts`, `src/app/page.tsx`
- **可能删除/简化**: `src/modules/mod/hooks/useModLoader.ts`, `src/modules/mod/components/ModInitProvider.tsx`（客户端 Mod 加载移除）
- **数据库**: 原有 `.data/worlds.db` 文件路径变更，需迁移或自动重建
- **构建产物**: `public/mods/` 中的合并数据文件 `data.json` 仅服务端使用，客户端不再 fetch
- **无破坏性 API 变更**: 世界生成 API 的外部契约（请求/响应格式）不变
