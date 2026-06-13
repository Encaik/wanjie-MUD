# world-generation-api

世界生成 API — 前端通过 REST API 请求后端基于指定世界观生成世界实例，支持批量生成、分阶段生成（基本信息/详情）。世界生成逻辑统一到 `core/world/` 作为纯函数。

## ADDED Requirements

### Requirement: 统一的 worldGenerate 纯函数

系统 SHALL 在 `src/core/world/generateWorld.ts` 中提供 `generateWorld(worldview, seed, ascensionCount)` 纯函数，从 `WorldviewDefinition` 和种子生成 `World` 实例。该函数 SHALL 是确定性纯函数——相同输入 SHALL 产生相同输出。

#### Scenario: generateWorld 产出包含属性定义

- **WHEN** 调用 `generateWorld(worldview, "abc12345", 0)`
- **THEN** SHALL 返回符合 `World` 接口的完整对象
- **AND** `worldviewId` SHALL 等于 `worldview.id`
- **AND** `name` SHALL 由 `worldview.namePrefixes[seed]` + `worldview.nameSuffixes[seed]` 组合
- **AND** `description` SHALL 从 `worldview.descriptions` 中确定性选取
- **AND** `realmSystem` SHALL 从 `worldview.realmSystem` 复制
- **AND** SHALL 包含 `attributeDefinitions: AttributeDefinition[]`（从 worldview 携带）
- **AND** SHALL 包含 `coreStatFormulas: CoreStatBaseValues`（从 worldview 携带）
- **AND** SHALL 包含 `racePool: string[]`（从 worldview 携带）
- **AND** `baseCoefficient` SHALL 等于 `worldview.baseCoefficient`
- **AND** `actualCoefficient` SHALL 通过 `calculateWorldDifficultyCoefficient()` 计算

#### Scenario: generateWorld 不再在 World 中生成 factions/dangers

- **WHEN** 调用 `generateWorld(worldview, seed, 0)` 生成基础世界
- **THEN** `factions`、`dangers`、`opportunities` 字段 SHALL 为空或仅含占位值
- **AND** 这些字段 SHALL 在 `generateWorldDetails(worldview, seed)` 调用后才填充

#### Scenario: generateWorld 确定性

- **WHEN** 使用相同 `worldview`、`seed`、`ascensionCount` 调用 `generateWorld` 两次
- **THEN** 两次返回的 `World` 对象 SHALL 完全相等（deep equal）
- **AND** 函数 SHALL NOT 使用 `Math.random()`
- **AND** 函数 SHALL NOT 依赖外部可变状态

#### Scenario: generateWorlds 批量生成

- **WHEN** 调用 `generateWorlds(worldview, ["seed1", "seed2", "seed3"], 0)`
- **THEN** SHALL 返回 3 个 `World` 对象
- **AND** 每个世界 SHALL 具有不同的 name 和 description
- **AND** 每个世界 SHALL 共享相同的 `worldviewId`

### Requirement: 世界生成 API 端点

系统 SHALL 提供 `POST /api/v1/worlds/generate` 端点，接收前端请求并返回生成的世界实例。生成逻辑 SHALL 调用 `core/world/generateWorld.ts` 的纯函数。

#### Scenario: 生成单个世界

- **WHEN** 前端发送 `POST /api/v1/worlds/generate` 请求体 `{ "worldviewId": "cultivation", "seed": "abc12345" }`
- **THEN** 后端 SHALL 从 `WorldDataRegistry` 获取 `worldviewId="cultivation"` 的 `WorldviewDefinition`
- **AND** SHALL 调用 `generateWorld(worldview, "abc12345", 0)` 生成世界
- **AND** SHALL 将生成的世界存入 SQLite（幂等：相同 seed 不重复生成）
- **AND** SHALL 返回 JSON 响应 `{ "success": true, "data": <World> }`

#### Scenario: 批量生成世界

- **WHEN** 前端发送 `POST /api/v1/worlds/generate` 请求体 `{ "worldviewId": "cultivation", "count": 5 }`
- **THEN** 后端 SHALL 自动生成 5 个随机 seed
- **AND** SHALL 生成 5 个世界实例
- **AND** SHALL 返回 `{ "success": true, "data": [<World>, ...] }`

#### Scenario: 指定世界观类型生成

- **WHEN** 前端发送 `POST /api/v1/worlds/generate` 请求体 `{ "worldviewId": "martial", "seed": "xyz" }`
- **THEN** 后端 SHALL 使用 "martial" 世界观的定义生成世界
- **AND** 生成世界的 `type` 字段 SHALL 为中文显示名（如 "高武"）
- **AND** 生成世界的 `worldviewId` SHALL 为 "martial"

#### Scenario: 世界观不存在时报错

- **WHEN** 前端发送 `POST /api/v1/worlds/generate` 请求体 `{ "worldviewId": "nonexistent" }`
- **THEN** 后端 SHALL 返回 `{ "success": false, "error": "世界观 'nonexistent' 未注册" }`
- **AND** HTTP 状态码 SHALL 为 400

### Requirement: 世界观列表 API 返回属性定义

系统 SHALL 提供 `GET /api/v1/worldviews` 端点，返回所有可用世界观的摘要列表。世界观摘要 SHALL 包含 `attributeCount`（属性数量）和 `raceCount`（可用种族数量），供前端世界选择页面展示。

#### Scenario: 获取世界观列表（含属性摘要）

- **WHEN** 前端发起 `GET /api/v1/worldviews`
- **THEN** 后端 SHALL 返回所有 `WorldDataRegistry` 中已注册世界观的摘要
- **AND** 每个摘要 SHALL 包含 `id`、`name`、`description`、`visualConfig`、`tags`
- **AND** 每个摘要 SHALL 包含 `attributeCount: number` 字段
- **AND** SHALL 包含 `raceCount: number` 字段
- **AND** SHALL 包含 `attributePreview: string[]`（前 3 个属性显示名）
- **AND** 摘要 SHALL NOT 包含完整的生成池数据（`namePrefixes`、`nameSuffixes`、`descriptions` 等数组）

#### Scenario: 获取单个世界观详情

- **WHEN** 前端发起 `GET /api/v1/worldviews/cultivation`
- **THEN** 后端 SHALL 返回 `cultivation` 世界观的完整定义
- **AND** 包含生成池数据（用于前端展示世界观特色）

### Requirement: 前端通过 API 生成世界

前端的世界选择页面 SHALL 通过 API 调用生成世界，SHALL NOT 在客户端本地生成世界。前端 SHALL 删除对 `modules/identity/logic/generators.ts` 中 `generateWorld` 的直接调用。

#### Scenario: 世界选择页通过 API 获取世界

- **WHEN** 世界选择页加载
- **THEN** 前端 SHALL 先调用 `GET /api/v1/worldviews` 获取可用世界观列表
- **AND** 用户选择世界观后 SHALL 调用 `POST /api/v1/worlds/generate` 生成世界实例
- **AND** SHALL NOT 在前端代码中直接 import `generateWorld` 函数

#### Scenario: 前端无本地生成回退

- **WHEN** API 请求失败
- **THEN** 前端 SHALL 显示错误提示（如 "世界生成失败，请检查网络连接"）
- **AND** SHALL NOT 回退到客户端本地生成

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

### Requirement: 分阶段世界生成

系统 SHALL 支持分阶段世界生成：先快速生成基本信息（名称、描述、境界、属性定义），再异步生成详细信息（门派、危险、机遇），以优化首次加载体验。

`POST /api/v1/worlds/generate/basic` SHALL 生成包含 `attributeDefinitions` 和 `coreStatFormulas` 的基础世界，供前端初始化属性面板。

`POST /api/v1/worlds/generate/details` SHALL 基于已有基础世界填充 factions/dangers/opportunities。新管线路径 SHALL 从 DB 查询已有世界、调用 `generateWorldDetails()`、合并后持久化。

#### Scenario: 生成世界基本信息

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/basic` 请求体 `{ "worldviewId": "cultivation", "count": 10 }`
- **THEN** 后端 SHALL 生成 10 个世界的名称、描述、境界系统和难度
- **AND** 返回的每个世界 SHALL 包含 `id`、`worldviewId`、`name`、`description`、`realmSystem`、`difficulty`、`baseCoefficient`、`actualCoefficient`
- **AND** 返回的每个世界 SHALL 包含 `attributeDefinitions` 字段（供前端动态构建属性面板 UI）
- **AND** 每个生成的世界 SHALL 通过 `saveWorld()` 存入数据库
- **AND** 每个世界的写入 SHALL 通过反查验证确认成功
- **AND** 若任一世界写入验证失败，SHALL 返回 500 错误
- **AND** 响应时间 SHALL 小于 500ms

#### Scenario: 补充世界详细信息（有 worldviewId，新管线）

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/details` 请求体 `{ "seed": "abc12345", "worldviewId": "cultivation" }`
- **THEN** 后端 SHALL 通过 `getWorldById` 查询该 seed 对应的世界是否存在
- **AND** 若不存在 SHALL 返回 404 错误 `世界 "abc12345" 不存在，请先生成基础信息`
- **AND** 若存在 SHALL 调用 `generateWorldDetails(worldview, seed)` 生成详情字段
- **AND** SHALL 合并到已有世界并 `saveWorld()` 持久化
- **AND** SHALL 直接返回成功响应，SHALL NOT 回退到旧管线二次执行
- **AND** 若已存在详情 SHALL 幂等返回

#### Scenario: 补充世界详细信息（无 worldviewId，旧管线兼容）

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/details` 请求体 `{ "seed": "abc12345" }`（无 `worldviewId` 字段）
- **THEN** 后端 SHALL 使用旧管线 `generateDetailsForSeed` 处理请求
- **AND** 若 `generateDetailsForSeed` 返回 null，SHALL 返回 404 错误
- **AND** 若成功，SHALL 返回包含完整 faction/danger/opportunity 数据的 World 对象
