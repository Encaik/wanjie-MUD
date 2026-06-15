## Context

世界生成采用分阶段架构：`/api/v1/worlds/generate/basic` 先生成基础信息（名称、描述、境界）并存入 SQLite，`/api/v1/worlds/generate/details` 再补全详情（势力、危险、机缘）。两个 API 共享同一个 SQLite 数据库（sql.js WASM），数据库通过单例 `getDb()` 管理。

当前问题：basic API 调用 `saveWorld()` 后返回成功，但 details API 的 `getWorldById()` 却查不到世界。根因分析指向两条路径：

1. **数据库持久化静默失败**：`SqlJsDatabase.#saveToDisk()` 中 `fs.writeFileSync` 的 `catch` 块完全空置，注释称"日志由外层处理"但外层并无日志。若文件写入失败（权限、磁盘满、并发竞争），`saveWorld` 在内存中成功但磁盘无数据。当模块被重新求值（Next.js 热重载触发）或请求由不同 worker 处理时，新实例从旧文件加载，数据丢失。

2. **details API 结构缺陷**：V3 路径（有 `worldviewId`）在生成详情并调用 `saveWorld` 后缺少 `return` 语句，导致代码回退到旧管线再次执行 `generateDetailsForSeed`。虽非直接导致 404 的原因，但增加了不必要的数据库操作和潜在竞态。

## Goals / Non-Goals

**Goals:**
- 数据库写入失败 SHALL 产生可见的 ERROR 日志，包含文件路径和错误原因
- basic API 在 `saveWorld()` 后 SHALL 反查验证数据确实写入，写入失败时返回 500 而非虚假成功
- details API 的 V3 路径生成成功后 SHALL 立即 `return`，不再冗余回退到旧管线
- 提供足够的诊断日志（DEBUG 级别）以便后续排查类似问题

**Non-Goals:**
- 不替换 sql.js 为其他数据库方案（如 better-sqlite3）
- 不重构整个持久化层
- 不改变 API 请求/响应的字段结构
- 不处理 `:memory:` 模式下的跨请求数据共享（内存模式天然不支持）

## Decisions

### D1: #saveToDisk 写入失败处理

**方案**：在 `catch` 块中通过 `createLogger('DB')` 输出 ERROR 级别日志，内容包含文件路径、错误消息和堆栈。不向上抛异常——保持"持久化失败不中断业务"的设计，但让失败可见。

**替代方案**：
- 抛异常中断请求：过于激进，一个磁盘问题会导致所有 API 500
- `console.error`：不符合项目的统一日志规范（`core/logger/`）
- 重试写入：增加复杂度，且大部分写入失败（如权限问题）重试无意义

### D2: basic API 写入验证

**方案**：`saveWorld()` 调用后立即调用 `getWorldById()` 反查。若反查结果为 `null`，返回 `apiError(500, '世界保存失败，请重试')`。

**替代方案**：
- 检查 `saveWorld` 的 drizzle 操作返回值（`changes` 字段）：INSERT 操作 `changes` 可能为 0（已存在但未变更），不能可靠区分"写入成功但无变更"和"写入失败"
- 不做验证，仅依赖日志：无法阻止虚假成功返回给前端

### D3: details API 补充 return

**方案**：V3 路径末尾（`return apiSuccess(...)` 之前）直接 `return`，不再回退执行旧管线。

**影响**：旧管线代码（`generateDetailsForSeed`）不会被调用，但该函数仍保留作为未指定 `worldviewId` 时的兼容路径。

### D4: 诊断日志

**方案**：在 `saveWorld` 和 `getWorldById` 中增加 DEBUG 级别日志，记录操作结果（成功/失败 + worldId）。使用模块级 `createLogger('DB')` 实例。

## Risks / Trade-offs

- **[风险] 写入验证增加一次数据库查询** → 缓解：SQLite 查询极快（<1ms），对 API 响应时间影响可忽略
- **[风险] `#saveToDisk` 错误日志可能在开发环境产生噪音** → 缓解：只在写入实际失败时触发，属异常情况；开发环境通常不会遇到磁盘权限问题
- **[风险] 补充 `return` 后旧管线路径不再被执行** → 缓解：旧管线通过"无 `worldviewId` 参数"的请求仍可触发，功能不受影响
