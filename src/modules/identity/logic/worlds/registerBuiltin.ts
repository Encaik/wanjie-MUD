/**
 * 内置世界机制注册
 *
 * 在 Mod 数据加载完成后，从 WorldDataRegistry 中的 JSON 配置
 * 构造 WorldMechanics 对象并注册到 WorldMechanicsRegistry。
 *
 * 不依赖任何手写的世界特定 TS 文件——世界差异完全由 Mod JSON 数据驱动。
 *
 * @module modules/identity/logic/worlds
 */

import { WorldMechanicsRegistry } from '@/shared/lib/registry/WorldMechanicsRegistry';
import { WorldDataRegistry } from '@/shared/lib/registry/WorldDataRegistry';
import type { MechanicsConfig } from './types';
import { buildWorldMechanics } from './builder';

/**
 * 注册所有已加载世界的 WorldMechanics 实现
 *
 * 从 WorldDataRegistry 中读取每个世界的 mechanics JSON 配置，
 * 通过 buildWorldMechanics() 构造对象并注册。
 *
 * 应在 ModLoader.loadAll() 完成后调用。
 */
export function registerBuiltinMechanics(): void {
  const dataRegistry = WorldDataRegistry.getInstance();
  const mechanicsRegistry = WorldMechanicsRegistry.getInstance();

  const worldTypes = dataRegistry.getAllWorldTypes();

  for (const worldTypeId of worldTypes) {
    // 跳过已注册的（避免重复注册）
    if (mechanicsRegistry.has(worldTypeId)) continue;

    const worldData = dataRegistry.getWorldType(worldTypeId);
    if (!worldData) continue;

    // 从 worldData 中提取 mechanics 配置（Mod JSON 中的 mechanics 字段）
    const rawMechanics = worldData.mechanics as MechanicsConfig | undefined;

    if (rawMechanics && rawMechanics.cultivation && rawMechanics.combat) {
      const mechanics = buildWorldMechanics({
        worldType: worldTypeId,
        cultivation: rawMechanics.cultivation,
        combat: rawMechanics.combat,
        exploration: rawMechanics.exploration,
        uniqueMechanic: rawMechanics.uniqueMechanic,
      });
      mechanicsRegistry.register(worldTypeId, mechanics);
    } else {
      console.warn(
        `[registerBuiltinMechanics] 世界 "${worldTypeId}" 缺少数值 (mechanics)，将使用空机制。`
      );
    }
  }
}
