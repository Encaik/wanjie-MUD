## Context

万界修行录在生产部署（Vercel/Serverless）后，世界系统初始化和生成流程出现两个阻塞性错误。当前架构中，Mod 数据加载存在三处不一致：

1. **双轨加载**：服务端 `ensureWorldSystemInitialized()` 通过 `fs` 直读文件系统；客户端 `ModLoader.loadAll()` 通过 `fetch` 重新加载相同数据。违背 Mod 一次性加载约束。
2. **`dataFiles` 格式不兼容**：浏览器端 `ModLoader.loadModDataAndRegister()` 对 `dataFiles` 值做了 `Array.isArray` 归一化处理（`ModLoader.ts:362`），但服务端 `init.ts` 的 `loadJsonArray`/`loadJsonObject` 缺少此逻辑，直接将数组传给 `path.join()`。
3. **数据库路径硬编码**：`src/app/api/db/index.ts` 使用 `process.cwd() + '/.data'` 作为数据库目录，在 Serverless 环境（`/var/task/`）不可写。
4. **日志不统一**：后端 API 路由使用裸 `console.log`，未遵循 `core/logger` 统一输出规范。

## Goals / Non-Goals

**Goals:**
- 修复 `dataFiles` 数组值传给 `path.join()` 导致的 `ERR_INVALID_ARG_TYPE` 错误
- 修复 Serverless 环境下 `.data` 目录不可写导致的 `ENOENT` 错误
- 移除客户端 Mod 加载逻辑，确保 Mod 数据仅在服务端加载一次
- 后端所有 API 模块统一使用 `core/logger` 的 `createLogger()` 输出日志

**Non-Goals:**
- 不改变世界生成 API 的外部契约（请求/响应格式不变）
- 不修改 `ModLoader` 的核心加载管线（保留 `core/mod/ModLoader.ts` 作为可复用基础设施，仅取消客户端的调用）
- 不改变数据库 schema 或迁移现有数据
- 不处理日志持久化或远程上报（那是后续需求）

## Decisions

### Decision 1: `dataFiles` 数组归一化

**方案**: 在 `loadModFromDisk()` 中，对每个 content type 的 `dataFiles` 值统一做 `Array.isArray` 判断。如是数组，遍历数组逐一加载；如是字符串，保持原逻辑。

```typescript
// 修改后的 init.ts loadModFromDisk
const dataPathValue = manifest.dataFiles[contentType];
if (!dataPathValue) { continue; }
const dataPaths = Array.isArray(dataPathValue) ? dataPathValue : [dataPathValue];
for (const filePath of dataPaths) {
  const item = loadSingleFile(baseDir, filePath, contentType);
  if (item) registry.register(item);
}
```

**替代方案**: 修改 `loadJsonArray`/`loadJsonObject` 函数签名接受 `string | string[]`。但会破坏函数职责单一性（一个读文件、一个做归一化），不采用。

### Decision 2: 数据库目录可配置

**方案**: 引入环境变量 `WANJIE_DATA_DIR`（默认 `path.join(process.cwd(), '.data')`），并在 Serverless 环境建议设置为 `/tmp/wanjie-data`。若目标目录不可写且非 Serverless 环境，回退到内存数据库（`:memory:` SQLite）。

```typescript
const DATA_DIR = process.env.WANJIE_DATA_DIR 
  || path.resolve(process.cwd(), '.data');
```

`ensureDatabase()` 中若 `mkdirSync` 失败且为 `ENOENT/EACCES`，自动尝试 `/tmp/wanjie-data`，均失败则回退 `:memory:`。

**替代方案**: 全部使用 `:memory:` 数据库。但 Serverless 函数冷启动会丢失数据，不满足持久化需求。Vercel 的 `/tmp/` 目录在同一次部署的生命周期内持久存在，可满足需求。

### Decision 3: 客户端 Mod 加载移除

**方案**: 保留 `core/mod/ModLoader.ts`（基础设施，可能被其他功能复用），但移除 `modules/mod/hooks/useModLoader.ts` 和 `modules/mod/components/ModInitProvider.tsx` 中的客户端加载调用。`app/page.tsx` 不再依赖 `useModContext()` 的 `phase` 判断来阻塞启动——Mod 数据已在服务端就绪。

**保留的客户端逻辑**:
- `ModLoader` 类（`core/mod/ModLoader.ts`）: 保留，其他模块可能有测试或工具脚本引用
- `ModLoadingOverlay` 组件: 保留，但不再由 Mod 加载触发
- `ModErrorBanner` 组件: 保留，可用于显示其他非致命警告

**移除的客户端逻辑**:
- `useModLoader` Hook: `modules/mod/hooks/useModLoader.ts` — 移除
- `ModInitProvider`: `modules/mod/components/ModInitProvider.tsx` — 移除或简化为无操作
- `app/page.tsx` 中 `useModContext()` 调用 — 替换为简单状态

**替代方案**: 在 `ModLoader` 类中增加环境检测（`typeof window !== 'undefined'`），客户端自动跳过。但会增加类复杂度且违反单一职责，不采用。

### Decision 4: 后端日志统一

**方案**: 为每个后端 API 模块创建 `createLogger` 实例替换裸 `console` 调用：

| 模块 | 命名空间 | 文件 |
|------|---------|------|
| init.ts | `API Init` | `src/app/api/init.ts` |
| db/index.ts | `DB` | `src/app/api/db/index.ts` |
| basic/route.ts | `Basic` | `src/app/api/v1/worlds/generate/basic/route.ts` |
| generate/route.ts | `Generate` | `src/app/api/v1/worlds/generate/route.ts` |
| details/route.ts | `Details Generate` | `src/app/api/v1/worlds/generate/details/route.ts` |
| worlds/route.ts | `Worlds` | `src/app/api/v1/worlds/route.ts` |
| instrumentation.ts | `Instrumentation` | `src/instrumentation.ts` |

`core/logger` 在 Node.js 环境输出到 `process.stdout`/`process.stderr`（通过 `console.debug/info/warn/error`），与浏览器行为一致，无需修改 logger 核心逻辑。

## Risks / Trade-offs

- **[数据目录迁移]**: 现有用户的 `.data/worlds.db` 文件位于旧路径，部署后新路径为空数据库。风险：已生成的世界数据在部署后丢失。→ 缓解：首次启动时检测旧路径文件是否存在，若存在且新路径为空，自动复制。
- **[冷启动丢失]**: 若回退到 `:memory:` 数据库（磁盘不可用），Serverless 冷启动会丢失数据。→ 缓解：优先使用 `/tmp/`，仅在极端情况下回退；若检测到内存数据库启动，输出 WARN 日志警告。
- **[客户端兼容]**: 移除 `ModInitProvider` 可能影响依赖 `useModContext()` 的现有组件。→ 缓解：提供 `useModContext()` 的 safe default（phase='ready'），现有组件无需修改。

## Migration Plan

1. 修改后端代码（init.ts, db/index.ts, 各 route.ts, instrumentation.ts）
2. 修改客户端代码（移除 useModLoader, 简化 ModInitProvider, page.tsx）
3. 本地验证：`pnpm dev` + `pnpm build` + `pnpm ts-check`
4. 部署后验证：检查 API 日志中无 `ERR_INVALID_ARG_TYPE` 和 `ENOENT`
5. 回滚策略：Git revert，无数据库 schema 变更

## Open Questions

- Vercel `/tmp/` 目录大小限制 512MB，对于 MUD 游戏世界数据是否足够？→ 暂认为足够，后续若不够可引入 Supabase 远程存储
- 是否需要保留 `ModLoader` 类的完整测试？→ 保留，`ModLoader.test.ts` 现有测试继续维护
