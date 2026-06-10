/**
 * 机缘配置系统
 * 
 * 核心设计：
 * 1. 所有机缘都可出现并进入
 * 2. 收益由等级匹配度决定
 * 3. 高级机缘需要飞升条件完全解锁
 */

import { ItemRarity } from '@/core/types';

// ============================================
// 类型定义
// ============================================

/** 机缘等级配置 */
export interface OpportunityLevelConfig {
  /** 等级 1-5 */
  level: number;
  /** 等级名称 */
  name: string;
  /** 推荐最低玩家等级 */
  minPlayerLevel: number;
  /** 最低飞升次数 */
  minAscension: number;
  /** 可掉落品质范围 */
  rarityRange: ItemRarity[];
  /** 品质权重 */
  rarityWeights: Record<string, number>;
  /** 基础奖励倍率 */
  baseRewardMultiplier: number;
}

/** 机缘解锁结果 */
export interface OpportunityUnlockResult {
  /** 是否完全解锁 */
  isUnlocked: boolean;
  /** 是否可以进入 */
  canEnter: boolean;
  /** 解锁进度 0-1 */
  unlockProgress: number;
  /** 实际收益倍率 */
  effectiveMultiplier: number;
  /** 警告信息 */
  warnings: string[];
}

// ============================================
// 机缘等级配置
// ============================================

/** 机缘等级配置表 */
export const OPPORTUNITY_LEVEL_CONFIG: Record<number, OpportunityLevelConfig> = {
  1: {
    level: 1,
    name: '微小机缘',
    minPlayerLevel: 1,
    minAscension: 0,
    rarityRange: ['普通', '稀有'],
    rarityWeights: { '普通': 85, '稀有': 15 },
    baseRewardMultiplier: 1.0,
  },
  2: {
    level: 2,
    name: '小型机缘',
    minPlayerLevel: 10,
    minAscension: 0,
    rarityRange: ['普通', '稀有', '史诗'],
    rarityWeights: { '普通': 60, '稀有': 30, '史诗': 10 },
    baseRewardMultiplier: 1.5,
  },
  3: {
    level: 3,
    name: '中型机缘',
    minPlayerLevel: 25,
    minAscension: 0,
    rarityRange: ['稀有', '史诗', '传说'],
    rarityWeights: { '稀有': 50, '史诗': 35, '传说': 15 },
    baseRewardMultiplier: 2.0,
  },
  4: {
    level: 4,
    name: '大型机缘',
    minPlayerLevel: 40,
    minAscension: 1,
    rarityRange: ['史诗', '传说', '神话'],
    rarityWeights: { '史诗': 45, '传说': 40, '神话': 15 },
    baseRewardMultiplier: 3.0,
  },
  5: {
    level: 5,
    name: '天大机缘',
    minPlayerLevel: 60,
    minAscension: 3,
    rarityRange: ['传说', '神话'],
    rarityWeights: { '传说': 60, '神话': 40 },
    baseRewardMultiplier: 5.0,
  },
};

// ============================================
// 常量定义
// ============================================

/** 最小机缘等级 */
export const MIN_OPPORTUNITY_LEVEL = 1;

/** 最大机缘等级 */
export const MAX_OPPORTUNITY_LEVEL = 5;

/** 最小收益倍率 */
export const MIN_MULTIPLIER = 0.1;

/** 最大收益倍率 */
export const MAX_MULTIPLIER = 10.0;

/** 等级差距阈值（收益递减开始） */
export const LEVEL_DIFF_THRESHOLD = 20;

/** 飞升未达标时的基础收益 */
export const ASCENSION_NOT_MET_MULTIPLIER = 0.3;

// ============================================
// 解锁检查函数
// ============================================

/**
 * 检查机缘解锁状态
 * 
 * @param opportunityLevel 机缘等级
 * @param playerLevel 玩家等级
 * @param ascensionCount 飞升次数
 * @returns 解锁结果
 */
export function checkOpportunityUnlock(
  opportunityLevel: number,
  playerLevel: number,
  ascensionCount: number
): OpportunityUnlockResult {
  // 参数约束
  const level = clamp(opportunityLevel, MIN_OPPORTUNITY_LEVEL, MAX_OPPORTUNITY_LEVEL);
  const config = OPPORTUNITY_LEVEL_CONFIG[level];
  
  if (!config) {
    return {
      isUnlocked: false,
      canEnter: false,
      unlockProgress: 0,
      effectiveMultiplier: MIN_MULTIPLIER,
      warnings: ['机缘配置不存在'],
    };
  }
  
  // 检查飞升门槛（硬性限制）
  const ascensionMet = ascensionCount >= config.minAscension;
  
  // 检查等级差距
  const levelDiff = playerLevel - config.minPlayerLevel;
  
  // 计算解锁进度和收益倍率
  let unlockProgress = 1.0;
  const warnings: string[] = [];
  
  if (!ascensionMet) {
    // 飞升未达标，只能获得30%收益
    unlockProgress = ASCENSION_NOT_MET_MULTIPLIER;
    warnings.push(`需要飞升 ${config.minAscension} 次才能完全解锁此机缘`);
  } else if (levelDiff < 0) {
    // 等级不足，收益递减（每低1级减少5%，最低30%）
    unlockProgress = Math.max(0.3, 1 + levelDiff * 0.05);
    warnings.push(`推荐等级 ${config.minPlayerLevel}，当前收益降低`);
  } else if (levelDiff > LEVEL_DIFF_THRESHOLD) {
    // 等级过高，收益递减（每超过1级减少3%，最低20%）
    const excessLevels = levelDiff - LEVEL_DIFF_THRESHOLD;
    unlockProgress = Math.max(0.2, 1 - excessLevels * 0.03);
    warnings.push('等级过高，此机缘收益降低');
  }
  
  // 完全解锁条件
  const isUnlocked = ascensionMet && levelDiff >= 0 && levelDiff <= LEVEL_DIFF_THRESHOLD;
  
  // 计算实际收益倍率
  const effectiveMultiplier = clamp(
    config.baseRewardMultiplier * unlockProgress,
    MIN_MULTIPLIER,
    MAX_MULTIPLIER
  );
  
  return {
    isUnlocked,
    canEnter: true, // 始终可以进入
    unlockProgress,
    effectiveMultiplier,
    warnings,
  };
}

/**
 * 获取机缘等级配置
 */
export function getOpportunityConfig(level: number): OpportunityLevelConfig | null {
  const clampedLevel = clamp(level, MIN_OPPORTUNITY_LEVEL, MAX_OPPORTUNITY_LEVEL);
  return OPPORTUNITY_LEVEL_CONFIG[clampedLevel] || null;
}

/**
 * 获取机缘等级名称
 */
export function getOpportunityLevelName(level: number): string {
  const config = getOpportunityConfig(level);
  return config?.name || '未知机缘';
}

/**
 * 获取机缘品质范围
 */
export function getOpportunityRarityRange(level: number): ItemRarity[] {
  const config = getOpportunityConfig(level);
  return config?.rarityRange || ['普通'];
}

/**
 * 获取机缘品质权重
 */
export function getOpportunityRarityWeights(level: number): Record<string, number> {
  const config = getOpportunityConfig(level);
  return config?.rarityWeights || { '普通': 100 };
}

// ============================================
// 工具函数
// ============================================

/**
 * 数值约束
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 获取机缘等级对应的颜色类名
 */
export function getOpportunityLevelColorClass(level: number): string {
  const colors: Record<number, string> = {
    1: 'text-muted-foreground',
    2: 'text-blue-400',
    3: 'text-purple-400',
    4: 'text-orange-400',
    5: 'text-yellow-400',
  };
  return colors[level] || 'text-muted-foreground';
}

/**
 * 获取机缘等级对应的背景色类名
 */
export function getOpportunityLevelBgClass(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-muted/50',
    2: 'bg-blue-500/20',
    3: 'bg-purple-500/20',
    4: 'bg-orange-500/20',
    5: 'bg-yellow-500/20',
  };
  return colors[level] || 'bg-muted/50';
}

/**
 * 获取机缘等级对应的图标
 */
export function getOpportunityLevelIcon(level: number): string {
  const icons: Record<number, string> = {
    1: '✨',
    2: '🌟',
    3: '💫',
    4: '🎁',
    5: '👑',
  };
  return icons[level] || '✨';
}

/**
 * 获取机缘等级对应的危险图标
 */
export function getDangerLevelIcon(level: number): string {
  const icons: Record<number, string> = {
    1: '⚠️',
    2: '⚡',
    3: '🔥',
    4: '💀',
    5: '☠️',
  };
  return icons[level] || '⚠️';
}
