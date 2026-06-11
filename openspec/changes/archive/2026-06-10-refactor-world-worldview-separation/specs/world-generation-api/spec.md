# world-generation-api

世界生成 API — 前端通过 REST API 请求后端基于指定世界观生成世界实例，支持批量生成、分阶段生成（基本信息/详情）。世界生成逻辑统一到 `core/world/` 作为纯函数。

## ADDED Requirements

### Requirement: 统一的 worldGenerate 纯函数

系统 SHALL 在 `src/core/world/generateWorld.ts` 中提供 `generateWorld(worldview, seed, ascensionCount)` 纯函数，从 `WorldviewDefinition` 和种子生成 `World` 实例。该函数 SHALL 是确定性纯函数——相同输入 SHALL 产生相同输出。

#### Scenario: generateWorld 产出完整 World

- **WHEN** 调用 `generateWorld(worldview, "abc12345", 0)`
- **THEN** SHALL 返回符合 `World` 接口的完整对象
- **AND** `worldviewId` SHALL 等于 `worldview.id`
- **AND** `name` SHALL 由 `worldview.namePrefixes[seed]` + `worldview.nameSuffixes[seed]` 组合
- **AND** `description` SHALL 从 `worldview.descriptions` 中确定性选取
- **AND** `realmSystem` SHALL 从 `worldview.realmSystem` 复制
- **AND** `factions` SHALL 从 `worldview.factions` 中确定性选取
- **AND** `dangers` SHALL 从 `worldview.dangers` 中确定性选取
- **AND** `opportunities` SHALL 从 `worldview.opportunities` 中确定性选取
- **AND** `baseCoefficient` SHALL 等于 `worldview.baseCoefficient`
- **AND** `actualCoefficient` SHALL 通过 `calculateWorldDifficultyCoefficient()` 计算

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

### Requirement: 世界观列表 API 端点

系统 SHALL 提供 `GET /api/v1/worldviews` 端点，返回所有可用世界观的摘要列表。

#### Scenario: 获取世界观列表

- **WHEN** 前端发起 `GET /api/v1/worldviews`
- **THEN** 后端 SHALL 返回所有 `WorldDataRegistry` 中已注册世界观的摘要
- **AND** 每个摘要 SHALL 包含 `id`、`name`、`description`、`visualConfig`、`tags`
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

### Requirement: 分阶段世界生成

系统 SHALL 支持分阶段世界生成：先快速生成基本信息（名称、描述、境界），再异步生成详细信息（门派、危险、机遇），以优化首次加载体验。

#### Scenario: 生成世界基本信息

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/basic` 请求体 `{ "worldviewId": "cultivation", "count": 10 }`
- **THEN** 后端 SHALL 生成 10 个世界的名称、描述、境界系统和难度
- **AND** 返回的每个世界 SHALL 包含 `id`、`worldviewId`、`name`、`description`、`realmSystem`、`difficulty`、`baseCoefficient`、`actualCoefficient`
- **AND** 响应时间 SHALL 小于 500ms

#### Scenario: 补充世界详细信息

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/details` 请求体 `{ "seed": "abc12345" }`
- **THEN** 后端 SHALL 为已存在的世界生成 factions、dangers、opportunities
- **AND** 返回的 World 对象 SHALL 包含完整的 faction/danger/opportunity 数据
