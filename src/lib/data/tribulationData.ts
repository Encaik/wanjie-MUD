/**
 * 渡劫配置数据
 * 定义不同境界的渡劫难度、奖励和惩罚
 */

import { LegacyStats, StatKey } from '../game/types';
import { TribulationConfig } from '../game/typesExtension';

// 渡劫配置 - 每10级触发一次
export const TRIBULATION_CONFIGS: TribulationConfig[] = [
  {
    realmTier: 10, // 炼气期 → 筑基期
    name: '筑基雷劫',
    description: '天降雷劫，淬炼根基。成功则筑基成功，失败则根基受损。',
    baseSuccessRate: 0.6,
    statBonuses: {
      '体质': 0.02,
      '灵根': 0.02,
      '幸运': 0.03
    },
    failPenalty: {
      hpLoss: 0.2,
      statLoss: { '体质': 1, '灵根': 1 },
      weaknessTurns: 5
    },
    successReward: {
      statBonus: { '体质': 3, '灵根': 3, '悟性': 2, '幸运': 2 },
      specialEffect: '根基稳固，修炼效率永久提升5%',
      title: '筑基修士'
    }
  },
  {
    realmTier: 20, // 筑基期 → 金丹期
    name: '金丹天劫',
    description: '天地劫难降临，需凝聚金丹。此劫更为凶险，需有充分准备。',
    baseSuccessRate: 0.5,
    statBonuses: {
      '体质': 0.015,
      '灵根': 0.02,
      '幸运': 0.025
    },
    failPenalty: {
      hpLoss: 0.3,
      statLoss: { '体质': 2, '灵根': 2, '悟性': 1 },
      weaknessTurns: 8
    },
    successReward: {
      statBonus: { '体质': 5, '灵根': 5, '悟性': 3, '幸运': 3 },
      specialEffect: '金丹初成，寿元大增',
      title: '金丹真人'
    }
  },
  {
    realmTier: 30, // 金丹期 → 元婴期
    name: '元婴心劫',
    description: '此劫考验心性，需斩断执念，凝聚元婴。心性不坚者难渡此劫。',
    baseSuccessRate: 0.45,
    statBonuses: {
      '灵根': 0.025,
      '幸运': 0.03
    },
    failPenalty: {
      hpLoss: 0.35,
      statLoss: { '灵根': 3, '体质': 2 },
      weaknessTurns: 10
    },
    successReward: {
      statBonus: { '体质': 7, '灵根': 7, '悟性': 4, '幸运': 4 },
      specialEffect: '元婴初生，可离体而行',
      title: '元婴老祖'
    }
  },
  {
    realmTier: 40, // 元婴期 → 化神期
    name: '化神天罚',
    description: '天道降罚，考验修士是否逆天而行。此劫九死一生。',
    baseSuccessRate: 0.4,
    statBonuses: {
      '体质': 0.02,
      '灵根': 0.02,
      '幸运': 0.035
    },
    failPenalty: {
      hpLoss: 0.4,
      statLoss: { '体质': 3, '灵根': 3, '悟性': 2, '幸运': 2 },
      weaknessTurns: 12
    },
    successReward: {
      statBonus: { '体质': 10, '灵根': 10, '悟性': 6, '幸运': 6 },
      specialEffect: '化神成功，可借天地之力',
      title: '化神尊者'
    }
  },
  {
    realmTier: 50, // 化神期 → 返虚期
    name: '返虚归真劫',
    description: '返虚归真，需舍弃肉身执念，与天地合一。此劫最为玄妙。',
    baseSuccessRate: 0.35,
    statBonuses: {
      '灵根': 0.03,
      '幸运': 0.04
    },
    failPenalty: {
      hpLoss: 0.5,
      statLoss: { '灵根': 4, '体质': 3 },
      weaknessTurns: 15
    },
    successReward: {
      statBonus: { '体质': 15, '灵根': 15, '悟性': 8, '幸运': 8 },
      specialEffect: '返虚成功，可穿梭虚空',
      title: '返虚道君'
    }
  }
];

// 获取当前等级对应的渡劫配置
export function getTribulationConfig(level: number): TribulationConfig | null {
  // 找到小于等于当前等级的最大境界门槛
  for (let i = TRIBULATION_CONFIGS.length - 1; i >= 0; i--) {
    if (level >= TRIBULATION_CONFIGS[i].realmTier) {
      return TRIBULATION_CONFIGS[i];
    }
  }
  return null;
}

// 获取下一个渡劫等级
export function getNextTribulationLevel(currentLevel: number): number | null {
  for (const config of TRIBULATION_CONFIGS) {
    if (config.realmTier > currentLevel) {
      return config.realmTier;
    }
  }
  return null;
}

// 计算渡劫成功率
export function calculateSuccessRate(
  config: TribulationConfig,
  stats: LegacyStats
): number {
  let rate = config.baseSuccessRate;
  
  // 添加属性加成
  Object.entries(config.statBonuses).forEach(([stat, bonus]) => {
    const statKey = stat as StatKey;
    const statValue = stats[statKey] || 0;
    if (typeof bonus === 'number') {
      rate += statValue * bonus;
    }
  });
  
  // 上限95%
  return Math.min(0.95, Math.max(0.1, rate));
}
