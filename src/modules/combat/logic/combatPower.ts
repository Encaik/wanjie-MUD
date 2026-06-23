/**
 * 战力计算系统（迁移版）
 * 
 * 使用统一计算系统实现战力计算
 * 保持旧接口兼容，内部使用新系统
 */

import { 
  quickCalculatePlayerPower, 
  quickCalculateEnemyPower,
  getCombatPowerRank as getPowerRank,
  formatCombatPower as formatPower,
  getCombatPowerRatio as getPowerRatio,
} from '@/core/calculation';
import type { Protagonist, Technique, Equipment, ActiveEffect, EnemyTier } from '@/core/types';

/**
 * 计算玩家战力
 * 
 * @param protagonist 主角对象
 * @param techniques 功法列表（已废弃，从 protagonist 获取）
 * @param equipments 装备列表（已废弃，从 protagonist 获取）
 * @param activeEffects 激活效果（已废弃，从 protagonist 获取）
 */
export function calculatePlayerCombatPower(
  protagonist: Protagonist,
  techniques: Technique[] = [],
  equipments: Equipment[] = [],
  activeEffects: ActiveEffect[] = []
): number {
  return quickCalculatePlayerPower(protagonist, techniques, equipments, activeEffects);
}

/**
 * 计算敌人战力
 */
export function calculateEnemyCombatPower(
  hp: number,
  attack: number,
  defense: number,
  level: number,
  tier: EnemyTier
): number {
  return quickCalculateEnemyPower(hp, attack, defense, level, tier);
}

/**
 * 获取战力等级描述
 */
export function getCombatPowerRank(power: number): { rank: string; color: string } {
  return getPowerRank(power);
}

/**
 * 格式化战力数值
 */
export function formatCombatPower(power: number): string {
  return formatPower(power);
}

/**
 * 计算战力差距比率
 */
export function getCombatPowerRatio(playerPower: number, enemyPower: number): {
  ratio: number;
  description: string;
  color: string;
} {
  return getPowerRatio(playerPower, enemyPower);
}
