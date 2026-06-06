# 势力系统重构设计文档

> 版本: v1.0
> 日期: 2026-03-24
> 状态: 待评审

---

## 目录

1. [现状分析与问题诊断](#1-现状分析与问题诊断)
2. [设计目标与原则](#2-设计目标与原则)
3. [系统架构设计](#3-系统架构设计)
4. [详细设计](#4-详细设计)
5. [数据结构设计](#5-数据结构设计)
6. [边界条件与验证清单](#6-边界条件与验证清单)
7. [实现计划](#7-实现计划)

---

## 1. 现状分析与问题诊断

### 1.1 当前系统概览

```
┌─────────────────────────────────────────────────────────────┐
│                     势力系统现状                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   势力列表   │───▶│  加入/退出  │───▶│  基础信息   │      │
│  │ (名称/描述)  │    │   (一次性)   │    │ (声望/贡献) │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                │             │
│                     ┌──────────────────────────┘             │
│                     ▼                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   任务系统   │    │   职位系统   │    │   日常历练   │      │
│  │ (24h CD)    │    │ (声望解锁)   │    │ (30s CD)    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ 声望+贡献   │    │  折扣+俸禄   │    │ 少量资源   │        │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心问题诊断

#### 问题一：任务机制不合理 ⚠️ P0

**现象**：任务完成后进入24小时CD，导致玩家一天只能做有限数量的任务。

**根因分析**：
```
当前流程：接取任务 → 完成任务 → 提交任务 → 进入24h CD → 才能接新任务
                                                  ↑
                                          瓶颈所在
```

**问题影响**：
- 玩家在完成任务后，面临"无事可做"的真空期
- 降低了游戏的持续可玩性
- 违背了"让玩家想玩就玩"的设计理念

#### 问题二：势力差异化不足 ⚠️ P0

**现象**：不同势力对主角的影响几乎相同，选择哪个势力体验一致。

**当前状态**：
```typescript
// 当前势力数据结构
interface Faction {
  id: string;
  name: string;
  type: FactionType;
  description: string;  // 仅展示用
  characteristics: string;  // 仅展示用
  motto: string;  // 仅展示用
  // ❌ 缺少对主角的实际影响
}
```

**问题影响**：
- 玩家选择势力时没有策略考量
- 重玩价值低
- 势力特色成为摆设

#### 问题三：日常机制鸡肋 ⚠️ P1

**现象**：30秒CD的日常历练，收益极低，与势力系统割裂。

**问题分析**：
```
日常历练问题：
├── 收益低：一次历练获得的资源微不足道
├── 无关联：日常历练与势力无关
├── 体验差：30秒等待时间过短，不成系统
└── 存在感弱：玩家容易忽略此功能
```

#### 问题四：系统间缺乏串联 ⚠️ P1

**现象**：战斗、修炼、装备、功法等系统与势力几乎无交互。

**缺失的关联**：
```
当前缺失：
├── 势力 → 战斗：势力加成不影响战斗属性
├── 势力 → 修炼：势力特色不影响修炼效率
├── 势力 → 装备：无法获得势力专属装备
├── 势力 → 功法：无法学习势力专属功法
└── 势力 → 剧情：势力选择不影响游戏进程
```

### 1.3 问题严重程度矩阵

| 问题 | 影响范围 | 影响程度 | 优先级 |
|------|----------|----------|--------|
| 任务CD机制不合理 | 核心玩法 | 阻断体验 | P0 |
| 势力无差异化 | 核心系统 | 严重削弱 | P0 |
| 日常机制鸡肋 | 辅助功能 | 体验割裂 | P1 |
| 系统缺乏串联 | 整体架构 | 可扩展性差 | P1 |

---

## 2. 设计目标与原则

### 2.1 核心目标

1. **任务自由化**：玩家可连续完成任务，达到上限后才进入CD
2. **势力差异化**：每个势力有独特的加成，影响玩家发展路线
3. **系统互联化**：势力与其他系统深度绑定，形成有机整体
4. **玩法丰富化**：移除鸡肋日常，增加有意义的势力玩法

### 2.2 设计原则

#### 原则一：玩家主权原则
> 玩家应该能够自主决定游戏节奏，而不是被强制等待。

- ✅ 任务可以连续接取和完成
- ✅ 达到上限后才进入CD
- ✅ CD时间可显示、可预期

#### 原则二：选择有意义原则
> 玩家的每个选择都应该有实质性的影响。

- ✅ 不同势力有差异化加成
- ✅ 选择势力应影响发展路线
- ✅ 势力特色应体现在玩法中

#### 原则三：系统联动原则
> 各系统之间应该相互影响，形成有机整体。

- ✅ 势力加成影响战斗属性
- ✅ 势力特色影响修炼效率
- ✅ 势力职位解锁专属内容

#### 原则四：渐进式深度原则
> 系统应该易于理解，但有足够的深度供玩家探索。

- ✅ 入门简单：加入势力即可获得基础加成
- ✅ 进阶有深度：职位晋升、势力任务、专属商店
- ✅ 终极目标：成为势力领袖，解锁最高权限

---

## 3. 系统架构设计

### 3.1 新系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        势力系统新架构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      势力特性系统                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │   │
│  │  │ 基础加成    │  │ 修炼加成   │  │ 特殊能力   │              │   │
│  │  │(属性/战斗)  │  │(效率/突破) │  │(主动/被动) │              │   │
│  │  └────────────┘  └────────────┘  └────────────┘              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      任务轮次系统                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │   │
│  │  │ 任务池     │  │ 轮次机制   │  │ 奖励机制   │              │   │
│  │  │(日常/周常) │  │(连续完成)  │  │(声望/贡献) │              │   │
│  │  └────────────┘  └────────────┘  └────────────┘              │   │
│  │                                                               │   │
│  │  新流程：接取 → 完成 → 提交 → 接取下一个 → ... → 达到上限 → CD  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      贡献系统                                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │   │
│  │  │ 捐献      │  │ 任务奖励   │  │ 势力商店   │              │   │
│  │  │(灵石→贡献) │  │(声望+贡献) │  │(贡献兑换)  │              │   │
│  │  └────────────┘  └────────────┘  └────────────┘              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      势力专属系统                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │   │
│  │  │ 专属功法   │  │ 专属装备   │  │ 专属资源   │              │   │
│  │  │(势力限定)  │  │(职位解锁)  │  │(商店购买)  │              │   │
│  │  └────────────┘  └────────────┘  └────────────┘              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 系统间交互图

```
                    ┌─────────────────────────────────────┐
                    │             势力系统                 │
                    │         (核心枢纽)                   │
                    └─────────────────────────────────────┘
                           ▲    ▲    ▲    ▲    ▲
                           │    │    │    │    │
         ┌─────────────────┼────┼────┼────┼────┼─────────────────┐
         │                 │    │    │    │    │                 │
         ▼                 ▼    │    │    ▼    ▼                 ▼
    ┌─────────┐      ┌─────────┐│    │┌─────────┐      ┌─────────┐
    │ 战斗系统 │      │ 修炼系统 ││    ││ 装备系统 │      │ 功法系统 │
    │         │      │         ││    ││         │      │         │
    │ 属性加成 │      │ 效率加成 ││    ││ 专属装备 │      │ 专属功法 │
    │ 特殊技能 │      │ 突破加成 ││    ││ 套装效果 │      │ 流派契合 │
    └─────────┘      └─────────┘│    │└─────────┘      └─────────┘
                                │    │
                         ┌──────┴────┴──────┐
                         │                   │
                         ▼                   ▼
                    ┌─────────┐        ┌─────────┐
                    │ 经济系统 │        │ 剧情系统 │
                    │         │        │         │
                    │ 商店折扣 │        │ 势力事件 │
                    │ 俸禄领取 │        │ 势力任务 │
                    └─────────┘        └─────────┘
```

---

## 4. 详细设计

### 4.1 势力特性系统

#### 4.1.1 设计理念

每个势力都有其独特的特色，这些特色应该通过**具体的数值加成**和**特殊能力**体现，而不仅仅是描述文本。

#### 4.1.2 势力特性数据结构

```typescript
/**
 * 势力特性配置
 */
interface FactionTrait {
  /** 特性ID */
  id: string;
  /** 特性名称 */
  name: string;
  /** 特性描述 */
  description: string;
  /** 特性类型 */
  type: 'combat' | 'cultivation' | 'resource' | 'special';
  /** 特性效果 */
  effects: FactionTraitEffect[];
}

/**
 * 势力特性效果
 */
interface FactionTraitEffect {
  /** 效果类型 */
  type: 'stat_bonus' | 'skill_bonus' | 'cultivation_bonus' | 'special_ability';
  /** 效果参数 */
  params: Record<string, number | string>;
  /** 效果描述（用于UI展示） */
  displayText: string;
}

/**
 * 完整势力配置
 */
interface FactionConfig {
  id: string;
  name: string;
  type: FactionType;
  worldType: WorldType;
  description: string;
  characteristics: string;
  motto: string;
  requirement: string;
  
  // 新增：势力特性
  traits: FactionTrait[];
  
  // 新增：专属内容
  exclusiveTechniques: string[];  // 专属功法ID列表
  exclusiveEquipments: string[];  // 专属装备ID列表
  exclusiveShopItems: string[];   // 专属商店物品ID列表
}
```

#### 4.1.3 势力特性设计示例

以**修仙世界**的势力为例：

##### 青云剑宗（剑修圣地）

```typescript
const QINGYUN_SWORD_SECT: FactionConfig = {
  id: 'xian_sword_sect',
  name: '青云剑宗',
  type: 'sect',
  worldType: '修仙',
  description: '修仙界第一剑修圣地，剑道传承万年，弟子剑法通神。',
  traits: [
    {
      id: 'sword_heart',
      name: '剑心通明',
      description: '剑修之道，心剑合一',
      type: 'combat',
      effects: [
        {
          type: 'stat_bonus',
          params: { attack: 10 },  // 攻击力+10%
          displayText: '攻击力+10%'
        },
        {
          type: 'skill_bonus',
          params: { skillType: 'sword', damageBonus: 15 },
          displayText: '剑系功法伤害+15%'
        }
      ]
    },
    {
      id: 'sword_cultivation',
      name: '剑道精进',
      description: '剑修修炼效率提升',
      type: 'cultivation',
      effects: [
        {
          type: 'cultivation_bonus',
          params: { cultivationSpeed: 10 },
          displayText: '修炼速度+10%'
        },
        {
          type: 'cultivation_bonus',
          params: { breakthroughChance: 5 },
          displayText: '突破成功率+5%'
        }
      ]
    }
  ],
  exclusiveTechniques: ['technique_sword_qingyun', 'technique_sword_tianya'],
  exclusiveEquipments: ['equip_sword_qingfeng'],
  exclusiveShopItems: ['shop_sword_manual', 'shop_sword_material']
};
```

##### 丹鼎宗（丹道圣地）

```typescript
const DANDING_SECT: FactionConfig = {
  id: 'xian_alchemy_sect',
  name: '丹鼎宗',
  type: 'sect',
  worldType: '修仙',
  description: '丹道圣地，炼丹术冠绝天下，可炼制各种灵丹妙药。',
  traits: [
    {
      id: 'alchemy_master',
      name: '丹道宗师',
      description: '炼丹效率提升，丹药品质提升',
      type: 'resource',
      effects: [
        {
          type: 'stat_bonus',
          params: { alchemySuccess: 15 },
          displayText: '炼丹成功率+15%'
        },
        {
          type: 'stat_bonus',
          params: { pillQuality: 10 },
          displayText: '丹药品质+10%'
        }
      ]
    },
    {
      id: 'medicine_body',
      name: '药体淬炼',
      description: '常年服用丹药，体质增强',
      type: 'cultivation',
      effects: [
        {
          type: 'stat_bonus',
          params: { maxHp: 15 },
          displayText: '最大生命+15%'
        },
        {
          type: 'stat_bonus',
          params: { hpRegen: 20 },
          displayText: '生命恢复+20%'
        }
      ]
    },
    {
      id: 'pill_discount',
      name: '丹药折扣',
      description: '势力内部购买丹药优惠',
      type: 'resource',
      effects: [
        {
          type: 'stat_bonus',
          params: { pillDiscount: 20 },
          displayText: '丹药购买折扣20%'
        }
      ]
    }
  ],
  exclusiveTechniques: ['technique_alchemy_danhuo', 'technique_alchemy_liandan'],
  exclusiveEquipments: ['equip_alchemy_cauldron'],
  exclusiveShopItems: ['shop_herb_pack', 'shop_pill_recipe']
};
```

##### 金刚门（体修圣地）

```typescript
const JINGANG_SECT: FactionConfig = {
  id: 'xian_body_sect',
  name: '金刚门',
  type: 'sect',
  worldType: '修仙',
  description: '体修圣地，弟子以肉身证道，力大无穷。',
  traits: [
    {
      id: 'diamond_body',
      name: '金刚不坏',
      description: '肉身强横，防御惊人',
      type: 'combat',
      effects: [
        {
          type: 'stat_bonus',
          params: { defense: 20 },
          displayText: '防御力+20%'
        },
        {
          type: 'stat_bonus',
          params: { damageReduction: 10 },
          displayText: '伤害减免+10%'
        }
      ]
    },
    {
      id: 'body_cultivation',
      name: '体修精进',
      description: '体修修炼效率提升',
      type: 'cultivation',
      effects: [
        {
          type: 'cultivation_bonus',
          params: { cultivationSpeed: 8 },
          displayText: '修炼速度+8%'
        },
        {
          type: 'stat_bonus',
          params: { breakthroughHp: 50 },
          displayText: '突破时额外获得50点生命上限'
        }
      ]
    }
  ],
  exclusiveTechniques: ['technique_body_jingang', 'technique_body_tietou'],
  exclusiveEquipments: ['equip_armor_jingang'],
  exclusiveShopItems: ['shop_body_pill', 'shop_training_item']
};
```

#### 4.1.4 势力特性加成计算

```typescript
/**
 * 计算势力特性加成
 * @param factionId 势力ID
 * @param protagonist 主角数据
 * @returns 加成后的属性
 */
function calculateFactionBonuses(
  factionId: string,
  protagonist: Protagonist
): StatBonuses {
  const faction = getFactionById(factionId);
  if (!faction || !faction.traits) {
    return {};
  }

  const bonuses: StatBonuses = {};
  
  for (const trait of faction.traits) {
    for (const effect of trait.effects) {
      if (effect.type === 'stat_bonus') {
        for (const [stat, value] of Object.entries(effect.params)) {
          if (typeof value === 'number') {
            bonuses[stat] = (bonuses[stat] || 0) + value;
          }
        }
      }
    }
  }
  
  return bonuses;
}

/**
 * 应用势力加成到最终属性
 */
function applyFactionBonuses(
  baseStats: FinalStats,
  factionBonuses: StatBonuses
): FinalStats {
  return {
    ...baseStats,
    attack: baseStats.attack * (1 + (factionBonuses.attack || 0) / 100),
    defense: baseStats.defense * (1 + (factionBonuses.defense || 0) / 100),
    maxHp: baseStats.maxHp * (1 + (factionBonuses.maxHp || 0) / 100),
    // ... 其他属性
  };
}
```

### 4.2 任务轮次系统

#### 4.2.1 设计理念

**核心改变**：从"单任务CD制"改为"轮次上限CD制"

```
旧机制：
任务A → 完成 → CD(24h) → 任务A可用
任务B → 完成 → CD(24h) → 任务B可用
（每个任务独立CD，一天只能做固定数量）

新机制：
轮次开始 → 任务1 → 任务2 → 任务3 → ... → 轮次上限 → 轮次CD
（连续完成任务，达到上限后才进入CD）
```

#### 4.2.2 任务轮次数据结构

```typescript
/**
 * 任务轮次配置
 */
interface TaskRoundConfig {
  /** 轮次类型 */
  type: 'daily' | 'weekly';
  /** 每轮最大任务数 */
  maxTasksPerRound: number;
  /** 轮次冷却时间（毫秒） */
  roundCooldown: number;
  /** 可选任务池 */
  taskPool: string[];  // 任务ID列表
  /** 每轮刷新的任务数量 */
  tasksPerRefresh: number;
}

/**
 * 任务轮次状态
 */
interface TaskRoundState {
  /** 轮次类型 */
  type: 'daily' | 'weekly';
  /** 当前轮次已完成的任务数 */
  completedInRound: number;
  /** 当前轮次可完成的任务上限 */
  roundLimit: number;
  /** 轮次开始时间 */
  roundStartTime: number;
  /** 轮次冷却结束时间（达到上限后） */
  roundCooldownEnd: number | null;
  /** 当前可用任务 */
  availableTasks: string[];
  /** 已接取的任务 */
  acceptedTasks: Record<string, TaskProgress>;
  /** 本轮已完成任务的ID */
  completedTaskIdsInRound: string[];
}

/**
 * 任务进度
 */
interface TaskProgress {
  taskId: string;
  current: number;
  target: number;
  accepted: boolean;
  completed: boolean;
  submitted: boolean;
  acceptedTime: number;
  lastUpdateTime: number;
}
```

#### 4.2.3 任务轮次配置

```typescript
/**
 * 日常任务轮次配置
 */
const DAILY_TASK_ROUND: TaskRoundConfig = {
  type: 'daily',
  maxTasksPerRound: 5,  // 每轮最多完成5个任务
  roundCooldown: 86400000,  // 24小时
  taskPool: [
    'daily_kill_monsters',
    'daily_explore',
    'daily_cultivate',
    'daily_donate',
    'daily_collect',
    'daily_upgrade'
  ],
  tasksPerRefresh: 6  // 每次刷新6个可选任务
};

/**
 * 周常任务轮次配置
 */
const WEEKLY_TASK_ROUND: TaskRoundConfig = {
  type: 'weekly',
  maxTasksPerRound: 10,  // 每轮最多完成10个任务
  roundCooldown: 604800000,  // 7天
  taskPool: [
    'weekly_boss_hunter',
    'weekly_dungeon_master',
    'weekly_elite_hunter',
    'weekly_upgrade_equipment',
    'weekly_pvp'
  ],
  tasksPerRefresh: 5
};
```

#### 4.2.4 任务轮次流程

```
┌─────────────────────────────────────────────────────────────┐
│                      任务轮次流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐                                                 │
│  │ 轮次开始 │                                                 │
│  │(刷新任务)│                                                 │
│  └────┬────┘                                                 │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────┐                    │
│  │     已完成 < 轮次上限 ?              │                    │
│  └──────────────┬──────────────────────┘                    │
│          是    │    否                                       │
│          ▼     │     ▼                                       │
│  ┌──────────┐  │  ┌──────────────┐                          │
│  │ 接取任务  │  │  │ 进入轮次CD   │                          │
│  └────┬─────┘  │  │ (显示倒计时) │                          │
│       │        │  └──────────────┘                          │
│       ▼        │                                              │
│  ┌──────────┐  │                                              │
│  │ 完成任务  │  │                                              │
│  └────┬─────┘  │                                              │
│       │        │                                              │
│       ▼        │                                              │
│  ┌──────────┐  │                                              │
│  │ 提交任务  │  │                                              │
│  │completed++│  │                                              │
│  └────┬─────┘  │                                              │
│       │        │                                              │
│       └────────┘                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.5 核心逻辑实现

```typescript
/**
 * 检查是否可以接取新任务
 */
function canAcceptNewTask(state: TaskRoundState): boolean {
  // 检查轮次是否在CD中
  if (state.roundCooldownEnd && Date.now() < state.roundCooldownEnd) {
    return false;
  }
  
  // 检查是否达到轮次上限
  if (state.completedInRound >= state.roundLimit) {
    return false;
  }
  
  // 检查是否有可用任务
  return state.availableTasks.length > 0;
}

/**
 * 提交任务（核心逻辑）
 */
function submitTask(
  state: TaskRoundState,
  taskId: string
): { success: boolean; newState: TaskRoundState; rewards: TaskRewards } {
  const taskProgress = state.acceptedTasks[taskId];
  
  if (!taskProgress || !taskProgress.completed || taskProgress.submitted) {
    return { success: false, newState: state, rewards: {} };
  }
  
  // 更新任务状态
  const newAcceptedTasks = { ...state.acceptedTasks };
  newAcceptedTasks[taskId] = { ...taskProgress, submitted: true };
  
  // 增加轮次完成数
  const newCompletedInRound = state.completedInRound + 1;
  
  // 检查是否达到轮次上限
  let newCooldownEnd = state.roundCooldownEnd;
  if (newCompletedInRound >= state.roundLimit) {
    newCooldownEnd = Date.now() + getRoundCooldown(state.type);
  }
  
  const newState: TaskRoundState = {
    ...state,
    acceptedTasks: newAcceptedTasks,
    completedInRound: newCompletedInRound,
    completedTaskIdsInRound: [...state.completedTaskIdsInRound, taskId],
    roundCooldownEnd: newCooldownEnd
  };
  
  return {
    success: true,
    newState,
    rewards: getTaskRewards(taskId)
  };
}

/**
 * 检查并重置轮次（每日/每周调用）
 */
function checkAndResetRound(
  state: TaskRoundState,
  config: TaskRoundConfig
): TaskRoundState {
  const now = Date.now();
  
  // 检查CD是否结束
  if (state.roundCooldownEnd && now >= state.roundCooldownEnd) {
    // CD结束，重置轮次
    return {
      ...state,
      completedInRound: 0,
      roundStartTime: now,
      roundCooldownEnd: null,
      availableTasks: refreshTasks(config),
      completedTaskIdsInRound: []
    };
  }
  
  return state;
}
```

### 4.3 贡献系统增强

#### 4.3.1 贡献获取途径

```
┌─────────────────────────────────────────────────────────────┐
│                      贡献获取途径                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  主要途径（大量贡献）                                         │
│  ├── 势力任务：完成势力任务获得贡献奖励                        │
│  ├── 势力捐献：捐献灵石获得贡献（1:1比例）                     │
│  └── 职位晋升：晋升时获得一次性贡献奖励                        │
│                                                              │
│  次要途径（少量贡献）                                         │
│  ├── 势力战斗：参与势力战获得贡献                             │
│  └── 势力事件：完成势力特殊事件获得贡献                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.2 贡献消耗途径

```
┌─────────────────────────────────────────────────────────────┐
│                      贡献消耗途径                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  势力商店                                                     │
│  ├── 基础物品：丹药、材料等（低贡献）                         │
│  ├── 稀有物品：突破丹、修炼丹等（中贡献）                      │
│  ├── 专属物品：势力功法、装备（高贡献）                       │
│  └── 限定物品：特殊道具、称号（极高贡献）                     │
│                                                              │
│  势力服务                                                     │
│  ├── 传功：消耗贡献学习势力功法                               │
│  ├── 装备锻造：消耗贡献锻造势力专属装备                       │
│  └── 特殊服务：消耗贡献获得特殊效果                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 日常机制重新设计

#### 4.4.1 移除现有日常历练

**决策**：移除当前的30秒CD日常历练功能。

**原因**：
1. 收益过低，玩家没有动力使用
2. 与势力系统完全脱节
3. 存在感弱，容易被忽略
4. 没有战略深度

#### 4.4.2 新增：势力委托系统

替代原有的日常历练，设计一个与势力深度绑定的委托系统。

```
┌─────────────────────────────────────────────────────────────┐
│                      势力委托系统                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  概念：势力发布的特殊委托，完成后获得丰厚奖励                  │
│                                                              │
│  委托类型：                                                   │
│  ├── 讨伐委托：击败指定敌人                                   │
│  ├── 收集委托：收集指定材料                                   │
│  ├── 探索委托：完成指定探索                                   │
│  └── 护送委托：完成指定护送                                   │
│                                                              │
│  委托品质：                                                   │
│  ├── 普通：基础奖励                                          │
│  ├── 精英：中等奖励                                          │
│  ├── 稀有：丰厚奖励                                          │
│  └── 传说：极丰厚奖励                                        │
│                                                              │
│  刷新机制：                                                   │
│  ├── 每日自动刷新3个普通委托                                  │
│  ├── 贡献点可刷新获得更高品质委托                            │
│  └── 周常重置所有委托                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.3 委托数据结构

```typescript
/**
 * 势力委托配置
 */
interface FactionCommission {
  id: string;
  name: string;
  description: string;
  type: 'hunt' | 'collect' | 'explore' | 'escort';
  quality: 'common' | 'elite' | 'rare' | 'legendary';
  requirements: CommissionRequirement[];
  rewards: CommissionRewards;
  timeLimit: number;  // 时间限制（毫秒），0表示无限制
  minRank?: string;   // 最低职位要求
}

/**
 * 委托需求
 */
interface CommissionRequirement {
  type: 'kill' | 'collect' | 'explore';
  target: string;
  count: number;
  description: string;
}

/**
 * 委托奖励
 */
interface CommissionRewards {
  contribution: number;
  reputation: number;
  experience?: number;
  items?: { itemId: string; quantity: number }[];
  // 委托品质加成
  qualityBonus: number;  // 品质加成系数
}

/**
 * 委托状态
 */
interface CommissionState {
  /** 当前委托列表 */
  commissions: Record<string, CommissionProgress>;
  /** 每日免费刷新次数 */
  dailyFreeRefresh: number;
  /** 上次刷新时间 */
  lastRefreshTime: number;
  /** 今日已完成委托数 */
  todayCompleted: number;
}

interface CommissionProgress {
  commissionId: string;
  current: number;
  target: number;
  accepted: boolean;
  completed: boolean;
  submitted: boolean;
  acceptedTime: number;
  expiresAt: number | null;
}
```

#### 4.4.4 委托奖励配置示例

```typescript
const COMMISSION_CONFIGS: Record<string, CommissionRewards> = {
  common: {
    contribution: 50,
    reputation: 30,
    qualityBonus: 1.0
  },
  elite: {
    contribution: 100,
    reputation: 60,
    experience: 50,
    qualityBonus: 1.5
  },
  rare: {
    contribution: 200,
    reputation: 120,
    experience: 100,
    items: [{ itemId: 'pill_cultivation_mid', quantity: 1 }],
    qualityBonus: 2.0
  },
  legendary: {
    contribution: 500,
    reputation: 300,
    experience: 300,
    items: [{ itemId: 'pill_breakthrough_mid', quantity: 1 }],
    qualityBonus: 3.0
  }
};
```

### 4.5 势力专属内容

#### 4.5.1 势力专属功法

每个势力拥有独特的功法，只有加入该势力的玩家才能学习和使用。

```typescript
/**
 * 势力专属功法配置
 */
interface FactionTechnique {
  id: string;
  name: string;
  description: string;
  factionId: string;
  requiredRank: string;  // 需要的职位
  requiredContribution: number;  // 需要的贡献点
  effects: TechniqueEffect[];
  lore: string;  // 功法背景故事
}

// 示例：青云剑宗专属功法
const QINGYUN_TECHNIQUES: FactionTechnique[] = [
  {
    id: 'technique_sword_qingyun',
    name: '青云剑诀',
    description: '青云剑宗入门剑法，剑意如云，飘逸灵动',
    factionId: 'xian_sword_sect',
    requiredRank: 'outer_disciple',
    requiredContribution: 500,
    effects: [
      { type: 'damage', value: 50, skillType: 'sword' },
      { type: 'crit_chance', value: 5 }
    ],
    lore: '此剑法由青云剑宗开山祖师所创，讲究以柔克刚，剑意连绵不绝...'
  },
  {
    id: 'technique_sword_tianya',
    name: '天涯剑意',
    description: '青云剑宗核心剑法，剑出天涯，无人可挡',
    factionId: 'xian_sword_sect',
    requiredRank: 'core_disciple',
    requiredContribution: 2000,
    effects: [
      { type: 'damage', value: 150, skillType: 'sword' },
      { type: 'crit_damage', value: 30 },
      { type: 'special', value: 'ignores_defense_20' }
    ],
    lore: '剑至天涯，意达海角。此剑法传自青云剑宗掌门一脉...'
  }
];
```

#### 4.5.2 势力专属装备

```typescript
/**
 * 势力专属装备配置
 */
interface FactionEquipment {
  id: string;
  name: string;
  description: string;
  factionId: string;
  requiredRank: string;
  requiredContribution: number;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  stats: EquipmentStats;
  setBonus?: SetBonus;
}

// 示例：丹鼎宗专属装备
const DANDING_EQUIPMENTS: FactionEquipment[] = [
  {
    id: 'equip_alchemy_cauldron',
    name: '九转丹鼎',
    description: '丹鼎宗镇宗之宝的仿制品，炼丹成功率大幅提升',
    factionId: 'xian_alchemy_sect',
    requiredRank: 'inner_disciple',
    requiredContribution: 1500,
    slot: 'accessory',
    rarity: '史诗',
    stats: {
      alchemySuccess: 20,
      pillQuality: 15
    }
  }
];
```

---

## 5. 数据结构设计

### 5.1 势力进度数据结构

```typescript
/**
 * 势力进度（完整版）
 */
interface FactionProgress {
  // 基础信息
  factionId: string;
  joinTime: number;
  
  // 声望与贡献
  reputation: number;
  contribution: number;
  
  // 职位系统
  rank: string;
  lastRankPromotion: number;
  
  // 任务轮次系统
  dailyRound: TaskRoundState;
  weeklyRound: TaskRoundState;
  
  // 委托系统
  commissions: CommissionState;
  
  // 统计数据
  tasksCompleted: number;
  commissionsCompleted: number;
  totalDonated: number;
  
  // 已解锁内容
  unlockedTechniques: string[];
  unlockedEquipments: string[];
  
  // 特殊标记
  lastDailyReward?: number;
  specialFlags: Record<string, boolean>;
}
```

### 5.2 主角数据扩展

```typescript
/**
 * 主角数据扩展（势力相关）
 */
interface ProtagonistFactionExtension {
  // 势力ID
  factionId: string | null;
  factionJoinTime: number | null;
  
  // 势力进度
  factionProgress: FactionProgress | null;
  
  // 势力加成缓存
  factionBonuses: StatBonuses;
  
  // 已学习的势力功法
  factionTechniques: string[];
  
  // 已获得的势力装备
  factionEquipments: string[];
}
```

### 5.3 存档迁移方案

```typescript
/**
 * 存档迁移：V2 -> V3
 * 处理势力系统的数据结构变化
 */
function migrateFactionDataV2ToV3(oldData: any): FactionProgress {
  // 检查是否存在旧数据
  if (!oldData) {
    return null;
  }
  
  // 迁移任务系统
  const oldTaskProgress = oldData.taskProgress || {};
  const oldAvailableTaskIds = oldData.availableTaskIds || [];
  
  // 将旧的单任务CD机制转换为新轮次机制
  const dailyRound: TaskRoundState = {
    type: 'daily',
    completedInRound: 0,  // 重置计数
    roundLimit: 5,
    roundStartTime: Date.now(),
    roundCooldownEnd: null,
    availableTasks: oldAvailableTaskIds.filter(id => id.startsWith('daily')),
    acceptedTasks: Object.fromEntries(
      Object.entries(oldTaskProgress)
        .filter(([id]) => id.startsWith('daily'))
        .map(([id, progress]) => [id, progress as TaskProgress])
    ),
    completedTaskIdsInRound: []
  };
  
  const weeklyRound: TaskRoundState = {
    type: 'weekly',
    completedInRound: 0,
    roundLimit: 10,
    roundStartTime: Date.now(),
    roundCooldownEnd: null,
    availableTasks: oldAvailableTaskIds.filter(id => id.startsWith('weekly')),
    acceptedTasks: Object.fromEntries(
      Object.entries(oldTaskProgress)
        .filter(([id]) => id.startsWith('weekly'))
        .map(([id, progress]) => [id, progress as TaskProgress])
    ),
    completedTaskIdsInRound: []
  };
  
  // 迁移日常机制 -> 委托系统
  const commissions: CommissionState = {
    commissions: {},
    dailyFreeRefresh: 3,
    lastRefreshTime: Date.now(),
    todayCompleted: 0
  };
  
  return {
    factionId: oldData.factionId,
    joinTime: oldData.joinTime || Date.now(),
    reputation: oldData.reputation || 0,
    contribution: oldData.contribution || 0,
    rank: oldData.rank || 'servant',
    lastRankPromotion: oldData.lastRankPromotion || 0,
    dailyRound,
    weeklyRound,
    commissions,
    tasksCompleted: oldData.tasksCompleted || 0,
    commissionsCompleted: 0,
    totalDonated: oldData.totalDonated || 0,
    unlockedTechniques: oldData.unlockedTechniques || [],
    unlockedEquipments: oldData.unlockedEquipments || [],
    lastDailyReward: oldData.lastDailyReward,
    specialFlags: {}
  };
}
```

---

## 6. 边界条件与验证清单

### 6.1 任务轮次系统边界条件

| 测试场景 | 边界值 | 预期行为 | 优先级 |
|----------|--------|----------|--------|
| 轮次完成数为0 | completedInRound = 0 | 可以接取任务 | P0 |
| 轮次完成数等于上限 | completedInRound = roundLimit | 不能接取新任务，进入CD | P0 |
| 轮次完成数超过上限 | completedInRound > roundLimit | 不应该发生，数据保护 | P0 |
| CD时间结束 | now >= roundCooldownEnd | 重置轮次，可以继续任务 | P0 |
| CD时间为null | roundCooldownEnd = null | 正常状态，可以继续任务 | P1 |
| 无可用任务 | availableTasks = [] | 提示用户等待刷新 | P1 |
| 同时接取多个任务 | acceptedTasks > 1 | 允许，并行完成 | P1 |

### 6.2 势力特性加成边界条件

| 测试场景 | 边界值 | 预期行为 | 优先级 |
|----------|--------|----------|--------|
| 未加入势力 | factionId = null | 无加成 | P0 |
| 加入势力 | factionId 有值 | 获得对应加成 | P0 |
| 加成值为0 | bonus = 0 | 属性不变 | P1 |
| 加成值为负数 | bonus < 0 | 不允许，数据保护 | P0 |
| 加成值超过100% | bonus > 100 | 正常计算，如攻击+150% | P1 |
| 多个特性叠加 | multiple traits | 按规则叠加（加法/乘法） | P0 |
| 势力ID不存在 | factionId 无效 | 无加成，记录警告 | P1 |

### 6.3 委托系统边界条件

| 测试场景 | 边界值 | 预期行为 | 优先级 |
|----------|--------|----------|--------|
| 委托未接取 | accepted = false | 显示接取按钮 | P0 |
| 委托已接取 | accepted = true | 显示进度 | P0 |
| 委托已完成 | completed = true | 显示提交按钮 | P0 |
| 委托已提交 | submitted = true | 显示完成状态 | P0 |
| 委托超时 | now > expiresAt | 委托失败，重置状态 | P0 |
| 无时间限制 | timeLimit = 0 | 永不过期 | P1 |
| 刷新次数为0 | dailyFreeRefresh = 0 | 禁止免费刷新 | P1 |
| 今日完成数达到上限 | todayCompleted >= limit | 禁止接取新委托 | P1 |

### 6.4 状态机验证

#### 任务轮次状态机

```
┌─────────────────────────────────────────────────────────────┐
│                    任务轮次状态机                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐                                                │
│   │  IDLE   │ ←────────────────────────────────┐            │
│   │ (空闲)  │                                  │            │
│   └────┬────┘                                  │            │
│        │ 接取任务                               │            │
│        ▼                                       │            │
│   ┌─────────┐                                  │            │
│   │ WORKING │ ←────────────┐                   │            │
│   │ (进行中) │              │ 继续接取          │            │
│   └────┬────┘              │                   │            │
│        │ 提交任务           │                   │            │
│        ▼                   │                   │            │
│   ┌─────────┐              │                   │            │
│   │COMPLETE │ ─────────────┘                   │            │
│   │ (完成中) │                                  │            │
│   └────┬────┘                                  │            │
│        │ 达到上限                               │            │
│        ▼                                       │            │
│   ┌─────────┐                                  │            │
│   │COOLDOWN │ ─────────────────────────────────┘            │
│   │ (冷却中) │  CD结束                              │            │
│   └─────────┘                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

状态转移表：
┌───────────┬───────────────────┬───────────┬─────────────────┐
│ 当前状态  │ 触发条件           │ 目标状态  │ 动作            │
├───────────┼───────────────────┼───────────┼─────────────────┤
│ IDLE      │ 接取任务           │ WORKING   │ 记录任务        │
│ WORKING   │ 提交任务           │ COMPLETE  │ 发放奖励        │
│ WORKING   │ 继续接取           │ WORKING   │ 记录任务        │
│ COMPLETE  │ 未达上限           │ WORKING   │ 可继续接取      │
│ COMPLETE  │ 达到上限           │ COOLDOWN  │ 进入CD          │
│ COOLDOWN  │ CD结束             │ IDLE      │ 重置轮次        │
└───────────┴───────────────────┴───────────┴─────────────────┘
```

### 6.5 完整验证清单

基于游戏设计严格验证原则，以下是必须通过的检查项：

#### 代码质量检查
- [ ] 所有变量在使用前已初始化
- [ ] 所有除法运算有除零检查
- [ ] 所有数组访问有边界检查
- [ ] 所有对象引用有判空检查

#### 逻辑完整性检查
- [ ] 所有任务可完成（无无法满足的条件）
- [ ] 所有势力可加入（无矛盾条件）
- [ ] 所有职位可晋升（条件明确）
- [ ] 所有委托可完成（目标可达）

#### 数值系统验证
- [ ] 声望不会出现负数
- [ ] 贡献不会出现负数
- [ ] 加成计算顺序明确
- [ ] 概率值在 [0, 100] 范围内

#### 存档系统验证
- [ ] 存档数据结构向后兼容
- [ ] 旧版存档可正确迁移
- [ ] 迁移失败有兜底逻辑

---

## 7. 实现计划

### 7.1 开发阶段划分

```
┌─────────────────────────────────────────────────────────────┐
│                      实现阶段规划                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  阶段一：核心重构（P0）                                       │
│  ├── 势力特性系统实现                                        │
│  ├── 任务轮次系统实现                                        │
│  └── 数据迁移逻辑                                           │
│                                                              │
│  阶段二：功能增强（P1）                                       │
│  ├── 移除旧日常系统                                         │
│  ├── 势力委托系统实现                                        │
│  └── 势力专属商店扩展                                        │
│                                                              │
│  阶段三：内容扩充（P2）                                       │
│  ├── 势力专属功法实现                                        │
│  ├── 势力专属装备实现                                        │
│  └── 势力特殊事件                                           │
│                                                              │
│  阶段四：体验优化（P3）                                       │
│  ├── UI/UX优化                                              │
│  ├── 数值平衡调整                                           │
│  └── 玩家反馈迭代                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 阶段一详细任务清单

| 任务 | 描述 | 优先级 | 依赖 |
|------|------|--------|------|
| 势力特性数据结构 | 定义FactionTrait等类型 | P0 | 无 |
| 势力特性配置 | 为所有势力添加特性配置 | P0 | 上一个 |
| 特性加成计算 | 实现calculateFactionBonuses | P0 | 上一个 |
| 特性加成应用 | 在getFinalStats中应用加成 | P0 | 上一个 |
| 任务轮次数据结构 | 定义TaskRoundState等类型 | P0 | 无 |
| 任务轮次逻辑 | 实现submitTask等核心逻辑 | P0 | 上一个 |
| 任务轮次UI | 更新FactionPanel显示 | P0 | 上一个 |
| 存档迁移V3 | 实现migrateFactionDataV2ToV3 | P0 | 全部 |

### 7.3 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 存档迁移失败 | 中 | 高 | 完善迁移逻辑，添加回滚机制 |
| 数值失衡 | 中 | 中 | 增加数值模拟测试，收集玩家反馈 |
| UI改动过大 | 低 | 中 | 保持UI风格一致，逐步迭代 |
| 性能问题 | 低 | 低 | 加成计算使用缓存 |

---

## 附录

### A. 势力特性完整列表

（详见实现文档）

### B. 任务配置完整列表

（详见实现文档）

### C. 委托配置完整列表

（详见实现文档）

---

> 文档结束
> 
> 请评审后确认是否进入开发阶段
