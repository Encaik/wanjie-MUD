# race-mod-content-type

## Purpose

种族（Race）作为独立的 Mod 内容类型，定义角色的基础属性加成、天赋池、天生能力和寿命修正。种族数据通过 Mod JSON 文件加载，世界观通过 `racePool` 声明支持的种族集合。

## Requirements

### Requirement: 种族 Mod 内容类型注册

`ModContentType` 联合类型 SHALL 新增 `'races'`。Mod 清单（`mod.json`）的 `contentTypes` 和 `dataFiles` SHALL 支持声明 `races` 类型及其数据文件路径。

#### Scenario: Mod 清单声明种族数据

- **WHEN** 解析 `mod.json` 中 `contentTypes: ["worldview", "races"]`
- **AND** `dataFiles: { "races": ["data/races/human.json", "data/races/demon.json"] }`
- **THEN** Mod 加载器 SHALL 加载并校验这些种族文件
- **AND** SHALL 将它们注册到种族注册中心

### Requirement: 种族数据结构

每个种族 SHALL 定义以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 全局唯一标识（kebab-case） |
| `name` | string | ✅ | 中文显示名 |
| `description` | string | ✅ | 种族描述 |
| `worldviewRestrictions` | string[] | 否 | 限制出现的世界观 ID 列表（空=全世界观可用） |
| `baseAttributeBonuses` | Record<string, number> | ✅ | 对属性层的基础加成（属性名→加成值） |
| `talentPool` | string[] | ✅ | 可选天赋 ID 列表 |
| `innateAbilities` | InnateAbility[] | ✅ | 天生能力列表 |
| `lifespanModifier` | number | ✅ | 寿命修正倍数（1.0 = 标准人族寿命） |

#### Scenario: 人族种族定义

- **WHEN** 加载人族种族 JSON
- **THEN** `id` SHALL 为 `"human"`
- **AND** `worldviewRestrictions` SHALL 为空（全世界观可用）
- **AND** `baseAttributeBonuses` SHALL 为 `{}`（人族无特殊加成，靠分配点）
- **AND** `lifespanModifier` SHALL 为 `1.0`
- **AND** `talentPool` SHALL 包含通用天赋 ID

#### Scenario: 妖族种族定义

- **WHEN** 加载妖族种族 JSON
- **THEN** `id` SHALL 为 `"demon"`
- **AND** `baseAttributeBonuses` SHALL 包含 `{ "体质": 2, "灵根": -1 }`（正面和负面加成）
- **AND** `lifespanModifier` SHALL 大于 `1.5`（妖族长寿）
- **AND** `innateAbilities` SHALL 包含妖族专属能力

#### Scenario: 种族的世界观限制

- **WHEN** 机器种族的 `worldviewRestrictions` 为 `["tech", "apocalypse"]`
- **THEN** 修仙世界观下 SHALL NOT 可选此种族
- **AND** 科技和末世世界观下 SHALL 可选此种族

### Requirement: 天生能力定义

每个 `InnateAbility` SHALL 包含：
- `id`: 唯一标识
- `name`: 显示名
- `description`: 效果描述
- `effects`: 对核心值的固定修正（`Record<CoreStatKey, { flat?: number; multiplier?: number }>`）

#### Scenario: 天生能力效果

- **WHEN** 妖族的 `innateAbilities` 包含 `{ "id": "demonic_resilience", "effects": { "maxHp": { "multiplier": 1.1 }, "specialDEF": { "flat": 3 } } }`
- **THEN** 妖族角色的 HP SHALL 乘以 1.1
- **AND** 特防 SHALL 固定 +3

### Requirement: 世界观声明可用种族

`WorldviewDefinition` SHALL 新增 `racePool: string[]` 字段，声明该世界观下可用的种族 ID 列表。Mod 加载器 SHALL 校验 `racePool` 中的 ID 均已注册。

#### Scenario: 修仙世界观声明种族

- **WHEN** cultivation.json 的 `racePool` 为 `["human", "demon"]`
- **THEN** 修仙世界的角色生成 SHALL 仅从这两个种族中选取
- **AND** 如果 `demon` 种族未注册，Mod 加载器 SHALL 发出警告

### Requirement: 种族验证

Mod 数据校验器（`ModValidator`）SHALL 对 `races` 类型数据执行校验：必填字段完整性、`talentPool` 中引用的天赋 ID 存在性检查、`baseAttributeBonuses` 的 key 为合法属性名（与 `attributeDefinitions` 交叉校验）。

#### Scenario: 种族缺少必填字段时校验失败

- **WHEN** 种族 JSON 缺少 `id` 或 `name` 字段
- **THEN** `validateModData()` SHALL 返回错误信息
- **AND** 该种族 SHALL NOT 被注册
