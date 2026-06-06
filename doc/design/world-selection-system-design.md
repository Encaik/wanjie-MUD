# 世界选择系统设计文档

## 一、系统概述

### 1.1 背景与问题
当前世界选择系统存在以下问题：
1. **危险与机缘无实际效果**：仅作为文本描述展示，`impact` 字段定义的属性影响未在游戏中实现
2. **难度系数未与飞升关联**：世界难度系数是静态值，不随飞升次数动态变化
3. **奖励与难度不匹配**：高难度世界的奖励加成不够明显，缺乏挑战动力
4. **世界选择缺乏策略性**：玩家无法根据自身实力做出有意义的选择

### 1.2 设计目标
- 实现难度系数与飞升次数的动态关联
- 让危险和机缘产生实际游戏效果
- 建立难度与奖励的正相关体系
- 增加世界选择的策略深度

### 1.3 核心设计原则
- **渐进式难度**：飞升次数越多，可选择的世界难度越高
- **风险收益对等**：高难度世界提供更丰厚的奖励
- **策略选择**：玩家可根据自身实力选择适合的世界
- **体验差异化**：不同难度世界提供不同的游戏体验

---

## 二、世界难度系统设计

### 2.1 难度系数计算公式

```typescript
/**
 * 计算世界实际难度系数
 * @param baseCoefficient 世界基础系数（1.0-1.5）
 * @param ascensionCount 飞升次数
 * @returns 实际难度系数
 */
function calculateWorldDifficultyCoefficient(
  baseCoefficient: number,
  ascensionCount: number
): number {
  // 基础系数 + 飞升加成
  // 每次飞升增加 0.15 系数
  const ascensionBonus = ascensionCount * 0.15;
  
  // 难度系数上限为 5.0
  return Math.min(5.0, baseCoefficient + ascensionBonus);
}
```

### 2.2 难度等级划分

| 难度等级 | 系数范围 | 飞升次数要求 | 标识色 |
|---------|---------|------------|-------|
| 简单 | 0.8 - 1.0 | 0次 | 绿色 |
| 普通 | 1.0 - 1.3 | 0次 | 白色 |
| 困难 | 1.3 - 2.0 | 1次+ | 黄色 |
| 噩梦 | 2.0 - 3.0 | 3次+ | 橙色 |
| 地狱 | 3.0 - 4.0 | 5次+ | 红色 |
| 深渊 | 4.0 - 5.0 | 8次+ | 紫色 |

### 2.3 世界选择限制

```typescript
interface WorldSelectionRule {
  minAscension: number;     // 最低飞升次数
  maxAscension: number;     // 最高飞升次数（可选）
  coefficientRange: [number, number]; // 系数范围
  unlockMessage?: string;   // 解锁提示
}

const WORLD_SELECTION_RULES: WorldSelectionRule[] = [
  { minAscension: 0, coefficientRange: [0.8, 1.3], unlockMessage: '初始可选世界' },
  { minAscension: 1, coefficientRange: [1.3, 2.0], unlockMessage: '解锁困难世界' },
  { minAscension: 3, coefficientRange: [2.0, 3.0], unlockMessage: '解锁噩梦世界' },
  { minAscension: 5, coefficientRange: [3.0, 4.0], unlockMessage: '解锁地狱世界' },
  { minAscension: 8, coefficientRange: [4.0, 5.0], unlockMessage: '解锁深渊世界' },
];
```

### 2.4 难度系数影响范围

```typescript
interface DifficultyEffects {
  // 敌人属性加成
  enemyHpMultiplier: number;      // 敌人生命加成
  enemyAttackMultiplier: number;  // 敌人攻击加成
  enemyDefenseMultiplier: number; // 敌人防御加成
  
  // 奖励加成
  expMultiplier: number;          // 经验加成
  spiritStoneMultiplier: number;  // 灵石加成
  dropRateMultiplier: number;     // 掉落率加成
  qualityBonus: number;           // 品质提升概率
  
  // 特殊效果
  specialEventChance: number;     // 特殊事件概率
  rareEnemyChance: number;        // 稀有敌人概率
}

/**
 * 根据难度系数计算各项影响
 */
function calculateDifficultyEffects(coefficient: number): DifficultyEffects {
  // 敌人属性：线性增长
  const enemyHpMultiplier = 0.8 + (coefficient - 1) * 0.4;
  const enemyAttackMultiplier = 0.85 + (coefficient - 1) * 0.35;
  const enemyDefenseMultiplier = 0.8 + (coefficient - 1) * 0.3;
  
  // 奖励：指数增长（高难度奖励更丰厚）
  const expMultiplier = 1 + Math.pow(coefficient - 1, 1.5);
  const spiritStoneMultiplier = 1 + Math.pow(coefficient - 1, 1.6);
  const dropRateMultiplier = 1 + (coefficient - 1) * 0.5;
  const qualityBonus = Math.max(0, (coefficient - 1.5) * 0.1);
  
  // 特殊效果
  const specialEventChance = Math.min(0.5, (coefficient - 1) * 0.1);
  const rareEnemyChance = Math.min(0.4, (coefficient - 1) * 0.08);
  
  return {
    enemyHpMultiplier,
    enemyAttackMultiplier,
    enemyDefenseMultiplier,
    expMultiplier,
    spiritStoneMultiplier,
    dropRateMultiplier,
    qualityBonus,
    specialEventChance,
    rareEnemyChance,
  };
}
```

---

## 三、危险系统设计

### 3.1 危险类型定义

```typescript
type DangerType = 
  | 'stat_debuff'      // 属性削弱
  | 'resource_drain'   // 资源消耗
  | 'enemy_buff'       // 敌人强化
  | 'random_event'     // 随机负面事件
  | 'special_mechanic'; // 特殊机制

interface WorldDanger {
  id: string;
  type: DangerType;
  name: string;
  description: string;
  
  // 触发条件
  triggerCondition?: {
    type: 'on_enter' | 'on_battle_start' | 'on_turn' | 'on_explore';
    chance: number;
  };
  
  // 效果
  effect: DangerEffect;
  
  // 持续时间（-1表示永久，0表示即时）
  duration: number;
  
  // 是否可驱散
  dispellable: boolean;
  
  // 危险等级（影响UI显示）
  dangerLevel: 1 | 2 | 3 | 4 | 5;
}

interface DangerEffect {
  // 属性修改
  statModifications?: Partial<Record<StatName, number>>;
  
  // 资源修改
  resourceModifications?: {
    hp?: number;           // 每回合损失HP
    mp?: number;           // 每回合损失MP
    spiritStones?: number; // 进入时扣除灵石
  };
  
  // 敌人强化
  enemyBuffs?: {
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;
  };
  
  // 特殊效果
  specialEffects?: {
    type: 'no_heal' | 'no_escape' | 'double_damage_chance' | 'curse';
    value?: number;
  };
}
```

### 3.2 危险实例

```typescript
const WORLD_DANGERS: WorldDanger[] = [
  // === 1级危险（轻微） ===
  {
    id: 'weak_lingqi',
    type: 'stat_debuff',
    name: '灵气稀薄',
    description: '此方天地灵气稀薄，修炼效率降低',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 灵根: -1 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  
  // === 2级危险（中等） ===
  {
    id: 'demon_erosion',
    type: 'resource_drain',
    name: '魔气侵蚀',
    description: '魔气弥漫，每回合损失少量生命',
    triggerCondition: { type: 'on_turn', chance: 0.3 },
    effect: {
      resourceModifications: { hp: -5 }
    },
    duration: 0,
    dispellable: true,
    dangerLevel: 2,
  },
  
  // === 3级危险（严重） ===
  {
    id: 'enemy_territory',
    type: 'enemy_buff',
    name: '敌人领地',
    description: '此处为敌人领地，敌人战斗力提升20%',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: {
      enemyBuffs: {
        attackBonus: 0.2,
        defenseBonus: 0.15,
      }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 3,
  },
  
  // === 4级危险（致命） ===
  {
    id: 'cursed_land',
    type: 'special_mechanic',
    name: '诅咒之地',
    description: '无法使用恢复类道具和技能',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'no_heal' }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 4,
  },
  
  // === 5级危险（灾难） ===
  {
    id: 'realm_collapse',
    type: 'random_event',
    name: '界域崩塌',
    description: '每回合有概率受到大量伤害，并可能遭遇强敌',
    triggerCondition: { type: 'on_turn', chance: 0.15 },
    effect: {
      resourceModifications: { hp: -30 },
      specialEffects: { type: 'double_damage_chance', value: 0.2 }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 5,
  },
];
```

### 3.3 危险生成规则

```typescript
/**
 * 根据世界难度系数生成危险
 */
function generateWorldDangers(
  worldType: WorldType,
  difficultyCoefficient: number
): WorldDanger[] {
  const dangers: WorldDanger[] = [];
  
  // 根据难度确定危险数量
  // 简单(0-1): 0个, 普通(1-1.5): 1个, 困难(1.5-2.5): 1-2个
  // 噩梦(2.5-3.5): 2-3个, 地狱(3.5-4.5): 3-4个, 深渊(4.5+): 4-5个
  const dangerCount = Math.floor((difficultyCoefficient - 0.5) / 0.8);
  
  // 筛选符合难度等级的危险
  const maxDangerLevel = Math.min(5, Math.ceil(difficultyCoefficient));
  const availableDangers = WORLD_DANGERS.filter(
    d => d.dangerLevel <= maxDangerLevel
  );
  
  // 随机选择（高等级危险有更高权重）
  for (let i = 0; i < dangerCount && availableDangers.length > 0; i++) {
    const weights = availableDangers.map(d => d.dangerLevel * d.dangerLevel);
    const selectedIndex = weightedRandomIndex(weights);
    dangers.push(availableDangers.splice(selectedIndex, 1)[0]);
  }
  
  return dangers;
}
```

---

## 四、机缘系统设计

### 4.1 机缘类型定义

```typescript
type OpportunityType =
  | 'stat_buff'        // 属性加成
  | 'resource_gain'    // 资源获取
  | 'special_ability'  // 特殊能力
  | 'rare_drop'        // 稀有掉落
  | 'favorable_event'; // 有利事件

interface WorldOpportunity {
  id: string;
  type: OpportunityType;
  name: string;
  description: string;
  
  // 触发条件
  triggerCondition: {
    type: 'on_enter' | 'on_battle_end' | 'on_explore' | 'random';
    chance: number;
  };
  
  // 效果
  effect: OpportunityEffect;
  
  // 持续时间（-1表示永久，0表示即时）
  duration: number;
  
  // 机缘等级
  opportunityLevel: 1 | 2 | 3 | 4 | 5;
  
  // 是否与危险冲突（某些危险会抵消机缘）
  conflictsWith?: string[];
}

interface OpportunityEffect {
  // 属性加成
  statModifications?: Partial<Record<StatName, number>>;
  
  // 资源获取
  resourceGains?: {
    hp?: number;
    mp?: number;
    spiritStones?: number;
    exp?: number;
  };
  
  // 特殊效果
  specialEffects?: {
    type: 'double_exp' | 'double_drop' | 'free_retreat' | 'extra_loot';
    value?: number;
  };
  
  // 稀有掉落加成
  dropBonus?: {
    rarityBoost: number;   // 稀有度提升
    extraDropChance: number; // 额外掉落概率
  };
}
```

### 4.2 机缘实例

```typescript
const WORLD_OPPORTUNITIES: WorldOpportunity[] = [
  // === 1级机缘（轻微） ===
  {
    id: 'rich_lingqi',
    type: 'stat_buff',
    name: '灵气充沛',
    description: '此方天地灵气充沛，修炼效率提升',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 灵根: 2, 悟性: 1 }
    },
    duration: -1,
    opportunityLevel: 1,
  },
  
  // === 2级机缘（中等） ===
  {
    id: 'treasure_vein',
    type: 'resource_gain',
    name: '灵脉矿藏',
    description: '发现灵脉，每次探索额外获得灵石',
    triggerCondition: { type: 'on_explore', chance: 0.4 },
    effect: {
      resourceGains: { spiritStones: 50 }
    },
    duration: 0,
    opportunityLevel: 2,
  },
  
  // === 3级机缘（良好） ===
  {
    id: 'ancient_realm',
    type: 'special_ability',
    name: '上古遗迹',
    description: '进入上古修士留下的遗迹，获得额外经验',
    triggerCondition: { type: 'on_enter', chance: 0.3 },
    effect: {
      specialEffects: { type: 'double_exp', value: 1.5 }
    },
    duration: -1,
    opportunityLevel: 3,
  },
  
  // === 4级机缘（优秀） ===
  {
    id: 'lucky_star',
    type: 'rare_drop',
    name: '吉星高照',
    description: '运势大好，掉落稀有物品概率大幅提升',
    triggerCondition: { type: 'on_enter', chance: 0.2 },
    effect: {
      dropBonus: {
        rarityBoost: 1,      // 稀有度提升1级
        extraDropChance: 0.3,
      }
    },
    duration: -1,
    opportunityLevel: 4,
  },
  
  // === 5级机缘（天赐） ===
  {
    id: 'heavenly_blessing',
    type: 'favorable_event',
    name: '天赐良机',
    description: '天命眷顾，所有收益翻倍，且有几率获得传说物品',
    triggerCondition: { type: 'on_enter', chance: 0.1 },
    effect: {
      specialEffects: { type: 'double_drop', value: 2.0 },
      statModifications: { 幸运: 5 },
      dropBonus: {
        rarityBoost: 2,
        extraDropChance: 0.5,
      }
    },
    duration: -1,
    opportunityLevel: 5,
  },
];
```

### 4.3 机缘生成规则

```typescript
/**
 * 根据世界难度系数生成机缘
 * 高难度世界也有更高级的机缘（风险收益对等）
 */
function generateWorldOpportunities(
  worldType: WorldType,
  difficultyCoefficient: number
): WorldOpportunity[] {
  const opportunities: WorldOpportunity[] = [];
  
  // 机缘数量与难度正相关
  // 难度越高，机缘等级越高，但数量可能略少
  const baseCount = Math.max(1, Math.floor((difficultyCoefficient + 0.5) / 1.2));
  
  // 筛选符合难度等级的机缘
  const maxOpportunityLevel = Math.min(5, Math.ceil(difficultyCoefficient * 1.2));
  const availableOpportunities = WORLD_OPPORTUNITIES.filter(
    o => o.opportunityLevel <= maxOpportunityLevel
  );
  
  // 随机选择（高等级机缘权重更高）
  for (let i = 0; i < baseCount && availableOpportunities.length > 0; i++) {
    const weights = availableOpportunities.map(o => o.opportunityLevel * 1.5);
    const selectedIndex = weightedRandomIndex(weights);
    opportunities.push(availableOpportunities.splice(selectedIndex, 1)[0]);
  }
  
  return opportunities;
}
```

---

## 五、世界奖励系数体系

### 5.1 奖励系数计算

```typescript
interface WorldRewardCoefficient {
  // 基础奖励系数
  expCoefficient: number;          // 经验系数
  spiritStoneCoefficient: number;  // 灵石系数
  dropCoefficient: number;         // 掉落系数
  
  // 品质加成
  rarityBonus: {
    rare: number;      // 稀有物品额外概率
    epic: number;      // 史诗物品额外概率
    legendary: number; // 传说物品额外概率
    mythic: number;    // 神话物品额外概率
  };
  
  // 特殊奖励
  specialRewards: {
    ascensionMarkBonus: number;  // 飞升印记加成
    titleChance: number;         // 称号掉落概率
    specialItemChance: number;   // 特殊物品概率
  };
}

/**
 * 计算世界奖励系数
 */
function calculateWorldRewardCoefficient(
  difficultyCoefficient: number
): WorldRewardCoefficient {
  // 基础系数：指数增长
  const baseMultiplier = Math.pow(1.5, difficultyCoefficient - 1);
  
  return {
    expCoefficient: baseMultiplier,
    spiritStoneCoefficient: baseMultiplier * 1.2,
    dropCoefficient: 1 + (difficultyCoefficient - 1) * 0.8,
    
    rarityBonus: {
      rare: Math.max(0, (difficultyCoefficient - 1) * 0.15),
      epic: Math.max(0, (difficultyCoefficient - 1.5) * 0.12),
      legendary: Math.max(0, (difficultyCoefficient - 2.5) * 0.08),
      mythic: Math.max(0, (difficultyCoefficient - 3.5) * 0.05),
    },
    
    specialRewards: {
      ascensionMarkBonus: Math.floor(difficultyCoefficient - 1),
      titleChance: Math.min(0.3, (difficultyCoefficient - 2) * 0.1),
      specialItemChance: Math.min(0.2, (difficultyCoefficient - 3) * 0.08),
    },
  };
}
```

### 5.2 奖励系数对照表

| 难度系数 | 经验系数 | 灵石系数 | 稀有+ | 史诗+ | 传说+ | 神话+ |
|---------|---------|---------|------|------|------|------|
| 1.0 | 1.0x | 1.0x | 0% | 0% | 0% | 0% |
| 1.5 | 1.22x | 1.47x | 7.5% | 0% | 0% | 0% |
| 2.0 | 1.5x | 1.8x | 15% | 6% | 0% | 0% |
| 2.5 | 1.84x | 2.2x | 22.5% | 12% | 0% | 0% |
| 3.0 | 2.25x | 2.7x | 30% | 18% | 4% | 0% |
| 3.5 | 2.76x | 3.3x | 37.5% | 24% | 8% | 0% |
| 4.0 | 3.38x | 4.0x | 45% | 30% | 12% | 2.5% |
| 4.5 | 4.13x | 4.9x | 52.5% | 36% | 16% | 5% |
| 5.0 | 5.06x | 6.0x | 60% | 42% | 20% | 7.5% |

### 5.3 掉落物品品质判定

```typescript
/**
 * 根据世界奖励系数判定掉落品质
 */
function determineDropRarity(
  baseRarity: ItemRarity,
  rewardCoefficient: WorldRewardCoefficient
): ItemRarity {
  const roll = Math.random();
  const bonus = rewardCoefficient.rarityBonus;
  
  // 从最高品质开始检查
  if (roll < bonus.mythic) return '神话';
  if (roll < bonus.legendary) return '传说';
  if (roll < bonus.epic) return '史诗';
  if (roll < bonus.rare) return '稀有';
  
  return baseRarity;
}
```

---

## 六、世界选择UI设计

### 6.1 世界选择界面

```
┌─────────────────────────────────────────────────────────────────┐
│  🌍 选择你的世界                            飞升次数: 3         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🟢 青云界 - 修仙世界                        [推荐]     │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  难度: 普通 (1.2)     基础系数: 1.1                    │   │
│  │  敌人强度: ████████░░ 80%    奖励加成: ██████░░░░ 60%  │   │
│  │                                                         │   │
│  │  ⚠️ 危险: 魔修入侵                                        │   │
│  │     魔修势力猖獗，敌人攻击力+10%                         │   │
│  │                                                         │   │
│  │  ✨ 机缘: 发现上古洞府                                    │   │
│  │     偶遇上古修士遗迹，探索额外获得经验                    │   │
│  │                                                         │   │
│  │  🎁 预期奖励: 经验 1.2x | 灵石 1.3x | 稀有掉落 +7%       │   │
│  │                                                         │   │
│  │                                    [ 选择此世界 ]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🟡 苍龙大陆 - 高武世界                        [困难]    │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  难度: 困难 (1.8)     基础系数: 1.3                    │   │
│  │  敌人强度: ██████████████ 120%  奖励加成: ████████░░ 80%│   │
│  │                                                         │   │
│  │  ⚠️ 危险: 异族入侵 (Lv2), 武道争锋 (Lv1)                 │   │
│  │     异族大军压境，敌人生命+20%，攻击+15%                 │   │
│  │                                                         │   │
│  │  ✨ 机缘: 获得武道传承 (Lv2)                              │   │
│  │     获得上古武道传承，属性+2，技能伤害+10%               │   │
│  │                                                         │   │
│  │  🎁 预期奖励: 经验 1.7x | 灵石 2.0x | 稀有掉落 +12%      │   │
│  │                                                         │   │
│  │                                    [ 选择此世界 ]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔴 废土世界 - 末世世界                        [噩梦]    │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  难度: 噩梦 (2.5)     基础系数: 1.5                    │   │
│  │  敌人强度: ████████████████ 150%  奖励: ██████████ 100% │   │
│  │                                                         │   │
│  │  ⚠️ 危险: 变异兽潮 (Lv3), 辐射扩散 (Lv2), 资源匮乏 (Lv2) │   │
│  │     变异生物横行，每回合损失HP，敌人强化25%              │   │
│  │                                                         │   │
│  │  ✨ 机缘: 发现避难所 (Lv3), 获得进化能力 (Lv2)           │   │
│  │     发现幸存者避难所，获得强力装备和进化能力             │   │
│  │                                                         │   │
│  │  🎁 预期奖励: 经验 2.2x | 灵石 2.7x | 史诗+ 12%          │   │
│  │                                                         │   │
│  │  ⚠️ 警告: 此世界危险程度极高，建议实力充足后再挑战       │   │
│  │                                    [ 选择此世界 ]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔒 更高难度的世界将在飞升次数增加后解锁                        │
│     下次飞升解锁: 地狱难度世界 (需5次飞升，当前3次)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 危险/机缘图标系统

| 等级 | 危险图标 | 机缘图标 | 颜色 |
|-----|---------|---------|------|
| 1 | ⚠️ | ✨ | 灰色 |
| 2 | ⚡ | 🌟 | 蓝色 |
| 3 | 🔥 | 💫 | 紫色 |
| 4 | 💀 | 🎁 | 橙色 |
| 5 | ☠️ | 👑 | 金色 |

---

## 七、代码实现方案

### 7.1 类型定义更新

```typescript
// src/lib/game/types.ts

/** 世界危险 */
export interface WorldDanger {
  id: string;
  type: DangerType;
  name: string;
  description: string;
  triggerCondition: DangerTrigger;
  effect: DangerEffect;
  duration: number;
  dispellable: boolean;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
}

/** 世界机缘 */
export interface WorldOpportunity {
  id: string;
  type: OpportunityType;
  name: string;
  description: string;
  triggerCondition: OpportunityTrigger;
  effect: OpportunityEffect;
  duration: number;
  opportunityLevel: 1 | 2 | 3 | 4 | 5;
  conflictsWith?: string[];
}

/** 世界信息（更新） */
export interface World {
  id: number;
  name: string;
  type: WorldType;
  description: string;
  powerSystem: string;
  realmSystem: RealmSystem;
  majorForces: string;
  factions: WorldFaction[];
  
  // 难度系统（更新）
  baseCoefficient: number;           // 基础系数（不变）
  actualCoefficient: number;         // 实际系数（根据飞升次数计算）
  difficulty: WorldDifficulty;       // 难度等级
  
  // 危险与机缘（更新）
  dangers: WorldDanger[];            // 具体的危险效果
  opportunities: WorldOpportunity[]; // 具体的机缘效果
  
  // 奖励系数
  rewardCoefficient: WorldRewardCoefficient;
}
```

### 7.2 核心函数实现

```typescript
// src/lib/game/worldSystem.ts

/**
 * 世界系统核心逻辑
 */
export class WorldSystem {
  /**
   * 生成可选择的世界列表
   */
  static generateAvailableWorlds(
    ascensionCount: number,
    currentWorldType?: WorldType
  ): World[] {
    const availableWorlds: World[] = [];
    
    // 获取所有世界类型
    const worldTypes: WorldType[] = [
      '修仙', '高武', '科技', '魔幻', 
      '异能', '仙侠', '武侠', '末世'
    ];
    
    // 过滤当前世界
    const availableTypes = currentWorldType
      ? worldTypes.filter(t => t !== currentWorldType)
      : worldTypes;
    
    // 生成每个世界的详细信息
    for (const type of availableTypes) {
      const world = this.generateWorld(type, ascensionCount);
      
      // 检查是否符合飞升次数要求
      if (this.isWorldUnlocked(world, ascensionCount)) {
        availableWorlds.push(world);
      }
    }
    
    return availableWorlds;
  }
  
  /**
   * 生成单个世界
   */
  static generateWorld(
    worldType: WorldType,
    ascensionCount: number
  ): World {
    const baseData = WORLD_DATA[worldType];
    
    // 计算实际难度系数
    const actualCoefficient = calculateWorldDifficultyCoefficient(
      baseData.coefficient,
      ascensionCount
    );
    
    // 计算难度等级
    const difficulty = getWorldDifficulty(actualCoefficient);
    
    // 生成危险和机缘
    const dangers = generateWorldDangers(worldType, actualCoefficient);
    const opportunities = generateWorldOpportunities(worldType, actualCoefficient);
    
    // 计算奖励系数
    const rewardCoefficient = calculateWorldRewardCoefficient(actualCoefficient);
    
    return {
      id: generateWorldId(),
      name: getWorldName(worldType),
      type: worldType,
      description: getWorldDescription(worldType),
      powerSystem: getWorldPowerSystem(worldType),
      realmSystem: generateRealmSystem(worldType),
      majorForces: getWorldMajorForces(worldType),
      factions: generateWorldFactions(worldType),
      baseCoefficient: baseData.coefficient,
      actualCoefficient,
      difficulty,
      dangers,
      opportunities,
      rewardCoefficient,
    };
  }
  
  /**
   * 检查世界是否解锁
   */
  static isWorldUnlocked(world: World, ascensionCount: number): boolean {
    const rule = WORLD_SELECTION_RULES.find(
      r => world.actualCoefficient >= r.coefficientRange[0] &&
           world.actualCoefficient <= r.coefficientRange[1]
    );
    return rule ? ascensionCount >= rule.minAscension : false;
  }
}
```

### 7.3 危险效果应用

```typescript
// src/lib/game/worldEffects.ts

/**
 * 应用世界危险效果
 */
export function applyDangerEffects(
  world: World,
  protagonist: Protagonist,
  context: 'enter' | 'battle_start' | 'turn' | 'explore'
): { effects: AppliedEffect[]; messages: string[] } {
  const effects: AppliedEffect[] = [];
  const messages: string[] = [];
  
  for (const danger of world.dangers) {
    // 检查触发条件
    if (danger.triggerCondition.type !== context) continue;
    if (Math.random() > danger.triggerCondition.chance) continue;
    
    // 应用效果
    const appliedEffect = applyDangerEffect(danger, protagonist);
    effects.push(appliedEffect);
    messages.push(`⚠️ ${danger.name}: ${danger.description}`);
  }
  
  return { effects, messages };
}

/**
 * 应用单个危险效果
 */
function applyDangerEffect(
  danger: WorldDanger,
  protagonist: Protagonist
): AppliedEffect {
  const effect = danger.effect;
  const modifications: StatModification[] = [];
  
  // 属性修改
  if (effect.statModifications) {
    for (const [stat, value] of Object.entries(effect.statModifications)) {
      modifications.push({
        stat: stat as StatName,
        value,
        type: value > 0 ? 'add' : 'subtract',
        duration: danger.duration,
      });
    }
  }
  
  // 资源修改
  if (effect.resourceModifications) {
    if (effect.resourceModifications.hp) {
      protagonist.currentHp = Math.max(1, 
        protagonist.currentHp + effect.resourceModifications.hp
      );
    }
    if (effect.resourceModifications.mp) {
      protagonist.currentMp = Math.max(0,
        protagonist.currentMp + effect.resourceModifications.mp
      );
    }
  }
  
  return {
    dangerId: danger.id,
    modifications,
    dispellable: danger.dispellable,
    duration: danger.duration,
  };
}
```

### 7.4 机缘效果应用

```typescript
// src/lib/game/worldEffects.ts

/**
 * 应用世界机缘效果
 */
export function applyOpportunityEffects(
  world: World,
  protagonist: Protagonist,
  context: 'enter' | 'battle_end' | 'explore' | 'random'
): { effects: AppliedEffect[]; messages: string[]; rewards: Reward[] } {
  const effects: AppliedEffect[] = [];
  const messages: string[] = [];
  const rewards: Reward[] = [];
  
  for (const opportunity of world.opportunities) {
    // 检查触发条件
    if (opportunity.triggerCondition.type !== context) continue;
    if (Math.random() > opportunity.triggerCondition.chance) continue;
    
    // 检查是否与危险冲突
    if (opportunity.conflictsWith?.some(id => 
      world.dangers.some(d => d.id === id)
    )) continue;
    
    // 应用效果
    const result = applyOpportunityEffect(opportunity, protagonist, world);
    effects.push(result.effect);
    messages.push(`✨ ${opportunity.name}: ${opportunity.description}`);
    rewards.push(...result.rewards);
  }
  
  return { effects, messages, rewards };
}
```

---

## 八、测试用例

### 8.1 边界条件测试

```typescript
describe('WorldSystem', () => {
  describe('calculateWorldDifficultyCoefficient', () => {
    it('应该正确计算基础系数', () => {
      expect(calculateWorldDifficultyCoefficient(1.0, 0)).toBe(1.0);
    });
    
    it('应该正确应用飞升加成', () => {
      expect(calculateWorldDifficultyCoefficient(1.0, 1)).toBe(1.15);
      expect(calculateWorldDifficultyCoefficient(1.0, 5)).toBe(1.75);
    });
    
    it('应该限制最大系数为5.0', () => {
      expect(calculateWorldDifficultyCoefficient(3.0, 15)).toBe(5.0);
    });
  });
  
  describe('generateWorldDangers', () => {
    it('简单世界应该不生成危险', () => {
      const dangers = generateWorldDangers('武侠', 1.0);
      expect(dangers).toHaveLength(0);
    });
    
    it('困难世界应该生成适当数量的危险', () => {
      const dangers = generateWorldDangers('高武', 2.0);
      expect(dangers.length).toBeGreaterThanOrEqual(1);
      expect(dangers.length).toBeLessThanOrEqual(2);
    });
    
    it('危险等级不应超过世界难度', () => {
      const dangers = generateWorldDangers('修仙', 1.5);
      dangers.forEach(d => {
        expect(d.dangerLevel).toBeLessThanOrEqual(2);
      });
    });
  });
  
  describe('applyDangerEffects', () => {
    it('应该正确应用属性削弱', () => {
      const world = createTestWorld({ dangers: [STAT_DEBUFF_DANGER] });
      const protagonist = createTestProtagonist({ 灵根: 10 });
      
      const { effects } = applyDangerEffects(world, protagonist, 'enter');
      
      expect(effects[0].modifications).toContainEqual({
        stat: '灵根',
        value: -1,
        type: 'subtract',
        duration: -1,
      });
    });
  });
});
```

### 8.2 数值平衡测试

```typescript
describe('World Balance', () => {
  it('高难度世界的奖励应该匹配其风险', () => {
    const easyWorld = generateWorld('武侠', 0);
    const hardWorld = generateWorld('末世', 5);
    
    // 敌人强度比
    const enemyRatio = hardWorld.actualCoefficient / easyWorld.actualCoefficient;
    
    // 奖励比
    const rewardRatio = hardWorld.rewardCoefficient.expCoefficient / 
                        easyWorld.rewardCoefficient.expCoefficient;
    
    // 奖励增长应该超过难度增长（风险收益对等）
    expect(rewardRatio).toBeGreaterThan(enemyRatio);
  });
  
  it('飞升次数增加应该同步提升难度和奖励', () => {
    const world0 = generateWorld('修仙', 0);
    const world3 = generateWorld('修仙', 3);
    
    // 难度应该增加
    expect(world3.actualCoefficient).toBeGreaterThan(world0.actualCoefficient);
    
    // 奖励也应该增加
    expect(world3.rewardCoefficient.expCoefficient).toBeGreaterThan(
      world0.rewardCoefficient.expCoefficient
    );
  });
});
```

---

## 九、实施计划

### 9.1 阶段一：核心系统重构
1. 更新 World 类型定义
2. 实现 calculateWorldDifficultyCoefficient 函数
3. 实现 calculateWorldRewardCoefficient 函数
4. 更新 generateWorld 和 generateWorlds 函数

### 9.2 阶段二：危险/机缘系统
1. 定义危险和机缘数据
2. 实现 generateWorldDangers 函数
3. 实现 generateWorldOpportunities 函数
4. 实现效果应用函数

### 9.3 阶段三：UI更新
1. 更新世界选择界面
2. 实现危险/机缘显示组件
3. 添加难度和奖励提示
4. 实现飞升解锁提示

### 9.4 阶段四：测试与平衡
1. 编写单元测试
2. 进行数值平衡测试
3. 玩家体验测试
4. 根据反馈调整参数

---

## 十、风险评估

### 10.1 潜在问题
1. **数值膨胀**：高飞升次数可能导致数值过大
   - 解决方案：设置合理的上限，使用对数/根号函数平滑增长

2. **新手体验**：新玩家可能被高难度世界劝退
   - 解决方案：默认推荐适合难度的世界，提供清晰的难度提示

3. **存档兼容**：旧存档可能缺少新字段
   - 解决方案：实现数据迁移，提供默认值

### 10.2 回滚方案
- 保留旧的世界生成逻辑作为备用
- 通过配置开关控制新系统启用
- 监控玩家反馈和数据指标

---

## 附录

### A. 完整危险列表
见 `src/lib/data/worldDangers.ts`

### B. 完整机缘列表
见 `src/lib/data/worldOpportunities.ts`

### C. 数值计算表
见本文档第五章

### D. 相关文档
- [飞升系统设计文档](./ascension-system-design.md)
- [属性系统设计文档](./attribute-system-design.md)
- [数值平衡分析](../review/numerical-balance-analysis.md)
