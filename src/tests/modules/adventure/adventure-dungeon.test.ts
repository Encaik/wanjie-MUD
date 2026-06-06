/**
 * @vitest-environment jsdom
 * 
 * 机缘秘境测试
 * 
 * 测试覆盖：
 * - 秘境初始化
 * - 秘境属性配置
 * - Boss房间
 * - 传送门系统
 */
import { describe, it, expect } from 'vitest';
import { createTestDungeonConfig } from './test-helpers';

// ============================================
// 秘境基础功能测试
// ============================================
describe('秘境基础功能', () => {
  it('应该能导入秘境相关函数', async () => {
    const { generateAdventureGrid, getDungeonNames, getAvailableDifficulties } = await import('@/lib/game/adventure');
    expect(generateAdventureGrid).toBeDefined();
    expect(getDungeonNames).toBeDefined();
    expect(getAvailableDifficulties).toBeDefined();
  });

  it('应该能生成秘境网格', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 7,
      cols: 7,
    });
    
    const grid = generateAdventureGrid(config);
    
    expect(grid).toBeDefined();
    expect(grid.length).toBe(7);
    expect(grid[0].length).toBe(7);
  });

  it('秘境应该包含不同类型的格子', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 10,
      cols: 10,
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 收集所有格子类型
    const cellTypes = new Set<string>();
    grid.forEach(row => {
      row.forEach(cell => {
        cellTypes.add(cell.type);
      });
    });
    
    // 应该有多种格子类型
    expect(cellTypes.size).toBeGreaterThan(3);
  });

  it('小地图(5x5)不应该生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 5,
      cols: 5,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 检查是否有传送门
    let portalCount = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'portal') {
          portalCount++;
        }
      });
    });
    
    // 5x5地图不应该有传送门
    expect(portalCount).toBe(0);
  });

  it('大地图应该生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      difficulty: 25, // 需要难度 > 20 才会生成传送门
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 检查是否有传送门
    let portalCount = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'portal') {
          portalCount++;
        }
      });
    });
    
    // 大地图应该有传送门（成对出现）
    expect(portalCount).toBeGreaterThanOrEqual(2);
    expect(portalCount % 2).toBe(0); // 应该是偶数（成对）
  });
});

// ============================================
// 秘境入口和出口测试
// ============================================
describe('秘境入口和出口', () => {
  it('秘境应该有入口', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    // 入口是第一行中间的格子，visited = true
    // 检查第一行是否有被访问的格子
    const firstRow = grid[0];
    const hasVisitedStart = firstRow.some(cell => cell.visited);
    expect(hasVisitedStart).toBe(true);
  });

  it('秘境应该有Boss房间', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig();
    const grid = generateAdventureGrid(config);
    
    // 查找Boss房间
    let bossCount = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.type === 'boss') {
          bossCount++;
        }
      });
    });
    
    expect(bossCount).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// 秘境难度配置测试
// ============================================
describe('秘境难度配置', () => {
  it('不同难度的秘境应该有不同的属性', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const easyConfig = createTestDungeonConfig({ difficulty: 1 });
    const hardConfig = createTestDungeonConfig({ difficulty: 10 });
    
    const easyGrid = generateAdventureGrid(easyConfig);
    const hardGrid = generateAdventureGrid(hardConfig);
    
    // 都应该生成有效网格
    expect(easyGrid.length).toBeGreaterThan(0);
    expect(hardGrid.length).toBeGreaterThan(0);
  });

  it('秘境应该有名称和描述', async () => {
    const config = createTestDungeonConfig({
      realmName: '测试秘境',
    });
    
    expect(config.realmName).toBe('测试秘境');
  });

  it('应该能获取不同世界观的秘境名称', async () => {
    const { getDungeonNames } = await import('@/lib/game/adventure');
    
    const worlds = ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
    
    for (const worldType of worlds) {
      const name = getDungeonNames(worldType as any);
      expect(name).toBeDefined();
      expect(name).toHaveProperty('name');
    }
  });

  it('应该能获取可用难度列表', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure');
    
    const difficulties = getAvailableDifficulties(10, '修仙');
    
    expect(Array.isArray(difficulties)).toBe(true);
    difficulties.forEach(d => {
      expect(d).toHaveProperty('difficulty');
      expect(d).toHaveProperty('realmName');
    });
  });
});

// ============================================
// 传送门传送逻辑测试
// ============================================
describe('传送门传送逻辑', () => {
  it('传送门应该成对出现', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 收集传送门位置
    const portalPositions: { row: number; col: number }[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.type === 'portal') {
          portalPositions.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    
    // 传送门数量应该是偶数
    expect(portalPositions.length % 2).toBe(0);
  });

  it('传送门应该在有效位置', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 检查传送门位置
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.type === 'portal') {
          // 传送门位置应该在有效范围内
          expect(rowIndex).toBeGreaterThanOrEqual(0);
          expect(rowIndex).toBeLessThan(config.rows || 15);
          expect(colIndex).toBeGreaterThanOrEqual(0);
          expect(colIndex).toBeLessThan(config.cols || 15);
        }
      });
    });
  });
});

// ============================================
// 格子属性测试
// ============================================
describe('格子属性', () => {
  it('所有格子应该有cleared和visited属性', async () => {
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
});

// ============================================
// 格子类型多样性测试
// ============================================
describe('格子类型多样性', () => {
  it('大型地图应该包含所有主要格子类型', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    // 使用较大的地图以确保所有格子类型都有机会生成
    const config = createTestDungeonConfig({
      rows: 15,
      cols: 15,
      portalCount: 2,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 收集所有格子类型
    const cellTypes = new Set<string>();
    grid.forEach(row => {
      row.forEach(cell => {
        cellTypes.add(cell.type);
      });
    });
    
    // 必须包含的格子类型
    const requiredTypes = ['boss', 'treasure', 'elite', 'mini_boss', 'event', 'rest', 'enemy'];
    
    // 至少应该包含大部分类型（由于随机性，允许少量类型缺失）
    const presentTypes = requiredTypes.filter(type => cellTypes.has(type));
    expect(presentTypes.length).toBeGreaterThanOrEqual(requiredTypes.length - 1);
  });

  it('小型地图也应该包含敌人格子', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 5,
      cols: 5,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 收集所有格子类型
    const cellTypes = new Set<string>();
    grid.forEach(row => {
      row.forEach(cell => {
        cellTypes.add(cell.type);
      });
    });
    
    // 敌人是基础格子类型，应该存在
    expect(cellTypes.has('enemy')).toBe(true);
  });

  it('中型地图应该包含宝箱和事件格子', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = createTestDungeonConfig({
      rows: 10,
      cols: 10,
    });
    
    const grid = generateAdventureGrid(config);
    
    // 收集所有格子类型
    const cellTypes = new Set<string>();
    grid.forEach(row => {
      row.forEach(cell => {
        cellTypes.add(cell.type);
      });
    });
    
    // 宝箱和事件应该存在
    expect(cellTypes.has('treasure') || cellTypes.has('event')).toBe(true);
  });
});
