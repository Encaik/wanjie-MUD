/**
 * generateWorld 测试
 *
 * 测试核心世界生成纯函数的确定性、批量生成、难度计算等功能。
 */

import { describe, it, expect } from 'vitest';
import {
  generateWorld,
  generateWorlds,
  generateSeed,
  calculateDifficultyCoefficient,
  getDifficultyFromCoefficient,
} from './generateWorld';
import type { WorldviewDefinition } from '@/core/registry/WorldViewRegistry';

/** 创建用于测试的完整 WorldviewDefinition */
function createTestWorldview(overrides: Partial<WorldviewDefinition> = {}): WorldviewDefinition {
  return {
    id: 'test-world',
    name: '测试世界',
    description: '一个用于测试的世界观',
    version: '0.1.0',
    baseCoefficient: 1.0,
    rewardCoefficient: {
      expCoefficient: 1.0,
      spiritStoneCoefficient: 1.0,
      dropCoefficient: 1.0,
      rarityBonus: { rare: 0, epic: 0, legendary: 0, mythic: 0 },
      specialRewards: { ascensionMarkBonus: 0, titleChance: 0, specialItemChance: 0 },
    },
    stats: {
      baseHp: 100, hpPerLevel: 10, hpPerConstitution: 5,
      baseAttack: 10, attackPerLevel: 2, attackPerConstitution: 1,
      attackPerSpiritRoot: 2, baseDefense: 5, defensePerLevel: 1,
      defensePerWillpower: 1, enemyAttackBonus: 0, enemyDefenseBonus: 0,
      statDisplayNames: {},
    },
    realmSystem: {
      mainRealmName: '境界',
      subRealmName: '阶',
      tiers: [
        { name: '炼气', subRealms: ['初期', '中期', '后期'], levelRange: [1, 10] as [number, number] },
        { name: '筑基', subRealms: ['初期', '中期', '后期'], levelRange: [11, 30] as [number, number] },
      ],
    },
    namePrefixes: ['青云', '紫霄', '太虚'],
    nameSuffixes: ['大陆', '世界', '界'],
    descriptions: ['一个灵气充沛的世界', '一个危机四伏的世界'],
    powerSystems: ['灵力修炼', '武道修行'],
    majorForces: ['正道联盟', '魔教'],
    dangers: [
      {
        id: 'd1', name: '妖兽袭击', description: '遭遇妖兽', dangerLevel: 2,
        type: 'enemy_buff', triggerCondition: { type: 'random', chance: 0.3 },
        effect: {}, duration: 3, dispellable: true,
      },
      {
        id: 'd2', name: '灵气枯竭', description: '灵气暂时枯竭', dangerLevel: 3,
        type: 'resource_drain', triggerCondition: { type: 'on_explore', chance: 0.1 },
        effect: {}, duration: 5, dispellable: false,
      },
    ],
    opportunities: [
      {
        id: 'o1', name: '仙缘降临', description: '遇到仙缘', opportunityLevel: 4,
        type: 'stat_buff', triggerCondition: { type: 'random', chance: 0.1 },
        effect: {}, duration: 2,
      },
      {
        id: 'o2', name: '灵脉发现', description: '发现灵脉', opportunityLevel: 3,
        type: 'resource_gain', triggerCondition: { type: 'on_explore', chance: 0.2 },
        effect: {}, duration: 1,
      },
    ],
    factions: [
      { id: 'f1', name: '青云宗', type: '正道', description: '修仙正道', worldTypeId: 'test-world' },
      { id: 'f2', name: '魔教', type: '邪道', description: '修魔势力', worldTypeId: 'test-world' },
      { id: 'f3', name: '散修联盟', type: '中立', description: '散修组织', worldTypeId: 'test-world' },
    ],
    traits: {
      origin: {} as Record<string, unknown>,
      trait: {} as Record<string, unknown>,
      personality: {} as Record<string, unknown>,
      talent: {} as Record<string, unknown>,
    } as WorldviewDefinition['traits'],
    namePool: { surnames: ['李', '王'], maleNames: ['天', '云'], femaleNames: ['雪', '月'] },
    texts: {
      name: '测试世界',
      description: '测试',
      terminology: {} as WorldviewDefinition['texts']['terminology'],
      stats: {} as WorldviewDefinition['texts']['stats'],
      combat: {} as WorldviewDefinition['texts']['combat'],
      cultivation: {} as WorldviewDefinition['texts']['cultivation'],
      resource: {} as WorldviewDefinition['texts']['resource'],
      item: {} as WorldviewDefinition['texts']['item'],
      dungeon: {} as WorldviewDefinition['texts']['dungeon'],
      ui: {} as WorldviewDefinition['texts']['ui'],
      breakthrough: {} as WorldviewDefinition['texts']['breakthrough'],
      message: {} as WorldviewDefinition['texts']['message'],
      paths: {} as WorldviewDefinition['texts']['paths'],
    },
    mechanics: {},
    visualConfig: {
      icon: '🧪', accentColor: 'text-blue-400', gradientClass: 'from-blue-500/20',
      borderColor: 'border-blue-500/30', bgGradient: 'bg-blue-50', colorGradient: 'from-blue-500',
    },
    builtin: true,
    // V3 新字段
    attributes: [],
    racePool: ['human'],
    ...overrides,
  };
}

describe('calculateDifficultyCoefficient', () => {
  it('基础系数为 1.0 且无飞升时返回 1.0', () => {
    expect(calculateDifficultyCoefficient(1.0, 0)).toBe(1.0);
  });

  it('飞升次数增加难度系数', () => {
    const base = calculateDifficultyCoefficient(1.0, 1);
    expect(base).toBeGreaterThan(1.0);
    expect(base).toBe(1.15); // 1.0 * (1 + 1 * 0.15)
  });

  it('多次飞升累积难度', () => {
    const result = calculateDifficultyCoefficient(1.0, 3);
    expect(result).toBe(1.45); // 1.0 * (1 + 3 * 0.15)
  });

  it('基础系数影响最终难度', () => {
    expect(calculateDifficultyCoefficient(2.0, 0)).toBe(2.0);
    expect(calculateDifficultyCoefficient(2.0, 1)).toBe(2.3);
  });
});

describe('getDifficultyFromCoefficient', () => {
  it('系数 ≤1.2 为简单', () => {
    expect(getDifficultyFromCoefficient(1.0)).toBe('简单');
    expect(getDifficultyFromCoefficient(1.2)).toBe('简单');
  });

  it('系数 1.21-1.5 为普通', () => {
    expect(getDifficultyFromCoefficient(1.3)).toBe('普通');
    expect(getDifficultyFromCoefficient(1.5)).toBe('普通');
  });

  it('系数 1.51-2.0 为困难', () => {
    expect(getDifficultyFromCoefficient(1.8)).toBe('困难');
    expect(getDifficultyFromCoefficient(2.0)).toBe('困难');
  });

  it('系数 2.01-3.0 为噩梦', () => {
    expect(getDifficultyFromCoefficient(2.5)).toBe('噩梦');
  });

  it('系数 3.01-5.0 为地狱', () => {
    expect(getDifficultyFromCoefficient(4.0)).toBe('地狱');
  });

  it('系数 >5.0 为深渊', () => {
    expect(getDifficultyFromCoefficient(10.0)).toBe('深渊');
  });
});

describe('generateSeed', () => {
  it('生成 8 位十六进制字符串', () => {
    const seed = generateSeed();
    expect(seed).toHaveLength(8);
    expect(/^[0-9a-f]{8}$/.test(seed)).toBe(true);
  });

  it('每次生成不同的种子', () => {
    const seeds = new Set(Array.from({ length: 10 }, () => generateSeed()));
    // 大概率至少有 8 个不同的种子
    expect(seeds.size).toBeGreaterThan(5);
  });
});

describe('generateWorld', () => {
  it('确定性：相同输入产生相同输出', () => {
    const worldview = createTestWorldview();
    const world1 = generateWorld(worldview, 'testseed', 0);
    const world2 = generateWorld(worldview, 'testseed', 0);
    expect(world1).toEqual(world2);
  });

  it('不同种子产生不同世界', () => {
    const worldview = createTestWorldview();
    const world1 = generateWorld(worldview, 'seed001', 0);
    const world2 = generateWorld(worldview, 'seed002', 0);
    // 名称、描述等至少有一项不同
    const differs =
      world1.name !== world2.name ||
      world1.description !== world2.description;
    expect(differs).toBe(true);
  });

  it('生成的世界包含 worldviewId', () => {
    const worldview = createTestWorldview({ id: 'cultivation' });
    const world = generateWorld(worldview, 'seed123', 0);
    expect(world.worldviewId).toBe('cultivation');
  });

  it('生成的世界 type 为中文显示名（去除"世界"后缀）', () => {
    const worldview = createTestWorldview({ name: '修仙世界' });
    const world = generateWorld(worldview, 'seed123', 0);
    expect(world.type).toBe('修仙');
  });

  it('生成的世界 id 等于 seed', () => {
    const worldview = createTestWorldview();
    const world = generateWorld(worldview, 'myseed12', 0);
    expect(world.id).toBe('myseed12');
  });

  it('空 seed 自动生成随机 seed', () => {
    const worldview = createTestWorldview();
    const world = generateWorld(worldview, '', 0);
    expect(world.id).toHaveLength(8);
    expect(/^[0-9a-f]{8}$/.test(world.id)).toBe(true);
  });

  it('名称由前缀+后缀组合', () => {
    const worldview = createTestWorldview({
      namePrefixes: ['星辰'],
      nameSuffixes: ['宇宙'],
    });
    const world = generateWorld(worldview, 'testseed', 0);
    expect(world.name).toBe('星辰宇宙');
  });

  it('生成的世界包含势力', () => {
    const worldview = createTestWorldview();
    const world = generateWorld(worldview, 'testseed', 0);
    expect(world.factions.length).toBeGreaterThanOrEqual(2);
    expect(world.factions.length).toBeLessThanOrEqual(5);
    expect(world.majorForces.length).toBeGreaterThan(0);
  });

  it('生成的世界包含危险和机遇', () => {
    const worldview = createTestWorldview();
    const world = generateWorld(worldview, 'testseed', 0);
    expect(world.dangers.length).toBeGreaterThanOrEqual(2);
    expect(world.opportunities.length).toBeGreaterThanOrEqual(2);
  });

  it('飞升影响难度系数', () => {
    const worldview = createTestWorldview({ baseCoefficient: 1.0 });
    const world0 = generateWorld(worldview, 'testseed', 0);
    const world3 = generateWorld(worldview, 'testseed', 3);
    expect(world3.actualCoefficient).toBeGreaterThan(world0.actualCoefficient);
    // 无飞升：1.0，3次飞升：1.0 * (1 + 3 * 0.15) = 1.45
    expect(world0.actualCoefficient).toBe(1.0);
    expect(world3.actualCoefficient).toBe(1.45);
  });

  it('ratingScore 初始为 0', () => {
    const worldview = createTestWorldview();
    const world = generateWorld(worldview, 'testseed', 0);
    expect(world.ratingScore).toBe(0);
  });

  it('包含 gameVersion', () => {
    const worldview = createTestWorldview();
    const world = generateWorld(worldview, 'testseed', 0);
    expect(world.gameVersion).toBeTruthy();
    expect(typeof world.gameVersion).toBe('string');
  });
});

describe('generateWorlds', () => {
  it('批量生成指定数量的世界', () => {
    const worldview = createTestWorldview();
    const worlds = generateWorlds(worldview, ['s1', 's2', 's3'], 0);
    expect(worlds).toHaveLength(3);
    // 每个世界的 id 对应 seed
    expect(worlds.map(w => w.id)).toEqual(['s1', 's2', 's3']);
  });

  it('批量生成的世界互不相同', () => {
    const worldview = createTestWorldview();
    const worlds = generateWorlds(worldview, ['a', 'b', 'c', 'd', 'e'], 0);
    const names = new Set(worlds.map(w => w.name));
    // 大概率有不同名称
    expect(names.size).toBeGreaterThan(1);
  });

  it('空 seeds 数组返回空数组', () => {
    const worldview = createTestWorldview();
    const worlds = generateWorlds(worldview, [], 0);
    expect(worlds).toEqual([]);
  });
});
