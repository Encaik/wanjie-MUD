/**
 * WorldMechanics 构造器
 *
 * 从纯数据配置（MechanicsConfig）构造 WorldMechanics 对象。
 * 替代手写 8 个 TS 文件——世界差异完全通过 JSON 数据注入。
 *
 * @module modules/identity/logic/worlds
 */

import type { WorldMechanics, MechanicsConfig } from './types';

/**
 * 从 MechanicsConfig 构造 WorldMechanics 对象
 *
 * @param config - 世界机制的纯数据配置
 * @returns WorldMechanics 实例（所有方法返回配置中的固定数据）
 */
export function buildWorldMechanics(config: MechanicsConfig): WorldMechanics {
  return {
    worldType: config.worldType,

    getCultivationParams: () => config.cultivation,

    getCombatParams: () => config.combat,

    getExplorationParams: () => config.exploration,

    getUniqueMechanicDescription: () => config.uniqueMechanic,
  };
}
