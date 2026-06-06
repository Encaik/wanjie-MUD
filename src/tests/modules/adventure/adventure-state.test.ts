/**
 * @vitest-environment jsdom
 * 
 * 机缘状态管理测试
 * 
 * 测试覆盖：
 * - 状态结构
 * - 状态更新
 * - 战斗状态
 * - 秘境状态
 */
import { describe, it, expect } from 'vitest';
import { createTestDungeonConfig, createTestProtagonist } from './test-helpers';

// ============================================
// 状态结构测试
// ============================================
describe('状态结构', () => {
  it('应该能导入状态类型', async () => {
    const types = await import('@/lib/game/types');
    expect(types).toBeDefined();
  });

  it('主角数据应该有正确的结构', () => {
    const protagonist = createTestProtagonist();
    
    expect(protagonist).toHaveProperty('id');
    expect(protagonist).toHaveProperty('level');
    expect(protagonist).toHaveProperty('stats');
    expect(protagonist).toHaveProperty('maxHp');
    expect(protagonist).toHaveProperty('currentHp');
    expect(protagonist).toHaveProperty('world');
  });

  it('秘境配置应该有正确的结构', () => {
    const config = createTestDungeonConfig();
    
    expect(config).toHaveProperty('rows');
    expect(config).toHaveProperty('cols');
    expect(config).toHaveProperty('difficulty');
    expect(config).toHaveProperty('realmName');
    expect(config).toHaveProperty('enemyLevelMin');
    expect(config).toHaveProperty('enemyLevelMax');
  });
});

// ============================================
// 战斗状态测试
// ============================================
describe('战斗状态', () => {
  it('战斗应该返回正确的状态', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const { result, battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      config
    );
    
    // 检查战斗状态
    expect(battleState).toHaveProperty('playerCurrentHp');
    expect(battleState).toHaveProperty('enemyCurrentHp');
    expect(battleState).toHaveProperty('playerMaxHp');
    expect(battleState).toHaveProperty('enemyMaxHp');
    expect(battleState).toHaveProperty('isOver');
    
    // 检查战斗结果
    expect(result).toHaveProperty('victory');
    expect(result).toHaveProperty('message');
  });

  it('HP不应该为负数', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 1, 灵根: 1, 悟性: 1, 幸运: 1, 意志: 1 },
      maxHp: 10,
      currentHp: 10,
    });
    const config = createTestDungeonConfig({
      difficulty: 100,
      enemyLevelMin: 100,
      enemyLevelMax: 100,
    });
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      '超强Boss',
      100,
      config
    );
    
    expect(battleState.playerCurrentHp).toBeGreaterThanOrEqual(0);
  });

  it('HP不应该超过maxHp', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      maxHp: 100,
      currentHp: 100,
    });
    const config = createTestDungeonConfig({
      difficulty: 1,
    });
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '弱小敌人',
      1,
      config
    );
    
    expect(battleState.playerCurrentHp).toBeLessThanOrEqual(battleState.playerMaxHp);
  });
});

// ============================================
// 秘境状态测试
// ============================================
describe('秘境状态', () => {
  it('应该能生成秘境网格', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    expect(grid).toBeDefined();
    expect(Array.isArray(grid)).toBe(true);
    expect(grid.length).toBe(config.rows);
  });

  it('格子应该有正确的属性', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    grid.forEach(row => {
      row.forEach(cell => {
        expect(cell).toHaveProperty('type');
        expect(cell).toHaveProperty('cleared');
        expect(cell).toHaveProperty('visited');
        expect(typeof cell.cleared).toBe('boolean');
        expect(typeof cell.visited).toBe('boolean');
      });
    });
  });

  it('起点应该已访问', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    // 第一行中间应该已访问
    const startCol = Math.floor(config.cols / 2);
    expect(grid[0][startCol].visited).toBe(true);
  });
});

// ============================================
// 经验值管理测试
// ============================================
describe('经验值管理', () => {
  it('战斗胜利应该获得经验值', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 200, 灵根: 200, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    const config = createTestDungeonConfig();
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      config
    );
    
    expect(result.victory).toBe(true);
    expect(result.rewards?.experience).toBeDefined();
    expect(result.rewards!.experience!).toBeGreaterThan(0);
  });

  it('Boss应该给予更多经验', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 500, 灵根: 500, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 1000,
      currentHp: 1000,
    });
    const config = createTestDungeonConfig();
    
    const enemyResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '普通敌人',
      10,
      config
    );
    
    const bossResult = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      'Boss',
      10,
      config
    );
    
    expect(enemyResult.result.victory).toBe(true);
    expect(bossResult.result.victory).toBe(true);
    
    if (enemyResult.result.rewards?.experience && bossResult.result.rewards?.experience) {
      expect(bossResult.result.rewards.experience).toBeGreaterThanOrEqual(
        enemyResult.result.rewards.experience
      );
    }
  });
});
