/**
 * @vitest-environment jsdom
 * 
 * 机缘系统边界条件和异常处理测试
 * 
 * 测试覆盖：
 * - 极端输入处理
 * - 空值和无效值处理
 * - 数值边界检查
 * - 状态异常恢复
 */
import { describe, it, expect } from 'vitest';

import { createTestDungeonConfig, createTestProtagonist } from './test-helpers';

// ============================================
// 地图生成边界测试
// ============================================
describe('地图生成边界条件', () => {
  it('最小地图尺寸应该能生成', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 3,
      cols: 3,
      portalCount: 0,
    });
    
    const grid = generateAdventureGrid(config);
    
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(3);
    
    // 应该有Boss
    let hasBoss = false;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'boss') hasBoss = true;
      });
    });
    expect(hasBoss).toBe(true);
  });

  it('大地图应该能正确生成', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 20,
      cols: 20,
      difficulty: 50,
      enemyLevelMin: 40,
      enemyLevelMax: 60,
      rewardMultiplier: 2,
      portalCount: 3,
    });
    
    const grid = generateAdventureGrid(config);
    
    expect(grid.length).toBe(20);
    expect(grid[0].length).toBe(20);
    
    // 统计格子类型
    const cellTypes: Record<string, number> = {};
    for (const row of grid) {
      for (const cell of row) {
        cellTypes[cell.type] = (cellTypes[cell.type] || 0) + 1;
      }
    }
    
    // 应该有Boss
    expect(cellTypes['boss']).toBeGreaterThan(0);
  });

  it('极高难度应该能处理', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      difficulty: 999,
      enemyLevelMin: 900,
      enemyLevelMax: 999,
    });
    
    const grid = generateAdventureGrid(config);
    
    expect(grid).toBeDefined();
    expect(grid.length).toBeGreaterThan(0);
  });
});

// ============================================
// 战斗系统边界测试
// ============================================
describe('战斗系统边界条件', () => {
  it('低属性角色应该能战斗', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 5, 灵根: 5, 悟性: 5, 幸运: 5, 意志: 5 },
      maxHp: 10,
      currentHp: 10,
    });
    const config = createTestDungeonConfig({
      difficulty: 1,
      enemyLevelMin: 1,
      enemyLevelMax: 1,
    });
    
    const { result, battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      1,
      config
    );
    
    // 战斗应该完成，不崩溃
    expect(result).toBeDefined();
    expect(battleState.playerCurrentHp).toBeGreaterThanOrEqual(0);
  });

  it('超高属性角色应该能战斗', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 99999, 灵根: 99999, 悟性: 99999, 幸运: 99999, 意志: 99999 },
      maxHp: 99999,
      currentHp: 99999,
    });
    const config = createTestDungeonConfig();
    
    const { result, battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      'Boss',
      99,
      config
    );
    
    // 应该胜利
    expect(result.victory).toBe(true);
    // HP不应该超过maxHp
    expect(battleState.playerCurrentHp).toBeLessThanOrEqual(99999);
  });

  it('相同等级对战应该有合理结果', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      level: 50,
    });
    const config = createTestDungeonConfig({
      enemyLevelMin: 50,
      enemyLevelMax: 50,
    });
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      50,
      config
    );
    
    // 应该能正常完成战斗
    expect(result).toBeDefined();
    expect(result).toHaveProperty('victory');
  });
});

// ============================================
// HP边界测试
// ============================================
describe('HP边界条件', () => {
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
    
    // HP不应该为负数
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
    
    // HP不应该超过maxHp
    expect(battleState.playerCurrentHp).toBeLessThanOrEqual(100);
  });
});

// ============================================
// 相邻格子边界测试
// ============================================
describe('相邻格子边界条件', () => {
  it('单格地图应该返回空数组', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const grid = [[{ type: 'empty' as const, cleared: false, visited: false }]];
    
    const adjacent = getAdjacentCells(grid, { row: 0, col: 0 });
    
    expect(adjacent.length).toBe(0);
  });

  it('角落位置应该有正确的相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const grid = [
      [{ type: 'empty' as const, cleared: false, visited: true }, 
       { type: 'empty' as const, cleared: false, visited: false }],
      [{ type: 'empty' as const, cleared: false, visited: false }, 
       { type: 'empty' as const, cleared: false, visited: false }],
    ];
    
    // 左上角
    const topLeft = getAdjacentCells(grid, { row: 0, col: 0 });
    expect(topLeft.length).toBe(2);
    
    // 右下角
    const bottomRight = getAdjacentCells(grid, { row: 1, col: 1 });
    expect(bottomRight.length).toBe(2);
  });

  it('边缘位置应该有正确的相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const grid = [
      [{ type: 'empty' as const, cleared: false, visited: false }, 
       { type: 'empty' as const, cleared: false, visited: true }, 
       { type: 'empty' as const, cleared: false, visited: false }],
      [{ type: 'empty' as const, cleared: false, visited: false }, 
       { type: 'empty' as const, cleared: false, visited: false }, 
       { type: 'empty' as const, cleared: false, visited: false }],
      [{ type: 'empty' as const, cleared: false, visited: false }, 
       { type: 'empty' as const, cleared: false, visited: false }, 
       { type: 'empty' as const, cleared: false, visited: false }],
    ];
    
    // 上边缘中间
    const topEdge = getAdjacentCells(grid, { row: 0, col: 1 });
    expect(topEdge.length).toBe(3);
    
    // 下边缘中间
    const bottomEdge = getAdjacentCells(grid, { row: 2, col: 1 });
    expect(bottomEdge.length).toBe(3);
  });
});

// ============================================
// 世界观边界测试
// ============================================
describe('世界观边界条件', () => {
  it('所有支持的世界观应该能工作', async () => {
    const { getDungeonNames, getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    const worlds: Array<'修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世'> = 
      ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
    
    for (const world of worlds) {
      // 应该能获取秘境名称
      const name = getDungeonNames(world);
      expect(name).toBeDefined();
      expect(name).toHaveProperty('name');
      
      // 应该能获取难度列表
      const difficulties = getAvailableDifficulties(10, world);
      expect(difficulties.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// 配置边界测试
// ============================================
describe('配置边界条件', () => {
  it('高奖励倍率应该能正常工作', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 200, 灵根: 200, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    const config = createTestDungeonConfig({
      rewardMultiplier: 10,
    });
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      config
    );
    
    expect(result.victory).toBe(true);
    expect(result.rewards?.experience).toBeGreaterThan(0);
  });

  it('敌人等级范围应该被正确处理', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig({
      enemyLevelMin: 50,
      enemyLevelMax: 100,
    });
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      75,
      config
    );
    
    // 敌人应该有合理的属性
    expect(battleState.enemyMaxHp).toBeGreaterThan(0);
    expect(battleState.enemyAttack).toBeGreaterThan(0);
  });
});
