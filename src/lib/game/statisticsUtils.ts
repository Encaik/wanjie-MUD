/**
 * 统计数据更新工具
 * 用于在游戏中实时更新统计数据
 */

import { GameStatistics } from './types';
import { Technique, Equipment, ItemRarity, Protagonist, EquipmentSlot } from './types';

/**
 * 创建默认统计数据
 */
export function createDefaultStatistics(): GameStatistics {
  return {
    maxLevel: 1,
    totalEnemiesKilled: 0,
    totalBossKilled: 0,
    totalEliteKilled: 0,
    totalTechniquesCollected: 0,
    totalEquipmentsCollected: 0,
    totalAdventuresCompleted: 0,
    clearedDifficulties: [], // 已通关的机缘难度等级列表
    totalCultivations: 0,
    totalBreakthroughs: 0,
    legendaryItemsObtained: 0,
    hasFullEquipment: false,
    maxLevelTechniques: 0,
    maxLevelEquipments: 0,
    collectedTechniqueNames: [],
    collectedEquipmentNames: [],
    // 扩展系统默认值
    pathSelected: false,
    pathLevel: 0,
    techniqueProficiencyXiaocheng: 0,
    techniqueProficiencyDacheng: 0,
    techniqueProficiencyHuajing: 0,
    bondsActivated: 0,
    bondLevel3Activated: false,
    maxEnhancementLevel: 0,
    factionJoined: false,
    reputationFriendly: false,
    reputationHonored: false,
    reputationExalted: false,
    achievementRewardsClaimed: 0,
    totalItemsUsed: 0,
    // 新增：势力任务相关统计默认值
    totalSpiritStonesGained: 0,
    totalSpiritStonesSpent: 0,
    totalMaterialsCollected: 0,
    totalFragmentsCollected: 0,
    totalEquipmentsCrafted: 0,
    totalTechniquesSynthesized: 0,
    totalContribution: 0,
    totalDonations: 0,
    totalSpiritStonesDonated: 0,
    totalFragmentsSynthesized: 0,
  };
}

/**
 * 更新统计数据
 */
export function updateGameStatistics(
  statistics: GameStatistics,
  update: Partial<GameStatistics>
): GameStatistics {
  return {
    ...statistics,
    ...update,
  };
}

/**
 * 更新等级统计
 */
export function updateLevelStats(
  statistics: GameStatistics,
  newLevel: number
): GameStatistics {
  return updateGameStatistics(statistics, {
    maxLevel: Math.max(statistics.maxLevel, newLevel),
  });
}

/**
 * 更新战斗统计
 */
export function updateCombatStats(
  statistics: GameStatistics,
  enemyTier?: 'normal' | 'elite' | 'miniboss' | 'boss'
): GameStatistics {
  const update: Partial<GameStatistics> = {
    totalEnemiesKilled: statistics.totalEnemiesKilled + 1,
  };
  
  if (enemyTier === 'boss') {
    update.totalBossKilled = statistics.totalBossKilled + 1;
  } else if (enemyTier === 'elite' || enemyTier === 'miniboss') {
    update.totalEliteKilled = statistics.totalEliteKilled + 1;
  }
  
  return updateGameStatistics(statistics, update);
}

/**
 * 更新收集统计（功法）
 */
export function updateTechniqueCollection(
  statistics: GameStatistics,
  technique: Technique
): GameStatistics {
  const names = statistics.collectedTechniqueNames;
  const isNew = !names.includes(technique.name);
  
  const update: Partial<GameStatistics> = {
    // 如果是新功法，增加计数
    totalTechniquesCollected: isNew 
      ? statistics.totalTechniquesCollected + 1 
      : statistics.totalTechniquesCollected,
    // 更新收集名称列表
    collectedTechniqueNames: isNew 
      ? [...names, technique.name] 
      : names,
  };
  
  // 如果是传说品质，增加传说计数
  if (technique.rarity === '传说') {
    update.legendaryItemsObtained = statistics.legendaryItemsObtained + 1;
  }
  
  // 如果功法达到满级
  if (technique.level >= 10) {
    update.maxLevelTechniques = statistics.maxLevelTechniques + 1;
  }
  
  return updateGameStatistics(statistics, update);
}

/**
 * 更新收集统计（装备）
 */
export function updateEquipmentCollection(
  statistics: GameStatistics,
  equipment: Equipment
): GameStatistics {
  const names = statistics.collectedEquipmentNames;
  const isNew = !names.includes(equipment.name);
  
  const update: Partial<GameStatistics> = {
    // 如果是新装备，增加计数
    totalEquipmentsCollected: isNew 
      ? statistics.totalEquipmentsCollected + 1 
      : statistics.totalEquipmentsCollected,
    // 更新收集名称列表
    collectedEquipmentNames: isNew 
      ? [...names, equipment.name] 
      : names,
  };
  
  // 如果是传说品质，增加传说计数
  if (equipment.rarity === '传说') {
    update.legendaryItemsObtained = statistics.legendaryItemsObtained + 1;
  }
  
  // 如果装备达到满级
  if (equipment.level >= 10) {
    update.maxLevelEquipments = statistics.maxLevelEquipments + 1;
  }
  
  return updateGameStatistics(statistics, update);
}

/**
 * 更新探索统计
 */
export function updateExplorationStats(
  statistics: GameStatistics
): GameStatistics {
  return updateGameStatistics(statistics, {
    totalAdventuresCompleted: statistics.totalAdventuresCompleted + 1,
  });
}

/**
 * 更新修炼统计
 */
export function updateCultivationStats(
  statistics: GameStatistics,
  breakthroughSuccess?: boolean
): GameStatistics {
  const update: Partial<GameStatistics> = {
    totalCultivations: statistics.totalCultivations + 1,
  };
  
  if (breakthroughSuccess) {
    update.totalBreakthroughs = statistics.totalBreakthroughs + 1;
  }
  
  return updateGameStatistics(statistics, update);
}

/**
 * 检查并更新装备槽位状态
 */
export function updateEquipmentSlotStatus(
  statistics: GameStatistics,
  protagonist: Protagonist
): GameStatistics {
  const slots: EquipmentSlot[] = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'];
  
  const hasFullEquipment = slots.every(slot => {
    switch (slot) {
      case 'melee': return protagonist.equippedMelee !== null;
      case 'ranged': return protagonist.equippedRanged !== null;
      case 'head': return protagonist.equippedHead !== null;
      case 'body': return protagonist.equippedBody !== null;
      case 'legs': return protagonist.equippedLegs !== null;
      case 'feet': return protagonist.equippedFeet !== null;
      default: return false;
    }
  });
  
  return updateGameStatistics(statistics, { hasFullEquipment });
}

/**
 * 检查装备槽位是否已满
 */
export function checkEquipmentSlotStatus(
  protagonist: Protagonist
): boolean {
  const slots: EquipmentSlot[] = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'];
  
  return slots.every(slot => {
    switch (slot) {
      case 'melee': return protagonist.equippedMelee !== null;
      case 'ranged': return protagonist.equippedRanged !== null;
      case 'head': return protagonist.equippedHead !== null;
      case 'body': return protagonist.equippedBody !== null;
      case 'legs': return protagonist.equippedLegs !== null;
      case 'feet': return protagonist.equippedFeet !== null;
      default: return false;
    }
  });
}

/**
 * 从主角数据初始化统计数据
 */
export function initializeStatisticsFromProtagonist(
  protagonist: Protagonist
): GameStatistics {
  // 收集所有功法名称（去重）
  const techniqueNames = [...new Set(protagonist.techniques.map(t => t.name))];
  
  // 收集所有装备名称（去重）
  const equipmentNames = [...new Set(protagonist.equipments.map(e => e.name))];
  
  // 统计传说品质物品
  const legendaryCount = [
    ...protagonist.techniques,
    ...protagonist.equipments
  ].filter(item => item.rarity === '传说').length;
  
  // 统计满级功法和装备
  const maxLevelTechniques = protagonist.techniques.filter(t => t.level >= 10).length;
  const maxLevelEquipments = protagonist.equipments.filter(e => e.level >= 10).length;
  
  // 检查装备槽位是否已满
  const hasFullEquipment = checkEquipmentSlotStatus(protagonist);
  
  return {
    maxLevel: protagonist.level,
    totalEnemiesKilled: 0,
    totalBossKilled: 0,
    totalEliteKilled: 0,
    totalTechniquesCollected: techniqueNames.length,
    totalEquipmentsCollected: equipmentNames.length,
    totalAdventuresCompleted: 0,
    clearedDifficulties: [], // 已通关的机缘难度等级列表
    totalCultivations: 0,
    totalBreakthroughs: 0,
    legendaryItemsObtained: legendaryCount,
    hasFullEquipment,
    maxLevelTechniques,
    maxLevelEquipments,
    collectedTechniqueNames: techniqueNames,
    collectedEquipmentNames: equipmentNames,
    // 扩展系统默认值
    pathSelected: !!protagonist.cultivationPath,
    pathLevel: protagonist.pathLevel ?? 0,
    techniqueProficiencyXiaocheng: 0,
    techniqueProficiencyDacheng: 0,
    techniqueProficiencyHuajing: 0,
    bondsActivated: 0,
    bondLevel3Activated: false,
    maxEnhancementLevel: Math.max(...protagonist.equipments.map(e => e.enhancement ?? 0), 0),
    factionJoined: !!protagonist.factionId,
    reputationFriendly: false,
    reputationHonored: false,
    reputationExalted: false,
    achievementRewardsClaimed: 0,
    totalItemsUsed: 0,
    // 新增：势力任务相关统计默认值
    totalSpiritStonesGained: 0,
    totalSpiritStonesSpent: 0,
    totalMaterialsCollected: 0,
    totalFragmentsCollected: 0,
    totalEquipmentsCrafted: 0,
    totalTechniquesSynthesized: 0,
    totalContribution: 0,
    totalDonations: 0,
    totalSpiritStonesDonated: 0,
    totalFragmentsSynthesized: 0,
  };
}

/**
 * 检查功法是否是新收集
 */
export function isNewTechnique(
  statistics: GameStatistics,
  techniqueName: string
): boolean {
  return !statistics.collectedTechniqueNames.includes(techniqueName);
}

/**
 * 检查装备是否是新收集
 */
export function isNewEquipment(
  statistics: GameStatistics,
  equipmentName: string
): boolean {
  return !statistics.collectedEquipmentNames.includes(equipmentName);
}

/**
 * 获取传说物品数量
 */
export function getLegendaryItemCount(
  statistics: GameStatistics
): number {
  return statistics.legendaryItemsObtained;
}

/**
 * 获取满级物品数量
 */
export function getMaxLevelItemCount(
  statistics: GameStatistics
): { techniques: number; equipments: number } {
  return {
    techniques: statistics.maxLevelTechniques,
    equipments: statistics.maxLevelEquipments,
  };
}

/**
 * 重置统计数据
 */
export function resetStatistics(): GameStatistics {
  return createDefaultStatistics();
}
