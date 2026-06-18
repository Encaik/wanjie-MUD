/**
 * modules/fortune/logic/rewardCalculator.ts — 奖励计算器
 *
 * 纯函数模块：根据节点类型、深度和机缘主题计算基础奖励（灵石+经验）。
 * 物品/碎片掉落已迁移到 modules/reward-pool/，通过 Hook 层集成。
 */

import type {
  NodeType,
  FortuneTypeId,
  FortuneLoot,
  CalculatedReward,
} from '../types';
import { getNodeTypeConfig } from '../data/nodeTypeConfig';
import { getFortuneTypeConfig } from '../data/fortuneTypeConfig';

// ============================================
// 节点奖励计算
// ============================================

/**
 * 计算单个节点的基础奖励（灵石 + 经验）
 *
 * 物品和碎片奖励通过 modules/reward-pool/ 的 poolEngine.rollPool() 生成。
 * 节点类型到 poolId 的映射见 fortuneTypeConfig。
 *
 * @param nodeType - 节点类型
 * @param depth - 当前深度
 * @param fortuneType - 机缘主题 ID
 * @param nodeRewardMultiplier - 节点自身奖励倍率
 * @returns 计算后的奖励（items 和 fragments 为空，由 Hook 层填充）
 */
export function calculateNodeReward(
  nodeType: NodeType,
  depth: number,
  fortuneType: FortuneTypeId,
  nodeRewardMultiplier: number = 1.0
): CalculatedReward {
  const nodeConfig = getNodeTypeConfig(nodeType);
  const themeConfig = getFortuneTypeConfig(fortuneType);

  // 基础值（随深度缩放）
  const depthScale = 1.0 + (depth - 1) * 0.3;
  const baseSpiritStones = Math.floor(nodeConfig.baseSpiritStones * depthScale);
  const baseExperience = Math.floor(nodeConfig.baseExperience * depthScale);

  // 应用节点倍率
  let finalSpiritStones = Math.floor(baseSpiritStones * nodeRewardMultiplier);
  let finalExperience = Math.floor(baseExperience * nodeRewardMultiplier);

  // 应用主题奖励修正
  if (themeConfig) {
    const bonuses = themeConfig.rewardBonuses;

    // 灵石加成
    if (bonuses.spirit_stones) {
      finalSpiritStones = Math.floor(finalSpiritStones * bonuses.spirit_stones);
    } else if (bonuses.other) {
      finalSpiritStones = Math.floor(finalSpiritStones * bonuses.other);
    }

    // 经验加成
    if (bonuses.other && !bonuses.spirit_stones && !bonuses.fragments && !bonuses.consumables) {
      finalExperience = Math.floor(finalExperience * bonuses.other);
    }
  }

  // 物品和碎片由 Hook 层通过 poolEngine.rollPool() 生成
  return {
    spiritStones: finalSpiritStones,
    experience: finalExperience,
    items: [],
    fragments: [],
    multiplier: nodeRewardMultiplier * depthScale,
  };
}

// ============================================
// 楼层奖励
// ============================================

/**
 * 计算楼层完成奖励
 */
export function calculateFloorBonus(
  depth: number,
  fortuneType: FortuneTypeId
): CalculatedReward {
  const baseSpiritStones = 25 * depth;
  const baseExperience = 15 * depth;

  return {
    spiritStones: baseSpiritStones,
    experience: baseExperience,
    items: [],
    fragments: [],
    multiplier: 1.0 + depth * 0.1,
  };
}

/**
 * 计算通关完成奖励
 */
export function calculateCompletionBonus(
  depth: number,
  fortuneType: FortuneTypeId
): CalculatedReward {
  const themeConfig = getFortuneTypeConfig(fortuneType);
  let multiplier = 1.0;

  if (themeConfig?.rewardBonuses.death_penalty) {
    multiplier = themeConfig.rewardBonuses.death_penalty;
  }

  return {
    spiritStones: Math.floor(100 * depth * multiplier),
    experience: Math.floor(60 * depth * multiplier),
    items: [],
    fragments: [],
    multiplier,
  };
}
