# 功法与武器技能系统重构设计

> 根据 game-design-strict 规范设计，实现功法技能（法技）和武器技巧（斗技）系统

## 一、设计目标

### 1.1 核心目标
- **功法多样化**：功法拥有元素属性 + 契合武器，提高搭配策略性
- **武器多样化**：武器拥有武器类型 + 契合元素，与功法形成双向配合
- **技能系统**：功法解锁法技，武器解锁斗技，丰富战斗选择
- **收集系统**：残本合成功法，残片重铸装备，提供长期目标

### 1.2 设计原则
1. **零容忍红线**：所有数值必须有上下界约束，状态机必须完整
2. **边界条件**：空值、零值、最大值、非法输入必须有防御处理
3. **状态完整性**：覆盖所有状态转换路径，无遗漏分支
4. **流程可达性**：所有内容可被触发、执行、完成

### 1.3 兼容性说明
- **新功能优先**：新系统与老代码冲突时，以新功能为准
- **老代码删除**：不再兼容旧的功法/装备生成逻辑
- **数据迁移**：提供旧存档数据迁移方案

---

## 二、功法系统重构

### 2.1 功法数据结构

```typescript
/** 功法类型 */
export type TechniqueType = 'attack' | 'defense';

/** 功法稀有度 */
export type TechniqueRarity = '普通' | '稀有' | '史诗' | '传说' | '神话';

/** 功法技能（法技） */
export interface TechniqueSkill {
  /** 技能ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 解锁等级（功法等级达到此值解锁） */
  unlockLevel: number;
  /** 法力消耗 */
  mpCost: number;
  /** 冷却回合数 */
  cooldown: number;
  /** 技能效果 */
  effects: SkillEffect[];
  /** 技能标签 */
  tags: SkillTag[];
}

/** 技能效果 */
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon' | 'special';
  /** 基础数值 */
  baseValue: number;
  /** 属性加成系数 */
  statScaling: number;
  /** 目标类型 */
  target: 'self' | 'single' | 'all' | 'random';
  /** 持续回合（buff/debuff） */
  duration?: number;
}

/** 技能标签 */
export type SkillTag = 
  | 'instant'      // 瞬发
  | 'channeling'   // 引导
  | 'aoe'          // 范围
  | 'dot'          // 持续伤害
  | 'hot'          // 持续治疗
  | 'shield'       // 护盾
  | 'lifesteal'    // 吸血
  | 'execute'      // 斩杀
  | 'combo'        // 连击
  | 'counter';     // 反击

/** 功法定义（重构版） */
export interface Technique {
  // ========== 基础属性 ==========
  id: string;
  name: string;
  type: TechniqueType;
  rarity: TechniqueRarity;
  description: string;
  
  // ========== 等级系统 ==========
  /** 功法等级（1-10） */
  level: number;
  /** 当前经验值 */
  exp: number;
  /** 升级所需经验 */
  expToNext: number;
  /** 最大等级（按稀有度不同：普通5/稀有7/史诗8/传说9/神话10） */
  maxLevel: number;
  
  // ========== 元素属性 ==========
  /** 主元素属性（必有） */
  element: Element;
  /** 副元素属性（稀有及以上可能拥有） */
  subElement?: Element;
  
  // ========== 武器契合 ==========
  /** 契合武器类型（装备此类武器时获得加成） */
  compatibleWeapon: WeaponCategory | null;
  /** 契合加成百分比 */
  compatibleBonus: number;
  
  // ========== 基础数值 ==========
  /** 基础威力 */
  power: number;
  /** 加成百分比 */
  bonus: number;
  /** 基础法力消耗 */
  baseMpCost: number;
  
  // ========== 法技系统 ==========
  /** 已解锁的技能槽位数量 */
  skillSlots: number;
  /** 最大技能槽位数量 */
  maxSkillSlots: number;
  /** 全部可解锁技能 */
  allSkills: TechniqueSkill[];
  /** 当前装备的技能ID列表 */
  equippedSkills: string[];
  
  // ========== 来源信息 ==========
  /** 世界类型（可选） */
  worldType?: WorldType;
  /** 来源（掉落/合成/任务） */
  source: 'drop' | 'synthesis' | 'quest' | 'initial';
  
  // ========== 残本系统 ==========
  /** 是否为残本 */
  isFragment: boolean;
  /** 残本序号（1-N） */
  fragmentIndex?: number;
  /** 完本所需残本数量 */
  fragmentsRequired?: number;
  /** 关联的残本ID列表 */
  relatedFragmentIds?: string[];
}
```

### 2.2 功法等级与解锁机制

> **设计理念**：功法等级是功法自身的等级，独立于主角等级。功法通过战斗获得经验升级，因此满级不宜过高，让玩家有成就感。

```
┌─────────────────────────────────────────────────────────────────┐
│                    功法等级解锁系统（10级制）                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   等级 1    基础属性生效                                         │
│      │      解锁第1个技能槽位                                    │
│      │      解锁第1个法技（可装备）                              │
│      ▼                                                          │
│   等级 2    属性+10%                                             │
│      │      解锁第2个技能槽位（稀有及以上）                       │
│      │      解锁第2个法技                                        │
│      ▼                                                          │
│   等级 3    属性+20%                                             │
│      │      解锁第3个技能槽位（史诗及以上）                       │
│      │      解锁第3个法技                                        │
│      ▼                                                          │
│   等级 4    属性+30%                                             │
│      │      解锁第4个技能槽位（传说及以上）                       │
│      │      解锁第4个法技                                        │
│      ▼                                                          │
│   等级 5    属性+40%（普通功法满级）                              │
│      │      解锁第5个技能槽位（神话专属）                         │
│      │      解锁第5个法技                                        │
│      ▼                                                          │
│   等级 6    属性+50%（稀有功法继续）                              │
│      ▼                                                          │
│   等级 7    属性+60%（稀有功法满级）                              │
│      ▼                                                          │
│   等级 8    属性+70%（史诗功法满级）                              │
│      ▼                                                          │
│   等级 9    属性+80%（传说功法满级）                              │
│      ▼                                                          │
│   等级 10   属性+100%（神话功法满级）                             │
│             解锁终极法技（神话专属）                              │
│                                                                 │
│   【按稀有度的最大等级】                                         │
│   ├─ 普通: 最大5级，2个技能槽，1-2个法技                         │
│   ├─ 稀有: 最大7级，3个技能槽，2-3个法技                         │
│   ├─ 史诗: 最大8级，4个技能槽，3-4个法技                         │
│   ├─ 传说: 最大9级，5个技能槽，4-5个法技                         │
│   └─ 神话: 最大10级，6个技能槽，5-6个法技（含终极法技）           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 法技设计规范

#### 法技类型与效果

| 类型 | 效果 | 数值范围 | 冷却 |
|------|------|----------|------|
| damage | 造成伤害 | 基础×(1~3) | 0-3回合 |
| heal | 恢复生命 | 基础×(0.5~2) | 2-4回合 |
| buff | 增益效果 | 属性+10%~50% | 3-5回合 |
| debuff | 减益效果 | 属性-10%~30% | 3-5回合 |
| shield | 护盾 | 最大HP×(10%~40%) | 4-6回合 |
| special | 特殊效果 | 按效果定义 | 按效果定义 |

#### 法技稀有度分布

```
普通功法：1-2个法技
稀有功法：2-3个法技
史诗功法：3-4个法技
传说功法：4-5个法技
神话功法：5-6个法技（含终极法技）
```

### 2.4 功法残本系统

#### 残本掉落规则

```typescript
/** 敌人掉落残本配置 */
export const FRAGMENT_DROP_CONFIG: Record<EnemyTier, {
  dropRate: number;        // 掉落概率
  minFragments: number;    // 最小掉落数
  maxFragments: number;    // 最大掉落数
}> = {
  normal:   { dropRate: 0.02, minFragments: 1, maxFragments: 1 },
  elite:    { dropRate: 0.08, minFragments: 1, maxFragments: 2 },
  miniboss: { dropRate: 0.20, minFragments: 2, maxFragments: 3 },
  boss:     { dropRate: 0.50, minFragments: 3, maxFragments: 5 },
};
```

#### 残本合成规则

```
┌────────────────────────────────────────────────────────────────┐
│                     残本合成系统                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  残本类型          合成数量          产出品质                   │
│  ────────────────────────────────────────────────────────────  │
│  普通残本          3本               普通功法（完本）           │
│  稀有残本          4本               稀有功法（完本）           │
│  史诗残本          5本               史诗功法（完本）           │
│  传说残本          7本               传说功法（完本）           │
│  神话残本          10本              神话功法（完本）           │
│                                                                │
│  特殊规则：                                                     │
│  - 残本必须是同一功法的不同部分（残本序号不同）                 │
│  - 集齐所有残本后可合成完本                                     │
│  - 完本功法初始等级为1，但保留所有技能解锁路径                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 三、武器系统重构

### 3.1 武器数据结构

```typescript
/** 武器槽位 */
export type EquipmentSlot = 'melee' | 'ranged' | 'head' | 'body' | 'legs' | 'feet';

/** 武器稀有度 */
export type EquipmentRarity = '普通' | '稀有' | '史诗' | '传说' | '神话';

/** 武器技巧（斗技） */
export interface WeaponTechnique {
  /** 技巧ID */
  id: string;
  /** 技巧名称 */
  name: string;
  /** 技巧描述 */
  description: string;
  /** 解锁等级（武器等级达到此值解锁） */
  unlockLevel: number;
  /** 触发条件 */
  trigger: TechniqueTrigger;
  /** 效果 */
  effects: TechniqueEffect[];
}

/** 技巧触发条件 */
export interface TechniqueTrigger {
  type: 'on_attack' | 'on_hit' | 'on_kill' | 'on_crit' | 'passive' | 'active';
  chance?: number; // 触发概率
  cooldown?: number; // 冷却回合
}

/** 技巧效果 */
export interface TechniqueEffect {
  type: 'damage_bonus' | 'crit_bonus' | 'lifesteal' | 'element_damage' | 'special';
  value: number;
  element?: Element;
}

/** 武器定义（重构版） */
export interface Equipment {
  // ========== 基础属性 ==========
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  description: string;
  
  // ========== 等级系统 ==========
  /** 武器等级（1-10） */
  level: number;
  /** 当前经验值 */
  exp: number;
  /** 升级所需经验 */
  expToNext: number;
  /** 最大等级（按稀有度不同：普通5/稀有7/史诗8/传说9/神话10） */
  maxLevel: number;
  
  // ========== 武器类型 ==========
  /** 武器类别（仅武器类装备有） */
  weaponCategory: WeaponCategory | null;
  
  // ========== 元素契合 ==========
  /** 主元素属性（武器可拥有元素） */
  element: Element | null;
  /** 契合元素类型（使用此元素功法时获得加成） */
  compatibleElement: Element | null;
  /** 契合加成百分比 */
  compatibleBonus: number;
  
  // ========== 基础数值 ==========
  /** 攻击加成 */
  attackBonus: number;
  /** 防御加成 */
  defenseBonus: number;
  /** 基础威力 */
  power: number;
  
  // ========== 斗技系统 ==========
  /** 已解锁的技巧槽位数量 */
  techniqueSlots: number;
  /** 最大技巧槽位数量 */
  maxTechniqueSlots: number;
  /** 全部可解锁技巧 */
  allTechniques: WeaponTechnique[];
  /** 当前装备的技巧ID列表 */
  equippedTechniques: string[];
  
  // ========== 来源信息 ==========
  /** 世界类型（可选） */
  worldType?: WorldType;
  /** 来源（掉落/重铸/任务） */
  source: 'drop' | 'reforge' | 'quest' | 'initial';
  
  // ========== 残片系统 ==========
  /** 是否为残片 */
  isFragment: boolean;
  /** 残片序号（1-N） */
  fragmentIndex?: number;
  /** 重铸所需残片数量 */
  fragmentsRequired?: number;
}
```

### 3.2 武器等级与解锁机制

> **设计理念**：武器等级是武器自身的等级，独立于主角等级。武器通过战斗获得经验升级，因此满级不宜过高，让玩家有成就感。

```
┌─────────────────────────────────────────────────────────────────┐
│                    武器等级解锁系统（10级制）                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   等级 1    基础属性生效                                         │
│      │      解锁第1个技巧槽位                                    │
│      │      解锁第1个斗技（可装备）                              │
│      ▼                                                          │
│   等级 2    属性+10%                                             │
│      │      解锁第2个技巧槽位（稀有及以上）                       │
│      │      解锁第2个斗技                                        │
│      ▼                                                          │
│   等级 3    属性+20%                                             │
│      │      解锁第3个技巧槽位（史诗及以上）                       │
│      │      解锁第3个斗技                                        │
│      ▼                                                          │
│   等级 4    属性+30%                                             │
│      │      解锁第4个技巧槽位（传说及以上）                       │
│      │      解锁第4个斗技                                        │
│      ▼                                                          │
│   等级 5    属性+40%（普通武器满级）                              │
│      │      解锁第5个技巧槽位（神话专属）                         │
│      │      解锁第5个斗技                                        │
│      ▼                                                          │
│   等级 6    属性+50%（稀有武器继续）                              │
│      ▼                                                          │
│   等级 7    属性+60%（稀有武器满级）                              │
│      ▼                                                          │
│   等级 8    属性+70%（史诗武器满级）                              │
│      ▼                                                          │
│   等级 9    属性+80%（传说武器满级）                              │
│      ▼                                                          │
│   等级 10   属性+100%（神话武器满级）                             │
│             解锁终极斗技（神话专属）                              │
│                                                                 │
│   【按稀有度的最大等级】                                         │
│   ├─ 普通: 最大5级，2个技巧槽，1-2个斗技                         │
│   ├─ 稀有: 最大7级，3个技巧槽，2-3个斗技                         │
│   ├─ 史诗: 最大8级，4个技巧槽，3-4个斗技                         │
│   ├─ 传说: 最大9级，5个技巧槽，4-5个斗技                         │
│   └─ 神话: 最大10级，6个技巧槽，5-6个斗技（含终极斗技）           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 斗技设计规范

#### 斗技类型与效果

| 类型 | 触发条件 | 效果 | 数值范围 |
|------|----------|------|----------|
| damage_bonus | 攻击时 | 伤害加成 | +5%~+30% |
| crit_bonus | 攻击时 | 暴击加成 | +5%~+25% |
| lifesteal | 造成伤害 | 吸血 | 5%~20% |
| element_damage | 攻击时 | 附加元素伤害 | 基础×(10%~50%) |
| on_kill | 击杀时 | 恢复/增益 | 按效果定义 |
| passive | 永久 | 被动效果 | 按效果定义 |

#### 斗技稀有度分布

```
普通武器：1-2个斗技
稀有武器：2-3个斗技
史诗武器：3-4个斗技
传说武器：4-5个斗技
神话武器：5-6个斗技（含终极斗技）
```

### 3.4 武器残片系统

#### 残片掉落规则

```typescript
/** 敌人掉落残片配置 */
export const SHARD_DROP_CONFIG: Record<EnemyTier, {
  dropRate: number;        // 掉落概率
  minShards: number;       // 最小掉落数
  maxShards: number;       // 最大掉落数
}> = {
  normal:   { dropRate: 0.03, minShards: 1, maxShards: 1 },
  elite:    { dropRate: 0.10, minShards: 1, maxShards: 2 },
  miniboss: { dropRate: 0.25, minShards: 2, maxShards: 3 },
  boss:     { dropRate: 0.60, minShards: 3, maxShards: 5 },
};
```

#### 残片重铸规则

```
┌────────────────────────────────────────────────────────────────┐
│                     残片重铸系统                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  残片类型          重铸数量          产出品质                   │
│  ────────────────────────────────────────────────────────────  │
│  普通残片          5片               普通武器（完整）           │
│  稀有残片          7片               稀有武器（完整）           │
│  史诗残片          10片              史诗武器（完整）           │
│  传说残片          15片              传说武器（完整）           │
│  神话残片          20片              神话武器（完整）           │
│                                                                │
│  特殊规则：                                                     │
│  - 残片可以是同一武器的不同部分，也可以是同类型武器的残片       │
│  - 同类型残片重铸时有概率获得更高质量                           │
│  - 重铸武器初始等级为1，但保留所有斗技解锁路径                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 四、契合系统设计

### 4.1 功法-武器契合

```
┌────────────────────────────────────────────────────────────────┐
│                   功法-武器契合系统                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  功法                           武器                           │
│  ┌─────────────────┐           ┌─────────────────┐            │
│  │ 元素: 火        │           │ 类型: 剑        │            │
│  │ 契合武器: 剑    │◄─────────►│ 契合元素: 火    │            │
│  │                 │  双向契合  │                 │            │
│  └─────────────────┘           └─────────────────┘            │
│                                                                │
│  契合效果：                                                     │
│  ├─ 功法契合武器：装备指定类型武器时，功法威力+15%              │
│  ├─ 武器契合元素：使用指定元素功法时，伤害+15%                  │
│  └─ 双向契合：同时满足时，额外+10%（总计+40%）                  │
│                                                                │
│  示例：                                                         │
│  《烈焰剑诀》                                                   │
│  ├─ 元素: 火                                                    │
│  ├─ 契合武器: 剑                                                │
│  └─ 效果: 装备剑类武器时，火属性技能威力+15%                    │
│                                                                │
│  《烈焰长剑》                                                   │
│  ├─ 类型: 剑                                                    │
│  ├─ 契合元素: 火                                                │
│  └─ 效果: 使用火属性功法时，伤害+15%                            │
│                                                                │
│  同时装备时：                                                   │
│  ├─ 功法加成: +15%（契合武器）                                  │
│  ├─ 武器加成: +15%（契合元素）                                  │
│  └─ 双向加成: +10%                                              │
│  总计: +40%                                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 契合计算公式

```typescript
/**
 * 计算契合加成
 */
export function calculateCompatibilityBonus(
  technique: Technique,
  weapon: Equipment | null
): {
  techniqueBonus: number;  // 功法加成
  weaponBonus: number;     // 武器加成
  dualBonus: number;       // 双向加成
  total: number;           // 总加成
} {
  let techniqueBonus = 0;
  let weaponBonus = 0;
  let dualBonus = 0;
  
  if (weapon) {
    // 功法契合武器检查
    if (technique.compatibleWeapon && weapon.weaponCategory === technique.compatibleWeapon) {
      techniqueBonus = technique.compatibleBonus;
    }
    
    // 武器契合元素检查
    if (weapon.compatibleElement && technique.element === weapon.compatibleElement) {
      weaponBonus = weapon.compatibleBonus;
    }
    
    // 双向契合检查
    if (techniqueBonus > 0 && weaponBonus > 0) {
      dualBonus = 0.10; // 额外10%
    }
  }
  
  return {
    techniqueBonus,
    weaponBonus,
    dualBonus,
    total: techniqueBonus + weaponBonus + dualBonus,
  };
}
```

---

## 五、法技与斗技装备管理系统

> **核心设计理念**：技能解锁 ≠ 技能可用。玩家需要将已解锁的技能装备到有限槽位中，才能在战斗中使用。这增加了策略深度和资源管理维度。

### 5.1 装备系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                  技能装备管理核心逻辑                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   功法/武器                                                     │
│   ┌─────────────────────────────────────────────────────┐       │
│   │ 全部可解锁技能 (allSkills)                           │       │
│   │ ├─ 技能A (等级1解锁)  ✓ 已解锁                       │       │
│   │ ├─ 技能B (等级2解锁)  ✓ 已解锁                       │       │
│   │ ├─ 技能C (等级3解锁)  ✗ 未解锁（功法等级不足）       │       │
│   │ └─ 技能D (等级5解锁)  ✗ 未解锁                       │       │
│   └─────────────────────────────────────────────────────┘       │
│                         │                                       │
│                         ▼                                       │
│   ┌─────────────────────────────────────────────────────┐       │
│   │ 已解锁技能池 (unlockedSkills)                        │       │
│   │ └─ 玩家可从中选择的技能列表                          │       │
│   └─────────────────────────────────────────────────────┘       │
│                         │                                       │
│                         ▼ 装备操作                              │
│   ┌─────────────────────────────────────────────────────┐       │
│   │ 技能槽位 (skillSlots)                                │       │
│   │ ├─ 槽位1: [技能A] ← 已装备                           │       │
│   │ ├─ 槽位2: [技能B] ← 已装备                           │       │
│   │ └─ 槽位3: [空]   ← 可装备                            │       │
│   └─────────────────────────────────────────────────────┘       │
│                         │                                       │
│                         ▼ 战斗可用                              │
│   ┌─────────────────────────────────────────────────────┐       │
│   │ 装备技能 (equippedSkills)                            │       │
│   │ └─ 只有装备的技能才能在战斗中使用                     │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 技能槽位规则

#### 5.2.1 槽位数量

| 稀有度 | 槽位上限 | 解锁节奏 |
|--------|----------|----------|
| 普通 | 2个 | 等级1解锁全部 |
| 稀有 | 3个 | 等级1→2各解锁1个 |
| 史诗 | 4个 | 等级1→3各解锁1个 |
| 传说 | 5个 | 等级1→4各解锁1个 |
| 神话 | 6个 | 等级1→5各解锁1个 |

#### 5.2.2 槽位状态

```typescript
/** 技能槽位状态 */
export interface SkillSlot {
  /** 槽位索引（0开始） */
  index: number;
  /** 是否已解锁 */
  unlocked: boolean;
  /** 解锁所需功法/武器等级 */
  unlockLevel: number;
  /** 当前装备的技能ID（null表示空槽） */
  equippedSkillId: string | null;
}
```

### 5.3 装备/卸下操作

#### 5.3.1 装备技能

```typescript
/**
 * 装备技能到槽位
 * @param technique 功法对象
 * @param skillId 要装备的技能ID
 * @param slotIndex 目标槽位索引
 * @returns 操作结果
 */
export function equipSkill(
  technique: Technique,
  skillId: string,
  slotIndex: number
): EquipResult {
  // 边界检查
  if (slotIndex < 0 || slotIndex >= technique.maxSkillSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 槽位解锁检查
  if (slotIndex >= technique.skillSlots) {
    return { success: false, error: '该槽位尚未解锁' };
  }
  
  // 技能存在检查
  const skill = technique.allSkills.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, error: '技能不存在' };
  }
  
  // 技能解锁检查
  if (skill.unlockLevel > technique.level) {
    return { success: false, error: `需要功法等级${skill.unlockLevel}才能使用此技能` };
  }
  
  // 已装备检查（同一技能不可重复装备）
  if (technique.equippedSkills.includes(skillId)) {
    return { success: false, error: '该技能已在其他槽位装备' };
  }
  
  // 执行装备
  const newEquippedSkills = [...technique.equippedSkills];
  
  // 如果目标槽位已有技能，先卸下
  const existingSkillAtSlot = newEquippedSkills[slotIndex];
  if (existingSkillAtSlot) {
    // 交换到空槽位或直接替换
    const emptySlotIndex = newEquippedSkills.findIndex((id, idx) => id === null || idx === slotIndex);
    // 这里采用直接替换策略
  }
  
  newEquippedSkills[slotIndex] = skillId;
  technique.equippedSkills = newEquippedSkills.filter((id): id is string => id !== null);
  
  return { 
    success: true, 
    message: `已将【${skill.name}】装备到槽位${slotIndex + 1}` 
  };
}
```

#### 5.3.2 卸下技能

```typescript
/**
 * 从槽位卸下技能
 * @param technique 功法对象
 * @param slotIndex 要卸下的槽位索引
 * @returns 操作结果
 */
export function unequipSkill(
  technique: Technique,
  slotIndex: number
): EquipResult {
  // 边界检查
  if (slotIndex < 0 || slotIndex >= technique.skillSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 空槽检查
  const currentSkillId = technique.equippedSkills[slotIndex];
  if (!currentSkillId) {
    return { success: false, error: '该槽位为空' };
  }
  
  // 执行卸下
  const skill = technique.allSkills.find(s => s.id === currentSkillId);
  technique.equippedSkills[slotIndex] = null as any;
  technique.equippedSkills = technique.equippedSkills.filter((id): id is string => id !== null);
  
  return { 
    success: true, 
    message: `已将【${skill?.name || '技能'}】从槽位${slotIndex + 1}卸下` 
  };
}
```

#### 5.3.3 快捷装备（智能分配）

```typescript
/**
 * 快捷装备：自动将技能分配到最优槽位
 * @param technique 功法对象
 * @param skillId 要装备的技能ID
 * @returns 操作结果
 */
export function quickEquipSkill(
  technique: Technique,
  skillId: string
): EquipResult {
  // 检查技能有效性
  const skill = technique.allSkills.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, error: '技能不存在' };
  }
  
  if (skill.unlockLevel > technique.level) {
    return { success: false, error: `需要功法等级${skill.unlockLevel}` };
  }
  
  // 已装备检查
  if (technique.equippedSkills.includes(skillId)) {
    return { success: false, error: '该技能已装备' };
  }
  
  // 寻找空槽位
  for (let i = 0; i < technique.skillSlots; i++) {
    if (!technique.equippedSkills[i]) {
      return equipSkill(technique, skillId, i);
    }
  }
  
  // 无空槽位
  return { 
    success: false, 
    error: '所有槽位已满，请先卸下其他技能',
    hint: '可使用交换功能替换现有技能'
  };
}
```

#### 5.3.4 技能交换

```typescript
/**
 * 交换两个槽位的技能
 */
export function swapSkills(
  technique: Technique,
  slotIndex1: number,
  slotIndex2: number
): EquipResult {
  // 边界检查
  if (slotIndex1 < 0 || slotIndex1 >= technique.skillSlots ||
      slotIndex2 < 0 || slotIndex2 >= technique.skillSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 执行交换
  const temp = technique.equippedSkills[slotIndex1];
  technique.equippedSkills[slotIndex1] = technique.equippedSkills[slotIndex2];
  technique.equippedSkills[slotIndex2] = temp;
  
  return { success: true, message: '技能位置已交换' };
}
```

### 5.4 数据结构扩展

```typescript
/** 功法定义（扩展版） */
export interface Technique {
  // ... 原有字段 ...
  
  // ========== 法技系统（扩展） ==========
  /** 已解锁的技能槽位数量 */
  skillSlots: number;
  /** 最大技能槽位数量 */
  maxSkillSlots: number;
  /** 全部可解锁技能 */
  allSkills: TechniqueSkill[];
  /** 当前装备的技能ID列表（按槽位顺序，null表示空槽） */
  equippedSkills: (string | null)[];
  
  // ========== 新增计算字段 ==========
  /** 获取已解锁的技能列表 */
  getUnlockedSkills(): TechniqueSkill[];
  /** 获取当前装备的有效技能列表 */
  getEquippedSkills(): TechniqueSkill[];
}

/** 扩展方法实现 */
export function getUnlockedSkills(technique: Technique): TechniqueSkill[] {
  return technique.allSkills.filter(
    skill => skill.unlockLevel <= technique.level
  );
}

export function getEquippedSkills(technique: Technique): TechniqueSkill[] {
  return technique.equippedSkills
    .filter((id): id is string => id !== null)
    .map(id => technique.allSkills.find(s => s.id === id))
    .filter((skill): skill is TechniqueSkill => skill !== undefined);
}
```

### 5.5 UI交互设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    功法技能管理界面                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  《烈焰剑诀》Lv.3/7 [稀有] 火/剑                                │
│  ══════════════════════════════════════════════════════════     │
│                                                                 │
│  【技能槽位】（已装备/总槽位: 2/3）                              │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 槽位1 [已解锁]                                         │      │
│  │ ┌─────────────────────────────────────────────────┐   │      │
│  │ │ 🔥 烈焰斩                                        │   │      │
│  │ │ 消耗: 20MP | 冷却: 2回合                         │   │      │
│  │ │ [卸下]                                          │   │      │
│  │ └─────────────────────────────────────────────────┘   │      │
│  └───────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 槽位2 [已解锁]                                         │      │
│  │ ┌─────────────────────────────────────────────────┐   │      │
│  │ │ 🔥 火焰护盾                                      │   │      │
│  │ │ 消耗: 15MP | 冷却: 3回合                         │   │      │
│  │ │ [卸下]                                          │   │      │
│  │ └─────────────────────────────────────────────────┘   │      │
│  └───────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 槽位3 [已解锁]                                         │      │
│  │ ┌─────────────────────────────────────────────────┐   │      │
│  │ │ [空槽位] 点击下方技能装备                        │   │      │
│  │ └─────────────────────────────────────────────────┘   │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  【已解锁技能池】（点击装备到空槽位）                            │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 🔥 烈焰斩          [已装备]                           │      │
│  │ 🔥 火焰护盾        [已装备]                           │      │
│  │ 🔥 炎爆术          [装备] ← 点击装备到空槽位          │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  【未解锁技能】                                                  │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 🔥 凤凰涅槃        🔒 需要等级5                        │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 武器斗技装备（类似设计）

武器斗技的装备/卸下机制与功法法技完全相同，只是字段名不同：

```typescript
/** 武器定义（扩展版） */
export interface Equipment {
  // ... 原有字段 ...
  
  // ========== 斗技系统（扩展） ==========
  /** 已解锁的技巧槽位数量 */
  techniqueSlots: number;
  /** 最大技巧槽位数量 */
  maxTechniqueSlots: number;
  /** 全部可解锁技巧 */
  allTechniques: WeaponTechnique[];
  /** 当前装备的技巧ID列表（按槽位顺序，null表示空槽） */
  equippedTechniques: (string | null)[];
}

// 装备/卸下函数签名相同，只是参数从 Technique 改为 Equipment
export function equipTechnique(equipment: Equipment, techniqueId: string, slotIndex: number): EquipResult;
export function unequipTechnique(equipment: Equipment, slotIndex: number): EquipResult;
```

### 5.7 战斗系统集成

```typescript
/**
 * 获取战斗中可用的技能选项（更新版）
 * 只返回已装备的技能
 */
export function getAvailableBattleSkills(
  protagonist: Protagonist
): BattleSkillOption[] {
  const options: BattleSkillOption[] = [];
  
  // 从功法获取已装备的法技
  for (const technique of protagonist.techniques) {
    if (!technique || technique.isFragment) continue;
    
    // 只获取已装备的技能
    for (const skillId of technique.equippedSkills) {
      if (!skillId) continue; // 跳过空槽
      
      const skill = technique.allSkills.find(s => s.id === skillId);
      if (!skill) continue;
      
      // 双重检查：确保技能已解锁
      if (skill.unlockLevel > technique.level) continue;
      
      options.push({
        source: 'technique',
        sourceId: technique.id,
        sourceName: technique.name,
        skillId: skill.id,
        skillName: skill.name,
        description: skill.description,
        mpCost: skill.mpCost,
        currentCooldown: 0,
        isAvailable: protagonist.currentMp >= skill.mpCost,
        unavailableReason: protagonist.currentMp < skill.mpCost ? '法力不足' : undefined,
      });
    }
  }
  
  // 从武器获取已装备的斗技
  const weapons = [
    protagonist.equippedMelee,
    protagonist.equippedRanged,
  ].filter((w): w is Equipment => w !== null && !w.isFragment);
  
  for (const weapon of weapons) {
    // 只获取已装备的技巧
    for (const techniqueId of weapon.equippedTechniques) {
      if (!techniqueId) continue; // 跳过空槽
      
      const technique = weapon.allTechniques.find(t => t.id === techniqueId);
      if (!technique) continue;
      
      // 双重检查：确保技巧已解锁
      if (technique.unlockLevel > weapon.level) continue;
      
      options.push({
        source: 'weapon',
        sourceId: weapon.id,
        sourceName: weapon.name,
        skillId: technique.id,
        skillName: technique.name,
        description: technique.description,
        mpCost: 0,
        currentCooldown: 0,
        isAvailable: true,
      });
    }
  }
  
  return options;
}
```

---

## 六、敌人功法与掉落系统

### 6.1 敌人功法配置

```typescript
/** 敌人功法配置 */
export interface EnemyTechniqueConfig {
  /** 敌人类型 */
  enemyTier: EnemyTier;
  /** 拥有功法概率 */
  hasTechniqueRate: number;
  /** 功法数量范围 */
  techniqueCount: [number, number];
  /** 功法品质权重 */
  rarityWeights: Record<TechniqueRarity, number>;
}

/** 敌人功法配置表 */
export const ENEMY_TECHNIQUE_CONFIGS: Record<EnemyTier, EnemyTechniqueConfig> = {
  normal: {
    enemyTier: 'normal',
    hasTechniqueRate: 0.1,
    techniqueCount: [0, 1],
    rarityWeights: { '普通': 80, '稀有': 15, '史诗': 4, '传说': 1, '神话': 0 },
  },
  elite: {
    enemyTier: 'elite',
    hasTechniqueRate: 0.3,
    techniqueCount: [1, 2],
    rarityWeights: { '普通': 50, '稀有': 35, '史诗': 12, '传说': 3, '神话': 0 },
  },
  miniboss: {
    enemyTier: 'miniboss',
    hasTechniqueRate: 1.0,
    techniqueCount: [2, 3],
    rarityWeights: { '普通': 20, '稀有': 40, '史诗': 30, '传说': 10, '神话': 0 },
  },
  boss: {
    enemyTier: 'boss',
    hasTechniqueRate: 1.0,
    techniqueCount: [3, 5],
    rarityWeights: { '普通': 5, '稀有': 25, '史诗': 40, '传说': 25, '神话': 5 },
  },
};
```

### 6.2 残本掉落计算

```typescript
/**
 * 生成敌人残本掉落
 */
export function generateEnemyFragmentDrop(
  enemyTier: EnemyTier,
  enemyLevel: number,
  enemyTechniques: Technique[]
): FragmentDropResult {
  const config = FRAGMENT_DROP_CONFIG[enemyTier];
  
  // 检查是否掉落
  if (Math.random() >= config.dropRate) {
    return { fragments: [], log: '' };
  }
  
  // 确定掉落数量
  const count = random(config.minFragments, config.maxFragments);
  
  // 从敌人拥有的功法中生成残本
  const fragments: FragmentData[] = [];
  
  for (let i = 0; i < count; i++) {
    // 随机选择一个敌人功法
    const sourceTechnique = randomItem(enemyTechniques);
    if (!sourceTechnique) continue;
    
    // 生成该功法的残本
    const fragment = generateTechniqueFragment(sourceTechnique);
    fragments.push(fragment);
  }
  
  const log = fragments.length > 0
    ? `获得残本: ${fragments.map(f => f.name).join(', ')}`
    : '';
  
  return { fragments, log };
}

/**
 * 为功法生成残本
 */
export function generateTechniqueFragment(sourceTechnique: Technique): FragmentData {
  const fragmentsRequired = SYNTHESIS_FRAGMENT_COUNT[sourceTechnique.rarity];
  const fragmentIndex = random(1, fragmentsRequired);
  
  return {
    id: `fragment_${sourceTechnique.id}_${fragmentIndex}`,
    sourceTechniqueId: sourceTechnique.id,
    type: 'technique',
    rarity: sourceTechnique.rarity,
    name: `${sourceTechnique.name}·残本(${fragmentIndex}/${fragmentsRequired})`,
    description: `${sourceTechnique.name}的残缺部分，集齐${fragmentsRequired}本可合成完本`,
    fragmentIndex,
    fragmentsRequired,
    element: sourceTechnique.element,
    compatibleWeapon: sourceTechnique.compatibleWeapon,
  };
}
```

---

## 七、战斗系统集成

### 7.1 技能使用流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     战斗技能使用流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   回合开始                                                      │
│      │                                                          │
│      ▼                                                          │
│   ┌─────────────────────┐                                       │
│   │ 选择行动类型        │                                       │
│   │ ├─ 普通攻击         │                                       │
│   │ ├─ 法技（功法技能） │◄────── 功法系统                       │
│   │ ├─ 斗技（武器技巧） │◄────── 武器系统                       │
│   │ └─ 防御/道具        │                                       │
│   └─────────────────────┘                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌─────────────────────┐                                       │
│   │ 检查冷却/法力       │                                       │
│   │ ├─ 法力足够？       │                                       │
│   │ └─ 冷却完毕？       │                                       │
│   └─────────────────────┘                                       │
│      │                                                          │
│      ├──── 否 ────► 返回选择                                    │
│      │ 是                                                       │
│      ▼                                                          │
│   ┌─────────────────────┐                                       │
│   │ 计算契合加成        │                                       │
│   │ ├─ 功法-武器契合    │                                       │
│   │ └─ 元素克制         │                                       │
│   └─────────────────────┘                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌─────────────────────┐                                       │
│   │ 执行技能效果        │                                       │
│   │ ├─ 造成伤害/治疗    │                                       │
│   │ ├─ 应用buff/debuff  │                                       │
│   │ └─ 触发斗技         │                                       │
│   └─────────────────────┘                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌─────────────────────┐                                       │
│   │ 更新冷却/状态       │                                       │
│   └─────────────────────┘                                       │
│      │                                                          │
│      ▼                                                          │
│   回合结束                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 技能选择界面数据结构

```typescript
/** 战斗中可用的技能选项 */
export interface BattleSkillOption {
  /** 技能来源 */
  source: 'technique' | 'weapon';
  /** 来源物品ID */
  sourceId: string;
  /** 来源物品名称 */
  sourceName: string;
  /** 技能ID */
  skillId: string;
  /** 技能名称 */
  skillName: string;
  /** 技能描述 */
  description: string;
  /** 法力消耗 */
  mpCost: number;
  /** 当前冷却 */
  currentCooldown: number;
  /** 是否可用 */
  isAvailable: boolean;
  /** 不可用原因 */
  unavailableReason?: string;
  /** 预估伤害/效果 */
  estimatedEffect?: {
    damage?: number;
    heal?: number;
  };
}

/**
 * 获取战斗中可用的所有技能选项
 */
export function getAvailableBattleSkills(
  protagonist: Protagonist
): BattleSkillOption[] {
  const options: BattleSkillOption[] = [];
  
  // 从功法获取法技
  for (const technique of protagonist.techniques) {
    if (!technique || technique.isFragment) continue;
    
    for (const skillId of technique.equippedSkills) {
      const skill = technique.allSkills.find(s => s.id === skillId);
      if (!skill) continue;
      
      options.push({
        source: 'technique',
        sourceId: technique.id,
        sourceName: technique.name,
        skillId: skill.id,
        skillName: skill.name,
        description: skill.description,
        mpCost: skill.mpCost,
        currentCooldown: 0, // TODO: 从战斗状态获取
        isAvailable: protagonist.currentMp >= skill.mpCost,
        unavailableReason: protagonist.currentMp < skill.mpCost ? '法力不足' : undefined,
      });
    }
  }
  
  // 从武器获取斗技
  const weapons = [
    protagonist.equippedMelee,
    protagonist.equippedRanged,
  ].filter((w): w is Equipment => w !== null && !w.isFragment);
  
  for (const weapon of weapons) {
    for (const techniqueId of weapon.equippedTechniques) {
      const technique = weapon.allTechniques.find(t => t.id === techniqueId);
      if (!technique) continue;
      
      options.push({
        source: 'weapon',
        sourceId: weapon.id,
        sourceName: weapon.name,
        skillId: technique.id,
        skillName: technique.name,
        description: technique.description,
        mpCost: 0, // 斗技通常不消耗法力
        currentCooldown: 0,
        isAvailable: true,
      });
    }
  }
  
  return options;
}
```

---

## 八、状态机设计

### 7.1 功法状态机

```
┌─────────────────────────────────────────────────────────────────┐
│                     功法状态机                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │   获得功法   │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │    残本      │◄─────── 掉落残本                             │
│   │  (未完成)    │                                              │
│   └──────┬───────┘                                              │
│          │ 合成完成                                             │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │    完本      │                                              │
│   │  (可使用)    │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ├──────────────────┬──────────────────┐                │
│          ▼                  ▼                  ▼                │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │   装备中     │   │   升级中     │   │   未装备     │        │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│          │                  │                  │                │
│          └──────────────────┴──────────────────┘                │
│                            │                                    │
│                            ▼                                    │
│                     ┌──────────────┐                            │
│                     │   满级       │                            │
│                     │  (完全解锁)  │                            │
│                     └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 武器状态机

```
┌─────────────────────────────────────────────────────────────────┐
│                     武器状态机                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │   获得武器   │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │    残片      │◄─────── 掉落残片                             │
│   │  (未重铸)    │                                              │
│   └──────┬───────┘                                              │
│          │ 重铸完成                                             │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │    完整      │                                              │
│   │  (可使用)    │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ├──────────────────┬──────────────────┐                │
│          ▼                  ▼                  ▼                │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │   装备中     │   │   升级中     │   │   未装备     │        │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│          │                  │                  │                │
│          └──────────────────┴──────────────────┘                │
│                            │                                    │
│                            ▼                                    │
│                     ┌──────────────┐                            │
│                     │   满级       │                            │
│                     │  (完全解锁)  │                            │
│                     └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 九、数值平衡配置

### 8.1 功法数值配置

```typescript
/** 功法稀有度配置 */
export const TECHNIQUE_RARITY_CONFIG: Record<TechniqueRarity, {
  /** 基础威力范围 */
  powerRange: [number, number];
  /** 基础加成范围 */
  bonusRange: [number, number];
  /** 最大等级（10级制） */
  maxLevel: number;
  /** 法技数量 */
  skillCount: [number, number];
  /** 技能槽位上限 */
  maxSkillSlots: number;
  /** 契合加成 */
  compatibleBonus: number;
  /** 残本合成数量 */
  fragmentsRequired: number;
}> = {
  '普通': {
    powerRange: [10, 30],
    bonusRange: [5, 15],
    maxLevel: 5,   // 普通功法最高5级
    skillCount: [1, 2],
    maxSkillSlots: 2,
    compatibleBonus: 0.10,
    fragmentsRequired: 3,
  },
  '稀有': {
    powerRange: [25, 50],
    bonusRange: [10, 25],
    maxLevel: 7,   // 稀有功法最高7级
    skillCount: [2, 3],
    maxSkillSlots: 3,
    compatibleBonus: 0.12,
    fragmentsRequired: 4,
  },
  '史诗': {
    powerRange: [45, 80],
    bonusRange: [20, 40],
    maxLevel: 8,   // 史诗功法最高8级
    skillCount: [3, 4],
    maxSkillSlots: 4,
    compatibleBonus: 0.15,
    fragmentsRequired: 5,
  },
  '传说': {
    powerRange: [70, 120],
    bonusRange: [35, 60],
    maxLevel: 9,   // 传说功法最高9级
    skillCount: [4, 5],
    maxSkillSlots: 5,
    compatibleBonus: 0.18,
    fragmentsRequired: 7,
  },
  '神话': {
    powerRange: [100, 180],
    bonusRange: [50, 100],
    maxLevel: 10,  // 神话功法最高10级
    skillCount: [5, 6],
    maxSkillSlots: 6,
    compatibleBonus: 0.25,
    fragmentsRequired: 10,
  },
};
```

### 8.2 武器数值配置

```typescript
/** 武器稀有度配置 */
export const EQUIPMENT_RARITY_CONFIG: Record<EquipmentRarity, {
  /** 攻击加成范围 */
  attackRange: [number, number];
  /** 防御加成范围 */
  defenseRange: [number, number];
  /** 最大等级（10级制） */
  maxLevel: number;
  /** 斗技数量 */
  techniqueCount: [number, number];
  /** 技巧槽位上限 */
  maxTechniqueSlots: number;
  /** 契合加成 */
  compatibleBonus: number;
  /** 残片重铸数量 */
  shardsRequired: number;
}> = {
  '普通': {
    attackRange: [5, 15],
    defenseRange: [5, 15],
    maxLevel: 5,   // 普通武器最高5级
    techniqueCount: [1, 2],
    maxTechniqueSlots: 2,
    compatibleBonus: 0.10,
    shardsRequired: 5,
  },
  '稀有': {
    attackRange: [12, 28],
    defenseRange: [12, 28],
    maxLevel: 7,   // 稀有武器最高7级
    techniqueCount: [2, 3],
    maxTechniqueSlots: 3,
    compatibleBonus: 0.12,
    shardsRequired: 7,
  },
  '史诗': {
    attackRange: [25, 45],
    defenseRange: [25, 45],
    maxLevel: 8,   // 史诗武器最高8级
    techniqueCount: [3, 4],
    maxTechniqueSlots: 4,
    compatibleBonus: 0.15,
    shardsRequired: 10,
  },
  '传说': {
    attackRange: [40, 70],
    defenseRange: [40, 70],
    maxLevel: 9,   // 传说武器最高9级
    techniqueCount: [4, 5],
    maxTechniqueSlots: 5,
    compatibleBonus: 0.18,
    shardsRequired: 15,
  },
  '神话': {
    attackRange: [60, 100],
    defenseRange: [60, 100],
    maxLevel: 10,  // 神话武器最高10级
    techniqueCount: [5, 6],
    maxTechniqueSlots: 6,
    compatibleBonus: 0.25,
    shardsRequired: 20,
  },
};
```

---

## 十、边界条件与防御性检查

### 10.1 必须验证的边界条件

```typescript
/**
 * 功法数据验证
 */
export function validateTechnique(technique: Technique): string[] {
  const errors: string[] = [];
  
  // 必填字段检查
  if (!technique.id) errors.push('功法ID不能为空');
  if (!technique.name) errors.push('功法名称不能为空');
  if (!technique.element) errors.push('功法必须有元素属性');
  
  // 数值范围检查（10级制）
  if (technique.level < 1 || technique.level > technique.maxLevel) {
    errors.push(`功法等级必须在1-${technique.maxLevel}之间`);
  }
  if (technique.maxLevel < 5 || technique.maxLevel > 10) {
    errors.push('功法最大等级必须在5-10之间');
  }
  if (technique.power <= 0) {
    errors.push('功法威力必须大于0');
  }
  if (technique.bonus < 0) {
    errors.push('功法加成不能为负');
  }
  
  // 技能槽位检查
  const equippedCount = technique.equippedSkills.filter(id => id !== null).length;
  if (equippedCount > technique.skillSlots) {
    errors.push(`装备技能数(${equippedCount})超过已解锁槽位数(${technique.skillSlots})`);
  }
  
  // 技能ID有效性检查
  for (const skillId of technique.equippedSkills) {
    if (skillId === null) continue;
    if (!technique.allSkills.find(s => s.id === skillId)) {
      errors.push(`技能${skillId}不存在于功法技能列表中`);
    }
  }
  
  // 技能解锁检查：装备的技能必须已解锁
  for (const skillId of technique.equippedSkills) {
    if (skillId === null) continue;
    const skill = technique.allSkills.find(s => s.id === skillId);
    if (skill && skill.unlockLevel > technique.level) {
      errors.push(`技能【${skill.name}】需要等级${skill.unlockLevel}，当前功法等级${technique.level}不足`);
    }
  }
  
  // 重复装备检查
  const validSkillIds = technique.equippedSkills.filter((id): id is string => id !== null);
  const uniqueSkillIds = new Set(validSkillIds);
  if (uniqueSkillIds.size !== validSkillIds.length) {
    errors.push('存在重复装备的技能');
  }
  
  // 残本检查
  if (technique.isFragment && !technique.fragmentsRequired) {
    errors.push('残本必须指定所需数量');
  }
  
  return errors;
}

/**
 * 武器数据验证
 */
export function validateEquipment(equipment: Equipment): string[] {
  const errors: string[] = [];
  
  // 必填字段检查
  if (!equipment.id) errors.push('武器ID不能为空');
  if (!equipment.name) errors.push('武器名称不能为空');
  if (!equipment.slot) errors.push('武器槽位不能为空');
  
  // 数值范围检查（10级制）
  if (equipment.level < 1 || equipment.level > equipment.maxLevel) {
    errors.push(`武器等级必须在1-${equipment.maxLevel}之间`);
  }
  if (equipment.maxLevel < 5 || equipment.maxLevel > 10) {
    errors.push('武器最大等级必须在5-10之间');
  }
  if (equipment.attackBonus < 0) {
    errors.push('攻击加成不能为负');
  }
  if (equipment.defenseBonus < 0) {
    errors.push('防御加成不能为负');
  }
  
  // 武器类别检查（仅武器槽位需要）
  if ((equipment.slot === 'melee' || equipment.slot === 'ranged') && !equipment.weaponCategory) {
    errors.push('武器槽位装备必须有武器类别');
  }
  
  // 技巧槽位检查
  const equippedCount = equipment.equippedTechniques.filter(id => id !== null).length;
  if (equippedCount > equipment.techniqueSlots) {
    errors.push(`装备技巧数(${equippedCount})超过已解锁槽位数(${equipment.techniqueSlots})`);
  }
  
  // 技巧ID有效性检查
  for (const techniqueId of equipment.equippedTechniques) {
    if (techniqueId === null) continue;
    if (!equipment.allTechniques.find(t => t.id === techniqueId)) {
      errors.push(`技巧${techniqueId}不存在于武器技巧列表中`);
    }
  }
  
  // 技巧解锁检查：装备的技巧必须已解锁
  for (const techniqueId of equipment.equippedTechniques) {
    if (techniqueId === null) continue;
    const technique = equipment.allTechniques.find(t => t.id === techniqueId);
    if (technique && technique.unlockLevel > equipment.level) {
      errors.push(`技巧【${technique.name}】需要等级${technique.unlockLevel}，当前武器等级${equipment.level}不足`);
    }
  }
  
  // 重复装备检查
  const validTechniqueIds = equipment.equippedTechniques.filter((id): id is string => id !== null);
  const uniqueTechniqueIds = new Set(validTechniqueIds);
  if (uniqueTechniqueIds.size !== validTechniqueIds.length) {
    errors.push('存在重复装备的技巧');
  }
  
  // 残片检查
  if (equipment.isFragment && !equipment.fragmentsRequired) {
    errors.push('残片必须指定所需数量');
  }
  
  return errors;
}
```

### 9.2 运行时防御性检查

```typescript
/**
 * 安全获取功法属性（带默认值）
 */
export function safeGetTechniqueValue(
  technique: Technique | null | undefined,
  getValue: (t: Technique) => number,
  defaultValue: number = 0
): number {
  if (!technique) return defaultValue;
  if (technique.isFragment) return defaultValue;
  
  const value = getValue(technique);
  return clamp(value, 0, Number.MAX_SAFE_INTEGER);
}

/**
 * 安全计算契合加成（防止溢出）
 */
export function safeCalculateCompatibilityBonus(
  technique: Technique | null,
  weapon: Equipment | null
): number {
  if (!technique || !weapon) return 0;
  if (technique.isFragment || weapon.isFragment) return 0;
  
  const bonus = calculateCompatibilityBonus(technique, weapon);
  // 总加成上限为100%
  return clamp(bonus.total, 0, 1.0);
}
```

---

## 十一、实现路线图

### 10.1 阶段一：基础重构（预计3天）

1. **类型定义更新**
   - 新增 TechniqueSkill、WeaponTechnique 类型
   - 更新 Technique、Equipment 接口
   - 删除旧的碎片系统类型

2. **功法生成器重构**
   - 实现新功法生成逻辑
   - 包含元素属性和契合武器
   - 生成法技列表

3. **武器生成器重构**
   - 实现新武器生成逻辑
   - 包含武器类型和契合元素
   - 生成斗技列表

### 11.2 阶段二：残本/残片系统（预计2天）

1. **残本系统实现**
   - 敌人功法配置
   - 残本掉落逻辑
   - 残本合成完本

2. **残片系统重构**
   - 更新残片掉落逻辑
   - 残片重铸完整装备
   - 删除旧的碎片系统

### 11.3 阶段三：战斗集成（预计2天）

1. **技能选择界面**
   - 法技选择UI
   - 斗技选择UI
   - 技能冷却显示

2. **契合计算集成**
   - 战斗伤害计算更新
   - 契合加成显示

### 11.4 阶段四：测试与优化（预计1天）

1. **单元测试**
   - 功法生成测试
   - 武器生成测试
   - 残本/残片系统测试
   - 契合计算测试

2. **边界条件测试**
   - 空值处理
   - 数值溢出
   - 状态完整性

---

## 十二、风险与注意事项

### 12.1 已知风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 旧存档不兼容 | 玩家数据丢失 | 提供数据迁移工具 |
| 数值平衡 | 新系统可能过强/过弱 | 充分测试，预留调整接口 |
| UI复杂度增加 | 玩家学习成本 | 提供新手引导 |

### 12.2 注意事项

1. **数据迁移**：必须提供旧存档迁移方案
2. **向后兼容**：保留必要的旧版本类型定义
3. **性能考虑**：技能数量需有限制，避免战斗卡顿
4. **测试覆盖**：所有边界条件必须有测试用例

---

## 十三、文档版本

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0.0 | 2024-01-XX | Game Design System | 初始版本 |
| 1.1.0 | 2024-01-XX | Game Design System | 1. 等级系统调整为10级制（按稀有度5-10级）<br/>2. 新增法技与斗技装备管理系统<br/>3. 新增技能装备/卸下/交换机制<br/>4. 完善数据验证逻辑 |

---

*本文档遵循 game-design-strict 规范，所有设计必须通过边界条件测试和状态完整性验证。*
