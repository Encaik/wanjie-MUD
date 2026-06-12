## Why

`POST /api/v1/worlds/generate/basic` 成功生成世界并返回数据后，`POST /api/v1/worlds/generate/details` 却报错"世界不存在，请先生成基础信息"。basic 接口虽然调用了 `saveWorld()` 并返回了世界数据，但数据库持久化可能存在静默失败——`SqlJsDatabase.#saveToDisk()` 中的 `catch` 块完全吞掉了写入错误，导致数据实际未写入磁盘却无任何日志提示。当 SQLite 回退到 `:memory:` 模式或文件写入失败时，世界数据在请求之间丢失，details API 自然查不到。

## What Changes

- **数据库写入失败不再静默吞错**：`#saveToDisk()` 改为记录 ERROR 级别日志，包含文件路径和错误原因
- **内存模式显式告警**：当数据库回退到 `:memory:` 模式时，API 响应附带 warning 提示数据不持久
- **basic API 写入验证**：`saveWorld()` 调用后反查确认数据确实写入成功，写入失败时返回 500 而非虚假成功
- **details API 结构修复**：V3 路径（有 `worldviewId`）生成详情后缺少 `return` 语句，导致冗余地回退到旧管线再执行一次——补上缺失的 `return`
- **数据库操作增加诊断日志**：`saveWorld` 和 `getWorldById` 增加 debug 级别日志，便于排查类似问题

## Capabilities

### New Capabilities
<!-- 无新增能力，本次为缺陷修复 -->

### Modified Capabilities
- `world-generation-api`: 补充分阶段生成的数据一致性和错误处理需求（basic 写入验证、details 缺失 return、静默吞错修复）

## Impact

- **Affected code**: `src/app/api/db/sqljs-wrapper.ts` (#saveToDisk 错误日志)、`src/app/api/v1/worlds/store.ts` (写入验证 + 诊断日志)、`src/app/api/v1/worlds/generate/basic/route.ts` (写入验证)、`src/app/api/v1/worlds/generate/details/route.ts` (补充 return + 诊断日志)
- **API contract**: 不兼容变更——basic API 在数据库写入失败时从"返回虚假成功"变为"返回 500 错误"
- **Dependencies**: 无新增依赖
