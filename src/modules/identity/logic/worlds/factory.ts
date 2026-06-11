/**
 * 世界机制工厂（服务端专用）
 *
 * WorldMechanicsRegistry 保留为服务端专用注册中心。
 * 前端通过 API 获取机制数据，不直接调用此模块。
 *
 * @module modules/identity/logic/worlds
 */

import type { WorldMechanics } from './types';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';

/**
 * 获取世界机制（服务端专用）
 *
 * @param worldType - 世界类型标识
 * @returns 对应的 WorldMechanics 实现
 * @throws 如果 worldType 未注册
 */
export function getWorldMechanics(worldType: string): WorldMechanics {
  return WorldMechanicsRegistry.getInstance().get(worldType);
}
