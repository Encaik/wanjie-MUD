# 统一数值计算系统设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 版本 | v1.0 |
| 创建日期 | 2026-03-25 |
| 作者 | Game Design System |
| 状态 | 设计中 |

---

## 目录

1. [背景与问题分析](#1-背景与问题分析)
2. [设计目标](#2-设计目标)
3. [系统架构](#3-系统架构)
4. [数据结构定义](#4-数据结构定义)
5. [计算流程](#5-计算流程)
6. [效果系统整合](#6-效果系统整合)
7. [边界条件设计](#7-边界条件设计)
8. [状态机设计](#8-状态机设计)
9. [实现计划](#9-实现计划)
10. [测试验证](#10-测试验证)

---

## 1. 背景与问题分析

### 1.1 现有效果系统梳理

当前游戏存在多种效果来源，每种效果都有独立的数据结构和处理逻辑：

| 效果来源 | 当前数据结构 | 当前处理位置 | 问题 |
|----------|--------------|--------------|------|
| **世界效果** | `WorldDanger` / `WorldOpportunity` | `worldEffectSystem.ts` | 独立的属性修改逻辑 |
| **丹药效果** | `PillUseResult` | `pillRealmSystem.ts` | 独立的效果倍率计算 |
| **道具效果** | `ActiveEffect` / `ItemEffect` | 分散在各处 | 效果类型有限 |
| **装备效果** | `Equipment.attackBonus` 等 | 战斗初始化时 | 硬编码属性名 |
| **功法效果** | `Technique.power` / `bonus` | 技能生成时 | 与装备类似 |
| **战斗Buff** | `StatBuff` | `eventSystem.ts` | 独立的持续时间管理 |
| **称号效果** | 未实现 | - | 待设计 |
| **境界加成** | 隐式计算 | 各处散落 | 无统一入口 |

### 1.2 核心问题

```
┌─────────────────────────────────────────────────────────────┐
│                     当前问题示意图                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   世界效果 ────→ 属性A (直接修改)                            │
│        │                                                    │
│   丹药效果 ────→ 属性B (倍率后修改)                          │
│        │                                                    │
│   装备效果 ────→ 属性C (叠加计算)                            │
│        │                                                    │
│   功法效果 ────→ 属性D (按比例计算)                          │
│        │                                                    │
│   ...更多效果...                                            │
│        │                                                    │
│        ↓                                                    │
│   ❌ 混乱的最终属性值 (顺序敏感、难以追踪、无法调试)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**具体问题**：

1. **计算顺序敏感**：不同效果的应用顺序会影响最终结果
2. **效果叠加混乱**：加法叠加 vs 乘法叠加没有统一规范
3. **调试困难**：无法追踪某个属性值是如何计算出来的
4. **扩展困难**：新增效果类型需要修改多处代码
5. **重复代码**：各处都有类似的属性计算逻辑
6. **边界保护缺失**：缺少统一的数值范围保护

### 1.3 影响范围

- **战斗系统**：攻击力、防御力、暴击率等计算
- **修炼系统**：修炼效率、突破成功率等
- **经济系统**：金币/灵石获取倍率
- **探索系统**：掉落率、事件概率等

---

## 2. 设计目标

### 2.1 核心目标

```
┌─────────────────────────────────────────────────────────────┐
│                    设计目标金字塔                            │
├─────────────────────────────────────────────────────────────┤
│                         ▲                                   │
│                        /│\                                  │
│                       / │ \    可追溯：每个值都能追查来源    │
│                      /  │  \                                │
│                     /   │   \                              │
│                    /    │    \  可测试：每个环节可独立测试  │
│                   /     │     \                            │
│                  /      │      \                           │
│                 /       │       \ 可扩展：新效果无需改架构  │
│                /        │        \                          │
│               /         │         \                         │
│              ────────────────────────                       │
│              统一计算：输入→中间层→输出                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 具体指标

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| 计算一致性 | 相同输入必得相同输出 | 单元测试 |
| 效果可追溯 | 每个输出值可列出所有贡献来源 | 调试日志 |
| 边界安全 | 所有数值在合理范围内 | 边界测试 |
| 性能 | 单次计算 < 1ms | 性能测试 |
| 扩展性 | 新增效果类型仅需添加配置 | 代码审查 |

### 2.3 非目标

- 不涉及网络同步（单机游戏）
- 不涉及存档系统改造
- 不涉及UI层改造

---

## 3. 系统架构

### 3.1 三层架构设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          统一数值计算系统架构                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        输入层 (Input Layer)                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │ 基础属性 │  │ 装备数据 │  │ 功法数据 │  │ 角色状态 │             │   │
│  │  │ BaseStats│  │Equipment│  │Technique│  │  State  │             │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘             │   │
│  │       │            │            │            │                   │   │
│  │       └────────────┴────────────┴────────────┘                   │   │
│  │                          │                                        │   │
│  │                          ▼                                        │   │
│  │              ┌───────────────────────┐                           │   │
│  │              │    计算输入上下文      │                           │   │
│  │              │ CalculationContext    │                           │   │
│  │              └───────────┬───────────┘                           │   │
│  └──────────────────────────┼──────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     中间层 (Effect Layer)                         │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                    效果注册表 (EffectRegistry)             │   │   │
│  │  │                                                            │   │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │   │   │
│  │  │  │ 世界效果    │ │ 丹药效果    │ │ 装备效果    │             │   │   │
│  │  │  │WorldEffect │ │ PillEffect │ │EquipEffect │             │   │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘             │   │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │   │   │
│  │  │  │ 功法效果    │ │ 战斗Buff   │ │ 称号效果    │             │   │   │
│  │  │  │TechEffect  │ │BattleBuff │ │TitleEffect │             │   │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘             │   │   │
│  │  │  ┌────────────┐ ┌────────────┐                            │   │   │
│  │  │  │ 境界加成    │ │ 状态效果    │                            │   │   │
│  │  │  │RealmBonus  │ │StateEffect │                            │   │   │
│  │  │  └────────────┘ └────────────┘                            │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                             │                                    │   │
│  │                             ▼                                    │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                    效果处理器 (EffectProcessor)            │   │   │
│  │  │                                                            │   │   │
│  │  │   1. 收集所有激活效果 (Collect)                             │   │   │
│  │  │   2. 按优先级排序 (Sort by Priority)                        │   │   │
│  │  │   3. 分组聚合 (Group & Aggregate)                           │   │   │
│  │  │   4. 应用计算公式 (Apply Formula)                            │   │   │
│  │  │   5. 边界约束 (Clamp)                                       │   │   │
│  │  │                                                            │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                             │                                    │   │
│  └─────────────────────────────┼────────────────────────────────────┘   │
│                                │                                        │
│                                ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       输出层 (Output Layer)                       │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │                 计算结果 (CalculationResult)              │    │   │
│  │  │                                                          │    │   │
│  │  │   finalValue: number        // 最终值                    │    │   │
│  │  │   baseValue: number         // 基础值                    │    │   │
│  │  │   contributions: Contrib[]  // 贡献来源（可追溯）          │    │   │
│  │  │   warnings: string[]        // 警告信息                  │    │   │
│  │  │                                                          │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ 战斗属性     │  │ 修炼效率     │  │ 掉落倍率     │              │   │
│  │  │ CombatStats │  │ Cultivation │  │ DropRates   │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流向

```
输入数据 → 上下文构建 → 效果收集 → 效果排序 → 效果分组 → 公式计算 → 边界约束 → 输出结果
    │           │           │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼           ▼           ▼
 原始数据    计算上下文   效果列表   排序后列表  聚合效果   中间结果   最终结果
```

### 3.3 核心原则

1. **单一入口原则**：所有数值计算必须通过统一入口
2. **不可变原则**：输入数据在计算过程中不被修改
3. **可追溯原则**：每个计算结果都记录贡献来源
4. **边界保护原则**：所有数值必须经过边界约束

---

## 4. 数据结构定义

### 4.1 核心类型定义

```typescript
// ============================================
// 基础类型定义
// ============================================

/** 可计算属性名称 */
export type CalculableStat = 
  // 战斗属性
  | 'maxHp'           // 最大生命值
  | 'maxMp'           // 最大法力值
  | 'attack'          // 攻击力
  | 'defense'         // 防御力
  | 'critRate'        // 暴击率
  | 'critDamage'      // 暴击伤害
  | 'dodgeRate'       // 闪避率
  // 修炼属性
  | 'cultivationExp'  // 修炼经验效率
  | 'breakthroughRate'// 突破成功率
  | 'techniqueExp'    // 功法经验效率
  // 经济属性
  | 'expGain'         // 经验获取倍率
  | 'spiritStoneGain' // 灵石获取倍率
  | 'dropRate'        // 掉落率
  | 'rarityBoost'     // 稀有度提升
  // 特殊属性
  | 'luck'            // 幸运值（影响暴击、闪避、掉落等）
  | 'power'           // 综合战力
  ;

/** 属性分类 */
export type StatCategory = 'combat' | 'cultivation' | 'economy' | 'special';

/** 效果来源类型 */
export type EffectSourceType = 
  | 'world_danger'      // 世界危险
  | 'world_opportunity' // 世界机缘
  | 'pill'              // 丹药
  | 'equipment'         // 装备
  | 'technique'         // 功法
  | 'title'             // 称号
  | 'buff'              // 战斗Buff
  | 'realm'             // 境界加成
  | 'state'             // 状态效果
  | 'passive'           // 被动技能
  ;

/** 效果计算类型 */
export type EffectCalcType = 
  | 'add'       // 加法叠加：final = base + sum(values)
  | 'multiply'  // 乘法叠加：final = base * (1 + sum(ratios))
  | 'override'  // 覆盖取最大/最小：final = max/min(values)
  | 'chain'     // 链式乘法：final = base * ratio1 * ratio2 * ...
  ;

/** 效果优先级 */
export type EffectPriority = 
  | 'base'      // 1: 基础值（角色属性）
  | 'passive'   // 2: 被动加成（功法、装备）
  | 'buff'      // 3: Buff效果（临时加成）
  | 'world'     // 4: 世界效果（环境修正）
  | 'special'   // 5: 特殊效果（覆盖性修正）
  ;

// ============================================
// 效果定义
// ============================================

/** 统一效果定义 */
export interface UnifiedEffect {
  /** 效果唯一ID */
  id: string;
  
  /** 效果来源类型 */
  sourceType: EffectSourceType;
  
  /** 效果来源ID（如装备ID、功法ID等） */
  sourceId: string;
  
  /** 效果来源名称（用于显示和追溯） */
  sourceName: string;
  
  /** 目标属性 */
  targetStat: CalculableStat;
  
  /** 计算类型 */
  calcType: EffectCalcType;
  
  /** 效果值 */
  value: number;
  
  /** 优先级 */
  priority: EffectPriority;
  
  /** 效果标签（用于分组和过滤） */
  tags: string[];
  
  /** 生效条件（可选） */
  condition?: EffectCondition;
  
  /** 持续时间（-1表示永久，0表示即时） */
  duration: number;
  
  /** 剩余持续时间（动态） */
  remainingDuration: number;
  
  /** 是否可驱散 */
  dispellable: boolean;
  
  /** 效果层级（同优先级内的排序） */
  layer: number;
}

/** 效果条件 */
export interface EffectCondition {
  /** 条件类型 */
  type: 'in_battle' | 'out_battle' | 'in_world' | 'hp_below' | 'mp_below' | 'random';
  
  /** 条件参数 */
  params?: Record<string, number | string | boolean>;
  
  /** 条件取反 */
  negate?: boolean;
}

/** 效果贡献记录（用于追溯） */
export interface EffectContribution {
  /** 来源类型 */
  sourceType: EffectSourceType;
  
  /** 来源名称 */
  sourceName: string;
  
  /** 计算类型 */
  calcType: EffectCalcType;
  
  /** 效果值 */
  value: number;
  
  /** 对最终值的贡献（计算后） */
  contribution: number;
  
  /** 效果ID */
  effectId: string;
}

// ============================================
// 计算上下文
// ============================================

/** 计算输入上下文 */
export interface CalculationContext {
  /** 计算ID（用于追溯） */
  calculationId: string;
  
  /** 计算时间戳 */
  timestamp: number;
  
  /** 角色基础数据 */
  character: {
    level: number;
    realm: string;
    realmLevel: number;
    baseStats: BaseStatsInput;
  };
  
  /** 装备数据 */
  equipment: {
    melee: EquipmentInput | null;
    ranged: EquipmentInput | null;
    head: EquipmentInput | null;
    body: EquipmentInput | null;
    legs: EquipmentInput | null;
    feet: EquipmentInput | null;
  };
  
  /** 功法数据 */
  techniques: TechniqueInput[];
  
  /** 世界数据 */
  world: {
    id: string;
    type: string;
    actualCoefficient: number;
    dangers: WorldEffectInput[];
    opportunities: WorldEffectInput[];
  };
  
  /** 当前状态 */
  state: {
    inBattle: boolean;
    currentHp: number;
    currentMp: number;
    activeBuffs: BuffInput[];
    activeEffects: ActiveEffectInput[];
  };
  
  /** 已激活称号 */
  titles: TitleInput[];
}

/** 基础属性输入 */
export interface BaseStatsInput {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

/** 装备输入 */
export interface EquipmentInput {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  level: number;
  attackBonus: number;
  defenseBonus: number;
  power: number;
  element: string | null;
}

/** 功法输入 */
export interface TechniqueInput {
  id: string;
  name: string;
  type: 'attack' | 'defense';
  rarity: string;
  level: number;
  power: number;
  bonus: number;
  element: string;
}

/** 世界效果输入 */
export interface WorldEffectInput {
  id: string;
  name: string;
  type: 'danger' | 'opportunity';
  level: number;
  statModifications: Partial<Record<string, number>>;
  specialEffects: string[];
}

/** Buff输入 */
export interface BuffInput {
  id: string;
  name: string;
  type: string;
  value: number;
  duration: number;
  remainingDuration: number;
}

/** 激活效果输入 */
export interface ActiveEffectInput {
  id: string;
  itemId: string;
  itemName: string;
  type: string;
  value: number;
  remainingCount: number;
}

/** 称号输入 */
export interface TitleInput {
  id: string;
  name: string;
  rarity: string;
  effects: TitleEffectInput[];
}

/** 称号效果输入 */
export interface TitleEffectInput {
  targetStat: string;
  calcType: string;
  value: number;
}

// ============================================
// 计算结果
// ============================================

/** 单属性计算结果 */
export interface StatCalculationResult {
  /** 目标属性 */
  stat: CalculableStat;
  
  /** 最终值 */
  finalValue: number;
  
  /** 基础值 */
  baseValue: number;
  
  /** 计算前的值 */
  preClampValue: number;
  
  /** 边界约束信息 */
  clamping: {
    applied: boolean;
    lowerBound: number;
    upperBound: number;
  };
  
  /** 效果贡献列表（按贡献排序） */
  contributions: EffectContribution[];
  
  /** 计算公式描述 */
  formulaDescription: string;
  
  /** 警告信息 */
  warnings: string[];
}

/** 批量计算结果 */
export interface CalculationResult {
  /** 计算ID */
  calculationId: string;
  
  /** 计算时间 */
  timestamp: number;
  
  /** 各属性结果 */
  stats: Map<CalculableStat, StatCalculationResult>;
  
  /** 全局警告 */
  globalWarnings: string[];
  
  /** 计算耗时（毫秒） */
  duration: number;
}

// ============================================
// 边界约束定义
// ============================================

/** 属性边界约束 */
export interface StatBounds {
  /** 属性名 */
  stat: CalculableStat;
  
  /** 下界 */
  min: number;
  
  /** 上界 */
  max: number;
  
  /** 下界行为 */
  minBehavior: 'clamp' | 'error' | 'warn';
  
  /** 上界行为 */
  maxBehavior: 'clamp' | 'error' | 'warn';
  
  /** 默认值（用于异常情况） */
  defaultValue: number;
}

/** 默认边界约束 */
export const DEFAULT_STAT_BOUNDS: Record<CalculableStat, StatBounds> = {
  // 战斗属性
  maxHp:           { stat: 'maxHp',           min: 1,     max: 999999, minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 100 },
  maxMp:           { stat: 'maxMp',           min: 0,     max: 999999, minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 50 },
  attack:          { stat: 'attack',          min: 1,     max: 99999,  minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 10 },
  defense:         { stat: 'defense',         min: 0,     max: 99999,  minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 5 },
  critRate:        { stat: 'critRate',        min: 0,     max: 1,      minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 0.05 },
  critDamage:      { stat: 'critDamage',      min: 1,     max: 10,     minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 1.5 },
  dodgeRate:       { stat: 'dodgeRate',       min: 0,     max: 0.5,    minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 0.03 },
  
  // 修炼属性
  cultivationExp:  { stat: 'cultivationExp',  min: 0.1,   max: 100,    minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 1 },
  breakthroughRate:{ stat: 'breakthroughRate',min: 0,     max: 1,      minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 0.5 },
  techniqueExp:    { stat: 'techniqueExp',    min: 0.1,   max: 100,    minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 1 },
  
  // 经济属性
  expGain:         { stat: 'expGain',         min: 0.1,   max: 100,    minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 1 },
  spiritStoneGain: { stat: 'spiritStoneGain', min: 0.1,   max: 100,    minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 1 },
  dropRate:        { stat: 'dropRate',        min: 0,     max: 10,     minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 1 },
  rarityBoost:     { stat: 'rarityBoost',     min: 0,     max: 5,      minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 0 },
  
  // 特殊属性
  luck:            { stat: 'luck',            min: 0,     max: 100,    minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 0 },
  power:           { stat: 'power',           min: 0,     max: 9999999,minBehavior: 'clamp', maxBehavior: 'clamp', defaultValue: 0 },
};
```

### 4.2 效果注册表结构

```typescript
/** 效果注册表 */
export interface EffectRegistry {
  /** 已注册效果列表 */
  effects: UnifiedEffect[];
  
  /** 效果索引（按目标属性） */
  indexByStat: Map<CalculableStat, UnifiedEffect[]>;
  
  /** 效果索引（按来源类型） */
  indexBySource: Map<EffectSourceType, UnifiedEffect[]>;
  
  /** 效果索引（按优先级） */
  indexByPriority: Map<EffectPriority, UnifiedEffect[]>;
}

/** 效果注册配置 */
export interface EffectRegistrationConfig {
  /** 是否允许重复ID */
  allowDuplicateId: boolean;
  
  /** 是否自动分配优先级 */
  autoPriority: boolean;
  
  /** 是否验证条件 */
  validateConditions: boolean;
}
```

---

## 5. 计算流程

### 5.1 完整计算流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           完整计算流程                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: 构建计算上下文                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ CalculationContext = {                                           │   │
│  │   character: 从Protagonist提取基础属性                           │   │
│  │   equipment: 从Protagonist提取装备数据                           │   │
│  │   techniques: 从Protagonist提取功法数据                          │   │
│  │   world: 从World提取世界数据                                     │   │
│  │   state: 当前运行时状态                                          │   │
│  │   titles: 已激活称号列表                                         │   │
│  │ }                                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  Step 2: 收集激活效果                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ collectEffects(context) → UnifiedEffect[]                        │   │
│  │                                                                  │   │
│  │ 1. 遍历所有效果来源                                              │   │
│  │ 2. 检查效果是否激活（条件判断）                                   │   │
│  │ 3. 转换为统一格式 UnifiedEffect                                  │   │
│  │ 4. 过滤已过期效果                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  Step 3: 效果排序                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ sortEffects(effects) → UnifiedEffect[]                           │   │
│  │                                                                  │   │
│  │ 排序规则：                                                       │   │
│  │ 1. 按优先级排序: base < passive < buff < world < special        │   │
│  │ 2. 同优先级按层级排序: layer 升序                                │   │
│  │ 3. 同层级按来源类型排序                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  Step 4: 效果分组聚合                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ groupAndAggregate(effects) → Map<Stat, AggregatedEffects>        │   │
│  │                                                                  │   │
│  │ 按目标属性分组：                                                 │   │
│  │ {                                                                │   │
│  │   'attack': {                                                    │   │
│  │     additives: [effect1, effect2],      // 加法效果              │   │
│  │     multipliers: [effect3, effect4],    // 乘法效果              │   │
│  │     overrides: [effect5],               // 覆盖效果              │   │
│  │     chains: [effect6, effect7]          // 链式效果              │   │
│  │   },                                                             │   │
│  │   ...                                                            │   │
│  │ }                                                                │   └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  Step 5: 应用计算公式                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ calculateStat(stat, baseValue, aggregatedEffects) → number       │   │
│  │                                                                  │   │
│  │ 计算顺序：                                                       │   │
│  │ 1. 获取基础值: baseValue                                         │   │
│  │ 2. 应用加法效果: value = baseValue + sum(additives)             │   │
│  │ 3. 应用乘法效果: value = value * (1 + sum(ratios))              │   │
│  │ 4. 应用链式效果: value = value * ratio1 * ratio2 * ...          │   │
│  │ 5. 应用覆盖效果: value = max/min(overrides) 或 原值             │   │
│  │                                                                  │   │
│  │ 同时记录每个步骤的贡献                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  Step 6: 边界约束                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ applyBounds(value, bounds) → { value, warnings }                 │   │
│  │                                                                  │   │
│  │ 边界处理：                                                       │   │
│  │ 1. 检查下界: value < min → clamp/error/warn                     │   │
│  │ 2. 检查上界: value > max → clamp/error/warn                     │   │
│  │ 3. 检查特殊值: NaN, Infinity → defaultValue                     │   │
│  │ 4. 生成警告信息                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  Step 7: 生成结果                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ generateResult(stat, finalValue, contributions) → Result         │   │
│  │                                                                  │   │
│  │ 结果包含：                                                       │   │
│  │ - 最终值                                                         │   │
│  │ - 基础值                                                         │   │
│  │ - 贡献列表（可追溯）                                             │   │
│  │ - 边界约束信息                                                   │   │
│  │ - 警告信息                                                       │   │
│  │ - 公式描述                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 单属性计算公式

```typescript
/**
 * 单属性计算公式
 * 
 * 公式说明：
 * 
 * 1. 加法效果（add）:
 *    final = base + Σ(value_i)
 *    
 * 2. 乘法效果（multiply）:
 *    final = base × (1 + Σ(ratio_i))
 *    注意：ratio_i 是小数形式，如 0.2 表示 +20%
 *    
 * 3. 链式效果（chain）:
 *    final = base × ratio_1 × ratio_2 × ... × ratio_n
 *    注意：每个 ratio 是倍数，如 1.2 表示 ×1.2
 *    
 * 4. 覆盖效果（override）:
 *    final = max(values) 或 min(values)
 *    取决于效果的具体定义
 *    
 * 完整计算流程：
 * 
 * step1: base_value = get_base_value(stat)
 * step2: add_value = sum(all_additive_effects)
 * step3: value_after_add = base_value + add_value
 * step4: multiply_ratio = 1 + sum(all_multiply_effects)
 * step5: value_after_multiply = value_after_add × multiply_ratio
 * step6: chain_ratio = product(all_chain_effects)
 * step7: value_after_chain = value_after_multiply × chain_ratio
 * step8: override_value = apply_override(value_after_chain)
 * step9: final_value = clamp(override_value, bounds)
 */
```

### 5.3 效果优先级详解

```typescript
/**
 * 效果优先级详解
 * 
 * 优先级顺序（从低到高）：
 * 
 * 1. base (优先级 1)
 *    - 来源：角色基础属性
 *    - 计算：直接使用，作为计算起点
 *    - 示例：体质、灵根等基础属性值
 * 
 * 2. passive (优先级 2)
 *    - 来源：装备、功法、称号的永久加成
 *    - 计算：作为被动效果叠加
 *    - 示例：装备的攻击加成、功法的属性加成
 * 
 * 3. buff (优先级 3)
 *    - 来源：临时Buff、丹药效果
 *    - 计算：在被动效果之后应用
 *    - 示例：战斗Buff、丹药的临时加成
 * 
 * 4. world (优先级 4)
 *    - 来源：世界效果（危险/机缘）
 *    - 计算：环境修正，影响所有其他效果
 *    - 示例：灵气稀薄、天降灵雨
 * 
 * 5. special (优先级 5)
 *    - 来源：特殊机制、覆盖效果
 *    - 计算：最后应用，可能覆盖之前的效果
 *    - 示例：禁疗效果、无法逃跑
 * 
 * 设计原则：
 * - 低优先级效果先计算，高优先级效果后计算
 * - 同优先级效果按 calcType 分组计算
 * - 同 calcType 效果按 layer 排序
 */
```

---

## 6. 效果系统整合

### 6.1 效果来源适配器

每种效果来源需要实现适配器，将原始数据转换为 `UnifiedEffect` 格式：

```typescript
/** 效果适配器接口 */
export interface EffectAdapter<T> {
  /** 源数据类型 */
  sourceType: EffectSourceType;
  
  /** 转换函数 */
  convert(source: T, context: CalculationContext): UnifiedEffect[];
  
  /** 验证函数 */
  validate(effect: UnifiedEffect): boolean;
}

// ============================================
// 各效果来源的适配器实现
// ============================================

/** 世界危险效果适配器 */
export const WorldDangerAdapter: EffectAdapter<WorldDanger> = {
  sourceType: 'world_danger',
  
  convert(danger: WorldDanger, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 属性修改效果
    if (danger.effect.statModifications) {
      for (const [stat, value] of Object.entries(danger.effect.statModifications)) {
        effects.push({
          id: `${danger.id}_stat_${stat}`,
          sourceType: 'world_danger',
          sourceId: danger.id,
          sourceName: danger.name,
          targetStat: mapStatName(stat),
          calcType: 'add',
          value: value,
          priority: 'world',
          tags: ['danger', `level_${danger.dangerLevel}`],
          condition: mapTriggerToCondition(danger.triggerCondition),
          duration: danger.duration,
          remainingDuration: danger.duration,
          dispellable: danger.dispellable,
          layer: danger.dangerLevel,
        });
      }
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'world_danger' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  }
};

/** 装备效果适配器 */
export const EquipmentAdapter: EffectAdapter<EquipmentInput> = {
  sourceType: 'equipment',
  
  convert(equipment: EquipmentInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    if (equipment.attackBonus > 0) {
      effects.push({
        id: `${equipment.id}_attack`,
        sourceType: 'equipment',
        sourceId: equipment.id,
        sourceName: equipment.name,
        targetStat: 'attack',
        calcType: 'add',
        value: equipment.attackBonus,
        priority: 'passive',
        tags: ['equipment', equipment.slot, equipment.rarity],
        duration: -1,
        remainingDuration: -1,
        dispellable: false,
        layer: 1,
      });
    }
    
    if (equipment.defenseBonus > 0) {
      effects.push({
        id: `${equipment.id}_defense`,
        sourceType: 'equipment',
        sourceId: equipment.id,
        sourceName: equipment.name,
        targetStat: 'defense',
        calcType: 'add',
        value: equipment.defenseBonus,
        priority: 'passive',
        tags: ['equipment', equipment.slot, equipment.rarity],
        duration: -1,
        remainingDuration: -1,
        dispellable: false,
        layer: 1,
      });
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'equipment' && 
           effect.value > 0;
  }
};

/** 功法效果适配器 */
export const TechniqueAdapter: EffectAdapter<TechniqueInput> = {
  sourceType: 'technique',
  
  convert(technique: TechniqueInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 功法威力加成（按类型影响攻击或防御）
    const targetStat: CalculableStat = technique.type === 'attack' ? 'attack' : 'defense';
    
    effects.push({
      id: `${technique.id}_power`,
      sourceType: 'technique',
      sourceId: technique.id,
      sourceName: technique.name,
      targetStat: targetStat,
      calcType: 'multiply',
      value: technique.bonus / 100, // 转换为小数
      priority: 'passive',
      tags: ['technique', technique.type, technique.rarity],
      duration: -1,
      remainingDuration: -1,
      dispellable: false,
      layer: 1,
    });
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'technique';
  }
};

/** 丹药效果适配器 */
export const PillAdapter: EffectAdapter<ActiveEffectInput> = {
  sourceType: 'pill',
  
  convert(activeEffect: ActiveEffectInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 根据效果类型映射到目标属性
    const statMapping: Record<string, CalculableStat> = {
      'stat_boost': 'luck', // 属性增益映射到幸运
      'cultivation_boost': 'cultivationExp',
      'combat_boost': 'attack',
      'luck_boost': 'luck',
    };
    
    const targetStat = statMapping[activeEffect.type] || 'luck';
    
    effects.push({
      id: activeEffect.id,
      sourceType: 'pill',
      sourceId: activeEffect.itemId,
      sourceName: activeEffect.itemName,
      targetStat: targetStat,
      calcType: 'multiply',
      value: activeEffect.value / 100,
      priority: 'buff',
      tags: ['pill', activeEffect.type],
      duration: activeEffect.remainingCount,
      remainingDuration: activeEffect.remainingCount,
      dispellable: true,
      layer: 1,
    });
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'pill';
  }
};

/** 称号效果适配器 */
export const TitleAdapter: EffectAdapter<TitleInput> = {
  sourceType: 'title',
  
  convert(title: TitleInput, context: CalculationContext): UnifiedEffect[] {
    return title.effects.map((effect, index) => ({
      id: `${title.id}_effect_${index}`,
      sourceType: 'title',
      sourceId: title.id,
      sourceName: title.name,
      targetStat: effect.targetStat as CalculableStat,
      calcType: effect.calcType as EffectCalcType,
      value: effect.value,
      priority: 'passive',
      tags: ['title', title.rarity],
      duration: -1,
      remainingDuration: -1,
      dispellable: false,
      layer: 1,
    }));
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'title';
  }
};
```

### 6.2 效果收集器

```typescript
/** 效果收集器 */
export class EffectCollector {
  private adapters: Map<EffectSourceType, EffectAdapter<unknown>> = new Map();
  
  /** 注册适配器 */
  registerAdapter<T>(adapter: EffectAdapter<T>): void {
    this.adapters.set(adapter.sourceType, adapter as EffectAdapter<unknown>);
  }
  
  /** 收集所有效果 */
  collectAll(context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 1. 收集装备效果
    effects.push(...this.collectEquipmentEffects(context));
    
    // 2. 收集功法效果
    effects.push(...this.collectTechniqueEffects(context));
    
    // 3. 收集世界效果
    effects.push(...this.collectWorldEffects(context));
    
    // 4. 收集丹药效果
    effects.push(...this.collectPillEffects(context));
    
    // 5. 收集称号效果
    effects.push(...this.collectTitleEffects(context));
    
    // 6. 收集Buff效果
    effects.push(...this.collectBuffEffects(context));
    
    // 7. 收集境界加成
    effects.push(...this.collectRealmEffects(context));
    
    return effects;
  }
  
  private collectEquipmentEffects(context: CalculationContext): UnifiedEffect[] {
    const adapter = this.adapters.get('equipment');
    if (!adapter) return [];
    
    const effects: UnifiedEffect[] = [];
    const slots = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'] as const;
    
    for (const slot of slots) {
      const equipment = context.equipment[slot];
      if (equipment) {
        effects.push(...adapter.convert(equipment, context));
      }
    }
    
    return effects;
  }
  
  private collectTechniqueEffects(context: CalculationContext): UnifiedEffect[] {
    const adapter = this.adapters.get('technique');
    if (!adapter) return [];
    
    return context.techniques.flatMap(t => adapter.convert(t, context));
  }
  
  private collectWorldEffects(context: CalculationContext): UnifiedEffect[] {
    const dangerAdapter = this.adapters.get('world_danger');
    const opportunityAdapter = this.adapters.get('world_opportunity');
    
    const effects: UnifiedEffect[] = [];
    
    if (dangerAdapter) {
      effects.push(...context.world.dangers.flatMap(d => 
        dangerAdapter.convert(d as unknown, context)
      ));
    }
    
    if (opportunityAdapter) {
      effects.push(...context.world.opportunities.flatMap(o => 
        opportunityAdapter.convert(o as unknown, context)
      ));
    }
    
    return effects;
  }
  
  private collectPillEffects(context: CalculationContext): UnifiedEffect[] {
    const adapter = this.adapters.get('pill');
    if (!adapter) return [];
    
    return context.state.activeEffects
      .filter(e => e.remainingCount > 0)
      .flatMap(e => adapter.convert(e, context));
  }
  
  private collectTitleEffects(context: CalculationContext): UnifiedEffect[] {
    const adapter = this.adapters.get('title');
    if (!adapter) return [];
    
    return context.titles.flatMap(t => adapter.convert(t, context));
  }
  
  private collectBuffEffects(context: CalculationContext): UnifiedEffect[] {
    const adapter = this.adapters.get('buff');
    if (!adapter) return [];
    
    return context.state.activeBuffs
      .filter(b => b.remainingDuration > 0)
      .flatMap(b => adapter.convert(b, context));
  }
  
  private collectRealmEffects(context: CalculationContext): UnifiedEffect[] {
    const adapter = this.adapters.get('realm');
    if (!adapter) return [];
    
    // 根据境界计算加成
    const realmBonus = this.calculateRealmBonus(context.character.realmLevel);
    return adapter.convert(realmBonus, context);
  }
  
  private calculateRealmBonus(realmLevel: number): unknown {
    // 境界加成规则：每级境界提供 5% 全属性加成
    return {
      id: 'realm_bonus',
      realmLevel,
      bonus: realmLevel * 0.05,
    };
  }
}
```

---

## 7. 边界条件设计

### 7.1 边界保护策略

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          边界保护策略                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     输入层边界保护                                │   │
│  │                                                                  │   │
│  │  1. 空值检查：null/undefined → 使用默认值                        │   │
│  │  2. 类型检查：非预期类型 → 抛出错误或使用默认值                   │   │
│  │  3. 范围检查：超出范围 → 截断到边界                              │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     中间层边界保护                                │   │
│  │                                                                  │   │
│  │  1. 效果值检查：NaN/Infinity → 跳过该效果 + 警告                 │   │
│  │  2. 累加溢出检查：超出安全整数范围 → 截断                        │   │
│  │  3. 乘法下溢检查：结果接近零 → 设置最小值                        │   │
│  │  4. 除零保护：避免除零错误                                       │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     输出层边界保护                                │   │
│  │                                                                  │   │
│  │  1. 最终值截断：超出 [min, max] → 截断到边界                     │   │
│  │  2. 负数保护：HP/MP等不允许负数 → 截断到0                        │   │
│  │  3. 概率保护：概率值强制在 [0, 1]                                │   │
│  │  4. 结果验证：NaN/Infinity → 使用默认值 + 错误日志               │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 边界检查函数

```typescript
/** 边界检查器 */
export class BoundaryChecker {
  /**
   * 检查并约束数值
   */
  static clamp(value: number, bounds: StatBounds): number {
    // 特殊值处理
    if (!Number.isFinite(value)) {
      console.warn(`[BoundaryChecker] 非有限值检测: ${value}, 使用默认值: ${bounds.defaultValue}`);
      return bounds.defaultValue;
    }
    
    // 下界检查
    if (value < bounds.min) {
      switch (bounds.minBehavior) {
        case 'error':
          throw new Error(`值 ${value} 低于下界 ${bounds.min}`);
        case 'warn':
          console.warn(`[BoundaryChecker] 值 ${value} 低于下界 ${bounds.min}, 已截断`);
          break;
        case 'clamp':
        default:
          break;
      }
      return bounds.min;
    }
    
    // 上界检查
    if (value > bounds.max) {
      switch (bounds.maxBehavior) {
        case 'error':
          throw new Error(`值 ${value} 超过上界 ${bounds.max}`);
        case 'warn':
          console.warn(`[BoundaryChecker] 值 ${value} 超过上界 ${bounds.max}, 已截断`);
          break;
        case 'clamp':
        default:
          break;
      }
      return bounds.max;
    }
    
    return value;
  }
  
  /**
   * 安全加法（防止溢出）
   */
  static safeAdd(a: number, b: number): number {
    const result = a + b;
    
    // 检查溢出
    if (a > 0 && b > 0 && result < 0) {
      return Number.MAX_SAFE_INTEGER;
    }
    if (a < 0 && b < 0 && result > 0) {
      return Number.MIN_SAFE_INTEGER;
    }
    
    return result;
  }
  
  /**
   * 安全乘法（防止精度丢失）
   */
  static safeMultiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    
    const result = a * b;
    
    // 检查溢出
    if (!Number.isFinite(result)) {
      return a > 0 && b > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
    }
    
    return result;
  }
  
  /**
   * 安全除法（防止除零）
   */
  static safeDivide(a: number, b: number, defaultValue: number = 0): number {
    if (b === 0) {
      console.warn(`[BoundaryChecker] 除零保护: ${a} / 0, 返回默认值 ${defaultValue}`);
      return defaultValue;
    }
    
    return a / b;
  }
}
```

### 7.3 边界测试用例

| 用例ID | 场景 | 输入 | 预期输出 | 优先级 |
|--------|------|------|----------|--------|
| BC001 | 正常值计算 | 基础值100, 加成+20 | 120 | P0 |
| BC002 | 空输入处理 | null | 使用默认值 | P0 |
| BC003 | 零值处理 | 基础值0 | 0或最小值 | P0 |
| BC004 | 负值处理 | HP=-50 | 0 | P0 |
| BC005 | 超大值处理 | 攻击力=99999999 | 截断到上限 | P1 |
| BC006 | 溢出保护 | 加法溢出 | MAX_SAFE_INTEGER | P1 |
| BC007 | 除零保护 | 除以0 | 默认值 | P0 |
| BC008 | NaN处理 | 计算结果NaN | 默认值 | P0 |
| BC009 | Infinity处理 | 计算结果Infinity | 最大值 | P0 |
| BC010 | 概率边界 | 暴击率=1.5 | 截断到1.0 | P0 |
| BC011 | 多效果叠加 | 10个+100%加成 | 按公式正确计算 | P1 |
| BC012 | 负面效果 | 攻击力-200 | 最小值1 | P1 |

---

## 8. 状态机设计

### 8.1 效果状态机

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         效果状态机                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                           ┌──────────┐                                  │
│                           │  Created │                                  │
│                           │  (已创建) │                                  │
│                           └────┬─────┘                                  │
│                                │                                        │
│                    ┌───────────┴───────────┐                            │
│                    │ 条件检查通过          │                            │
│                    ▼                       │                            │
│             ┌──────────┐                   │                            │
│             │  Active  │◄──────────────────┤                            │
│             │  (激活)   │                   │                            │
│             └────┬─────┘                   │                            │
│                  │                         │                            │
│        ┌─────────┼─────────┐               │                            │
│        │         │         │               │                            │
│        │  持续   │  被驱散 │  条件失效     │                            │
│        │  时间到 │         │               │                            │
│        ▼         ▼         ▼               │                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │                            │
│  │ Expired  │ │ Dispelled│ │Suspended │───┘ 条件恢复                   │
│  │ (已过期) │ │ (已驱散) │ │ (暂停)   │─────────────┐                   │
│  └──────────┘ └──────────┘ └──────────┘             │                   │
│        │              │                  ┌──────────┴──────────┐        │
│        └──────────────┴──────────────────│    Reactivate       │        │
│                                          │    (重新激活)       │        │
│                                          └──────────┬──────────┘        │
│                                                     │                   │
│                                                     ▼                   │
│                                              ┌──────────┐              │
│                                              │  Active  │              │
│                                              └──────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 状态转移表

| 当前状态 | 触发事件 | 目标状态 | 执行动作 | 优先级 |
|----------|----------|----------|----------|--------|
| Created | 条件检查通过 | Active | 激活效果，记录日志 | P0 |
| Created | 条件检查失败 | Suspended | 等待条件满足 | P1 |
| Active | 持续时间到期 | Expired | 移除效果，记录日志 | P0 |
| Active | 被驱散(可驱散) | Dispelled | 移除效果，记录日志 | P0 |
| Active | 条件失效 | Suspended | 暂停效果 | P1 |
| Active | 效果叠加 | Active | 更新效果值 | P1 |
| Suspended | 条件恢复 | Active | 重新激活效果 | P1 |
| Suspended | 持续时间到期 | Expired | 移除效果 | P1 |
| Expired | - | (终结) | 无 | - |
| Dispelled | - | (终结) | 无 | - |

### 8.3 效果生命周期管理

```typescript
/** 效果生命周期管理器 */
export class EffectLifecycleManager {
  private effects: Map<string, ManagedEffect> = new Map();
  
  /** 添加效果 */
  addEffect(effect: UnifiedEffect): void {
    const managed: ManagedEffect = {
      ...effect,
      state: this.checkCondition(effect) ? 'active' : 'suspended',
      addedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    
    this.effects.set(effect.id, managed);
  }
  
  /** 移除效果 */
  removeEffect(effectId: string): boolean {
    return this.effects.delete(effectId);
  }
  
  /** 驱散效果 */
  dispelEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.dispellable) return false;
    
    effect.state = 'dispelled';
    this.effects.delete(effectId);
    return true;
  }
  
  /** 更新效果状态（每帧/每回合调用） */
  update(): void {
    for (const [id, effect] of this.effects) {
      // 检查持续时间
      if (effect.remainingDuration > 0) {
        effect.remainingDuration--;
        if (effect.remainingDuration <= 0) {
          effect.state = 'expired';
          this.effects.delete(id);
          continue;
        }
      }
      
      // 检查条件
      const conditionMet = this.checkCondition(effect);
      if (effect.state === 'active' && !conditionMet) {
        effect.state = 'suspended';
      } else if (effect.state === 'suspended' && conditionMet) {
        effect.state = 'active';
      }
      
      effect.lastUpdatedAt = Date.now();
    }
  }
  
  /** 获取所有激活效果 */
  getActiveEffects(): UnifiedEffect[] {
    return Array.from(this.effects.values())
      .filter(e => e.state === 'active');
  }
  
  /** 检查效果条件 */
  private checkCondition(effect: UnifiedEffect): boolean {
    if (!effect.condition) return true;
    
    // 根据条件类型检查
    switch (effect.condition.type) {
      case 'in_battle':
        return /* 当前是否在战斗中 */;
      case 'out_battle':
        return /* 当前是否不在战斗中 */;
      case 'hp_below':
        return /* 当前HP是否低于阈值 */;
      case 'random':
        return Math.random() < (effect.condition.params?.chance ?? 1);
      default:
        return true;
    }
  }
}

/** 受管理的效果 */
interface ManagedEffect extends UnifiedEffect {
  state: 'active' | 'suspended' | 'expired' | 'dispelled';
  addedAt: number;
  lastUpdatedAt: number;
}
```

---

## 9. 实现计划

### 9.1 实现阶段

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          实现阶段规划                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Phase 1: 核心框架 (预计工作量: 高)                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ □ 定义核心类型 (CalculableStat, UnifiedEffect, etc.)            │   │
│  │ □ 实现 CalculationContext 构建器                                 │   │
│  │ □ 实现 EffectRegistry 和 EffectCollector                        │   │
│  │ □ 实现 EffectProcessor 核心计算逻辑                              │   │
│  │ □ 实现 BoundaryChecker 边界保护                                  │   │
│  │ □ 单元测试覆盖核心功能                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Phase 2: 适配器实现 (预计工作量: 中)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ □ 实现 WorldDangerAdapter / WorldOpportunityAdapter             │   │
│  │ □ 实现 EquipmentAdapter                                          │   │
│  │ □ 实现 TechniqueAdapter                                          │   │
│  │ □ 实现 PillAdapter                                               │   │
│  │ □ 实现 BuffAdapter                                               │   │
│  │ □ 实现 TitleAdapter                                              │   │
│  │ □ 实现 RealmAdapter                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Phase 3: 系统迁移 (预计工作量: 高)                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ □ 迁移战斗系统属性计算                                           │   │
│  │ □ 迁移修炼系统属性计算                                           │   │
│  │ □ 迁移探索系统属性计算                                           │   │
│  │ □ 迁移经济系统属性计算                                           │   │
│  │ □ 移除旧的分散计算逻辑                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Phase 4: 测试与优化 (预计工作量: 中)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ □ 完整边界测试                                                   │   │
│  │ □ 性能测试与优化                                                 │   │
│  │ □ 集成测试                                                       │   │
│  │ □ 文档完善                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 文件结构规划

```
src/lib/calculation/
├── index.ts                    # 统一导出
├── types.ts                    # 核心类型定义
├── constants.ts                # 常量定义（边界约束等）
│
├── context/
│   ├── builder.ts              # 计算上下文构建器
│   └── types.ts                # 上下文相关类型
│
├── effect/
│   ├── registry.ts             # 效果注册表
│   ├── collector.ts            # 效果收集器
│   ├── processor.ts            # 效果处理器
│   ├── lifecycle.ts            # 效果生命周期管理
│   └── types.ts                # 效果相关类型
│
├── adapters/
│   ├── index.ts                # 适配器统一导出
│   ├── base.ts                 # 适配器基类
│   ├── worldEffectAdapter.ts   # 世界效果适配器
│   ├── equipmentAdapter.ts     # 装备效果适配器
│   ├── techniqueAdapter.ts     # 功法效果适配器
│   ├── pillAdapter.ts          # 丹药效果适配器
│   ├── buffAdapter.ts          # Buff效果适配器
│   ├── titleAdapter.ts         # 称号效果适配器
│   └── realmAdapter.ts         # 境界效果适配器
│
├── calculator/
│   ├── statCalculator.ts       # 单属性计算器
│   ├── batchCalculator.ts      # 批量计算器
│   └── formulaExecutor.ts      # 公式执行器
│
├── boundary/
│   ├── checker.ts              # 边界检查器
│   ├── protector.ts            # 边界保护器
│   └── defaults.ts             # 默认边界配置
│
├── trace/
│   ├── logger.ts               # 计算日志记录器
│   └── analyzer.ts             # 计算分析器
│
└── test/
    ├── calculator.test.ts      # 计算器测试
    ├── boundary.test.ts        # 边界测试
    └── integration.test.ts     # 集成测试
```

---

## 10. 测试验证

### 10.1 单元测试清单

```typescript
/**
 * 核心测试清单
 */

// ============================================
// 计算器测试
// ============================================

describe('StatCalculator', () => {
  // 基础计算测试
  test('纯加法效果计算', () => {});
  test('纯乘法效果计算', () => {});
  test('混合效果计算', () => {});
  test('链式乘法计算', () => {});
  test('覆盖效果计算', () => {});
  
  // 边界测试
  test('零基础值计算', () => {});
  test('负值效果处理', () => {});
  test('超大值处理', () => {});
  test('NaN/Infinity处理', () => {});
  
  // 效果优先级测试
  test('效果优先级排序', () => {});
  test('同优先级效果排序', () => {});
  
  // 可追溯性测试
  test('贡献列表完整性', () => {});
  test('公式描述正确性', () => {});
});

// ============================================
// 适配器测试
// ============================================

describe('EffectAdapters', () => {
  test('世界危险效果转换', () => {});
  test('世界机缘效果转换', () => {});
  test('装备效果转换', () => {});
  test('功法效果转换', () => {});
  test('丹药效果转换', () => {});
  test('称号效果转换', () => {});
});

// ============================================
// 边界检查测试
// ============================================

describe('BoundaryChecker', () => {
  test('下界截断', () => {});
  test('上界截断', () => {});
  test('安全加法', () => {});
  test('安全乘法', () => {});
  test('安全除法', () => {});
  test('特殊值处理', () => {});
});

// ============================================
// 生命周期测试
// ============================================

describe('EffectLifecycleManager', () => {
  test('效果添加', () => {});
  test('效果移除', () => {});
  test('效果驱散', () => {});
  test('效果过期', () => {});
  test('条件暂停/恢复', () => {});
});
```

### 10.2 边界条件测试矩阵

| 测试项 | 输入范围 | 边界值 | 预期行为 |
|--------|----------|--------|----------|
| 基础属性 | [1, 100] | 0, 1, 100, 101 | 截断/正常 |
| 攻击力 | [1, 99999] | 0, 1, 99999, 100000 | 截断/正常 |
| 暴击率 | [0, 1] | -0.1, 0, 1, 1.1 | 截断/正常 |
| 加成比例 | (-∞, +∞) | -100%, 0%, 100%, 1000% | 正常计算 |
| 效果数量 | [0, 100] | 0, 1, 100, 101 | 正常/警告 |
| 计算深度 | [1, 10] | 1, 10, 11 | 正常/限制 |

### 10.3 性能测试指标

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| 单属性计算耗时 | < 0.1ms | 单次计算计时 |
| 批量计算耗时(10属性) | < 1ms | 批量计算计时 |
| 效果收集耗时(100效果) | < 1ms | 收集过程计时 |
| 内存占用 | < 1MB | 内存分析器 |
| 无内存泄漏 | 0泄漏 | 压力测试 |

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| UnifiedEffect | 统一效果格式，所有效果都转换为此格式参与计算 |
| CalculationContext | 计算上下文，包含计算所需的所有输入数据 |
| EffectAdapter | 效果适配器，将原始效果数据转换为统一格式 |
| EffectPriority | 效果优先级，决定效果的应用顺序 |
| EffectCalcType | 效果计算类型，定义效果如何叠加 |
| StatBounds | 属性边界约束，定义属性值的合法范围 |

### B. 参考文档

- [设计检查清单](/skills/user/game-design-strict/references/design-checklist.md)
- [边界测试模板](/skills/user/game-design-strict/references/boundary-test-template.md)
- [Bug模式库](/skills/user/game-design-strict/references/bug-patterns.md)

### C. 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-03-25 | 初始设计文档 | Game Design System |

