/**
 * 态度值计算引擎
 *
 * 纯函数集合，处理 NPC 对玩家的态度值计算：
 * - 初始态度值（基于阵营关系）
 * - 态度变化量（基于玩家行为 + 阵营倍率）
 * - 态度等级判定（-100 到 +100 → 7 个等级）
 * - 敌意判定
 *
 * @module modules/npc/logic
 */

import type {
  AttitudeLevel,
  FactionRelation,
  NPCAttitudeConfig,
  NPCCombatBehavior,
} from '@/core/types';
import {
  ATTITUDE_LEVEL_RANGES,
  FACTION_RELATION_CONFIG,
} from '@/core/types';

// ============================================
// 态度等级判定
// ============================================

/**
 * 态度值 → 态度等级映射
 *
 * @param attitude - 当前态度值（-100 到 +100）
 * @returns 对应的态度等级
 */
export function getAttitudeLevel(attitude: number): AttitudeLevel {
  const clamped = clampAttitude(attitude);
  for (const [level, range] of Object.entries(ATTITUDE_LEVEL_RANGES)) {
    if (clamped >= range.min && clamped <= range.max) {
      return level as AttitudeLevel;
    }
  }
  return 'neutral';
}

/**
 * 态度值边界保护：clamp 到 [-100, 100]
 */
export function clampAttitude(value: number): number {
  return Math.max(-100, Math.min(100, Math.round(value)));
}

// ============================================
// 初始态度值
// ============================================

/**
 * 计算 NPC 对玩家的初始态度值
 *
 * @param attitudeConfig - NPC 的态度配置
 * @param playerFactionRelation - 玩家阵营与 NPC 阵营的关系（无阵营 = neutral）
 * @returns 初始态度值（已 clamp）
 */
export function calculateInitialAttitude(
  attitudeConfig: NPCAttitudeConfig,
  playerFactionRelation?: FactionRelation,
): number {
  const relation = playerFactionRelation || 'neutral';
  const factionConfig = FACTION_RELATION_CONFIG[relation];
  const initial = attitudeConfig.initialValue + factionConfig.initialAttitude;
  return clampAttitude(initial);
}

// ============================================
// 态度变化
// ============================================

/** 玩家行为对态度的影响类型 */
export type AttitudeAction =
  | 'help_faction_member'      // 帮助阵营成员
  | 'attack_faction_member'    // 攻击阵营成员
  | 'complete_faction_quest'   // 完成阵营任务
  | 'gift_item'                // 赠送物品
  | 'insult'                   // 冒犯对话
  | 'spar_win'                 // 切磋胜利
  | 'spar_lose';               // 切磋失败

/** 各行为的基础态度变化量 */
const ATTITUDE_ACTION_BASE: Record<AttitudeAction, { min: number; max: number }> = {
  help_faction_member:     { min: 5,  max: 15 },
  attack_faction_member:   { min: -50, max: -20 },
  complete_faction_quest:  { min: 10, max: 30 },
  gift_item:               { min: 10, max: 20 },
  insult:                  { min: -15, max: -5 },
  spar_win:                { min: 3,  max: 10 },
  spar_lose:               { min: -8, max: -3 },
};

/**
 * 计算态度值变化量
 *
 * @param currentAttitude - 当前态度值
 * @param action - 玩家行为类型
 * @param factionRelation - 阵营关系（用于倍率修正）
 * @param seed - 确定性随机种子（用于在 min/max 范围内插值）
 * @returns 变化量（正=提升，负=降低）
 */
export function calculateAttitudeChange(
  currentAttitude: number,
  action: AttitudeAction,
  factionRelation: FactionRelation = 'neutral',
  seed: number = 0.5,
): number {
  const base = ATTITUDE_ACTION_BASE[action];
  const baseChange = base.min + (base.max - base.min) * (seed % 1);

  const config = FACTION_RELATION_CONFIG[factionRelation];
  const isPositive = baseChange >= 0;
  const multiplier = isPositive ? config.positiveMultiplier : config.negativeMultiplier;

  return Math.round(baseChange * multiplier);
}

/**
 * 批量计算态度变化（应用变化到当前值）
 *
 * @param currentAttitude - 当前态度值
 * @param changes - 多条变化量
 * @returns 新的态度值（已 clamp）
 */
export function applyAttitudeChanges(
  currentAttitude: number,
  changes: number[],
): number {
  const total = changes.reduce((sum, c) => sum + c, currentAttitude);
  return clampAttitude(total);
}

// ============================================
// 敌意判定
// ============================================

/**
 * 判断 NPC 是否主动敌对（基于态度值和 aggressionThreshold）
 *
 * @param attitude - 当前态度值
 * @param combatBehavior - NPC 的战斗行为配置
 * @returns true = NPC 会主动攻击
 */
export function isHostile(
  attitude: number,
  combatBehavior: NPCCombatBehavior,
): boolean {
  return attitude < combatBehavior.aggressionThreshold;
}

/**
 * 判断 NPC 是否应该逃跑
 *
 * @param currentHpRatio - 当前 HP / 最大 HP（0~1）
 * @param combatBehavior - NPC 的战斗行为配置
 * @returns true = NPC 应该逃跑
 */
export function shouldNPCFlee(
  currentHpRatio: number,
  combatBehavior: NPCCombatBehavior,
): boolean {
  if (combatBehavior.fleeThreshold <= 0) return false;
  return currentHpRatio < combatBehavior.fleeThreshold;
}
