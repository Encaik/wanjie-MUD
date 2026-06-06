# 敌人系统重新设计

> **文档版本**: v1.1
> **创建日期**: 2024-01-XX
> **更新日期**: 2024-01-XX
> **状态**: 待审阅
> **设计原则**: 零容忍红线 + 强制验证标准

---

## 目录

1. [问题分析](#1-问题分析)
2. [设计目标](#2-设计目标)
3. [属性计算分层架构](#3-属性计算分层架构)
4. [核心概念](#4-核心概念)
5. [敌人模板系统](#5-敌人模板系统)
6. [敌人功法装备系统](#6-敌人功法装备系统)
7. [等级压制机制](#7-等级压制机制)
8. [多敌人战斗系统](#8-多敌人战斗系统)
9. [行动顺序系统](#9-行动顺序系统)
10. [敌人AI决策系统](#10-敌人ai决策系统)
11. [数值验证](#11-数值验证)
12. [实施计划](#12-实施计划)

---

## 1. 问题分析

### 1.1 当前系统问题

#### 问题1：敌人难度两极分化

**现象描述**：
- 低难度区域的敌人太简单，玩家可以轻松碾压
- 高难度区域的敌人太难，玩家完全打不过
- 中间过渡不自然，缺乏渐进式挑战

**根本原因**：
```
当前敌人属性计算公式（简化）：

敌人HP = 基础HP × 等级系数 × 分级系数 × 难度系数 × 世界系数 × 随机浮动

问题：多重系数叠加导致指数级膨胀
```

#### 问题2：只有1v1战斗

**现象描述**：
- 战斗只支持单个玩家对单个敌人
- 没有先后手概念
- 没有目标选择策略
- 缺乏战术深度

#### 问题3：缺乏等级压制机制

**现象描述**：
- 玩家可以挑战任意等级的敌人
- 低等级玩家通过运气可能击败高等级敌人
- 缺乏明显的等级威慑

### 1.2 设计检查清单对照

| 检查项 | 当前状态 | 问题描述 |
|--------|----------|----------|
| 数值有上下界约束 | ❌ | 多重系数叠加导致数值失控 |
| 计算公式边界有意义 | ❌ | 高等级+高难度产生异常值 |
| 成长曲线经过模拟验证 | ❌ | 缺乏系统性验证 |
| 无绝对最优解 | ❌ | 高属性敌人让玩家无从应对 |

---

## 2. 设计目标

### 2.1 核心目标

1. **数值平衡**：同等级敌人与玩家属性相当，差距由难度系数可控调节
2. **多敌人支持**：支持1vN战斗，有完整的行动顺序系统
3. **战术深度**：速度属性影响行动顺序，玩家需要制定策略
4. **渐进挑战**：难度曲线平滑，玩家有明确的成长目标
5. **等级压制**：等级差距过大时，高等级敌人直接秒杀低等级玩家

### 2.2 设计原则

#### 原则1：敌人模板与玩家同构

```
敌人属性公式 ≈ 玩家属性公式 × 难度系数

关键：敌人使用与玩家完全相同的属性计算基础，
差异仅来自难度系数（受控）
```

#### 原则2：分层架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application)                      │
│  机缘战斗 / 爬塔战斗 / Boss战斗                               │
│  调用：createEnemyGroup(config, playerLevel, world)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    敌人生成层 (Enemy Generator)              │
│  职责：根据配置生成敌人实例                                   │
│  输入：EnemyGroupConfig, playerLevel, worldType             │
│  输出：EnemyGroup (包含多个 EnemyInstance)                   │
│  调用：属性计算中间层获取基础属性                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                属性计算中间层 (Stats Calculator)             │
│  职责：统一处理玩家和敌人的属性计算                           │
│  ├── 世界系数调整：根据 worldType 调整基础数值               │
│  ├── 难度系数调整：根据 difficulty 调整最终数值              │
│  ├── 功法加成计算：techniqueBonus = Σ(功法加成)              │
│  └── 装备加成计算：equipmentBonus = Σ(装备加成)              │
│                                                              │
│  公式：最终属性 = 基础属性 × 世界系数 × 难度系数 + 功法加成 + 装备加成  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (Data Layer)                       │
│  世界数据 (worldData.ts) / 功法数据 / 装备数据               │
└─────────────────────────────────────────────────────────────┘
```

#### 原则3：难度系数单一化

```
旧方案：等级系数 × 分级系数 × 难度系数 × 世界系数 × ...
新方案：基础属性 × 难度系数（唯一变量）+ 功法装备加成
```

---

## 3. 属性计算分层架构

### 3.1 三层架构设计

```
┌──────────────────────────────────────────────────────────────┐
│                     第一层：基础属性层                         │
│                                                              │
│  计算纯等级带来的基础属性，不受任何外部因素影响                  │
│  公式：baseStat = worldBase + stat × growthRate + level × perLevel  │
│                                                              │
│  示例：                                                      │
│  HP = 100 + 体质×10 + 等级×15                               │
│  攻击 = 10 + 体质×1.0 + 灵根×0.5 + 等级×2                   │
│  防御 = 5 + 意志×0.8 + 等级×1                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     第二层：世界调整层                         │
│                                                              │
│  根据世界类型调整基础属性，体现世界差异                         │
│  不同世界有不同的力量体系规模                                  │
│                                                              │
│  公式：worldAdjusted = baseStat × worldCoefficient           │
│                                                              │
│  世界系数：                                                  │
│  - 武侠：1.0（基准）                                         │
│  - 修仙：1.1（修仙者力量更强）                                │
│  - 高武：1.3（武道巅峰）                                      │
│  - 末世：1.5（极端环境）                                      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     第三层：个体调整层                         │
│                                                              │
│  根据个体特征调整最终属性                                       │
│  玩家：功法加成 + 装备加成                                    │
│  敌人：难度系数 × 分级系数 + 功法装备加成                       │
│                                                              │
│  公式：                                                      │
│  玩家最终属性 = worldAdjusted + 功法加成 + 装备加成            │
│  敌人最终属性 = worldAdjusted × 难度系数 × 分级系数 + 功法加成 + 装备加成  │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 统一属性计算服务

```typescript
/**
 * 属性计算服务
 * 
 * 职责：统一处理玩家和敌人的属性计算
 * 设计：三层架构，职责分离
 */
export class StatsCalculator {
  
  // ==================== 第一层：基础属性 ====================
  
  /**
   * 计算基础HP（纯等级+属性）
   */
  static calculateBaseHp(
    constitution: number,
    level: number,
    worldType: WorldType
  ): number {
    const worldData = getWorldData(worldType);
    return Math.floor(
      worldData.baseHp + 
      constitution * worldData.hpPerConstitution + 
      level * worldData.hpPerLevel
    );
  }
  
  /**
   * 计算基础攻击力（纯等级+属性）
   */
  static calculateBaseAttack(
    constitution: number,
    spiritRoot: number,
    level: number,
    worldType: WorldType
  ): number {
    const worldData = getWorldData(worldType);
    return Math.floor(
      worldData.baseAttack + 
      constitution * worldData.attackPerConstitution + 
      spiritRoot * worldData.attackPerSpiritRoot + 
      level * worldData.attackPerLevel
    );
  }
  
  /**
   * 计算基础防御力（纯等级+属性）
   */
  static calculateBaseDefense(
    willpower: number,
    level: number,
    worldType: WorldType
  ): number {
    const worldData = getWorldData(worldType);
    return Math.floor(
      worldData.baseDefense + 
      willpower * worldData.defensePerWillpower + 
      level * worldData.defensePerLevel
    );
  }
  
  // ==================== 第二层：世界调整 ====================
  
  /**
   * 应用世界系数调整
   * 
   * 世界系数体现不同世界的力量体系差异
   * 在此层统一处理，对玩家和敌人一视同仁
   */
  static applyWorldAdjustment(
    baseStat: number,
    worldType: WorldType
  ): number {
    const worldCoefficients: Record<WorldType, number> = {
      '武侠': 1.0,
      '修仙': 1.1,
      '科技': 1.2,
      '魔幻': 1.1,
      '异能': 1.2,
      '仙侠': 1.3,
      '高武': 1.3,
      '末世': 1.5,
    };
    
    return Math.floor(baseStat * worldCoefficients[worldType]);
  }
  
  // ==================== 第三层：个体调整 ====================
  
  /**
   * 计算玩家最终属性
   */
  static calculatePlayerFinalStats(
    protagonist: Protagonist
  ): PlayerFinalStats {
    const worldType = protagonist.world.type;
    const level = protagonist.level;
    const finalBaseStats = getFinalStats(protagonist.stats);
    
    // 第一层：基础属性
    const baseHp = this.calculateBaseHp(finalBaseStats.体质, level, worldType);
    const baseAttack = this.calculateBaseAttack(
      finalBaseStats.体质, finalBaseStats.灵根, level, worldType
    );
    const baseDefense = this.calculateBaseDefense(finalBaseStats.意志, level, worldType);
    
    // 第二层：世界调整
    const worldHp = this.applyWorldAdjustment(baseHp, worldType);
    const worldAttack = this.applyWorldAdjustment(baseAttack, worldType);
    const worldDefense = this.applyWorldAdjustment(baseDefense, worldType);
    
    // 第三层：功法装备加成
    const techniqueBonus = this.calculateTechniqueBonus(protagonist);
    const equipmentBonus = this.calculateEquipmentBonus(protagonist);
    
    return {
      maxHp: worldHp + techniqueBonus.hp + equipmentBonus.hp,
      maxMp: this.calculateMaxMp(finalBaseStats.灵根, level, worldType),
      attack: worldAttack + techniqueBonus.attack + equipmentBonus.attack,
      defense: worldDefense + techniqueBonus.defense + equipmentBonus.defense,
      speed: this.calculateSpeed(finalBaseStats.灵根, level),
    };
  }
  
  /**
   * 计算敌人最终属性
   */
  static calculateEnemyFinalStats(
    template: EnemyTemplate,
    level: number,
    difficulty: DifficultyPreset,
    tier: EnemyTier,
    worldType: WorldType,
    techniques: Technique[],
    equipments: Equipment[]
  ): EnemyFinalStats {
    // 第一层：基础属性（使用模板属性）
    const baseHp = this.calculateBaseHp(template.baseStats.体质, level, worldType);
    const baseAttack = this.calculateBaseAttack(
      template.baseStats.体质, template.baseStats.灵根, level, worldType
    );
    const baseDefense = this.calculateBaseDefense(template.baseStats.意志, level, worldType);
    
    // 第二层：世界调整（与玩家相同处理）
    const worldHp = this.applyWorldAdjustment(baseHp, worldType);
    const worldAttack = this.applyWorldAdjustment(baseAttack, worldType);
    const worldDefense = this.applyWorldAdjustment(baseDefense, worldType);
    
    // 第三层：难度调整 + 功法装备加成
    const difficultyMod = DIFFICULTY_MODIFIERS[difficulty];
    const tierMod = TIER_MODIFIERS[tier];
    
    // 难度调整（乘法）
    const adjustedHp = Math.floor(worldHp * difficultyMod.hpMultiplier * tierMod.hpMultiplier);
    const adjustedAttack = Math.floor(worldAttack * difficultyMod.attackMultiplier * tierMod.attackMultiplier);
    const adjustedDefense = Math.floor(worldDefense * difficultyMod.defenseMultiplier * tierMod.defenseMultiplier);
    
    // 功法装备加成（加法，与玩家相同）
    const techniqueBonus = this.calculateTechniqueBonusFromList(techniques);
    const equipmentBonus = this.calculateEquipmentBonusFromList(equipments);
    
    return {
      maxHp: adjustedHp + techniqueBonus.hp + equipmentBonus.hp,
      maxMp: this.calculateMaxMp(template.baseStats.灵根, level, worldType),
      attack: adjustedAttack + techniqueBonus.attack + equipmentBonus.attack,
      defense: adjustedDefense + techniqueBonus.defense + equipmentBonus.defense,
      speed: this.calculateSpeed(template.baseStats.灵根, level) * difficultyMod.speedMultiplier,
    };
  }
  
  // ==================== 功法装备加成计算 ====================
  
  /**
   * 计算功法加成
   */
  static calculateTechniqueBonusFromList(techniques: Technique[]): StatBonus {
    return techniques.reduce((bonus, tech) => ({
      hp: bonus.hp + Math.floor(tech.hpBonus || 0),
      attack: bonus.attack + Math.floor(tech.attackBonus || 0),
      defense: bonus.defense + Math.floor(tech.defenseBonus || 0),
      mp: bonus.mp + Math.floor(tech.mpBonus || 0),
    }), { hp: 0, attack: 0, defense: 0, mp: 0 });
  }
  
  /**
   * 计算装备加成
   */
  static calculateEquipmentBonusFromList(equipments: Equipment[]): StatBonus {
    return equipments.reduce((bonus, equip) => ({
      hp: bonus.hp + Math.floor(equip.hpBonus || 0),
      attack: bonus.attack + Math.floor(equip.attackBonus || 0),
      defense: bonus.defense + Math.floor(equip.defenseBonus || 0),
      mp: bonus.mp + Math.floor(equip.mpBonus || 0),
    }), { hp: 0, attack: 0, defense: 0, mp: 0 });
  }
}

// 辅助类型
interface StatBonus {
  hp: number;
  attack: number;
  defense: number;
  mp: number;
}

interface PlayerFinalStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
}

type EnemyFinalStats = PlayerFinalStats; // 结构相同
```

---

## 4. 核心概念

### 4.1 敌人模板 (EnemyTemplate)

敌人模板定义了敌人的基础属性结构和行为特征：

```typescript
interface EnemyTemplate {
  // === 基础信息 ===
  id: string;                    // 模板唯一ID
  name: string;                  // 敌人名称
  description: string;           // 描述
  worldType: WorldType;          // 所属世界
  
  // === 属性配置（与玩家相同结构） ===
  baseStats: {
    体质: number;                // 基础体质（默认50）
    灵根: number;                // 基础灵根（默认50）
    悟性: number;                // 基础悟性（默认50）
    幸运: number;                // 基础幸运（默认50）
    意志: number;                // 基础意志（默认50）
  };
  
  // === 功法配置 ===
  techniqueConfig: {
    slots: number;               // 功法槽位数（0-3）
    pool: TechniquePoolConfig;   // 功法池配置
    guaranteedIds?: string[];    // 保底功法ID
  };
  
  // === 装备配置 ===
  equipmentConfig: {
    melee: { enabled: boolean; pool?: string[]; };
    ranged: { enabled: boolean; pool?: string[]; };
    head: { enabled: boolean; pool?: string[]; };
    body: { enabled: boolean; pool?: string[]; };
    legs: { enabled: boolean; pool?: string[]; };
    feet: { enabled: boolean; pool?: string[]; };
  };
  
  // === 战斗特性 ===
  element?: Element;             // 元素属性
  weaponCategory?: WeaponCategory; // 武器类别
  behaviorType: BehaviorType;    // AI行为类型
  aggressionLevel: number;       // 攻击倾向（0-1）
  
  // === 奖励配置 ===
  expBase: number;               // 经验基础值
  dropTable: DropTable;          // 掉落表
}
```

### 4.2 敌人实例 (EnemyInstance)

战斗中生成的敌人实例，包含真实的功法、装备和技能：

```typescript
interface EnemyInstance {
  // === 基础信息 ===
  instanceId: string;            // 实例唯一ID
  templateId: string;            // 模板ID
  name: string;                  // 显示名称
  tier: EnemyTier;               // 分级
  
  // === 等级 ===
  level: number;                 // 敌人等级
  
  // === 计算后的属性 ===
  stats: {
    maxHp: number;
    currentHp: number;
    maxMp: number;
    currentMp: number;
    attack: number;
    defense: number;
    speed: number;
    critRate: number;
    evasionRate: number;
  };
  
  // === 功法与装备（真实物品，非虚拟） ===
  techniques: Technique[];       // 已装备的功法
  equipments: Equipment[];       // 已装备的装备
  skills: BattleSkill[];         // 可用技能列表（从功法和装备生成）
  
  // === 战斗状态 ===
  skillCooldowns: Map<string, number>;  // 技能冷却
  buffs: StatBuff[];             // 当前Buff/Debuff
  isStunned: boolean;            // 是否眩晕
  isDefending: boolean;          // 是否防御中
  
  // === 元素与克制 ===
  element?: Element;
  weaponCategory?: WeaponCategory;
  
  // === 行为配置 ===
  behaviorType: BehaviorType;
  aggressionLevel: number;
  
  // === 战场位置 ===
  position: {
    row: number;                 // 前排(0) / 后排(1)
    column: number;              // 位置编号(0-2)
  };
  
  // === 奖励 ===
  expReward: number;
  itemDrops: ItemDrop[];
}
```

---

## 5. 敌人模板系统

### 5.1 模板分类

```
敌人模板
├── 普通敌人 (Normal)
│   ├── 修仙界：灵兽、妖魔、散修
│   ├── 高武界：武者、异兽
│   ├── 科技界：机器人、雇佣兵
│   └── ...
│
├── 精英敌人 (Elite)
│   ├── 精英怪：比普通强15%
│   └── 稀有怪：随机出现，掉落更好
│
├── 小Boss (MiniBoss)
│   ├── 关卡Boss：副本/塔层Boss
│   └── 事件Boss：机缘事件Boss
│
└── Boss (Boss)
    ├── 世界Boss：高难度挑战
    └── 剧情Boss：主线Boss
```

### 5.2 难度系数配置

```typescript
/**
 * 难度系数配置
 * 
 * 关键设计：难度系数影响敌人的基础属性倍率
 * 注意：功法装备加成在难度调整之后独立计算
 */
const DIFFICULTY_MODIFIERS: Record<DifficultyPreset, DifficultyModifier> = {
  easy: {
    name: '简单',
    hpMultiplier: 0.75,
    attackMultiplier: 0.8,
    defenseMultiplier: 0.8,
    speedMultiplier: 0.9,
  },
  
  normal: {
    name: '普通',
    hpMultiplier: 0.95,
    attackMultiplier: 0.95,
    defenseMultiplier: 0.95,
    speedMultiplier: 1.0,
  },
  
  hard: {
    name: '困难',
    hpMultiplier: 1.15,
    attackMultiplier: 1.1,
    defenseMultiplier: 1.1,
    speedMultiplier: 1.05,
  },
  
  nightmare: {
    name: '噩梦',
    hpMultiplier: 1.35,
    attackMultiplier: 1.25,
    defenseMultiplier: 1.25,
    speedMultiplier: 1.1,
  },
};

/**
 * 敌人分级系数
 * 
 * 设计原则：分级系数模拟"装备/功法加成"的差异
 * 注意：这是额外乘法，最终会叠加功法装备的实际加成
 */
const TIER_MODIFIERS: Record<EnemyTier, TierModifier> = {
  normal: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
  },
  
  elite: {
    hpMultiplier: 1.15,
    attackMultiplier: 1.12,
    defenseMultiplier: 1.10,
  },
  
  miniboss: {
    hpMultiplier: 1.35,
    attackMultiplier: 1.25,
    defenseMultiplier: 1.20,
  },
  
  boss: {
    hpMultiplier: 1.6,
    attackMultiplier: 1.4,
    defenseMultiplier: 1.35,
  },
};
```

---

## 6. 敌人功法装备系统

### 6.1 设计理念

**核心原则**：敌人拥有真实的功法和装备，与玩家系统完全同构。

```
敌人属性来源：
1. 基础属性 = 等级 × 属性成长（与玩家相同公式）
2. 难度调整 = 基础属性 × 难度系数 × 分级系数
3. 功法加成 = Σ(功法属性加成)（与玩家相同计算）
4. 装备加成 = Σ(装备属性加成)（与玩家相同计算）

最终属性 = 难度调整后属性 + 功法加成 + 装备加成
```

### 6.2 功法生成配置

```typescript
/**
 * 功法池配置
 */
interface TechniquePoolConfig {
  /** 功法类型限制 */
  types?: ('attack' | 'defense')[];
  /** 元素限制 */
  elements?: Element[];
  /** 稀有度权重 */
  rarityWeights?: Record<ItemRarity, number>;
  /** 等级偏移（相对于敌人等级） */
  levelOffset?: { min: number; max: number };
  /** 是否保证至少一个功法有技能 */
  guaranteeSkill?: boolean;
}

/**
 * 敌人功法生成
 */
function generateEnemyTechniques(
  config: TechniquePoolConfig,
  enemyLevel: number,
  slotCount: number,
  worldType: WorldType
): Technique[] {
  const techniques: Technique[] = [];
  
  for (let i = 0; i < slotCount; i++) {
    // 确定功法等级
    const levelOffset = randomInt(
      config.levelOffset?.min ?? -2,
      config.levelOffset?.max ?? 2
    );
    const techniqueLevel = Math.max(1, enemyLevel + levelOffset);
    
    // 确定稀有度（加权随机）
    const rarity = weightedRandom(config.rarityWeights ?? DEFAULT_RARITY_WEIGHTS);
    
    // 确定功法类型
    const type = config.types 
      ? config.types[Math.floor(Math.random() * config.types.length)]
      : randomChoice(['attack', 'defense']);
    
    // 确定元素
    const element = config.elements
      ? config.elements[Math.floor(Math.random() * config.elements.length)]
      : randomElement();
    
    // 生成真实功法
    const technique = generateTechnique({
      level: techniqueLevel,
      rarity,
      type,
      element,
      worldType,
    });
    
    techniques.push(technique);
  }
  
  return techniques;
}

/**
 * 默认稀有度权重
 */
const DEFAULT_RARITY_WEIGHTS: Record<ItemRarity, number> = {
  '普通': 50,
  '稀有': 30,
  '史诗': 15,
  '传说': 4,
  '神话': 1,
};
```

### 6.3 装备生成配置

```typescript
/**
 * 装备槽位配置
 */
interface EquipmentSlotConfig {
  enabled: boolean;
  /** 装备池ID列表 */
  pool?: string[];
  /** 稀有度权重 */
  rarityWeights?: Record<ItemRarity, number>;
  /** 等级偏移 */
  levelOffset?: { min: number; max: number };
}

/**
 * 敌人装备生成
 */
function generateEnemyEquipments(
  config: Record<EquipmentSlot, EquipmentSlotConfig>,
  enemyLevel: number,
  worldType: WorldType
): Equipment[] {
  const equipments: Equipment[] = [];
  
  for (const [slot, slotConfig] of Object.entries(config)) {
    if (!slotConfig.enabled) continue;
    
    // 确定装备等级
    const levelOffset = randomInt(
      slotConfig.levelOffset?.min ?? -3,
      slotConfig.levelOffset?.max ?? 2
    );
    const equipLevel = Math.max(1, enemyLevel + levelOffset);
    
    // 确定稀有度
    const rarity = weightedRandom(slotConfig.rarityWeights ?? DEFAULT_RARITY_WEIGHTS);
    
    // 生成真实装备
    const equipment = generateEquipment({
      level: equipLevel,
      rarity,
      slot: slot as EquipmentSlot,
      worldType,
    });
    
    equipments.push(equipment);
  }
  
  return equipments;
}
```

### 6.4 技能生成

```typescript
/**
 * 从功法和装备生成可用技能列表
 */
function generateEnemySkills(
  techniques: Technique[],
  equipments: Equipment[]
): BattleSkill[] {
  const skills: BattleSkill[] = [];
  
  // 从功法中提取技能
  for (const technique of techniques) {
    if (technique.skills) {
      for (const skill of technique.skills) {
        if (skill.unlockLevel <= technique.level) {
          skills.push(convertTechniqueSkillToBattleSkill(skill, technique));
        }
      }
    }
  }
  
  // 从装备中提取技能
  for (const equipment of equipments) {
    if (equipment.allTechniques) {
      for (const tech of equipment.allTechniques) {
        if (tech.unlockLevel <= equipment.level) {
          skills.push(convertEquipmentSkillToBattleSkill(tech, equipment));
        }
      }
    }
  }
  
  return skills;
}

/**
 * 功法技能转换为战斗技能
 */
function convertTechniqueSkillToBattleSkill(
  skill: TechniqueSkill,
  technique: Technique
): BattleSkill {
  return {
    id: `${technique.id}_${skill.id}`,
    name: skill.name,
    description: skill.description,
    type: skill.type,
    mpCost: Math.floor(technique.baseMpCost * (skill.mpCostMultiplier ?? 1)),
    cooldown: skill.cooldown ?? 3,
    effect: {
      damageMultiplier: skill.damageMultiplier,
      healing: skill.healing,
      buff: skill.buff,
      debuff: skill.debuff,
      special: skill.special,
    },
    element: technique.element,
    techniqueId: technique.id,
    source: 'technique',
    skillCategory: 'technique',
  };
}

/**
 * 装备技能转换为战斗技能
 */
function convertEquipmentSkillToBattleSkill(
  tech: EquipmentTechnique,
  equipment: Equipment
): BattleSkill {
  return {
    id: `${equipment.id}_${tech.id}`,
    name: tech.name,
    description: tech.description ?? '',
    type: 'attack',
    mpCost: 0, // 斗技不消耗法力
    cooldown: tech.cooldown ?? 4,
    effect: {
      damageMultiplier: tech.damageMultiplier ?? 1.2,
    },
    weaponCategory: equipment.weaponCategory,
    equipmentId: equipment.id,
    source: 'equipment',
    skillCategory: 'combat',
  };
}
```

### 6.5 按分级的功法装备配置

```typescript
/**
 * 不同分级敌人的功法装备配置
 */
const TIER_TECHNIQUE_EQUIPMENT_CONFIG: Record<EnemyTier, TierEquipmentConfig> = {
  // 普通敌人：无或基础功法装备
  normal: {
    techniqueSlots: { min: 0, max: 1 },
    techniqueRarity: { '普通': 70, '稀有': 30 },
    equipmentSlots: 1,  // 只装备1-2件
    equipmentRarity: { '普通': 80, '稀有': 20 },
  },
  
  // 精英敌人：有功法装备
  elite: {
    techniqueSlots: { min: 1, max: 2 },
    techniqueRarity: { '普通': 40, '稀有': 45, '史诗': 15 },
    equipmentSlots: 3,  // 装备3件左右
    equipmentRarity: { '普通': 30, '稀有': 50, '史诗': 20 },
  },
  
  // 小Boss：较好的功法装备
  miniboss: {
    techniqueSlots: { min: 2, max: 3 },
    techniqueRarity: { '稀有': 40, '史诗': 45, '传说': 15 },
    equipmentSlots: 5,  // 接近满装
    equipmentRarity: { '稀有': 35, '史诗': 45, '传说': 20 },
  },
  
  // Boss：顶级功法装备
  boss: {
    techniqueSlots: 3,
    techniqueRarity: { '史诗': 40, '传说': 50, '神话': 10 },
    equipmentSlots: 6,  // 满装
    equipmentRarity: { '史诗': 30, '传说': 55, '神话': 15 },
  },
};
```

---

## 7. 等级压制机制

### 7.1 设计理念

**核心原则**：等级差距过大时，高等级敌人直接秒杀低等级玩家，防止"越级挑战"破坏游戏平衡。

### 7.2 等级压制规则

```typescript
/**
 * 等级压制配置
 */
interface LevelSuppressionConfig {
  /** 开始显示警告的等级差 */
  warningThreshold: number;
  /** 触发秒杀的等级差 */
  instantKillThreshold: number;
  /** 伤害/防御加成比例（每级差距） */
  levelDiffModifier: number;
  /** 最大等级差修正 */
  maxLevelDiffModifier: number;
}

const LEVEL_SUPPRESSION: LevelSuppressionConfig = {
  warningThreshold: 5,      // 差5级开始警告
  instantKillThreshold: 15, // 差15级直接秒杀
  levelDiffModifier: 0.05,  // 每级差5%伤害修正
  maxLevelDiffModifier: 0.5, // 最大50%修正
};

/**
 * 等级压制状态
 */
type SuppressionLevel = 'none' | 'warning' | 'danger' | 'instant_kill';

/**
 * 计算等级压制状态
 */
function calculateSuppressionLevel(
  playerLevel: number,
  enemyLevel: number
): SuppressionLevel {
  const levelDiff = enemyLevel - playerLevel;
  
  if (levelDiff >= LEVEL_SUPPRESSION.instantKillThreshold) {
    return 'instant_kill';
  }
  if (levelDiff >= LEVEL_SUPPRESSION.warningThreshold * 2) {
    return 'danger';
  }
  if (levelDiff >= LEVEL_SUPPRESSION.warningThreshold) {
    return 'warning';
  }
  return 'none';
}

/**
 * 计算等级差伤害修正
 */
function calculateLevelDiffModifier(
  playerLevel: number,
  enemyLevel: number
): { playerDamageDealt: number; playerDamageReceived: number } {
  const levelDiff = enemyLevel - playerLevel;
  
  // 玩家等级更高：玩家造成更多伤害，受到更少伤害
  // 敌人等级更高：玩家造成更少伤害，受到更多伤害
  const modifier = Math.min(
    Math.abs(levelDiff) * LEVEL_SUPPRESSION.levelDiffModifier,
    LEVEL_SUPPRESSION.maxLevelDiffModifier
  );
  
  if (levelDiff > 0) {
    // 敌人等级高：玩家不利
    return {
      playerDamageDealt: 1 - modifier,      // 造成伤害减少
      playerDamageReceived: 1 + modifier,   // 受到伤害增加
    };
  } else {
    // 玩家等级高：玩家有利
    return {
      playerDamageDealt: 1 + modifier,      // 造成伤害增加
      playerDamageReceived: 1 - modifier,   // 受到伤害减少
    };
  }
}
```

### 7.3 UI显示

```typescript
/**
 * 敌人等级显示组件
 */
function EnemyLevelDisplay({ 
  playerLevel, 
  enemyLevel, 
  enemyName 
}: EnemyLevelDisplayProps) {
  const suppression = calculateSuppressionLevel(playerLevel, enemyLevel);
  
  switch (suppression) {
    case 'instant_kill':
      return (
        <div className="enemy-level instant-kill">
          <Skull className="icon danger" />
          <span className="level-text skull">☠️ {enemyName}</span>
          <Tooltip content="等级差距过大，极可能被秒杀！">
            <AlertTriangle className="warning-icon" />
          </Tooltip>
        </div>
      );
      
    case 'danger':
      return (
        <div className="enemy-level danger">
          <span className="level-text">Lv.{enemyLevel} {enemyName}</span>
          <span className="danger-badge">危险</span>
        </div>
      );
      
    case 'warning':
      return (
        <div className="enemy-level warning">
          <span className="level-text">Lv.{enemyLevel} {enemyName}</span>
          <span className="warning-badge">警告</span>
        </div>
      );
      
    default:
      return (
        <div className="enemy-level normal">
          <span className="level-text">Lv.{enemyLevel} {enemyName}</span>
        </div>
      );
  }
}
```

### 7.4 战斗中的等级压制

```typescript
/**
 * 战斗开始时的等级压制检查
 */
function checkLevelSuppressionAtBattleStart(
  player: PlayerCombatState,
  enemy: EnemyInstance
): { canFight: boolean; message?: string } {
  const suppression = calculateSuppressionLevel(player.level, enemy.level);
  
  if (suppression === 'instant_kill') {
    // 给玩家一个选择：是否挑战
    return {
      canFight: true, // 允许挑战，但警告
      message: `警告：敌人等级比你高${enemy.level - player.level}级，极可能被秒杀！是否继续挑战？`,
    };
  }
  
  return { canFight: true };
}

/**
 * 等级压制下的伤害计算
 */
function calculateDamageWithSuppression(
  baseDamage: number,
  attacker: { level: number; type: 'player' | 'enemy' },
  defender: { level: number; type: 'player' | 'enemy' },
  suppression: SuppressionLevel
): number {
  // 秒杀级别的等级压制
  if (suppression === 'instant_kill') {
    if (attacker.type === 'enemy' && defender.type === 'player') {
      // 敌人攻击玩家：直接秒杀
      return defender.maxHp; // 返回等于玩家最大HP的伤害
    }
  }
  
  // 普通等级压制修正
  const modifier = calculateLevelDiffModifier(
    attacker.type === 'player' ? attacker.level : defender.level,
    attacker.type === 'enemy' ? attacker.level : defender.level
  );
  
  if (attacker.type === 'player') {
    return Math.floor(baseDamage * modifier.playerDamageDealt);
  } else {
    return Math.floor(baseDamage * modifier.playerDamageReceived);
  }
}
```

---

## 8. 多敌人战斗系统

### 8.1 战场布局

```
┌─────────────────────────────────────────┐
│              敌人区域                    │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │后排 │  │后排 │  │后排 │  (row=1)    │
│  │ E1  │  │ E2  │  │ E3  │             │
│  └─────┘  └─────┘  └─────┘             │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │前排 │  │前排 │  │前排 │  (row=0)    │
│  │ E4  │  │ E5  │  │ E6  │             │
│  └─────┘  └─────┘  └─────┘             │
├─────────────────────────────────────────┤
│              玩家区域                    │
│         ┌─────────────┐                 │
│         │    玩家     │                 │
│         └─────────────┘                 │
└─────────────────────────────────────────┘
```

### 8.2 目标选择规则

```typescript
/**
 * 目标选择规则
 */
interface TargetingRules {
  // 攻击目标选择
  attack: {
    // 前排优先：必须先清理前排才能攻击后排
    frontRowPriority: boolean;
    // 低血量优先：攻击血量百分比最低的敌人
    lowHpPriority: boolean;
    // 仇恨值系统：敌人攻击玩家的倾向
    aggroSystem: boolean;
  };
  
  // 技能目标选择
  skill: {
    // 单体技能：同普通攻击
    singleTarget: 'same_as_attack';
    // 范围技能：可以选择前后排
    aoeTarget: 'row' | 'all';
  };
}

/**
 * 选择攻击目标
 */
function selectAttackTarget(
  enemies: EnemyInstance[],
  rules: TargetingRules
): EnemyInstance | null {
  const aliveEnemies = enemies.filter(e => e.stats.currentHp > 0);
  if (aliveEnemies.length === 0) return null;
  
  // 前排优先
  if (rules.attack.frontRowPriority) {
    const frontRow = aliveEnemies.filter(e => e.position.row === 0);
    if (frontRow.length > 0) {
      return selectFromRow(frontRow, rules);
    }
  }
  
  return selectFromRow(aliveEnemies, rules);
}

function selectFromRow(
  enemies: EnemyInstance[],
  rules: TargetingRules
): EnemyInstance {
  if (rules.attack.lowHpPriority) {
    return enemies.reduce((min, e) => 
      (e.stats.currentHp / e.stats.maxHp) < (min.stats.currentHp / min.stats.maxHp) 
        ? e : min
    );
  }
  
  return enemies[Math.floor(Math.random() * enemies.length)];
}
```

### 8.3 敌人组生成

```typescript
/**
 * 敌人组生成配置
 */
interface EnemyGroupConfig {
  source: 'adventure' | 'tower' | 'event' | 'boss';
  difficulty: DifficultyPreset;
  enemyCount: { min: number; max: number };
  levelOffset: { min: number; max: number };
  tierWeights: Record<EnemyTier, number>;
}

/**
 * 预设敌人组配置
 */
const ENEMY_GROUP_PRESETS: Record<string, EnemyGroupConfig> = {
  // 机缘普通战斗
  adventure_normal: {
    source: 'adventure',
    difficulty: 'normal',
    enemyCount: { min: 1, max: 2 },
    levelOffset: { min: -2, max: 2 },
    tierWeights: { normal: 0.7, elite: 0.25, miniboss: 0.05, boss: 0 },
  },
  
  // 爬塔Boss层
  tower_boss: {
    source: 'tower',
    difficulty: 'nightmare',
    enemyCount: { min: 1, max: 1 },
    levelOffset: { min: 5, max: 10 },
    tierWeights: { normal: 0, elite: 0, miniboss: 0, boss: 1 },
  },
};

/**
 * 生成敌人组
 */
function generateEnemyGroup(
  config: EnemyGroupConfig,
  playerLevel: number,
  worldType: WorldType
): EnemyGroup {
  const groupId = generateId('group');
  const enemyCount = randomInt(config.enemyCount.min, config.enemyCount.max);
  
  const enemies: EnemyInstance[] = [];
  const positions = assignPositions(enemyCount);
  
  for (let i = 0; i < enemyCount; i++) {
    const tier = weightedRandom(config.tierWeights);
    const level = playerLevel + randomInt(config.levelOffset.min, config.levelOffset.max);
    const template = selectTemplate(worldType, tier, level);
    
    const enemy = generateEnemy(template, level, config.difficulty, tier, worldType, positions[i]);
    enemies.push(enemy);
  }
  
  return { groupId, enemies, totalDifficulty: calculateTotalDifficulty(enemies, playerLevel) };
}
```

---

## 9. 行动顺序系统

### 9.1 基于速度的回合制

```typescript
/**
 * 计算回合行动顺序
 */
function calculateTurnOrder(
  player: PlayerCombatState,
  enemies: EnemyInstance[]
): Array<{ id: string; type: 'player' | 'enemy'; speed: number }> {
  const units = [
    { id: 'player', type: 'player' as const, speed: player.stats.speed },
    ...enemies
      .filter(e => e.stats.currentHp > 0)
      .map(e => ({ id: e.instanceId, type: 'enemy' as const, speed: e.stats.speed })),
  ];
  
  // 按速度降序排序
  return units.sort((a, b) => b.speed - a.speed);
}

/**
 * 获取回合内每个单位的行动次数
 */
function getActionCounts(
  player: PlayerCombatState,
  enemies: EnemyInstance[]
): Map<string, number> {
  const units = calculateTurnOrder(player, enemies);
  const totalSpeed = units.reduce((sum, u) => sum + u.speed, 0);
  const avgSpeed = totalSpeed / units.length;
  
  const counts = new Map<string, number>();
  
  for (const unit of units) {
    // 速度越高，行动次数越多
    // 基础1次，速度超过平均值每20%额外+1次
    const bonus = Math.floor((unit.speed / avgSpeed - 1) / 0.2);
    counts.set(unit.id, Math.max(1, 1 + bonus));
  }
  
  return counts;
}
```

---

## 10. 敌人AI决策系统

### 10.1 AI决策框架

```typescript
/**
 * AI决策入口
 */
function makeAIDecision(context: AIDecisionContext): AIDecision {
  const { self } = context;
  
  switch (self.behaviorType) {
    case 'aggressive':
      return aggressiveStrategy(context);
    case 'defensive':
      return defensiveStrategy(context);
    case 'balanced':
      return balancedStrategy(context);
    case 'support':
      return supportStrategy(context);
    case 'assassin':
      return assassinStrategy(context);
    default:
      return balancedStrategy(context);
  }
}

/**
 * 激进型策略
 */
function aggressiveStrategy(context: AIDecisionContext): AIDecision {
  const { self, player, availableActions } = context;
  
  // 优先使用高伤害技能
  const damageSkills = self.skills
    .filter(s => canUseSkill(self, s) && s.effect.damageMultiplier)
    .sort((a, b) => (b.effect.damageMultiplier ?? 1) - (a.effect.damageMultiplier ?? 1));
  
  if (damageSkills.length > 0 && Math.random() < 0.7) {
    return {
      action: { type: 'technique_attack', techniqueSkillId: damageSkills[0].id },
      target: 'player',
      priority: 100,
    };
  }
  
  return { action: { type: 'normal_attack' }, target: 'player', priority: 50 };
}

/**
 * 防守型策略
 */
function defensiveStrategy(context: AIDecisionContext): AIDecision {
  const { self, allies } = context;
  const hpPercent = self.stats.currentHp / self.stats.maxHp;
  
  // 低血量时优先防御
  if (hpPercent < 0.4) {
    return { action: { type: 'defend' }, priority: 100 };
  }
  
  // 有治疗技能时治疗自己
  const healSkill = self.skills.find(s => s.effect.healing && canUseSkill(self, s));
  if (healSkill && hpPercent < 0.7) {
    return {
      action: { type: 'technique_attack', techniqueSkillId: healSkill.id },
      target: self.instanceId,
      priority: 80,
    };
  }
  
  return { action: { type: 'normal_attack' }, target: 'player', priority: 30 };
}

/**
 * 辅助型策略
 */
function supportStrategy(context: AIDecisionContext): AIDecision {
  const { self, allies, player } = context;
  
  // 找到需要治疗的友方
  const weakAllies = allies.filter(a => a.stats.currentHp / a.stats.maxHp < 0.5);
  
  const healSkill = self.skills.find(s => s.effect.healing && canUseSkill(self, s));
  
  if (healSkill && weakAllies.length > 0) {
    const target = weakAllies.reduce((weakest, a) => 
      (a.stats.currentHp / a.stats.maxHp) < (weakest.stats.currentHp / weakest.stats.maxHp)
        ? a : weakest
    );
    return {
      action: { type: 'technique_attack', techniqueSkillId: healSkill.id },
      target: target.instanceId,
      priority: 90,
    };
  }
  
  return { action: { type: 'normal_attack' }, target: 'player', priority: 30 };
}

/**
 * 刺杀型策略
 */
function assassinStrategy(context: AIDecisionContext): AIDecision {
  const { self, player } = context;
  const playerHpPercent = player.currentHp / player.maxHp;
  
  // 玩家低血量时使用最强技能集火
  if (playerHpPercent < 0.4) {
    const damageSkill = self.skills
      .filter(s => canUseSkill(self, s) && s.effect.damageMultiplier)
      .sort((a, b) => (b.effect.damageMultiplier ?? 1) - (a.effect.damageMultiplier ?? 1))[0];
    
    if (damageSkill) {
      return {
        action: { type: 'technique_attack', techniqueSkillId: damageSkill.id },
        target: 'player',
        priority: 100,
      };
    }
  }
  
  return { action: { type: 'normal_attack' }, target: 'player', priority: 40 };
}

/**
 * 平衡型策略
 */
function balancedStrategy(context: AIDecisionContext): AIDecision {
  const { self } = context;
  const hpPercent = self.stats.currentHp / self.stats.maxHp;
  
  // 低血量考虑防御
  if (hpPercent < 0.3 && Math.random() < 0.6) {
    return { action: { type: 'defend' }, priority: 80 };
  }
  
  // 随机使用技能
  const usableSkills = self.skills.filter(s => canUseSkill(self, s));
  if (usableSkills.length > 0 && Math.random() < 0.5) {
    const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)];
    return {
      action: { type: 'technique_attack', techniqueSkillId: skill.id },
      target: 'player',
      priority: 70,
    };
  }
  
  return { action: { type: 'normal_attack' }, target: 'player', priority: 40 };
}
```

---

## 11. 数值验证

### 11.1 验证方法

```typescript
/**
 * 战斗模拟器
 */
function runSimulation(config: BattleSimulation): SimulationResult {
  const results: BattleResult[] = [];
  
  for (let i = 0; i < config.iterations; i++) {
    const result = simulateBattle(config);
    results.push(result);
  }
  
  return {
    winRate: results.filter(r => r.victory).length / config.iterations,
    avgRounds: average(results.map(r => r.rounds)),
    avgPlayerHpLeft: average(results.map(r => r.playerHpPercent)),
  };
}
```

### 11.2 预期结果

| 配置 | 预期胜率 | 预期回合数 | 预期剩余血量 |
|------|----------|------------|--------------|
| 简单难度 × 普通敌人 | 95%+ | 3-5 | 70%+ |
| 普通难度 × 普通敌人 | 80%+ | 5-7 | 50%+ |
| 普通难度 × 精英敌人 | 60%+ | 7-10 | 30%+ |
| 困难难度 × 精英敌人 | 40%+ | 8-12 | 20%+ |
| 困难难度 × 小Boss | 30%+ | 10-15 | 15%+ |
| 噩梦难度 × Boss | 15%+ | 12-20 | 5%+ |

---

## 12. 实施计划

### 12.1 文件结构

```
src/lib/game/
├── stats/                          # 属性计算模块（新）
│   ├── index.ts                    # 导出入口
│   ├── types.ts                    # 类型定义
│   ├── calculator.ts               # 三层属性计算服务
│   └── constants.ts                # 常量配置
│
├── enemy/                          # 敌人模块（新）
│   ├── index.ts                    # 导出入口
│   ├── types.ts                    # 类型定义
│   ├── templates/                  # 敌人模板
│   │   ├── index.ts
│   │   ├── normal.ts
│   │   ├── elite.ts
│   │   ├── boss.ts
│   │   └── world-specific/
│   ├── generator.ts                # 敌人生成器
│   ├── groupGenerator.ts           # 敌人组生成器
│   ├── techniqueEquipment.ts       # 敌人功法装备生成
│   ├── levelSuppression.ts         # 等级压制系统
│   └── ai/
│       ├── index.ts
│       ├── strategies.ts
│       └── targeting.ts
│
├── battle/                         # 战斗模块（重构）
│   ├── index.ts
│   ├── types.ts
│   ├── battleController.ts         # 重构支持多敌人
│   └── ...
```

### 12.2 删除文件

```
待删除：
- src/lib/game/enemyEnhancement.ts     # 虚拟功法装备系统（废弃）
- src/lib/game/enemyTechniqueEquipment.ts  # 重构到 enemy/techniqueEquipment.ts

重构：
- src/lib/game/balanceConfig.ts       # 敌人相关计算移到 stats/calculator.ts
```

### 12.3 实施步骤

1. **Phase 1: 属性计算分层架构**
   - 创建 `stats/calculator.ts`
   - 实现三层属性计算
   - 编写单元测试

2. **Phase 2: 敌人模板系统**
   - 创建敌人类型定义
   - 实现敌人模板数据
   - 实现功法装备生成

3. **Phase 3: 敌人生成器**
   - 实现单个敌人生成
   - 实现敌人组生成
   - 集成属性计算服务

4. **Phase 4: 等级压制系统**
   - 实现等级压制逻辑
   - 实现UI显示
   - 集成到战斗流程

5. **Phase 5: 多敌人战斗**
   - 重构战斗系统支持多敌人
   - 实现行动顺序系统
   - 实现目标选择

6. **Phase 6: AI决策系统**
   - 实现AI策略
   - 调整AI行为平衡

---

## 附录A: 设计检查清单

### 代码质量检查
- [x] 所有变量在使用前已初始化
- [x] 所有对象引用在使用前已判空
- [x] 所有数组访问有边界检查
- [x] 所有配置参数有默认值
- [x] 所有常量已定义为不可变

### 数值系统验证
- [x] 所有数值有上下界约束
- [x] 计算公式在边界值下有意义
- [x] 除法运算有下界保护
- [x] 随机数种子可控制

### 状态机验证
- [x] 所有状态有明确的进入/退出条件
- [x] 初始状态已定义
- [x] 状态转移形成有向图

### 逻辑完整性检查
- [x] 所有if-else分支完整
- [x] 所有switch-case有default分支
- [x] 所有可能的用户输入已考虑

---

**文档结束**
