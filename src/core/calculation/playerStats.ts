/**
 * 玩家战斗数值计算（客户端安全版本）
 *
 * 所有函数直接接受 WorldBalanceStats 作为参数，不访问 WorldViewRegistry。
 * WorldBalanceStats 嵌入在 World 对象中，由服务端生成时从 WorldviewDefinition.stats 填充。
 *
 * 与 balanceConfig.ts 的区别：
 * - balanceConfig 中的函数依赖 getWorldData() → WorldViewRegistry（服务端专用）
 * - 本文件的函数接受显式的 WorldBalanceStats 参数（客户端安全）
 *
 * @module core/calculation
 */

import type { WorldBalanceStats } from '@/core/types';

/**
 * 计算玩家最大 HP（客户端安全版本）
 *
 * 公式：世界基础HP + 体质 × 世界HP/体质 + 等级 × 世界HP/等级
 *
 * @param constitution - 玩家体质值
 * @param level - 玩家等级
 * @param worldStats - 世界基础数值（从 World 对象获取）
 * @returns 玩家最大 HP
 */
export function calcPlayerMaxHp(
  constitution: number,
  level: number,
  worldStats: WorldBalanceStats,
): number {
  return Math.floor(
    worldStats.baseHp +
    constitution * worldStats.hpPerConstitution +
    level * worldStats.hpPerLevel,
  );
}

/**
 * 计算玩家最大 MP（客户端安全版本）
 *
 * MP 公式使用统一硬编码值，不依赖世界类型。
 * 公式：基础MP(50) + 灵根 × MP/灵根(6) + 等级 × MP/等级(8)
 *
 * @param spiritRoot - 玩家灵根值
 * @param level - 玩家等级
 * @returns 玩家最大 MP
 */
export function calcPlayerMaxMp(
  spiritRoot: number,
  level: number,
): number {
  const baseMp = 50;
  const mpPerSpiritRoot = 6;
  const mpPerLevel = 8;
  return Math.floor(baseMp + spiritRoot * mpPerSpiritRoot + level * mpPerLevel);
}

/**
 * 计算玩家攻击力（客户端安全版本）
 *
 * 公式：世界基础攻击 + 体质 × 攻击/体质 + 灵根 × 攻击/灵根 + 等级 × 攻击/等级
 *
 * @param constitution - 玩家体质值
 * @param spiritRoot - 玩家灵根值
 * @param level - 玩家等级
 * @param worldStats - 世界基础数值（从 World 对象获取）
 * @returns 玩家基础攻击力
 */
export function calcPlayerAttack(
  constitution: number,
  spiritRoot: number,
  level: number,
  worldStats: WorldBalanceStats,
): number {
  return Math.floor(
    worldStats.baseAttack +
    constitution * worldStats.attackPerConstitution +
    spiritRoot * worldStats.attackPerSpiritRoot +
    level * worldStats.attackPerLevel,
  );
}

/**
 * 计算玩家防御力（客户端安全版本）
 *
 * 公式：世界基础防御 + 意志 × 防御/意志 + 等级 × 防御/等级
 *
 * @param willpower - 玩家意志值
 * @param level - 玩家等级
 * @param worldStats - 世界基础数值（从 World 对象获取）
 * @returns 玩家基础防御力
 */
export function calcPlayerDefense(
  willpower: number,
  level: number,
  worldStats: WorldBalanceStats,
): number {
  return Math.floor(
    worldStats.baseDefense +
    willpower * worldStats.defensePerWillpower +
    level * worldStats.defensePerLevel,
  );
}
