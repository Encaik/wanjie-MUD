/**
 * modules/fortune/data/fortuneTypeConfig.ts — 机缘主题配置
 *
 * 定义 5 种机缘主题的地形分布、节点权重、奖励倍率和解锁条件。
 */

import type { FortuneTypeId, TerrainType, NodeType, RewardCategory } from '../types';

/** 机缘主题配置 */
export interface FortuneTypeConfigEntry {
  /** 主题 ID */
  id: FortuneTypeId;
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description: string;
  /** 难度星级 */
  difficultyStars: 1 | 2 | 3 | 4 | 5;
  /** 最低玩家等级 */
  minPlayerLevel: number;
  /** 最少层数 */
  minDepth: number;
  /** 最多层数 */
  maxDepth: number;
  /** 地形分布权重（总和应为 1） */
  terrainDistribution: Record<TerrainType, number>;
  /** 节点出现权重 */
  nodeTypeWeights: Partial<Record<NodeType, number>>;
  /** 奖励倍率 */
  rewardBonuses: Partial<Record<RewardCategory, number>>;
  /** 图标 */
  icon: string;
}

/** 机缘主题配置表 */
export const FORTUNE_TYPE_CONFIGS: Record<string, FortuneTypeConfigEntry> = {
  spirit_vein: {
    id: 'spirit_vein',
    name: '灵矿脉',
    description: '灵气浓郁的矿脉深处，盛产灵石，适合积累财富。洞窟密布、山崖险峻，视野受限但矿藏丰富。',
    difficultyStars: 1,
    minPlayerLevel: 1,
    minDepth: 3,
    maxDepth: 5,
    terrainDistribution: {
      cave: 0.50,
      cliff: 0.25,
      plain: 0.15,
      spring: 0.05,
      forest: 0.03,
      swamp: 0.01,
      ruins: 0.01,
    },
    nodeTypeWeights: {
      enemy: 0.18,
      elite: 0.05,
      miniboss: 0.02,
      guardian: 0.03,
      mineral_vein: 0.22,
      treasure: 0.10,
      event: 0.08,
      trap: 0.10,
      portal: 0.05,
      fog: 0.07,
      challenge: 0.03,
      altar: 0.02,
      scroll_fragment: 0.03,
      herb: 0.02,
    },
    rewardBonuses: {
      spirit_stones: 2.0,
      other: 0.7,
    },
    icon: '💎',
  },

  ancient_battlefield: {
    id: 'ancient_battlefield',
    name: '古战场',
    description: '远古大战的遗迹，遍地残兵断甲。功法碎片和装备残片在此大量散落，是收集碎片的绝佳之地。',
    difficultyStars: 2,
    minPlayerLevel: 10,
    minDepth: 3,
    maxDepth: 5,
    terrainDistribution: {
      ruins: 0.45,
      plain: 0.25,
      swamp: 0.10,
      cliff: 0.08,
      forest: 0.05,
      cave: 0.04,
      spring: 0.03,
    },
    nodeTypeWeights: {
      enemy: 0.15,
      elite: 0.08,
      miniboss: 0.04,
      guardian: 0.03,
      scroll_fragment: 0.18,
      challenge: 0.10,
      treasure: 0.08,
      event: 0.08,
      altar: 0.05,
      mineral_vein: 0.05,
      trap: 0.06,
      fog: 0.04,
      portal: 0.03,
      herb: 0.03,
    },
    rewardBonuses: {
      fragments: 2.0,
      other: 0.7,
    },
    icon: '⚔️',
  },

  herb_valley: {
    id: 'herb_valley',
    name: '药谷',
    description: '幽静的草药谷，灵气充沛。各种珍稀药草在此生长，还有游商出没，适合收集炼丹材料。',
    difficultyStars: 1,
    minPlayerLevel: 1,
    minDepth: 3,
    maxDepth: 6,
    terrainDistribution: {
      forest: 0.45,
      spring: 0.15,
      plain: 0.17,
      swamp: 0.10,
      ruins: 0.05,
      cliff: 0.05,
      cave: 0.03,
    },
    nodeTypeWeights: {
      enemy: 0.16,
      elite: 0.03,
      miniboss: 0.01,
      guardian: 0.03,
      herb: 0.22,
      treasure: 0.08,
      event: 0.10,
      merchant: 0.06,
      altar: 0.06,
      mineral_vein: 0.05,
      scroll_fragment: 0.04,
      trap: 0.06,
      portal: 0.04,
      fog: 0.06,
    },
    rewardBonuses: {
      consumables: 2.0,
      materials: 1.5,
      other: 0.7,
    },
    icon: '🌿',
  },

  mystic_realm: {
    id: 'mystic_realm',
    name: '秘境',
    description: '神秘莫测的远古秘境，地形复杂多变。这里的一切都充满未知，各种机缘均衡分布，稀有物品出现概率更高。',
    difficultyStars: 3,
    minPlayerLevel: 20,
    minDepth: 3,
    maxDepth: 5,
    terrainDistribution: {
      plain: 0.20,
      forest: 0.18,
      cave: 0.17,
      cliff: 0.13,
      ruins: 0.12,
      spring: 0.10,
      swamp: 0.10,
    },
    nodeTypeWeights: {
      enemy: 0.12,
      elite: 0.06,
      miniboss: 0.03,
      guardian: 0.03,
      treasure: 0.10,
      scroll_fragment: 0.08,
      herb: 0.06,
      mineral_vein: 0.06,
      event: 0.12,
      challenge: 0.06,
      merchant: 0.04,
      altar: 0.05,
      portal: 0.06,
      trap: 0.05,
      fog: 0.08,
    },
    rewardBonuses: {
      rarity_up: 1,
      balanced: 1.0,
    },
    icon: '🔮',
  },

  demon_abyss: {
    id: 'demon_abyss',
    name: '魔渊',
    description: '魔气弥漫的深渊裂隙，极度危险。毒沼遍布、洞窟幽深。传说品质的掉落概率极高，但失败的代价同样惨重。',
    difficultyStars: 5,
    minPlayerLevel: 40,
    minDepth: 2,
    maxDepth: 4,
    terrainDistribution: {
      swamp: 0.45,
      cave: 0.25,
      cliff: 0.12,
      ruins: 0.08,
      plain: 0.05,
      forest: 0.03,
      spring: 0.02,
    },
    nodeTypeWeights: {
      enemy: 0.10,
      elite: 0.12,
      miniboss: 0.06,
      guardian: 0.05,
      challenge: 0.12,
      trap: 0.12,
      event: 0.10,
      treasure: 0.06,
      scroll_fragment: 0.06,
      altar: 0.05,
      mineral_vein: 0.04,
      herb: 0.03,
      merchant: 0.03,
      portal: 0.02,
      fog: 0.04,
    },
    rewardBonuses: {
      legendary_rate: 3.0,
      death_penalty: 2.0,
    },
    icon: '💀',
  },

  // ─── 专项机缘（定向 farming）───

  weapon_armory: {
    id: 'weapon_armory',
    name: '武器库',
    description: '远古兵器库遗迹，只产出各类武器。适合收集神兵利器的修炼者。',
    difficultyStars: 2,
    minPlayerLevel: 15,
    minDepth: 3,
    maxDepth: 5,
    terrainDistribution: {
      cave: 0.40,
      ruins: 0.30,
      cliff: 0.15,
      plain: 0.08,
      forest: 0.05,
      swamp: 0.01,
      spring: 0.01,
    },
    nodeTypeWeights: {
      enemy: 0.18,
      elite: 0.08,
      miniboss: 0.03,
      guardian: 0.03,
      treasure: 0.18,
      challenge: 0.10,
      scroll_fragment: 0.10,
      mineral_vein: 0.08,
      event: 0.07,
      trap: 0.06,
      altar: 0.04,
      portal: 0.03,
      fog: 0.02,
    },
    rewardBonuses: {
      balanced: 1.0,
    },
    icon: '🗡️',
  },

  skill_sanctum: {
    id: 'skill_sanctum',
    name: '技阁',
    description: '封存上古技能的密室，只产出技能书。想要学习稀有技能的修炼者不可错过。',
    difficultyStars: 2,
    minPlayerLevel: 15,
    minDepth: 3,
    maxDepth: 5,
    terrainDistribution: {
      ruins: 0.45,
      cave: 0.25,
      plain: 0.12,
      cliff: 0.08,
      forest: 0.05,
      spring: 0.03,
      swamp: 0.02,
    },
    nodeTypeWeights: {
      enemy: 0.16,
      elite: 0.07,
      miniboss: 0.03,
      guardian: 0.03,
      treasure: 0.16,
      scroll_fragment: 0.14,
      challenge: 0.10,
      altar: 0.06,
      event: 0.08,
      mineral_vein: 0.05,
      trap: 0.05,
      portal: 0.04,
      fog: 0.03,
    },
    rewardBonuses: {
      balanced: 1.0,
    },
    icon: '📖',
  },

  treasury: {
    id: 'treasury',
    name: '金库',
    description: '灵气凝结的宝库，大量产出灵石与稀有货币。适合急需积累财富的修炼者。',
    difficultyStars: 1,
    minPlayerLevel: 10,
    minDepth: 3,
    maxDepth: 6,
    terrainDistribution: {
      cave: 0.55,
      cliff: 0.20,
      plain: 0.10,
      ruins: 0.08,
      forest: 0.04,
      spring: 0.02,
      swamp: 0.01,
    },
    nodeTypeWeights: {
      enemy: 0.16,
      elite: 0.05,
      miniboss: 0.02,
      guardian: 0.03,
      mineral_vein: 0.22,
      treasure: 0.18,
      event: 0.10,
      trap: 0.08,
      portal: 0.05,
      fog: 0.05,
      challenge: 0.03,
      altar: 0.02,
      scroll_fragment: 0.01,
    },
    rewardBonuses: {
      spirit_stones: 3.0,
      other: 0.5,
    },
    icon: '💰',
  },

  scriptorium: {
    id: 'scriptorium',
    name: '经阁',
    description: '藏经之所，只产出功法卷轴。高稀有度功法在此大量涌现，但难度不低。',
    difficultyStars: 3,
    minPlayerLevel: 20,
    minDepth: 3,
    maxDepth: 5,
    terrainDistribution: {
      ruins: 0.50,
      cave: 0.20,
      plain: 0.12,
      cliff: 0.08,
      forest: 0.05,
      spring: 0.03,
      swamp: 0.02,
    },
    nodeTypeWeights: {
      enemy: 0.14,
      elite: 0.08,
      miniboss: 0.04,
      guardian: 0.03,
      scroll_fragment: 0.16,
      treasure: 0.12,
      challenge: 0.10,
      event: 0.08,
      altar: 0.06,
      mineral_vein: 0.05,
      trap: 0.06,
      portal: 0.04,
      fog: 0.04,
    },
    rewardBonuses: {
      rarity_up: 1,
      balanced: 1.0,
    },
    icon: '📜',
  },

  forge: {
    id: 'forge',
    name: '锻炉',
    description: '地火锻炉遗迹，大量产出锻造材料与碎片。是锻造和炼丹爱好者的天堂。',
    difficultyStars: 1,
    minPlayerLevel: 10,
    minDepth: 3,
    maxDepth: 6,
    terrainDistribution: {
      cave: 0.45,
      cliff: 0.20,
      ruins: 0.15,
      plain: 0.10,
      swamp: 0.05,
      forest: 0.03,
      spring: 0.02,
    },
    nodeTypeWeights: {
      enemy: 0.16,
      elite: 0.05,
      miniboss: 0.02,
      guardian: 0.03,
      mineral_vein: 0.18,
      herb: 0.16,
      treasure: 0.12,
      scroll_fragment: 0.10,
      event: 0.06,
      trap: 0.05,
      portal: 0.03,
      fog: 0.02,
      altar: 0.02,
    },
    rewardBonuses: {
      materials: 2.0,
      consumables: 1.5,
      other: 0.6,
    },
    icon: '🔨',
  },
};

/** 获取机缘主题配置 */
export function getFortuneTypeConfig(id: FortuneTypeId): FortuneTypeConfigEntry | undefined {
  return FORTUNE_TYPE_CONFIGS[id];
}

/** 获取所有预置机缘主题 ID */
export function getPresetFortuneTypeIds(): FortuneTypeId[] {
  return Object.keys(FORTUNE_TYPE_CONFIGS);
}

/** 获取玩家可用的机缘主题 */
export function getAvailableFortuneTypes(playerLevel: number): FortuneTypeConfigEntry[] {
  return Object.values(FORTUNE_TYPE_CONFIGS).filter(c => playerLevel >= c.minPlayerLevel);
}
