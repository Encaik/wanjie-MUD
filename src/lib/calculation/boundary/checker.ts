/**
 * 边界检查器
 * 
 * 提供数值边界检查和保护功能
 */

import { StatBounds } from '../types';
import { 
  FLOAT_EPSILON, 
  MIN_POSITIVE, 
  SAFE_INTEGER_MAX, 
  SAFE_INTEGER_MIN,
  LOG_PREFIX,
} from '../constants';

// ============================================
// 边界检查器
// ============================================

export class BoundaryChecker {
  /**
   * 检查并约束数值
   * 
   * @param value 待检查的值
   * @param bounds 边界约束配置
   * @returns 约束后的值
   */
  static clamp(value: number, bounds: StatBounds): number {
    // 特殊值处理
    if (!Number.isFinite(value)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${LOG_PREFIX} 非有限值检测: ${value}, 使用默认值: ${bounds.defaultValue}`);
      }
      return bounds.defaultValue;
    }
    
    // 下界检查
    if (value < bounds.min) {
      switch (bounds.minBehavior) {
        case 'error':
          throw new Error(`值 ${value} 低于下界 ${bounds.min}`);
        case 'warn':
          if (process.env.NODE_ENV === 'development') {
            console.warn(`${LOG_PREFIX} 值 ${value} 低于下界 ${bounds.min}, 已截断`);
          }
          break;
        case 'clamp':
        default:
          break;
      }
      return bounds.min;
    }
    
    // 上界检查
    if (value > bounds.max) {
      switch (bounds.maxBehavior) {
        case 'error':
          throw new Error(`值 ${value} 超过上界 ${bounds.max}`);
        case 'warn':
          if (process.env.NODE_ENV === 'development') {
            console.warn(`${LOG_PREFIX} 值 ${value} 超过上界 ${bounds.max}, 已截断`);
          }
          break;
        case 'clamp':
        default:
          break;
      }
      return bounds.max;
    }
    
    return value;
  }
  
  /**
   * 检查值是否在有效范围内
   */
  static isValid(value: number): boolean {
    return Number.isFinite(value) && !Number.isNaN(value);
  }
  
  /**
   * 检查值是否为正数
   */
  static isPositive(value: number): boolean {
    return this.isValid(value) && value > 0;
  }
  
  /**
   * 检查值是否为非负数
   */
  static isNonNegative(value: number): boolean {
    return this.isValid(value) && value >= 0;
  }
  
  /**
   * 检查值是否在 [0, 1] 范围内（概率值）
   */
  static isValidProbability(value: number): boolean {
    return this.isValid(value) && value >= 0 && value <= 1;
  }
}

// ============================================
// 安全运算器
// ============================================

export class SafeMath {
  /**
   * 安全加法（防止溢出）
   */
  static add(a: number, b: number): number {
    // 特殊值检查
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return 0;
    }
    
    const result = a + b;
    
    // 检查溢出
    if (a > 0 && b > 0 && result < 0) {
      return SAFE_INTEGER_MAX;
    }
    if (a < 0 && b < 0 && result > 0) {
      return SAFE_INTEGER_MIN;
    }
    
    return result;
  }
  
  /**
   * 安全减法
   */
  static subtract(a: number, b: number): number {
    return this.add(a, -b);
  }
  
  /**
   * 安全乘法（防止精度丢失和溢出）
   */
  static multiply(a: number, b: number): number {
    // 特殊值检查
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return 0;
    }
    
    // 零值快速返回
    if (a === 0 || b === 0) return 0;
    
    const result = a * b;
    
    // 检查溢出
    if (!Number.isFinite(result)) {
      return (a > 0) === (b > 0) ? SAFE_INTEGER_MAX : SAFE_INTEGER_MIN;
    }
    
    return result;
  }
  
  /**
   * 安全除法（防止除零）
   */
  static divide(a: number, b: number, defaultValue: number = 0): number {
    // 特殊值检查
    if (!Number.isFinite(a)) return defaultValue;
    if (!Number.isFinite(b)) return defaultValue;
    
    // 除零保护
    if (Math.abs(b) < MIN_POSITIVE) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${LOG_PREFIX} 除零保护: ${a} / ${b}, 返回默认值 ${defaultValue}`);
      }
      return defaultValue;
    }
    
    return a / b;
  }
  
  /**
   * 安全取模
   */
  static modulo(a: number, b: number): number {
    if (Math.abs(b) < MIN_POSITIVE) return 0;
    return a % b;
  }
  
  /**
   * 安全幂运算
   */
  static pow(base: number, exponent: number): number {
    if (!Number.isFinite(base) || !Number.isFinite(exponent)) {
      return 0;
    }
    
    const result = Math.pow(base, exponent);
    
    if (!Number.isFinite(result)) {
      return base > 1 ? SAFE_INTEGER_MAX : SAFE_INTEGER_MIN;
    }
    
    return result;
  }
  
  /**
   * 安全开方
   */
  static sqrt(value: number): number {
    if (value < 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${LOG_PREFIX} 负数开方: ${value}, 返回 0`);
      }
      return 0;
    }
    return Math.sqrt(value);
  }
  
  /**
   * 安全对数
   */
  static log(value: number): number {
    if (value <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${LOG_PREFIX} 非正数对数: ${value}, 返回 0`);
      }
      return 0;
    }
    return Math.log(value);
  }
}

// ============================================
// 浮点数比较器
// ============================================

export class FloatComparator {
  private static epsilon = FLOAT_EPSILON;
  
  /**
   * 判断两个浮点数是否相等
   */
  static equals(a: number, b: number): boolean {
    return Math.abs(a - b) < this.epsilon;
  }
  
  /**
   * 判断 a 是否大于 b
   */
  static greaterThan(a: number, b: number): boolean {
    return a - b > this.epsilon;
  }
  
  /**
   * 判断 a 是否小于 b
   */
  static lessThan(a: number, b: number): boolean {
    return b - a > this.epsilon;
  }
  
  /**
   * 判断 a 是否大于等于 b
   */
  static greaterThanOrEqual(a: number, b: number): boolean {
    return a - b > -this.epsilon;
  }
  
  /**
   * 判断 a 是否小于等于 b
   */
  static lessThanOrEqual(a: number, b: number): boolean {
    return b - a > -this.epsilon;
  }
  
  /**
   * 判断值是否接近零
   */
  static isZero(value: number): boolean {
    return Math.abs(value) < this.epsilon;
  }
  
  /**
   * 判断值是否为正数
   */
  static isPositive(value: number): boolean {
    return value > this.epsilon;
  }
  
  /**
   * 判断值是否为负数
   */
  static isNegative(value: number): boolean {
    return value < -this.epsilon;
  }
}

// ============================================
// 数值范围工具
// ============================================

export class RangeUtils {
  /**
   * 将值限制在指定范围内
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * 将值映射到指定范围
   */
  static map(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    const ratio = SafeMath.divide(value - inMin, inMax - inMin, 0);
    return outMin + ratio * (outMax - outMin);
  }
  
  /**
   * 线性插值
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * this.clamp(t, 0, 1);
  }
  
  /**
   * 反向线性插值（获取 t 值）
   */
  static inverseLerp(start: number, end: number, value: number): number {
    return SafeMath.divide(value - start, end - start, 0);
  }
  
  /**
   * 平滑步进
   */
  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
}
