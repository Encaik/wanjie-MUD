# 优化方案详细设计

**基于**: game-design-review.md 评审结果
**优先级**: P0 > P1 > P2

---

## 一、P0优化方案：战斗策略系统

### 1.1 问题分析

当前战斗系统：
- 纯数值比拼，玩家无决策
- 战斗结果完全由属性决定
- 克制关系无法主动利用

### 1.2 设计方案

#### 1.2.1 战斗行动类型

```typescript
// src/lib/game/types.ts 新增

/** 战斗行动类型 */
export type BattleAction = 
  | 'normal_attack'   // 普通攻击
  | 'skill_attack'    // 功法攻击
  | 'defend'          // 防御
  | 'use_item'        // 使用物品
  | 'flee';           // 逃跑

/** 战斗行动结果 */
export interface BattleActionResult {
  action: BattleAction;
  success: boolean;
  damage?: number;
  healing?: number;
  mpCost?: number;
  message: string;
  effects?: ActiveEffect[];
}
```

#### 1.2.2 战斗技能系统

```typescript
// src/lib/game/battleSkillSystem.ts

/** 战斗技能定义 */
export interface BattleSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'buff' | 'debuff';
  mpCost: number;
  cooldown: number;
  currentCooldown: number;
  effect: {
    damageMultiplier?: number;
    healing?: number;
    buff?: StatBuff;
    debuff?: StatBuff;
  };
}

/** 玩家在战斗中的决策 */
export function executeBattleAction(
  action: BattleAction,
  player: BattleState,
  enemy: EnemyState,
  skillId?: string,
  itemId?: string
): BattleActionResult {
  switch (action) {
    case 'normal_attack':
      return executeNormalAttack(player, enemy);
    
    case 'skill_attack':
      if (!skillId) return { action, success: false, message: '未指定技能' };
      return executeSkillAttack(player, enemy, skillId);
    
    case 'defend':
      return executeDefend(player);
    
    case 'use_item':
      if (!itemId) return { action, success: false, message: '未指定物品' };
      return executeUseItem(player, itemId);
    
    case 'flee':
      return executeFlee(player, enemy);
  }
}

/** 防御行动 */
function executeDefend(player: BattleState): BattleActionResult {
  // 防御：本回合受到伤害减半，恢复少量MP
  player.isDefending = true;
  player.mp = Math.min(player.maxMp, player.mp + 5);
  
  return {
    action: 'defend',
    success: true,
    healing: 0,
    mpCost: 0,
    message: '你摆出防御姿态，准备抵御攻击。恢复5点法力。',
  };
}

/** 逃跑行动 */
function executeFlee(player: BattleState, enemy: EnemyState): BattleActionResult {
  // 逃跑成功率：基于等级差和敌人类型
  const levelDiff = player.level - enemy.level;
  const baseRate = 0.3;
  const levelBonus = levelDiff * 0.05;
  const enemyPenalty = enemy.tier === 'boss' ? 0.2 : 0;
  
  const fleeRate = Math.max(0.1, Math.min(0.8, baseRate + levelBonus - enemyPenalty));
  
  if (Math.random() < fleeRate) {
    return {
      action: 'flee',
      success: true,
      message: '你成功逃离了战斗！',
    };
  } else {
    return {
      action: 'flee',
      success: false,
      message: '逃跑失败！敌人挡住了你的去路。',
    };
  }
}
```

#### 1.2.3 战斗UI交互

```tsx
// src/components/game/BattleActionPanel.tsx

interface BattleActionPanelProps {
  player: BattleState;
  enemy: EnemyState;
  skills: BattleSkill[];
  items: InventoryItem[];
  onAction: (action: BattleAction, skillId?: string, itemId?: string) => void;
}

export function BattleActionPanel({
  player,
  enemy,
  skills,
  items,
  onAction,
}: BattleActionPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30 rounded-lg">
      {/* 普通攻击 */}
      <Button onClick={() => onAction('normal_attack')}>
        <Sword className="w-4 h-4 mr-1" />
        攻击
      </Button>
      
      {/* 功法攻击 */}
      <Select onValueChange={(skillId) => onAction('skill_attack', skillId)}>
        <SelectTrigger>
          <Zap className="w-4 h-4 mr-1" />
          功法
        </SelectTrigger>
        <SelectContent>
          {skills.map(skill => (
            <SelectItem 
              key={skill.id} 
              value={skill.id}
              disabled={player.mp < skill.mpCost || skill.currentCooldown > 0}
            >
              {skill.name} ({skill.mpCost}MP)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* 使用物品 */}
      <Select onValueChange={(itemId) => onAction('use_item', undefined, itemId)}>
        <SelectTrigger>
          <Package className="w-4 h-4 mr-1" />
          物品
        </SelectTrigger>
        <SelectContent>
          {items.filter(i => i.definition.effects?.length).map(item => (
            <SelectItem key={item.id} value={item.id}>
              {item.definition.name} x{item.quantity}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* 防御 */}
      <Button variant="outline" onClick={() => onAction('defend')}>
        <Shield className="w-4 h-4 mr-1" />
        防御
      </Button>
      
      {/* 逃跑 */}
      <Button 
        variant="destructive" 
        onClick={() => onAction('flee')}
        disabled={enemy.tier === 'boss'}
      >
        <LogOut className="w-4 h-4 mr-1" />
        逃跑
      </Button>
    </div>
  );
}
```

### 1.3 实施步骤

1. **第一阶段**（1-2天）
   - 添加防御和逃跑行动
   - 修改战斗循环，允许玩家选择行动

2. **第二阶段**（3-5天）
   - 实现功法技能系统
   - 添加战斗中使用物品功能
   - 添加战斗UI交互

3. **第三阶段**（1周）
   - 添加敌人AI策略
   - 添加战斗事件系统
   - 平衡测试

---

## 二、P0优化方案：终局玩法

### 2.1 问题分析

- 飞升后无新内容
- 玩家达到最高境界后流失
- 缺乏长期留存机制

### 2.2 设计方案

#### 2.2.1 飞升境界系统

```typescript
// src/lib/game/ascensionRealmSystem.ts

/** 飞升境界 */
export interface AscensionRealm {
  id: string;
  name: string;
  description: string;
  requiredMarks: number; // 需要的飞升印记
  bonuses: {
    statMultiplier: number;
    expMultiplier: number;
    dropRateBonus: number;
  };
}

/** 飞升境界配置 */
export const ASCENSION_REALMS: AscensionRealm[] = [
  {
    id: 'ascension_1',
    name: '天人境',
    description: '初入仙途，脱胎换骨',
    requiredMarks: 100,
    bonuses: { statMultiplier: 1.5, expMultiplier: 1.2, dropRateBonus: 0.1 },
  },
  {
    id: 'ascension_2',
    name: '真仙境',
    description: '仙气缭绕，神通广大',
    requiredMarks: 500,
    bonuses: { statMultiplier: 2.0, expMultiplier: 1.5, dropRateBonus: 0.2 },
  },
  {
    id: 'ascension_3',
    name: '金仙境',
    description: '金光万丈，法力无边',
    requiredMarks: 2000,
    bonuses: { statMultiplier: 3.0, expMultiplier: 2.0, dropRateBonus: 0.3 },
  },
  {
    id: 'ascension_4',
    name: '大罗金仙',
    description: '跳出三界外，不在五行中',
    requiredMarks: 10000,
    bonuses: { statMultiplier: 5.0, expMultiplier: 3.0, dropRateBonus: 0.5 },
  },
];
```

#### 2.2.2 排行榜系统

```typescript
// src/lib/game/leaderboardSystem.ts

/** 排行榜类型 */
export type LeaderboardType = 
  | 'combat_power'   // 战力排行
  | 'speedrun'       // 通关速度
  | 'achievement'    // 成就点数
  | 'ascension';     // 飞升境界

/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  extraData?: Record<string, any>;
  updatedAt: number;
}

/** 排行榜奖励 */
export interface LeaderboardReward {
  rankRange: [number, number]; // [minRank, maxRank]
  rewards: {
    spiritStones: number;
    ascensionMarks: number;
    items?: ItemDefinition[];
  };
}

/** 周常排行榜奖励 */
export const WEEKLY_LEADERBOARD_REWARDS: LeaderboardReward[] = [
  {
    rankRange: [1, 1],
    rewards: { spiritStones: 10000, ascensionMarks: 50 },
  },
  {
    rankRange: [2, 3],
    rewards: { spiritStones: 5000, ascensionMarks: 30 },
  },
  {
    rankRange: [4, 10],
    rewards: { spiritStones: 2000, ascensionMarks: 15 },
  },
  {
    rankRange: [11, 50],
    rewards: { spiritStones: 500, ascensionMarks: 5 },
  },
];
```

#### 2.2.3 每周Boss挑战

```typescript
// src/lib/game/weeklyBossSystem.ts

/** 每周Boss配置 */
export interface WeeklyBoss {
  id: string;
  name: string;
  description: string;
  element: Element;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  specialAbility: string;
  rewards: BossReward[];
  availableFrom: number; // 周开始时间
  availableUntil: number; // 周结束时间
}

/** Boss奖励 */
export interface BossReward {
  type: 'first_kill' | 'daily' | 'damage';
  rewards: {
    ascensionMarks: number;
    items?: ItemDefinition[];
  };
}

/** 每周Boss生成 */
export function generateWeeklyBoss(weekNumber: number): WeeklyBoss {
  const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
  const element = elements[weekNumber % elements.length];
  
  return {
    id: `weekly_boss_${weekNumber}`,
    name: `${ELEMENT_NAMES[element]}域守护者`,
    description: `来自${ELEMENT_NAMES[element]}之域的强大存在`,
    element,
    level: 100 + Math.floor(weekNumber / 10) * 10,
    hp: 100000 + weekNumber * 1000,
    attack: 500 + weekNumber * 10,
    defense: 200 + weekNumber * 5,
    specialAbility: getWeeklyBossAbility(element),
    rewards: [
      {
        type: 'first_kill',
        rewards: { ascensionMarks: 100, items: getBossUniqueDrop(element) },
      },
      {
        type: 'daily',
        rewards: { ascensionMarks: 20 },
      },
      {
        type: 'damage',
        rewards: { ascensionMarks: 10 },
      },
    ],
    availableFrom: getWeekStart(weekNumber),
    availableUntil: getWeekEnd(weekNumber),
  };
}
```

### 2.3 实施步骤

1. **第一阶段**（1周）
   - 实现飞升境界系统
   - 添加飞升专属商店
   - 添加飞升印记获取途径

2. **第二阶段**（1周）
   - 实现排行榜系统
   - 添加周常奖励结算

3. **第三阶段**（1周）
   - 实现每周Boss挑战
   - 添加Boss战特殊机制

---

## 三、P1优化方案：地牢随机事件

### 3.1 问题分析

- 探索格子内容固定
- 缺乏惊喜和策略选择
- 内容消耗过快

### 3.2 设计方案

```typescript
// src/lib/game/dungeonEvents.ts

/** 地牢事件类型 */
export type DungeonEventType = 
  | 'treasure'        // 宝箱
  | 'mystery'         // 神秘事件
  | 'trap'            // 陷阱
  | 'merchant'        // 商人
  | 'shrine'          // 神殿
  | 'hidden_room';    // 隐藏房间

/** 地牢事件 */
export interface DungeonEvent {
  id: string;
  type: DungeonEventType;
  name: string;
  description: string;
  choices: DungeonChoice[];
}

/** 事件选择 */
export interface DungeonChoice {
  id: string;
  text: string;
  requirements?: {
    minLevel?: number;
    minHp?: number;
    item?: string;
    stat?: { [key: string]: number };
  };
  outcomes: DungeonOutcome[];
}

/** 事件结果 */
export interface DungeonOutcome {
  probability: number;
  effects: {
    hp?: number;
    mp?: number;
    spiritStones?: number;
    items?: { id: string; quantity: number }[];
    buffs?: ActiveEffect[];
  };
  message: string;
}

/** 神秘事件示例 */
export const MYSTERY_EVENTS: DungeonEvent[] = [
  {
    id: 'event_ancient_altar',
    type: 'mystery',
    name: '古老祭坛',
    description: '你发现了一座古老的祭坛，上面散发着神秘的光芒。',
    choices: [
      {
        id: 'pray',
        text: '虔诚祈祷',
        outcomes: [
          {
            probability: 0.5,
            effects: { buffs: [{ type: 'stat_boost', stat: '灵根', value: 10, duration: 5 }] },
            message: '神灵回应了你的祈祷，你感到灵力大增！',
          },
          {
            probability: 0.3,
            effects: { hp: -20 },
            message: '祭坛突然爆发出一阵暗光，你受到了反噬！',
          },
          {
            probability: 0.2,
            effects: { spiritStones: 100 },
            message: '祭坛中涌出一股灵气，凝聚成了灵石！',
          },
        ],
      },
      {
        id: 'take_risk',
        text: '强行吸收祭坛能量',
        requirements: { minLevel: 30 },
        outcomes: [
          {
            probability: 0.3,
            effects: { buffs: [{ type: 'stat_boost', stat: '体质', value: 5, duration: -1 }] },
            message: '你成功吸收了祭坛的精华，体质永久提升！',
          },
          {
            probability: 0.5,
            effects: { hp: -50, mp: -30 },
            message: '能量过于强大，你的身体无法承受！',
          },
          {
            probability: 0.2,
            effects: { items: [{ id: 'rare_artifact', quantity: 1 }] },
            message: '祭坛崩塌，露出了一件古老的神器！',
          },
        ],
      },
      {
        id: 'leave',
        text: '离开',
        outcomes: [
          { probability: 1.0, effects: {}, message: '你决定不冒险，继续前进。' },
        ],
      },
    ],
  },
];
```

### 3.3 实施步骤

1. **第一阶段**（3天）
   - 设计10-15个随机事件
   - 实现事件触发和选择逻辑

2. **第二阶段**（2天）
   - 添加事件UI界面
   - 添加事件结果动画

3. **第三阶段**（2天）
   - 平衡事件奖励
   - 添加事件触发条件

---

## 四、P1优化方案：经济平衡

### 4.1 问题分析

- 灵石产出过剩
- 后期货币贬值
- 缺乏高价值消耗途径

### 4.2 设计方案

```typescript
// src/lib/game/economyBalance.ts

/** 灵石消耗途径 */
export const SPIRIT_STONE_SINKS = {
  /** 装备重铸：重置所有词缀 */
  equipmentReforge: {
    cost: (equipmentLevel: number, rarity: ItemRarity) => {
      const rarityMultiplier = { '普通': 1, '稀有': 2, '史诗': 5, '传说': 10 };
      return equipmentLevel * 100 * rarityMultiplier[rarity];
    },
    description: '消耗灵石重新生成装备词缀',
  },
  
  /** 功法突破：突破功法等级上限 */
  techniqueBreakthrough: {
    cost: (currentMaxLevel: number) => currentMaxLevel * 200,
    description: '消耗灵石提升功法等级上限',
  },
  
  /** 境界突破辅助：提高突破成功率 */
  breakthroughAssist: {
    cost: (realmLevel: number) => realmLevel * 500,
    successBonus: 0.15,
    description: '消耗灵石提高突破成功率15%',
  },
  
  /** 属性重置 */
  statReset: {
    cost: 1000,
    description: '消耗灵石重新分配属性点',
  },
  
  /** 外观商店 */
  appearanceStore: [
    { id: 'title_sword_master', name: '剑道至尊称号', cost: 5000 },
    { id: 'avatar_flame', name: '火焰头像框', cost: 3000 },
    { id: 'effect_aura_gold', name: '金色光环特效', cost: 10000 },
  ],
};

/** 货币消耗调整建议 */
export function adjustCurrencyRewards(currentLevel: number): {
  spiritStoneMultiplier: number;
  ascensionMarkAddition: number;
} {
  // 后期减少灵石产出，增加飞升印记产出
  if (currentLevel >= 100) {
    return { spiritStoneMultiplier: 0.5, ascensionMarkAddition: 5 };
  } else if (currentLevel >= 80) {
    return { spiritStoneMultiplier: 0.7, ascensionMarkAddition: 2 };
  } else {
    return { spiritStoneMultiplier: 1.0, ascensionMarkAddition: 0 };
  }
}
```

### 4.3 实施步骤

1. **第一阶段**（2天）
   - 添加装备重铸功能
   - 添加功法突破功能

2. **第二阶段**（2天）
   - 添加境界突破辅助
   - 添加属性重置功能

3. **第三阶段**（2天）
   - 添加外观商店
   - 调整后期货币产出

---

## 五、实施优先级与时间规划

| 优先级 | 功能 | 预计工时 | 影响 |
|--------|------|----------|------|
| 🔴 P0 | 战斗策略系统 | 1周 | 核心玩法 |
| 🔴 P0 | 终局玩法 | 2周 | 长期留存 |
| 🟠 P1 | 地牢随机事件 | 1周 | 趣味性 |
| 🟠 P1 | 经济平衡 | 3天 | 系统稳定 |
| 🟡 P2 | 社交系统 | 2周 | 留存率 |
| 🟡 P2 | 世界专属机制 | 1周 | 多样性 |

**建议实施顺序**：
1. 战斗策略系统（立即提升玩法深度）
2. 经济平衡（快速见效，稳定系统）
3. 地牢随机事件（提升趣味性）
4. 终局玩法（长期建设）
5. 社交系统（扩大影响）

---

*本方案基于 game-design-strict 设计方法论编写*
