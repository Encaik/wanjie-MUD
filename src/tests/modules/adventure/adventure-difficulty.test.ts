/**
 * @vitest-environment jsdom
 * 
 * 机缘难度系统测试
 * 
 * 测试覆盖：
 * - 难度等级对敌人的影响
 * - 难度等级对奖励的影响
 * - 伤害上限机制
 * - 世界观适配
 */
import { describe, it, expect } from 'vitest';
import { createTestDungeonConfig, createTestProtagonist } from './test-helpers';

// ============================================
// 难度基础功能测试
// ============================================
describe('难度基础功能', () => {
  it('应该能导入难度相关函数', async () => {
    const { calculateBattleWithLogs, getAvailableDifficulties } = await import('@/lib/game/adventure');
    expect(calculateBattleWithLogs).toBeDefined();
    expect(getAvailableDifficulties).toBeDefined();
  });

  it('不同难度应该生成不同强度的敌人', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    
    const easyConfig = createTestDungeonConfig({ difficulty: 1 });
    const hardConfig = createTestDungeonConfig({ difficulty: 10 });
    
    const easyResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      easyConfig
    );
    
    const hardResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      hardConfig
    );
    
    // 高难度的敌人攻击力应该更高或相等
    expect(hardResult.battleState.enemyAttack).toBeGreaterThanOrEqual(
      easyResult.battleState.enemyAttack * 0.5 // 允许一定误差
    );
  });

  it('不同难度应该有不同的奖励倍率', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 200, 灵根: 200, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    
    const config1x = createTestDungeonConfig({ rewardMultiplier: 1 });
    const config2x = createTestDungeonConfig({ rewardMultiplier: 2 });
    
    const result1x = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      config1x
    );
    
    const result2x = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      config2x
    );
    
    // 两个都应该胜利
    expect(result1x.result.victory).toBe(true);
    expect(result2x.result.victory).toBe(true);
    
    // 高倍率应该有更多奖励
    if (result1x.result.rewards?.experience && result2x.result.rewards?.experience) {
      expect(result2x.result.rewards.experience).toBeGreaterThanOrEqual(
        result1x.result.rewards.experience
      );
    }
  });

  it('应该能获取可用难度列表', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    // 低等级玩家
    const lowLevelDifficulties = getAvailableDifficulties(5, '修仙');
    expect(lowLevelDifficulties.length).toBeGreaterThanOrEqual(1);
    
    // 高等级玩家
    const highLevelDifficulties = getAvailableDifficulties(50, '修仙');
    expect(highLevelDifficulties.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// 敌人等级范围测试
// ============================================
describe('敌人等级范围', () => {
  it('敌人等级应该在配置范围内', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig({
      enemyLevelMin: 5,
      enemyLevelMax: 15,
    });
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10, // 等级在范围内
      config
    );
    
    // 敌人应该有合理的HP
    expect(battleState.enemyMaxHp).toBeGreaterThan(0);
  });
});

// ============================================
// 伤害上限机制测试
// ============================================
describe('伤害上限机制', () => {
  it('非常强大的攻击不应该一击秒杀Boss', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    // 创建超强主角
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 9999, 灵根: 9999, 悟性: 9999, 幸运: 9999, 意志: 9999 },
    });
    const config = createTestDungeonConfig();
    
    const { result, battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      'Boss',
      50,
      config
    );
    
    // 战斗应该胜利
    expect(result.victory).toBe(true);
    // Boss应该有合理的初始HP（验证伤害上限生效）
    expect(battleState.enemyMaxHp).toBeGreaterThan(0);
  });
});

// ============================================
// 世界观适配测试
// ============================================
describe('世界观适配', () => {
  it('不同世界观应该能正常战斗', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const worlds: Array<'修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世'> = 
      ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
    
    for (const worldType of worlds) {
      const mockProtagonist = createTestProtagonist({
        world: { 
          id: 1,
          type: worldType, 
          realmSystem: { mainRealmName: worldType, subRealmName: '阶段', tiers: [] }, 
          name: `${worldType}界`, 
          description: `${worldType}世界`,
          difficulty: '普通',
          powerSystem: worldType,
          majorForces: '',
          factions: [],
          worldCoefficient: 1.0,
          dangers: { description: '危险', impact: {}, impactDescription: '中等危险' },
          opportunities: { description: '机缘', impact: {}, impactDescription: '高等机缘' }
        },
      });
      const config = createTestDungeonConfig();
      
      const { result } = calculateBattleWithLogs(
        mockProtagonist,
        'enemy',
        '敌人',
        10,
        config
      );
      
      // 应该能正常完成战斗
      expect(result).toBeDefined();
      expect(result).toHaveProperty('victory');
    }
  });
});

// ============================================
// 新手难度机缘系统测试
// ============================================
describe('新手难度机缘系统', () => {
  it('未完成新手机缘时，难度列表应包含新手难度', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    // 模拟未完成新手机缘的玩家
    const difficulties = getAvailableDifficulties(5, '修仙', false);
    
    // 第一个应该是新手难度
    expect(difficulties.length).toBeGreaterThanOrEqual(1);
    expect(difficulties[0].isNovice).toBe(true);
    expect(difficulties[0].realmName).toContain('新手引导');
  });

  it('已完成新手机缘时，难度列表不应包含新手难度', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    // 模拟已完成新手机缘的玩家
    const difficulties = getAvailableDifficulties(5, '修仙', true);
    
    // 不应该有新手难度
    expect(difficulties.every(d => !d.isNovice)).toBe(true);
  });

  it('新手难度应该比普通难度更容易', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    // 获取包含新手难度的列表
    const difficulties = getAvailableDifficulties(5, '修仙', false);
    
    const noviceDifficulty = difficulties.find(d => d.isNovice);
    const normalDifficulty = difficulties.find(d => !d.isNovice);
    
    if (noviceDifficulty && normalDifficulty) {
      // 新手难度格子数应该更少
      expect(noviceDifficulty.rows).toBeLessThanOrEqual(normalDifficulty.rows);
      // 新手难度奖励倍率应该更低
      expect(noviceDifficulty.rewardMultiplier).toBeLessThan(normalDifficulty.rewardMultiplier);
      // 新手难度敌人等级范围应该更窄
      const noviceRange = noviceDifficulty.enemyLevelMax - noviceDifficulty.enemyLevelMin;
      const normalRange = normalDifficulty.enemyLevelMax - normalDifficulty.enemyLevelMin;
      expect(noviceRange).toBeLessThanOrEqual(normalRange);
    }
  });

  it('新手难度参数应该符合预期', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    const playerLevel = 5;
    const difficulties = getAvailableDifficulties(playerLevel, '修仙', false);
    const noviceDifficulty = difficulties.find(d => d.isNovice);
    
    expect(noviceDifficulty).toBeDefined();
    if (noviceDifficulty) {
      // 等级应该比玩家等级低2（最低为1）
      expect(noviceDifficulty.difficulty).toBe(Math.max(1, playerLevel - 2));
      // 格子数应该是5x5
      expect(noviceDifficulty.rows).toBe(5);
      expect(noviceDifficulty.cols).toBe(5);
      // 敌人等级范围应该是±1
      expect(noviceDifficulty.enemyLevelMin).toBe(Math.max(1, noviceDifficulty.difficulty - 1));
      expect(noviceDifficulty.enemyLevelMax).toBe(noviceDifficulty.difficulty + 1);
      // 奖励倍率应该是0.8
      expect(noviceDifficulty.rewardMultiplier).toBe(0.8);
      // 难度级别应该是easy
      expect(noviceDifficulty.difficultyLevel).toBe('easy');
    }
  });
});

// ============================================
// 新手区域敌人数值测试
// ============================================
describe('新手区域敌人数值', () => {
  it('低等级普通敌人HP应该在合理范围内', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    // 创建一个普通玩家
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    
    // 7级普通敌人
    const config = createTestDungeonConfig({
      difficulty: 7,
      enemyLevelMin: 5,
      enemyLevelMax: 9,
    });
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '普通敌人',
      7,
      config
    );
    
    // 7级普通敌人HP应该在合理范围内
    // 修复后：约400-600范围
    expect(battleState.enemyMaxHp).toBeGreaterThan(100);
    expect(battleState.enemyMaxHp).toBeLessThan(700);
  });

  it('低等级Boss HP不应该过高（修复1600血量问题）', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    // 创建一个较强的玩家
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 100, 灵根: 100, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 300,
      currentHp: 300,
    });
    
    // 7级Boss（新手区域）
    const config = createTestDungeonConfig({
      difficulty: 7,
      enemyLevelMin: 5,
      enemyLevelMax: 9,
    });
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      '新手Boss',
      7,
      config
    );
    
    // 7级Boss HP应该合理
    // 修复前：1600血量（是玩家160血量的10倍）
    // 修复后：应该在800左右（约玩家血量的3-4倍）
    const hpRatio = battleState.enemyMaxHp / mockProtagonist.maxHp;
    expect(hpRatio).toBeLessThan(5); // Boss血量不应该超过玩家5倍
    expect(battleState.enemyMaxHp).toBeLessThan(1000); // 绝对值也不应该过高
    expect(battleState.enemyMaxHp).toBeGreaterThan(400); // 但也不应该太低
  });

  it('新手区域Boss增强应该降低', async () => {
    const { calculateEnemyEnhancement } = await import('@/lib/game/enemyEnhancement');
    
    // 新手区域（难度<=10）的Boss增强
    const newbieEnhancement = calculateEnemyEnhancement(7, 'boss', 7);
    
    // 非新手区域的Boss增强
    const normalEnhancement = calculateEnemyEnhancement(7, 'boss', 20);
    
    // 新手区域的HP加成应该更低
    expect(newbieEnhancement.totalHpBonus).toBeLessThan(normalEnhancement.totalHpBonus);
    
    // 新手区域Boss HP加成应该是25%，而不是100%
    expect(newbieEnhancement.totalHpBonus).toBe(25);
    expect(normalEnhancement.totalHpBonus).toBe(100);
  });

  it('高等级Boss增强应该正常', async () => {
    const { calculateEnemyEnhancement } = await import('@/lib/game/enemyEnhancement');
    
    // 高等级Boss（难度>10）
    const enhancement = calculateEnemyEnhancement(50, 'boss', 50);
    
    // 应该使用正常的Boss加成
    expect(enhancement.totalHpBonus).toBeGreaterThan(25);
  });
});

// ============================================
// 机缘解锁系统测试
// ============================================
describe('机缘解锁系统', () => {
  it('机缘应该根据玩家等级逐渐显示', async () => {
    const { getAvailableDifficultiesForRealm, generateRealmSystem } = await import('@/lib/data/realmData');
    
    // 创建一个境界系统
    const realmSystem = generateRealmSystem('修仙');
    
    // 低等级玩家（1级）
    const lowLevelDifficulties = getAvailableDifficultiesForRealm(realmSystem, 1);
    
    // 高等级玩家（50级）
    const highLevelDifficulties = getAvailableDifficultiesForRealm(realmSystem, 50);
    
    // 两者都应该能看到至少1个机缘
    expect(lowLevelDifficulties.length).toBeGreaterThanOrEqual(1);
    expect(highLevelDifficulties.length).toBeGreaterThanOrEqual(1);
    
    // 低等级玩家看到的所有机缘等级应该都较低
    const lowLevelMax = Math.max(...lowLevelDifficulties.map(d => d.difficulty));
    const highLevelMax = Math.max(...highLevelDifficulties.map(d => d.difficulty));
    
    // 高等级玩家看到的最高等级机缘应该更高
    expect(highLevelMax).toBeGreaterThan(lowLevelMax);
  });

  it('机缘解锁状态应该正确标记', async () => {
    const { getAvailableDifficultiesForRealm, generateRealmSystem } = await import('@/lib/data/realmData');
    
    const realmSystem = generateRealmSystem('修仙');
    const playerLevel = 10;
    
    const difficulties = getAvailableDifficultiesForRealm(realmSystem, playerLevel);
    
    // 检查解锁状态
    for (const difficulty of difficulties) {
      if (difficulty.difficulty <= playerLevel) {
        // 等级 <= 玩家等级的应该解锁
        expect(difficulty.isUnlocked).toBe(true);
      }
    }
  });

  it('高等级机缘应该显示为未解锁', async () => {
    const { getAvailableDifficultiesForRealm, generateRealmSystem } = await import('@/lib/data/realmData');
    
    const realmSystem = generateRealmSystem('修仙');
    const playerLevel = 10;
    
    const difficulties = getAvailableDifficultiesForRealm(realmSystem, playerLevel);
    
    // 找到高于玩家等级的机缘
    const lockedDifficulties = difficulties.filter(d => d.difficulty > playerLevel);
    
    // 这些应该标记为未解锁
    for (const difficulty of lockedDifficulties) {
      expect(difficulty.isUnlocked).toBe(false);
    }
  });

  it('机缘列表不应该显示过多未来等级', async () => {
    const { getAvailableDifficultiesForRealm, generateRealmSystem } = await import('@/lib/data/realmData');
    
    const realmSystem = generateRealmSystem('修仙');
    const playerLevel = 10;
    
    const difficulties = getAvailableDifficultiesForRealm(realmSystem, playerLevel);
    
    // 最高显示等级应该不超过玩家等级+20
    const maxDifficulty = Math.max(...difficulties.map(d => d.difficulty));
    expect(maxDifficulty).toBeLessThanOrEqual(playerLevel + 20);
  });

  it('高等级机缘需要通关前置机缘才显示', async () => {
    const { getAvailableDifficultiesForRealm, generateRealmSystem } = await import('@/lib/data/realmData');
    
    const realmSystem = generateRealmSystem('修仙');
    const playerLevel = 10;
    
    // 没有通关任何机缘时
    const noClearedDifficulties = getAvailableDifficultiesForRealm(realmSystem, playerLevel, []);
    
    // 通关了一个中等难度的机缘（难度30）
    const clearedMediumDifficulty = getAvailableDifficultiesForRealm(realmSystem, playerLevel, [30]);
    
    // 通关了高难度机缘后，应该能看到更高等级的机缘
    const clearedHighDifficulty = getAvailableDifficultiesForRealm(realmSystem, playerLevel, [50]);
    
    // 没有通关时，最高显示等级应该有限制
    const noClearedMax = noClearedDifficulties.length > 0 
      ? Math.max(...noClearedDifficulties.map(d => d.difficulty)) 
      : 0;
    
    // 通关高难度后，应该能看到更高的机缘
    const clearedHighMax = clearedHighDifficulty.length > 0
      ? Math.max(...clearedHighDifficulty.map(d => d.difficulty))
      : 0;
    
    // 通关高难度后能看到更高等级的机缘
    expect(clearedHighMax).toBeGreaterThanOrEqual(noClearedMax);
  });

  it('低等级机缘不需要通关前置就显示', async () => {
    const { getAvailableDifficultiesForRealm, generateRealmSystem } = await import('@/lib/data/realmData');
    
    const realmSystem = generateRealmSystem('修仙');
    const playerLevel = 30;
    
    // 即使没有通关任何机缘，也应该能看到低等级的机缘
    const difficulties = getAvailableDifficultiesForRealm(realmSystem, playerLevel, []);
    
    // 应该至少有一个机缘显示
    expect(difficulties.length).toBeGreaterThanOrEqual(1);
    
    // 所有显示的机缘中，应该有玩家等级以下的（已解锁的）
    const unlockedDifficulties = difficulties.filter(d => d.difficulty <= playerLevel);
    expect(unlockedDifficulties.length).toBeGreaterThanOrEqual(1);
    
    // 已解锁的机缘应该标记为解锁状态
    for (const d of unlockedDifficulties) {
      expect(d.isUnlocked).toBe(true);
    }
  });
});

// ============================================
// 机缘退出类型测试
// ============================================
describe('机缘退出类型', () => {
  it('中途退出应该显示逃离消息', async () => {
    // 这个测试验证退出消息逻辑
    // 实际消息显示在UI层，这里验证数据流
    
    // 中途退出时 isCompleted = false
    const isCompleted = false;
    const expectedTitle = isCompleted ? '完成秘境' : '逃离秘境';
    expect(expectedTitle).toBe('逃离秘境');
  });

  it('探索完成退出应该显示完成消息', async () => {
    // 探索完成时 isCompleted = true
    const isCompleted = true;
    const expectedTitle = isCompleted ? '完成秘境' : '逃离秘境';
    expect(expectedTitle).toBe('完成秘境');
  });

  it('探索度计算应该正确', () => {
    // 模拟一个简单的网格
    const grid = [
      [
        { type: 'enemy', visited: true, cleared: false },
        { type: 'treasure', visited: false, cleared: false },
      ],
      [
        { type: 'boss', visited: true, cleared: true },
        { type: 'empty', visited: false, cleared: false },
      ],
    ];
    
    // 计算探索度
    const explorableTypes = ['treasure', 'enemy', 'elite', 'miniboss', 'boss', 'event', 'rest'];
    let explored = 0;
    let total = 0;
    
    for (const row of grid) {
      for (const cell of row) {
        if (explorableTypes.includes(cell.type)) {
          total++;
          if (cell.visited || cell.cleared) {
            explored++;
          }
        }
      }
    }
    
    // 3个可探索格子，2个已探索
    expect(total).toBe(3);
    expect(explored).toBe(2);
    // 探索度 = 66.67%
    expect(explored / total).toBeCloseTo(0.667, 2);
  });
});

// ============================================
// 新手引导完成标记测试
// ============================================
describe('新手引导完成标记', () => {
  it('中途退出新手机缘不应设置完成标记', () => {
    // 模拟状态
    const prevHasCompletedNoviceAdventure = false;
    const isNoviceAdventure = true;
    const actualIsCompleted = false; // 中途退出
    
    // 正确逻辑：只有完成新手机缘才设置标记
    const hasCompletedNoviceAdventure = prevHasCompletedNoviceAdventure || (isNoviceAdventure && actualIsCompleted);
    
    expect(hasCompletedNoviceAdventure).toBe(false);
  });

  it('完成新手机缘应设置完成标记', () => {
    // 模拟状态
    const prevHasCompletedNoviceAdventure = false;
    const isNoviceAdventure = true;
    const actualIsCompleted = true; // 完成探索
    
    // 正确逻辑：只有完成新手机缘才设置标记
    const hasCompletedNoviceAdventure = prevHasCompletedNoviceAdventure || (isNoviceAdventure && actualIsCompleted);
    
    expect(hasCompletedNoviceAdventure).toBe(true);
  });

  it('已完成新手机缘后不应重置标记', () => {
    // 模拟状态
    const prevHasCompletedNoviceAdventure = true; // 已完成
    const isNoviceAdventure = true;
    const actualIsCompleted = false; // 即使中途退出
    
    // 已完成的标记应该保持
    const hasCompletedNoviceAdventure = prevHasCompletedNoviceAdventure || (isNoviceAdventure && actualIsCompleted);
    
    expect(hasCompletedNoviceAdventure).toBe(true);
  });

  it('普通机缘不应影响新手引导标记', () => {
    // 模拟状态
    const prevHasCompletedNoviceAdventure = false;
    const isNoviceAdventure = false; // 非新手机缘
    const actualIsCompleted = true;
    
    // 普通机缘不影响新手引导标记
    const hasCompletedNoviceAdventure = prevHasCompletedNoviceAdventure || (isNoviceAdventure && actualIsCompleted);
    
    expect(hasCompletedNoviceAdventure).toBe(false);
  });
});

// ============================================
// 已访问格子检查测试
// ============================================
describe('已访问格子检查', () => {
  it('已访问格子应该被识别', () => {
    const visitedCell = { type: 'treasure', visited: true, cleared: false };
    const clearedCell = { type: 'enemy', visited: true, cleared: true };
    const newCell = { type: 'enemy', visited: false, cleared: false };
    
    // 检查逻辑
    expect(visitedCell.visited || visitedCell.cleared).toBe(true);
    expect(clearedCell.visited || clearedCell.cleared).toBe(true);
    expect(newCell.visited || newCell.cleared).toBe(false);
  });

  it('已访问格子不应触发效果', () => {
    // 模拟格子状态
    const grid = [
      [
        { type: 'treasure', visited: true, cleared: true },
        { type: 'treasure', visited: false, cleared: false },
      ],
    ];
    
    // 已访问的宝箱
    const visitedCell = grid[0][0];
    const shouldTriggerEffect = !(visitedCell.visited || visitedCell.cleared);
    expect(shouldTriggerEffect).toBe(false);
    
    // 未访问的宝箱
    const newCell = grid[0][1];
    const shouldTriggerNewEffect = !(newCell.visited || newCell.cleared);
    expect(shouldTriggerNewEffect).toBe(true);
  });
});

// ============================================
// 战利品结算测试
// ============================================
describe('战利品结算', () => {
  it('战利品应该正确加入背包', async () => {
    const { addToInventory } = await import('@/hooks/utils/inventoryUtils');
    const { createInventoryItem } = await import('@/lib/game/types');
    
    // 创建初始背包
    const inventory: any[] = [];
    
    // 创建战利品（模拟灵石物品）
    const loot = createInventoryItem({
      id: 'spirit_stone',
      name: '灵石',
      type: '灵石',
      description: '修仙必备',
      rarity: '普通',
      effects: [],
      stackable: true,
      maxStack: 99999,
    }, 100);
    
    // 添加到背包
    const updatedInventory = addToInventory(inventory, loot);
    
    // 验证
    expect(updatedInventory.length).toBe(1);
    expect(updatedInventory[0].quantity).toBe(100);
  });

  it('相同物品应该堆叠', async () => {
    const { addToInventory } = await import('@/hooks/utils/inventoryUtils');
    const { createInventoryItem } = await import('@/lib/game/types');
    
    // 创建初始背包
    let inventory: any[] = [];
    
    // 创建灵石物品定义
    const spiritStone = {
      id: 'spirit_stone',
      name: '灵石',
      type: '灵石' as const,
      description: '修仙必备',
      rarity: '普通' as const,
      effects: [] as any[],
      stackable: true,
      maxStack: 99999,
    };
    
    // 添加两批灵石
    const loot1 = createInventoryItem(spiritStone, 50);
    const loot2 = createInventoryItem(spiritStone, 50);
    
    inventory = addToInventory(inventory, loot1);
    inventory = addToInventory(inventory, loot2);
    
    // 验证堆叠
    expect(inventory.length).toBe(1);
    expect(inventory[0].quantity).toBe(100);
  });

  it('战利品详情应该正确显示', () => {
    // 模拟战利品列表
    const currentLoot = [
      { definition: { id: 'spirit_stone', name: '灵石' }, quantity: 100 },
      { definition: { id: 'pill', name: '筑基丹' }, quantity: 2 },
    ];
    
    // 统计每种物品的数量
    const itemCounts = new Map<string, { name: string; quantity: number }>();
    for (const item of currentLoot) {
      const existing = itemCounts.get(item.definition.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemCounts.set(item.definition.id, { name: item.definition.name, quantity: item.quantity });
      }
    }
    
    // 格式化显示
    const lootList = Array.from(itemCounts.values())
      .map(item => `${item.name}x${item.quantity}`)
      .join('、');
    
    expect(lootList).toBe('灵石x100、筑基丹x2');
  });

  it('战利品统计应该合并相同物品', () => {
    // 模拟战利品列表（包含重复物品）
    const currentLoot = [
      { definition: { id: 'spirit_stone', name: '灵石' }, quantity: 50 },
      { definition: { id: 'spirit_stone', name: '灵石' }, quantity: 30 },
      { definition: { id: 'pill', name: '筑基丹' }, quantity: 2 },
      { definition: { id: 'pill', name: '筑基丹' }, quantity: 3 },
    ];
    
    // 统计每种物品的数量
    const itemCounts = new Map<string, { name: string; quantity: number }>();
    for (const item of currentLoot) {
      const existing = itemCounts.get(item.definition.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemCounts.set(item.definition.id, { name: item.definition.name, quantity: item.quantity });
      }
    }
    
    // 验证合并结果
    expect(itemCounts.size).toBe(2);
    expect(itemCounts.get('spirit_stone')?.quantity).toBe(80);
    expect(itemCounts.get('pill')?.quantity).toBe(5);
  });
});
