/**
 * WorldProviderRegistry 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';

import type { World } from '@/core/types';
import { GAME_VERSION } from '@/shared/config/version';

import { WorldProviderRegistry } from './WorldProviderRegistry';

import type { WorldProvider, WorldProviderMetadata } from './types';

/** 创建用于测试的 mock provider */
function createMockProvider(id: string, type: 'random'): WorldProvider {
  return {
    id,
    name: `Test ${id}`,
    type,
    generateWorld(_seed?: string, _ascensionCount?: number, _worldviewId?: string): World {
      return {
        id: `${id}:test:seed`,
        random: 12345,
        gameVersion: GAME_VERSION,
        worldviewId: 'cultivation',
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
        visualConfig: {
          icon: '☯',
          accentColor: 'text-amber-400',
          gradientClass: 'from-amber-500/20 to-yellow-600/10',
          borderColor: 'border-amber-500/30',
          bgGradient: 'bg-gradient-to-br from-amber-50 to-yellow-50',
          colorGradient: 'from-amber-500 to-yellow-500',
        },
        statDisplayNames: {},
        worldStats: {
          baseHp: 100,
          hpPerLevel: 10,
          hpPerConstitution: 5,
          baseAttack: 10,
          attackPerLevel: 2,
          attackPerConstitution: 1,
          attackPerSpiritRoot: 1,
          baseDefense: 5,
          defensePerLevel: 1,
          defensePerWillpower: 1,
        },
        ratingScore: 0,
        attributeDefinitions: [],
        racePool: ['human'],
        questPool: [],
      };
    },
    generateWorlds(seeds, _ascensionCount?, _worldviewId?) {
      return seeds.map(s => this.generateWorld(s, 0));
    },
    getMetadata(): WorldProviderMetadata {
      return {
        id,
        name: `Test ${id}`,
        type,
        worldCount: -1,
        worldTypes: ['cultivation'],
      };
    },
  };
}

describe('WorldProviderRegistry', () => {
  beforeEach(() => {
    WorldProviderRegistry.resetInstance();
  });

  it('应为单例', () => {
    const a = WorldProviderRegistry.getInstance();
    const b = WorldProviderRegistry.getInstance();
    expect(a).toBe(b);
  });

  it('应注册并查询 provider', () => {
    const registry = WorldProviderRegistry.getInstance();
    const provider = createMockProvider('test-mod', 'random');
    registry.register(provider);
    expect(registry.get('test-mod')).toBe(provider);
    expect(registry.has('test-mod')).toBe(true);
  });

  it('重复注册应抛出错误', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('test-mod', 'random'));
    expect(() => registry.register(createMockProvider('test-mod', 'random')))
      .toThrow('Provider ID 冲突');
  });

  it('应注销 provider', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('test-mod', 'random'));
    registry.unregister('test-mod');
    expect(registry.get('test-mod')).toBeUndefined();
  });

  it('应按类型过滤', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('random-a', 'random'));
    registry.register(createMockProvider('random-b', 'random'));

    expect(registry.getByType('random')).toHaveLength(2);
  });

  it('应返回所有 provider', () => {
    const registry = WorldProviderRegistry.getInstance();
    registry.register(createMockProvider('a', 'random'));
    registry.register(createMockProvider('b', 'random'));
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.count).toBe(2);
  });

  it('未注册的 provider 应返回 undefined', () => {
    const registry = WorldProviderRegistry.getInstance();
    expect(registry.get('nonexistent')).toBeUndefined();
    expect(registry.has('nonexistent')).toBe(false);
  });
});
