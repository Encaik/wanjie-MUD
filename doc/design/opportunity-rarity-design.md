# 机缘解锁与品质掉落机制设计

## 一、问题分析

### 1.1 机缘解锁机制问题

**当前实现**（`src/lib/data/worldSystem.ts`）：
```typescript
// 当前逻辑：机缘等级受世界难度系数限制
const maxLevel = getMaxOpportunityLevel(difficultyCoefficient);
const availableOpportunities = WORLD_OPPORTUNITIES.filter(o => {
  if (o.opportunityLevel > maxLevel) return false; // 高级机缘无法出现
  // ...
});
```

**问题**：
- 低难度世界只能出现低级机缘
- 玩家无法提前体验高级内容
- 缺乏"高风险高回报"的游戏体验
- 新玩家感受不到游戏的深度

**期望行为**：
- 低级机缘：随时可进入，收益递减
- 高级机缘：按等级解锁，收益丰厚但有门槛

---

### 1.2 品质掉落机制问题

**当前实现**（`src/lib/data/worldSystem.ts`）：
```typescript
// 当前逻辑：品质加成基于世界难度系数
rarityBonus: {
  rare: Math.max(0, (difficultyCoefficient - 1) * 0.15),
  epic: Math.max(0, (difficultyCoefficient - 1.5) * 0.12),
  legendary: Math.max(0, (difficultyCoefficient - 2.5) * 0.08),
  mythic: Math.max(0, (difficultyCoefficient - 3.5) * 0.05),
}
```

**问题**：
- 高等级玩家进入低难度世界，仍能获得高品质掉落
- 品质与玩家等级/世界系数绑定，而非与内容本身绑定
- 刷低级内容获取高级奖励，破坏游戏平衡

**期望行为**：
- 品质上限由机缘/敌人等级决定
- 玩家属性只影响掉落数量，不影响品质上限
- 高品质装备只能在高级内容中获取

---

## 二、设计目标

### 2.1 核心原则

1. **风险收益对等**：高级内容 = 高风险 + 高回报
2. **内容绑定品质**：品质上限由内容本身决定，而非玩家属性
3. **渐进式解锁**：玩家随成长逐步解锁高级内容
4. **无硬性门槛**：低级玩家可尝试高级内容，但收益受限

### 2.2 设计边界

| 场景 | 玩家等级 | 机缘等级 | 能否进入 | 收益 |
|------|----------|----------|----------|------|
| 低级玩家 + 低级机缘 | 10 | 1-2 | ✅ 正常收益 | 100% |
| 低级玩家 + 高级机缘 | 10 | 4-5 | ✅ 可进入，收益递减 | 30-50% |
| 高级玩家 + 低级机缘 | 50 | 1-2 | ✅ 可进入，收益递减 | 20-40% |
| 高级玩家 + 高级机缘 | 50 | 4-5 | ✅ 正常收益 | 100% |

---

## 三、核心机制设计

### 3.1 机缘等级系统

#### 3.1.1 等级定义

```typescript
/** 机缘等级配置 */
interface OpportunityLevelConfig {
  level: number;                    // 等级 1-5
  name: string;                     // 等级名称
  minPlayerLevel: number;           // 推荐最低玩家等级
  minAscension: number;             // 最低飞升次数
  rarityRange: ItemRarity[];        // 可掉落品质范围
  rarityWeights: Record<string, number>; // 品质权重
  baseRewardMultiplier: number;     // 基础奖励倍率
}

const OPPORTUNITY_LEVEL_CONFIG: Record<number, OpportunityLevelConfig> = {
  1: {
    level: 1,
    name: '微小机缘',
    minPlayerLevel: 1,
    minAscension: 0,
    rarityRange: ['普通', '稀有'],
    rarityWeights: { '普通': 85, '稀有': 15 },
    baseRewardMultiplier: 1.0,
  },
  2: {
    level: 2,
    name: '小型机缘',
    minPlayerLevel: 10,
    minAscension: 0,
    rarityRange: ['普通', '稀有', '史诗'],
    rarityWeights: { '普通': 60, '稀有': 30, '史诗': 10 },
    baseRewardMultiplier: 1.5,
  },
  3: {
    level: 3,
    name: '中型机缘',
    minPlayerLevel: 25,
    minAscension: 0,
    rarityRange: ['稀有', '史诗', '传说'],
    rarityWeights: { '稀有': 50, '史诗': 35, '传说': 15 },
    baseRewardMultiplier: 2.0,
  },
  4: {
    level: 4,
    name: '大型机缘',
    minPlayerLevel: 40,
    minAscension: 1,
    rarityRange: ['史诗', '传说', '神话'],
    rarityWeights: { '史诗': 45, '传说': 40, '神话': 15 },
    baseRewardMultiplier: 3.0,
  },
  5: {
    level: 5,
    name: '天大机缘',
    minPlayerLevel: 60,
    minAscension: 3,
    rarityRange: ['传说', '神话'],
    rarityWeights: { '传说': 60, '神话': 40 },
    baseRewardMultiplier: 5.0,
  },
};
```

#### 3.1.2 解锁检查

```typescript
interface OpportunityUnlockResult {
  isUnlocked: boolean;              // 是否完全解锁
  canEnter: boolean;                // 是否可以进入
  unlockProgress: number;           // 解锁进度 0-1
  effectiveMultiplier: number;      // 实际收益倍率
  warnings: string[];               // 警告信息
}

function checkOpportunityUnlock(
  opportunityLevel: number,
  playerLevel: number,
  ascensionCount: number
): OpportunityUnlockResult {
  const config = OPPORTUNITY_LEVEL_CONFIG[opportunityLevel];
  
  // 检查飞升门槛（硬性限制）
  const ascensionMet = ascensionCount >= config.minAscension;
  
  // 检查等级差距
  const levelDiff = playerLevel - config.minPlayerLevel;
  
  // 计算解锁进度
  let unlockProgress = 1.0;
  if (!ascensionMet) {
    unlockProgress = 0.3; // 飞升未达标，只能获得30%收益
  } else if (levelDiff < 0) {
    unlockProgress = Math.max(0.3, 1 + levelDiff * 0.05); // 等级不足，收益递减
  } else if (levelDiff > 20) {
    unlockProgress = Math.max(0.2, 1 - (levelDiff - 20) * 0.03); // 等级过高，收益递减
  }
  
  // 始终可以进入
  const canEnter = true;
  
  // 完全解锁条件
  const isUnlocked = ascensionMet && levelDiff >= 0 && levelDiff <= 20;
  
  // 生成警告信息
  const warnings: string[] = [];
  if (!ascensionMet) {
    warnings.push(`需要飞升 ${config.minAscension} 次才能完全解锁此机缘`);
  }
  if (levelDiff < 0) {
    warnings.push(`推荐等级 ${config.minPlayerLevel}，当前收益降低`);
  } else if (levelDiff > 20) {
    warnings.push(`等级过高，此机缘收益降低`);
  }
  
  return {
    isUnlocked,
    canEnter,
    unlockProgress,
    effectiveMultiplier: config.baseRewardMultiplier * unlockProgress,
    warnings,
  };
}
```

---

### 3.2 品质掉落系统

#### 3.2.1 品质来源

```typescript
/** 品质来源定义 */
type RaritySource = 'opportunity' | 'enemy' | 'boss';

/** 品质范围配置 */
interface RarityRangeConfig {
  sourceType: RaritySource;
  level: number;                    // 来源等级
  rarityRange: ItemRarity[];        // 允许的品质范围
  baseWeights: Record<string, number>; // 基础权重
}

/**
 * 获取品质范围
 * 关键：品质上限由内容本身决定，而非玩家属性
 */
function getRarityRange(
  sourceType: RaritySource,
  sourceLevel: number
): RarityRangeConfig {
  // 机缘品质范围
  if (sourceType === 'opportunity') {
    const config = OPPORTUNITY_LEVEL_CONFIG[sourceLevel];
    return {
      sourceType,
      level: sourceLevel,
      rarityRange: config.rarityRange,
      baseWeights: config.rarityWeights,
    };
  }
  
  // 敌人品质范围（基于敌人等级）
  if (sourceType === 'enemy') {
    if (sourceLevel >= 60) {
      return {
        sourceType: 'enemy',
        level: sourceLevel,
        rarityRange: ['稀有', '史诗', '传说', '神话'],
        baseWeights: { '稀有': 30, '史诗': 40, '传说': 20, '神话': 10 },
      };
    } else if (sourceLevel >= 40) {
      return {
        sourceType: 'enemy',
        level: sourceLevel,
        rarityRange: ['普通', '稀有', '史诗', '传说'],
        baseWeights: { '普通': 20, '稀有': 40, '史诗': 30, '传说': 10 },
      };
    } else if (sourceLevel >= 20) {
      return {
        sourceType: 'enemy',
        level: sourceLevel,
        rarityRange: ['普通', '稀有', '史诗'],
        baseWeights: { '普通': 40, '稀有': 45, '史诗': 15 },
      };
    } else {
      return {
        sourceType: 'enemy',
        level: sourceLevel,
        rarityRange: ['普通', '稀有'],
        baseWeights: { '普通': 75, '稀有': 25 },
      };
    }
  }
  
  // Boss品质范围
  if (sourceType === 'boss') {
    if (sourceLevel >= 50) {
      return {
        sourceType: 'boss',
        level: sourceLevel,
        rarityRange: ['史诗', '传说', '神话'],
        baseWeights: { '史诗': 30, '传说': 45, '神话': 25 },
      };
    } else if (sourceLevel >= 30) {
      return {
        sourceType: 'boss',
        level: sourceLevel,
        rarityRange: ['稀有', '史诗', '传说'],
        baseWeights: { '稀有': 25, '史诗': 50, '传说': 25 },
      };
    } else {
      return {
        sourceType: 'boss',
        level: sourceLevel,
        rarityRange: ['稀有', '史诗', '传说'],
        baseWeights: { '稀有': 40, '史诗': 45, '传说': 15 },
      };
    }
  }
  
  // 默认：普通品质
  return {
    sourceType,
    level: sourceLevel,
    rarityRange: ['普通'],
    baseWeights: { '普通': 100 },
  };
}
```

#### 3.2.2 品质生成

```typescript
/**
 * 生成掉落品质
 * 
 * @param sourceType 来源类型
 * @param sourceLevel 来源等级（机缘等级/敌人等级）
 * @param playerLuck 玩家幸运值（只影响权重分布，不影响品质上限）
 * @param worldBonus 世界加成（只影响数量，不影响品质上限）
 */
function generateDropRarity(
  sourceType: RaritySource,
  sourceLevel: number,
  playerLuck: number = 0,
  worldBonus: number = 0
): ItemRarity {
  // 1. 获取品质范围（由内容决定，不含玩家因素）
  const config = getRarityRange(sourceType, sourceLevel);
  
  // 2. 复制基础权重
  const weights = { ...config.baseWeights };
  
  // 3. 幸运值影响权重分布（不影响上限）
  // 幸运值可以让高品质概率更高，但不能突破品质上限
  if (playerLuck > 0) {
    const luckBonus = Math.min(playerLuck * 0.005, 0.3); // 最高30%加成
    const rarities = config.rarityRange;
    
    // 从低到高调整权重
    for (let i = 0; i < rarities.length - 1; i++) {
      const shift = weights[rarities[i]] * luckBonus * (i + 1) / rarities.length;
      weights[rarities[i]] -= shift;
      weights[rarities[rarities.length - 1]] += shift;
    }
  }
  
  // 4. 确保所有品质都在范围内
  for (const rarity of Object.keys(weights)) {
    if (!config.rarityRange.includes(rarity as ItemRarity)) {
      delete weights[rarity];
    }
  }
  
  // 5. 随机选择
  return weightedRandom(weights) as ItemRarity;
}

/**
 * 计算掉落数量
 * 
 * @param baseCount 基础数量
 * @param worldBonus 世界加成
 * @param playerBonus 玩家加成
 */
function calculateDropCount(
  baseCount: number,
  worldBonus: number = 0,
  playerBonus: number = 0
): number {
  const multiplier = 1 + worldBonus + playerBonus;
  return Math.max(1, Math.floor(baseCount * multiplier));
}
```

---

### 3.3 奖励计算系统

#### 3.3.1 统一奖励计算

```typescript
/** 奖励计算上下文 */
interface RewardCalculationContext {
  // 来源信息
  sourceType: RaritySource;
  sourceLevel: number;
  opportunityLevel?: number;
  
  // 玩家信息
  playerLevel: number;
  playerLuck: number;
  ascensionCount: number;
  
  // 世界信息
  worldCoefficient: number;
  
  // 额外加成
  bonusMultipliers: {
    exp: number;
    gold: number;
    drop: number;
  };
}

/** 奖励结果 */
interface CalculatedReward {
  experience: number;
  gold: number;
  items: Array<{
    type: 'technique' | 'equipment' | 'item' | 'fragment';
    rarity: ItemRarity;
    level: number;
    quantity: number;
  }>;
  multiplier: number;             // 实际收益倍率
  warnings: string[];             // 警告信息
}

function calculateReward(
  context: RewardCalculationContext
): CalculatedReward {
  const warnings: string[] = [];
  
  // 1. 检查机缘解锁状态
  let effectiveMultiplier = 1.0;
  if (context.sourceType === 'opportunity' && context.opportunityLevel) {
    const unlockResult = checkOpportunityUnlock(
      context.opportunityLevel,
      context.playerLevel,
      context.ascensionCount
    );
    effectiveMultiplier = unlockResult.effectiveMultiplier;
    warnings.push(...unlockResult.warnings);
  }
  
  // 2. 计算经验/金钱
  const baseExp = calculateBaseExp(context.sourceType, context.sourceLevel);
  const baseGold = calculateBaseGold(context.sourceType, context.sourceLevel);
  
  const exp = Math.floor(
    baseExp * effectiveMultiplier * context.bonusMultipliers.exp
  );
  const gold = Math.floor(
    baseGold * effectiveMultiplier * context.bonusMultipliers.gold
  );
  
  // 3. 生成掉落物品
  const items: CalculatedReward['items'] = [];
  
  // 确定掉落数量
  const dropCount = calculateDropCount(
    1, // 基础掉落1件
    context.bonusMultipliers.drop,
    context.playerLuck * 0.01
  );
  
  // 生成物品
  for (let i = 0; i < dropCount; i++) {
    const rarity = generateDropRarity(
      context.sourceType,
      context.sourceLevel,
      context.playerLuck,
      context.bonusMultipliers.drop // 注意：这只影响数量，不影响品质
    );
    
    // 物品等级由来源等级决定，而非玩家等级
    const itemLevel = Math.max(1, context.sourceLevel + randomInt(-5, 5));
    
    items.push({
      type: randomItemType(),
      rarity,
      level: itemLevel,
      quantity: 1,
    });
  }
  
  return {
    experience: exp,
    gold,
    items,
    multiplier: effectiveMultiplier,
    warnings,
  };
}
```

---

## 四、边界条件处理

### 4.1 极端情况

| 情况 | 处理方式 |
|------|----------|
| 机缘等级 = 0 | 使用默认配置（等级1） |
| 来源等级 < 0 | 视为等级1 |
| 幸运值 < 0 | 视为0 |
| 品质范围为空 | 默认为['普通'] |
| 权重和为0 | 平均分配权重 |

### 4.2 数值约束

```typescript
// 等级约束
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;
const MIN_OPPORTUNITY_LEVEL = 1;
const MAX_OPPORTUNITY_LEVEL = 5;

// 倍率约束
const MIN_MULTIPLIER = 0.1;   // 最低10%收益
const MAX_MULTIPLIER = 10.0;  // 最高10倍收益

// 品质约束
const VALID_RARITIES: ItemRarity[] = ['普通', '稀有', '史诗', '传说', '神话'];

// 数值保护
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

---

## 五、数据结构变更

### 5.1 新增类型定义

```typescript
// src/lib/game/types.ts

/** 机缘解锁状态 */
export interface OpportunityUnlockState {
  level: number;                   // 机缘等级
  isFullyUnlocked: boolean;        // 是否完全解锁
  effectiveMultiplier: number;     // 实际收益倍率
  warnings: string[];              // 警告信息
}

/** 品质来源 */
export type RaritySource = 'opportunity' | 'enemy' | 'boss';

/** 掉落结果 */
export interface DropResult {
  rarity: ItemRarity;              // 品质
  level: number;                   // 物品等级
  quantity: number;                // 数量
  sourceType: RaritySource;        // 来源类型
  sourceLevel: number;             // 来源等级
}
```

### 5.2 数据文件结构

```
src/lib/data/
├── opportunityConfig.ts       # 机缘配置（新增）
│   ├── OPPORTUNITY_LEVEL_CONFIG
│   ├── checkOpportunityUnlock()
│   └── getOpportunityWarnings()
│
├── raritySystem.ts            # 品质系统（新增）
│   ├── getRarityRange()
│   ├── generateDropRarity()
│   └── calculateDropCount()
│
└── rewardSystem.ts            # 奖励系统（重构）
    ├── calculateReward()
    ├── calculateBaseExp()
    └── calculateBaseGold()
```

---

## 六、UI展示

### 6.1 机缘信息展示

```tsx
interface OpportunityDisplayProps {
  opportunity: WorldOpportunity;
  playerLevel: number;
  ascensionCount: number;
}

function OpportunityDisplay({ opportunity, playerLevel, ascensionCount }: OpportunityDisplayProps) {
  const unlockResult = checkOpportunityUnlock(
    opportunity.opportunityLevel,
    playerLevel,
    ascensionCount
  );
  
  const config = OPPORTUNITY_LEVEL_CONFIG[opportunity.opportunityLevel];
  
  return (
    <div className="opportunity-card">
      <div className="header">
        <span className="level">{config.name}</span>
        {!unlockResult.isUnlocked && (
          <Badge variant="warning">收益降低</Badge>
        )}
      </div>
      
      <div className="content">
        <p>{opportunity.description}</p>
        
        {/* 品质范围提示 */}
        <div className="rarity-range">
          可获得品质：
          {config.rarityRange.map(rarity => (
            <Badge key={rarity} variant={getRarityVariant(rarity)}>
              {rarity}
            </Badge>
          ))}
        </div>
        
        {/* 警告信息 */}
        {unlockResult.warnings.length > 0 && (
          <div className="warnings">
            {unlockResult.warnings.map((warning, i) => (
              <p key={i} className="text-yellow-500 text-sm">
                ⚠️ {warning}
              </p>
            ))}
          </div>
        )}
        
        {/* 收益倍率 */}
        <div className="multiplier">
          当前收益：{(unlockResult.effectiveMultiplier * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
```

### 6.2 掉落信息展示

```tsx
interface DropDisplayProps {
  drops: DropResult[];
}

function DropDisplay({ drops }: DropDisplayProps) {
  return (
    <div className="drop-list">
      {drops.map((drop, i) => (
        <div key={i} className="drop-item">
          <Badge variant={getRarityVariant(drop.rarity)}>
            {drop.rarity}
          </Badge>
          <span className="level">Lv.{drop.level}</span>
          {drop.quantity > 1 && (
            <span className="quantity">x{drop.quantity}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 七、测试用例

### 7.1 机缘解锁测试

```typescript
describe('机缘解锁机制', () => {
  test('低级玩家进入低级机缘应获得正常收益', () => {
    const result = checkOpportunityUnlock(1, 5, 0);
    expect(result.isUnlocked).toBe(true);
    expect(result.effectiveMultiplier).toBeCloseTo(1.0, 1);
  });
  
  test('低级玩家进入高级机缘收益应递减', () => {
    const result = checkOpportunityUnlock(5, 10, 0);
    expect(result.isUnlocked).toBe(false);
    expect(result.effectiveMultiplier).toBeLessThan(0.5);
  });
  
  test('高级玩家进入低级机缘收益应递减', () => {
    const result = checkOpportunityUnlock(1, 50, 0);
    expect(result.effectiveMultiplier).toBeLessThan(1.0);
  });
  
  test('飞升不足时应限制收益', () => {
    const result = checkOpportunityUnlock(5, 60, 0); // 等级够但飞升不够
    expect(result.effectiveMultiplier).toBe(0.3);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
```

### 7.2 品质掉落测试

```typescript
describe('品质掉落机制', () => {
  test('机缘等级1不应掉落史诗及以上品质', () => {
    for (let i = 0; i < 100; i++) {
      const rarity = generateDropRarity('opportunity', 1, 0, 0);
      expect(['普通', '稀有']).toContain(rarity);
    }
  });
  
  test('机缘等级5不应掉落普通品质', () => {
    for (let i = 0; i < 100; i++) {
      const rarity = generateDropRarity('opportunity', 5, 0, 0);
      expect(['传说', '神话']).toContain(rarity);
    }
  });
  
  test('幸运值不能突破品质上限', () => {
    // 低级机缘 + 高幸运值
    for (let i = 0; i < 100; i++) {
      const rarity = generateDropRarity('opportunity', 1, 100, 0);
      expect(['普通', '稀有']).toContain(rarity);
    }
  });
  
  test('世界加成不能突破品质上限', () => {
    // 低级机缘 + 高世界加成
    for (let i = 0; i < 100; i++) {
      const rarity = generateDropRarity('opportunity', 1, 0, 10);
      expect(['普通', '稀有']).toContain(rarity);
    }
  });
});
```

---

## 八、迁移计划

### 8.1 需要删除的代码

1. `src/lib/data/worldSystem.ts`
   - 删除 `getMaxOpportunityLevel()` 函数
   - 删除 `calculateWorldRewardCoefficient()` 中的 `rarityBonus`

2. `src/lib/data/worldEffectsData.ts`
   - 删除 `getMaxOpportunityLevel()` 函数

### 8.2 需要新增的文件

1. `src/lib/data/opportunityConfig.ts` - 机缘配置
2. `src/lib/data/raritySystem.ts` - 品质系统
3. `src/lib/data/rewardSystem.ts` - 奖励系统

### 8.3 需要修改的文件

1. `src/lib/game/battle/battleController.ts` - 使用新的奖励计算
2. `src/components/...` - 更新UI展示

---

## 九、风险评估

### 9.1 潜在问题

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 玩家投诉收益降低 | 中 | 添加UI提示，明确说明收益递减原因 |
| 低级内容无人问津 | 低 | 添加成就/收集系统激励 |
| 高级内容过于困难 | 中 | 动态调整敌人强度 |

### 9.2 回滚方案

保留旧代码但标记为 deprecated，可通过配置开关切换新旧系统：
```typescript
const USE_NEW_RARITY_SYSTEM = true;
```

---

## 十、总结

本设计通过以下核心改进解决现有问题：

1. **机缘解锁**：
   - 所有机缘都可进入
   - 收益由玩家等级与机缘等级匹配度决定
   - 高级机缘需要飞升条件才能完全解锁

2. **品质掉落**：
   - 品质上限由内容等级决定
   - 玩家属性只影响权重分布和数量
   - 完全隔离品质上限与玩家属性

3. **风险收益**：
   - 低级玩家挑战高级内容 = 高风险低回报
   - 高级玩家刷低级内容 = 低风险低回报
   - 匹配度最高时 = 最佳体验
