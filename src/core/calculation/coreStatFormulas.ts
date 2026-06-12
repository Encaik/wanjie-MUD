/**
 * 基于核心值的计算公式（V3）
 *
 * 所有公式消费 CoreStatValues 而非硬编码属性名。
 * 这是新数值系统的公式层，与旧 balanceConfig 并行运行，逐步替代。
 *
 * 纯函数：无副作用，不修改输入，不使用 Math.random()。
 *
 * @module core/calculation
 */

import type { CoreStatValues } from '@/core/world/calculateCoreStats';

// ============================================
// 玩家属性衍生公式
// ============================================

/**
 * 从核心值计算玩家最大生命值
 *
 * 生命值 = maxHp 核心值（已由属性→核心值映射计算完成）
 */
export function calcMaxHp(core: CoreStatValues): number {
  return Math.max(1, Math.round(core.maxHp));
}

/**
 * 从核心值计算玩家最大专项资源（法力/魔力/内力/能量）
 *
 * 专项资源上限 = specialResourceCap 核心值
 */
export function calcMaxSpecialResource(core: CoreStatValues): number {
  return Math.max(0, Math.round(core.specialResourceCap));
}

/**
 * 从核心值计算玩家物理攻击
 */
export function calcPhysicalATK(core: CoreStatValues): number {
  return Math.max(0, Math.round(core.physicalATK));
}

/**
 * 从核心值计算玩家特殊攻击
 */
export function calcSpecialATK(core: CoreStatValues): number {
  return Math.max(0, Math.round(core.specialATK));
}

/**
 * 从核心值计算玩家物理防御
 */
export function calcPhysicalDEF(core: CoreStatValues): number {
  return Math.max(0, Math.round(core.physicalDEF));
}

/**
 * 从核心值计算玩家特殊防御
 */
export function calcSpecialDEF(core: CoreStatValues): number {
  return Math.max(0, Math.round(core.specialDEF));
}

/**
 * 从核心值计算速度
 */
export function calcSpeed(core: CoreStatValues): number {
  return Math.max(1, Math.round(core.speed));
}

// ============================================
// 战斗衍生公式
// ============================================

/**
 * 计算物理伤害
 *
 * 伤害 = 攻方 physicalATK * (100 / (100 + 守方 physicalDEF))
 *
 * @param attackerATK - 攻击方物理攻击值
 * @param defenderDEF - 防御方物理防御值
 */
export function calcPhysicalDamage(
  attackerATK: number,
  defenderDEF: number,
): number {
  const raw = attackerATK * (100 / (100 + defenderDEF));
  return Math.max(1, Math.round(raw));
}

/**
 * 计算特殊伤害
 *
 * 伤害 = 攻方 specialATK * (100 / (100 + 守方 specialDEF))
 */
export function calcSpecialDamage(
  attackerSATK: number,
  defenderSDEF: number,
): number {
  const raw = attackerSATK * (100 / (100 + defenderSDEF));
  return Math.max(1, Math.round(raw));
}

/**
 * 从核心值计算暴击率
 *
 * 暴击率 = 0.05 + perception * 0.005, 上限 0.35
 */
export function calcCritRate(core: CoreStatValues): number {
  return Math.min(0.35, 0.05 + core.perception * 0.005);
}

/**
 * 从核心值计算闪避率
 *
 * 闪避率 = 0.03 + speed * 0.003, 上限 0.25
 */
export function calcDodgeRate(core: CoreStatValues): number {
  return Math.min(0.25, 0.03 + core.speed * 0.003);
}

// ============================================
// 修炼衍生公式
// ============================================

/**
 * 从核心值计算突破成功率
 *
 * 成功率 = 60 + willpower * 1 + intelligence * 0.5, 上限 85 (不含丹药)
 */
export function calcBreakthroughBaseRate(core: CoreStatValues): number {
  return Math.min(85, 60 + core.willpower * 1 + core.intelligence * 0.5);
}

/**
 * 从核心值计算修炼效率系数
 *
 * 效率 = intelligence * 0.01 + willpower * 0.005
 * （作为修炼经验获取的乘法系数）
 */
export function calcCultivationEfficiency(core: CoreStatValues): number {
  return core.intelligence * 0.01 + core.willpower * 0.005;
}

// ============================================
// 战力评估
// ============================================

/**
 * 从核心值计算综合战力
 *
 * 战力 = maxHp*0.5 + physicalATK*3 + specialATK*3 + physicalDEF*2 + specialDEF*2
 *        + speed*1.5 + intelligence + willpower
 */
export function calcCombatPower(core: CoreStatValues): number {
  let power = 0;
  power += core.maxHp * 0.5;
  power += core.physicalATK * 3;
  power += core.specialATK * 3;
  power += core.physicalDEF * 2;
  power += core.specialDEF * 2;
  power += core.speed * 1.5;
  power += core.intelligence;
  power += core.willpower;
  return Math.round(power);
}
