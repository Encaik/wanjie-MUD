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

export { DEFAULT_STATISTICS };
