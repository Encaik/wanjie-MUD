# 克制关系系统设计文档

## 1. 设计目标

### 1.1 核心目标
- 增加战斗策略深度，让玩家在战斗中需要考虑属性克制
- 提升功法和装备的收集价值，不再只是纯数值堆叠
- 增强敌人多样性，使战斗更有趣味性

### 1.2 设计原则
- **简洁易懂**：克制关系清晰，玩家容易理解
- **策略可控**：克制加成在合理范围，不会出现"被克制必输"的情况
- **识别直观**：通过功法/装备名称关键词识别属性，无需额外配置

---

## 2. 属性体系定义

### 2.1 元素属性（7种）

| 属性 | 关键词 | 克制 | 被克制 | 克制效果描述 |
|------|--------|------|--------|--------------|
| **火** | 火、炎、焰、烈 | 冰 | 水、土 | 烈火融冰，但被土掩埋 |
| **冰** | 冰、霜、雪、寒 | 雷 | 火 | 冰封雷动，但被烈火融化 |
| **雷** | 雷、电、霆 | 风 | 冰 | 雷破风势，但被冰封 |
| **风** | 风、岚、飓 | 土 | 雷 | 风卷黄沙，但被雷击 |
| **土** | 土、岩、石、山 | 水、火 | 风、木 | 土克水火，但被风吹散 |
| **光** | 光、圣、辉、阳 | 暗 | 暗 | 光暗互克，两败俱伤 |
| **暗** | 暗、影、幽、冥 | 光 | 光 | 光暗互克，两败俱伤 |

> **注**：为了简化系统，土属性同时克制火和水（传统五行中的"土克水"）。光暗属性互相克制，形成高风险高回报的对局。

### 2.2 武器类别（5种）

| 类别 | 关键词 | 克制 | 被克制 | 克制效果描述 |
|------|--------|------|--------|--------------|
| **剑** | 剑、锋 | 刀 | 拳 | 剑走轻灵，克制大开大合的刀 |
| **刀** | 刀、刃 | 拳 | 剑 | 刀势刚猛，克制近身拳脚 |
| **拳** | 拳、掌、爪 | 弓 | 刀 | 拳近身可破弓箭远攻 |
| **弓** | 弓、箭、射 | 枪 | 拳 | 弓可远程压制长枪 |
| **枪** | 枪、戟、矛 | 剑 | 弓 | 枪长剑短，一寸长一寸强 |

### 2.3 克制关系图

```
【元素克制环】
    火 ──克──> 冰
    ↑           ↓
   土<──克──   雷
    ↑           ↓
   (水)       风
    (土也克火)

【光暗互克】
    光 <──互克──> 暗

【武器克制环】
    剑 ──克──> 刀 ──克──> 拳
    ↑                      ↓
    克                     克
    ↑                      ↓
   枪 <──克── 弓 <──克──┘
```

---

## 3. 克制效果计算

### 3.1 克制系数

| 关系 | 系数 | 说明 |
|------|------|------|
| 克制 | **+25%** | 伤害提升25%，受到伤害减少10% |
| 被克制 | **-15%** | 伤害降低15%，受到伤害增加10% |
| 光暗互克 | **±20%** | 双方都获得20%伤害加成（高风险） |
| 无关系 | **±0%** | 无任何加成 |

### 3.2 伤害计算公式

```typescript
// 最终伤害 = 基础伤害 × 克制系数 × 防御系数
function calculateDamageWithRestraint(
  baseDamage: number,
  attackerElement: Element | null,
  defenderElement: Element | null,
  attackerWeapon: WeaponCategory | null,
  defenderWeapon: WeaponCategory | null,
  defense: number
): number {
  // 1. 计算基础防御减伤
  const defenseFactor = defenseReductionFactor / (defenseReductionFactor + defense);
  let damage = baseDamage * defenseFactor;
  
  // 2. 计算元素克制系数
  const elementMultiplier = calculateElementMultiplier(attackerElement, defenderElement);
  
  // 3. 计算武器克制系数
  const weaponMultiplier = calculateWeaponMultiplier(attackerWeapon, defenderWeapon);
  
  // 4. 叠加克制效果（乘法叠加，避免过度放大）
  const totalMultiplier = elementMultiplier * weaponMultiplier;
  
  return Math.floor(damage * totalMultiplier);
}
```

### 3.3 属性归属原则（核心设计）

**关键原则：属性只存在于功法和武器，人物本身没有属性。**

```
┌─────────────────────────────────────────────────────────────┐
│                     玩家（无属性）                           │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  功法槽1    │  │  功法槽2    │  │  功法槽3    │        │
│   │ [烈焰诀]    │  │ [寒冰掌]    │  │ [雷霆击]    │        │
│   │ 🔥火属性    │  │ ❄️冰属性   │  │ ⚡雷属性    │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐                         │
│   │  近战武器   │  │  远程武器   │                         │
│   │ [炎龙剑]    │  │ [穿云弓]    │                         │
│   │ 🔥火属性    │  │ 🏹弓类      │                         │
│   │ ⚔️剑类      │  │             │                         │
│   └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 战斗中的属性判定

**攻击时属性判定**：

| 攻击类型 | 属性来源 | 说明 |
|----------|----------|------|
| **普通攻击** | 当前装备的武器 | 近战武器 > 远程武器 |
| **功法攻击** | 触发的功法本身 | 哪个功法触发就用哪个的属性 |

**防御时属性判定**：

| 防御类型 | 属性来源 | 说明 |
|----------|----------|------|
| **受到攻击** | 当前装备的武器 | 用武器的元素属性判定克制 |
| **功法防御** | 触发的防御功法 | 防御功法触发时用其属性 |

### 3.5 属性切换示例

```
战斗流程：
1. 玩家普通攻击 → 使用 [炎龙剑] 的 🔥火属性 + ⚔️剑类
2. 功法[烈焰诀]触发 → 使用 [烈焰诀] 的 🔥火属性
3. 功法[寒冰掌]触发 → 使用 [寒冰掌] 的 ❄️冰属性
4. 敌人反击 → 玩家用 [炎龙剑] 的 🔥火属性判定受击克制

每次攻击都是独立的属性判定，功法改变时属性就改变！
```

---

## 4. 敌人属性分配

### 4.1 敌人属性生成规则

每个敌人在生成时随机分配：

| 属性类型 | 分配概率 | 说明 |
|----------|----------|------|
| 元素属性 | 60% | 40%敌人无元素属性 |
| 武器类别 | 50% | 50%敌人无武器类别 |

### 4.2 敌人属性来源

1. **名称关键词匹配**：
   - 敌人名称包含元素关键词 → 分配对应元素
   - 敌人名称包含武器关键词 → 分配对应武器

2. **随机分配**：
   - 名称不包含关键词时，按概率随机分配

### 4.3 Boss特殊规则

- **Boss必定有属性**：所有Boss级敌人必定拥有元素属性和武器类别
- **双重属性**：精英/Boss有30%概率拥有双重元素属性

---

## 5. 类型定义

### 5.1 新增类型

```typescript
// ============================================
// 克制关系系统类型定义
// ============================================

/** 元素属性枚举 */
export type Element = 'fire' | 'ice' | 'thunder' | 'wind' | 'earth' | 'light' | 'dark';

/** 武器类别枚举 */
export type WeaponCategory = 'sword' | 'blade' | 'fist' | 'bow' | 'spear';

/** 元素属性中文名映射 */
export const ELEMENT_NAMES: Record<Element, string> = {
  fire: '火',
  ice: '冰',
  thunder: '雷',
  wind: '风',
  earth: '土',
  light: '光',
  dark: '暗',
};

/** 武器类别中文名映射 */
export const WEAPON_CATEGORY_NAMES: Record<WeaponCategory, string> = {
  sword: '剑',
  blade: '刀',
  fist: '拳',
  bow: '弓',
  spear: '枪',
};

/** 元素属性关键词映射 */
export const ELEMENT_KEYWORDS: Record<Element, string[]> = {
  fire: ['火', '炎', '焰', '烈'],
  ice: ['冰', '霜', '雪', '寒'],
  thunder: ['雷', '电', '霆'],
  wind: ['风', '岚', '飓'],
  earth: ['土', '岩', '石', '山'],
  light: ['光', '圣', '辉', '阳'],
  dark: ['暗', '影', '幽', '冥'],
};

/** 武器类别关键词映射 */
export const WEAPON_KEYWORDS: Record<WeaponCategory, string[]> = {
  sword: ['剑', '锋'],
  blade: ['刀', '刃'],
  fist: ['拳', '掌', '爪'],
  bow: ['弓', '箭', '射'],
  spear: ['枪', '戟', '矛'],
};

/** 克制关系配置 */
export interface RestraintConfig {
  /** 克制目标 */
  counter: Element | WeaponCategory | null;
  /** 被克制者 */
  counteredBy: Element | WeaponCategory | null;
}

/** 克制效果结果 */
export interface RestraintResult {
  /** 伤害倍率（攻击方） */
  damageMultiplier: number;
  /** 受伤倍率（防御方） */
  receivedMultiplier: number;
  /** 克制类型描述 */
  restraintType: 'counter' | 'countered' | 'mutual' | 'neutral';
}
```

### 5.2 扩展现有类型

```typescript
// ============================================
// 扩展 Technique 接口
// ============================================
export interface Technique {
  // ... 现有字段 ...
  
  /** 功法元素属性（从名称识别） */
  element?: Element;
  /** 功法武器类别（从名称识别） */
  weaponCategory?: WeaponCategory;
}

// ============================================
// 扩展 Equipment 接口
// ============================================
export interface Equipment {
  // ... 现有字段 ...
  
  /** 装备元素属性（从名称识别） */
  element?: Element;
  /** 装备武器类别（从名称识别） */
  weaponCategory?: WeaponCategory;
}

// ============================================
// 扩展 BattleState 接口
// ============================================
export interface BattleState {
  // ... 现有字段 ...
  
  /** 敌人元素属性 */
  enemyElement?: Element;
  /** 敌人武器类别 */
  enemyWeaponCategory?: WeaponCategory;
  // 注意：玩家属性不存储在 BattleState 中
  // 而是根据当前攻击类型实时计算：
  // - 普通攻击：使用武器属性
  // - 功法攻击：使用触发功法的属性
}
```

---

## 6. 核心函数设计

### 6.1 属性识别函数

```typescript
/**
 * 从名称中识别元素属性
 * @param name 功法/装备/敌人名称
 * @returns 识别到的元素属性，未识别返回 null
 */
export function detectElementFromName(name: string): Element | null {
  for (const [element, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return element as Element;
    }
  }
  return null;
}

/**
 * 从名称中识别武器类别
 */
export function detectWeaponCategoryFromName(name: string): WeaponCategory | null {
  for (const [category, keywords] of Object.entries(WEAPON_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category as WeaponCategory;
    }
  }
  return null;
}
```

### 6.2 克制关系计算函数

```typescript
/**
 * 计算元素克制系数
 */
export function calculateElementMultiplier(
  attacker: Element | null,
  defender: Element | null
): number {
  if (!attacker || !defender) return 1.0;
  
  // 光暗互克：双方都获得加成
  if ((attacker === 'light' && defender === 'dark') ||
      (attacker === 'dark' && defender === 'light')) {
    return 1.2; // 双方都 +20%
  }
  
  // 普通克制关系
  const restraintMap: Record<Element, Element> = {
    fire: 'ice',      // 火克冰
    ice: 'thunder',   // 冰克雷
    thunder: 'wind',  // 雷克风
    wind: 'earth',    // 风克土
    earth: 'fire',    // 土克火
    light: 'dark',    // 光克暗
    dark: 'light',    // 暗克光
  };
  
  if (restraintMap[attacker] === defender) {
    return 1.25; // 克制 +25%
  }
  if (restraintMap[defender] === attacker) {
    return 0.85; // 被克制 -15%
  }
  
  return 1.0; // 无关系
}

/**
 * 计算武器克制系数
 */
export function calculateWeaponMultiplier(
  attacker: WeaponCategory | null,
  defender: WeaponCategory | null
): number {
  if (!attacker || !defender) return 1.0;
  
  const restraintMap: Record<WeaponCategory, WeaponCategory> = {
    sword: 'blade',  // 剑克刀
    blade: 'fist',   // 刀克拳
    fist: 'bow',     // 拳克弓
    bow: 'spear',    // 弓克枪
    spear: 'sword',  // 枪克剑
  };
  
  if (restraintMap[attacker] === defender) {
    return 1.25;
  }
  if (restraintMap[defender] === attacker) {
    return 0.85;
  }
  
  return 1.0;
}

/**
 * 综合计算克制结果
 */
export function calculateRestraintResult(
  attackerElement: Element | null,
  defenderElement: Element | null,
  attackerWeapon: WeaponCategory | null,
  defenderWeapon: WeaponCategory | null
): RestraintResult {
  const elementMult = calculateElementMultiplier(attackerElement, defenderElement);
  const weaponMult = calculateWeaponMultiplier(attackerWeapon, defenderWeapon);
  
  // 综合伤害倍率
  const totalMultiplier = elementMult * weaponMult;
  
  // 判定克制类型
  let restraintType: RestraintResult['restraintType'] = 'neutral';
  if (totalMultiplier > 1.1) {
    restraintType = 'counter';
  } else if (totalMultiplier < 0.9) {
    restraintType = 'countered';
  } else if (
    (attackerElement === 'light' && defenderElement === 'dark') ||
    (attackerElement === 'dark' && defenderElement === 'light')
  ) {
    restraintType = 'mutual';
  }
  
  return {
    damageMultiplier: totalMultiplier,
    receivedMultiplier: 2 - totalMultiplier, // 攻守反转
    restraintType,
  };
}
```

### 6.3 攻击属性获取函数

```typescript
/**
 * 获取普通攻击的属性
 * @returns 武器的元素属性和武器类别
 */
export function getNormalAttackAttributes(
  equippedMelee: Equipment | null,
  equippedRanged: Equipment | null
): { element: Element | null; weaponCategory: WeaponCategory | null } {
  // 优先使用近战武器
  if (equippedMelee) {
    return {
      element: equippedMelee.element || null,
      weaponCategory: equippedMelee.weaponCategory || null,
    };
  }
  // 其次使用远程武器
  if (equippedRanged) {
    return {
      element: equippedRanged.element || null,
      weaponCategory: equippedRanged.weaponCategory || null,
    };
  }
  // 无武器时无属性
  return { element: null, weaponCategory: null };
}

/**
 * 获取功法攻击的属性
 * @param technique 触发的功法
 * @returns 功法的元素属性和武器类别
 */
export function getTechniqueAttackAttributes(
  technique: Technique
): { element: Element | null; weaponCategory: WeaponCategory | null } {
  return {
    element: technique.element || null,
    weaponCategory: technique.weaponCategory || null,
  };
}

/**
 * 获取玩家受到攻击时的防御属性
 * @returns 当前武器的元素属性（用于判定受击克制）
 */
export function getDefenseAttributes(
  equippedMelee: Equipment | null,
  equippedRanged: Equipment | null
): { element: Element | null } {
  // 防御时使用当前武器属性判定
  const weapon = equippedMelee || equippedRanged;
  return {
    element: weapon?.element || null,
  };
}
```

### 6.4 战斗伤害计算函数（整合克制）

```typescript
/**
 * 计算普通攻击伤害（含克制）
 */
export function calculateNormalAttackDamage(
  baseDamage: number,
  playerWeapon: { element: Element | null; weaponCategory: WeaponCategory | null },
  enemyAttributes: { element: Element | null; weaponCategory: WeaponCategory | null },
  defense: number
): { damage: number; restraintType: RestraintResult['restraintType'] } {
  // 计算克制效果
  const restraint = calculateRestraintResult(
    playerWeapon.element,
    enemyAttributes.element,
    playerWeapon.weaponCategory,
    enemyAttributes.weaponCategory
  );
  
  // 应用防御减伤
  const defenseFactor = defenseReductionFactor / (defenseReductionFactor + defense);
  const damage = Math.floor(baseDamage * defenseFactor * restraint.damageMultiplier);
  
  return {
    damage,
    restraintType: restraint.restraintType,
  };
}

/**
 * 计算功法攻击伤害（含克制）
 */
export function calculateTechniqueDamage(
  baseDamage: number,
  technique: Technique,
  enemyAttributes: { element: Element | null; weaponCategory: WeaponCategory | null },
  defense: number
): { damage: number; restraintType: RestraintResult['restraintType']; techniqueName: string } {
  // 功法属性作为攻击属性
  const restraint = calculateRestraintResult(
    technique.element || null,
    enemyAttributes.element,
    technique.weaponCategory || null,
    enemyAttributes.weaponCategory
  );
  
  const defenseFactor = defenseReductionFactor / (defenseReductionFactor + defense);
  const damage = Math.floor(baseDamage * defenseFactor * restraint.damageMultiplier);
  
  return {
    damage,
    restraintType: restraint.restraintType,
    techniqueName: technique.name,
  };
}

/**
 * 计算玩家受到的伤害（含克制）
 */
export function calculateReceivedDamage(
  baseDamage: number,
  enemyAttributes: { element: Element | null; weaponCategory: WeaponCategory | null },
  playerWeapon: Equipment | null,
  playerDefense: number
): { damage: number; restraintType: RestraintResult['restraintType'] } {
  // 玩家用武器属性判定受击克制
  const playerElement = playerWeapon?.element || null;
  
  const restraint = calculateRestraintResult(
    enemyAttributes.element,
    playerElement,
    enemyAttributes.weaponCategory,
    null // 玩家防御时不需要武器类别克制
  );
  
  const defenseFactor = defenseReductionFactor / (defenseReductionFactor + playerDefense);
  // 受击时使用 receivedMultiplier
  const damage = Math.floor(baseDamage * defenseFactor * restraint.receivedMultiplier);
  
  return {
    damage,
    restraintType: restraint.restraintType,
  };
}
```

---

## 7. UI展示设计

### 7.1 战斗界面展示

在战斗日志中显示克制关系（每次攻击独立判定）：

```
【普通攻击】你挥剑攻击！克制敌人的刀法！伤害+25%
【功法触发】烈焰诀触发！火属性克制冰属性！伤害+25%
【功法触发】寒冰掌触发！冰属性被敌人火属性克制！伤害-15%
【敌人反击】敌人攻击！你的火属性被敌人土属性克制！受到伤害+15%
【光暗对决】光与暗的交锋！双方伤害+20%
```

### 7.2 敌人信息展示

在敌人名称旁显示属性图标：

```
【精英】🔥冰霜巨狼 Lv.15    [冰属性]
        ↑ 敌人属性标签

【Boss】⚡雷霆剑圣 Lv.30    [雷属性] [剑类]
                              ↑ 双属性标签
```

### 7.3 功法/装备面板

在功法/装备详情中显示识别到的属性：

```
【烈焰诀】攻击功法
━━━━━━━━━━━━━━━━━━
🔥 元素属性：火
⚔️ 武器类别：无
✨ 克制：❄️冰属性
⚠️ 被克：🌍土属性
━━━━━━━━━━━━━━━━━━
威力：150  加成：20%

【炎龙剑】近战武器
━━━━━━━━━━━━━━━━━━
🔥 元素属性：火
⚔️ 武器类别：剑
✨ 克制：❄️冰属性、🔪刀类
⚠️ 被克：🌍土属性、🏹弓类
━━━━━━━━━━━━━━━━━━
攻击加成：+50
```

### 7.4 战斗准备提示

在进入战斗前显示克制预览：

```
┌────────────────────────────────────┐
│  ⚠️ 战斗预警                       │
├────────────────────────────────────┤
│  敌人：【精英】冰霜巨狼            │
│  属性：❄️冰属性                    │
│                                    │
│  你的装备：                        │
│  🔥 炎龙剑 [火属性] → 克制！       │
│  ⚔️ 剑类                          │
│                                    │
│  💡 提示：火属性克制冰属性！       │
│     建议使用火属性功法/武器        │
└────────────────────────────────────┘
```

---

## 8. 数据迁移计划

### 8.1 迁移策略

**不兼容旧数据，直接整体迁移**：

1. **功法数据迁移**：
   - 为所有现有功法添加 `element` 和 `weaponCategory` 字段
   - 通过名称关键词自动识别

2. **装备数据迁移**：
   - 为所有现有装备添加 `element` 和 `weaponCategory` 字段
   - 通过名称关键词自动识别

3. **删除旧逻辑**：
   - 删除 `detectElementFromName` 的动态计算逻辑
   - 所有属性识别在数据生成/迁移时完成，存储到对象中

### 8.2 迁移代码示例

```typescript
/**
 * 迁移功法数据 - 添加属性字段
 */
export function migrateTechnique(technique: any): Technique {
  return {
    ...technique,
    element: technique.element ?? detectElementFromName(technique.name),
    weaponCategory: technique.weaponCategory ?? detectWeaponCategoryFromName(technique.name),
  };
}

/**
 * 迁移装备数据 - 添加属性字段
 */
export function migrateEquipment(equipment: any): Equipment {
  return {
    ...equipment,
    element: equipment.element ?? detectElementFromName(equipment.name),
    weaponCategory: equipment.weaponCategory ?? detectWeaponCategoryFromName(equipment.name),
  };
}
```

---

## 9. 边界条件测试

### 9.1 属性识别测试

| 用例ID | 输入名称 | 预期元素 | 预期武器类别 |
|--------|----------|----------|--------------|
| T001 | 烈焰诀 | fire | null |
| T002 | 寒冰剑法 | ice | sword |
| T003 | 雷霆掌 | thunder | fist |
| T004 | 神秘功法 | null | null |
| T005 | 空字符串 | null | null |

### 9.2 克制关系测试

| 用例ID | 攻击方属性 | 防御方属性 | 预期倍率 | 克制类型 |
|--------|------------|------------|----------|----------|
| R001 | fire | ice | 1.25 | counter |
| R002 | ice | fire | 0.85 | countered |
| R003 | light | dark | 1.20 | mutual |
| R004 | fire | thunder | 1.00 | neutral |
| R005 | null | fire | 1.00 | neutral |

### 9.3 战斗中属性切换测试（核心）

| 用例ID | 场景 | 攻击来源 | 预期属性 | 敌人属性 | 预期克制 |
|--------|------|----------|----------|----------|----------|
| S001 | 普通攻击 | 炎龙剑 | fire + sword | ice | 克制(+25%) |
| S002 | 功法A触发 | 烈焰诀 | fire | ice | 克制(+25%) |
| S003 | 功法B触发 | 寒冰掌 | ice | fire | 被克(-15%) |
| S004 | 无武器普攻 | 空 | null | fire | 无克制 |
| S005 | 敌人反击 | 敌人 | fire | 玩家武器fire | 无克制 |

### 9.4 伤害计算测试

| 用例ID | 基础伤害 | 元素克制 | 武器克制 | 预期结果 |
|--------|----------|----------|----------|----------|
| D001 | 100 | 1.25 | 1.00 | 125 |
| D002 | 100 | 0.85 | 1.00 | 85 |
| D003 | 100 | 1.25 | 1.25 | 156.25 |
| D004 | 100 | 1.00 | 1.00 | 100 |

### 9.5 功法切换场景测试

```
测试场景：玩家装备3本功法
- 槽位1：烈焰诀 [火]
- 槽位2：寒冰掌 [冰]  
- 槽位3：雷霆击 [雷]

战斗流程测试：
1. 普通攻击 → 使用武器属性
2. 烈焰诀触发 → 火属性判定
3. 寒冰掌触发 → 冰属性判定（可能被敌人克制）
4. 雷霆击触发 → 雷属性判定

验证点：
✓ 每次攻击独立判定属性
✓ 功法触发时属性正确切换
✓ 克制效果独立计算
```

---

## 10. 实现文件清单

### 10.1 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/lib/game/restraintSystem.ts` | 克制关系核心逻辑 |
| `src/lib/game/typesExtension.ts` | 扩展类型定义（已有） |

### 10.2 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/lib/game/types.ts` | 添加 Element、WeaponCategory 类型，扩展接口 |
| `src/lib/game/adventure.ts` | 战斗逻辑集成克制关系 |
| `src/lib/game/technique.ts` | 功法生成时识别属性 |
| `src/lib/game/equipment.ts` | 装备生成时识别属性 |
| `src/lib/game/saveMigration.ts` | 数据迁移逻辑 |
| `src/lib/game/combatPower.ts` | 战力计算考虑克制关系（可选） |
| `src/components/game/tabs/TechniquePanel.tsx` | UI显示属性标签 |
| `src/components/game/tabs/EquipmentPanel.tsx` | UI显示属性标签 |
| `src/hooks/adventure/useAdventure.ts` | 战斗日志显示克制信息 |

---

## 11. 风险与注意事项

### 11.1 数值平衡风险

- **风险**：克制加成叠加可能导致伤害过高/过低
- **对策**：设置伤害上限和下限，克制效果乘法叠加避免指数放大

### 11.2 识别准确性风险

- **风险**：名称关键词识别可能误判
- **对策**：提供手动指定属性的能力（稀有/传说功法）

### 11.3 学习成本风险

- **风险**：玩家可能不理解克制关系
- **对策**：在游戏内提供克制关系图鉴，战斗日志明确提示

---

## 12. 后续扩展方向

1. **属性相性图鉴**：在游戏中展示完整的克制关系图
2. **属性克制成就**：累计克制伤害达到一定值解锁成就
3. **属性克制任务**：要求玩家使用特定属性击败敌人
4. **双重属性系统**：允许功法/装备拥有多个属性
5. **属性克制特效**：克制攻击时触发特殊视觉特效

---

**文档版本**：v1.1
**创建时间**：2024年
**最后更新**：修正属性归属设计 - 属性只存在于功法和武器
**状态**：待确认
