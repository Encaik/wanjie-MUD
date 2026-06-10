/**
 * WorldProviderRegistry 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldProviderRegistry } from './WorldProviderRegistry';
import type { WorldProvider, WorldProviderMetadata } from './types';
import type { World } from '@/core/types';
import { GAME_VERSION } from '@/shared/config/version';

/** 创建用于测试的 mock provider */
function createMockProvider(id: string, type: 'random' | 'template'): WorldProvider {
  return {
    id,
    name: `Test ${id}`,
    type,
    generateWorld(): World {
      return {
        id: `${id}:test:seed`,
        random: 12345,
        gameVersion: GAME_VERSION,
        name: '测试世界',
        type: '修仙',
        description: '测试世界描述',
        powerSystem: '测试力量',
        realmSystem: { mainRealmName: '测试', subRealmName: '阶', tiers: [] },
        majorForces: '测试势力',
        factions: [],
        baseCoefficient: 1.0,
        actualCoefficient: 1.0,
        difficulty: '普通',
        dangers: [],
        opportunities: [],
        ratingScore: 0,
      };
    },
    generateWorlds(seeds) {
      return seeds.map(s => this.generateWorld(s, 0));
    },
    getMetadata(): WorldProviderMetadata {
      return {
        id,
        name: `Test ${id}`,
        type,
        worldCount: type === 'template' ? 1 : -1,
        worldTypes: ['修仙'],
        templateIds: type === 'template' ? ['test-template'] : undefined,
      };
    },
  };
}

describe('WorldProviderRegistry', () => {
  beforeEach(() => {
    WorldProviderRegistry.resetInstance();
  });

  it('should be a singleton', () => {
    const a = WorldProviderRegistry.getInstance();
    const b = WorldProviderRegistry.getInstance();
    expect(a).toBe(b);
  });

  it('should register and retrieve a provider', () => {
    const registry = WorldProviderRegistry.getInstance();
    const provider = createMockProvider('test-mod', 'random');
    registry.register(provider);
    expect(registry.get('test-mod')).toBe(provider);
    expect(registry.has('test-mod')).toBe(true);
  });

  it('should throw on duplicate registration', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('test-mod', 'random'));
    expect(() => registry.register(createMockProvider('test-mod', 'template')))
      .toThrow('Provider ID 冲突');
  });

  it('should unregister a provider', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('test-mod', 'random'));
    registry.unregister('test-mod');
    expect(registry.get('test-mod')).toBeUndefined();
  });

  it('should filter by type', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('random-a', 'random'));
    registry.register(createMockProvider('template-a', 'template'));
    registry.register(createMockProvider('template-b', 'template'));

    expect(registry.getByType('random')).toHaveLength(1);
    expect(registry.getByType('template')).toHaveLength(2);
  });

  it('should return all providers', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('a', 'random'));
    registry.register(createMockProvider('b', 'template'));
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.count).toBe(2);
  });

  it('should return undefined for unregistered provider', () => {
    const registry = WorldProviderRegistry.getInstance();
    expect(registry.get('nonexistent')).toBeUndefined();
    expect(registry.has('nonexistent')).toBe(false);
  });
});
