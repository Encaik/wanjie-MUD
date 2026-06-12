## ADDED Requirements

### Requirement: 数据库写入失败可见性

`SqlJsDatabase.#saveToDisk()` 在文件写入失败时 SHALL 通过 `createLogger('DB')` 输出 ERROR 级别日志，日志 SHALL 包含文件路径、错误消息和堆栈信息。

#### Scenario: 文件写入失败时记录错误日志

- **WHEN** `#saveToDisk()` 调用 `fs.writeFileSync` 抛出异常
- **THEN** SHALL 输出 ERROR 日志，格式为 `数据库持久化失败，数据可能丢失: <filePath> - <error.message>`
- **AND** SHALL NOT 向上抛出异常（保持"持久化失败不中断业务"的语义）

#### Scenario: :memory: 模式跳过写入

- **WHEN** `filePath` 为 `:memory:`
- **THEN** `#saveToDisk()` SHALL 直接返回，不做任何操作且不输出日志

### Requirement: basic API 写入后验证

`POST /api/v1/worlds/generate/basic` 在调用 `saveWorld()` 后 SHALL 立即通过 `getWorldById()` 反查验证数据确实写入。若反查结果为 `null`，SHALL 返回 500 错误而非虚假成功。

#### Scenario: 写入成功时正常返回

- **WHEN** `saveWorld(world)` 调用完成
- **AND** `getWorldById(world.id)` 返回非 null 结果
- **THEN** SHALL 正常返回生成的 World 对象

#### Scenario: 写入失败时返回错误

- **WHEN** `saveWorld(world)` 调用完成
- **AND** `getWorldById(world.id)` 返回 null
- **THEN** SHALL 返回 500 错误，消息为 `世界保存验证失败：数据未写入数据库`
- **AND** SHALL 输出 ERROR 级别日志记录该 world 的 id

## MODIFIED Requirements

### Requirement: 分阶段世界生成

系统 SHALL 支持分阶段世界生成：先快速生成基本信息（名称、描述、境界），再异步生成详细信息（门派、危险、机遇），以优化首次加载体验。

#### Scenario: 生成世界基本信息

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/basic` 请求体 `{ "worldviewId": "cultivation", "count": 10 }`
- **THEN** 后端 SHALL 生成 10 个世界的名称、描述、境界系统和难度
- **AND** 返回的每个世界 SHALL 包含 `id`、`worldviewId`、`name`、`description`、`realmSystem`、`difficulty`、`baseCoefficient`、`actualCoefficient`
- **AND** 每个生成的世界 SHALL 通过 `saveWorld()` 存入数据库
- **AND** 每个世界的写入 SHALL 通过反查验证确认成功
- **AND** 若任一世界写入验证失败，SHALL 返回 500 错误
- **AND** 响应时间 SHALL 小于 500ms

#### Scenario: 补充世界详细信息（有 worldviewId）

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/details` 请求体 `{ "seed": "abc12345", "worldviewId": "cultivation" }`
- **THEN** 后端 SHALL 通过 `getWorldById` 查询该 seed 对应的世界是否存在
- **AND** 若不存在 SHALL 返回 404 错误 `世界 "abc12345" 不存在，请先生成基础信息`
- **AND** 若存在 SHALL 调用 `generateWorldDetails` 生成详情并合并到世界对象
- **AND** SHALL 通过 `saveWorld` 更新数据库
- **AND** SHALL 直接返回成功响应，SHALL NOT 回退到旧管线二次执行

#### Scenario: 补充世界详细信息（无 worldviewId，旧管线兼容）

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/details` 请求体 `{ "seed": "abc12345" }`（无 `worldviewId` 字段）
- **THEN** 后端 SHALL 使用旧管线 `generateDetailsForSeed` 处理请求
- **AND** 若 `generateDetailsForSeed` 返回 null，SHALL 返回 404 错误
- **AND** 若成功，SHALL 返回包含完整 faction/danger/opportunity 数据的 World 对象
