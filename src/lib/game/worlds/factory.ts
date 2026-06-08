/**
 * 世界机制工厂
 *
 * 根据世界类型返回对应的 WorldMechanics 实现。
 * 每种世界类型有独特的核心玩法循环。
 */

import type { WorldMechanics } from './types';
import { cultivationWorld } from './cultivationWorld';
import { techWorld } from './techWorld';

/** 世界机制注册表 */
const WORLD_MECHANICS: Record<string, WorldMechanics> = {
  '修仙': cultivationWorld,
  '仙侠': cultivationWorld,  // 仙侠与修仙共享标准机制
  '高武': cultivationWorld,  // 高武使用标准机制（后续可单独定制）
  '魔幻': cultivationWorld,  // 魔幻使用标准机制（后续可单独定制）
  '异能': cultivationWorld,  // 异能使用标准机制（后续可单独定制）
  '武侠': cultivationWorld,  // 武侠使用标准机制（后续可单独定制）
  '末世': cultivationWorld,  // 末世使用标准机制（后续可单独定制）
  '科技': techWorld,
};

/**
 * 获取世界机制
 *
 * @param worldType - 世界类型
 * @returns 对应的 WorldMechanics 实现
 */
export function getWorldMechanics(worldType: string): WorldMechanics {
  return WORLD_MECHANICS[worldType] || cultivationWorld;
}

/**
 * 检查某世界类型是否有独特的机制实现
 *
 * @param worldType - 世界类型
 * @returns 是否有独特机制（非默认标准机制）
 */
export function hasUniqueMechanics(worldType: string): boolean {
  return worldType === '科技'; // 后续添加更多独特世界
}
