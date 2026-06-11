# worldview-definition

世界观定义 — Mod 加载的世界类型完整定义，包含术语、文本、属性计算、境界系统、门派、危险、机遇、特性池、名称池等全部数据，作为生成世界的模板。

## ADDED Requirements

### Requirement: WorldviewDefinition 数据结构

系统 SHALL 定义 `WorldviewDefinition` 接口，作为世界观的完整数据模型。一个 `WorldviewDefinition` 包含生成该世界观下世界实例所需的全部数据。该接口 SHALL 在 `src/core/registry/WorldViewRegistry.ts` 中定义。

`WorldviewDefinition` SHALL 包含以下字段：
- `id: string` — English kebab-case 唯一标识（如 "cultivation", "martial"）
- `name: string` — 中文显示名（如 "修仙世界", "高武世界"）
- `description: string` — 世界观描述
- `version: string` — 世界观版本号（semver）
- `baseCoefficient: number` — 基础难度系数
- `rewardCoefficient: RewardCoefficientData` — 奖励系数配置
- `stats: WorldStatsData` — 属性计算参数
- `realmSystem: RealmSystemData` — 境界系统定义
- `namePrefixes: string[]` — 世界名称前缀池
- `nameSuffixes: string[]` — 世界名称后缀池
- `descriptions: string[]` — 世界描述文本池
- `powerSystems: string[]` — 力量体系描述池
- `majorForces: string[]` — 主要势力描述池
- `dangers: DangerData[]` — 危险事件池
- `opportunities: OpportunityData[]` — 机遇事件池
- `factions: FactionTemplateData[]` — 门派模板列表
- `traits: TraitPoolData` — 特性池（起源、天赋、性格、才能）
- `namePool: NamePoolData` — 角色名称池（姓氏、男名、女名）
- `texts: WorldTextDefinition` — 世界观文本（术语、UI 文案、战斗/修炼文本）
- `mechanics: MechanicsConfig` — 机制配置（修炼参数、战斗参数、探索参数、独特机制）
- `visualConfig: WorldVisualConfig` — UI 视觉配置（图标、配色、渐变）
- `builtin: boolean` — 是否为内置世界观
- `author?: string` — 作者名（Mod 提供）
- `tags?: string[]` — 标签列表

#### Scenario: WorldviewDefinition 包含完整世界观文本

- **WHEN** 从 `WorldViewRegistry` 读取 `WorldviewDefinition`（如 "cultivation"）
- **THEN** `texts` 字段 SHALL 包含完整的 `WorldTextDefinition` 对象
- **AND** `texts.terminology` SHALL 包含该世界观的术语（如资源名、货币名、修炼动词）
- **AND** `texts.stats` SHALL 包含属性别名（如 "体质"→"根骨"）
- **AND** `texts.combat` SHALL 包含战斗相关文本模板
- **AND** `texts.cultivation` SHALL 包含修炼相关文本模板
- **AND** 所有字段 SHALL 有明确的类型定义，SHALL NOT 使用 `Record<string, unknown>`

#### Scenario: WorldviewDefinition 与 World 明确分离

- **WHEN** 对比 `WorldviewDefinition` 和 `World` 接口
- **THEN** `WorldviewDefinition` SHALL 包含生成池（前缀/后缀/描述数组）和模板数据
- **AND** `World` SHALL 包含从池中选取的具体值（确定的名称、描述）
- **AND** `World` SHALL 包含 `worldviewId` 字段，引用其来源 `WorldviewDefinition.id`
- **AND** `WorldviewDefinition` SHALL NOT 包含 `id` 以外的世界实例字段（如 `difficulty`、`actualCoefficient`）

### Requirement: WorldviewDefinition 通过 Mod JSON 加载

世界观定义 SHALL 通过 Mod 系统的 JSON 文件加载到 `WorldViewRegistry`。每个世界观的 JSON 文件 SHALL 包含 `WorldviewDefinition` 所需的所有字段。加载过程 SHALL 发生在服务端初始化阶段（`app/api/init.ts`）。Mod 的 content type 为 `'worldview'`（替代旧的 `'world'`）。

#### Scenario: Mod JSON 文件包含完整的 worldview 数据

- **WHEN** 检查 `mods/wanjie-core/data/world/cultivation.json`
- **THEN** SHALL 包含 `id`、`name`、`description`、`baseCoefficient`、`stats`、`realmSystem` 字段
- **AND** SHALL 包含 `namePrefixes`、`nameSuffixes`、`descriptions` 生成池字段
- **AND** SHALL 包含 `dangers`、`opportunities`、`factions` 数据池字段
- **AND** SHALL 包含 `traits`、`names` 角色相关池字段
- **AND** SHALL 包含 `text` 字段（世界观文本，包含 terminology、stats、combat、cultivation 等子字段）
- **AND** SHALL 包含 `mechanics` 和 `visualConfig` 配置字段

#### Scenario: 初始化时 worldview 注册到 registry

- **WHEN** `ensureWorldSystemInitialized()` 被调用（服务端启动或首次 API 请求）
- **THEN** 系统 SHALL 遍历所有已加载 Mod 的 `data/world/*.json` 文件
- **AND** 将每个 JSON 对象注册为 `WorldviewDefinition` 到 `WorldViewRegistry.worldviews`
- **AND** 注册完成后 `WorldViewRegistry.count` SHALL 等于已加载的世界观数量

#### Scenario: 前端通过 API 获取世界观列表

- **WHEN** 前端发起 `GET /api/v1/worldviews`
- **THEN** 后端 SHALL 返回所有已注册世界观的摘要列表（id、name、description、visualConfig）
- **AND** 摘要列表 SHALL NOT 包含完整的生成池数据（减少传输量）

### Requirement: WorldviewDefinition 替代 WorldTypeData

`WorldviewDefinition` SHALL 完全替代旧的 `WorldTypeData` 接口。所有引用 `WorldTypeData` 的代码 SHALL 迁移到 `WorldviewDefinition`。旧名称 SHALL NOT 在新增代码中使用。

#### Scenario: WorldTypeData 不再存在于类型定义中

- **WHEN** 在所有源代码中搜索 `WorldTypeData`
- **THEN** SHALL NOT 存在该标识符的定义或引用（过渡期 barrel re-export 除外）
- **AND** 旧引用 SHALL 已替换为 `WorldviewDefinition`

#### Scenario: 相关函数同步重命名

- **WHEN** 调用获取世界观数据的方法
- **THEN** 使用 `getWorldview(id)` 而非 `getWorldTypeData(id)`
- **AND** 使用 `getAllWorldviews()` 而非 `getAllWorldTypeValues()`
- **AND** 使用 `registerWorldview(def)` 而非 `registerWorldType(def)`
- **AND** `WorldViewRegistry.worldviews` 替代 `WorldViewRegistry.worldTypes`

### Requirement: World 接口关联世界观

`World` 接口 SHALL 新增 `worldviewId: string` 字段，记录生成该世界实例的世界观标识。该字段 SHALL 在 `src/core/types/types.ts` 的 `World` 接口中定义。

#### Scenario: World 实例包含 worldviewId

- **WHEN** 生成一个世界实例（seed="abc12345", worldviewId="cultivation"）
- **THEN** 返回的 `World` 对象 SHALL 包含 `worldviewId: "cultivation"`
- **AND** `type` 字段 SHALL 仍为中文显示名（如 "修仙"），保持向后兼容

#### Scenario: 通过 worldviewId 回溯世界观数据

- **WHEN** 持有 `World` 实例且需要其世界观文本
- **THEN** SHALL 通过 `WorldViewRegistry.getWorldview(world.worldviewId)` 获取 `WorldviewDefinition`
- **AND** SHALL 从 `WorldviewDefinition.texts` 读取术语和文本模板
