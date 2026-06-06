# 万界修行录 - 纵向深度扩展设计方案

> 设计原则：完全保留现有逻辑，只做纵向扩展，提升长期可玩性

---

## 一、修炼系统扩展

### 1.1 修炼流派系统

**新增类型定义：**
```typescript
// 修炼流派
export type CultivationPath = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

// 流派加成配置
export interface PathBonus {
  primaryStat: keyof CharacterStats;  // 主属性
  secondaryStat: keyof CharacterStats; // 副属性
  cultivationBonus: number;  // 修炼加成百分比
  breakthroughBonus: number; // 突破成功率加成
  specialAbility: string;    // 质变能力描述
  unlockConditions: { level: number; stat: keyof CharacterStats; value: number };
}

// 流派定义
export const CULTIVATION_PATHS: Record<CultivationPath, PathBonus> = {
  body: {
    primaryStat: '体质',
    secondaryStat: '意志',
    cultivationBonus: 10,
    breakthroughBonus: 5,
    specialAbility: '金刚体：每10级获得1%物理免伤',
    unlockConditions: { level: 10, stat: '体质', value: 30 }
  },
  sword: {
    primaryStat: '灵根',
    secondaryStat: '悟性',
    cultivationBonus: 8,
    breakthroughBonus: 3,
    specialAbility: '剑心通明：暴击率+5%',
    unlockConditions: { level: 10, stat: '灵根', value: 30 }
  },
  spell: {
    primaryStat: '灵根',
    secondaryStat: '悟性',
    cultivationBonus: 12,
    breakthroughBonus: 0,
    specialAbility: '法力澎湃：MP上限+20%',
    unlockConditions: { level: 10, stat: '灵根', value: 35 }
  },
  alchemy: {
    primaryStat: '悟性',
    secondaryStat: '幸运',
    cultivationBonus: 5,
    breakthroughBonus: 10,
    specialAbility: '丹心：炼丹成功率+15%',
    unlockConditions: { level: 10, stat: '悟性', value: 30 }
  },
  demon: {
    primaryStat: '意志',
    secondaryStat: '体质',
    cultivationBonus: 15,
    breakthroughBonus: -10,
    specialAbility: '魔心：战斗伤害+10%，但心魔概率+5%',
    unlockConditions: { level: 15, stat: '意志', value: 40 }
  }
};
```

**新增 Protagonist 字段：**
```typescript
cultivationPath: CultivationPath | null;  // 当前修炼流派
pathExp: number;  // 流派熟练度
pathLevel: number; // 流派等级（1-10）
```

**实现逻辑：**
- 玩家达到10级后可选择流派
- 流派提供差异化加成，鼓励不同流派选择
- 流派等级通过修炼次数提升
- 每10级流派等级解锁一个流派技能

### 1.2 境界瓶颈与渡劫

**新增类型定义：**
```typescript
// 境界瓶颈状态
export interface RealmBottleneck {
  realmTier: number;      // 境界层级
  isBlocked: boolean;     // 是否卡瓶颈
  bottleneckType: 'stats' | 'insight' | 'tribulation'; // 瓶颈类型
  requirements: {
    statRequirements: Partial<CharacterStats>;
    itemRequirements?: { itemId: string; quantity: number }[];
    insightRequired?: number;
  };
  tribulationChance?: number; // 渡劫成功率
}

// 渡劫配置
export interface TribulationConfig {
  realmTier: number;
  name: string;           // 劫名（如"雷劫"、"心魔劫"）
  baseSuccessRate: number;
  statBonuses: Record<keyof CharacterStats, number>; // 属性加成成功率
  failPenalty: {
    hpLoss: number;       // 失败损失HP百分比
    statLoss: Partial<CharacterStats>; // 属性损失
  };
  successReward: {
    statBonus: Partial<CharacterStats>;
    specialEffect?: string;
  };
}
```

**实现规则：**
1. 每10级（境界跨越）触发瓶颈
2. 瓶颈类型：
   - `stats瓶颈`：属性不达标，需修炼提升
   - `insight瓶颈`：悟性不够，需历练/机缘
   - `tribulation瓶颈`：需渡劫
3. 渡劫失败：
   - 损失20%当前HP
   - 随机损失1-3点属性
   - 进入虚弱状态（修炼效率-50%，持续5次修炼）
4. 渡劫成功：
   - 属性永久+5
   - 解锁境界特殊能力

### 1.3 心境与心魔系统

**新增类型定义：**
```typescript
// 心境状态
export interface MentalState {
  stability: number;      // 心境稳定度 0-100
  karma: number;          // 业力值（正负）
  demonChance: number;    // 心魔触发概率
  lastDemonTime: number;  // 上次心魔时间
  mentalBuffs: MentalBuff[];
}

export interface MentalBuff {
  id: string;
  name: string;
  effect: 'positive' | 'negative';
  statChanges: Partial<CharacterStats>;
  duration: number; // 剩余次数
}

// 心魔事件
export interface DemonEncounter {
  id: string;
  name: string;
  description: string;
  choices: DemonChoice[];
}

export interface DemonChoice {
  text: string;
  successRate: number;  // 基础成功率
  statModifiers: Partial<CharacterStats>; // 属性影响成功率
  successEffect: { stability: number; stats?: Partial<CharacterStats> };
  failEffect: { stability: number; stats: Partial<CharacterStats>; demonChance: number };
}
```

**实现规则：**
1. 心境稳定度影响：
   - >80：修炼效率+10%
   - 50-80：正常
   - 30-50：修炼效率-10%
   - <30：心魔概率+10%

2. 心魔触发条件：
   - 魔修流派：每修炼有5%基础概率
   - 心境稳定度<30：+10%概率
   - 业力负值过高：+5%/100业力

3. 心魔事件：
   - 提供多个选项，根据属性计算成功率
   - 成功：心境稳定度+20，可能获得属性
   - 失败：心境稳定度-30，属性损失，心魔概率增加

---

## 二、功法系统扩展

### 2.1 熟练度与奥义

**新增类型定义：**
```typescript
// 功法熟练度等级
export type ProficiencyLevel = '入门' | '小成' | '大成' | '圆满' | '化境';

// 功法扩展字段
export interface Technique {
  // ...现有字段
  proficiency: number;      // 熟练度 0-1000
  proficiencyLevel: ProficiencyLevel;
  essence: TechniqueEssence | null; // 奥义
  bonds: TechniqueBond[];  // 功法羁绊
  restrictions: TechniqueRestriction[]; // 使用限制
}

// 熟练度等级加成
export const PROFICIENCY_BONUSES: Record<ProficiencyLevel, { power: number; bonus: number; mpReduce: number }> = {
  '入门': { power: 0, bonus: 0, mpReduce: 0 },
  '小成': { power: 10, bonus: 5, mpReduce: 0 },
  '大成': { power: 25, bonus: 15, mpReduce: 10 },
  '圆满': { power: 40, bonus: 25, mpReduce: 20 },
  '化境': { power: 60, bonus: 40, mpReduce: 30 }
};

// 奥义定义
export interface TechniqueEssence {
  id: string;
  name: string;
  description: string;
  triggerCondition: string; // 触发条件
  effect: EssenceEffect;
  unlockRequirements: {
    proficiencyLevel: ProficiencyLevel;
    usageCount: number; // 使用次数
  };
}

export interface EssenceEffect {
  type: 'damage' | 'defense' | 'buff' | 'special';
  value: number;
  duration?: number;
  cooldown?: number;
  specialEffect?: string;
}
```

**实现规则：**
1. 熟练度获取：
   - 每次战斗使用功法 +5熟练度
   - 同类型功法作为材料升级 +20熟练度
   - 熟练度满1000后进入下一等级

2. 奥义解锁：
   - 功法达到"大成"后可解锁奥义
   - 需要使用该功法战斗100次
   - 奥义为被动效果，战斗时自动触发

### 2.2 功法羁绊/共鸣

**新增类型定义：**
```typescript
// 功法羁绊
export interface TechniqueBond {
  id: string;
  name: string;
  description: string;
  requiredTechniques: string[]; // 所需功法关键词
  minCount: number;  // 至少需要几个匹配
  levels: BondLevel[];
}

export interface BondLevel {
  level: number;
  count: number;  // 需要的功法数量
  effects: {
    power: number;
    bonus: number;
    special?: string;
  };
}

// 预定义羁绊
export const TECHNIQUE_BONDS: TechniqueBond[] = [
  {
    id: 'sword_adept',
    name: '剑道通神',
    description: '装备多本剑类功法触发羁绊',
    requiredTechniques: ['剑', '剑法', '剑诀', '剑意'],
    minCount: 2,
    levels: [
      { level: 1, count: 2, effects: { power: 10, bonus: 5 } },
      { level: 2, count: 3, effects: { power: 25, bonus: 15, special: '剑气+1' } },
      { level: 3, count: 5, effects: { power: 50, bonus: 30, special: '剑心通明' } }
    ]
  },
  {
    id: 'fire_master',
    name: '火焰掌控',
    description: '装备多本火系功法触发羁绊',
    requiredTechniques: ['火', '炎', '烈', '焚'],
    minCount: 2,
    levels: [
      { level: 1, count: 2, effects: { power: 10, bonus: 5 } },
      { level: 2, count: 3, effects: { power: 25, bonus: 15, special: '灼烧+1' } },
      { level: 3, count: 5, effects: { power: 50, bonus: 30, special: '火神之体' } }
    ]
  },
  // ...更多羁绊
];
```

**实现逻辑：**
- 装备功法时检查羁绊匹配
- 显示当前激活的羁绊及效果
- 羁绊效果叠加到功法属性上

### 2.3 禁术与副作用

**新增类型定义：**
```typescript
// 功法限制类型
export type RestrictionType = 'hp_cost' | 'mp_cost' | 'stat_drain' | 'item_cost' | 'cooldown' | 'backlash';

// 功法限制
export interface TechniqueRestriction {
  type: RestrictionType;
  value: number | string;
  description: string;
}

// 禁术配置
export interface ForbiddenTechnique {
  techniqueId: string;
  name: string;
  description: string;
  restrictions: TechniqueRestriction[];
  bonuses: {
    powerMultiplier: number;
    bonusMultiplier: number;
  };
  unlockConditions: {
    level: number;
    cultivationPath?: CultivationPath;
  };
}

// 示例禁术
export const FORBIDDEN_TECHNIQUES: ForbiddenTechnique[] = [
  {
    techniqueId: 'blood_sacrifice',
    name: '血祭斩',
    description: '以自身精血为代价，造成巨额伤害',
    restrictions: [
      { type: 'hp_cost', value: 20, description: '消耗20%当前生命值' },
      { type: 'cooldown', value: 3, description: '冷却3回合' }
    ],
    bonuses: { powerMultiplier: 2.5, bonusMultiplier: 1.5 },
    unlockConditions: { level: 30 }
  },
  {
    techniqueId: 'soul_burn',
    name: '燃魂术',
    description: '燃烧魂魄换取力量',
    restrictions: [
      { type: 'stat_drain', value: '意志', description: '永久损失1点意志' }
    ],
    bonuses: { powerMultiplier: 3, bonusMultiplier: 2 },
    unlockConditions: { level: 50, cultivationPath: 'demon' }
  }
];
```

---

## 三、装备系统扩展

### 3.1 词缀系统

**新增类型定义：**
```typescript
// 词缀类型
export type AffixType = 'prefix' | 'suffix';

// 装备词缀
export interface EquipmentAffix {
  id: string;
  name: string;
  type: AffixType;
  rarity: ItemRarity;
  effects: AffixEffect[];
  dropWeight: number; // 掉落权重
}

export interface AffixEffect {
  type: 'stat' | 'power' | 'special';
  stat?: keyof CharacterStats;
  value?: number;
  special?: string;
  description: string;
}

// 装备扩展字段
export interface Equipment {
  // ...现有字段
  affixes: EquipmentAffix[]; // 词缀列表（最多1前缀+1后缀）
  setId: string | null;      // 套装ID
  refinement: number;        // 重铸次数
  enhancement: number;       // 强化等级 0-15
  enhancementBonus: { power: number; bonus: number };
}

// 词缀示例
export const EQUIPMENT_AFFIXES: EquipmentAffix[] = [
  // 前缀词缀
  { id: 'sharp', name: '锋利的', type: 'prefix', rarity: '普通', effects: [{ type: 'power', value: 10, description: '威力+10' }], dropWeight: 100 },
  { id: 'sturdy', name: '坚固的', type: 'prefix', rarity: '普通', effects: [{ type: 'stat', stat: '体质', value: 2, description: '体质+2' }], dropWeight: 100 },
  { id: 'mystic', name: '玄妙的', type: 'prefix', rarity: '稀有', effects: [{ type: 'stat', stat: '灵根', value: 3, description: '灵根+3' }], dropWeight: 50 },
  { id: 'legendary', name: '传说之', type: 'prefix', rarity: '史诗', effects: [{ type: 'special', special: 'legendary_power', description: '传说之力：全属性+5' }], dropWeight: 20 },
  
  // 后缀词缀
  { id: 'of_power', name: '之力', type: 'suffix', rarity: '普通', effects: [{ type: 'bonus', value: 5, description: '加成+5%' }], dropWeight: 100 },
  { id: 'of_fortune', name: '之幸', type: 'suffix', rarity: '稀有', effects: [{ type: 'stat', stat: '幸运', value: 5, description: '幸运+5' }], dropWeight: 50 },
  { id: 'of_insight', name: '之悟', type: 'suffix', rarity: '稀有', effects: [{ type: 'stat', stat: '悟性', value: 5, description: '悟性+5' }], dropWeight: 50 },
];
```

**实现规则：**
1. 掉落时随机生成词缀：
   - 普通品质：无词缀
   - 稀有品质：1个词缀（前缀或后缀）
   - 史诗品质：2个词缀（1前缀+1后缀）
   - 传说品质：2个词缀+1个特殊词缀

2. 词缀效果叠加到装备基础属性上

### 3.2 套装系统

**新增类型定义：**
```typescript
// 套装定义
export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  pieces: EquipmentSlot[]; // 包含的装备槽位
  bonuses: SetBonus[];
  worldType?: WorldType; // 限定世界类型
}

export interface SetBonus {
  requiredPieces: number;
  effects: {
    stats?: Partial<CharacterStats>;
    power?: number;
    bonus?: number;
    special?: string;
  };
  description: string;
}

// 套装示例
export const EQUIPMENT_SETS: EquipmentSet[] = [
  {
    id: 'azure_dragon',
    name: '青龙套装',
    description: '传说中的青龙之力',
    pieces: ['melee', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 10 } }, description: '体质+10' },
      { requiredPieces: 3, effects: { power: 50, bonus: 20 }, description: '威力+50，加成+20%' },
      { requiredPieces: 4, effects: { special: 'dragon_breath', stats: { 体质: 20, 灵根: 20 } }, description: '青龙吐息：攻击时20%概率造成额外伤害' }
    ],
    worldType: '修仙'
  },
  {
    id: 'steel_sentinel',
    name: '钢铁守卫',
    description: '科技世界的终极防护',
    pieces: ['head', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 15 } }, description: '体质+15' },
      { requiredPieces: 3, effects: { bonus: 30 }, description: '防御加成+30%' },
      { requiredPieces: 4, effects: { special: 'energy_shield', stats: { 体质: 30 } }, description: '能量护盾：每回合恢复5%HP' }
    ],
    worldType: '科技'
  }
];
```

**实现逻辑：**
- 检查当前装备的套装ID
- 统计同套装装备数量
- 激活对应层级的套装效果

### 3.3 强化与重铸

**新增类型定义：**
```typescript
// 强化配置
export const ENHANCEMENT_CONFIG = {
  maxLevel: 15,
  successRates: [100, 100, 100, 90, 80, 70, 60, 50, 40, 30, 25, 20, 15, 10, 5],
  costs: [100, 200, 400, 800, 1500, 3000, 6000, 12000, 25000, 50000, 100000, 200000, 500000, 1000000, 2000000],
  bonuses: [
    { power: 5, bonus: 2 },   // +1
    { power: 10, bonus: 4 },  // +2
    // ...
  ],
  failPenalty: {
    downgrade: [false, false, false, false, false, false, true, true, true, true, true, true, true, true, true], // 是否降级
    destroy: [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true] // 是否销毁
  }
};

// 重铸配置
export const REFINEMENT_CONFIG = {
  maxRefinements: 3,
  cost: 10000,
  effect: '重新随机词缀，保留强化等级'
};
```

**实现规则：**
1. 强化：
   - +1到+5：失败不掉级
   - +6到+10：失败降1级
   - +11到+15：失败可能销毁装备
   - 每级增加威力和加成

2. 重铸：
   - 花费灵石重置词缀
   - 最多重铸3次
   - 不影响强化等级

---

## 四、势力系统扩展

### 4.1 声望与职位

**新增类型定义：**
```typescript
// 势力声望等级
export type ReputationLevel = 'outsider' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

// 势力职位
export interface FactionRank {
  id: string;
  name: string;
  requiredReputation: number;
  benefits: RankBenefit[];
}

export interface RankBenefit {
  type: 'discount' | 'access' | 'skill' | 'salary';
  value: number | string;
  description: string;
}

// 势力进度
export interface FactionProgress {
  factionId: string;
  reputation: number;        // 声望值
  reputationLevel: ReputationLevel;
  rank: string;              // 当前职位
  contribution: number;      // 贡献点
  tasksCompleted: number;    // 完成任务数
  joinTime: number;
}

// 扩展 Protagonist
export interface Protagonist {
  // ...现有字段
  factionProgress: FactionProgress | null;
}
```

**声望等级与效果：**
```typescript
export const REPUTATION_LEVELS: Record<ReputationLevel, { min: number; bonus: number }> = {
  outsider: { min: 0, bonus: 0 },
  neutral: { min: 1000, bonus: 5 },
  friendly: { min: 5000, bonus: 10 },
  honored: { min: 20000, bonus: 15 },
  revered: { min: 50000, bonus: 20 },
  exalted: { min: 100000, bonus: 30 }
};

// 职位示例（以宗门为例）
export const SECT_RANKS: FactionRank[] = [
  { id: 'disciple', name: '外门弟子', requiredReputation: 0, benefits: [{ type: 'discount', value: 5, description: '商店折扣5%' }] },
  { id: 'inner_disciple', name: '内门弟子', requiredReputation: 3000, benefits: [{ type: 'discount', value: 10, description: '商店折扣10%' }, { type: 'salary', value: 100, description: '每日领取100灵石' }] },
  { id: 'core_disciple', name: '核心弟子', requiredReputation: 10000, benefits: [{ type: 'discount', value: 15, description: '商店折扣15%' }, { type: 'access', value: 'core_shop', description: '解锁核心商店' }] },
  { id: 'elder', name: '长老', requiredReputation: 50000, benefits: [{ type: 'skill', value: 'faction_skill_elder', description: '解锁势力专属技能' }] },
];
```

### 4.2 势力任务系统

**新增类型定义：**
```typescript
// 势力任务
export interface FactionTask {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  difficulty: 'easy' | 'normal' | 'hard';
  requirements: TaskRequirement[];
  rewards: TaskReward[];
  cooldown: number; // 冷却时间（毫秒）
}

export interface TaskRequirement {
  type: 'kill' | 'collect' | 'cultivate' | 'explore';
  target: string;
  count: number;
  current: number;
}

export interface TaskReward {
  reputation: number;
  contribution: number;
  items?: InventoryItem[];
  experience?: number;
}

// 势力任务示例
export const FACTION_TASKS: FactionTask[] = [
  {
    id: 'kill_beasts',
    name: '清剿妖兽',
    description: '击败10只妖兽',
    type: 'daily',
    difficulty: 'easy',
    requirements: [{ type: 'kill', target: 'any', count: 10, current: 0 }],
    rewards: [{ reputation: 100, contribution: 50 }],
    cooldown: 86400000 // 24小时
  },
  {
    id: 'explore_secret',
    name: '秘境探索',
    description: '完成一次秘境探索',
    type: 'daily',
    difficulty: 'normal',
    requirements: [{ type: 'explore', target: 'dungeon', count: 1, current: 0 }],
    rewards: [{ reputation: 200, contribution: 100, items: [{ definition: breakthroughItems[0], quantity: 1 }] }],
    cooldown: 86400000
  }
];
```

### 4.3 势力专属内容

```typescript
// 势力专属技能
export interface FactionSkill {
  id: string;
  name: string;
  factionId: string;
  requiredRank: string;
  effects: SkillEffect[];
  description: string;
}

// 势力商店物品
export interface FactionShopItem {
  id: string;
  itemId: string;
  factionId: string;
  requiredRank: string;
  cost: { contribution: number };
  stock: number; // 库存，-1为无限
}

// 势力专属掉落
export interface FactionDrop {
  factionId: string;
  itemId: string;
  dropRate: number;
  requiredReputation: ReputationLevel;
}
```

---

## 五、机缘系统扩展

### 5.1 连锁机缘与分支剧情

**新增类型定义：**
```typescript
// 机缘链
export interface EventChain {
  id: string;
  name: string;
  description: string;
  events: ChainEvent[];
  branchPoints: BranchPoint[];
  rewards: ChainReward[];
}

export interface ChainEvent {
  id: string;
  event: AdventureEvent;
  nextEvents: string[]; // 下一个可能的事件ID
  conditions?: EventCondition[];
}

export interface BranchPoint {
  atEventId: string;
  branches: {
    id: string;
    condition: EventCondition;
    events: string[];
  }[];
}

export interface EventCondition {
  type: 'stat' | 'item' | 'choice' | 'flag';
  target: string;
  value: any;
}

export interface ChainReward {
  condition: { eventId: string; choices: number[] };
  rewards: {
    stats?: Partial<CharacterStats>;
    items?: InventoryItem[];
    special?: string;
    achievement?: string;
  };
}

// 连锁机缘示例
export const EVENT_CHAINS: EventChain[] = [
  {
    id: 'immortal_legacy',
    name: '仙人遗蜕',
    description: '发现一位上古仙人的遗蜕，隐藏着惊天秘密',
    events: [
      {
        id: 'discovery',
        event: { id: 1001, title: '古洞探秘', description: '你发现了一处隐蔽的古洞...', choices: [...] },
        nextEvents: ['inner_cave', 'leave']
      },
      {
        id: 'inner_cave',
        event: { id: 1002, title: '洞中洞', description: '深入洞穴，你发现了...', choices: [...] },
        nextEvents: ['treasure_room', 'trap_room', 'spirit_encounter'],
        conditions: [{ type: 'stat', target: '悟性', value: 30 }]
      }
      // ...
    ],
    branchPoints: [
      {
        atEventId: 'inner_cave',
        branches: [
          { id: 'good_branch', condition: { type: 'stat', target: '幸运', value: 40 }, events: ['treasure_room'] },
          { id: 'bad_branch', condition: { type: 'stat', target: '幸运', value: 20 }, events: ['trap_room'] }
        ]
      }
    ],
    rewards: [
      { condition: { eventId: 'treasure_room', choices: [0] }, rewards: { items: [...], achievement: 'immortal_heir' } }
    ]
  }
];
```

### 5.2 隐藏机缘与绝版奖励

**新增类型定义：**
```typescript
// 隐藏机缘触发条件
export interface HiddenEventTrigger {
  eventId: number;
  conditions: HiddenCondition[];
  probability: number; // 基础触发概率
  oneTime: boolean;    // 是否一次性（绝版）
  cooldown?: number;   // 冷却时间
}

export interface HiddenCondition {
  type: 'stat' | 'item' | 'time' | 'location' | 'flag' | 'combination';
  requirements: {
    target: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | 'has';
    value: any;
  }[];
  allRequired: boolean; // 是否需要全部满足
}

// 绝版奖励
export interface ExclusiveReward {
  id: string;
  name: string;
  type: 'technique' | 'equipment' | 'title' | 'effect';
  description: string;
  rarity: 'legendary' | 'mythic';
  source: string; // 获取来源
}

// 隐藏机缘示例
export const HIDDEN_EVENTS: HiddenEventTrigger[] = [
  {
    eventId: 2001, // 天降机缘
    conditions: [
      { type: 'stat', requirements: [{ target: '幸运', operator: '>=', value: 50 }], allRequired: true },
      { type: 'time', requirements: [{ target: 'hour', operator: '=', value: [0, 6, 12, 18] }], allRequired: false }
    ],
    probability: 1, // 幸运>=50时在特定时间点1%触发
    oneTime: true,
  },
  {
    eventId: 2002, // 心魔入侵
    conditions: [
      { type: 'combination', requirements: [
        { target: 'cultivationPath', operator: '=', value: 'demon' },
        { target: 'mentalStability', operator: '<', value: 30 }
      ], allRequired: true }
    ],
    probability: 10,
    oneTime: false,
    cooldown: 604800000 // 7天
  }
];
```

### 5.3 选择后果系统

**新增类型定义：**
```typescript
// 选择影响记录
export interface ChoiceImpact {
  eventId: number;
  choiceIndex: number;
  timestamp: number;
  consequences: Consequence[];
}

export interface Consequence {
  type: 'immediate' | 'delayed' | 'permanent';
  effect: {
    flag?: string;
    npcRelation?: { npcId: string; change: number };
    worldChange?: { location: string; state: string };
    futureEvent?: { unlock: number[]; lock: number[] };
  };
  triggerTime?: number; // 延迟触发的毫秒数
}

// 扩展 Protagonist
export interface Protagonist {
  // ...现有字段
  choiceHistory: ChoiceImpact[];
  worldFlags: Record<string, boolean>; // 世界状态标记
  npcRelations: Record<string, number>; // NPC好感度
}
```

---

## 六、商店系统扩展

### 6.1 多货币系统

**新增类型定义：**
```typescript
// 货币类型
export type CurrencyType = 'spirit_stone' | 'contribution' | 'honor' | 'festival';

// 货币定义
export interface Currency {
  id: CurrencyType;
  name: string;
  description: string;
  icon: string;
  color: string;
  sources: string[]; // 获取途径
}

// 扩展 Protagonist
export interface Protagonist {
  // ...现有字段
  currencies: Record<CurrencyType, number>;
}

// 货币配置
export const CURRENCIES: Currency[] = [
  { id: 'spirit_stone', name: '灵石', description: '通用货币', icon: '💎', color: 'yellow', sources: ['修炼', '战斗', '出售'] },
  { id: 'contribution', name: '贡献点', description: '势力贡献点', icon: '🏆', color: 'blue', sources: ['势力任务', '捐献'] },
  { id: 'honor', name: '荣誉值', description: '战斗荣誉', icon: '⚔️', color: 'red', sources: ['Boss击杀', '竞技场'] },
  { id: 'festival', name: '节日币', description: '活动货币', icon: '🎉', color: 'purple', sources: ['限时活动'] }
];
```

### 6.2 黑市与限时商店

**新增类型定义：**
```typescript
// 商店类型
export type ShopType = 'normal' | 'faction' | 'black_market' | 'limited' | 'festival';

// 商店配置
export interface ShopConfig {
  id: string;
  type: ShopType;
  name: string;
  currency: CurrencyType;
  refreshType: 'manual' | 'daily' | 'weekly' | 'never';
  items: ShopItemConfig[];
  requirements?: {
    level?: number;
    factionRank?: string;
    reputation?: number;
  };
}

export interface ShopItemConfig {
  itemId: string;
  price: number;
  currency: CurrencyType;
  stock: number; // -1为无限
  discount?: number;
  requiredRank?: string;
  limitedPerAccount?: number; // 账号限购
}

// 黑市配置
export const BLACK_MARKET_CONFIG: ShopConfig = {
  id: 'black_market',
  type: 'black_market',
  name: '黑市',
  currency: 'spirit_stone',
  refreshType: 'daily',
  items: [
    // 随机刷新稀有物品，价格较高
  ],
  requirements: { level: 20 }
};

// 限时商店
export interface LimitedShop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  items: ShopItemConfig[];
  currency: CurrencyType;
}
```

### 6.3 随机刷新与保底机制

**新增类型定义：**
```typescript
// 商店刷新配置
export interface ShopRefreshConfig {
  shopId: string;
  freeRefreshDaily: number; // 每日免费刷新次数
  refreshCost: { currency: CurrencyType; amount: number }[];
  guaranteeItems: { rarity: ItemRarity; afterRefreshes: number }[];
}

// 保底机制
export interface ShopGuarantee {
  shopId: string;
  currentCount: number; // 当前刷新次数
  guaranteedRarity: ItemRarity; // 保底稀有度
  nextGuarantee: number; // 下次保底触发次数
}

// 刷新配置示例
export const SHOP_REFRESH_CONFIGS: ShopRefreshConfig[] = [
  {
    shopId: 'normal',
    freeRefreshDaily: 3,
    refreshCost: [
      { currency: 'spirit_stone', amount: 100 },
      { currency: 'spirit_stone', amount: 200 },
      { currency: 'spirit_stone', amount: 500 }
    ],
    guaranteeItems: [
      { rarity: '稀有', afterRefreshes: 10 },
      { rarity: '史诗', afterRefreshes: 50 }
    ]
  }
];
```

---

## 七、成就+图鉴系统扩展

### 7.1 分类收集与套装奖励

**新增类型定义：**
```typescript
// 图鉴分类
export interface CollectionCategory {
  id: string;
  name: string;
  type: 'technique' | 'equipment' | 'material' | 'enemy' | 'location';
  entries: CollectionEntry[];
  milestones: CollectionMilestone[];
}

export interface CollectionMilestone {
  count: number;
  rewards: {
    stats?: Partial<CharacterStats>;
    title?: string;
    special?: string;
  };
  description: string;
}

// 分类示例
export const COLLECTION_CATEGORIES: CollectionCategory[] = [
  {
    id: 'sword_techniques',
    name: '剑法收集',
    type: 'technique',
    entries: [], // 动态填充
    milestones: [
      { count: 5, rewards: { stats: { 悟性: 2 }, title: '剑道学徒' }, description: '收集5本剑法' },
      { count: 15, rewards: { stats: { 悟性: 5, 灵根: 3 }, title: '剑道大师' }, description: '收集15本剑法' },
      { count: 30, rewards: { stats: { 悟性: 10, 灵根: 5 }, title: '剑道宗师', special: '剑气自动' }, description: '收集30本剑法' }
    ]
  }
];
```

### 7.2 隐藏成就与挑战成就

**新增类型定义：**
```typescript
// 成就类型扩展
export type AchievementCategory = 'visible' | 'hidden' | 'challenge' | 'seasonal';

// 隐藏成就
export interface HiddenAchievement extends AchievementDefinition {
  category: 'hidden';
  triggerConditions: HiddenCondition[];
  revealCondition?: string; // 揭示条件描述（未解锁时显示）
}

// 挑战成就
export interface ChallengeAchievement extends AchievementDefinition {
  category: 'challenge';
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  timeLimit?: number; // 时间限制（毫秒）
  restrictions: ChallengeRestriction[];
  leaderboard?: boolean; // 是否有排行榜
}

export interface ChallengeRestriction {
  type: 'no_item' | 'no_skill' | 'hp_limit' | 'time_limit';
  value: any;
  description: string;
}

// 隐藏成就示例
export const HIDDEN_ACHIEVEMENTS: HiddenAchievement[] = [
  {
    id: 'lucky_encounter',
    name: '天选之人',
    description: '在幸运值达到100时触发特殊机缘',
    type: 'special',
    icon: 'Star',
    target: 1,
    category: 'hidden',
    triggerConditions: [
      { type: 'stat', requirements: [{ target: '幸运', operator: '>=', value: 100 }], allRequired: true },
      { type: 'flag', requirements: [{ target: 'special_encounter', operator: '=', value: true }], allRequired: true }
    ],
    revealCondition: '???',
    rewards: { stats: { 幸运: 10 }, special: '天选光环' }
  }
];

// 挑战成就示例
export const CHALLENGE_ACHIEVEMENTS: ChallengeAchievement[] = [
  {
    id: 'speedrun_boss',
    name: '闪电战',
    description: '在10回合内击败Boss',
    type: 'combat',
    icon: 'Zap',
    target: 1,
    category: 'challenge',
    difficulty: 'hard',
    restrictions: [
      { type: 'time_limit', value: 10, description: '10回合内击败' }
    ],
    leaderboard: true,
    rewards: { items: [...], title: '闪电战大师' }
  }
];
```

### 7.3 收集奖励与称号系统

**新增类型定义：**
```typescript
// 称号定义
export interface Title {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  source: string; // 获取来源
  effects: TitleEffect[];
  displayStyle: {
    color: string;
    prefix: string;
    suffix: string;
  };
}

export interface TitleEffect {
  type: 'stat' | 'visual' | 'special';
  value: any;
  description: string;
}

// 扩展 Protagonist
export interface Protagonist {
  // ...现有字段
  titles: string[];      // 已获得称号ID
  activeTitle: string | null; // 当前显示称号
}

// 称号示例
export const TITLES: Title[] = [
  {
    id: 'sword_sage',
    name: '剑圣',
    description: '收集30本剑法功法',
    rarity: 'legendary',
    source: 'collection:sword_techniques:30',
    effects: [
      { type: 'stat', value: { 悟性: 10, 灵根: 5 }, description: '悟性+10，灵根+5' },
      { type: 'visual', value: 'sword_aura', description: '剑气环绕特效' }
    ],
    displayStyle: { color: '#FFD700', prefix: '「', suffix: '」' }
  },
  {
    id: 'boss_slayer',
    name: 'Boss终结者',
    description: '累计击败30个Boss',
    rarity: 'epic',
    source: 'achievement:combat_boss_30',
    effects: [
      { type: 'stat', value: { 体质: 3, 意志: 3 }, description: '体质+3，意志+3' }
    ],
    displayStyle: { color: '#A855F7', prefix: '【', suffix: '】' }
  }
];

// 收集进度奖励
export interface CollectionReward {
  category: string;
  progress: number;
  rewards: {
    stats?: Partial<CharacterStats>;
    title?: string;
    currency?: { type: CurrencyType; amount: number };
  };
}
```

---

## 八、系统集成与实现优先级

### 实现优先级排序

**P0 - 核心体验（立即实现）：**
1. 修炼流派系统 - 提供选择感
2. 功法熟练度与羁绊 - 提供成长感
3. 装备词缀与强化 - 提供刷装乐趣
4. 势力声望与任务 - 提供长期目标

**P1 - 深度扩展（第二阶段）：**
1. 境界瓶颈与渡劫
2. 功法奥义系统
3. 装备套装系统
4. 连锁机缘

**P2 - 高级内容（第三阶段）：**
1. 心境与心魔系统
2. 禁术与副作用
3. 黑市与多货币
4. 隐藏成就与挑战成就

**P3 - 终极追求（第四阶段）：**
1. 称号系统
2. 图鉴套装奖励
3. 绝版奖励
4. 选择后果系统

### 数据兼容策略

所有新增字段都设置默认值，确保旧存档正常加载：
```typescript
// 存档迁移示例
function migrateProtagonist(old: any): Protagonist {
  return {
    ...old,
    cultivationPath: old.cultivationPath ?? null,
    pathExp: old.pathExp ?? 0,
    pathLevel: old.pathLevel ?? 1,
    mentalState: old.mentalState ?? { stability: 70, karma: 0, demonChance: 0, lastDemonTime: 0, mentalBuffs: [] },
    factionProgress: old.factionProgress ?? null,
    currencies: old.currencies ?? { spirit_stone: 0, contribution: 0, honor: 0, festival: 0 },
    titles: old.titles ?? [],
    activeTitle: old.activeTitle ?? null,
    choiceHistory: old.choiceHistory ?? [],
    worldFlags: old.worldFlags ?? {},
    npcRelations: old.npcRelations ?? {}
  };
}
```
