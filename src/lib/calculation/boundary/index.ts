/**
 * 边界模块导出
 */

export { BoundaryChecker, SafeMath, FloatComparator, RangeUtils } from './checker';

/** 边界钳制结果 */
export interface ClampResult {
  /** 钳制后的值 */
  value: number;
  /** 是否被钳制 */
  clamped: boolean;
  /** 钳制方向 */
  direction?: 'lower' | 'upper';
}

/** 边界警告 */
export interface ClampWarning {
  /** 原始值 */
  original: number;
  /** 钳制后值 */
  clamped: number;
  /** 边界类型 */
  bound: 'min' | 'max';
  /** 边界值 */
  limit: number;
}

import { BoundaryChecker, SafeMath, FloatComparator } from './checker';

/** 创建边界检查器 */
export function createBoundaryChecker(): BoundaryChecker {
  return new BoundaryChecker();
}

/** 安全加法 */
export function safeAdd(a: number, b: number): number {
  return SafeMath.add(a, b);
}

/** 安全乘法 */
export function safeMultiply(a: number, b: number): number {
  return SafeMath.multiply(a, b);
}

/** 安全钳制 */
export function safeClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 浮点数相等比较 */
export function floatEquals(a: number, b: number): boolean {
  return FloatComparator.equals(a, b);
}

/** 检查是否为有限数 */
export function isFinite(value: number): boolean {
  return Number.isFinite(value);
}
