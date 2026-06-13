# talent-mod-content-type

## Purpose

天赋（Talent）作为独立的 Mod 内容类型，定义角色的专长/特质修正。天赋与种族关联（通过 `raceRestrictions`），可对属性或核心值施加修正。天赋数据通过 Mod JSON 文件加载，支持稀有度分级。

## Requirements

### Requirement: 天赋 Mod 内容类型注册

`ModContentType` 联合类型 SHALL 新增 `'talents'`。Mod 清单的 `contentTypes` 和 `dataFiles` SHALL 支持声明 `talents` 类型。

#### Scenario: Mod 清单声明天赋数据

- **WHEN** 解析 `mod.json` 中 `contentTypes: ["talents"]`
- **AND** `dataFiles: { "talents": "data/talents.json" }`
- **THEN** Mod 加载器 SHALL 加载并校验天赋数据
- **AND** SHALL 将它们注册到天赋注册中心

### Requirement: 天赋数据结构

每个天赋 SHALL 定义以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 全局唯一标识 |
| `name` | string | ✅ | 中文显示名 |
| `description` | string | ✅ | 天赋描述 |
| `raceRestrictions` | string[] | 否 | 限制种族 ID 列表 |
| `worldviewRestrictions` | string[] | 否 | 限制世界观 ID 列表 |
| `effects` | TalentEffect[] | ✅ | 修正效果列表 |
| `rarity` | string | ✅ | 稀有度：common/uncommon/rare/epic/legendary |
| `conflictsWith` | string[] | 否 | 互斥天赋 ID 列表 |
| `dialogueTag` | string | 否 | 对话检定标签 |

#### Scenario: 剑道天赋定义

- **WHEN** 加载剑道天赋 JSON
- **THEN** `id` SHALL 为 `"sword_mastery"`
- **AND** `raceRestrictions` SHALL 为 `["human"]`（仅人族可选）
- **AND** `effects` SHALL 包含对 `physicalATK` 的 `multiplier: 1.1`
- **AND** `rarity` SHALL 为 `"rare"`
- **AND** `dialogueTag` SHALL 为 `"sword"`（对话中使用）

#### Scenario: 天赋互斥

- **WHEN** 角色选择了 `"sword_mastery"`（剑道天赋）
- **AND** `"sword_mastery".conflictsWith` 包含 `"staff_mastery"`
- **THEN** 角色 SHALL NOT 同时拥有 `"staff_mastery"`
- **AND** UI SHALL 在选择时标记互斥天赋为不可选

#### Scenario: 天赋修正效果类型

- **WHEN** 天赋 `effects` 包含 `{ "target": "physicalATK", "type": "multiplier", "value": 1.1 }`
- **THEN** 该效果 SHALL 将角色的物理攻击核心值乘以 1.1
- **WHEN** 天赋 `effects` 包含 `{ "target": "体质", "type": "attribute_flat", "value": 2 }`
- **THEN** 该效果 SHALL 将角色的"体质"属性值 +2

### Requirement: 天赋稀有度概率

角色生成时，天赋的选取概率 SHALL 由稀有度决定：

| 稀有度 | 概率 |
|--------|------|
| `common` | 40% |
| `uncommon` | 30% |
| `rare` | 18% |
| `epic` | 9% |
| `legendary` | 3% |

#### Scenario: 天赋概率分布

- **WHEN** 生成 1000 个角色的天赋
- **THEN** 天赋的稀有度分布 SHALL 近似上述概率
- **AND** 具体概率由 seeded RNG 决定（可复现）

### Requirement: 天赋验证

Mod 数据校验器 SHALL 对 `talents` 类型执行校验：必填字段完整性、`raceRestrictions` 中引用的种族 ID 存在性、`worldviewRestrictions` 中引用的世界观 ID 已注册、`conflictsWith` 为双向有效（A 冲突 B 且 B 冲突 A）。

#### Scenario: 单向冲突检测

- **WHEN** 天赋 A 的 `conflictsWith` 包含天赋 B
- **AND** 天赋 B 的 `conflictsWith` SHALL NOT 包含天赋 A
- **THEN** 校验器 SHALL 发出警告（建议双向声明互斥）
