/**
 * ModRandomWorldProvider — mod 随机世界生成提供者
 *
 * 封装现有 generateWorld 函数，实现 WorldProvider 接口（type='random'）。
 * 从 WorldDataRegistry 读取配方数据（WorldTypeData 池），随机组合产出 World 实例。
 *
 * @module modules/identity/logic/worlds
 */

import type { World } from '@/core/types';
import type { WorldProvider, WorldProviderMetadata } from '@/core/world/types';
import { createWorldId } from '@/core/world/identity';
import { generateWorld } from '@/modules/identity/logic/generators';

export class ModRandomWorldProvider implements WorldProvider {
  readonly id: string;
  readonly name: string;
  readonly type = 'random' as const;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  generateWorld(seed: string, ascensionCount: number, _worldviewId?: string): World {
    const world = generateWorld(seed, ascensionCount);
    // 使用 provider-aware ID 重新分配，保证跨 provider 的唯一性
    return {
      ...world,
      id: createWorldId(this.id, world.type, seed || world.id),
    };
  }

  generateWorlds(seeds: string[], ascensionCount: number, worldviewId?: string): World[] {
    return seeds.map(seed => this.generateWorld(seed, ascensionCount, worldviewId));
  }

  getMetadata(): WorldProviderMetadata {
    return {
      id: this.id,
      name: this.name,
      type: 'random',
      worldCount: -1, // 随机生成器无数量上限
      worldTypes: [], // 由 registerProviders 填充实际值
    };
  }
}
