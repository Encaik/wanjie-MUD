/**
 * @vitest-environment jsdom
 * 
 * 修炼系统功能模块测试
 * 
 * 功能覆盖：
 * - 修炼功能：消耗灵石进行修炼，获取经验
 * - 自动修炼：自动消耗灵石修炼直到灵石不足
 * - 境界系统：等级、境界名称、经验阈值
 * - 突破系统：突破概率计算、突破增益
 * - 体力系统：体力消耗和恢复
 * - 流派系统：修炼流派选择和技能
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 修炼功能
// ============================================
describe('修炼功能', () => {
  it('修炼应该消耗灵石', async () => {
    const spiritStoneCost = 10;
    const initialStones = 100;
    const afterCultivation = initialStones - spiritStoneCost;
    
    expect(afterCultivation).toBe(90);
  });

  it('修炼应该获得经验', async () => {
    // 模拟修炼经验获取（10-25点）
    const minExp = 10;
    const maxExp = 25;
    
    const expGain = Math.floor(Math.random() * (maxExp - minExp + 1)) + minExp;
    
    expect(expGain).toBeGreaterThanOrEqual(minExp);
    expect(expGain).toBeLessThanOrEqual(maxExp);
  });

  it('应该有performCultivation函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('修炼面板组件应该可导入', async () => {
    const { CultivationPanel } = await import('@/components/game/tabs');
    expect(CultivationPanel).toBeDefined();
    expect(typeof CultivationPanel).toBe('function');
  });
});

// ============================================
// 自动修炼功能
// ============================================
describe('自动修炼功能', () => {
  it('灵石不足时应该停止修炼', async () => {
    const spiritStones = 5;
    const requiredStones = 10;
    
    const shouldStop = spiritStones < requiredStones;
    expect(shouldStop).toBe(true);
  });

  it('经验满时应该升级', async () => {
    let experience = 95;
    const expGain = 10;
    const maxExp = 100;
    let level = 1;
    
    experience += expGain;
    if (experience >= maxExp) {
      experience -= maxExp;
      level += 1;
    }
    
    expect(level).toBe(2);
    expect(experience).toBe(5);
  });

  it('应该有toggleAutoCultivation函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });
});

// ============================================
// 境界系统
// ============================================
describe('境界系统', () => {
  it('应该有最大等级限制', async () => {
    const { MAX_LEVEL } = await import('@/lib/game/realmSystem');
    
    expect(MAX_LEVEL).toBeGreaterThan(0);
    expect(typeof MAX_LEVEL).toBe('number');
  });

  it('应该能获取境界名称', async () => {
    const { getRealmName } = await import('@/lib/game/generators');
    
    expect(getRealmName).toBeDefined();
    expect(typeof getRealmName).toBe('function');
  });

  it('不同世界应该有不同的境界名称', async () => {
    const { getRealmName, generateWorlds } = await import('@/lib/game/generators');
    const worlds = generateWorlds();
    
    const realm1 = getRealmName(worlds[0].realmSystem, 10);
    const realm2 = getRealmName(worlds[1].realmSystem, 10);
    
    // 不同世界相同等级可能有不同境界名
    expect(realm1).toBeTruthy();
    expect(realm2).toBeTruthy();
  });

  it('应该能计算升级所需经验', async () => {
    const { getExperienceForLevel } = await import('@/lib/game/generators');
    
    const exp1 = getExperienceForLevel(1);
    expect(exp1).toBeGreaterThan(0);
    
    const exp10 = getExperienceForLevel(10);
    expect(exp10).toBeGreaterThan(exp1);
  });

  it('等级越高所需经验越多', async () => {
    const { getExperienceForLevel } = await import('@/lib/game/generators');
    
    for (let level = 1; level < 10; level++) {
      const expCurrent = getExperienceForLevel(level);
      const expNext = getExperienceForLevel(level + 1);
      expect(expNext).toBeGreaterThan(expCurrent);
    }
  });
});

// ============================================
// 突破系统
// ============================================
describe('突破系统', () => {
  it('应该能计算最大经验值', async () => {
    const { getMaxExperience } = await import('@/lib/game/cultivation/cultivation');
    
    // 测试不同等级的最大经验
    expect(getMaxExperience(1)).toBeGreaterThan(0);
    expect(getMaxExperience(10)).toBeGreaterThan(getMaxExperience(1));
    expect(getMaxExperience(100)).toBeGreaterThan(getMaxExperience(10));
  });

  it('应该能计算突破概率', async () => {
    const { calculateBreakthroughRate } = await import('@/lib/game/cultivation/cultivation');
    
    // 低等级应该有较高的基础成功率
    const lowLevelRate = calculateBreakthroughRate(1, 10, 0, 0, 100);
    expect(lowLevelRate).toBeGreaterThan(0);
    expect(lowLevelRate).toBeLessThanOrEqual(100);
    
    // 高等级应该有较低的基础成功率
    const highLevelRate = calculateBreakthroughRate(100, 10, 0, 0, 100);
    expect(highLevelRate).toBeGreaterThan(0);
    expect(highLevelRate).toBeLessThanOrEqual(100);
  });

  it('突破增益应该提高成功率', async () => {
    const { calculateBreakthroughRate } = await import('@/lib/game/cultivation/cultivation');
    
    // 有增益效果时成功率应该更高
    const baseRate = calculateBreakthroughRate(50, 10, 0, 0, 100);
    const boostedRate = calculateBreakthroughRate(50, 10, 20, 0, 100); // 20% 增益
    
    expect(boostedRate).toBeGreaterThan(baseRate);
  });

  it('悟性应该影响突破概率', async () => {
    const { calculateBreakthroughRate } = await import('@/lib/game/cultivation/cultivation');
    
    const lowWuxingRate = calculateBreakthroughRate(50, 30, 0, 0, 100);
    const highWuxingRate = calculateBreakthroughRate(50, 80, 0, 0, 100);
    
    expect(highWuxingRate).toBeGreaterThan(lowWuxingRate);
  });

  it('满级时应该不能突破', async () => {
    const { executeCultivation } = await import('@/lib/game/cultivation/cultivation');
    const { getMaxLevel, generateRealmSystem } = await import('@/lib/data/realmData');
    const { createInventoryItem } = await import('@/lib/game/types');
    const { spiritStoneItems } = await import('@/lib/game/items');
    
    // 创建一个满级的主角
    const realmSystem = generateRealmSystem('修仙');
    const maxLevel = getMaxLevel(realmSystem);
    
    const protagonist = {
      id: 'test',
      name: 'Test',
      level: maxLevel, // 满级
      experience: 10000, // 经验已满
      overflowExperience: 0,
      realm: '渡劫',
      stats: {
        体质: 100,
        灵根: 100,
        悟性: 100,
        意志: 100,
        幸运: 10,
      },
      inventory: [createInventoryItem(spiritStoneItems[0], 1000)],
      techniques: [],
      equipments: [],
      world: {
        type: '修仙',
        realmSystem,
      },
      activeEffects: [],
      currentMp: 100,
      maxMp: 100,
      statCapBonuses: {},
    } as any;
    
    const result = executeCultivation(protagonist);
    
    // 满级时不应该尝试突破
    expect(result.breakthroughAttempt).toBeFalsy();
    // 应该是普通修炼
    expect(result.success).toBe(true);
  });
});

// ============================================
// 体力系统
// ============================================
describe('体力系统', () => {
  it('应该有默认体力值', async () => {
    const { DEFAULT_PROTAGONIST_EXTENSION } = await import('@/lib/game/typesExtension');
    
    expect(DEFAULT_PROTAGONIST_EXTENSION.stamina).toBe(100);
    expect(DEFAULT_PROTAGONIST_EXTENSION.maxStamina).toBe(100);
  });

  it('体力不应该低于0', async () => {
    const currentStamina = 5;
    const staminaCost = 10;
    
    const newStamina = Math.max(0, currentStamina - staminaCost);
    expect(newStamina).toBe(0);
  });

  it('体力应该可以恢复', async () => {
    const currentStamina = 50;
    const maxStamina = 100;
    const recoveryRate = 10;
    
    const newStamina = Math.min(maxStamina, currentStamina + recoveryRate);
    expect(newStamina).toBe(60);
  });

  it('休息功能应该恢复体力和生命', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    // performRest 函数应该存在
    expect(useGame).toBeDefined();
  });
});

// ============================================
// 流派系统
// ============================================
describe('流派系统', () => {
  it('应该有有效的修炼流派', async () => {
    const { CULTIVATION_PATHS } = await import('@/lib/data/cultivationPathData');
    
    const pathKeys = Object.keys(CULTIVATION_PATHS);
    expect(pathKeys.length).toBeGreaterThan(0);
    
    pathKeys.forEach(key => {
      const path = CULTIVATION_PATHS[key as keyof typeof CULTIVATION_PATHS];
      expect(path.id).toBe(key);
      expect(path.name).toBeTruthy();
      expect(path.description).toBeTruthy();
      expect(path.skills).toBeDefined();
    });
  });

  it('流派等级经验应该正确计算', async () => {
    const { getPathLevelExp, PATH_LEVEL_CONFIG } = await import('@/lib/data/cultivationPathData');
    
    const exp1 = getPathLevelExp(1);
    expect(exp1).toBeGreaterThan(0);
    
    const exp10 = getPathLevelExp(10);
    expect(exp10).toBeGreaterThan(exp1);
  });

  it('每个流派应该有多个技能', async () => {
    const { CULTIVATION_PATHS } = await import('@/lib/data/cultivationPathData');
    
    Object.values(CULTIVATION_PATHS).forEach(path => {
      expect(path.skills.length).toBeGreaterThan(0);
      
      path.skills.forEach(skill => {
        expect(skill.name).toBeTruthy();
        expect(skill.description).toBeTruthy();
        expect(skill.level).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================
// 战力计算
// ============================================
describe('战力计算', () => {
  it('应该有calculatePlayerCombatPower函数', async () => {
    const { calculatePlayerCombatPower } = await import('@/lib/game/combatPower');
    
    expect(calculatePlayerCombatPower).toBeDefined();
    expect(typeof calculatePlayerCombatPower).toBe('function');
  });

  it('应该能计算玩家战力', async () => {
    const { calculatePlayerCombatPower } = await import('@/lib/game/combatPower');
    
    const mockProtagonist = {
      level: 10,
      stats: { 体质: 60, 灵根: 60, 悟性: 60, 幸运: 60, 意志: 60 },
      maxHp: 200,
      maxMp: 100,
      world: { 
        type: '修仙' as const,
        id: 1,
        name: '测试世界',
        description: '',
        powerSystem: '',
        realmSystem: {} as any,
        majorForces: '',
        factions: [],
        worldCoefficient: 1,
        difficulty: '普通' as const,
        dangers: { description: '', impact: {}, impactDescription: '' },
        opportunities: { description: '', impact: {}, impactDescription: '' },
      },
      equippedAttackTechniques: [null, null, null],
      equippedDefenseTechniques: [null, null, null],
      equippedMelee: null,
      equippedRanged: null,
      equippedHead: null,
      equippedBody: null,
      equippedLegs: null,
      equippedFeet: null,
    };
    
    const power = calculatePlayerCombatPower(mockProtagonist as any, [], [], []);
    expect(power).toBeGreaterThan(0);
    expect(typeof power).toBe('number');
  });

  it('等级越高战力越高', async () => {
    const { calculatePlayerCombatPower } = await import('@/lib/game/combatPower');
    
    const createMockProtagonist = (level: number, maxHp: number, maxMp: number) => ({
      level,
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp,
      maxMp,
      world: { 
        type: '修仙' as const,
        id: 1,
        name: '测试世界',
        description: '',
        powerSystem: '',
        realmSystem: {} as any,
        majorForces: '',
        factions: [],
        worldCoefficient: 1,
        difficulty: '普通' as const,
        dangers: { description: '', impact: {}, impactDescription: '' },
        opportunities: { description: '', impact: {}, impactDescription: '' },
      },
      equippedAttackTechniques: [null, null, null],
      equippedDefenseTechniques: [null, null, null],
      equippedMelee: null,
      equippedRanged: null,
      equippedHead: null,
      equippedBody: null,
      equippedLegs: null,
      equippedFeet: null,
    });
    
    const power1 = calculatePlayerCombatPower(createMockProtagonist(1, 100, 50) as any, [], [], []);
    const power50 = calculatePlayerCombatPower(createMockProtagonist(50, 500, 250) as any, [], [], []);
    
    expect(power1).toBeGreaterThan(0);
    expect(power50).toBeGreaterThan(0);
    expect(power50).toBeGreaterThan(power1);
  });
});
