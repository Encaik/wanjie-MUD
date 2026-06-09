/**
 * 修炼策略系统
 *
 * 为修炼系统增加三种策略选择：稳健/激进/顿悟
 * 不同策略有不同的资源消耗、成功率和收益曲线。
 * 扩展自 executeCultivation()，保留原有功能作为"稳健"策略。
 */

import type { Protagonist, CultivationResult, GrowthStats, LegacyStats, InventoryItem } from '@/shared/lib/types';
import { createInventoryItem, getFinalStats } from '@/shared/lib/types';
import { getItemById, spiritStoneItems } from '@/modules/equipment/logic/items';
import { getExperienceForLevel } from '@/modules/progression/logic/realmSystem';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import {
  calculateCultivationBoost,
  calculateBreakthroughBoost,
  calculateBreakthroughRate,
  getMaxExperience,
} from '@/modules/progression/logic/cultivation';
import {
  CULTIVATION_STRATEGIES,
} from './types';
import type {
  CultivationStrategy,
  CultivationCritEvent,
  CultivationCritChoice,
  CultivationStrategyResult,
} from './types';

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ============================================
// 灵石计数
// ============================================

function getSpiritStoneCount(inventory: InventoryItem[]): number {
  const item = inventory.find(i => i.definition.id === 'spirit_stone');
  return item ? item.quantity : 0;
}

// ============================================
// 修炼暴击事件生成
// ============================================

/** 暴击基础概率 */
const CRIT_BASE_RATE = 0.05;
/** 每点幸运增加的暴击率 */
const CRIT_LUCK_BONUS = 0.005;

const CRIT_EVENTS: Record<CultivationStrategy, CultivationCritChoice[][]> = {
  steady: [
    [
      { text: '吸收额外灵气', effects: { stats: { 体质: 3, 灵根: 2 } }, result: '灵气涌入，属性获得额外提升！' },
      { text: '感悟功法要诀', effects: { stats: { 悟性: 2 }, special: '理解加深' }, result: '对功法的理解更加深刻！' },
      { text: '灵石回流', effects: { spiritStones: 10 }, result: '修炼中意外发现了额外的灵石！' },
    ],
  ],
  aggressive: [
    [
      { text: '灵气大爆发', effects: { stats: { 体质: 8, 灵根: 6 } }, result: '狂暴的灵气涌入体内，属性大幅提升！' },
      { text: '心魔挑战', effects: { stats: { 体质: 3, 意志: 3 }, special: '心魔' }, result: '你战胜了心魔，意志更加坚定！' },
      { text: '功法碎片浮现', effects: { stats: { 悟性: 3 }, special: '稀有碎片' }, result: '脑海中浮现出一段失传的功法要诀！' },
    ],
  ],
  insight: [
    [
      { text: '天地共鸣', effects: { stats: { 灵根: 5, 悟性: 5 } }, result: '与天地产生共鸣，资质大幅提升！' },
      { text: '先贤传法', effects: { stats: { 灵根: 3 }, special: '传承' }, result: '梦中先贤传法，获得珍贵的修炼心得！' },
      { text: '大道感悟', effects: { stats: { 悟性: 4, 意志: 3 }, special: '顿悟' }, result: '对大道有了更深的理解！' },
    ],
  ],
};

/**
 * 生成修炼暴击事件
 *
 * @param protagonist - 主角数据
 * @param strategy - 当前使用的修炼策略
 * @returns 暴击事件（未触发时返回 null）
 */
export function generateCultivationCritEvent(
  protagonist: Protagonist,
  strategy: CultivationStrategy
): CultivationCritEvent | null {
  const stats = getFinalStats(protagonist.stats);
  const critRate = CRIT_BASE_RATE + stats.幸运 * CRIT_LUCK_BONUS;

  if (Math.random() > critRate) return null;

  const choices = CRIT_EVENTS[strategy];
  const choiceSet = choices[random(0, choices.length - 1)];

  const titles: Record<CultivationStrategy, string> = {
    steady: '修炼中的感悟',
    aggressive: '狂暴修炼中的契机',
    insight: '顿悟时刻！',
  };

  return {
    title: titles[strategy],
    description: '修炼过程中，你突然有所感悟...',
    choices: choiceSet,
    sourceStrategy: strategy,
  };
}

// ============================================
// 策略驱动的修炼
// ============================================

/**
 * 使用指定策略执行修炼
 *
 * @param protagonist - 主角数据
 * @param strategy - 修炼策略（默认稳健）
 */
export function executeCultivationWithStrategy(
  protagonist: Protagonist,
  strategy: CultivationStrategy = 'steady'
): CultivationStrategyResult {
  const config = CULTIVATION_STRATEGIES[strategy];
  const stats = getFinalStats(protagonist.stats);
  const terms = getTerminology(protagonist.world.type);
  const maxExp = getMaxExperience(protagonist.level);
  const spiritStones = getSpiritStoneCount(protagonist.inventory);

  // 检查灵石
  if (spiritStones < config.spiritStoneCost) {
    return {
      success: false,
      message: `${terms.resource}不足！${config.name}需要至少${config.spiritStoneCost}${terms.resource}，当前只有${spiritStones}。`,
      strategy,
      statChanges: {},
      spiritStonesSpent: 0,
      spiritStonesRefunded: 0,
      experienceGain: 0,
      breakthroughAttempt: false,
      cultivationCrit: false,
      unexpectedBreakthrough: false,
      insightMarkGained: false,
      cooldownUntil: 0,
    };
  }

  // 计算丹药增益
  const cultivationBoost = calculateCultivationBoost(protagonist.activeEffects);
  const breakthroughBoost = calculateBreakthroughBoost(protagonist.activeEffects);

  // 基础成功率
  const baseSuccessRate = 50 + stats.灵根 * 0.3 + stats.悟性 * 0.2;
  const boostedRate = baseSuccessRate * (1 + cultivationBoost / 100);
  const finalSuccessRate = Math.min(95, Math.max(5, boostedRate + config.successRateOffset * 100));
  const isSuccess = Math.random() * 100 < finalSuccessRate;

  // 灵石消耗与返还
  const spiritStonesSpent = config.spiritStoneCost;
  let spiritStonesRefunded = 0;
  if (!isSuccess && config.refundOnFail > 0) {
    spiritStonesRefunded = Math.floor(spiritStonesSpent * config.refundOnFail);
  }

  // 属性增益（成功时）
  const statChanges: Partial<GrowthStats> = {};
  let experienceGain = 0;

  if (isSuccess) {
    // 基础增长
    const baseGains = {
      体质: random(1, 3),
      灵根: random(1, 4),
      意志: random(0, 2),
    };
    const multiplier = config.statGainMultiplier;
    statChanges.体质 = Math.max(1, Math.floor(baseGains.体质 * multiplier));
    statChanges.灵根 = Math.max(1, Math.floor(baseGains.灵根 * multiplier));
    statChanges.意志 = Math.max(0, Math.floor(baseGains.意志 * multiplier));

    // 经验
    const levelBonus = Math.floor(protagonist.level / 10) * 5;
    experienceGain = Math.floor((20 + levelBonus) * multiplier);
  }

  // 意外突破
  let unexpectedBreakthrough = false;
  if (isSuccess && config.canUnexpectedBreakthrough) {
    unexpectedBreakthrough = Math.random() < config.unexpectedBreakthroughRate;
    if (unexpectedBreakthrough) {
      statChanges.体质 = (statChanges.体质 || 0) + 2;
      statChanges.灵根 = (statChanges.灵根 || 0) + 2;
      statChanges.意志 = (statChanges.意志 || 0) + 1;
    }
  }

  // 暴击事件
  const critEvent = isSuccess ? generateCultivationCritEvent(protagonist, strategy) : null;
  if (critEvent) {
    experienceGain = Math.floor(experienceGain * 1.5);
  }

  // 顿悟印记
  const insightMarkGained = isSuccess && strategy === 'insight' && Math.random() < 0.2;

  // 冷却
  const cooldownUntil = !isSuccess && config.cooldownOnFail > 0
    ? Date.now() + config.cooldownOnFail * 1000
    : 0;

  // 尝试突破
  const canAttemptBreakthrough = protagonist.experience >= maxExp;
  let breakthroughAttempt = false;
  let breakthroughSuccess: boolean | undefined;

  if (canAttemptBreakthrough && isSuccess) {
    breakthroughAttempt = true;
    const breakthroughChance = calculateBreakthroughRate(
      protagonist.level,
      stats.幸运,
      breakthroughBoost,
      protagonist.overflowExperience,
      maxExp
    );
    breakthroughSuccess = Math.random() * 100 < breakthroughChance;
  }

  // 构建消息
  const strategyName = config.name;
  let message = '';
  if (!isSuccess) {
    message = `${strategyName}失败，未能获得修炼收益。`;
    if (spiritStonesRefunded > 0) {
      message += `返还${spiritStonesRefunded}${terms.resource}。`;
    }
    if (cooldownUntil > 0) {
      const cooldownMinutes = Math.ceil(config.cooldownOnFail / 60);
      message += `进入${cooldownMinutes}分钟冷却期。`;
    }
  } else {
    message = `${strategyName}成功！`;
    if (unexpectedBreakthrough) {
      message += '意外突破！属性额外提升！';
    }
    if (critEvent) {
      message += '触发修炼暴击！';
    }
    if (insightMarkGained) {
      message += '获得一枚顿悟印记！';
    }
  }

  return {
    success: isSuccess,
    message,
    strategy,
    statChanges,
    spiritStonesSpent,
    spiritStonesRefunded,
    experienceGain,
    breakthroughAttempt,
    breakthroughSuccess,
    cultivationCrit: critEvent !== null,
    critEvent: critEvent || undefined,
    unexpectedBreakthrough,
    insightMarkGained,
    cooldownUntil,
  };
}
