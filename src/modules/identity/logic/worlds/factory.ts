/**
 * 世界机制工厂
 *
 * 所有 WorldMechanics 通过 WorldMechanicsRegistry 获取。
 * 不维护任何硬编码映射表，不包含任何世界类型的 import。
 *
 * 内置世界的注册由 registerBuiltin.ts 在应用启动时统一完成。
 */

import type { WorldMechanics } from './types';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';

/**
 * 获取世界机制
 *
 * 从 WorldMechanicsRegistry 查询，未注册时抛出明确错误。
 *
 * @param worldType - 世界类型标识
 * @returns 对应的 WorldMechanics 实现
 * @throws 如果 worldType 未注册
 */
export function getWorldMechanics(worldType: string): WorldMechanics {
  return WorldMechanicsRegistry.getInstance().get(worldType);
}

/**
 * 检查某世界类型是否有注册的机制实现
 *
 * @param worldType - 世界类型标识
 * @returns 是否已注册
 */
export function hasUniqueMechanics(worldType: string): boolean {
  return WorldMechanicsRegistry.getInstance().has(worldType);
}
