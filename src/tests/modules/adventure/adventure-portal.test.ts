/**
 * @vitest-environment jsdom
 * 
 * 传送门系统测试
 * 
 * 测试覆盖：
 * - 传送门生成逻辑（成对出现）
 * - 传送门目标位置
 * - 传送门移动逻辑
 */
import { describe, it, expect } from 'vitest';

import { createTestDungeonConfig, createTestCell } from './test-helpers';

// ============================================
// 传送门生成测试
// ============================================
describe('传送门生成', () => {
  it('传送门应该成对出现', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 3,
    });
    
    // 多次测试确保稳定性
    for (let i = 0; i < 5; i++) {
      const grid = generateAdventureGrid(config);
      
      // 统计传送门数量
      let portalCount = 0;
      const portalPositions: { row: number; col: number }[] = [];
      
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c].type === 'portal') {
            portalCount++;
            portalPositions.push({ row: r, col: c });
          }
        }
      }
      
      // 传送门数量应该是偶数
      expect(portalCount % 2).toBe(0);
    }
  });

  it('每个传送门应该有配对目标', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 检查每个传送门都有portalTarget
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell.type === 'portal') {
          expect(cell.portalTarget).toBeDefined();
          expect(typeof cell.portalTarget?.row).toBe('number');
          expect(typeof cell.portalTarget?.col).toBe('number');
          
          // 目标位置应该是有效的
          const target = cell.portalTarget!;
          expect(target.row).toBeGreaterThanOrEqual(0);
          expect(target.row).toBeLessThan(grid.length);
          expect(target.col).toBeGreaterThanOrEqual(0);
          expect(target.col).toBeLessThan(grid[0].length);
        }
      }
    }
  });

  it('小地图不应该生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 5,
      cols: 5,
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 5x5地图不应该有传送门
    let portalCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') {
          portalCount++;
        }
      }
    }
    
    expect(portalCount).toBe(0);
  });

  it('大地图(81格以上)应该生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 10,
      cols: 10, // 100格 > 81格
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 大地图应该有传送门
    let portalCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') {
          portalCount++;
        }
      }
    }
    
    expect(portalCount).toBeGreaterThanOrEqual(2);
  });
});

// ============================================
// 传送门移动逻辑测试
// ============================================
describe('传送门移动逻辑', () => {
  it('传送门应该传送到配对位置而不是退出机缘', async () => {
    // 这个测试验证传送门的portalTarget属性存在
    // 实际的移动逻辑在useGameState.tsx和useGameAdventure.ts中
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 12,
      cols: 12,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 找到所有传送门
    const portals: { row: number; col: number; target?: { row: number; col: number } }[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c].type === 'portal') {
          portals.push({ row: r, col: c, target: grid[r][c].portalTarget });
        }
      }
    }
    
    // 如果有传送门，验证它们都有目标
    if (portals.length > 0) {
      for (const portal of portals) {
        expect(portal.target).toBeDefined();
        // 目标位置应该指向另一个传送门
        const targetCell = grid[portal.target!.row][portal.target!.col];
        expect(targetCell.type).toBe('portal');
      }
    }
  });

  it('传送门应该是双向的', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 找到传送门对
    const visited = new Set<string>();
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell.type === 'portal' && cell.portalTarget) {
          const key = `${r},${c}`;
          if (visited.has(key)) continue;
          
          const targetKey = `${cell.portalTarget.row},${cell.portalTarget.col}`;
          const targetCell = grid[cell.portalTarget.row][cell.portalTarget.col];
          
          // 目标也应该是一个传送门
          expect(targetCell.type).toBe('portal');
          
          // 目标传送门应该指回当前传送门
          expect(targetCell.portalTarget).toBeDefined();
          expect(targetCell.portalTarget?.row).toBe(r);
          expect(targetCell.portalTarget?.col).toBe(c);
          
          visited.add(key);
          visited.add(targetKey);
        }
      }
    }
  });
});

// ============================================
// 传送门不在第一行和最后一行测试
// ============================================
describe('传送门位置限制', () => {
  it('传送门不应该出现在第一行', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 12,
      cols: 12,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 检查第一行没有传送门
    for (let c = 0; c < grid[0].length; c++) {
      expect(grid[0][c].type).not.toBe('portal');
    }
  });

  it('传送门不应该出现在最后一行', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = createTestDungeonConfig({
      rows: 12,
      cols: 12,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    const lastRow = grid.length - 1;
    
    // 检查最后一行没有传送门
    for (let c = 0; c < grid[lastRow].length; c++) {
      expect(grid[lastRow][c].type).not.toBe('portal');
    }
  });
});
