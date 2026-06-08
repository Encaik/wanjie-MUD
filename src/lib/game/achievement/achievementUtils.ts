/**
 * 成就进度计算工具
 * 根据统计数据计算各成就的进度
 */

import { GameStatistics, AchievementStatus, AchievementType, AchievementDefinition } from '../types';
import { ACHIEVEMENTS } from '../../data/achievementData';

/**
 * 根据成就ID获取对应的统计数据值
 */
export function getStatisticValue(statistics: GameStatistics, achievementId: string): number {
  // 等级成就
  if (achievementId.startsWith('level_')) {
    return statistics.maxLevel;
  }
  
  // 战斗成就 - 击败敌人
  if (achievementId.startsWith('combat_enemies_')) {
    return statistics.totalEnemiesKilled;
  }
  
  // 战斗成就 - 击败Boss
  if (achievementId.startsWith('combat_boss_')) {
    return statistics.totalBossKilled;
  }
  
  // 收集成就 - 功法
  if (achievementId.startsWith('collection_technique_')) {
    return statistics.totalTechniquesCollected;
  }
  
  // 收集成就 - 装备
  if (achievementId.startsWith('collection_equipment_')) {
    return statistics.totalEquipmentsCollected;
  }
  
  // 探索成就
  if (achievementId.startsWith('exploration_')) {
    return statistics.totalAdventuresCompleted;
  }
  
  // 修炼成就 - 修炼次数
  if (achievementId.startsWith('cultivation_') && !achievementId.includes('breakthrough')) {
    return statistics.totalCultivations;
  }
  
  // 修炼成就 - 突破次数
  if (achievementId.startsWith('cultivation_breakthrough_')) {
    return statistics.totalBreakthroughs;
  }
  
  // 特殊成就 - 传说物品
  if (achievementId === 'special_first_legendary') {
    return statistics.legendaryItemsObtained;
  }
  
  // 特殊成就 - 全装备
  if (achievementId === 'special_full_equipment') {
    return statistics.hasFullEquipment ? 1 : 0;
  }
  
  // 特殊成就 - 功法满级
  if (achievementId === 'special_technique_max') {
    return statistics.maxLevelTechniques;
  }
  
  // 特殊成就 - 装备满级
  if (achievementId === 'special_equipment_max') {
    return statistics.maxLevelEquipments;
  }
  
  // ========== 扩展系统成就 ==========
  
  // 流派成就
  if (achievementId === 'path_select') {
    return statistics.pathSelected ? 1 : 0;
  }
  if (achievementId === 'path_level_5') {
    return statistics.pathLevel || 0;
  }
  if (achievementId === 'path_level_10') {
    return statistics.pathLevel || 0;
  }
  
  // 功法熟练度成就
  if (achievementId === 'proficiency_xiaocheng') {
    return statistics.techniqueProficiencyXiaocheng || 0;
  }
  if (achievementId === 'proficiency_dacheng') {
    return statistics.techniqueProficiencyDacheng || 0;
  }
  if (achievementId === 'proficiency_huajing') {
    return statistics.techniqueProficiencyHuajing || 0;
  }
  
  // 羁绊成就
  if (achievementId === 'bond_first') {
    return statistics.bondsActivated || 0;
  }
  if (achievementId === 'bond_level3') {
    return statistics.bondLevel3Activated ? 1 : 0;
  }
  
  // 装备强化成就
  if (achievementId === 'enhance_5') {
    return statistics.maxEnhancementLevel || 0;
  }
  if (achievementId === 'enhance_10') {
    return statistics.maxEnhancementLevel || 0;
  }
  
  // 势力声望成就
  if (achievementId === 'faction_join') {
    return statistics.factionJoined ? 1 : 0;
  }
  if (achievementId === 'reputation_friendly') {
    return statistics.reputationFriendly ? 1 : 0;
  }
  if (achievementId === 'reputation_honored') {
    return statistics.reputationHonored ? 1 : 0;
  }
  if (achievementId === 'reputation_exalted') {
    return statistics.reputationExalted ? 1 : 0;
  }
  
  return 0;
}

/**
 * 计算所有成就的状态
 * 根据统计数据实时判断成就是否满足解锁条件
 */
export function calculateAllAchievementStatuses(
  statistics: GameStatistics,
  unlockedIds: string[],
  claimedIds: string[]
): AchievementStatus[] {
  return ACHIEVEMENTS.map(definition => {
    const progress = getStatisticValue(statistics, definition.id);
    // 判断是否满足解锁条件：进度 >= 目标
    const meetsCondition = progress >= definition.target;
    // 已解锁：要么已经在解锁列表中，要么满足解锁条件
    const unlocked = unlockedIds.includes(definition.id) || meetsCondition;
    const claimed = claimedIds.includes(definition.id);
    
    return {
      achievementId: definition.id,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
      progress,
      target: definition.target,
      // 额外信息，用于UI显示
      claimed,
      // 可领取：满足解锁条件 且 未领取
      canClaim: meetsCondition && !claimed,
    } as AchievementStatus & { claimed: boolean; canClaim: boolean };
  });
}

/**
 * 检查是否有新解锁的成就
 */
export function checkNewAchievements(
  statistics: GameStatistics,
  unlockedIds: string[]
): string[] {
  const newlyUnlocked: string[] = [];
  
  for (const definition of ACHIEVEMENTS) {
    if (unlockedIds.includes(definition.id)) continue;
    
    const progress = getStatisticValue(statistics, definition.id);
    if (progress >= definition.target) {
      newlyUnlocked.push(definition.id);
    }
  }
  
  return newlyUnlocked;
}

/**
 * 获取成就进度百分比
 */
export function getAchievementProgress(status: AchievementStatus): number {
  return Math.min((status.progress / status.target) * 100, 100);
}

/**
 * 按类型分组成就状态
 */
export function groupAchievementsByType(
  statuses: AchievementStatus[]
): Record<AchievementType, AchievementStatus[]> {
  const result: Record<AchievementType, AchievementStatus[]> = {
    level: [],
    combat: [],
    collection: [],
    exploration: [],
    cultivation: [],
    special: [],
  };
  
  for (const status of statuses) {
    const definition = ACHIEVEMENTS.find(a => a.id === status.achievementId);
    if (definition) {
      result[definition.type].push(status);
    }
  }
  
  return result;
}
