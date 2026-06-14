# 角色系统

## 设计原则

- **Player Choice Matters**: 角色选择应该是"有意义的决策"——不同定位的角色在游戏中有不同的优势和劣势，而不是简单的数值比大小
- **多维度评估**: 用一个分数（totalPower）无法反映角色的复杂性，需要从战斗/修炼/生存/探索四个维度评估
- **协同效应**: 词条组合应产生额外价值，鼓励玩家思考和发现
- **seed 确定性**: 同一 seed 永远生成相同的角色模板，客户端发起请求，后端 API 计算
- **属性分层**: 角色属性分为「基础属性」（词条决定，固定）和「成长属性」（修炼获得，有上限），词条优势永久保留

## 核心概念

### 属性系统

5 项基本属性（在未受世界观影响时的默认命名）：

| 属性 | 关键场景 | 默认显示名 |
|------|---------|-----------|
| 体质 | 战斗、生存 | 体质 |
| 灵根 | 修炼、法术伤害 | 灵根 |
| 悟性 | 修炼效率、探索 | 悟性 |
| 幸运 | 探索、暴击、掉落 | 幸运 |
| 意志 | 战斗抗性、突破 | 意志 |

各世界观可自定义属性显示名（如科技世界：体质→体能、灵根→智力、悟性→反应等）。

### 属性分类与映射

属性分为两种类型：

**数值型属性**（NumericAttributeTemplate）：
- 有 `baseValue`（基础值）和 `calculations`（核心值映射公式）
- 例如：`{ type: 'numeric', key: 'physique', displayName: '体质', baseValue: 50, calculations: [{ targetCoreStat: 'maxHp', multiplier: 10 }] }`

**枚举型属性**（EnumAttributeTemplate）：
- 在预设选项中选一个，每个选项有固定核心值加成
- 例如：`{ type: 'enum', key: 'bloodline', displayName: '血脉', enumValues: [{ value: '龙血', bonuses: { maxHp: 20, physicalATK: 5 } }] }`

参考实现：`src/core/types/types.ts:67`（AttributeTemplate 定义）

### 核心值系统（CoreStat）

固定 11 维，全世界观通用：

| 核心值 | 类型 | 说明 |
|--------|------|------|
| maxHp | 战斗 | 最大生命值 |
| physicalATK | 战斗 | 物理攻击 |
| specialATK | 战斗 | 特殊攻击 |
| physicalDEF | 战斗 | 物理防御 |
| specialDEF | 战斗 | 特殊防御 |
| speed | 战斗 | 速度/先手 |
| intelligence | 养成 | 智力/修炼效率 |
| willpower | 养成 | 毅力/突破成功率 |
| lifespan | 养成 | 寿命 |
| perception | 养成 | 感知/探索 |
| specialResourceCap | 特殊 | 专项数值上限（法力/魔力/能量等） |

参考实现：
- 核心值计算引擎：`src/core/world/calculateCoreStats.ts`
- 核心值公式：`src/core/calculation/coreStatFormulas.ts`
- 基础初始值：`src/core/world/calculateCoreStats.ts:29`（DEFAULT_CORE_STAT_BASE_VALUES）

### 属性价值矩阵

不同维度下各属性的权重不同，用于多维度评分：

| 维度 | 最高权重属性 | 评分意义 |
|------|------------|---------|
| 战斗 | 体质 > 意志 > 幸运 > 灵根 > 悟性 | 战斗伤害、防御、暴击 |
| 修炼 | 灵根 > 悟性 > 意志 > 体质 > 幸运 | 修炼速度、突破成功率 |
| 生存 | 体质 > 意志 > 幸运 > 灵根 > 悟性 | 逃跑成功率、恢复速度 |
| 探索 | 幸运 > 悟性 > 灵根 > 意志 > 体质 | 机缘发现、掉落概率 |

参考实现：`doc/design/avatar-selection-balance-design.md`（已迁移）

### 种族系统（Race）

- 通过 `RaceRegistry`（`src/core/registry/RaceRegistry.ts`）注册
- 每个种族有：基础属性加成、天赋池（talentPool）、天生能力（innateAbilities）、寿命修正
- 世界观通过 racePool 引用可用种族

参考类型：`src/core/types/types.ts:157`（RaceDefinition）

### 天赋系统（Talent）

- 通过 `TalentRegistry`（`src/core/registry/TalentRegistry.ts`）注册
- 稀有度分级：common → uncommon → rare → epic → legendary
- 每个天赋有对核心值的修正效果

参考类型：`src/core/types/types.ts:177`（TalentEffect）

### 词条系统

角色由四个维度的词条组成（出身/特性/性格/天赋），每个词条有品质等级：

- **出身**（origin）：角色的出身背景
- **特性**（trait）：角色的天生特性
- **性格**（personality）：角色的性格特征
- **天赋**（talent）：角色的修炼天赋

品质等级：common → uncommon → rare → epic → legendary

参考实现：`src/modules/identity/logic/traits.ts`、`src/modules/identity/data/traits.ts`

### 角色评估

**四维度评分**: 战斗/修炼/生存/探索（各 0-100）
**协同效果**: 特定词条组合触发额外加成（如「战魂」= 战斗狂人 + 武痴）
**角色定位**: 基于评分分布判断角色类型（战斗型/修炼型/生存型/探索型/均衡型/特化型）

## 数据模型

```typescript
// === 核心类型 ===

// src/core/types/types.ts:67 — 属性模板（可扩展）
type AttributeTemplate = NumericAttributeTemplate | EnumAttributeTemplate;

// src/core/types/types.ts:36 — 核心值 key 列表
type CoreStatKey = 'maxHp' | 'physicalATK' | 'specialATK' | 'physicalDEF' | 'specialDEF' | 'speed' | 'intelligence' | 'willpower' | 'lifespan' | 'perception' | 'specialResourceCap';

// src/modules/identity/logic/characterTemplates.ts:27 — 角色模板
interface CharacterTemplate {
  index: number;                          // 0-7
  name: string;                           // 角色名
  gender: '男' | '女';
  raceId: string;                         // 种族 ID
  talentIds: string[];                    // 天赋 ID 列表
  attributes: Record<string, number | string>;  // 属性值
  coreStats: CoreStatValues;              // 派生的核心值
  baseAttributes: Record<string, number | string>;  // 初始等级时的属性值
}

// src/modules/identity/hooks/useCharacterTemplates.ts:26 — API 返回的角色模板
// 同 CharacterTemplate + race + talents 补充信息

// src/core/types/types.ts:492 — 旧版角色（兼容）
interface Character {
  id: number; name: string; gender: '男' | '女';
  origin: ImpactfulTrait; trait: ImpactfulTrait;
  personality: ImpactfulTrait; talent: ImpactfulTrait;
  stats: CharacterStats;
  totalPower: number;
  dimensionScores?: DimensionScores;
  synergies?: SynergyEffect[];
  archetype?: RoleProfile;
}

// src/core/types/types.ts:441 — CharacterStats（基础+成长）
// base: { 体质, 灵根, 悟性, 幸运, 意志 } — 由词条决定的固定属性
// growth: { 体质, 灵根, 悟性, 幸运, 意志 } — 通过修炼获得的可成长属性
```

## 角色生成流程

```
玩家选择世界（worldId + worldviewId）
        │
        ▼
POST /api/v1/characters/templates
        │
        ├── 按 worldview 获取:
        │   ├── 属性模板（AttributeRegistry）
        │   ├── 种族池（RaceRegistry）
        │   ├── 姓名池（worldview.namePool）
        │   └── 成长规则（worldview.attributes[].growthRule）
        │
        ├── 循环生成 8 个角色模板（seed 派生确定性随机数）:
        │   ├── 性别随机（50%）
        │   ├── 姓名从姓名池随机
        │   ├── 种族从种族池随机
        │   ├── 天赋从种族天赋池随机（1-2个）
        │   ├── 属性在 baseValue 基础上 ±4 浮动
        │   └── 计算核心值（calculateCoreStats）
        │
        └── 返回 8 个 CharacterTemplate
                │
                ▼
        玩家选择一个角色
                │
                ▼
        POST /api/v1/characters/save → 保存角色
                │
                ▼
        跳转到 /backstory 页
                │
                ▼
        确认后 → startGameWithCharacter → 进入游戏
```

## 模块映射

| 概念 | 代码位置 | 说明 |
|------|----------|------|
| 属性模板定义 | `src/core/types/types.ts` | AttributeTemplate 类型 |
| 核心值计算 | `src/core/world/calculateCoreStats.ts` | 属性→核心值映射 |
| 核心值公式 | `src/core/calculation/coreStatFormats.ts` | 各公式实现 |
| 属性注册中心 | `src/core/registry/AttributeRegistry.ts` | 属性模板注册 |
| 种族注册中心 | `src/core/registry/RaceRegistry.ts` | 种族定义 |
| 天赋注册中心 | `src/core/registry/TalentRegistry.ts` | 天赋定义 |
| 角色模板生成 | `src/modules/identity/logic/characterTemplates.ts` | 8 个模板生成逻辑 |
| 角色模板 API | `src/app/api/v1/characters/templates/route.ts` | 后端 API |
| 角色保存 API | `src/app/api/v1/characters/save/route.ts` | 后端 API |
| 角色模板 Hook | `src/modules/identity/hooks/useCharacterTemplates.ts` | React Hook |
| 词条系统 | `src/modules/identity/logic/traits.ts` | 词条逻辑 |
| 词条数据 | `src/modules/identity/data/traits.ts` | 各世界词条定义 |
| 姓名池 | `src/modules/identity/data/namePools.ts` | 姓名生成数据 |
| 角色选择 UI | `src/views/character-select/` | 命运之契页面 |
| 角色生成 | `src/modules/identity/logic/generators.ts` | 旧版角色生成 |
| 角色评估 | `src/modules/identity/logic/characterEvaluation.ts` | 多维度评分 |

## 相关文档

| 来源 | 说明 |
|------|------|
| `doc/design/avatar-selection-balance-design.md` | 角色选择平衡系统详细设计（源文档，已迁移） |
| `doc/design/attribute-persistence-design.md` | 属性上限与持久性设计（源文档，已迁移） |
| `doc/design/numerical-design.md` | 数值体系设计 |
| `openspec/changes/2026-06-09-character-feature-polish/` | 角色功能优化变更 |
| `openspec/changes/2026-06-09-world-first-selection-flow/` | 世界优先选择流程（含角色生成） |
| `openspec/specs/world-aware-character-gen/` | 世界感知角色生成规格 |
| `openspec/specs/world-aware-traits/` | 世界感知词条规格 |
