/**
 * 元素克制修正计算
 *
 * 封装现有的克制关系系统，提供战斗界面所需的元素克制状态判定。
 * 核心计算逻辑委托给 restraintSystem，本模块提供简化的查询接口。
 */

import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import {
  calculateElementMultiplier,
  calculateWeaponMultiplier,
  calculateRestraintResult,
} from '@/modules/combat/logic/restraintSystem';

/**
 * 计算攻击方对防御方的元素伤害倍率
 *
 * @param attackerElement - 攻击方元素
 * @param defenderElement - 防御方元素
 * @returns 伤害倍率（>1.0 克制，<1.0 被克，1.0 中性）
 */
export function calculateElementalModifier(
  attackerElement: Element | null,
  defenderElement: Element | null
): number {
  return calculateElementMultiplier(attackerElement, defenderElement);
}

/**
 * 计算武器克制伤害倍率
 *
 * @param attackerWeapon - 攻击方武器类型
 * @param defenderWeapon - 防御方武器类型
 * @returns 伤害倍率
 */
export function calculateWeaponModifier(
  attackerWeapon: WeaponCategory | null,
  defenderWeapon: WeaponCategory | null
): number {
  return calculateWeaponMultiplier(attackerWeapon, defenderWeapon);
}

/**
 * 获取元素克制状态描述
 *
 * @param attackerElement - 攻击方元素
 * @param defenderElement - 防御方元素
 * @returns 克制状态：'advantage'（克制对方）、'disadvantage'（被克制）、'neutral'（中性）
 */
export function getElementalStatus(
  attackerElement: Element | null,
  defenderElement: Element | null
): 'advantage' | 'disadvantage' | 'neutral' {
  if (!attackerElement || !defenderElement) return 'neutral';
  const multiplier = calculateElementMultiplier(attackerElement, defenderElement);
  if (multiplier > 1.0) return 'advantage';
  if (multiplier < 1.0) return 'disadvantage';
  return 'neutral';
}

/**
 * 综合计算全套克制结果
 *
 * @param attackerElement - 攻击方元素
 * @param defenderElement - 防御方元素
 * @param attackerWeapon - 攻击方武器
 * @param defenderWeapon - 防御方武器
 * @returns 包含综合倍率和克制类型的完整结果
 */
export function calculateFullRestraint(
  attackerElement: Element | null,
  defenderElement: Element | null,
  attackerWeapon: WeaponCategory | null,
  defenderWeapon: WeaponCategory | null
): { multiplier: number; type: string } {
  const result = calculateRestraintResult(
    attackerElement,
    defenderElement,
    attackerWeapon,
    defenderWeapon
  );
  return {
    multiplier: result.damageMultiplier,
    type: result.restraintType,
  };
}
