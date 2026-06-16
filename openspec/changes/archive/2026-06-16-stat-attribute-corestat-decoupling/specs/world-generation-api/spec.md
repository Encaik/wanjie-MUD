# world-generation-api (Delta)

## MODIFIED Requirements

### Requirement: 统一的 worldGenerate 纯函数

系统 SHALL 在 `src/core/world/generateWorld.ts` 中提供 `generateWorld(worldview, seed, ascensionCount)` 纯函数，从 `WorldviewDefinition` 和种子生成 `World` 实例。该函数 SHALL 是确定性纯函数——相同输入 SHALL 产生相同输出。

生成的 `World` 对象 SHALL 包含 `attributeDefinitions`（从 worldview 直接携带）和 `coreStatFormulas`（从 worldview 直接携带），供前端动态渲染属性面板和计算核心值。

#### Scenario: generateWorld 产出包含属性定义

- **WHEN** 调用 `generateWorld(worldview, "abc12345", 0)`
- **THEN** 返回的 `World` SHALL 包含 `attributeDefinitions: AttributeDefinition[]`（从 worldview 携带）
- **AND** SHALL 包含 `coreStatFormulas: CoreStatBaseValues`（从 worldview 携带）
- **AND** SHALL 包含 `racePool: string[]`（从 worldview 携带）

#### Scenario: generateWorld 不再在 World 中生成 factions/dangers

- **WHEN** 调用 `generateWorld(worldview, seed, 0)` 生成基础世界
- **THEN** `factions`、`dangers`、`opportunities` 字段 SHALL 为空或仅含占位值
- **AND** 这些字段 SHALL 在 `generateWorldDetails(worldview, seed)` 调用后才填充

### Requirement: 分阶段世界生成

系统 SHALL 支持分阶段世界生成：先快速生成基本信息（名称、描述、境界、属性定义），再异步生成详细信息（门派、危险、机遇），以优化首次加载体验。

`POST /api/v1/worlds/generate/basic` SHALL 生成包含 `attributeDefinitions` 和 `coreStatFormulas` 的基础世界，供前端初始化属性面板。

`POST /api/v1/worlds/generate/details` SHALL 基于已有基础世界填充 factions/dangers/opportunities。新管线路径 SHALL 从 DB 查询已有世界、调用 `generateWorldDetails()`、合并后持久化。

#### Scenario: 生成世界基本信息包含属性定义

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/basic` 请求体 `{ "worldviewId": "cultivation", "count": 10 }`
- **THEN** 返回的每个世界 SHALL 包含 `attributeDefinitions` 字段
- **AND** 前端可据此动态构建属性面板 UI
- **AND** 响应时间 SHALL 小于 500ms

#### Scenario: 补充世界详细信息（新管线）

- **WHEN** 前端发送 `POST /api/v1/worlds/generate/details` 请求体 `{ "seed": "abc12345", "worldviewId": "cultivation" }`
- **THEN** 后端 SHALL 从 DB 查询 `id = "abc12345"` 的世界
- **AND** 若不存在 SHALL 返回 404
- **AND** 若已存在详情 SHALL 幂等返回
- **AND** 否则 SHALL 调用 `generateWorldDetails(worldview, seed)` 生成详情字段
- **AND** SHALL 合并到已有世界并 `saveWorld()` 持久化

### Requirement: 世界观列表 API 返回属性定义

`GET /api/v1/worldviews` 端点返回的世界观摘要 SHALL 包含 `attributeCount`（属性数量）和 `raceCount`（可用种族数量），供前端世界选择页面展示。

#### Scenario: 世界观摘要包含属性数量

- **WHEN** 前端发起 `GET /api/v1/worldviews`
- **THEN** 每个世界观摘要 SHALL 包含 `attributeCount: number` 字段
- **AND** SHALL 包含 `raceCount: number` 字段
- **AND** SHALL 包含 `attributePreview: string[]`（前 3 个属性显示名）
