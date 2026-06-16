# character-seed-system

## Purpose

角色生成引入 seed 概念，分两步：(1) worldSeed 确定性地生成 8 个角色模板（种族、天赋、属性分配），(2) 用户选择模板并自定义后创建 characterSeed，角色持久化到 SQLite。同一 worldSeed 下模板永恒一致，characterSeed 支持跨玩家复用。

## ADDED Requirements

### Requirement: worldSeed 确定性生成 8 个角色模板

给定 `worldSeed` 和 `worldviewId`，系统 SHALL 确定性地生成 8 个角色模板。相同 `worldSeed` + `worldviewId` SHALL 始终产生相同的 8 个模板。模板生成 SHALL 使用 seeded RNG（来自 `shared/utils/rng.ts`），SHALL NOT 使用 `Math.random()`。

#### Scenario: 相同种子产生相同模板

- **WHEN** 使用 seed `"a0b1c2d3"` 和 worldview `"cultivation"` 调用 `generateCharacterTemplates(worldSeed, worldviewId)` 两次
- **THEN** 两次返回的 8 个模板 SHALL 完全相等（deep equal）
- **AND** 每个模板的种族、天赋、属性分配 SHALL 相同

#### Scenario: 模板包含完整角色信息

- **WHEN** 生成角色模板
- **THEN** 每个模板 SHALL 包含：`name`, `gender`, `raceId`, `talentIds[]`, `attributes: Record<string, number>`, `derivedCoreStats: Record<CoreStatKey, number>`
- **AND** 属性 SHALL 由种族基础值 + 天赋修正 + 随机分配点构成
- **AND** 随机分配点 SHALL 由 seeded RNG 决定

#### Scenario: 不同世界观属性维度不同

- **WHEN** 使用 worldview `"cultivation"` 生成模板（5 属性）
- **AND** 使用 worldview `"tech"` 生成模板（4 属性）
- **THEN** cultivation 模板的 `attributes` SHALL 包含 5 个键
- **AND** tech 模板的 `attributes` SHALL 包含 4 个键
- **AND** tech 模板 SHALL NOT 包含"灵根"键

### Requirement: characterSeed 在选择模板后创建

用户选择一个模板并进行自定义（名字、性别、属性微调）后，系统 SHALL 生成 `characterSeed`。characterSeed SHALL 编码用户的所有自定义选择：`characterSeed = hash(worldSeed + templateIndex + customizations + timestamp)`。

#### Scenario: 同模板不同自定义产生不同 seed

- **WHEN** 用户 A 选择模板 3，改名为 "凌云"
- **AND** 用户 B 选择模板 3，改名为 "寒霜"
- **THEN** 用户 A 的 `characterSeed` SHALL NOT 等于用户 B 的 `characterSeed`
- **AND** 两个角色 SHALL 作为独立记录持久化

#### Scenario: characterSeed 在确认进入世界时生成

- **WHEN** 用户在自定义界面点击"确认进入世界"
- **THEN** 系统 SHALL 调用 `createCharacterSeed(worldSeed, templateIndex, customizations)` 生成 seed
- **AND** SHALL 在持久化前用此 seed 生成角色的最终属性
- **AND** 确认前 SHALL NOT 生成 characterSeed（避免未确认角色污染 DB）

### Requirement: 角色持久化到 SQLite characters 表

系统 SHALL 在 SQLite（`worlds.db`）中新增 `characters` 表，存储用户确认的角色。表结构 SHALL 包含：`seed`（PK）、`world_seed`、`worldview_id`、`name`、`gender`、`race_id`、`talent_ids`、`attributes`（JSON）、`core_stats`（JSON）、`created_at`、`updated_at`。

#### Scenario: 保存新角色

- **WHEN** 用户确认角色并生成 characterSeed
- **THEN** 角色 SHALL 被 UPSERT 到 `characters` 表
- **AND** `seed` 字段 SHALL 为 characterSeed
- **AND** `world_seed` SHALL 关联到当前世界

#### Scenario: 按 worldSeed 查询角色

- **WHEN** 查询 `SELECT * FROM characters WHERE world_seed = 'a0b1c2d3'`
- **THEN** SHALL 返回该世界下所有玩家创建的角色列表
- **AND** 结果 SHALL 按 `created_at` 排序

#### Scenario: 相同 seed 的角色不重复插入

- **WHEN** 尝试使用已存在的 `characterSeed` 保存角色
- **THEN** SHALL 执行 UPDATE 而非 INSERT（幂等）
- **AND** SHALL 更新 `updated_at` 时间戳

### Requirement: 角色 API 端点

系统 SHALL 提供以下角色相关 API 端点：

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/api/v1/characters/templates` | 基于 worldSeed + worldviewId 生成 8 个模板 |
| `POST` | `/api/v1/characters/save` | 保存用户确认的角色（传入自定义参数 + characterSeed） |
| `GET` | `/api/v1/characters?worldSeed=X` | 查询某世界下的所有玩家角色 |

#### Scenario: 请求角色模板

- **WHEN** 前端发送 `POST /api/v1/characters/templates` 请求体 `{ "worldSeed": "a0b1c2d3", "worldviewId": "cultivation" }`
- **THEN** 后端 SHALL 返回 8 个角色模板的数组
- **AND** 响应时间 SHALL 小于 300ms
- **AND** 模板 SHALL NOT 被持久化（仅模板，非确认角色）

#### Scenario: 保存确认角色

- **WHEN** 前端发送 `POST /api/v1/characters/save` 请求体 `{ "worldSeed": "a0b1c2d3", "templateIndex": 3, "customizations": { "name": "凌云", "gender": "男" } }`
- **THEN** 后端 SHALL 生成 characterSeed
- **AND** SHALL 保存角色到 `characters` 表
- **AND** SHALL 返回 `{ "success": true, "data": { "characterSeed": "...", "character": {...} } }`

### Requirement: 预留跨玩家遭遇扩展点

`characters` 表的查询接口 SHALL 接受 `characterType` 参数（预留，当前始终为 `"player"`），为后续 `"npc"` / `"boss"` 类型预留。角色对象 SHALL 包含 `npcTemplateVersion` 字段（当前为 `0`），用于未来 NPC 化的序列化格式版本控制。

#### Scenario: 查询接口接受 characterType 参数

- **WHEN** 调用 `GET /api/v1/characters?worldSeed=a0b1c2d3&characterType=player`
- **THEN** SHALL 返回该世界的玩家角色列表
- **AND** `characterType` 参数 SHALL 为可选，默认值 `"player"`
