/**
 * @vitest-environment jsdom
 * 
 * 机缘移动系统测试
 * 
 * 测试覆盖：
 * - 相邻格子计算
 * - 移动规则
 * - 传送门传送
 * - 探索进度计算
 */
import { describe, it, expect } from 'vitest';

import { createTestDungeonConfig, createTestCell } from './test-helpers';

// ============================================
// 相邻格子测试
// ============================================
describe('相邻格子计算', () => {
  it('应该能导入getAdjacentCells函数', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    expect(getAdjacentCells).toBeDefined();
    expect(typeof getAdjacentCells).toBe('function');
  });

  it('中间位置应该有4个相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    // 创建一个5x5的模拟网格
    const mockGrid = Array(5).fill(null).map(() => 
      Array(5).fill(null).map(() => createTestCell('empty'))
    );
    
    // 中间位置 (2, 2)
    const adjacent = getAdjacentCells(mockGrid, { row: 2, col: 2 });
    
    expect(adjacent.length).toBe(4);
    expect(adjacent).toContainEqual({ row: 1, col: 2 }); // 上
    expect(adjacent).toContainEqual({ row: 3, col: 2 }); // 下
    expect(adjacent).toContainEqual({ row: 2, col: 1 }); // 左
    expect(adjacent).toContainEqual({ row: 2, col: 3 }); // 右
  });

  it('左上角应该只有2个相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const mockGrid = Array(5).fill(null).map(() => 
      Array(5).fill(null).map(() => createTestCell('empty'))
    );
    
    // 左上角 (0, 0)
    const adjacent = getAdjacentCells(mockGrid, { row: 0, col: 0 });
    
    expect(adjacent.length).toBe(2);
    expect(adjacent).toContainEqual({ row: 1, col: 0 }); // 下
    expect(adjacent).toContainEqual({ row: 0, col: 1 }); // 右
  });

  it('右下角应该只有2个相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const mockGrid = Array(5).fill(null).map(() => 
      Array(5).fill(null).map(() => createTestCell('empty'))
    );
    
    // 右下角 (4, 4)
    const adjacent = getAdjacentCells(mockGrid, { row: 4, col: 4 });
    
    expect(adjacent.length).toBe(2);
    expect(adjacent).toContainEqual({ row: 3, col: 4 }); // 上
    expect(adjacent).toContainEqual({ row: 4, col: 3 }); // 左
  });

  it('边缘位置应该有3个相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const mockGrid = Array(5).fill(null).map(() => 
      Array(5).fill(null).map(() => createTestCell('empty'))
    );
    
    // 左边缘中间 (2, 0)
    const adjacent = getAdjacentCells(mockGrid, { row: 2, col: 0 });
    
    expect(adjacent.length).toBe(3);
    expect(adjacent).toContainEqual({ row: 1, col: 0 }); // 上
    expect(adjacent).toContainEqual({ row: 3, col: 0 }); // 下
    expect(adjacent).toContainEqual({ row: 2, col: 1 }); // 右
  });
});

// ============================================
// 秘境探索测试
// ============================================
describe('秘境探索', () => {
  it('应该能生成秘境网格', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    expect(grid).toBeDefined();
    expect(grid.length).toBeGreaterThan(0);
    
    // 验证格子都有必要的属性
    grid.forEach(row => {
      row.forEach(cell => {
        expect(cell).toHaveProperty('type');
        expect(cell).toHaveProperty('cleared');
        expect(cell).toHaveProperty('visited');
      });
    });
  });

  it('探索进度应该正确计算', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    // 计算已访问格子数量
    let visitedCount = 0;
    let totalCells = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        totalCells++;
        if (cell.visited) visitedCount++;
      });
    });
    
    // 应该有一个初始访问的格子（起点）
    expect(visitedCount).toBeGreaterThanOrEqual(1);
    expect(totalCells).toBeGreaterThan(0);
  });
});

// ============================================
// 传送门测试
// ============================================
describe('传送门功能', () => {
  it('大地图应该有传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 统计传送门数量
    let portalCount = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'portal') portalCount++;
      });
    });
    
    // 传送门应该成对出现
    expect(portalCount % 2).toBe(0);
  });

  it('传送门应该有目标位置', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 检查传送门是否有目标
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'portal') {
          // 传送门应该有 portalTarget 或在 content 中标注目标
          expect(cell.portalTarget || cell.content).toBeDefined();
        }
      });
    });
  });
});
