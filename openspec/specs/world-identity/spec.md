# world-identity

## Purpose

定义世界唯一 ID 生成规则、世界 JSON 快照格式，以及玩家评分与 ID 的关联存储。

## Requirements

### Requirement: 世界生成后拥有唯一 ID

每个生成的世界实例 SHALL 拥有唯一且确定性的 ID。ID 格式 SHALL 基于世界来源确定。

#### Scenario: 随机生成世界的 ID 格式
- **WHEN** `wanjie-core` mod 的随机生成器使用 seed `"a0b1c2d3"` 生成一个 `'修仙'` 类型世界
- **THEN** 该世界的 `id` SHALL 为 `"wanjie-core:修仙:a0b1c2d3"`
- **AND** 使用相同 providerId、worldType、seed 再次生成 SHALL 得到相同 ID

#### Scenario: 固化模板世界的 ID 格式
- **WHEN** `wanjie-template` mod 的模板 `"huanjing"` 被加载为世界
- **THEN** 该世界的 `id` SHALL 为 `"wanjie-template:tpl:huanjing"`
- **AND** 模板世界的 ID SHALL NOT 包含 seed 字段

#### Scenario: ID 分段解析
- **WHEN** 代码需要从 worldId 中提取 providerId、worldType 和 seed
- **THEN** `parseWorldId(worldId)` 工具函数 SHALL 返回 `{ providerId, worldType, seed? }` 对象
- **AND** 对于模板世界，seed SHALL 为 `undefined`

### Requirement: 世界 ID 在生成时确定，不可变

世界的 `id` SHALL 在 `generateWorld()` 调用时确定，后续 SHALL NOT 被修改。

#### Scenario: 世界对象包含不变 ID
- **WHEN** `World` 对象被创建
- **THEN** `world.id` SHALL 为非空字符串
- **AND** 任何后续操作 SHALL NOT 修改 `world.id`

#### Scenario: 飞升后新世界有新 ID
- **WHEN** 玩家飞升到新世界
- **THEN** 新世界 SHALL 有全新的 `id`（新的 seed 或新的模板 ID）
- **AND** SHALL NOT 复用旧世界的 ID

### Requirement: localStorage 评分按世界 ID 关联

所有评分数据 SHALL 以 worldId 为主键存储。同一 worldId 的多次评分 SHALL 在本地聚合。

#### Scenario: 评分与 ID 关联
- **WHEN** 两个玩家各自游玩 worldId 为 `"wanjie-core:修仙:a0b1c2d3"` 的世界并分别评分
- **THEN** 评分数据 SHALL 在同一个 worldId 键下聚合
- **AND** `ratingCount` SHALL 为 2，`totalScore` SHALL 为两次评分之和

#### Scenario: 同一世界类型不同种子不同 ID
- **WHEN** 两个随机世界类型都是 `'修仙'` 但种子不同（`a0b1c2d3` vs `e4f5g6h7`）
- **THEN** 两个世界的 ID SHALL 不同
- **AND** 对它们的评分 SHALL 分别存储，互不影响

### Requirement: 世界快照包含游戏版本

世界生成后产出的 JSON 快照 SHALL 包含 `gameVersion` 字段，记录世界生成时的游戏版本号。此版本号用于后续加载快照时进行兼容性检查。

#### Scenario: 世界快照记录游戏版本
- **WHEN** 一个世界被生成并导出为 JSON 快照
- **THEN** 快照 SHALL 包含 `gameVersion` 字段，值为生成时的 `GAME_VERSION`（如 `"0.1.0"`）
- **AND** 该字段 SHALL NOT 在后续加载时被修改

#### Scenario: 加载快照时检查版本
- **WHEN** 从 localStorage 加载一个世界快照
- **THEN** 系统 SHALL 比较快照的 `gameVersion` 与当前 `GAME_VERSION`
- **AND** 如果主版本号不匹配，SHALL 在加载前提示玩家可能存在兼容性问题

### Requirement: 世界 ID 工具函数

系统 SHALL 提供以下世界 ID 工具函数，放在 `shared/lib/world/identity.ts`：

- `createWorldId(providerId, worldType, seed?)` -- 构造世界 ID
- `parseWorldId(worldId)` -- 解析世界 ID 为组成部分
- `isTemplateWorldId(worldId)` -- 判断是否为模板世界
- `extractSeed(worldId)` -- 提取种子（模板世界返回 undefined）

#### Scenario: createWorldId 构造正确格式
- **WHEN** 调用 `createWorldId('wanjie-core', '修仙', 'a0b1c2d3')`
- **THEN** SHALL 返回 `"wanjie-core:修仙:a0b1c2d3"`

#### Scenario: parseWorldId 解析正确
- **WHEN** 调用 `parseWorldId("wanjie-core:修仙:a0b1c2d3")`
- **THEN** SHALL 返回 `{ providerId: "wanjie-core", worldType: "修仙", seed: "a0b1c2d3" }`

#### Scenario: isTemplateWorldId 判断模板
- **WHEN** 调用 `isTemplateWorldId("wanjie-template:tpl:huanjing")`
- **THEN** SHALL 返回 `true`
- **AND** 调用 `isTemplateWorldId("wanjie-core:修仙:a0b1c2d3")` SHALL 返回 `false`
