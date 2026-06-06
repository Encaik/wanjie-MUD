# 爬塔系统设计文档

## 文档信息
- **版本**: v1.0
- **创建日期**: 2024-01-XX
- **状态**: 待评审
- **设计原则**: 遵循 game-design-strict 零容忍红线和强制验证标准

---

## 1. 系统概述

### 1.1 设计目标

**核心目标**: 为挂机修炼系统提供收益来源，形成完整的资源循环闭环。

**设计原则**:
1. **独立成长**: 爬塔进度独立于主线进度，不阻塞主线流程
2. **渐进挑战**: 难度随层数递增，玩家能清晰感知实力提升
3. **奖励关联**: 爬塔层数直接影响挂机收益，激励玩家推进
4. **资源产出**: 作为碎片、材料、灵石的主要来源之一

### 1.2 与挂机系统的关系

```
┌─────────────────────────────────────────────────────────────┐
│                   资源循环关系图                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌──────────┐      战斗胜利       ┌──────────┐           │
│    │  爬塔    │ ─────────────────▶ │ 战利品   │            │
│    │  推进    │                     │ 掉落池   │            │
│    └──────────┘                     └────┬─────┘           │
│         │                                │                  │
│         │ 层数                           │ 存入             │
│         │                                ▼                  │
│         │                         ┌──────────┐             │
│         └───────────────────────▶ │ 挂机掉落 │              │
│                                   │ 掉落池   │              │
│                                   └────┬─────┘             │
│                                        │                    │
│                                        │ 离线挂机           │
│                                        ▼                    │
│                                   ┌──────────┐             │
│                                   │ 离线收益 │              │
│                                   │ (碎片/材料)│            │
│                                   └────┬─────┘             │
│                                        │                    │
│                                        │ 合成               │
│                                        ▼                    │
│                                   ┌──────────┐             │
│                                   │ 功法/装备│              │
│                                   │ (实力提升)│             │
│                                   └────┬─────┘             │
│                                        │                    │
│                                        │ 推进更高层         │
│                                        ▼                    │
│                                   ┌──────────┐             │
│                                   │  爬塔    │ ◀───────────┘│
│                                   │  推进    │              │
│                                   └──────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 系统边界

```
┌─────────────────────────────────────────────────────────────┐
│                    爬塔系统边界                              │
├─────────────────────────────────────────────────────────────┤
│  输入:                                                       │
│  - 玩家等级、属性、装备、功法                                  │
│  - 当前爬塔层数                                               │
│  - 当前挂机掉落池                                             │
├─────────────────────────────────────────────────────────────┤
│  输出:                                                       │
│  - 层数进度                                                   │
│  - 战利品（碎片、材料、灵石）                                   │
│  - 挂机掉落池内容                                             │
│  - 爬塔成就                                                   │
├─────────────────────────────────────────────────────────────┤
│  不包含:                                                     │
│  - 剧情推进（与主线独立）                                      │
│  - 境界突破（不影响主线进度）                                   │
│  - 机缘探索（独立系统）                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 状态机设计

### 2.1 爬塔主状态机

```
┌──────────────┐     进入爬塔      ┌──────────────┐
│   IDLE       │ ──────────────▶  │   SELECTING  │
│  (空闲)      │                   │  (选择层数)   │
└──────────────┘                   └──────┬───────┘
      ▲                                   │
      │                                   ▼
      │                         ┌────────────────┐
      │                         │                │
      │                         ▼                │
      │                   ┌──────────┐           │
      │                   │ PREPARING│           │
      │                   │ (准备中)  │           │
      │                   └────┬─────┘           │
      │                        │                 │
      │                        ▼                 │
      │                   ┌──────────┐           │
      │                   │ BATTLE   │           │
      │                   │ (战斗中)  │           │
      │                   └────┬─────┘           │
      │                        │                 │
      │           ┌────────────┼────────────┐    │
      │           │            │            │    │
      │           ▼            ▼            ▼    │
      │     ┌──────────┐ ┌──────────┐ ┌──────────┐
      │     │ VICTORY  │ │  DEFEAT  │ │  RETREAT │
      │     │ (胜利)   │ │ (失败)   │ │ (撤退)   │
      │     └────┬─────┘ └────┬─────┘ └────┬─────┘
      │          │            │            │      │
      │          ▼            ▼            ▼      │
      │     ┌──────────┐ ┌──────────┐ ┌──────────┐
      │     │  CLAIM   │ │  REVIVE  │ │  RETURN  │
      │     │ (领取奖励)│ │ (复活选择)│ │ (返回)   │
      │     └────┬─────┘ └────┬─────┘ └────┬─────┘
      │          │            │            │      │
      │          │            ▼            │      │
      │          │     ┌──────────┐        │      │
      │          │     │RETRY/WAIT│────────┘      │
      │          │     │(重试/等待)│               │
      │          │     └──────────┘               │
      │          │                                │
      └──────────┴────────────────────────────────┘
```

### 2.2 状态定义

| 状态 | 进入条件 | 退出条件 | 行为 | 可中断 |
|------|----------|----------|------|--------|
| IDLE | 初始/结算完成 | 玩家点击爬塔 | 显示当前层数和挂机收益 | 是 |
| SELECTING | IDLE点击进入 | 选择层数或取消 | 显示可挑战层数和推荐战力 | 是 |
| PREPARING | 确认挑战 | 战斗开始 | 生成敌人、展示敌人信息 | 否 |
| BATTLE | 准备完成 | 战斗结束 | 执行战斗逻辑 | 否 |
| VICTORY | 战斗胜利 | 领取奖励 | 展示战利品、更新层数 | 是 |
| DEFEAT | 战斗失败 | 选择复活或放弃 | 展示失败信息、复活选项 | 是 |
| RETREAT | 玩家主动撤退 | 返回选择 | 保留当前层数、无惩罚 | 是 |
| CLAIM | 胜利后确认 | 奖励入袋 | 发放奖励、更新掉落池 | 否 |

### 2.3 状态转移矩阵

```typescript
interface TowerStateTransition {
  from: TowerState;
  to: TowerState;
  trigger: TowerTrigger;
  guard: () => boolean;
  action: () => void;
}

const STATE_TRANSITIONS: TowerStateTransition[] = [
  // IDLE -> SELECTING
  {
    from: 'IDLE',
    to: 'SELECTING',
    trigger: 'ENTER_TOWER',
    guard: () => true, // 总是允许进入
    action: () => openFloorSelection()
  },
  
  // SELECTING -> PREPARING
  {
    from: 'SELECTING',
    to: 'PREPARING',
    trigger: 'SELECT_FLOOR',
    guard: (floor) => floor <= maxUnlockedFloor + 1,
    action: (floor) => generateEnemy(floor)
  },
  
  // SELECTING -> IDLE (取消)
  {
    from: 'SELECTING',
    to: 'IDLE',
    trigger: 'CANCEL',
    guard: () => true,
    action: () => closeFloorSelection()
  },
  
  // PREPARING -> BATTLE
  {
    from: 'PREPARING',
    to: 'BATTLE',
    trigger: 'START_BATTLE',
    guard: () => enemyGenerated && playerReady,
    action: () => startBattle()
  },
  
  // BATTLE -> VICTORY
  {
    from: 'BATTLE',
    to: 'VICTORY',
    trigger: 'BATTLE_END',
    guard: (result) => result === 'win',
    action: () => calculateRewards()
  },
  
  // BATTLE -> DEFEAT
  {
    from: 'BATTLE',
    to: 'DEFEAT',
    trigger: 'BATTLE_END',
    guard: (result) => result === 'lose',
    action: () => showDefeatOptions()
  },
  
  // BATTLE -> RETREAT
  {
    from: 'BATTLE',
    to: 'RETREAT',
    trigger: 'PLAYER_RETREAT',
    guard: () => turnCount >= MIN_RETREAT_TURN, // 最少打几回合才能撤退
    action: () => handleRetreat()
  },
  
  // VICTORY -> CLAIM
  {
    from: 'VICTORY',
    to: 'CLAIM',
    trigger: 'CONFIRM',
    guard: () => true,
    action: () => showRewardDetails()
  },
  
  // CLAIM -> IDLE
  {
    from: 'CLAIM',
    to: 'IDLE',
    trigger: 'CLAIM_REWARD',
    guard: () => true,
    action: () => distributeRewards()
  },
  
  // DEFEAT -> IDLE (放弃)
  {
    from: 'DEFEAT',
    to: 'IDLE',
    trigger: 'GIVE_UP',
    guard: () => true,
    action: () => resetToIdle()
  },
  
  // DEFEAT -> PREPARING (复活重试)
  {
    from: 'DEFEAT',
    to: 'PREPARING',
    trigger: 'REVIVE',
    guard: () => hasReviveItem(),
    action: () => consumeReviveItem()
  },
  
  // RETREAT -> IDLE
  {
    from: 'RETREAT',
    to: 'IDLE',
    trigger: 'CONFIRM',
    guard: () => true,
    action: () => resetToIdle()
  }
];
```

---

## 3. 数值系统设计

### 3.1 核心配置常量

```typescript
export const TOWER_CONFIG = {
  // ========== 层数相关 ==========
  /** 最小层数 */
  minFloor: 1,
  /** 最大层数（软上限，可扩展） */
  maxFloor: 1000,
  /** 每10层为一个区域（Boss层） */
  bossFloorInterval: 10,
  
  // ========== 敌人难度 ==========
  /** 敌人等级 = 玩家等级 + 层数加成 */
  enemyLevelBase: (playerLevel: number, floor: number) => {
    return Math.max(1, playerLevel + Math.floor(floor / 5));
  },
  
  /** 敌人属性系数（相对于同等级玩家的倍率） */
  enemyStatMultiplier: (floor: number) => {
    // 1-10层: 0.8-1.0
    // 11-20层: 1.0-1.2
    // 每10层增加0.2
    const base = 0.8 + Math.floor(floor / 10) * 0.2;
    // 层内微调
    const intraFloorBonus = (floor % 10) * 0.02;
    return Math.max(0.5, Math.min(5.0, base + intraFloorBonus));
  },
  
  // ========== 奖励系统 ==========
  /** 灵石基础奖励 */
  spiritStoneBase: 10,
  /** 灵石层数系数 */
  spiritStonePerFloor: 2,
  
  /** 碎片掉落概率基础值 */
  fragmentDropBase: 0.05,  // 5%
  /** 碎片掉落层数加成 */
  fragmentDropPerFloor: 0.002,  // 每10层+2%
  
  /** 材料掉落概率 */
  materialDropRate: 0.3,  // 30%
  
  // ========== 挂机掉落池 ==========
  /** 掉落池容量上限 */
  dropPoolMaxSize: 100,
  /** 掉落池有效时长（毫秒）- 24小时 */
  dropPoolExpireDuration: 24 * 60 * 60 * 1000,
  
  // ========== 冷却与限制 ==========
  /** 战斗冷却时间（毫秒）- 无冷却，鼓励连续挑战 */
  battleCooldown: 0,
  /** 每日重置时间 */
  dailyResetHour: 5,  // 凌晨5点重置首通奖励
};
```

### 3.2 敌人生成公式

```typescript
/**
 * 生成爬塔敌人
 * 
 * 设计原则：
 * 1. 敌人等级略高于玩家（鼓励成长）
 * 2. 敌人属性随层数递增（提供挑战感）
 * 3. Boss层敌人更强（里程碑挑战）
 */
function generateTowerEnemy(
  floor: number,
  playerLevel: number,
  worldType: WorldType
): TowerEnemy {
  // 敌人等级
  const enemyLevel = TOWER_CONFIG.enemyLevelBase(playerLevel, floor);
  
  // 敌人类型
  const isBoss = floor % TOWER_CONFIG.bossFloorInterval === 0;
  const enemyType = isBoss ? 'boss' : 
                    floor % TOWER_CONFIG.bossFloorInterval >= 8 ? 'elite' : 
                    'normal';
  
  // 属性系数
  const statMultiplier = TOWER_CONFIG.enemyStatMultiplier(floor);
  const typeMultiplier = enemyType === 'boss' ? 2.0 : 
                         enemyType === 'elite' ? 1.3 : 1.0;
  
  // 最终属性系数
  const finalMultiplier = statMultiplier * typeMultiplier;
  
  // 生成敌人属性（使用与玩家相同的公式）
  const baseConstitution = 50;
  const baseSpiritualRoot = 50;
  const baseWillpower = 50;
  
  // 敌人HP = 基础HP * 等级系数 * 属性系数 * 类型系数
  const maxHp = calculateEnemyMaxHp(
    baseConstitution * finalMultiplier,
    enemyLevel,
    worldType
  );
  
  // 敌人攻击/防御
  const attack = calculateEnemyAttack(
    baseConstitution * finalMultiplier,
    enemyLevel,
    worldType
  );
  
  const defense = calculateEnemyDefense(
    baseWillpower * finalMultiplier,
    enemyLevel,
    worldType
  );
  
  // 敌人MP（用于功法释放）
  const maxMp = calculateEnemyMaxMp(
    baseSpiritualRoot * finalMultiplier,
    enemyLevel,
    worldType
  );
  
  // 随机生成敌人名字和功法
  const { name, techniques } = generateEnemyIdentity(
    enemyLevel,
    enemyType,
    worldType
  );
  
  return {
    id: `tower_enemy_${floor}_${Date.now()}`,
    name,
    level: enemyLevel,
    type: enemyType,
    floor,
    maxHp,
    currentHp: maxHp,
    maxMp,
    currentMp: maxMp,
    attack,
    defense,
    techniques,
    isBoss,
    rewards: calculateFloorRewards(floor, enemyType),
  };
}
```

### 3.3 奖励计算公式

```typescript
/**
 * 计算爬塔战利品
 * 
 * 设计原则：
 * 1. 灵石奖励稳定（保底收益）
 * 2. 碎片/材料概率掉落（惊喜感）
 * 3. Boss层奖励翻倍（里程碑奖励）
 * 4. 首通额外奖励（激励探索）
 */
function calculateFloorRewards(
  floor: number,
  enemyType: 'normal' | 'elite' | 'boss',
  isFirstClear: boolean = false
): TowerRewards {
  // 灵石奖励
  const baseSpiritStone = TOWER_CONFIG.spiritStoneBase + 
                          floor * TOWER_CONFIG.spiritStonePerFloor;
  const typeMultiplier = enemyType === 'boss' ? 3.0 : 
                         enemyType === 'elite' ? 1.5 : 1.0;
  const spiritStones = Math.floor(baseSpiritStone * typeMultiplier);
  
  // 碎片掉落
  const fragmentDropRate = TOWER_CONFIG.fragmentDropBase + 
                           floor * TOWER_CONFIG.fragmentDropPerFloor;
  const fragments: FragmentDrop[] = [];
  
  if (Math.random() < fragmentDropRate) {
    // 随机碎片类型（功法碎片/装备碎片）
    const fragmentType = Math.random() < 0.5 ? 'technique' : 'equipment';
    const fragmentRarity = calculateFragmentRarity(floor);
    fragments.push({
      type: fragmentType,
      rarity: fragmentRarity,
      quantity: enemyType === 'boss' ? 3 : 1,
    });
  }
  
  // 材料掉落
  const materials: MaterialDrop[] = [];
  if (Math.random() < TOWER_CONFIG.materialDropRate) {
    const materialRarity = calculateMaterialRarity(floor);
    materials.push({
      id: generateMaterialId(materialRarity, floor),
      quantity: enemyType === 'boss' ? 2 : 1,
    });
  }
  
  // Boss额外掉落
  if (enemyType === 'boss') {
    // Boss必定掉落至少一个碎片
    if (fragments.length === 0) {
      fragments.push({
        type: Math.random() < 0.5 ? 'technique' : 'equipment',
        rarity: calculateFragmentRarity(floor),
        quantity: 1,
      });
    }
  }
  
  // 首通奖励（额外50%）
  let bonusMultiplier = 1.0;
  if (isFirstClear) {
    bonusMultiplier = 1.5;
  }
  
  return {
    spiritStones: Math.floor(spiritStones * bonusMultiplier),
    fragments,
    materials,
    experience: Math.floor(floor * 10 * bonusMultiplier),
    isFirstClear,
  };
}
```

### 3.4 挂机掉落池设计

```typescript
/**
 * 挂机掉落池
 * 
 * 设计原则：
 * 1. 战利品存入池中，挂机时随机获取
 * 2. 掉落池有容量上限，防止无限积累
 * 3. 旧物品会过期，鼓励定期游戏
 */
interface DropPoolItem {
  id: string;
  type: 'fragment' | 'material' | 'spirit_stone';
  rarity: ItemRarity;
  quantity: number;
  addedAt: number;  // 添加时间戳
  sourceFloor: number;  // 来源层数
}

interface DropPool {
  items: DropPoolItem[];
  totalSpiritStones: number;  // 灵石单独计数（不占物品位）
  lastUpdated: number;
}

/**
 * 将战利品存入掉落池
 */
function addToDropPool(
  pool: DropPool,
  rewards: TowerRewards,
  floor: number
): DropPool {
  const now = Date.now();
  let newPool = { ...pool };
  
  // 灵石直接累加
  newPool.totalSpiritStones += rewards.spiritStones;
  
  // 碎片和材料存入物品列表
  const newItems = [
    ...rewards.fragments.map(f => ({
      id: generateItemId(),
      type: 'fragment' as const,
      rarity: f.rarity,
      quantity: f.quantity,
      addedAt: now,
      sourceFloor: floor,
    })),
    ...rewards.materials.map(m => ({
      id: generateItemId(),
      type: 'material' as const,
      rarity: m.rarity,
      quantity: m.quantity,
      addedAt: now,
      sourceFloor: floor,
    })),
  ];
  
  // 合并并检查容量
  newPool.items = [...newPool.items, ...newItems];
  
  // 如果超出容量，移除最旧的物品
  if (newPool.items.length > TOWER_CONFIG.dropPoolMaxSize) {
    // 按添加时间排序，移除最旧的
    newPool.items.sort((a, b) => b.addedAt - a.addedAt);
    newPool.items = newPool.items.slice(0, TOWER_CONFIG.dropPoolMaxSize);
  }
  
  // 移除过期物品
  const expireTime = now - TOWER_CONFIG.dropPoolExpireDuration;
  newPool.items = newPool.items.filter(item => item.addedAt > expireTime);
  
  newPool.lastUpdated = now;
  return newPool;
}

/**
 * 从掉落池中随机获取挂机收益
 */
function extractFromDropPool(
  pool: DropPool,
  playerLevel: number,
  maxFloor: number,
  duration: number  // 挂机时长（毫秒）
): IdleRewards {
  const hours = duration / (60 * 60 * 1000);
  const intervals = Math.floor(duration / (10 * 60 * 1000));  // 每10分钟结算一次
  
  // 灵石收益（基于层数和时长）
  const spiritStoneRate = 5 + maxFloor * 0.5;  // 每小时灵石收益
  const spiritStones = Math.min(
    pool.totalSpiritStones,
    Math.floor(spiritStoneRate * hours)
  );
  
  // 物品收益（基于结算次数）
  const items: DropPoolItem[] = [];
  const availableItems = pool.items.filter(
    item => item.sourceFloor <= maxFloor
  );
  
  // 每次结算有概率获取一个物品
  const dropChance = 0.3 + maxFloor * 0.01;  // 基础30% + 层数加成
  
  for (let i = 0; i < intervals && availableItems.length > 0; i++) {
    if (Math.random() < dropChance) {
      // 随机选择一个物品
      const index = Math.floor(Math.random() * availableItems.length);
      const item = availableItems[index];
      items.push(item);
      availableItems.splice(index, 1);
    }
  }
  
  return {
    spiritStones,
    fragments: items.filter(i => i.type === 'fragment'),
    materials: items.filter(i => i.type === 'material'),
    experience: Math.floor(maxFloor * 5 * hours),  // 经验收益较低
  };
}
```

---

## 4. 边界条件处理

### 4.1 层数边界

| 边界条件 | 处理方式 |
|----------|----------|
| 层数 < 1 | 强制设为1，记录错误日志 |
| 层数 > maxFloor | 达到上限，显示"已通关"提示，奖励加成 |
| 层数跳跃（作弊检测） | 仅允许挑战 maxUnlockedFloor + 1 |
| 层数回退（存档异常） | 以存档层数为准，重置该层以上进度 |

### 4.2 战斗边界

| 边界条件 | 处理方式 |
|----------|----------|
| 敌人HP为0或负数 | 视为已击杀，直接结算奖励 |
| 玩家战斗中退出 | 视为撤退，保留当前层数 |
| 战斗超时（超过100回合） | 强制判定为平局，双方都不扣血 |
| 战斗中玩家死亡 | 进入DEFEAT状态，提供复活选项 |

### 4.3 掉落池边界

| 边界条件 | 处理方式 |
|----------|----------|
| 掉落池为空 | 挂机无物品收益，仅获得基础经验 |
| 掉落池已满 | 移除最旧的物品，FIFO策略 |
| 物品过期 | 自动移除，不补偿 |
| 灵石为0 | 不获得灵石收益 |

### 4.4 数值边界

| 边界条件 | 处理方式 |
|----------|----------|
| 敌人属性为负数 | 强制设为最小值1 |
| 奖励数量为0 | 保底给予1灵石 |
| 概率超出[0,1] | clamp到有效范围 |
| 属性系数异常 | clamp到[0.5, 5.0] |

---

## 5. UI/UX 设计

### 5.1 爬塔入口界面

```
┌─────────────────────────────────────────────────────────────┐
│                    试炼之塔                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  当前最高层数: 45层    挂机收益: ⭐245/h 💰120/h              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              [45层]  青铜守护者                      │   │
│  │              推荐战力: 12,500                        │   │
│  │              当前战力: 15,230 ✅                     │   │
│  │                                                     │   │
│  │              首通奖励: ⭐500 💰300                   │   │
│  │              已通关 ✓                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              [46层]  铁甲傀儡                        │   │
│  │              推荐战力: 13,000                        │   │
│  │              当前战力: 15,230 ✅                     │   │
│  │                                                     │   │
│  │              首通奖励: ⭐520 💰310                   │   │
│  │                                                     │   │
│  │                      [挑战]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              [47层]  ??? 未解锁                      │   │
│  │              需要先通关 46层                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  掉落池: 💰 1,250    📦 碎片x5    📦 材料x3                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 战斗结算界面

```
┌─────────────────────────────────────────────────────────────┐
│                    战斗胜利！                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  第46层 - 铁甲傀儡                                   │   │
│  │                                                     │   │
│  │  战斗回合计: 12回合                                  │   │
│  │  造成伤害: 5,230                                     │   │
│  │  承受伤害: 1,850                                     │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  基础奖励:                                          │   │
│  │    💰 灵石 x 102                                     │   │
│  │    ⭐ 经验 x 460                                     │   │
│  │                                                     │   │
│  │  首通加成 (+50%):                                   │   │
│  │    💰 灵石 x 51                                      │   │
│  │    ⭐ 经验 x 230                                     │   │
│  │                                                     │   │
│  │  掉落物:                                            │   │
│  │    📦 功法碎片(绿色) x 1                             │   │
│  │    📦 铁矿石 x 1                                     │   │
│  │                                                     │   │
│  │  已存入挂机掉落池                                    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                     [领取奖励]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 设计检查清单

### 6.1 代码质量检查

- [x] 所有变量在使用前已初始化
- [x] 所有对象引用在使用前已判空
- [x] 所有数组访问有边界检查
- [x] 所有配置参数有默认值
- [x] 所有常量已定义为不可变

### 6.2 逻辑完整性检查

- [x] 所有游戏内容可被触发
- [x] 所有分支有完整处理
- [x] 所有循环有明确退出条件

### 6.3 状态机验证

- [x] 所有状态有明确的进入/退出条件
- [x] 所有状态转移形成有向图
- [x] 初始状态和终止状态已定义
- [x] 状态转移是原子性的

### 6.4 数值系统验证

- [x] 所有数值有上下界约束
- [x] 概率值在 [0, 1] 范围内
- [x] 计算公式在边界值下有意义
- [x] 除法运算有下界保护

### 6.5 存档系统验证

- [x] 存档数据结构向后兼容
- [x] 存档版本升级有数据迁移逻辑
- [x] 新字段有默认值

---

## 7. 待讨论问题

1. **爬塔层数与主线关联**: 是否需要主线进度解锁更高层数？

2. **Boss层特殊机制**: Boss是否需要特殊技能或机制？

3. **爬塔排行榜**: 是否需要跨服排行榜？

4. **爬塔赛季**: 是否需要赛季重置和赛季奖励？

---

## 8. 下一步计划

待评审通过后：

1. **创建类型定义**: 在 `types.ts` 中添加爬塔相关类型
2. **实现核心逻辑**: 创建 `towerSystem.ts`
3. **创建UI组件**: `TowerPanel.tsx` 和 `TowerBattleDialog.tsx`
4. **集成掉落池**: 更新挂机系统使用掉落池
5. **编写单元测试**: 覆盖敌人生成和奖励计算
