/**
 * CoreWorldProvider — 基于 core/world 的核心世界生成提供者
 *
 * 使用 core/world/generateWorld.ts 的确定性生成函数。
 * 替代旧版 ModRandomWorldProvider（依赖已删除的 generators.ts）。
 *
 * @module core/world
 */

import { WorldViewRegistry } from '@/core/registry/WorldViewRegistry';
import type { World } from '@/core/types';
import { generateWorld, generateSeed } from '@/core/world/generateWorld';
import { createWorldId } from '@/core/world/identity';
import type { WorldProvider, WorldProviderMetadata } from '@/core/world/types';

export class CoreWorldProvider implements WorldProvider {
  readonly id: string;
  readonly name: string;
  readonly type = 'random' as const;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  generateWorld(seed: string, ascensionCount: number, worldviewId?: string): World {
    const registry = WorldViewRegistry.getInstance();

    // 如果指定了 worldviewId，从该世界观生成
    if (worldviewId) {
      const worldview = registry.get(worldviewId);
      if (worldview) {
        const world = generateWorld(worldview, seed, ascensionCount);
        return {
          ...world,
          id: createWorldId(this.id, world.worldviewId, seed || world.id),
        };
      }
    }

    // 否则从所有已注册世界观中随机选一个
    const allWorldviews = registry.getAll();
    if (allWorldviews.length === 0) {
      throw new Error('[CoreWorldProvider] 没有已注册的世界观');
    }
    const worldview = allWorldviews[Math.abs(hashStr(seed)) % allWorldviews.length];
    const world = generateWorld(worldview, seed, ascensionCount);
    return {
      ...world,
      id: createWorldId(this.id, world.worldviewId, seed || world.id),
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
      worldCount: -1,
      worldTypes: WorldViewRegistry.getInstance().getAllIds(),
    };
  }
}

/** 简单字符串 hash（用于 seed → worldview 的确定性映射） */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
