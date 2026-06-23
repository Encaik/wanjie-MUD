/**
 * 内置世界机制注册
 *
 * 在 Mod 数据加载完成后，从 WorldViewRegistry 中的 JSON 配置
 * 构造 WorldMechanics 对象并注册到 WorldMechanicsRegistry。
 *
 * @module modules/identity/logic/worlds
 */

import { WorldViewRegistry } from '@/core/registry';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';

import { buildWorldMechanics } from './builder';

import type { MechanicsConfig } from './types';


/**
 * 注册所有已加载世界的 WorldMechanics 实现
 *
 * 从 WorldViewRegistry 中读取每个世界观的 mechanics 配置，
 * 通过 buildWorldMechanics() 构造对象并注册。
 */
export function registerBuiltinMechanics(): void {
  const worldviewRegistry = WorldViewRegistry.getInstance();
  const mechanicsRegistry = WorldMechanicsRegistry.getInstance();

  for (const worldview of worldviewRegistry.getAll()) {
    const worldTypeId = worldview.id;

    // 跳过已注册的
    if (mechanicsRegistry.has(worldTypeId)) continue;

    const rawMechanics = worldview.mechanics as unknown as MechanicsConfig | undefined;

    if (rawMechanics?.cultivation && rawMechanics?.combat) {
      mechanicsRegistry.register(worldTypeId, buildWorldMechanics({
        worldType: worldTypeId,
        cultivation: rawMechanics.cultivation,
        combat: rawMechanics.combat,
        exploration: rawMechanics.exploration,
        uniqueMechanic: rawMechanics.uniqueMechanic,
      }));
    } else {
      console.warn(
        `[registerBuiltinMechanics] 世界观 "${worldTypeId}" 缺少数值 (mechanics)，将使用空机制。`
      );
    }
  }
}
