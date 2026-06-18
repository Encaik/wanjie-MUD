/**
 * 存档迁移工具
 * 管理游戏存档的版本和兼容性
 */

// 存档版本号
export const SAVE_VERSION = 1;

// 默认统计数据
const DEFAULT_STATISTICS = {
  totalGameTime: 0,
  totalCultivationTime: 0,
  totalBattles: 0,
  totalVictories: 0,
  totalDefeats: 0,
  totalAscensions: 0,
  totalItemsGained: 0,
  totalItemsUsed: 0,
  totalSpiritStonesGained: 0,
  totalSpiritStonesSpent: 0,
  totalTechniquesLearned: 0,
  totalEquipmentsAcquired: 0,
  totalFactionChanges: 0,
  totalSecretRealmVisits: 0,
  totalSpecialEvents: 0,
  collectedTechniqueNames: [] as string[],
  collectedEquipmentNames: [] as string[],
  collectedMaterialNames: [] as string[],
  collectedTechniqueTiers: {} as Record<string, number>,
  collectedEquipmentTiers: {} as Record<string, number>,
  totalTechniquesCollected: 0,
  totalEquipmentsCollected: 0,
  totalMaterialsCollected: 0,
  longestStreak: 0,
  currentStreak: 0,
  peakRealm: '',
  peakAge: 0,
  peakTechniqueCount: 0,
  peakEquipmentCount: 0,
  fastestAscension: 0,
  fastestRealmBreakthrough: 0,
};

/**
 * 迁移主角数据（从旧存档兼容）
 */
export function migrateProtagonist(protagonist: Record<string, unknown>): Record<string, unknown> {
  const techniques = (protagonist.techniques || []) as Array<Record<string, unknown>>;
  const equipments = (protagonist.equipments || []) as Array<Record<string, unknown>>;
  
  return {
    ...protagonist,
    techniques: techniques.map((t) => ({
      ...t,
      proficiency: t.proficiency ?? 0,
      usageCount: t.usageCount ?? 0,
      essence: t.essence ?? null,
      // 确保法技系统字段存在
      skillSlots: t.skillSlots ?? 1,
      maxSkillSlots: t.maxSkillSlots ?? 3,
      allSkills: t.allSkills ?? [],
      equippedSkills: t.equippedSkills ?? [],
      // 确保契合系统字段存在
      compatibleWeapon: t.compatibleWeapon ?? null,
      compatibleBonus: t.compatibleBonus ?? 0.1,
    })),
    equippedAttackTechniques: protagonist.equippedAttackTechniques || [null, null, null],
    equippedDefenseTechniques: protagonist.equippedDefenseTechniques || [null, null, null],
    equipments: equipments.map((e) => ({
      ...e,
      enhancement: e.enhancement ?? 0,
      refinement: e.refinement ?? 0,
      affixes: e.affixes ?? [],
      setId: e.setId ?? null,
      // 确保斗技系统字段存在
      techniqueSlots: e.techniqueSlots ?? (e.slot === 'melee' || e.slot === 'ranged' ? 1 : 0),
      maxTechniqueSlots: e.maxTechniqueSlots ?? 3,
      allTechniques: e.allTechniques ?? [],
      equippedTechniques: e.equippedTechniques ?? [],
      // 确保契合系统字段存在
      compatibleElement: e.compatibleElement ?? null,
      compatibleBonus: e.compatibleBonus ?? 0.1,
      // 确保武器类型字段存在
      weaponCategory: e.weaponCategory ?? null,
      element: e.element ?? null,
    })),
    equippedMelee: protagonist.equippedMelee || null,
    equippedRanged: protagonist.equippedRanged || null,
    equippedHead: protagonist.equippedHead || null,
    equippedBody: protagonist.equippedBody || null,
    equippedLegs: protagonist.equippedLegs || null,
    equippedFeet: protagonist.equippedFeet || null,
    factionId: protagonist.factionId || null,
  };
}

/**
 * 迁移统计数据
 */
export function migrateStatistics(parsed: Record<string, unknown>): Record<string, unknown> {
  const statistics = { ...DEFAULT_STATISTICS };
  
  // 从旧的成就/图鉴数据迁移
  const achievements = (parsed.achievements || []) as Array<{ achievementId?: string; unlocked?: boolean }>;
  achievements.forEach((a) => {
    if (a.unlocked && a.achievementId) {
      parsed.unlockedAchievementIds = parsed.unlockedAchievementIds || [];
      if (!(parsed.unlockedAchievementIds as string[]).includes(a.achievementId)) {
        (parsed.unlockedAchievementIds as string[]).push(a.achievementId);
      }
    }
  });
  
  const collectionStatus = parsed.collectionStatus as Record<string, unknown> | undefined;
  if (collectionStatus) {
    statistics.collectedTechniqueNames = (collectionStatus.techniqueNames as string[]) || [];
    statistics.collectedEquipmentNames = (collectionStatus.equipmentNames as string[]) || [];
    statistics.totalTechniquesCollected = (collectionStatus.techniqueNames as string[])?.length || 0;
    statistics.totalEquipmentsCollected = (collectionStatus.equipmentNames as string[])?.length || 0;
  }
  
  // 处理数组类型
  const handleArrayField = (field: unknown): string[] => {
    if (!field) return [];
    if (field instanceof Set) return Array.from(field);
    if (Array.isArray(field)) return field;
    return [];
  };
  
  const stats = (parsed.statistics || {}) as Record<string, unknown>;
  statistics.collectedTechniqueNames = handleArrayField(stats.collectedTechniqueNames);
  statistics.collectedEquipmentNames = handleArrayField(stats.collectedEquipmentNames);
  
  return statistics;
}

/**
 * V3 迁移：将旧 CharacterStats (base/growth 含中文 key) 转为新格式
 *
 * 旧格式: { base: { 体质: 50, 灵根: 50, ... }, growth: { 体质: 0, ... } }
 * 新格式: { attributes: Record<string, number>, coreStats: Record<CoreStatKey, number> }
 *
 * 旧属性 key → 新 attribute key 映射（需要世界观上下文来决定具体映射，这里使用默认修仙映射）
 */
const OLD_TO_NEW_ATTR_MAP: Record<string, string> = {
  '体质': 'constitution',
  '灵根': 'spiritRoot',
  '悟性': 'insight',
  '幸运': 'luck',
  '意志': 'willpower',
};

/**
 * 迁移旧 CharacterStats 到 V3 属性格式
 */
export function migrateCharacterStatsToV3(oldStats: {
  base?: Record<string, number>;
  growth?: Record<string, number>;
}): { attributes: Record<string, number>; coreStats: Record<string, number> } {
  const attributes: Record<string, number> = {};

  if (oldStats.base) {
    for (const [oldKey, value] of Object.entries(oldStats.base)) {
      const newKey = OLD_TO_NEW_ATTR_MAP[oldKey] || oldKey;
      attributes[newKey] = (attributes[newKey] || 0) + value;
    }
  }
  if (oldStats.growth) {
    for (const [oldKey, value] of Object.entries(oldStats.growth)) {
      const newKey = OLD_TO_NEW_ATTR_MAP[oldKey] || oldKey;
      attributes[newKey] = (attributes[newKey] || 0) + value;
    }
  }

  // 旧存档没有存储 coreStats，设为空（运行时通过 calculateCoreStats 重新计算）
  return { attributes, coreStats: {} };
}

/** 更新存档版本号 */
export const SAVE_VERSION_V3 = 2;

/** 最新存档版本号（统一任务系统） */
export const SAVE_VERSION_V4 = 3;

// ============================================
// QuestState 迁移（v3 → v4 统一任务系统）
// ============================================

/**
 * 将旧版任务状态迁移到统一 QuestState
 *
 * 旧存档可能包含：
 * - questState (旧字段名: completedQuests, claimedRewards)
 * - taskSystems (AllTaskSystemsState 面板格式)
 * - tutorialState (TutorialState 引导格式)
 *
 * 全部合并到新的统一 QuestState 格式。
 */
export function migrateQuestState(parsed: Record<string, unknown>): Record<string, unknown> {
  // 如果已经是新格式（有 completedQuestIds），直接返回
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingQS = parsed['questState'] as Record<string, any> | undefined;
  if (parsed['completedQuestIds'] !== undefined || existingQS?.['completedQuestIds'] !== undefined) {
    return parsed;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldQuestState = (parsed['questState'] as Record<string, any>) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskSystems = (parsed['taskSystems'] as Record<string, any>) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tutorialState = (parsed['tutorialState'] as Record<string, any>) ?? {};

  // 合并已完成任务 ID
  const completedQuestIds: string[] = [
    ...(Array.isArray(oldQuestState['completedQuests']) ? oldQuestState['completedQuests'] : []),
    ...collectTaskSystemCompletedIds(taskSystems),
  ];

  // 合并已领取奖励任务 ID
  const claimedQuestIds: string[] = [
    ...(Array.isArray(oldQuestState['claimedRewards']) ? oldQuestState['claimedRewards'] : []),
    ...collectTaskSystemClaimedIds(taskSystems),
  ];

  // 迁移故事线已完成节点
  const storyCompletedNodeIds: string[] = migrateTutorialNodes(tutorialState);

  // 迁移板块槽位
  const boardSlots: Record<string, unknown> = {};
  const boardLastRefresh: Record<string, number> = {};

  for (const [systemType, systemState] of Object.entries(taskSystems)) {
    const state = systemState as Record<string, unknown>;
    if (state['completedTaskIds'] && Array.isArray(state['completedTaskIds'])) {
      boardSlots[systemType] = {
        questIds: state['completedTaskIds'] as string[],
        lastRefresh: (state['lastRefreshTime'] as number) ?? 0,
      };
      boardLastRefresh[systemType] = (state['lastRefreshTime'] as number) ?? 0;
    }
  }

  return {
    ...parsed,
    questState: {
      activeQuests: oldQuestState['activeQuests'] ?? {},
      completedQuestIds,
      claimedQuestIds,
      acceptedTimestamps: {},
      completedTimestamps: {},
      boardSlots,
      boardLastRefresh,
      storyCompletedNodeIds,
      stageHistory: oldQuestState['stageHistory'] ?? {},
    },
    // 保留旧字段用于回溯兼容（标记为弃用）
    taskSystems: parsed['taskSystems'],
    tutorialState: parsed['tutorialState'],
  };
}

/** 从旧 taskSystems 收集已完成任务 ID */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectTaskSystemCompletedIds(taskSystems: Record<string, any>): string[] {
  const ids: string[] = [];
  for (const systemState of Object.values(taskSystems)) {
    if (systemState['completedTaskIds'] && Array.isArray(systemState['completedTaskIds'])) {
      ids.push(...systemState['completedTaskIds']);
    }
  }
  return ids;
}

/** 从旧 taskSystems 收集已领取任务 ID */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectTaskSystemClaimedIds(taskSystems: Record<string, any>): string[] {
  const ids: string[] = [];
  for (const systemState of Object.values(taskSystems)) {
    if (systemState['claimedTaskIds'] && Array.isArray(systemState['claimedTaskIds'])) {
      ids.push(...systemState['claimedTaskIds']);
    }
  }
  return ids;
}

/** 将旧 tutorialState 的步骤 ID 映射为故事线节点 ID */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTutorialNodes(tutorialState: Record<string, any>): string[] {
  const nodeIds: string[] = [];

  // 教程步骤到故事线节点的映射
  const STEP_TO_NODE: Record<string, string> = {
    'step_welcome': 'tnode_welcome',
    'step_use_pill': 'tnode_use_pill',
    'step_first_cultivation': 'tnode_first_cultivation',
    'step_enter_adventure': 'tnode_enter_adventure',
    'step_first_kill': 'tnode_first_kill',
    'step_reach_level_3': 'tnode_reach_level_3',
    'step_join_faction': 'tnode_join_faction',
    'step_complete_adventure': 'tnode_complete_adventure',
    'step_claim_achievement': 'tnode_claim_achievement',
  };

  const completedSteps = tutorialState['completedStepIds'] as string[] | undefined;
  if (completedSteps) {
    for (const stepId of completedSteps) {
      const nodeId = STEP_TO_NODE[stepId];
      if (nodeId) nodeIds.push(nodeId);
    }
  }

  const completedPhases = tutorialState['completedPhaseIds'] as string[] | undefined;
  if (completedPhases) {
    for (const phaseId of completedPhases) {
      nodeIds.push(phaseId);
    }
  }

  return nodeIds;
}

export { DEFAULT_STATISTICS };
