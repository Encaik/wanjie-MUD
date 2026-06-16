## Context

当前项目有五层架构（app → views → modules → core → shared），核心类型定义在 `core/types/types.ts`。属性系统采用硬编码的五属性模型：`BaseStats { 体质, 灵根, 悟性, 幸运, 意志 }` 以中文字符串作为 JS 属性名，散落在 25 个源文件中。不同世界观通过 `statDisplayNames` 仅做显示名映射，底层属性槽位始终是 5 个——科技世界仍然有"灵根"，只是显示为"智力"。

数值计算存在两条路线：旧路线（`modules/progression/logic/balanceConfig.ts`）直接引用 `.体质`、`.灵根` 等属性名做公式计算；新路线（`core/calculation/`）使用英文 key 的 `CalculableStat` 系统，通过 `STAT_NAME_MAP` 桥接。两条路线的系数不完全一致。

Mod 系统已支持 `worldview`、`traits`、`factions`、`dangers` 等内容类型，但不支持 `races`（种族）和 `talents`（天赋）。角色生成使用 `Math.random()` 非确定性随机。

命名约定：此文档遵循命名规则——属性（Attribute）= 世界观可变层，核心值（CoreStat）= 世界通用战斗/养成维度。

## Goals / Non-Goals

**Goals:**
- 属性系统完全 Mod 驱动：世界观 JSON 声明自己的属性列表，代码中不再硬编码任何属性名
- 核心值固定为 11 维：HP / 物攻 / 特攻 / 物防 / 特防 / 速度 / 智力 / 毅力 / 寿命 / 感知 / 专项数值上限，战斗和养成公式消费核心值
- 种族（Race）和天赋（Talent）作为独立 Mod 内容类型，可与世界观、属性系统解耦组合
- 角色生成引入 seed 概念：worldSeed 确定 8 个模板，用户选择后生成 characterSeed，支持持久化和跨玩家复用
- 数值重平衡：属性基值从 50 降至 8，初始核心值保持在两位数级别，为后期战力膨胀留出空间
- 属性→核心值的映射公式在世界观 Mod 中声明，所有计算系统统一消费核心值

**Non-Goals:**
- 不在此变更中实现跨玩家 NPC 遭遇系统（预留扩展点）
- 不修改 `core/calculation/` 中 `UnifiedCalculator` 的核心算法（只改输入层）
- 不改变 Mod 加载管线的基本流程（仅扩展内容类型）
- 不在此变更中实现 CRPG 对话系统的完整 UI（仅定义数据结构和检定接口）

## Decisions

### Decision 1: Attribute 使用 `Record<string, number>` + 元数据，而非泛型接口

**选择**: `type Attributes = Record<string, number>` 配合 `AttributeDefinition[]` 元数据数组

**替代方案**: 为每个世界观动态生成 TypeScript 类型（`type CultivationStats = { 体质: number; ... }`）——但 TS 类型在运行时不可用，无法在 Mod JSON 加载后动态生成类型。

**理由**: 动态键值对 + 元数据描述是 Mod 驱动系统的最简方案。类型安全由 `AttributeDefinition` 的运行时校验保证。计算引擎通过 `category` 标签查找属性，不依赖属性名。

### Decision 2: AttributeDefinition 在世界观 JSON 中声明

**结构**:
```typescript
interface AttributeDefinition {
  key: string;            // 唯一标识，如 "constitution" (英文key，内部使用)
  displayName: string;    // 显示名，如 "体质"
  category: AttributeCategory;  // primary_physical | primary_spiritual | primary_martial | secondary
  baseValue: number;      // 初始基值 (默认 8)
  growthPerLevel: number; // 每级成长量
  calculations: AttributeCalculation[];  // 该属性到核心值的映射
}

interface AttributeCalculation {
  targetCoreStat: CoreStatKey;  // 目标核心值
  multiplier: number;           // 乘数
  type: 'flat' | 'percentage';   // 加成方式
}

type CoreStatKey = 'maxHp' | 'physicalATK' | 'specialATK' | 'physicalDEF' | 'specialDEF'
  | 'speed' | 'intelligence' | 'willpower' | 'lifespan' | 'perception' | 'specialResourceCap';
```

**理由**: 每个属性声明自己对哪些核心值有贡献，公式变为：`CoreStat[K] = baseCoreStat[K] + Σ(attr * multiplier)`。科技世界只需不包含 `specialATK` 相关 calculation 即可——无需在代码中判断"科技世界没有灵根"。

### Decision 3: 核心值使用英文 key，作为系统间通信的统一语言

**选择**: `CoreStat` 维度使用固定英文 key（`maxHp`, `physicalATK`, ...），在 UI 层通过 `CoreStatMeta` 映射为中文显示名。

**理由**: 核心值是系统间通信的统一语言，需要在所有世界观中保持一致。英文 key 避免了中文属性名的编码问题，与现有 `core/calculation/` 的 `CalculableStat` 可直接对接。

### Decision 4: 专项数值上限（specialResourceCap）的内容由世界观 JSON 定义

**结构**:
```json
"specialResource": {
  "displayName": "法力",
  "defaultCap": 100,
  "capGrowthPerLevel": 10,
  "affectedBy": ["灵根"]
}
```

**理由**: 修仙的"法力"、魔法的"魔力"、科技的"能量"本质上是同一个"槽位"的不同实例。保留 1 维 `specialResourceCap` 而非为每个世界观新增独立维度，保持计算引擎的稳定性。

### Decision 5: 种族和天赋作为独立 Mod 内容类型

**选择**: 在 `ModContentType` 中新增 `'races'` 和 `'talents'`，数据文件独立于世界观 JSON。

**种族结构**:
```typescript
interface RaceDefinition {
  id: string;
  name: string;
  description: string;
  worldviewRestrictions?: string[];   // 可选的世界观限制
  baseAttributeBonuses: Record<string, number>;  // 对属性的基础加成
  talentPool: string[];               // 可选天赋 ID 列表
  innateAbilities: InnateAbility[];   // 天生能力
  lifespanModifier: number;           // 寿命修正
}
```

**天赋结构**:
```typescript
interface TalentDefinition {
  id: string;
  name: string;
  description: string;
  raceRestrictions?: string[];
  worldviewRestrictions?: string[];
  effects: TalentEffect[];           // 对属性或核心值的修正
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  conflictsWith?: string[];           // 互斥天赋
  dialogueTag?: string;              // 对话检定标签
}
```

**理由**: 种族和天赋独立于世界观，可以被多个世界观复用。世界观通过 `racePool: string[]` 和 `talentPool: string[]` 声明自己支持的种族和天赋。

### Decision 6: CharacterSeed 生成时机和结构

**选择**: 分两步——(1) `worldSeed` 确定性地生成 8 个角色模板（种族+天赋+属性分配），(2) 用户选择模板并微调后，系统创建 `characterSeed = hash(worldSeed + templateIndex + customizations + timestamp)`。

**理由**: worldSeed 保证同一世界下模板一致（跨玩家可复现），characterSeed 编码用户的自定义选择，使角色可被持久化和查询。

**用例**:
```
世界 A (seed: "a0b1c2d3") → 模板 1-8 (确定性的)
用户选模板 3，改名为 "凌云"，性别 "男"
→ characterSeed = hash("a0b1c2d3:3:name=凌云:gender=男:1700000000")
→ 角色持久化到 characters 表，seed 为 key
→ 其他玩家用 seed "a0b1c2d3" 时，可从 DB 查询到 "凌云" 作为 NPC 候选
```

### Decision 7: 数值重平衡基准

**选择**: 采用 BG3 风格的低起始值设计。

| 层级 | 旧值 | 新值 | 说明 |
|------|------|------|------|
| 属性基值 | 50 | 8 | 种族+天赋+分配点后约 8-15 |
| 属性词条加成 | +2~12 | +1~3 | 压缩浮动范围 |
| 初始 HP | ~200-300 | ~20-40 | baseHp(20) + 体质*2 |
| 初始 物攻 | ~20-30 | ~5-12 | baseAtk(5) + 体质*1 |
| 初始 核心值总量级 | 百级 | 十级 | 成长曲线拉伸至 100 级 |
| 等级对核心值贡献 | 每级 +5~15 | 每级 +1~3 | 减缓膨胀 |

**理由**: 小数字让每个 +1 都有体感，后期飞升、功法、装备的乘法加成才能创造阶梯式成长。百级角色最终核心值可达千级——有足够的膨胀空间。

### Decision 8: 对话检定使用 d20 系统

**选择**: `RollResult = d20 + attributeModifier` vs `difficulty`。属性修正 = `Math.floor((attributeValue - 10) / 2)`。

**理由**: CRPG 经典范式，玩家直观理解。属性越高检定越稳但不保证成功（d20 的随机性保留戏剧张力）。

## Risks / Trade-offs

- **[风险] 15+ 文件同时修改导致 merge conflict**: 分阶段实施，先改 core 类型层，再改计算层，最后改 UI 层。每个阶段独立提交，降低冲突面。
- **[风险] `Record<string, number>` 失去编译时类型检查**: 通过 `AttributeDefinition[]` 运行时校验 + 单元测试覆盖补偿。计算引擎入口做 schema 校验。
- **[风险] 数值重平衡破坏现有存档**: 存档中包含旧格式 `CharacterStats`，需要 migrator 将旧属性值映射到新格式。在 `shared/utils/saveMigrator.ts` 中追加迁移逻辑。
- **[风险] 旧管线（generator.ts）与新系统并存期的混乱**: 旧管线依赖 `modules/` 数据（已经被 worldview registry 替代的旧数据），在新系统稳定后统一删除旧管线。
- **[取舍] 专项数值上限只有 1 维**: 如果未来有世界观需要 2 种以上特殊资源（如"同时有法力和内力"），需要扩展此设计。当前选择 1 维是为了保持计算引擎稳定，后续可通过 `specialResources: Record<string, SpecialResourceDef>` 扩展。

## Migration Plan

1. **Phase 0 — 类型层**: 新增 `AttributeDefinition`、`CoreStatKey`、`RaceDefinition`、`TalentDefinition` 类型。`BaseStats` / `GrowthStats` 标记 deprecated，保留为 type alias 指向 `Record<string, number>`。
2. **Phase 1 — Mod 数据层**: 8 个世界观 JSON 增加 `attributeDefinitions` 和 `coreStatFormulas`。新增 `races/` 和 `talents/` 数据文件。
3. **Phase 2 — 计算层**: `core/calculation/` 适配动态属性→核心值映射。`balanceConfig.ts` 替换为基于核心值的计算函数。
4. **Phase 3 — 生成层**: 角色生成器支持 seeded RNG、动态属性集合、种族/天赋选取。
5. **Phase 4 — API & 存储层**: SQLite 新增 `characters` 表，新增角色保存/查询 API。seed 驱动的角色生成端点。
6. **Phase 5 — UI 层**: 属性面板、角色选择 UI 改为动态渲染。种族选择、天赋展示。
7. **Phase 6 — 清理**: 删除旧管线（`generator.ts` 中引 `modules/` 的部分），删除 `BaseStats`/`GrowthStats` 旧接口，统一为 `Record<string, number>` + `AttributeMap` 元数据。

## Open Questions

- **Q1**: 感知（Perception）影响探索范围的具体机制——是扩大探索步数上限，还是增加发现隐藏事件的概率？留到实施时与探索模块对接。
- **Q2**: 寿命的具体消耗机制——是现实时间？游戏内回合数？每个境界消耗固定寿元？
- **Q3**: 专项数值（法力/魔力）的消耗和恢复机制需要独立设计还是复用现有 MP 系统？
