/**
 * 存档迁移与兼容处理模块
 * 负责处理旧版本存档的兼容性和数据迁移
 * 
 * 修复 P2-002：添加运行时类型守卫验证
 */

import { GameState } from './types';
import { 
  DEFAULT_PROTAGONIST_EXTENSION, 
  DEFAULT_TECHNIQUE_EXTENSION, 
  DEFAULT_EQUIPMENT_EXTENSION,
  TechniqueExtension,
  EquipmentExtension,
} from './typesExtension';
import { 
  toArray,
  getPropertyOrDefault,
  isObject,
  isNumber,
  isString,
  isTechnique,
  isEquipment,
  isArray,
} from './typeGuards';
import { GAME_CONSTANTS } from './constants';
import { Technique, Equipment, DEFAULT_STATISTICS } from './types';

/**
 * 存档迁移版本号
 */
const MIGRATION_VERSION = 2;

/**
 * 存档迁移接口
 */
interface SaveData {
  phase?: string;
  protagonist?: unknown;
  lastExploreTime?: number;
  adventureLoot?: unknown[];
  statistics?: unknown;
  achievements?: unknown[];
  collectionStatus?: unknown;
  timeSystem?: unknown;
  unlockedAchievementIds?: unknown[];
  claimedAchievementIds?: unknown[];
  ascensionFlow?: unknown;
  [key: string]: unknown;
}

/**
 * 迁移任务定义
 */
interface MigrationTask {
  version: number;
  migrate: (data: SaveData) => SaveData;
}

/**
 * 迁移任务列表（按版本顺序执行）
 */
const migrationTasks: MigrationTask[] = [
  {
    version: 1,
    migrate: migrateFromV0ToV1,
  },
  {
    version: 2,
    migrate: migrateFromV1ToV2,
  },
];

/**
 * V1 -> V2 迁移：属性系统重构
 * 扁平结构 -> 嵌套结构（base + growth）
 */
function migrateFromV1ToV2(data: SaveData): SaveData {
  if (!data.protagonist) return data;
  
  if (!isObject(data.protagonist)) {
    return data;
  }
  
  const p = data.protagonist as Record<string, unknown>;
  
  // ========================================
  // 属性系统迁移：扁平结构 -> 嵌套结构
  // ========================================
  if (p.stats) {
    const stats = p.stats as Record<string, unknown>;
    // 检查是否为旧格式（扁平结构，直接包含体质等属性）
    if (!('base' in stats) || !('growth' in stats)) {
      // 迁移到新格式
      const baseStats = {
        体质: (stats.体质 as number) || 50,
        灵根: (stats.灵根 as number) || 50,
        悟性: (stats.悟性 as number) || 50,
        幸运: (stats.幸运 as number) || 50,
        意志: (stats.意志 as number) || 50,
      };
      p.stats = {
        base: baseStats,
        growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
      };
      console.log('[存档迁移] stats 已从扁平结构迁移到嵌套结构');
    }
  }
  
  // 碎片系统迁移：旧格式（按稀有度计数） -> 新格式（数组）
  if (p.fragmentInventory) {
    const fi = p.fragmentInventory as Record<string, unknown>;
    if (fi.techniqueFragments && typeof fi.techniqueFragments === 'object' && !Array.isArray(fi.techniqueFragments)) {
      // 旧格式，重置为新格式
      p.fragmentInventory = {
        techniqueFragments: [],
        equipmentFragments: [],
      };
      console.log('[存档迁移] fragmentInventory 已迁移到新格式');
    }
  }
  
  return data;
}

/**
 * V0 -> V1 迁移：添加所有扩展字段
 * 使用类型守卫进行运行时验证（修复 P2-002）
 */
function migrateFromV0ToV1(data: SaveData): SaveData {
  if (!data.protagonist) return data;
  
  // 使用类型守卫验证 protagonist 是否为对象
  if (!isObject(data.protagonist)) {
    console.warn('[存档迁移] protagonist 不是有效对象，跳过迁移');
    return data;
  }
  
  const p = data.protagonist as Record<string, unknown>;
  
  // 基础字段兼容
  const techniques = toArray<unknown>(p.techniques || []);
  // 使用类型守卫过滤有效的功法
  p.techniques = techniques.filter(isTechnique);
  
  // 多功法槽位
  if (!p.equippedAttackTechniques) {
    p.equippedAttackTechniques = [null, null, null];
  }
  if (!p.equippedDefenseTechniques) {
    p.equippedDefenseTechniques = [null, null, null];
  }
  
  // 装备系统兼容
  const equipments = toArray<unknown>(p.equipments || []);
  // 使用类型守卫过滤有效的装备
  p.equipments = equipments.filter(isEquipment);
  p.equippedMelee = p.equippedMelee ?? null;
  p.equippedRanged = p.equippedRanged ?? null;
  p.equippedHead = p.equippedHead ?? null;
  p.equippedBody = p.equippedBody ?? null;
  p.equippedLegs = p.equippedLegs ?? null;
  p.equippedFeet = p.equippedFeet ?? null;
  
  // 势力系统兼容
  p.factionId = p.factionId ?? null;
  
  // 功法扩展字段兼容（熟练度）
  p.techniques = (p.techniques as Technique[]).map((t: Technique & Partial<TechniqueExtension>) => ({
    ...t,
    proficiency: t.proficiency ?? 0,
    usageCount: t.usageCount ?? 0,
    essence: t.essence ?? null,
  }));
  
  // 装备扩展字段兼容（词缀/强化）
  p.equipments = (p.equipments as Equipment[]).map((e) => ({
    ...e,
    enhancement: e.enhancement ?? 0,
    refinement: e.refinement ?? 0,
    affixes: e.affixes ?? [],
    setId: e.setId ?? null,
  }));
  
  // 统计数据兼容
  if (!data.statistics) {
    data.statistics = { ...DEFAULT_STATISTICS };
  }
  
  // 从旧的成就/图鉴数据迁移
  if (data.achievements) {
    const achievements = toArray<{ achievementId?: string; unlocked?: boolean }>(data.achievements);
    achievements.forEach((a) => {
      if (a.unlocked && a.achievementId) {
        data.unlockedAchievementIds = data.unlockedAchievementIds || [];
        if (!data.unlockedAchievementIds.includes(a.achievementId)) {
          data.unlockedAchievementIds.push(a.achievementId);
        }
      }
    });
  }
  
  if (data.collectionStatus) {
    const cs = data.collectionStatus as Record<string, unknown>;
    (data.statistics as Record<string, unknown>).collectedTechniqueNames = 
      toArray<string>(cs.techniqueNames || []);
    (data.statistics as Record<string, unknown>).collectedEquipmentNames = 
      toArray<string>(cs.equipmentNames || []);
    (data.statistics as Record<string, unknown>).totalTechniquesCollected = 
      toArray<string>(cs.techniqueNames || []).length;
    (data.statistics as Record<string, unknown>).totalEquipmentsCollected = 
      toArray<string>(cs.equipmentNames || []).length;
  }
  
  // 确保数组类型正确
  const stats = data.statistics as Record<string, unknown>;
  if (stats.collectedTechniqueNames && !Array.isArray(stats.collectedTechniqueNames)) {
    stats.collectedTechniqueNames = toArray<string>(stats.collectedTechniqueNames);
  }
  if (stats.collectedEquipmentNames && !Array.isArray(stats.collectedEquipmentNames)) {
    stats.collectedEquipmentNames = toArray<string>(stats.collectedEquipmentNames);
  }
  
  // 时间系统兼容与离线处理
  if (!data.timeSystem) {
    const protagonist = p;
    const baseAge = (protagonist.character as Record<string, unknown>)?.age || 16;
    data.timeSystem = {
      realTime: {
        exploreCooldown: data.lastExploreTime ? {
          startTime: data.lastExploreTime,
          duration: GAME_CONSTANTS.EXPLORE_COOLDOWN_MS,
        } : null,
      },
      gameTime: {
        age: baseAge,
        year: 1,
        month: 1,
        day: 1,
        hour: 0,
      },
    };
  }
  
  // 飞升流程兼容
  if (!data.ascensionFlow) {
    data.ascensionFlow = {
      phase: 'none',
      discoveredWorlds: [],
    };
  }
  
  // 碎片系统兼容（确保字段存在）
  if (!p.fragmentInventory) {
    p.fragmentInventory = {
      techniqueFragments: [],
      equipmentFragments: [],
    };
  }
  
  // 其他字段
  data.lastExploreTime = data.lastExploreTime || 0;
  data.adventureLoot = toArray(data.adventureLoot || []);
  data.adventureExperience = data.adventureExperience || 0; // 待结算经验值
  data.unlockedAchievementIds = toArray<string>(data.unlockedAchievementIds || []);
  data.claimedAchievementIds = toArray<string>(data.claimedAchievementIds || []);
  // 新手任务完成列表（新增字段）
  data.completedTutorialTaskIds = toArray<string>(data.completedTutorialTaskIds || []);
  // 新手难度机缘完成标记（新增字段）
  data.hasCompletedNoviceAdventure = data.hasCompletedNoviceAdventure ?? false;
  
  return data;
}

/**
 * 执行存档迁移
 * @param savedData - 从 localStorage 加载的原始数据
 * @returns 迁移后的数据
 */
export function migrateSaveData(savedData: SaveData): SaveData {
  if (!savedData || !savedData.phase) {
    return savedData;
  }
  
  // 获取存档版本（默认为 0）
  const saveVersion = (savedData._migrationVersion as number) || 0;
  
  // 执行所有需要的迁移
  let currentData = { ...savedData };
  for (const task of migrationTasks) {
    if (saveVersion < task.version) {
      console.log(`[存档迁移] 从 v${saveVersion} 迁移到 v${task.version}`);
      currentData = task.migrate(currentData);
      currentData._migrationVersion = task.version;
    }
  }
  
  return currentData;
}

/**
 * 迁移导入的存档数据（与 loadGameState 兼容）
 */
export function migrateImportedSave(state: GameState): GameState {
  // 确保数组类型正确
  if (!Array.isArray(state.statistics.collectedTechniqueNames)) {
    state.statistics.collectedTechniqueNames = toArray<string>(state.statistics.collectedTechniqueNames);
  }
  if (!Array.isArray(state.statistics.collectedEquipmentNames)) {
    state.statistics.collectedEquipmentNames = toArray<string>(state.statistics.collectedEquipmentNames);
  }
  
  state.unlockedAchievementIds = state.unlockedAchievementIds || [];
  state.claimedAchievementIds = state.claimedAchievementIds || [];
  
  return state;
}

/**
 * 获取当前迁移版本
 */
export function getMigrationVersion(): number {
  return MIGRATION_VERSION;
}

/**
 * 检查存档是否需要迁移
 */
export function needsMigration(savedData: SaveData): boolean {
  const saveVersion = (savedData._migrationVersion as number) || 0;
  return saveVersion < MIGRATION_VERSION;
}
