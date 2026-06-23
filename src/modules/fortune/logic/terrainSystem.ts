/**
 * modules/fortune/logic/terrainSystem.ts — 地形效果系统
 *
 * 纯函数模块：计算地形对移动、视野、节点概率的影响。
 */

import { getTerrainConfig } from '../data/terrainConfig';

import type { TerrainType, TerrainEffect, FortuneSession } from '../types';

/**
 * 获取在地形上移动的体力消耗
 */
export function getMoveCost(terrain: TerrainType): number {
  return getTerrainConfig(terrain).moveCost;
}

/**
 * 结算进入地形时的效果
 *
 * @param terrain - 进入的地形类型
 * @param playerMaxHp - 玩家最大 HP
 * @param playerMaxMp - 玩家最大 MP
 * @returns 地形效果（HP/MP 变化、Buff/Debuff）
 */
export function resolveTerrainEffect(
  terrain: TerrainType,
  playerMaxHp: number,
  playerMaxMp: number
): TerrainEffect {
  const config = getTerrainConfig(terrain);

  return {
    staminaCost: config.moveCost,
    hpChangeRatio: config.hpChangeRatio,
    mpChangeRatio: config.mpChangeRatio,
    appliedBuffs: [],
  };
}

/**
 * 计算地形对视野的修正
 *
 * @param terrain - 所在格子的地形
 * @returns 视野修正值（正=增加，负=减少）
 *
 * 特殊处理：洞窟返回 -99，在 visionSystem 中会被 clamp 到 1
 */
export function getVisionModifier(terrain: TerrainType): number {
  return getTerrainConfig(terrain).visionModifier;
}

/**
 * 获取地形对节点权重的修正
 *
 * @param terrain - 地形类型
 * @returns 节点权重修正映射
 */
export function getTerrainNodeModifiers(
  terrain: TerrainType
): Partial<Record<string, number>> {
  return getTerrainConfig(terrain).nodeWeightModifiers;
}

/**
 * 检查当前体力是否足够移动到目标地形
 */
export function canMoveOnTerrain(
  session: FortuneSession,
  terrain: TerrainType
): { canMove: boolean; reason?: string } {
  const cost = getMoveCost(terrain);

  if (!session) {
    return { canMove: false, reason: '不在机缘中' };
  }

  if (session.stamina < cost) {
    return {
      canMove: false,
      reason: `体力不足（需要 ${cost}，当前 ${session.stamina}）`,
    };
  }

  return { canMove: true };
}

/**
 * 获取当前体力状态描述
 */
export function getStaminaStatus(session: FortuneSession): {
  status: 'ok' | 'low' | 'critical';
  message: string;
} {
  const ratio = session.stamina / session.maxStamina;

  if (ratio <= 0.2) {
    return {
      status: 'critical',
      message: `体力严重不足（${session.stamina}/${session.maxStamina}），建议退出`,
    };
  }

  if (ratio <= 0.4) {
    return {
      status: 'low',
      message: `体力偏低（${session.stamina}/${session.maxStamina}）`,
    };
  }

  return {
    status: 'ok',
    message: `体力充足（${session.stamina}/${session.maxStamina}）`,
  };
}
