# attribute-corestat-decoupling

## Purpose

将数值系统分为两层：属性（Attribute，世界观可变，Mod 定义）和核心值（CoreStat，世界通用，固定 11 维）。属性→核心值的映射公式在世界观 JSON 中声明，所有战斗/养成计算系统统一消费核心值。

## ADDED Requirements

### Requirement: 属性由世界观定义

世界观 JSON SHALL 包含 `attributes: AttributeDefinition[]` 字段，声明该世界观下可用的所有属性。每个属性 SHALL 包含 key（英文标识）、displayName（中文显示名）、category（属性分类）、baseValue（初始值）、calculations（到核心值的映射）。

代码中 SHALL NOT 硬编码任何具体属性名（如 `体质`、`灵根` 等）。角色属性 SHALL 以 `Record<string, number>` 存储。

#### Scenario: 修仙世界观定义 5 属性

- **WHEN** 加载 `mods/wanjie-core/data/worldview/cultivation.json`
- **THEN** 其 `attributes` 字段 SHALL 包含 5 个 `AttributeDefinition` 对象
- **AND** 每个属性 SHALL 声明 `calculations` 映射到核心值
- **AND** 如"体质"的 calculations SHALL 包含 `{ targetCoreStat: "maxHp", multiplier: 2 }` 和 `{ targetCoreStat: "physicalATK", multiplier: 1 }`

#### Scenario: 科技世界观仅有 4 属性

- **WHEN** 加载 `mods/wanjie-core/data/worldview/tech.json`
- **THEN** 其 `attributes` 字段 SHALL 包含 4 个 `AttributeDefinition` 对象
- **AND** SHALL NOT 包含 key 为 "灵根" 的属性
- **AND** SHALL NOT 包含任何映射到 `specialATK` 的 calculation

#### Scenario: 核心值由属性计算派生

- **WHEN** 角色拥有属性 `{ 体质: 10, 灵根: 12, 悟性: 9, 幸运: 8, 意志: 11 }`
- **AND** 世界观定义了 `体质的 calculations: [{ targetCoreStat: "maxHp", multiplier: 2, type: "flat" }]`
- **AND** `baseCoreStats.maxHp = 20`
- **THEN** 角色的 `maxHp` SHALL 计算为 `20 + 10 * 2 = 40`

### Requirement: 核心值固定 11 维

系统 SHALL 提供固定的 11 维核心值集合：

| Key | 显示名 | 分类 |
|-----|--------|------|
| `maxHp` | 生命值 | 战斗 |
| `physicalATK` | 物理攻击 | 战斗 |
| `specialATK` | 特殊攻击 | 战斗 |
| `physicalDEF` | 物理防御 | 战斗 |
| `specialDEF` | 特殊防御 | 战斗 |
| `speed` | 速度 | 战斗 |
| `intelligence` | 智力 | 养成 |
| `willpower` | 毅力 | 养成 |
| `lifespan` | 寿命 | 养成 |
| `perception` | 感知 | 养成 |
| `specialResourceCap` | 专项数值上限 | 世界专属 |

核心值 SHALL 使用英文 key 作为系统间通信的统一语言，UI 层通过元数据映射为中文显示名。

#### Scenario: 所有世界观共享相同的核心值维度

- **WHEN** 在任何世界观的上下文中查询角色的核心值
- **THEN** SHALL 返回全部 11 个维度
- **AND** 不适用于当前世界观的维度（如科技世界的 `specialATK`）SHALL 为 0

#### Scenario: 专项数值上限由世界观定义内容

- **WHEN** 修仙世界观的 `specialResource` 定义为 `{ "displayName": "法力", "defaultCap": 100, "affectedBy": ["灵根"] }`
- **THEN** 角色的 `specialResourceCap` 核心值 SHALL 由 `100 + 灵根值 * multiplier` 计算
- **AND** UI 显示为"法力"而非"专项数值上限"
- **AND** 魔法世界观 UI 显示为"魔力"

### Requirement: 属性分类标签

每个属性 SHALL 拥有 `category` 标签，用于计算引擎在不依赖属性名的情况下定位属性。支持的分类 SHALL 包含：`primary_physical`（主物理）、`primary_spiritual`（主精神）、`primary_martial`（主战斗）、`secondary`（次要）。

#### Scenario: 通过分类查找属性

- **WHEN** 某计算需要"所有主物理属性值之和"
- **THEN** 系统 SHALL 遍历 `attributes` 中 `category === 'primary_physical'` 的属性并求和
- **AND** SHALL NOT 通过属性名 `体质` 硬编码查找

### Requirement: 移除 BaseStats 硬编码接口

`src/core/types/types.ts` 中的 `BaseStats { 体质: number; 灵根: number; 悟性: number; 幸运: number; 意志: number; }` 接口 SHALL 被移除。`CharacterStats` SHALL 改为 `{ attributes: Record<string, number>; coreStats: Record<CoreStatKey, number>; }`。

#### Scenario: 硬编码属性名不再存在于核心类型

- **WHEN** 搜索 `src/core/types/types.ts` 中的 `体质` 或 `灵根`
- **THEN** SHALL NOT 找到作为 JS 属性名定义的硬编码
- **AND** 任何需要属性名的位置 SHALL 从 `AttributeDefinition` 元数据中获取

#### Scenario: 旧代码通过兼容别名过渡

- **WHEN** 迁移阶段有代码引用 `BaseStats`
- **THEN** 短期内 SHALL 通过 `type BaseStats = Record<string, number>` 兼容别名工作
- **AND** 别名 SHALL 标记 `@deprecated` 并在所有引用消除后删除

### Requirement: 属性→核心值计算为纯函数

属性到核心值的转换 SHALL 由 `core/world/` 中的纯函数 `calculateCoreStats(attributes, attributeDefinitions, baseCoreStats)` 执行。该函数 SHALL 不依赖 React、不修改输入、不使用 Math.random()。

#### Scenario: 相同输入产生相同核心值

- **WHEN** 使用相同的 `attributes`、`attributeDefinitions`、`baseCoreStats` 调用 `calculateCoreStats` 两次
- **THEN** 两次返回的 `coreStats` SHALL 完全相等（deep equal）

#### Scenario: 属性不在 definitions 中时忽略

- **WHEN** `attributes` 包含 `{ 未知属性: 99 }` 但 `attributeDefinitions` 中无此 key
- **THEN** 该键 SHALL 不影响任何核心值的计算
- **AND** SHALL NOT 抛出错误（容忍 Mod 数据变更后的残留属性）
