/**
 * 契合系统
 * 
 * 实现功法-武器的双向契合加成计算
 * 
 * 契合规则：
 * - 功法契合武器：装备指定类型武器时，功法威力+15%
 * - 武器契合元素：使用指定元素功法时，伤害+15%
 * - 双向契合：同时满足时，额外+10%（总计+40%）
 */

import { Technique, Equipment } from './types';
import { Element, WeaponCategory } from './restraintSystem';

// ============================================
// 类型定义
// ============================================

/** 契合加成结果 */
export interface CompatibilityBonus {
  /** 功法加成（功法契合武器） */
  techniqueBonus: number;
  /** 武器加成（武器契合元素） */
  weaponBonus: number;
  /** 双向契合加成 */
  dualBonus: number;
  /** 总加成 */
  total: number;
  /** 详细描述 */
  details: string[];
}

/** 契合检查结果 */
export interface CompatibilityCheck {
  /** 功法是否契合武器 */
  techniqueMatchesWeapon: boolean;
  /** 武器是否契合功法元素 */
  weaponMatchesElement: boolean;
  /** 是否双向契合 */
  isDualCompatibility: boolean;
}

// ============================================
// 核心计算函数
// ============================================

/**
 * 计算契合加成
 * 
 * @param technique 功法对象
 * @param weapon 武器对象（可为null）
 * @returns 契合加成详情
 */
export function calculateCompatibilityBonus(
  technique: Technique,
  weapon: Equipment | null
): CompatibilityBonus {
  const result: CompatibilityBonus = {
    techniqueBonus: 0,
    weaponBonus: 0,
    dualBonus: 0,
    total: 0,
    details: [],
  };
  
  // 残本/残片不计算契合
  if (technique.isFragment || (weapon && weapon.isFragment)) {
    result.details.push('残本/残片不计算契合加成');
    return result;
  }
  
  if (!weapon) {
    result.details.push('未装备武器，无契合加成');
    return result;
  }
  
  // 功法契合武器检查
  if (technique.compatibleWeapon && weapon.weaponCategory === technique.compatibleWeapon) {
    result.techniqueBonus = technique.compatibleBonus;
    result.details.push(
      `功法契合【${getWeaponCategoryName(technique.compatibleWeapon)}】：+${Math.round(technique.compatibleBonus * 100)}%`
    );
  }
  
  // 武器契合元素检查
  if (weapon.compatibleElement && technique.element === weapon.compatibleElement) {
    result.weaponBonus = weapon.compatibleBonus;
    result.details.push(
      `武器契合【${getElementName(technique.element)}】：+${Math.round(weapon.compatibleBonus * 100)}%`
    );
  }
  
  // 双向契合检查
  if (result.techniqueBonus > 0 && result.weaponBonus > 0) {
    result.dualBonus = 0.10; // 额外10%
    result.details.push('双向契合：+10%');
  }
  
  result.total = result.techniqueBonus + result.weaponBonus + result.dualBonus;
  
  return result;
}

/**
 * 检查契合状态
 */
export function checkCompatibility(
  technique: Technique,
  weapon: Equipment | null
): CompatibilityCheck {
  const result: CompatibilityCheck = {
    techniqueMatchesWeapon: false,
    weaponMatchesElement: false,
    isDualCompatibility: false,
  };
  
  if (!weapon) return result;
  
  // 功法契合武器检查
  result.techniqueMatchesWeapon = 
    technique.compatibleWeapon !== null && 
    weapon.weaponCategory === technique.compatibleWeapon;
  
  // 武器契合元素检查
  result.weaponMatchesElement = 
    weapon.compatibleElement !== null && 
    technique.element === weapon.compatibleElement;
  
  // 双向契合
  result.isDualCompatibility = result.techniqueMatchesWeapon && result.weaponMatchesElement;
  
  return result;
}

/**
 * 获取功法对所有武器的契合评分
 */
export function getTechniqueWeaponScore(
  technique: Technique,
  weapon: Equipment | null
): number {
  if (!weapon) return 0;
  
  const bonus = calculateCompatibilityBonus(technique, weapon);
  return bonus.total;
}

/**
 * 获取武器对所有功法的契合评分
 */
export function getWeaponTechniqueScore(
  weapon: Equipment,
  technique: Technique
): number {
  const bonus = calculateCompatibilityBonus(technique, weapon);
  return bonus.total;
}

// ============================================
// 批量计算
// ============================================

/**
 * 批量计算功法与武器的契合矩阵
 */
export function calculateCompatibilityMatrix(
  techniques: Technique[],
  weapons: Equipment[]
): Map<string, Map<string, CompatibilityBonus>> {
  const matrix = new Map<string, Map<string, CompatibilityBonus>>();
  
  for (const technique of techniques) {
    if (technique.isFragment) continue;
    
    const weaponMap = new Map<string, CompatibilityBonus>();
    
    for (const weapon of weapons) {
      if (weapon.isFragment) continue;
      
      const bonus = calculateCompatibilityBonus(technique, weapon);
      weaponMap.set(weapon.id, bonus);
    }
    
    matrix.set(technique.id, weaponMap);
  }
  
  return matrix;
}

/**
 * 找到功法的最佳契合武器
 */
export function findBestWeaponForTechnique(
  technique: Technique,
  weapons: Equipment[]
): { weapon: Equipment | null; bonus: CompatibilityBonus } {
  let bestWeapon: Equipment | null = null;
  let bestBonus: CompatibilityBonus = {
    techniqueBonus: 0,
    weaponBonus: 0,
    dualBonus: 0,
    total: 0,
    details: [],
  };
  
  for (const weapon of weapons) {
    if (weapon.isFragment) continue;
    
    const bonus = calculateCompatibilityBonus(technique, weapon);
    
    if (bonus.total > bestBonus.total) {
      bestWeapon = weapon;
      bestBonus = bonus;
    }
  }
  
  return { weapon: bestWeapon, bonus: bestBonus };
}

/**
 * 找到武器的最佳契合功法
 */
export function findBestTechniqueForWeapon(
  weapon: Equipment,
  techniques: Technique[]
): { technique: Technique | null; bonus: CompatibilityBonus } {
  let bestTechnique: Technique | null = null;
  let bestBonus: CompatibilityBonus = {
    techniqueBonus: 0,
    weaponBonus: 0,
    dualBonus: 0,
    total: 0,
    details: [],
  };
  
  for (const technique of techniques) {
    if (technique.isFragment) continue;
    
    const bonus = calculateCompatibilityBonus(technique, weapon);
    
    if (bonus.total > bestBonus.total) {
      bestTechnique = technique;
      bestBonus = bonus;
    }
  }
  
  return { technique: bestTechnique, bonus: bestBonus };
}

// ============================================
// 辅助函数
// ============================================

/** 获取元素名称 */
function getElementName(element: Element | null): string {
  if (!element) return '无';
  const names: Record<Element, string> = {
    fire: '火',
    ice: '冰',
    thunder: '雷',
    wind: '风',
    earth: '土',
    light: '光',
    dark: '暗',
  };
  return names[element] || element;
}

/** 获取武器类别名称 */
function getWeaponCategoryName(category: WeaponCategory | null): string {
  if (!category) return '无';
  const names: Record<WeaponCategory, string> = {
    sword: '剑',
    blade: '刀',
    fist: '拳',
    bow: '弓',
    spear: '枪',
  };
  return names[category] || category;
}

// ============================================
// 推荐系统
// ============================================

/** 装备推荐 */
export interface EquipmentRecommendation {
  /** 功法ID */
  techniqueId: string;
  /** 功法名称 */
  techniqueName: string;
  /** 推荐武器 */
  recommendedWeapon: Equipment | null;
  /** 契合加成 */
  bonus: CompatibilityBonus;
  /** 推荐理由 */
  reason: string;
}

/**
 * 生成装备推荐
 */
export function generateEquipmentRecommendations(
  techniques: Technique[],
  weapons: Equipment[]
): EquipmentRecommendation[] {
  const recommendations: EquipmentRecommendation[] = [];
  
  for (const technique of techniques) {
    if (technique.isFragment) continue;
    
    const { weapon, bonus } = findBestWeaponForTechnique(technique, weapons);
    
    let reason = '';
    if (bonus.dualBonus > 0) {
      reason = '双向契合，获得最高加成';
    } else if (bonus.techniqueBonus > 0) {
      reason = `功法契合武器类型`;
    } else if (bonus.weaponBonus > 0) {
      reason = `武器契合功法元素`;
    } else {
      reason = '无特殊契合';
    }
    
    recommendations.push({
      techniqueId: technique.id,
      techniqueName: technique.name,
      recommendedWeapon: weapon,
      bonus,
      reason,
    });
  }
  
  // 按总加成排序
  recommendations.sort((a, b) => b.bonus.total - a.bonus.total);
  
  return recommendations;
}

// ============================================
// 导出辅助函数供外部使用
// ============================================

export { getElementName, getWeaponCategoryName };
