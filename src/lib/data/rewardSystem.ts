/**
 * 奖励计算系统
 * 
 * 统一管理经验、金钱、物品掉落的计算逻辑
 * 整合机缘解锁和品质系统
 */

import { ItemRarity, EnemyTier } from '../game/types';
import { 
  checkOpportunityUnlock, 
  getOpportunityConfig,
  OpportunityLevelConfig 
} from './opportunityConfig';
import { 
  generateDropRarity, 
  calculateDropCount, 
  generateDropItemLevel,
  getRarityRange,
  RaritySource,
  DropResult,
} from './raritySystem';

// ============================================
// 类型定义
// ============================================

/** 奖励计算上下文 */
export interface RewardCalculationContext {
  // 来源信息
  sourceType: RaritySource;
  sourceLevel: number;
  opportunityLevel?: number;
  enemyTier?: EnemyTier;
  
  // 玩家信息
  playerLevel: number;
  playerLuck: number;
  ascensionCount: number;
  
  // 世界信息
  worldCoefficient: number;
  
  // 额外加成
  bonusMultipliers?: {
    exp?: number;
    gold?: number;
    drop?: number;
  };
}

/** 奖励结果 */
export interface CalculatedReward {
  /** 经验值 */
  experience: number;
  /** 金钱（灵石） */
  gold: number;
  /** 掉落物品 */
  items: DropResult[];
  /** 实际收益倍率 */
  multiplier: number;
  /** 警告信息 */
  warnings: string[];
}

/** 基础奖励配置 */
export interface BaseRewardConfig {
  /** 基础经验 */
  baseExp: number;
  /** 基础金钱 */
  baseGold: number;
  /** 经验等级系数 */
  expLevelMultiplier: number;
  /** 金钱等级系数 */
  goldLevelMultiplier: number;
}

// ============================================
// 常量定义
// ============================================

/** 基础奖励配置表 */
export const BASE_REWARD_CONFIGS: Record<RaritySource, BaseRewardConfig> = {
  opportunity: {
    baseExp: 50,
    baseGold: 30,
    expLevelMultiplier: 1.5,
    goldLevelMultiplier: 1.2,
  },
  enemy: {
    baseExp: 30,
    baseGold: 20,
    expLevelMultiplier: 1.3,
    goldLevelMultiplier: 1.1,
  },
  boss: {
    baseExp: 100,
    baseGold: 80,
    expLevelMultiplier: 2.0,
    goldLevelMultiplier: 1.5,
  },
};

/** 敌人等级奖励倍率 */
export const ENEMY_TIER_MULTIPLIERS: Record<EnemyTier, number> = {
  normal: 1.0,
  elite: 1.5,
  miniboss: 2.0,
  boss: 3.0,
};

// ============================================
// 基础奖励计算
// ============================================

/**
 * 计算基础经验
 */
export function calculateBaseExp(
  sourceType: RaritySource,
  sourceLevel: number,
  enemyTier?: EnemyTier
): number {
  const config = BASE_REWARD_CONFIGS[sourceType];
  let baseExp = config.baseExp * Math.pow(config.expLevelMultiplier, sourceLevel - 1);
  
  // 敌人等级加成
  if (enemyTier && sourceType !== 'opportunity') {
    baseExp *= ENEMY_TIER_MULTIPLIERS[enemyTier];
  }
  
  return Math.floor(baseExp);
}

/**
 * 计算基础金钱
 */
export function calculateBaseGold(
  sourceType: RaritySource,
  sourceLevel: number,
  enemyTier?: EnemyTier
): number {
  const config = BASE_REWARD_CONFIGS[sourceType];
  let baseGold = config.baseGold * Math.pow(config.goldLevelMultiplier, sourceLevel - 1);
  
  // 敌人等级加成
  if (enemyTier && sourceType !== 'opportunity') {
    baseGold *= ENEMY_TIER_MULTIPLIERS[enemyTier];
  }
  
  return Math.floor(baseGold);
}

// ============================================
// 统一奖励计算
// ============================================

/**
 * 计算完整奖励
 */
export function calculateReward(
  context: RewardCalculationContext
): CalculatedReward {
  const warnings: string[] = [];
  
  // 1. 检查机缘解锁状态（如果是机缘来源）
  let effectiveMultiplier = 1.0;
  if (context.sourceType === 'opportunity' && context.opportunityLevel) {
    const unlockResult = checkOpportunityUnlock(
      context.opportunityLevel,
      context.playerLevel,
      context.ascensionCount
    );
    effectiveMultiplier = unlockResult.effectiveMultiplier;
    warnings.push(...unlockResult.warnings);
  }
  
  // 2. 计算基础经验和金钱
  const baseExp = calculateBaseExp(
    context.sourceType, 
    context.sourceLevel,
    context.enemyTier
  );
  const baseGold = calculateBaseGold(
    context.sourceType, 
    context.sourceLevel,
    context.enemyTier
  );
  
  // 3. 应用倍率
  const bonusMultiplier = context.bonusMultipliers || {};
  const expMultiplier = (bonusMultiplier.exp || 1) * effectiveMultiplier;
  const goldMultiplier = (bonusMultiplier.gold || 1) * effectiveMultiplier;
  const dropMultiplier = bonusMultiplier.drop || 1;
  
  const exp = Math.floor(baseExp * expMultiplier);
  const gold = Math.floor(baseGold * goldMultiplier);
  
  // 4. 生成掉落物品
  const items: DropResult[] = [];
  
  // 确定掉落数量
  const baseDropCount = getBaseDropCount(context.sourceType, context.enemyTier);
  const dropCount = calculateDropCount(
    baseDropCount,
    dropMultiplier,
    context.playerLuck * 0.01
  );
  
  // 生成物品
  for (let i = 0; i < dropCount; i++) {
    const rarity = generateDropRarity(
      context.sourceType,
      context.sourceLevel,
      context.playerLuck
    );
    
    const itemLevel = generateDropItemLevel(context.sourceLevel);
    
    items.push({
      rarity,
      level: itemLevel,
      quantity: 1,
      sourceType: context.sourceType,
      sourceLevel: context.sourceLevel,
    });
  }
  
  return {
    experience: exp,
    gold,
    items,
    multiplier: effectiveMultiplier,
    warnings,
  };
}

/**
 * 获取基础掉落数量
 */
function getBaseDropCount(sourceType: RaritySource, enemyTier?: EnemyTier): number {
  if (sourceType === 'opportunity') {
    return 1;
  }
  
  if (sourceType === 'boss') {
    return 2;
  }
  
  // 敌人
  if (enemyTier === 'boss') {
    return 2;
  } else if (enemyTier === 'miniboss') {
    return 1;
  } else if (enemyTier === 'elite') {
    return 1;
  }
  
  // 普通敌人有概率不掉落
  return Math.random() < 0.5 ? 1 : 0;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取品质范围描述
 */
export function getRarityRangeDescription(sourceType: RaritySource, sourceLevel: number): string {
  const config = getRarityRange(sourceType, sourceLevel);
  const rarities = config.rarityRange;
  
  if (rarities.length === 1) {
    return rarities[0];
  }
  
  return `${rarities[0]} ~ ${rarities[rarities.length - 1]}`;
}

/**
 * 获取机缘奖励预览
 */
export function getOpportunityRewardPreview(
  opportunityLevel: number,
  playerLevel: number,
  ascensionCount: number
): {
  config: OpportunityLevelConfig | null;
  unlockResult: {
    isUnlocked: boolean;
    effectiveMultiplier: number;
    warnings: string[];
  };
  rarityRange: string;
  baseExp: number;
  baseGold: number;
} {
  const config = getOpportunityConfig(opportunityLevel);
  const unlockResult = checkOpportunityUnlock(opportunityLevel, playerLevel, ascensionCount);
  
  return {
    config,
    unlockResult: {
      isUnlocked: unlockResult.isUnlocked,
      effectiveMultiplier: unlockResult.effectiveMultiplier,
      warnings: unlockResult.warnings,
    },
    rarityRange: config ? getRarityRangeDescription('opportunity', opportunityLevel) : '普通',
    baseExp: config ? calculateBaseExp('opportunity', opportunityLevel) : 0,
    baseGold: config ? calculateBaseGold('opportunity', opportunityLevel) : 0,
  };
}

/**
 * 计算敌人掉落奖励
 */
export function calculateEnemyReward(
  enemyLevel: number,
  enemyTier: EnemyTier,
  playerLevel: number,
  playerLuck: number
): CalculatedReward {
  // 确定来源类型
  const sourceType: RaritySource = enemyTier === 'boss' ? 'boss' : 'enemy';
  
  return calculateReward({
    sourceType,
    sourceLevel: enemyLevel,
    enemyTier,
    playerLevel,
    playerLuck,
    ascensionCount: 0, // 敌人掉落不检查飞升
    worldCoefficient: 1.0,
  });
}

/**
 * 计算机缘奖励
 */
export function calculateOpportunityReward(
  opportunityLevel: number,
  playerLevel: number,
  playerLuck: number,
  ascensionCount: number
): CalculatedReward {
  return calculateReward({
    sourceType: 'opportunity',
    sourceLevel: opportunityLevel,
    opportunityLevel,
    playerLevel,
    playerLuck,
    ascensionCount,
    worldCoefficient: 1.0,
  });
}
