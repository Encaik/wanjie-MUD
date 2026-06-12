/**
 * WorldViewRegistry 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorldViewRegistry,
  asWorldType,
  assertWorldType,
  getAllWorldTypeValues,
  DEFAULT_VISUAL_CONFIG,
  getWorldVisualConfig,
  isExtensibleWorldType,
} from './WorldViewRegistry';
import type { WorldviewDefinition } from './WorldViewRegistry';

// ============================================
// 测试辅助数据
// ============================================

function makeTestWorldview(overrides: Partial<WorldviewDefinition> = {}): WorldviewDefinition {
  return {
    id: 'test-world',
    name: '测试世界',
    description: '用于单元测试的虚拟世界观',
    version: '1.0.0',
    baseCoefficient: 1.2,
    rewardCoefficient: {
      expCoefficient: 1.0,
      spiritStoneCoefficient: 1.0,
      dropCoefficient: 1.0,
      rarityBonus: { rare: 0.1, epic: 0.05, legendary: 0.02, mythic: 0.01 },
      specialRewards: { ascensionMarkBonus: 0.1, titleChance: 0.05, specialItemChance: 0.02 },
    },
    stats: {
      baseHp: 100,
      hpPerLevel: 10,
      hpPerConstitution: 5,
      baseAttack: 10,
      attackPerLevel: 2,
      attackPerConstitution: 3,
      attackPerSpiritRoot: 4,
      baseDefense: 5,
      defensePerLevel: 1,
      defensePerWillpower: 2,
      enemyAttackBonus: 0,
      enemyDefenseBonus: 0,
      statDisplayNames: {},
    },
    realmSystem: {
      mainRealmName: '仙阶',
      subRealmName: '品级',
      tiers: [
        { name: '炼气', subRealms: ['一阶', '二阶', '三阶'], levelRange: [1, 30] },
      ],
    },
    namePrefixes: ['天道', '星辰'],
    nameSuffixes: ['大陆', '界'],
    descriptions: ['这是一个测试世界'],
    powerSystems: ['灵力'],
    majorForces: ['仙门'],
    dangers: [],
    opportunities: [],
    factions: [],
    traits: {
      origin: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      trait: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      personality: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      talent: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
    },
    namePool: { surnames: ['张'], maleNames: ['伟'], femaleNames: ['芳'] },
    texts: {
      name: '测试',
      description: '测试世界观',
      terminology: {
        resource: '灵石', power: '战力', energy: '灵力', practice: '修炼',
        core: '内丹', breakthrough: '突破', enemy: '敌人', dungeon: '秘境',
        pill: '丹药', treasure: '法宝', dungeonDesc: '秘境描述',
        dungeonLocation: '秘境位置', breakthroughPill: '突破丹', cultivationPill: '修炼丹',
      },
      stats: { body: '体质', talent: '天赋', wisdom: '悟性', luck: '气运', will: '意志' },
      combat: {
        victory: '胜利', defeat: '失败', damageDeal: '造成伤害', damageReceive: '受到伤害',
        damageCrit: '暴击', dodge: '闪避', round: '回合', start: '开始', end: '结束',
      },
      cultivation: {
        success: '成功', failure: '失败', breakthrough: '突破', breakthroughFail: '突破失败',
        overflowWarning: '溢出警告', cost: '消耗',
      },
      resource: { gain: '获得', spend: '消耗', insufficient: '不足' },
      item: { use: '使用', obtain: '获得', sell: '出售' },
      dungeon: {
        enter: '进入', exit: '退出', clear: '通关', sweep: '扫荡',
        staminaCost: '体力消耗', powerRequire: '战力需求',
      },
      ui: {
        level: '等级', realm: '境界', combatPower: '战力', exp: '经验',
        hp: '生命', mp: '灵力', stamina: '体力',
      },
      breakthrough: { success: '突破成功', fail: '突破失败', rate: '成功率', pillBonus: '丹药加成' },
      message: { offlineTitle: '离线', offlineContent: '离线内容' },
      paths: {
        body: { id: 'body', name: '体修', description: '炼体', primaryStatKey: 'body', secondaryStatKey: 'will', ultimateAbility: { name: '金刚不坏', description: '无敌', effect: '免伤' } },
        sword: { id: 'sword', name: '剑修', description: '练剑', primaryStatKey: 'talent', secondaryStatKey: 'wisdom', ultimateAbility: { name: '万剑归宗', description: '群攻', effect: '多段' } },
        spell: { id: 'spell', name: '法修', description: '修法', primaryStatKey: 'wisdom', secondaryStatKey: 'talent', ultimateAbility: { name: '天雷', description: '雷击', effect: '高伤' } },
        alchemy: { id: 'alchemy', name: '丹修', description: '炼丹', primaryStatKey: 'luck', secondaryStatKey: 'wisdom', ultimateAbility: { name: '九转金丹', description: '复活', effect: '重生' } },
        demon: { id: 'demon', name: '魔修', description: '修魔', primaryStatKey: 'will', secondaryStatKey: 'body', ultimateAbility: { name: '天魔解体', description: '自爆', effect: '同归' } },
      },
    },
    mechanics: {},
    visualConfig: {
      icon: '🧪',
      accentColor: 'text-green-400',
      gradientClass: 'from-green-500/20 to-teal-600/10',
      borderColor: 'border-green-500/30',
      bgGradient: 'bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
      colorGradient: 'from-green-500 to-teal-500',
    },
    builtin: false,
    // V3 新字段
    attributes: [],
    racePool: ['human'],
    ...overrides,
  };
}

// ============================================
// 测试
// ============================================

describe('WorldViewRegistry', () => {
  beforeEach(() => {
    WorldViewRegistry.resetInstance();
  });

  // --- 单例 ---

  it('应返回同一实例', () => {
    const a = WorldViewRegistry.getInstance();
    const b = WorldViewRegistry.getInstance();
    expect(a).toBe(b);
  });

  it('应支持测试重置', () => {
    const a = WorldViewRegistry.getInstance();
    WorldViewRegistry.resetInstance();
    const b = WorldViewRegistry.getInstance();
    expect(a).not.toBe(b);
  });

  // --- 世界观注册 / 查询 ---

  it('应注册并查询世界观', () => {
    const registry = WorldViewRegistry.getInstance();
    const data = makeTestWorldview({ id: 'cultivation' });
    registry.register(data);

    const retrieved = registry.get('cultivation');
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('测试世界');
    expect(retrieved!.baseCoefficient).toBe(1.2);
  });

  it('未注册的世界观应返回 undefined', () => {
    const registry = WorldViewRegistry.getInstance();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('重复注册应抛出错误', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'dup' }));
    expect(() => registry.register(makeTestWorldview({ id: 'dup' }))).toThrow(
      /世界观 ID 冲突/
    );
  });

  it('应获取所有已注册的世界观', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'a', name: 'A' }));
    registry.register(makeTestWorldview({ id: 'b', name: 'B' }));
    registry.register(makeTestWorldview({ id: 'c', name: 'C' }));

    const all = registry.getAll();
    expect(all).toHaveLength(3);
    expect(all.map(w => w.id)).toEqual(['a', 'b', 'c']);
  });

  it('应获取所有世界观 ID', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'a' }));
    registry.register(makeTestWorldview({ id: 'b' }));

    expect(registry.getAllIds()).toEqual(['a', 'b']);
  });

  it('应校验世界观 ID 是否已注册', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'valid' }));

    expect(registry.has('valid')).toBe(true);
    expect(registry.has('invalid')).toBe(false);
  });

  it('应返回正确的 count', () => {
    const registry = WorldViewRegistry.getInstance();
    expect(registry.count).toBe(0);

    registry.register(makeTestWorldview({ id: 'a' }));
    registry.register(makeTestWorldview({ id: 'b' }));
    expect(registry.count).toBe(2);
  });

  // --- 内置世界观 ---

  it('应过滤内置世界观', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'core1', builtin: true }));
    registry.register(makeTestWorldview({ id: 'core2', builtin: true }));
    registry.register(makeTestWorldview({ id: 'mod1', builtin: false }));

    const builtins = registry.getBuiltins();
    expect(builtins).toHaveLength(2);
    expect(builtins.map(w => w.id)).toEqual(['core1', 'core2']);
  });

  it('无内置世界观时应返回空数组', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'mod1', builtin: false }));
    expect(registry.getBuiltins()).toHaveLength(0);
  });
});

describe('asWorldType', () => {
  beforeEach(() => {
    WorldViewRegistry.resetInstance();
  });

  it('已注册世界观应返回其 ID', () => {
    WorldViewRegistry.getInstance().register(makeTestWorldview({ id: 'cultivation' }));
    expect(asWorldType('cultivation')).toBe('cultivation');
  });

  it('未注册世界观应返回 undefined', () => {
    expect(asWorldType('nonexistent')).toBeUndefined();
  });
});

describe('assertWorldType', () => {
  beforeEach(() => {
    WorldViewRegistry.resetInstance();
  });

  it('已注册世界观应返回其 ID', () => {
    WorldViewRegistry.getInstance().register(makeTestWorldview({ id: 'cultivation' }));
    expect(assertWorldType('cultivation')).toBe('cultivation');
  });

  it('未注册世界观应抛出错误', () => {
    expect(() => assertWorldType('nonexistent')).toThrow(/未注册的世界观/);
  });
});

describe('getAllWorldTypeValues', () => {
  beforeEach(() => {
    WorldViewRegistry.resetInstance();
  });

  it('应返回所有已注册的世界观 ID', () => {
    const registry = WorldViewRegistry.getInstance();
    registry.register(makeTestWorldview({ id: 'a' }));
    registry.register(makeTestWorldview({ id: 'b' }));
    expect(getAllWorldTypeValues()).toEqual(['a', 'b']);
  });
});

describe('getWorldVisualConfig', () => {
  beforeEach(() => {
    WorldViewRegistry.resetInstance();
  });

  it('应返回注册世界观的视觉配置', () => {
    WorldViewRegistry.getInstance().register(makeTestWorldview({ id: 'test' }));
    const config = getWorldVisualConfig('test');
    expect(config.icon).toBe('🧪');
    expect(config.accentColor).toBe('text-green-400');
  });

  it('未注册世界观应返回默认视觉配置', () => {
    const config = getWorldVisualConfig('nonexistent');
    expect(config).toEqual(DEFAULT_VISUAL_CONFIG);
  });
});

describe('isExtensibleWorldType', () => {
  beforeEach(() => {
    WorldViewRegistry.resetInstance();
  });

  it('已注册世界观应返回 true', () => {
    WorldViewRegistry.getInstance().register(makeTestWorldview({ id: 'cultivation' }));
    expect(isExtensibleWorldType('cultivation')).toBe(true);
  });

  it('未注册世界观应返回 false', () => {
    expect(isExtensibleWorldType('nonexistent')).toBe(false);
  });

  it('非字符串应返回 false', () => {
    expect(isExtensibleWorldType(123)).toBe(false);
    expect(isExtensibleWorldType(null)).toBe(false);
    expect(isExtensibleWorldType({})).toBe(false);
  });
});
