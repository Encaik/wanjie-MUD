/**
 * modules/fortune/logic/rewardCalculator.ts — 奖励计算器
 *
 * 纯函数模块：根据节点类型、深度和机缘主题计算奖励。
 */

import type {
  NodeType,
  FortuneTypeId,
  FortuneLoot,
  CalculatedReward,
  FragmentGain,
} from '../types';
import { getNodeTypeConfig } from '../data/nodeTypeConfig';
import { getFortuneTypeConfig } from '../data/fortuneTypeConfig';

// ============================================
// 节点奖励计算
// ============================================

/**
 * 计算单个节点的奖励
 *
 * @param nodeType - 节点类型
 * @param depth - 当前深度
 * @param fortuneType - 机缘主题 ID
 * @param nodeRewardMultiplier - 节点自身奖励倍率
 * @returns 计算后的奖励
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

    // 经验加成（所有主题统一）
    if (bonuses.other && !bonuses.spirit_stones && !bonuses.fragments && !bonuses.consumables) {
      finalExperience = Math.floor(finalExperience * bonuses.other);
    }
  }

  // 碎片生成
  const fragments = generateFragmentsForNode(nodeType, depth, fortuneType);

  return {
    spiritStones: finalSpiritStones,
    experience: finalExperience,
    items: [],
    fragments,
    multiplier: nodeRewardMultiplier * depthScale,
  };
}

/**
 * 根据节点类型生成碎片
 */
function generateFragmentsForNode(
  nodeType: NodeType,
  depth: number,
  fortuneType: FortuneTypeId
): FragmentGain[] {
  const result: FragmentGain[] = [];
  const themeConfig = getFortuneTypeConfig(fortuneType);
  const fragmentMultiplier = themeConfig?.rewardBonuses.fragments || 1.0;

  switch (nodeType) {
    case 'elite': {
      // 精英：有概率掉落 1 个史诗碎片
      const count = Math.floor(1 * fragmentMultiplier);
      if (count > 0) {
        result.push({
          sourceName: `深度${depth}精英掉落`,
          type: 'equipment',
          rarity: 'epic',
          count,
        });
      }
      break;
    }
    case 'miniboss': {
      // 小头目：必定掉落 1-2 个史诗碎片
      const count = Math.floor((1 + Math.random()) * fragmentMultiplier);
      if (count > 0) {
        result.push({
          sourceName: `深度${depth}头目掉落`,
          type: 'technique',
          rarity: 'epic',
          count: Math.max(1, count),
        });
      }
      break;
    }
    case 'guardian': {
      // 守卫：必定掉落 2 个史诗碎片，有概率传说
      const count = Math.floor(2 * fragmentMultiplier);
      result.push({
        sourceName: `深度${depth}守卫掉落`,
        type: 'equipment',
        rarity: 'legendary',
        count: Math.max(1, count),
      });
      break;
    }
    case 'scroll_fragment': {
      // 残卷：必定掉落碎片
      const count = Math.floor((1 + Math.random()) * fragmentMultiplier);
      const rarity = Math.random() < 0.2 ? 'legendary' : 'epic';
      result.push({
        sourceName: '上古残卷',
        type: Math.random() < 0.5 ? 'technique' : 'equipment',
        rarity,
        count: Math.max(1, count),
      });
      break;
    }
    case 'challenge': {
      // 试炼碑：必定掉落传说碎片
      const count = Math.floor(2 * fragmentMultiplier);
      result.push({
        sourceName: '试炼碑奖励',
        type: 'technique',
        rarity: 'legendary',
        count: Math.max(1, count),
      });
      break;
    }
    default:
      break;
  }

  // 魔渊主题额外传说概率
  if (fortuneType === 'demon_abyss' && Math.random() < 0.3) {
    result.push({
      sourceName: '魔渊碎片',
      type: 'equipment',
      rarity: 'mythic',
      count: 1,
    });
  }

  return result;
}

// ============================================
// 楼层奖励
// ============================================

/**
 * 计算楼层完成奖励
 *
 * @param depth - 完成的楼层
 * @param fortuneType - 机缘主题 ID
 * @returns 楼层奖励
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
 *
 * @param depth - 通关的楼层
 * @param fortuneType - 机缘主题 ID
 * @returns 通关奖励
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
