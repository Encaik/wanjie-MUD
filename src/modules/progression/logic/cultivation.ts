// @ts-nocheck — TODO: 统一物品系统迁移后重构
import {  GAME_CONSTANTS } from '@/shared/utils/constants';
import {  getExperienceForLevel, getActualStatCap } from '@/modules/progression/logic/realmSystem';
import {  getTerminology } from '@/modules/narrative/logic/terminology';
import { FlatStats, Protagonist, CultivationResult, CharacterStats, WorldType, ActiveEffect, InventoryItem, createInventoryItem, getFinalStats, StatKey, GrowthStats } from '@/core/types';
import {  getMaxLevel } from '@/modules/progression/data/realmData';

// TODO: 统一物品系统迁移 — 暂代
const spiritStoneItems = [{ id: 'spirit_stone', name: '灵石', type: '灵石', rarity: '普通' as const, description: '', stackable: true, maxStack: 999999, effects: [] as never[] }];

// 重新导出 getMaxLevel
export { getMaxLevel } from '@/modules/progression/data/realmData';

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// 修炼结果描述 - 根据世界类型
const cultivationMessagesByWorld: Record<WorldType, { success: string[], breakthrough: string[], failure: string[] }> = {
  '修仙': {
    success: [
      '你进入入定状态，灵气缓缓流入体内，修为有所精进。',
      '这一段修炼颇为顺利，你感觉到自己的修为在稳步提升。',
      '灵气汇聚于丹田，你的修为更上一层楼。',
      '修炼中你有所感悟，修为进一步精进。'
    ],
    breakthrough: [
      '突破！在灵气灌顶之下，你成功突破了境界！',
      '机缘到时自然成，你在这个修炼中突破到了新的境界！',
      '心神合一，天人感应，你突破成功！'
    ],
    failure: [
      '修炼中出现了一些杂念，效果不太理想。',
      '今天的状态不佳，修炼进展缓慢。',
      '灵气运转不够顺畅，修为提升有限。'
    ]
  },
  '高武': {
    success: [
      '你运转功法，真气在经脉中流转，实力有所提升。',
      '一番苦修之后，你感到体内力量更加充沛。',
      '武道意志坚定，你的修为有了明显的进步。',
      '体魄更加强健，真气更加浑厚。'
    ],
    breakthrough: [
      '突破！武道意志如铁，你成功突破到了新的境界！',
      '血脉觉醒，真气暴涨，你突破成功！',
      '武道通玄，破而后立，你成功晋升！'
    ],
    failure: [
      '修炼中出现岔气，需要休息调整。',
      '真气运转不畅，这次修炼效果平平。',
      '武道意志不够坚定，修炼受阻。'
    ]
  },
  '科技': {
    success: [
      '基因优化程序运行完毕，你的身体机能有所提升。',
      '神经链接训练完成，各项指标稳步上升。',
      '强化程序执行成功，你的战斗力有所增强。',
      '系统检测到能力提升，进化方向正确。'
    ],
    breakthrough: [
      '突破！基因突变成功，你进化到了新的等级！',
      '系统升级完成，你的能力获得了质的飞跃！',
      '进化临界点突破，你成功晋升！'
    ],
    failure: [
      '基因优化出现波动，需要重新校准。',
      '能量不足，强化程序无法完全运行。',
      '系统运行出现故障，需要检修。'
    ]
  },
  '魔幻': {
    success: [
      '你进入冥想状态，魔力缓缓充盈体内。',
      '魔法元素在身边流转，你的魔力有所增长。',
      '咒语吟唱完毕，你的魔法能力有所提升。',
      '魔力核心更加稳固，施法能力增强。'
    ],
    breakthrough: [
      '突破！魔力核心进化，你成功晋升到了新的境界！',
      '元素精灵降临祝福，你的魔法能力获得了质的飞跃！',
      '魔力暴动后重铸，你成功突破！'
    ],
    failure: [
      '魔法元素紊乱，冥想被打断。',
      '魔力运转出现波动，这次修炼效果不佳。',
      '精神力不够集中，魔力吸收有限。'
    ]
  },
  '异能': {
    success: [
      '你专注修炼，异能波动更加稳定。',
      '能力训练完成，你的控制力有所提升。',
      '能量流动更加顺畅，异能强度增加。',
      '觉醒状态更加稳定，能力有所精进。'
    ],
    breakthrough: [
      '突破！异能进化成功，你达到了新的境界！',
      '基因锁解开，你觉醒了更强大的力量！',
      '能力跃迁，你成功晋升！'
    ],
    failure: [
      '异能控制出现波动，需要重新调整。',
      '能量消耗过大，修炼被迫中断。',
      '精神力透支，需要休息恢复。'
    ]
  },
  '仙侠': {
    success: [
      '你盘膝入定，仙气缓缓流入体内，修为精进。',
      '仙力在经脉中流转，你的仙修更进一步。',
      '剑心通明，修为有所提升。',
      '仙体更加凝实，剑意更加锋锐。'
    ],
    breakthrough: [
      '突破！仙缘降临，你成功晋升到了新的境界！',
      '剑道通玄，一剑破万法，你突破成功！',
      '仙劫渡过，你成功晋升！'
    ],
    failure: [
      '心魔入侵，修炼被迫中断。',
      '仙气流转不畅，这次修炼效果有限。',
      '剑心出现裂痕，需要静心修养。'
    ]
  },
  '武侠': {
    success: [
      '你运功修炼，内力在经脉中流转，功力有所精进。',
      '武功修炼渐入佳境，内力更加深厚。',
      '一招一式皆有领悟，功力稳步提升。',
      '内功心法运转，内力更上一层楼。'
    ],
    breakthrough: [
      '突破！内力冲破经脉阻碍，你成功晋升！',
      '武学造诣大进，你突破了瓶颈！',
      '打通任督二脉，你成功晋升！'
    ],
    failure: [
      '真气走岔，需要调理经脉。',
      '心浮气躁，修炼难以入定。',
      '武功领悟受阻，这次修炼效果不佳。'
    ]
  },
  '末世': {
    success: [
      '你吸收晶体能量，进化程度有所提升。',
      '基因进化训练完成，身体素质增强。',
      '能量摄入完毕，你的能力有所增长。',
      '进化因子激活，身体机能改善。'
    ],
    breakthrough: [
      '突破！基因突变成功，你进化到了新的阶段！',
      '进化跃迁完成，你的能力获得了质的飞跃！',
      '临界点突破，你成功进化！'
    ],
    failure: [
      '晶体能量不足，进化被迫中止。',
      '基因出现排斥反应，需要调整。',
      '辐射干扰，进化受阻。'
    ]
  }
};

// 获取世界术语 - 使用统一的术语系统
function getWorldTerms(worldType: WorldType) {
  const term = getTerminology(worldType);
  return {
    power: term.power,
    energy: term.energy,
    practice: term.practice,
    treasure: term.treasure,
    resource: term.resource
  };
}

// 获取灵石数量
function getSpiritStoneCount(inventory: InventoryItem[]): number {
  const item = inventory.find(i => i.definition.id === 'spirit_stone');
  return item ? item.quantity : 0;
}

// 检查是否有足够灵石修炼
export function canAffordCultivation(protagonist: Protagonist): { canAfford: boolean; message: string } {
  const spiritStones = getSpiritStoneCount(protagonist.inventory);
  
  if (spiritStones < 10) {
    return {
      canAfford: false,
      message: `${getWorldTerms(protagonist.world.type).resource}不足！修炼需要至少10${getWorldTerms(protagonist.world.type).resource}，当前只有${spiritStones}。\n\n请通过历练或机缘获取更多${getWorldTerms(protagonist.world.type).resource}。`
    };
  }
  
  return { canAfford: true, message: '' };
}

// 计算修炼增益（来自丹药效果）
export function calculateCultivationBoost(activeEffects: ActiveEffect[]): number {
  let totalBoost = 0;
  for (const effect of activeEffects) {
    if (effect.type === 'cultivation_boost') {
      totalBoost += effect.value;
    }
  }
  return totalBoost;
}

// 计算突破增益（来自突破丹药）
export function calculateBreakthroughBoost(activeEffects: ActiveEffect[]): number {
  let totalBoost = 0;
  for (const effect of activeEffects) {
    if (effect.type === 'breakthrough_boost') {
      totalBoost += effect.value;
    }
  }
  return totalBoost;
}

// 计算突破成功率（独立函数，供UI显示）
// 从80%开始线性降低
export function calculateBreakthroughRate(
  level: number, 
  luck: number, 
  breakthroughBoost: number = 0,
  overflowExperience: number = 0,
  maxExp: number = 0
): number {
  // 基础突破率：从80%开始线性降低
  // 1级→2级: 80%, 每升一级降低约2%，最低20%
  // 1-10级: 80% → 62%
  // 11-20级: 60% → 42%
  // 21-30级: 40% → 22%
  // 31+级: 最低20%
  let baseBreakthroughRate: number;
  if (level <= 10) {
    // 1级→2级: 80%, 10级→11级: 62%
    baseBreakthroughRate = 80 - (level - 1) * 2;
  } else if (level <= 20) {
    // 11级→12级: 60%, 20级→21级: 42%
    baseBreakthroughRate = 60 - (level - 10) * 2;
  } else if (level <= 30) {
    // 21级→22级: 40%, 30级→31级: 22%
    baseBreakthroughRate = 40 - (level - 20) * 2;
  } else {
    // 31级以上: 最低20%
    baseBreakthroughRate = Math.max(20, 22 - (level - 30) * 0.5);
  }
  
  // 幸运加成（每点幸运增加0.5%）
  const luckBonus = luck * 0.5;
  
  // 溢出经验加成（添加上限约束，修复 BUG-005）
  const maxOverflow = maxExp * GAME_CONSTANTS.MAX_OVERFLOW_EXP_MULTIPLIER;
  const clampedOverflow = Math.min(overflowExperience, maxOverflow);
  const overflowBonus = maxExp > 0 ? Math.min(clampedOverflow / maxExp * 10, 15) : 0;
  
  // 总概率，上限100%
  const totalRate = Math.min(100, baseBreakthroughRate + luckBonus + breakthroughBoost + overflowBonus);
  
  return Math.floor(totalRate * 10) / 10; // 保留一位小数
}

// 计算经验溢出对修炼效果的影响
// 溢出经验会降低修炼效率，但不会完全无效
// 添加上限约束（修复 BUG-005）
function calculateOverflowPenalty(overflowExp: number, maxExp: number): number {
  // 限制溢出经验上限
  const maxOverflow = maxExp * GAME_CONSTANTS.MAX_OVERFLOW_EXP_MULTIPLIER;
  const clampedOverflow = Math.min(overflowExp, maxOverflow);
  
  // 溢出越多，惩罚越大，但最大不超过60%
  // 溢出经验达到maxExp的2倍时，惩罚约为60%
  const ratio = clampedOverflow / (maxExp * 2);
  return Math.min(ratio * 0.6, 0.6);
}

// 计算升级所需经验（使用非线性增长）
export function getMaxExperience(level: number): number {
  return getExperienceForLevel(level);
}

// 执行修炼
export function executeCultivation(protagonist: Protagonist): CultivationResult {
  const stats = getFinalStats(protagonist.stats);
  const worldType = protagonist.world.type;
  const terms = getWorldTerms(worldType);
  const messages = cultivationMessagesByWorld[worldType];
  const maxExp = getMaxExperience(protagonist.level);
  
  // 检查灵石是否足够
  const spiritStones = getSpiritStoneCount(protagonist.inventory);
  if (spiritStones < 20) {
    return {
      success: false,
      message: `${terms.resource}不足！修炼需要至少20${terms.resource}，当前只有${spiritStones}。\n\n请通过历练或机缘获取更多${terms.resource}。`,
      statChanges: {},
      canAfford: false
    };
  }
  
  // 计算丹药增益
  const cultivationBoost = calculateCultivationBoost(protagonist.activeEffects);
  const breakthroughBoost = calculateBreakthroughBoost(protagonist.activeEffects);
  
  // 获取最大等级
  const maxLevel = getMaxLevel(protagonist.world.realmSystem);
  
  // 检查是否可以尝试突破（经验满且未达到最大等级）
  const canAttemptBreakthrough = protagonist.experience >= maxExp && protagonist.level < maxLevel;
  
  // 基础成功率
  const baseSuccessRate = 50 + stats.灵根 * 0.3 + stats.悟性 * 0.2;
  const boostedSuccessRate = baseSuccessRate * (1 + cultivationBoost / 100);
  const successRate = Math.min(95, boostedSuccessRate);
  
  const isSuccess = Math.random() * 100 < successRate;
  
  // 消耗灵石
  const itemsCost: InventoryItem[] = [
    createInventoryItem(spiritStoneItems[0], Math.min(20, spiritStones))
  ];
  
  // 丹药效果提示
  let effectMessage = '';
  if (cultivationBoost > 0) {
    effectMessage = `\n\n【丹药效果】修炼效果提升${cultivationBoost}%！`;
  }
  
  // 经验溢出惩罚
  let overflowPenalty = 0;
  if (protagonist.overflowExperience > 0) {
    overflowPenalty = calculateOverflowPenalty(protagonist.overflowExperience, maxExp);
  }
  
  // 尝试突破
  if (canAttemptBreakthrough) {
    // 使用新的突破概率计算函数
    const breakthroughChance = calculateBreakthroughRate(
      protagonist.level,
      stats.幸运,
      breakthroughBoost,
      protagonist.overflowExperience,
      maxExp
    );
    
    // 突破判定：直接使用突破概率，不受修炼成功率影响
    const isBreakthrough = Math.random() * 100 < breakthroughChance;
    
    if (isBreakthrough) {
      // 【重构】突破成功不再直接计算属性增长
      // 属性增长由 useCultivation.ts 根据实际逻辑计算
      // 这里只返回突破成功的标志，不再返回误导性的 statChanges
      
      let msg = messages.breakthrough[random(0, messages.breakthrough.length - 1)] +
        `\n\n【境界提升】${protagonist.level}级 → ${protagonist.level + 1}级`;
      
      if (breakthroughBoost > 0) {
        msg += `\n\n【突破丹药】成功率提升${breakthroughBoost}%！`;
      }
      
      return {
        success: true,
        message: msg,
        statChanges: {}, // 属性增长由 useCultivation.ts 计算
        itemsCost,
        breakthroughAttempt: true,
        breakthroughSuccess: true,
        cultivationBoost,
        baseGains: {},
        boostGains: {},
      };
    } else {
      // 突破失败
      const currentRate = calculateBreakthroughRate(
        protagonist.level,
        stats.幸运,
        breakthroughBoost,
        protagonist.overflowExperience,
        maxExp
      );
      const failMessage = `修炼时感受到了突破的契机，突破成功率${currentRate.toFixed(1)}%，未能成功突破。\n\n${breakthroughBoost > 0 ? '' : '建议：服用突破丹药后再尝试修炼，可大幅提升突破成功率。'}`;
      
      // 即使突破失败，修炼仍有效果（但受溢出惩罚）
      const penaltyMultiplier = 1 - overflowPenalty;
      const baseGains = {
        体质: random(1, 2),
        灵根: random(1, 2),
      };
      const boostMultiplier = cultivationBoost / 100;
      const statGains: Partial<FlatStats> = {
        体质: Math.max(1, Math.floor(baseGains.体质 * (1 + boostMultiplier) * penaltyMultiplier)),
        灵根: Math.max(1, Math.floor(baseGains.灵根 * (1 + boostMultiplier) * penaltyMultiplier)),
      };
      
      return {
        success: true,
        message: failMessage +
          (overflowPenalty > 0 ? `\n\n【经验溢出】修炼效果降低${Math.floor(overflowPenalty * 100)}%` : '') +
          (cultivationBoost > 0 ? `\n\n【丹药效果】修炼加成${cultivationBoost}%` : ''),
        statChanges: statGains,
        itemsCost,
        breakthroughAttempt: true,
        breakthroughSuccess: false,
        cultivationBoost,
      };
    }
  }
  
  // 普通修炼
  if (isSuccess) {
    const baseGains = {
      体质: random(1, 3),
      灵根: random(1, 4),
      意志: random(0, 2),
    };
    
    // 应用溢出惩罚
    const penaltyMultiplier = 1 - overflowPenalty;
    
    // 丹药加成：主要加成经验值，次要加成属性
    const boostMultiplier = cultivationBoost / 100;
    
    // 计算经验值加成（主要效果）
    // 基础经验值：20 + 等级加成（每10级+5）
    const levelBonus = Math.floor(protagonist.level / 10) * 5;
    const baseExpGain = 20 + levelBonus;
    // 丹药加成经验值（百分比加成）
    const expBoost = cultivationBoost > 0 ? Math.floor(baseExpGain * boostMultiplier) : 0;
    const totalExpGain = Math.floor((baseExpGain + expBoost) * penaltyMultiplier);
    
    // 计算属性：基础值，丹药仅提供少量加成（约20%效果）
    const statGains: Partial<FlatStats> = {};
    const boostGains: Partial<FlatStats> = {}; // 丹药加成值
    
    for (const name of ['体质', '灵根', '意志'] as const) {
      const base = baseGains[name];
      // 属性丹药加成降低到20%效果
      let boost = 0;
      if (cultivationBoost > 0) {
        boost = Math.max(0, Math.floor(base * boostMultiplier * 0.2));
      }
      
      const total = Math.floor((base + boost) * penaltyMultiplier);
      
      // 体质、灵根最小为1，意志最小为0
      if (name === '意志') {
        statGains[name] = Math.max(0, total);
      } else {
        statGains[name] = Math.max(1, total);
      }
      boostGains[name] = boost;
    }
    
    let msg = messages.success[random(0, messages.success.length - 1)];
    
    if (overflowPenalty > 0) {
      msg += `\n\n【经验溢出警告】经验已达上限，建议准备突破丹药后尝试突破。当前修炼效果降低${Math.floor(overflowPenalty * 100)}%。`;
    }
    
    // 添加丹药效果提示
    if (cultivationBoost > 0) {
      msg += `\n\n【丹药辅助】经验值提升${cultivationBoost}%！`;
    }
    
    return {
      success: true,
      message: msg,
      statChanges: statGains,
      itemsCost,
      cultivationBoost, // 返回丹药加成百分比
      baseGains, // 返回基础数值
      boostGains, // 返回丹药加成数值
      experienceGain: totalExpGain,
      experienceBoost: expBoost,
    };
  } else {
    return {
      success: false,
      message: messages.failure[random(0, messages.failure.length - 1)],
      statChanges: {},
      itemsCost
    };
  }
}

// 计算综合战力
export function calculatePower(protagonist: Protagonist): number {
  const stats = getFinalStats(protagonist.stats);
  return Math.floor(
    stats.体质 * 1.0 +
    stats.灵根 * 1.2 +
    stats.悟性 * 0.5 +
    stats.幸运 * 0.3 +
    stats.意志 * 0.8 +
    protagonist.level * 10
  );
}
