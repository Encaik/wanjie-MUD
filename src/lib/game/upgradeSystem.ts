/**
 * 升级系统
 * 处理功法和装备的升级逻辑
 */

import {
  Technique,
  Equipment,
  ItemRarity,
  UpgradeMaterial,
  UPGRADE_CONFIG,
} from './types';

/**
 * 计算升到下一级所需的经验值
 */
export function getExpToNextLevel(level: number): number {
  return Math.floor(
    UPGRADE_CONFIG.baseExpRequired * 
    Math.pow(UPGRADE_CONFIG.expMultiplier, level - 1)
  );
}

/**
 * 计算物品作为材料时提供的经验值
 * 公式：基础经验 + 等级加成 + 稀有度加成
 */
export function getMaterialExpValue(
  level: number,
  rarity: ItemRarity
): number {
  const rarityMultiplier = UPGRADE_CONFIG.rarityExpMultiplier[rarity];
  return Math.floor(
    (UPGRADE_CONFIG.materialExpBase + level * UPGRADE_CONFIG.materialExpPerLevel) *
    rarityMultiplier
  );
}

/**
 * 将功法转换为升级材料
 */
export function techniqueToMaterial(technique: Technique): UpgradeMaterial {
  return {
    id: technique.id,
    name: technique.name,
    type: 'technique',
    rarity: technique.rarity,
    level: technique.level,
    exp: technique.exp,
    expValue: getMaterialExpValue(technique.level, technique.rarity),
  };
}

/**
 * 将装备转换为升级材料
 */
export function equipmentToMaterial(equipment: Equipment): UpgradeMaterial {
  return {
    id: equipment.id,
    name: equipment.name,
    type: 'equipment',
    rarity: equipment.rarity,
    level: equipment.level,
    exp: equipment.exp,
    expValue: getMaterialExpValue(equipment.level, equipment.rarity),
  };
}

/**
 * 计算升级后的属性增长
 */
export function calculateUpgradeBonus(
  currentLevel: number,
  rarity: ItemRarity
): { powerBonus: number; bonusIncrease: number } {
  // 每升一级，威力和加成都会增加
  const rarityMultiplier = {
    '普通': 1,
    '稀有': 1.2,
    '史诗': 1.5,
    '传说': 2,
    '神话': 2.5,
  }[rarity];
  
  return {
    powerBonus: Math.floor(5 * rarityMultiplier),
    bonusIncrease: Math.floor(1 * rarityMultiplier),
  };
}

/**
 * 执行功法升级
 * 返回升级后的功法和是否升级成功
 */
export function upgradeTechnique(
  technique: Technique,
  materialExp: number
): { technique: Technique; levelsGained: number } {
  let newExp = technique.exp + materialExp;
  let newLevel = technique.level;
  let levelsGained = 0;
  
  // 计算能升多少级
  while (newLevel < UPGRADE_CONFIG.maxLevel) {
    const expNeeded = getExpToNextLevel(newLevel);
    if (newExp >= expNeeded) {
      newExp -= expNeeded;
      newLevel++;
      levelsGained++;
    } else {
      break;
    }
  }
  
  // 如果已经满级，经验值不再增加
  if (newLevel >= UPGRADE_CONFIG.maxLevel) {
    newExp = 0;
  }
  
  // 计算属性增长
  const totalBonus = calculateUpgradeBonus(technique.level, technique.rarity);
  
  return {
    technique: {
      ...technique,
      level: newLevel,
      exp: newExp,
      power: technique.power + totalBonus.powerBonus * levelsGained,
      bonus: technique.bonus + totalBonus.bonusIncrease * levelsGained,
    },
    levelsGained,
  };
}

/**
 * 执行装备升级
 * 返回升级后的装备和升级了多少级
 */
export function upgradeEquipment(
  equipment: Equipment,
  materialExp: number
): { equipment: Equipment; levelsGained: number } {
  let newExp = equipment.exp + materialExp;
  let newLevel = equipment.level;
  let levelsGained = 0;
  
  // 计算能升多少级
  while (newLevel < UPGRADE_CONFIG.maxLevel) {
    const expNeeded = getExpToNextLevel(newLevel);
    if (newExp >= expNeeded) {
      newExp -= expNeeded;
      newLevel++;
      levelsGained++;
    } else {
      break;
    }
  }
  
  // 如果已经满级，经验值不再增加
  if (newLevel >= UPGRADE_CONFIG.maxLevel) {
    newExp = 0;
  }
  
  // 计算属性增长
  const totalBonus = calculateUpgradeBonus(equipment.level, equipment.rarity);
  
  return {
    equipment: {
      ...equipment,
      level: newLevel,
      exp: newExp,
      power: equipment.power + totalBonus.powerBonus * levelsGained,
      attackBonus: equipment.attackBonus + 
        (equipment.attackBonus > 0 ? totalBonus.bonusIncrease * levelsGained : 0),
      defenseBonus: equipment.defenseBonus + 
        (equipment.defenseBonus > 0 ? totalBonus.bonusIncrease * levelsGained : 0),
    },
    levelsGained,
  };
}

/**
 * 获取升级进度信息
 */
export function getUpgradeProgress(
  level: number,
  exp: number
): { current: number; required: number; percentage: number } {
  if (level >= UPGRADE_CONFIG.maxLevel) {
    return { current: 0, required: 0, percentage: 100 };
  }
  const required = getExpToNextLevel(level);
  return {
    current: exp,
    required,
    percentage: Math.min(100, Math.floor((exp / required) * 100)),
  };
}
