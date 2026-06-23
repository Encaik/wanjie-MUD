/**
 * modules/fortune/logic/depthManager.ts — 深度楼层管理器
 *
 * 纯函数模块：处理机缘楼层推进、撤退、死亡惩罚和通关奖励逻辑。
 */

import { getFortuneTypeConfig } from '../data/fortuneTypeConfig';

import type {
  FortuneSession,
  FloorTransition,
  FloorPreview,
  RetreatResult,
  DeathPenalty,
  CompletionBonus,
  FortuneLoot,
} from '../types';

// ============================================
// 楼层过渡
// ============================================

/**
 * 检查是否可以进入下一层
 */
export function canEnterNextFloor(session: FortuneSession): boolean {
  return session.currentDepth < session.maxDepth;
}

/**
 * 创建楼层过渡信息
 *
 * @param session - 当前会话
 * @returns 楼层过渡数据
 */
export function createFloorTransition(session: FortuneSession): FloorTransition {
  const canContinue = canEnterNextFloor(session);
  const currentDepthLoot = session.depthLoots[session.depthLoots.length - 1] || emptyLoot();

  const nextFloorPreview: FloorPreview | null = canContinue
    ? {
        depth: session.currentDepth + 1,
        gridSize: 5 + (session.currentDepth + 1) * 2,
        rewardMultiplier: 1.0 + session.currentDepth * 0.3,
        enemyLevelRange: [
          3 + (session.currentDepth + 1) * 2,
          3 + (session.currentDepth + 1) * 4,
        ],
      }
    : null;

  return {
    currentDepth: session.currentDepth,
    nextFloorPreview,
    floorLoot: currentDepthLoot,
    accumulatedLoot: session.accumulatedLoot,
    canContinue,
  };
}

// ============================================
// 撤退
// ============================================

/**
 * 计算撤退结果
 *
 * @param session - 当前会话
 * @returns 撤退结果（保留全部收获）
 */
export function getRetreatResult(session: FortuneSession): RetreatResult {
  return {
    retainedLoot: { ...session.accumulatedLoot },
    unlockedSweepDepth: session.currentDepth,
  };
}

// ============================================
// 死亡惩罚
// ============================================

/**
 * 计算死亡惩罚
 *
 * 规则：
 * - F1 死亡：丢失 F1 50%
 * - F2 死亡：保留 F1 100%，丢失 F2 50%
 * - F3+ 死亡：保留前 N-2 层 100%，丢失最近 2 层 50%
 *
 * @param session - 当前会话
 * @returns 死亡惩罚结果
 */
export function calculateDeathPenalty(session: FortuneSession): DeathPenalty {
  const depth = session.currentDepth;
  const allDepthLoots = session.depthLoots;

  // 确定丢失的层
  let lostLoot: FortuneLoot = emptyLoot();
  let retainedLoot: FortuneLoot = emptyLoot();
  let penaltyDesc = '';

  if (depth <= 1) {
    // F1 死亡：丢失 F1 50%
    const f1Loot = allDepthLoots[0] || session.accumulatedLoot;
    lostLoot = multiplyLoot(f1Loot, 0.5);
    retainedLoot = multiplyLoot(f1Loot, 0.5);
    penaltyDesc = '丢失第 1 层 50% 收获';
  } else if (depth === 2) {
    // F2 死亡：保留 F1 100%，丢失 F2 50%
    const f1Loot = allDepthLoots[0] || emptyLoot();
    const f2Loot = allDepthLoots[1]
      ? subtractLoot(session.accumulatedLoot, f1Loot)
      : multiplyLoot(session.accumulatedLoot, 0.5);

    retainedLoot = addLoot(f1Loot, multiplyLoot(f2Loot, 0.5));
    lostLoot = multiplyLoot(f2Loot, 0.5);
    penaltyDesc = '保留第 1 层全部收获，丢失第 2 层 50% 收获';
  } else {
    // F3+ 死亡：保留前 N-2 层 100%，丢失最近 2 层 50%
    const keepCount = Math.max(0, depth - 2);
    for (let i = 0; i < keepCount; i++) {
      retainedLoot = addLoot(retainedLoot, allDepthLoots[i] || emptyLoot());
    }

    let recentTwoLayersLoot = emptyLoot();
    for (let i = keepCount; i < depth; i++) {
      recentTwoLayersLoot = addLoot(recentTwoLayersLoot, allDepthLoots[i] || emptyLoot());
    }

    retainedLoot = addLoot(retainedLoot, multiplyLoot(recentTwoLayersLoot, 0.5));
    lostLoot = multiplyLoot(recentTwoLayersLoot, 0.5);
    penaltyDesc = `保留前 ${keepCount} 层全部收获，丢失最近 2 层 50% 收获`;
  }

  return {
    lostLoot,
    retainedLoot,
    deathDepth: depth,
    penaltyDescription: penaltyDesc,
  };
}

// ============================================
// 通关奖励
// ============================================

/**
 * 计算通关奖励
 *
 * @param session - 当前会话
 * @returns 通关奖励
 */
export function getCompletionBonus(session: FortuneSession): CompletionBonus {
  const depth = session.currentDepth;
  const themeConfig = getFortuneTypeConfig(session.fortuneType);

  // 基础通关奖励 = 楼层深度 × 系数
  const spiritStones = depth * 50;
  const experience = depth * 40;

  // 应用主题死亡惩罚倍率（魔渊通关奖励也受影响）
  let multiplier = 1.0;
  if (themeConfig) {
    const deathPenaltyMult = themeConfig.rewardBonuses.death_penalty;
    if (deathPenaltyMult !== undefined) {
      multiplier = deathPenaltyMult;
    }
  }

  return {
    spiritStones: Math.floor(spiritStones * multiplier),
    experience: Math.floor(experience * multiplier),
    unlockedSweepDepth: depth,
  };
}

// ============================================
// 工具函数
// ============================================

/** 创建空收获 */
function emptyLoot(): FortuneLoot {
  return {
    spiritStones: 0,
    items: [],
    fragments: [],
    experience: 0,
  };
}

/** 收获乘以系数 */
function multiplyLoot(loot: FortuneLoot, ratio: number): FortuneLoot {
  return {
    spiritStones: Math.floor(loot.spiritStones * ratio),
    items: loot.items.map(i => ({
      ...i,
      quantity: Math.floor(i.quantity * ratio),
    })).filter(i => i.quantity > 0),
    fragments: loot.fragments.map(f => ({
      ...f,
      count: Math.floor(f.count * ratio),
    })).filter(f => f.count > 0),
    experience: Math.floor(loot.experience * ratio),
  };
}

/** 收获相加 */
function addLoot(a: FortuneLoot, b: FortuneLoot): FortuneLoot {
  return {
    spiritStones: a.spiritStones + b.spiritStones,
    items: [...a.items, ...b.items],
    fragments: [...a.fragments, ...b.fragments],
    experience: a.experience + b.experience,
  };
}

/** 收获相减 */
function subtractLoot(a: FortuneLoot, b: FortuneLoot): FortuneLoot {
  return {
    spiritStones: Math.max(0, a.spiritStones - b.spiritStones),
    items: a.items, // 简化处理
    fragments: a.fragments, // 简化处理
    experience: Math.max(0, a.experience - b.experience),
  };
}
