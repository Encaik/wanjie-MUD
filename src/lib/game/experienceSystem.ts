/**
 * 经验溢出处理系统
 * 
 * 设计原则：
 * 1. 溢出经验按比例折损吸收，避免完全浪费
 * 2. 折损比例随着溢出量增加而递减（边际效应递减）
 * 3. 突破时溢出经验按比例转移到新等级
 */

/** 溢出经验折损配置 */
export const OVERFLOW_CONFIG = {
  /** 基础折损率 - 溢出经验的80%会被保留 */
  baseRetentionRate: 0.80,
  
  /** 大量溢出的额外折损 - 当溢出量超过当前等级上限时，额外折损 */
  excessPenaltyRate: 0.60,
  
  /** 突破时溢出经验吸收率 - 突破成功时溢出经验的70%会转移到新等级 */
  breakthroughAbsorptionRate: 0.70,
  
  /** 突破时溢出经验上限比例 - 溢出经验最多只能达到新等级上限的50% */
  breakthroughMaxRatio: 0.50,
};

/**
 * 计算溢出经验的实际吸收量
 * 
 * 折损机制：
 * - 小额溢出（≤当前等级上限）：保留 80%
 * - 大额溢出（>当前等级上限）：超出部分额外折损至 60%
 * 
 * @param overflowAmount 溢出的经验量
 * @param currentMaxExp 当前等级的经验上限
 * @returns 折损后实际获得的经验
 */
export function calculateOverflowAbsorption(
  overflowAmount: number,
  currentMaxExp: number
): number {
  if (overflowAmount <= 0) return 0;
  
  const { baseRetentionRate, excessPenaltyRate } = OVERFLOW_CONFIG;
  
  // 小额溢出：基础折损
  if (overflowAmount <= currentMaxExp) {
    return Math.floor(overflowAmount * baseRetentionRate);
  }
  
  // 大额溢出：分段折损
  // 第一部分：当前等级上限内的溢出，按基础折损
  const baseOverflow = currentMaxExp;
  const baseAbsorbed = baseOverflow * baseRetentionRate;
  
  // 第二部分：超出当前等级上限的部分，额外折损
  const excessOverflow = overflowAmount - currentMaxExp;
  const excessAbsorbed = excessOverflow * baseRetentionRate * excessPenaltyRate;
  
  return Math.floor(baseAbsorbed + excessAbsorbed);
}

/**
 * 计算突破时溢出经验的转移量
 * 
 * 转移机制：
 * - 保留溢出经验的 70%
 * - 但最多不超过新等级上限的 50%
 * 
 * @param overflowExp 当前溢出经验
 * @param newLevelMaxExp 新等级的经验上限
 * @returns 转移到新等级的经验
 */
export function calculateBreakthroughTransfer(
  overflowExp: number,
  newLevelMaxExp: number
): number {
  if (overflowExp <= 0) return 0;
  
  const { breakthroughAbsorptionRate, breakthroughMaxRatio } = OVERFLOW_CONFIG;
  
  // 计算理论转移量
  const theoreticalTransfer = overflowExp * breakthroughAbsorptionRate;
  
  // 计算最大允许转移量（新等级上限的50%）
  const maxTransfer = newLevelMaxExp * breakthroughMaxRatio;
  
  // 取较小值
  return Math.floor(Math.min(theoreticalTransfer, maxTransfer));
}

/**
 * 处理获得经验时的溢出计算
 * 
 * @param currentExp 当前经验
 * @param expGain 获得的经验
 * @param maxExp 当前等级经验上限
 * @param currentOverflow 当前溢出经验
 * @returns 处理后的经验和溢出经验
 */
export function processExperienceGain(
  currentExp: number,
  expGain: number,
  maxExp: number,
  currentOverflow: number
): { newExp: number; newOverflow: number; absorbedOverflow: number } {
  const totalExp = currentExp + expGain;
  
  // 未达到上限，无溢出
  if (totalExp < maxExp) {
    return {
      newExp: totalExp,
      newOverflow: currentOverflow,
      absorbedOverflow: 0,
    };
  }
  
  // 达到上限，计算溢出
  const rawOverflow = totalExp - maxExp;
  
  // 计算折损后的溢出吸收
  const absorbedOverflow = calculateOverflowAbsorption(rawOverflow, maxExp);
  
  return {
    newExp: maxExp,
    newOverflow: currentOverflow + absorbedOverflow,
    absorbedOverflow,
  };
}
