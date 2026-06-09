/**
 * 克制关系系统
 * 
 * 核心设计：
 * - 属性只存在于功法和武器，人物本身没有属性
 * - 每次攻击独立判定属性
 * - 普通攻击使用武器属性，功法攻击使用功法属性
 */

import { Technique, Equipment } from '@/shared/lib/types';

// ============================================
// 类型定义
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

/** 武器类别典型契合功法名称映射（用于功法tooltip显示） */
export const WEAPON_CATEGORY_COMPATIBLE_TECHNIQUE: Record<WeaponCategory, { name: string; bonus: number }> = {
  sword: { name: '御剑术', bonus: 0.1 },
  blade: { name: '刀法要诀', bonus: 0.1 },
  fist: { name: '拳意心法', bonus: 0.1 },
  bow: { name: '箭道通幽', bonus: 0.1 },
  spear: { name: '枪术精要', bonus: 0.1 },
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

/** 武器类别关键词映射（按优先级排序，用于从名称识别武器类型） */
export const WEAPON_KEYWORDS: Record<WeaponCategory, string[]> = {
  sword: ['剑', '锋', '仙剑', '剑法'],
  blade: ['刀', '刃', '刀法', '霸刀'],
  fist: ['拳', '掌', '爪', '拳法', '拳意'],
  bow: ['弓', '箭', '射', '弓术'],
  spear: ['枪', '戟', '矛', '枪术', '长枪'],
};

/** 武器类别典型元素映射（用于功法tooltip显示和名称识别） */
export const WEAPON_CATEGORY_DEFAULT_ELEMENT: Record<WeaponCategory, Element> = {
  sword: 'wind',    // 剑 - 风（轻灵飘逸）
  blade: 'fire',   // 刀 - 火（刚猛霸道）
  fist: 'earth',    // 拳 - 土（力量浑厚）
  bow: 'thunder',   // 弓 - 雷（迅捷如电）
  spear: 'ice',     // 枪 - 冰（锐利穿透）
};

/** 克制效果结果 */
export interface RestraintResult {
  /** 伤害倍率（攻击方） */
  damageMultiplier: number;
  /** 受伤倍率（防御方） */
  receivedMultiplier: number;
  /** 克制类型描述 */
  restraintType: 'counter' | 'countered' | 'mutual' | 'neutral';
}

/** 克制关系提示信息 */
export interface RestraintHint {
  /** 克制的属性 */
  counters: string[];
  /** 被克的属性 */
  counteredBy: string[];
}

// ============================================
// 元素克制关系配置
// ============================================

/** 元素克制关系映射：key 克制 value */
export const ELEMENT_COUNTER_MAP: Record<Element, Element> = {
  fire: 'ice',      // 火克冰
  ice: 'thunder',   // 冰克雷
  thunder: 'wind',  // 雷克风
  wind: 'earth',    // 风克土
  earth: 'fire',    // 土克火
  light: 'dark',    // 光克暗（互克）
  dark: 'light',    // 暗克光（互克）
};

/** 武器克制关系映射：key 克制 value */
export const WEAPON_COUNTER_MAP: Record<WeaponCategory, WeaponCategory> = {
  sword: 'blade',  // 剑克刀
  blade: 'fist',   // 刀克拳
  fist: 'bow',     // 拳克弓
  bow: 'spear',    // 弓克枪
  spear: 'sword',  // 枪克剑
};

// ============================================
// 属性识别函数
// ============================================

/**
 * 从名称中识别元素属性
 * @param name 功法/装备/敌人名称
 * @returns 识别到的元素属性，未识别返回 null
 */
export function detectElementFromName(name: string): Element | null {
  if (!name) return null;
  
  for (const [element, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return element as Element;
    }
  }
  return null;
}

/**
 * 从名称中识别武器类别
 * @param name 功法/装备名称
 * @returns 识别到的武器类别，未识别返回 null
 */
export function detectWeaponCategoryFromName(name: string): WeaponCategory | null {
  if (!name) return null;
  
  for (const [category, keywords] of Object.entries(WEAPON_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category as WeaponCategory;
    }
  }
  return null;
}

// ============================================
// 克制关系计算函数
// ============================================

/**
 * 计算元素克制系数
 * @param attacker 攻击方元素
 * @param defender 防御方元素
 * @returns 伤害倍率
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
  if (ELEMENT_COUNTER_MAP[attacker] === defender) {
    return 1.25; // 克制 +25%
  }
  if (ELEMENT_COUNTER_MAP[defender] === attacker) {
    return 0.85; // 被克制 -15%
  }
  
  return 1.0; // 无关系
}

/**
 * 计算武器克制系数
 * @param attacker 攻击方武器类别
 * @param defender 防御方武器类别
 * @returns 伤害倍率
 */
export function calculateWeaponMultiplier(
  attacker: WeaponCategory | null,
  defender: WeaponCategory | null
): number {
  if (!attacker || !defender) return 1.0;
  
  if (WEAPON_COUNTER_MAP[attacker] === defender) {
    return 1.25; // 克制 +25%
  }
  if (WEAPON_COUNTER_MAP[defender] === attacker) {
    return 0.85; // 被克制 -15%
  }
  
  return 1.0;
}

/**
 * 综合计算克制结果
 * @param attackerElement 攻击方元素
 * @param defenderElement 防御方元素
 * @param attackerWeapon 攻击方武器类别
 * @param defenderWeapon 防御方武器类别
 * @returns 克制效果结果
 */
export function calculateRestraintResult(
  attackerElement: Element | null,
  defenderElement: Element | null,
  attackerWeapon: WeaponCategory | null,
  defenderWeapon: WeaponCategory | null
): RestraintResult {
  const elementMult = calculateElementMultiplier(attackerElement, defenderElement);
  const weaponMult = calculateWeaponMultiplier(attackerWeapon, defenderWeapon);
  
  // 综合伤害倍率（乘法叠加）
  const totalMultiplier = elementMult * weaponMult;
  
  // 判定克制类型
  let restraintType: RestraintResult['restraintType'] = 'neutral';
  
  // 光暗互克判定
  if ((attackerElement === 'light' && defenderElement === 'dark') ||
      (attackerElement === 'dark' && defenderElement === 'light')) {
    restraintType = 'mutual';
  } else if (totalMultiplier > 1.1) {
    restraintType = 'counter';
  } else if (totalMultiplier < 0.9) {
    restraintType = 'countered';
  }
  
  return {
    damageMultiplier: totalMultiplier,
    receivedMultiplier: 2 - totalMultiplier, // 攻守反转
    restraintType,
  };
}

/**
 * 获取元素的克制提示信息
 * @param element 元素属性
 * @returns 克制提示
 */
export function getElementRestraintHint(element: Element): RestraintHint {
  const counters: string[] = [];
  const counteredBy: string[] = [];
  
  // 找出克制的目标
  const counterTarget = ELEMENT_COUNTER_MAP[element];
  counters.push(ELEMENT_NAMES[counterTarget]);
  
  // 找出被谁克制
  for (const [atk, def] of Object.entries(ELEMENT_COUNTER_MAP)) {
    if (def === element) {
      counteredBy.push(ELEMENT_NAMES[atk as Element]);
    }
  }
  
  // 光暗互克特殊处理
  if (element === 'light' || element === 'dark') {
    const mutual = element === 'light' ? '暗' : '光';
    counters.push(mutual);
    counteredBy.push(mutual);
  }
  
  return { counters, counteredBy };
}

/**
 * 获取武器类别的克制提示信息
 * @param category 武器类别
 * @returns 克制提示
 */
export function getWeaponRestraintHint(category: WeaponCategory): RestraintHint {
  const counters: string[] = [];
  const counteredBy: string[] = [];
  
  // 找出克制的目标
  const counterTarget = WEAPON_COUNTER_MAP[category];
  counters.push(WEAPON_CATEGORY_NAMES[counterTarget]);
  
  // 找出被谁克制
  for (const [atk, def] of Object.entries(WEAPON_COUNTER_MAP)) {
    if (def === category) {
      counteredBy.push(WEAPON_CATEGORY_NAMES[atk as WeaponCategory]);
    }
  }
  
  return { counters, counteredBy };
}

// ============================================
// 攻击属性获取函数
// ============================================

/**
 * 获取普通攻击的属性（来自武器）
 * @param equippedMelee 装备的近战武器
 * @param equippedRanged 装备的远程武器
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
    weaponCategory: technique.compatibleWeapon || null,
  };
}

/**
 * 获取防御属性（受击判定）
 * @param equippedMelee 装备的近战武器
 * @param equippedRanged 装备的远程武器
 * @returns 防御时的元素属性
 */
export function getDefenseAttributes(
  equippedMelee: Equipment | null,
  equippedRanged: Equipment | null
): { element: Element | null; weaponCategory: WeaponCategory | null } {
  const weapon = equippedMelee || equippedRanged;
  return {
    element: weapon?.element || null,
    weaponCategory: weapon?.weaponCategory || null,
  };
}

// ============================================
// 敌人属性相关
// ============================================

/**
 * 敌人属性信息
 */
export interface EnemyAttributes {
  element: Element | null;
  weaponCategory: WeaponCategory | null;
}

/**
 * 获取敌人的属性
 * @param enemyName 敌人名称
 * @param isBoss 是否为Boss
 * @returns 敌人属性
 */
export function getEnemyAttributes(enemyName: string, isBoss: boolean = false): EnemyAttributes {
  // 从名称识别属性
  const element = detectElementFromName(enemyName);
  const weaponCategory = detectWeaponCategoryFromName(enemyName);
  
  // Boss必定有属性（如果没有识别到则随机分配）
  if (isBoss) {
    const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
    const weapons: WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'];
    
    return {
      element: element || elements[Math.floor(Math.random() * elements.length)],
      weaponCategory: weaponCategory || weapons[Math.floor(Math.random() * weapons.length)],
    };
  }
  
  // 普通敌人：有属性就返回，没有就无属性
  // 60%概率有元素属性，50%概率有武器类别
  const hasElement = element || (Math.random() < 0.6 ? getRandomElement() : null);
  const hasWeapon = weaponCategory || (Math.random() < 0.5 ? getRandomWeaponCategory() : null);
  
  return {
    element: hasElement,
    weaponCategory: hasWeapon,
  };
}

/**
 * 随机获取一个元素属性
 */
function getRandomElement(): Element {
  const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
  return elements[Math.floor(Math.random() * elements.length)];
}

/**
 * 随机获取一个武器类别
 */
function getRandomWeaponCategory(): WeaponCategory {
  const weapons: WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'];
  return weapons[Math.floor(Math.random() * weapons.length)];
}

// ============================================
// 格式化输出函数
// ============================================

/**
 * 格式化克制关系描述
 * @param result 克制结果
 * @param attackerName 攻击方名称
 * @param defenderName 防御方名称
 * @returns 格式化的描述文本
 */
export function formatRestraintDescription(
  result: RestraintResult,
  attackerName: string,
  defenderName: string
): string {
  switch (result.restraintType) {
    case 'counter':
      return `${attackerName}克制${defenderName}！伤害+${Math.round((result.damageMultiplier - 1) * 100)}%`;
    case 'countered':
      return `${attackerName}被${defenderName}克制！伤害-${Math.round((1 - result.damageMultiplier) * 100)}%`;
    case 'mutual':
      return `光暗对决！双方伤害+20%`;
    default:
      return '';
  }
}

/**
 * 获取属性图标
 * @param element 元素属性
 * @returns 图标字符
 */
export function getElementIcon(element: Element | null): string {
  if (!element) return '';
  const icons: Record<Element, string> = {
    fire: '🔥',
    ice: '❄️',
    thunder: '⚡',
    wind: '🌪️',
    earth: '🌍',
    light: '✨',
    dark: '🌑',
  };
  return icons[element];
}

/**
 * 获取武器类别图标
 * @param category 武器类别
 * @returns 图标字符
 */
export function getWeaponCategoryIcon(category: WeaponCategory | null): string {
  if (!category) return '';
  const icons: Record<WeaponCategory, string> = {
    sword: '⚔️',
    blade: '🔪',
    fist: '👊',
    bow: '🏹',
    spear: '🔱',
  };
  return icons[category];
}
