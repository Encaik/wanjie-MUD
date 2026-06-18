/**
 * 阶段一：属性检定（phase1_check）
 *
 * 心魔显形时，玩家的 CoreStats 与心魔属性进行三项对抗检定。
 * 检定结果影响初始心境护盾损耗，决定进入阶段二时的状态。
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import { calculateDemonResistance } from './demonMemory';

import type { GeneratedDemon, AttributeCheckResult, SingleAttributeCheck, PlayerCoreStatsSnapshot } from './types';
import type { DemonMemory } from './types';

// ============================================
// 主检定函数
// ============================================

/**
 * 执行阶段一的属性检定
 *
 * 三项检定：
 * 1. 物理防御 (physicalDEF) vs 心魔物理攻击 (physicalAttack)
 * 2. 特殊防御 (specialDEF) vs 心魔法术攻击 (specialAttack)
 * 3. 意志力 (willpower) vs 心魔意志侵蚀 (willErosion)
 *
 * 每项检定：damage = max(0, demonValue - playerValue * bonus)
 * 心魔强度越高、玩家属性越低，伤害越大。
 *
 * @param demon - 生成的心魔
 * @param coreStats - 玩家 CoreStats
 * @param demonCodex - 心魔图鉴（用于抗性计算）
 * @returns 检定结果
 */
export function executeAttributeCheck(
  demon: GeneratedDemon,
  coreStats: PlayerCoreStatsSnapshot,
  demonCodex: DemonMemory[],
): AttributeCheckResult {
  const bonuses: string[] = [];

  // 心魔图鉴抗性
  const resistance = calculateDemonResistance(demonCodex, demon.type);
  if (resistance > 0) {
    bonuses.push(`心魔抗性 +${Math.floor(resistance * 100)}%`);
  }

  // 防御方加成（1.0 + 抗性 + 其他加成）
  const defBonus = 1.0 + resistance;

  // 物理检定
  const physicalCheck = runSingleCheck(
    'physical',
    coreStats.physicalDEF,
    demon.stats.physicalAttack,
    defBonus,
  );

  // 特殊检定
  const specialCheck = runSingleCheck(
    'special',
    coreStats.specialDEF,
    demon.stats.specialAttack,
    defBonus,
  );

  // 意志检定
  const willCheck = runSingleCheck(
    'will',
    coreStats.willpower * 1.5, // 意志力对侵蚀有额外抗性
    demon.stats.willErosion,
    defBonus,
  );

  // 总伤害限制最大80（保证至少20心境残留）
  const rawTotal = physicalCheck.damage + specialCheck.damage + willCheck.damage;
  const totalMindDamage = Math.min(rawTotal, 80);

  // 如果总伤害为0，视为全部通过
  const allPassed = physicalCheck.passed && specialCheck.passed && willCheck.passed;
  if (allPassed) {
    bonuses.push('全属性压制');
  }

  return {
    checks: {
      physical: physicalCheck,
      special: specialCheck,
      will: willCheck,
    },
    totalMindDamage,
    bonuses,
  };
}

// ============================================
// 单项检定
// ============================================

/**
 * 执行单项属性检定
 *
 * @param type - 检定类型
 * @param playerValue - 玩家防御/意志值
 * @param demonValue - 心魔攻击/侵蚀值
 * @param bonus - 防御方加成倍率
 * @returns 单项检定结果
 */
function runSingleCheck(
  type: SingleAttributeCheck['type'],
  playerValue: number,
  demonValue: number,
  bonus: number,
): SingleAttributeCheck {
  const effectivePlayerValue = playerValue * bonus;
  const damage = Math.max(0, Math.floor(demonValue - effectivePlayerValue));

  return {
    type,
    playerValue: Math.floor(effectivePlayerValue),
    demonValue,
    damage,
    passed: damage === 0,
  };
}
