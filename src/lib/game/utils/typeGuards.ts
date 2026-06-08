/**
 * 类型安全和泛型工具函数
 * 用于替代 any 类型，提供类型安全的类型转换和验证
 */

import { Protagonist, InventoryItem, Technique, Equipment, CharacterStats, AchievementStatus, StatKey } from '../types';
import { TechniqueExtension, EquipmentExtension } from '../typesExtension';

/**
 * 类型守卫：检查是否为有效数组
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 类型守卫：检查是否为非空对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 类型守卫：检查是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 类型守卫：检查是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 类型守卫：检查是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 类型守卫：检查对象是否包含指定键
 */
export function hasKey<T extends object>(obj: T, key: keyof T): boolean {
  return key in obj;
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * 安全转换数组（处理 Set 或其他可迭代对象）
 * @param value - 要转换的值
 * @returns 转换后的数组
 */
export function toArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    // 直接返回，已确保类型安全
    return value as T[];
  }
  if (value instanceof Set) return Array.from(value) as T[];
  if (typeof value === 'object' && Symbol.iterator in value) {
    return Array.from(value as Iterable<T>) as T[];
  }
  return [];
}

/**
 * 类型守卫：检查是否为 Protagonist 对象
 */
export function isProtagonist(obj: unknown): obj is Protagonist {
  if (!isObject(obj)) return false;
  return (
    'level' in obj &&
    'experience' in obj &&
    'stats' in obj &&
    'inventory' in obj &&
    isNumber((obj as Record<string, unknown>).level)
  );
}

/**
 * 类型守卫：检查是否为 CharacterStats 对象
 */
export function isCharacterStats(obj: unknown): obj is CharacterStats {
  if (!isObject(obj)) return false;
  // CharacterStats 是一个嵌套结构 { base: {...}, growth: {...} }
  // 检查是否有 base 和 growth 属性
  const statsObj = obj as Record<string, unknown>;
  if (!isObject(statsObj.base) || !isObject(statsObj.growth)) return false;
  
  const requiredKeys: StatKey[] = ['体质', '灵根', '悟性', '幸运', '意志'];
  const baseObj = statsObj.base as Record<string, unknown>;
  const growthObj = statsObj.growth as Record<string, unknown>;
  return requiredKeys.every(key => isNumber(baseObj[key]) && isNumber(growthObj[key]));
}

/**
 * 类型守卫：检查是否为 InventoryItem
 */
export function isInventoryItem(item: unknown): item is InventoryItem {
  if (!isObject(item)) return false;
  return 'id' in item && 'name' in item;
}

/**
 * 类型守卫：检查是否为 Technique
 */
export function isTechnique(item: unknown): item is Technique {
  if (!isObject(item)) return false;
  return 'type' in item && 'name' in item;
}

/**
 * 类型守卫：检查是否为 Equipment
 */
export function isEquipment(item: unknown): item is Equipment {
  if (!isObject(item)) return false;
  return 'slot' in item && 'name' in item;
}

/**
 * 类型守卫：检查是否为 AchievementStatus
 */
export function isAchievementStatus(item: unknown): item is AchievementStatus {
  if (!isObject(item)) return false;
  return (
    'achievementId' in item &&
    'unlocked' in item &&
    isBoolean((item as Record<string, unknown>).unlocked)
  );
}

/**
 * 类型守卫：检查是否为 Technique 数组
 */
export function isTechniqueArray(value: unknown): value is Technique[] {
  if (!isArray(value)) return false;
  return value.every(item => isTechnique(item));
}

/**
 * 类型守卫：检查是否为 Equipment 数组
 */
export function isEquipmentArray(value: unknown): value is Equipment[] {
  if (!isArray(value)) return false;
  return value.every(item => isEquipment(item));
}

/**
 * 类型守卫：检查是否为 InventoryItem 数组
 */
export function isInventoryItemArray(value: unknown): value is InventoryItem[] {
  if (!isArray(value)) return false;
  return value.every(item => isInventoryItem(item));
}

/**
 * 安全的属性访问器
 */
export function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  if (obj && typeof obj === 'object') {
    return (obj as Record<string, unknown>)[key as string] as T[K];
  }
  return undefined;
}

/**
 * 带默认值的属性访问器
 */
export function getPropertyOrDefault<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  const value = obj ? (obj as Record<string, unknown>)[key as string] : undefined;
  return (value as T[K]) ?? defaultValue;
}

/**
 * 泛型数组强制转换（带验证）
 */
export function castArray<T>(
  value: unknown,
  validator: (item: unknown) => item is T
): T[] {
  if (!isArray(value)) return [];
  return value.filter(validator);
}

/**
 * 强制类型转换（仅在开发环境警告）
 */
export function cast<T>(value: unknown, _type: string): T {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[类型警告] 强制类型转换: ${_type}`);
  }
  return value as T;
}

/**
 * 提取对象中特定类型的属性
 */
export function extractProperties<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      (result as Record<string, unknown>)[key as string] = obj[key];
    }
  }
  return result;
}

/**
 * 深拷贝（带类型）
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (obj instanceof Set) return new Set(Array.from(obj).map(item => deepClone(item))) as unknown as T;
  if (obj instanceof Map) {
    return new Map(
      Array.from(obj.entries()).map(([k, v]) => [deepClone(k), deepClone(v)])
    ) as unknown as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (cloned as Record<string, unknown>)[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return cloned;
}

/**
 * 类型守卫：检查值是否为 null 或 undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 过滤 falsy 值
 */
export function filterFalsy<T>(arr: (T | null | undefined | false | 0 | '' )[]): T[] {
  return arr.filter((item): item is T => Boolean(item));
}

/**
 * 创建安全的数组访问函数
 */
export function safeArrayAccess<T>(arr: T[], index: number, fallback: T): T {
  return arr[index] ?? fallback;
}
