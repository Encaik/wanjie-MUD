/**
 * 数值约束工具集
 * 用于防止数值溢出、除零、负数等问题
 */

/**
 * 数值约束（clamp）
 * 将值限制在 [min, max] 范围内
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * 非负数约束
 * 确保值 >= 0
 */
export function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * 正数约束
 * 确保值 >= min（默认为1）
 */
export function clampPositive(value: number, min: number = 1): number {
  return Math.max(min, value);
}

/**
 * 安全除法（避免除零）
 * @param numerator 被除数
 * @param denominator 除数
 * @param fallback 除数为0时的返回值
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return fallback;
  }
  if (!Number.isFinite(numerator)) {
    return fallback;
  }
  return numerator / denominator;
}

/**
 * 安全百分比（0-1范围）
 */
export function clampPercent(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * 安全概率值（0-100范围）
 */
export function clampProbability(value: number): number {
  return clamp(value, 0, 100);
}

/**
 * 检查是否为有效数值
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}

/**
 * 安全解析数值
 */
export function parseNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && isValidNumber(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isValidNumber(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * 带精度的四舍五入
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 安全增量（防止溢出）
 */
export function safeIncrement(current: number, delta: number, max: number): number {
  const result = current + delta;
  if (!Number.isFinite(result)) return max;
  return Math.max(0, Math.min(result, max));
}

/**
 * 安全减量（防止负数）
 */
export function safeDecrement(current: number, delta: number, min: number = 0): number {
  const result = current - delta;
  if (!Number.isFinite(result)) return min;
  return Math.max(min, result);
}

/**
 * HP/MP 安全操作
 * 确保当前值在 [0, max] 范围内
 */
export function clampHpMp(
  current: number,
  max: number,
  min: number = 0
): { current: number; max: number } {
  const safeMax = Math.max(min, max);
  return {
    current: clamp(current, min, safeMax),
    max: safeMax,
  };
}

/**
 * 安全应用伤害
 */
export function applyDamage(currentHp: number, damage: number, maxHp: number): number {
  const safeDamage = clampNonNegative(damage);
  return clamp(currentHp - safeDamage, 0, maxHp);
}

/**
 * 安全应用治疗
 */
export function applyHeal(currentHp: number, heal: number, maxHp: number): number {
  const safeHeal = clampNonNegative(heal);
  return clamp(currentHp + safeHeal, 0, maxHp);
}
