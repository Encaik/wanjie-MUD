/**
 * 游戏数值平衡配置文件
 * 所有核心数值公式和平衡参数都在这里统一管理
 * 基于世界数据进行计算，确保不同世界的数值体系一致
 */

import { WorldType, World, EnemyTier } from './types';
import { getWorldData, DIFFICULTY_MULTIPLIERS, DifficultyLevel, ENEMY_TIER_CONFIG, getEnemyTierConfig, getEffectiveEnemyTierConfig } from '../data/worldData';
import { clamp, clampNonNegative, safeDivide } from './utils/numberUtils';

// ============================================
// Boss倍率配置（已废弃，使用敌人分级系统）
// ============================================

/** Boss数值倍率 - 保留用于兼容 */
export const BOSS_MULTIPLIERS = {
  /** Boss HP倍率 */
  hpMultiplier: 2.2,
  /** Boss攻击力倍率 */
  attackMultiplier: 1.5,
  /** Boss防御力倍率 */
  defenseMultiplier: 1.6,
  /** Boss经验倍率 */
  expMultiplier: 6.0,
  /** Boss灵石倍率 */
  spiritStoneMultiplier: 5.0,
};

// ============================================
// 经验值配置
// ============================================

/** 经验值相关配置 */
export const EXPERIENCE_CONFIG = {
  /** 基础升级经验 */
  baseExpRequired: 100,
  /** 经验增长因子（指数增长） */
  expGrowthFactor: 1.18,
  
  /** 修炼获得经验基础值 */
  cultivationBaseExp: 8,
  /** 修炼经验随等级增长系数 */
  cultivationExpPerLevel: 0.5,
  /** 修炼消耗灵石基础值 */
  cultivationSpiritStoneCost: 10,
  
  /** 历练事件经验奖励范围（安全事件） */
  expEventSafe: [15, 25] as [number, number],
  /** 历练事件经验奖励范围（风险事件） */
  expEventRisky: [25, 40] as [number, number],
  /** 历练事件经验奖励范围（危险事件） */
  expEventDangerous: [40, 60] as [number, number],
  
  /** 战斗经验基础值（普通敌人） */
  battleExpBase: 20,
  /** 战斗经验每级增加 */
  battleExpPerLevel: 3,
};

// ============================================
// 战斗配置
// ============================================

/** 战斗相关配置 */
export const COMBAT_CONFIG = {
  /** 最大战斗回合数 */
  maxRounds: 20,
  
  /** 伤害随机浮动范围（±x%）- 普通攻击 */
  damageVariance: 0.15,
  
  /** 技能伤害浮动范围（±x%）- 技能攻击浮动更大 */
  skillDamageVariance: 0.20,
  
  /** 强力技能浮动范围（±x%）- 高伤害技能浮动最大 */
  powerfulSkillVariance: 0.25,
  
  /** 暴击率基础值 */
  baseCritRate: 0.05,
  /** 每点幸运增加的暴击率 */
  critRatePerLuck: 0.005,
  /** 最高暴击率 */
  maxCritRate: 0.35,
  
  /** 暴击伤害倍率 */
  critDamageMultiplier: 1.5,
  
  /** 闪避率基础值 */
  baseDodgeRate: 0.03,
  /** 每点幸运增加的闪避率 */
  dodgeRatePerLuck: 0.003,
  /** 最高闪避率 */
  maxDodgeRate: 0.25,
  
  /** 防御减伤公式：damage * (100 / (100 + defense)) */
  defenseReductionFactor: 100,
  
  /** 等级差距对伤害的影响系数（每级差距影响多少伤害比例）- 加强版 */
  levelDiffDamageFactor: 0.03,
  /** 最大等级差距伤害修正（±75%）- 扩大版 */
  maxLevelDiffModifier: 0.75,
  
  /** 单次伤害占目标HP的上限 - 防止一击必杀 */
  maxDamageRatioToHp: 0.6,
  /** Boss战的伤害上限修正（允许更高伤害） */
  bossDamageRatioModifier: 1.3,
  /** 暴击时的伤害上限修正 */
  critDamageRatioModifier: 1.2,
  
  /** 最低伤害比例（防止伤害过低，保证基础输出） */
  minimumDamageRatio: 0.15,
  
  /** 休息格恢复HP百分比 */
  restHealPercent: 0.3,
  /** 休息格恢复MP百分比 */
  restMpHealPercent: 0.2,
};

// ============================================
// 资源配置
// ============================================

/** 资源相关配置 */
export const RESOURCE_CONFIG = {
  /** 战斗获得灵石基础值（普通敌人） */
  spiritStoneBase: 15,
  /** 战斗获得灵石每级增加 */
  spiritStonePerLevel: 3,
};

// ============================================
// 突破配置
// ============================================

/** 突破相关配置 */
export const BREAKTHROUGH_CONFIG = {
  /** 基础突破成功率 */
  baseSuccessRate: 60,
  /** 每点幸运增加的成功率 */
  successRatePerLuck: 1,
  /** 每点悟性增加的成功率 */
  successRatePerInsight: 0.5,
  /** 最高基础成功率 */
  maxBaseSuccessRate: 85,
  /** 突破失败后属性损失范围 */
  statLossRange: [0, 1] as [number, number],
};

// ============================================
// 玩家数值计算（基于世界）
// ============================================

/**
 * 计算玩家最大HP
 * 公式：世界基础HP + 体质 * 世界HP/体质 + 等级 * 世界HP/等级
 */
export function calculatePlayerMaxHp(
  constitution: number,
  level: number,
  worldType: WorldType
): number {
  const worldData = getWorldData(worldType);
  return Math.floor(
    worldData.baseHp + 
    constitution * worldData.hpPerConstitution + 
    level * worldData.hpPerLevel
  );
}

/**
 * 计算玩家最大MP
 * 公式：基础MP + 灵根 * MP/灵根 + 等级 * MP/等级
 */
export function calculatePlayerMaxMp(
  spiritRoot: number,
  level: number,
  worldType: WorldType
): number {
  const worldData = getWorldData(worldType);
  // MP计算相对统一，不同世界差异不大
  const baseMp = 50;
  const mpPerSpiritRoot = 6;
  const mpPerLevel = 8;
  return Math.floor(baseMp + spiritRoot * mpPerSpiritRoot + level * mpPerLevel);
}

/**
 * 计算玩家攻击力
 * 公式：世界基础攻击 + 体质 * 世界攻击/体质 + 灵根 * 世界攻击/灵根 + 等级 * 世界攻击/等级
 */
export function calculatePlayerAttack(
  constitution: number,
  spiritRoot: number,
  level: number,
  worldType: WorldType
): number {
  const worldData = getWorldData(worldType);
  return Math.floor(
    worldData.baseAttack + 
    constitution * worldData.attackPerConstitution + 
    spiritRoot * worldData.attackPerSpiritRoot +
    level * worldData.attackPerLevel
  );
}

/**
 * 计算玩家防御力
 * 公式：世界基础防御 + 意志 * 世界防御/意志 + 等级 * 世界防御/等级
 */
export function calculatePlayerDefense(
  willpower: number,
  level: number,
  worldType: WorldType
): number {
  const worldData = getWorldData(worldType);
  return Math.floor(
    worldData.baseDefense + 
    willpower * worldData.defensePerWillpower + 
    level * worldData.defensePerLevel
  );
}

// ============================================
// 敌人数值计算（与玩家相同成长体系）
// ============================================

/**
 * 敌人属性成长体系
 * 
 * 核心设计原则：
 * 1. 敌人使用与玩家完全相同的属性公式
 * 2. 敌人等级决定其"裸装"属性（无装备/功法加成）
 * 3. 敌人分级通过系数调整属性，确保平衡
 * 
 * 属性公式（与玩家相同）：
 * - HP = baseHp + 体质 * hpPerConstitution + level * hpPerLevel
 * - 攻击 = baseAttack + 体质 * attackPerConstitution + 灵根 * attackPerSpiritRoot + level * attackPerLevel
 * - 防御 = baseDefense + 意志 * defensePerWillpower + level * defensePerLevel
 * 
 * 敌人属性基准：
 * - 玩家初始属性约为 50 点（各属性）
 * - 玩家每级可通过修炼获得属性成长
 * - 敌人属性应该与同等级裸装玩家相当
 * 
 * 敌人分级设计（合理化）：
 * - 普通：相当于玩家裸装水平，系数 0.9~1.0
 * - 精英：相当于玩家有基础功法，系数 1.1~1.2
 * - 小Boss：相当于玩家有较好功法装备，系数 1.3~1.4
 * - Boss：相当于玩家有顶级功法装备，系数 1.5~1.8
 */

/**
 * 计算敌人基础属性（与玩家相同成长）
 * 
 * 关键原则：敌人的"裸装"属性应该与同等级玩家相同
 * 玩家初始约 50 点各属性，不随等级自动增长
 * 玩家属性增长来自于修炼、机缘等，不是自动的
 * 
 * 因此，敌人的基础属性也应该固定在 50 点左右
 */
function getEnemyBaseStats(_enemyLevel: number): {
  constitution: number;  // 敌人体质
  spiritRoot: number;    // 敌人灵根
  willpower: number;     // 敌人意志
} {
  // 敌人基础属性与玩家初始属性相同
  // 不随等级自动增长，与玩家一致
  // 敌人分级系数用于模拟敌人的"装备/功法加成"
  const baseStat = 50;
  
  return {
    constitution: baseStat,
    spiritRoot: baseStat,
    willpower: baseStat,
  };
}

/**
 * 计算敌人HP
 * 
 * 新设计：敌人使用与玩家完全相同的HP公式
 * 
 * HP = baseHp + 体质 * hpPerConstitution + level * hpPerLevel
 * 然后应用敌人分级系数
 */
export function calculateEnemyHp(
  enemyLevel: number,
  enemyTier: EnemyTier,
  difficultyLevel: DifficultyLevel = 'normal',
  worldType: WorldType,
  useRandomVariance: boolean = true,
  difficultyValue: number = 1
): number {
  const worldData = getWorldData(worldType);
  const difficulty = DIFFICULTY_MULTIPLIERS[difficultyLevel];
  const tierConfig = getEffectiveEnemyTierConfig(enemyTier, difficultyValue);
  const enemyStats = getEnemyBaseStats(enemyLevel);
  
  // 使用与玩家完全相同的HP公式
  const baseHp = worldData.baseHp + 
    enemyStats.constitution * worldData.hpPerConstitution + 
    enemyLevel * worldData.hpPerLevel;
  
  // 只应用敌人分级系数和难度系数（移除 levelFactor）
  let hp = baseHp * tierConfig.hpMultiplier * difficulty.hpMultiplier;
  
  // 应用随机浮动
  const variance = tierConfig.variance;
  const randomMultiplier = (useRandomVariance && variance > 0) 
    ? (1 - variance + Math.random() * variance * 2) 
    : 1;
  
  return Math.floor(hp * randomMultiplier);
}

/**
 * 计算敌人攻击力
 * 
 * 新设计：敌人使用与玩家完全相同的攻击力公式
 */
export function calculateEnemyAttack(
  enemyLevel: number,
  enemyTier: EnemyTier,
  difficultyLevel: DifficultyLevel = 'normal',
  worldType: WorldType,
  useRandomVariance: boolean = true,
  difficultyValue: number = 1
): number {
  const worldData = getWorldData(worldType);
  const difficulty = DIFFICULTY_MULTIPLIERS[difficultyLevel];
  const tierConfig = getEffectiveEnemyTierConfig(enemyTier, difficultyValue);
  const enemyStats = getEnemyBaseStats(enemyLevel);
  
  // 使用与玩家完全相同的攻击力公式
  const baseAttack = worldData.baseAttack + 
    enemyStats.constitution * worldData.attackPerConstitution + 
    enemyStats.spiritRoot * worldData.attackPerSpiritRoot + 
    enemyLevel * worldData.attackPerLevel;
  
  // 只应用敌人分级系数和难度系数
  let attack = baseAttack * tierConfig.attackMultiplier * difficulty.attackMultiplier;
  
  // 应用随机浮动
  const variance = tierConfig.variance;
  const randomMultiplier = (useRandomVariance && variance > 0) 
    ? (1 - variance + Math.random() * variance * 2) 
    : 1;
  
  return Math.floor(attack * randomMultiplier);
}

/**
 * 计算敌人防御力
 * 
 * 新设计：敌人使用与玩家完全相同的防御力公式
 */
export function calculateEnemyDefense(
  enemyLevel: number,
  enemyTier: EnemyTier,
  difficultyLevel: DifficultyLevel = 'normal',
  worldType: WorldType,
  useRandomVariance: boolean = true,
  difficultyValue: number = 1
): number {
  const worldData = getWorldData(worldType);
  const difficulty = DIFFICULTY_MULTIPLIERS[difficultyLevel];
  const tierConfig = getEffectiveEnemyTierConfig(enemyTier, difficultyValue);
  const enemyStats = getEnemyBaseStats(enemyLevel);
  
  // 使用与玩家完全相同的防御力公式
  const baseDefense = worldData.baseDefense + 
    enemyStats.willpower * worldData.defensePerWillpower + 
    enemyLevel * worldData.defensePerLevel;
  
  // 只应用敌人分级系数和难度系数（移除 levelFactor）
  let defense = baseDefense * tierConfig.defenseMultiplier * difficulty.defenseMultiplier;
  
  // 应用随机浮动（仅在启用时）
  // 用于机缘战力计算时禁用随机浮动，确保战力要求稳定
  const variance = tierConfig.variance;
  const randomMultiplier = (useRandomVariance && variance > 0) 
    ? (1 - variance + Math.random() * variance * 2) 
    : 1;
  
  return Math.floor(defense * randomMultiplier);
}

// ============================================
// 奖励计算
// ============================================

/**
 * 计算战斗经验奖励
 */
export function calculateBattleExp(
  enemyLevel: number,
  enemyTier: EnemyTier,
  difficultyLevel: DifficultyLevel = 'normal',
  worldType?: WorldType
): number {
  const difficulty = DIFFICULTY_MULTIPLIERS[difficultyLevel];
  const worldData = worldType ? getWorldData(worldType) : null;
  const tierConfig = getEnemyTierConfig(enemyTier);
  
  // 基于世界系数调整经验
  const worldMultiplier = worldData ? worldData.coefficient : 1;
  
  const baseExp = EXPERIENCE_CONFIG.battleExpBase + enemyLevel * EXPERIENCE_CONFIG.battleExpPerLevel;
  return Math.floor(
    baseExp * difficulty.expMultiplier * tierConfig.expMultiplier * worldMultiplier
  );
}

/**
 * 计算战斗灵石奖励
 * 
 * 注意：此函数仅计算基础值，实际奖励应通过 BattleRewardRegulator 进行调节
 * @see src/lib/game/economy/currencyRegulator.ts - BattleRewardRegulator
 */
export function calculateBattleSpiritStones(
  enemyLevel: number,
  enemyTier: EnemyTier,
  difficultyLevel: DifficultyLevel = 'normal',
  worldType?: WorldType
): number {
  const difficulty = DIFFICULTY_MULTIPLIERS[difficultyLevel];
  const worldData = worldType ? getWorldData(worldType) : null;
  const tierConfig = getEnemyTierConfig(enemyTier);
  
  const worldMultiplier = worldData ? worldData.coefficient : 1;
  
  const baseStones = RESOURCE_CONFIG.spiritStoneBase + enemyLevel * RESOURCE_CONFIG.spiritStonePerLevel;
  return Math.floor(
    baseStones * difficulty.rewardMultiplier * tierConfig.rewardMultiplier * worldMultiplier
  );
}

/**
 * 计算战斗灵石奖励（使用货币调节系统）
 * 
 * 推荐使用此函数，它会根据玩家等级自动调节奖励
 * 解决后期灵石通胀问题
 */
export function calculateBattleSpiritStonesWithRegulation(
  enemyLevel: number,
  enemyTier: EnemyTier,
  playerLevel: number,
  difficultyLevel: DifficultyLevel = 'normal',
  worldType?: WorldType
): number {
  // 动态导入避免循环依赖
  const { BattleRewardRegulator } = require('./economy/currencyRegulator');
  
  const baseReward = calculateBattleSpiritStones(enemyLevel, enemyTier, difficultyLevel, worldType);
  
  return BattleRewardRegulator.adjustBattleSpiritStone(
    baseReward,
    playerLevel,
    enemyLevel,
    enemyTier
  );
}

// ============================================
// 战斗计算
// ============================================

/**
 * 计算伤害值（包含防御减伤）
 * 添加参数约束防止除零和负防御问题（修复 BUG-003）
 */
export function calculateDamage(
  attack: number,
  defense: number,
  levelDiff: number = 0
): number {
  const { damageVariance, defenseReductionFactor, levelDiffDamageFactor, maxLevelDiffModifier } = COMBAT_CONFIG;
  
  // 参数约束：确保所有参数有效
  const safeAttack = clamp(attack, 1, 999999);          // 攻击力至少为1
  const safeDefense = clampNonNegative(defense);         // 防御力最小为0
  const safeLevelDiff = clamp(levelDiff, -100, 100);     // 等级差约束
  
  // 基础伤害（防御最小为0，确保分母有效）
  const damageRatio = safeDivide(
    defenseReductionFactor,
    defenseReductionFactor + safeDefense,
    1  // 如果分母为0，返回1（无减伤）
  );
  let damage = safeAttack * damageRatio;
  
  // 等级差距修正
  const levelModifier = clamp(
    safeLevelDiff * levelDiffDamageFactor,
    -maxLevelDiffModifier,
    maxLevelDiffModifier
  );
  damage *= (1 + levelModifier);
  
  // 随机浮动（约束浮动范围）
  const variance = clamp(1 - damageVariance + Math.random() * damageVariance * 2, 0.5, 1.5);
  damage *= variance;
  
  // 最终约束：伤害至少为1
  return Math.max(1, Math.floor(damage));
}

/**
 * 应用伤害浮动
 * 
 * 核心设计原则：
 * 1. 所有伤害类型都应该有浮动，增加战斗变化感
 * 2. 不同伤害类型有不同的浮动范围
 * 3. 浮动范围有上下界保护，避免极端情况
 * 
 * @param baseDamage 基础伤害值
 * @param varianceType 浮动类型：'normal'普通攻击, 'skill'技能攻击, 'powerful'强力技能
 * @returns 应用浮动后的伤害值
 */
export function applyDamageVariance(
  baseDamage: number,
  varianceType: 'normal' | 'skill' | 'powerful' = 'normal'
): number {
  // 根据类型选择浮动范围
  const varianceMap = {
    normal: COMBAT_CONFIG.damageVariance,        // ±15%
    skill: COMBAT_CONFIG.skillDamageVariance,    // ±20%
    powerful: COMBAT_CONFIG.powerfulSkillVariance, // ±25%
  };
  
  const variance = varianceMap[varianceType];
  
  // 参数约束：基础伤害至少为1
  const safeDamage = Math.max(1, baseDamage);
  
  // 计算浮动倍率（约束在合理范围内）
  // 浮动范围：1 - variance 到 1 + variance
  // 例如 variance=0.15 时，范围是 0.85 到 1.15
  const minMultiplier = Math.max(0.5, 1 - variance);  // 最低50%伤害
  const maxMultiplier = Math.min(2.0, 1 + variance);  // 最高200%伤害
  const randomMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
  
  // 应用浮动并约束结果
  const finalDamage = Math.floor(safeDamage * randomMultiplier);
  
  // 最终约束：伤害至少为1
  return Math.max(1, finalDamage);
}

/**
 * 计算技能伤害（包含浮动）
 * 
 * 与 calculateDamage 的区别：
 * - calculateDamage 用于普通攻击，考虑防御减伤
 * - calculateSkillDamage 用于技能攻击，基于技能倍率计算
 * 
 * @param baseAttack 基础攻击力
 * @param skillMultiplier 技能伤害倍率
 * @param defense 目标防御力（可选，用于穿透计算）
 * @param isPowerfulSkill 是否为强力技能（影响浮动范围）
 * @returns 应用浮动后的技能伤害
 */
export function calculateSkillDamageWithVariance(
  baseAttack: number,
  skillMultiplier: number,
  defense: number = 0,
  isPowerfulSkill: boolean = false
): number {
  // 参数约束
  const safeAttack = Math.max(1, baseAttack);
  const safeMultiplier = Math.max(0.1, skillMultiplier);
  const safeDefense = Math.max(0, defense);
  
  // 基础技能伤害 = 攻击力 * 技能倍率
  let baseDamage = safeAttack * safeMultiplier;
  
  // 防御减伤（技能通常有一定穿透，减伤效果降低）
  const penetrationRate = 0.5; // 技能穿透50%防御
  const effectiveDefense = safeDefense * (1 - penetrationRate);
  const defenseReduction = COMBAT_CONFIG.defenseReductionFactor / 
    (COMBAT_CONFIG.defenseReductionFactor + effectiveDefense);
  baseDamage *= defenseReduction;
  
  // 应用浮动（强力技能浮动更大）
  const varianceType = isPowerfulSkill ? 'powerful' : 'skill';
  const finalDamage = applyDamageVariance(baseDamage, varianceType);
  
  return finalDamage;
}

/**
 * 计算暴击率（添加参数约束）
 */
export function calculateCritRate(luck: number): number {
  const { baseCritRate, critRatePerLuck, maxCritRate } = COMBAT_CONFIG;
  const safeLuck = clamp(luck, 0, 1000);
  return Math.min(maxCritRate, baseCritRate + safeLuck * critRatePerLuck);
}

/**
 * 计算闪避率（添加参数约束）
 */
export function calculateDodgeRate(luck: number): number {
  const { baseDodgeRate, dodgeRatePerLuck, maxDodgeRate } = COMBAT_CONFIG;
  const safeLuck = clamp(luck, 0, 1000);
  return Math.min(maxDodgeRate, baseDodgeRate + safeLuck * dodgeRatePerLuck);
}

/**
 * 计算休息恢复量
 */
export function calculateRestHeal(maxHp: number, maxMp: number): { hp: number; mp: number } {
  return {
    hp: Math.floor(maxHp * COMBAT_CONFIG.restHealPercent),
    mp: Math.floor(maxMp * COMBAT_CONFIG.restMpHealPercent),
  };
}

// ============================================
// 突破计算
// ============================================

/**
 * 计算突破成功率
 */
export function calculateBreakthroughSuccessRate(
  luck: number,
  insight: number,
  pillBonus: number = 0
): number {
  const { baseSuccessRate, successRatePerLuck, successRatePerInsight, maxBaseSuccessRate } = BREAKTHROUGH_CONFIG;
  const baseRate = Math.min(maxBaseSuccessRate, baseSuccessRate + luck * successRatePerLuck + insight * successRatePerInsight);
  return Math.min(95, baseRate + pillBonus);
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取历练事件经验奖励
 */
export function getEventExpReward(riskLevel: 'safe' | 'risky' | 'dangerous'): number {
  const ranges = {
    safe: EXPERIENCE_CONFIG.expEventSafe,
    risky: EXPERIENCE_CONFIG.expEventRisky,
    dangerous: EXPERIENCE_CONFIG.expEventDangerous,
  };
  const [min, max] = ranges[riskLevel];
  return Math.floor(min + Math.random() * (max - min));
}

/**
 * 计算升级所需经验
 */
export function getExpForNextLevel(currentLevel: number): number {
  return Math.floor(
    EXPERIENCE_CONFIG.baseExpRequired * Math.pow(EXPERIENCE_CONFIG.expGrowthFactor, currentLevel - 1)
  );
}

/**
 * 获取难度等级名称
 */
export function getDifficultyName(level: DifficultyLevel): string {
  const names: Record<DifficultyLevel, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    nightmare: '噩梦',
  };
  return names[level];
}

// ============================================
// 战力计算
// ============================================

/**
 * 计算玩家总战力
 * 战力 = 基础属性战力 + 等级战力 + 装备战力 + 功法战力
 */
export function calculatePlayerPower(
  stats: { 体质: number; 灵根: number; 悟性: number; 幸运: number; 意志: number },
  level: number,
  equipments: { power?: number }[] = [],
  techniques: { power?: number }[] = []
): number {
  // 基础属性战力（权重：体质40%，灵根30%，悟性15%，幸运10%，意志5%）
  const statPower = 
    stats.体质 * 4 + 
    stats.灵根 * 3 + 
    stats.悟性 * 1.5 + 
    stats.幸运 * 1 + 
    stats.意志 * 0.5;
  
  // 等级战力
  const levelPower = level * 5;
  
  // 装备战力
  const equipPower = equipments.reduce((sum, e) => sum + (e.power || 0), 0);
  
  // 功法战力
  const techPower = techniques.reduce((sum, t) => sum + (t.power || 0), 0);
  
  // 总战力
  return Math.floor(statPower + levelPower + equipPower * 0.5 + techPower * 0.3);
}

// 导出难度类型
export type { DifficultyLevel };
