/**
 * @vitest-environment jsdom
 * 
 * 机缘地图生成测试
 * 
 * 测试覆盖：
 * - 地图尺寸和边界
 * - 格子类型分布
 * - 起点和Boss位置
 * - 传送门生成规则
 * - 格子最小数量保证
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 地图基础结构测试
// ============================================
describe('地图基础结构', () => {
  it('应该能导入地图生成函数', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    expect(generateAdventureGrid).toBeDefined();
    expect(typeof generateAdventureGrid).toBe('function');
  });

  it('生成的地图应该有正确的尺寸', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 7,
      cols: 7,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 1,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(config, '修仙');
    
    expect(grid.length).toBe(7); // 7行
    expect(grid[0].length).toBe(7); // 7列
  });

  it('生成的地图应该有正确的格子结构', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(config, '修仙');
    
    // 检查每个格子都有必要的属性
    for (const row of grid) {
      for (const cell of row) {
        expect(cell).toHaveProperty('type');
        expect(cell).toHaveProperty('cleared');
        expect(cell).toHaveProperty('visited');
        expect(cell).toHaveProperty('content');
      }
    }
  });

  it('第一行应该都是空格（起点区域）', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(config, '修仙');
    
    // 第一行所有格子都应该是空格
    for (const cell of grid[0]) {
      expect(cell.type).toBe('empty');
    }
  });

  it('Boss应该在最后一行中间位置', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(config, '修仙');
    const lastRow = grid.length - 1;
    const bossCol = Math.floor(grid[0].length / 2);
    
    expect(grid[lastRow][bossCol].type).toBe('boss');
  });

  it('起点应该被标记为已访问', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(config, '修仙');
    const startCol = Math.floor(grid[0].length / 2);
    
    expect(grid[0][startCol].visited).toBe(true);
  });
});

// ============================================
// 格子类型分布测试
// ============================================
describe('格子类型分布', () => {
  it('应该保证宝箱格至少有1个', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    // 多次生成确保稳定性
    for (let i = 0; i < 10; i++) {
      const grid = generateAdventureGrid(config, '修仙');
      let treasureCount = 0;
      
      for (const row of grid) {
        for (const cell of row) {
          if (cell.type === 'treasure') treasureCount++;
        }
      }
      
      expect(treasureCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('应该保证事件格至少有1个', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    for (let i = 0; i < 10; i++) {
      const grid = generateAdventureGrid(config, '修仙');
      let eventCount = 0;
      
      for (const row of grid) {
        for (const cell of row) {
          if (cell.type === 'event') eventCount++;
        }
      }
      
      expect(eventCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('应该保证休息格至少有1个', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    for (let i = 0; i < 10; i++) {
      const grid = generateAdventureGrid(config, '修仙');
      let restCount = 0;
      
      for (const row of grid) {
        for (const cell of row) {
          if (cell.type === 'rest') restCount++;
        }
      }
      
      expect(restCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('应该保证普通敌人至少有2个', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    for (let i = 0; i < 10; i++) {
      const grid = generateAdventureGrid(config, '修仙');
      let enemyCount = 0;
      
      for (const row of grid) {
        for (const cell of row) {
          if (cell.type === 'enemy') enemyCount++;
        }
      }
      
      expect(enemyCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('应该保证小Boss至少有1个', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    for (let i = 0; i < 10; i++) {
      const grid = generateAdventureGrid(config, '修仙');
      let minibossCount = 0;
      
      for (const row of grid) {
        for (const cell of row) {
          if (cell.type === 'miniboss') minibossCount++;
        }
      }
      
      expect(minibossCount).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================
// 传送门测试
// ============================================
describe('传送门生成', () => {
  it('小地图不应该有传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    // 5x5 = 25格，小于81格
    const smallConfig = {
      rows: 5,
      cols: 5,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 2, // 即使配置了传送门
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(smallConfig, '修仙');
    let portalCount = 0;
    
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') portalCount++;
      }
    }
    
    expect(portalCount).toBe(0);
  });

  it('中等地图（7x7=49格）不应该有传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const mediumConfig = {
      rows: 7,
      cols: 7,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 2,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(mediumConfig, '修仙');
    let portalCount = 0;
    
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') portalCount++;
      }
    }
    
    expect(portalCount).toBe(0);
  });

  it('大地图（9x9=81格以上）可以生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    // 10x10 = 100格，大于81格
    const largeConfig = {
      rows: 10,
      cols: 10,
      difficulty: 30,
      realmName: '高级秘境',
      enemyLevelMin: 20,
      enemyLevelMax: 40,
      rewardMultiplier: 1.5,
      portalCount: 2,
      staminaCost: 15,
    };
    
    const grid = generateAdventureGrid(largeConfig, '修仙');
    let portalCount = 0;
    
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') portalCount++;
      }
    }
    
    // 传送门成对出现，所以应该是偶数
    expect(portalCount % 2).toBe(0);
  });

  it('传送门应该成对出现', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const largeConfig = {
      rows: 10,
      cols: 10,
      difficulty: 30,
      realmName: '高级秘境',
      enemyLevelMin: 20,
      enemyLevelMax: 40,
      rewardMultiplier: 1.5,
      portalCount: 3,
      staminaCost: 15,
    };
    
    // 多次生成验证
    for (let i = 0; i < 5; i++) {
      const grid = generateAdventureGrid(largeConfig, '修仙');
      const portals: { row: number; col: number; target?: { row: number; col: number } }[] = [];
      
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c].type === 'portal') {
            portals.push({ row: r, col: c, target: grid[r][c].portalTarget });
          }
        }
      }
      
      // 传送门数量应该是偶数
      expect(portals.length % 2).toBe(0);
      
      // 每个传送门应该有配对目标
      for (const portal of portals) {
        expect(portal.target).toBeDefined();
      }
    }
  });

  it('传送门不应该在第一行或最后一行', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const largeConfig = {
      rows: 10,
      cols: 10,
      difficulty: 30,
      realmName: '高级秘境',
      enemyLevelMin: 20,
      enemyLevelMax: 40,
      rewardMultiplier: 1.5,
      portalCount: 3,
      staminaCost: 15,
    };
    
    const grid = generateAdventureGrid(largeConfig, '修仙');
    const lastRow = grid.length - 1;
    
    // 检查第一行和最后一行没有传送门
    for (let c = 0; c < grid[0].length; c++) {
      expect(grid[0][c].type).not.toBe('portal');
      expect(grid[lastRow][c].type).not.toBe('portal');
    }
  });
});

// ============================================
// 难度影响测试
// ============================================
describe('难度对地图的影响', () => {
  it('高难度应该增加敌人比例', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const easyConfig = {
      rows: 7,
      cols: 7,
      difficulty: 1,
      realmName: '简单秘境',
      enemyLevelMin: 1,
      enemyLevelMax: 5,
      rewardMultiplier: 0.8,
      portalCount: 0,
      staminaCost: 5,
    };
    
    const hardConfig = {
      rows: 7,
      cols: 7,
      difficulty: 50,
      realmName: '困难秘境',
      enemyLevelMin: 40,
      enemyLevelMax: 60,
      rewardMultiplier: 2.0,
      portalCount: 0,
      staminaCost: 20,
    };
    
    let easyEnemyCount = 0;
    let hardEnemyCount = 0;
    
    // 多次生成取平均
    for (let i = 0; i < 10; i++) {
      const easyGrid = generateAdventureGrid(easyConfig, '修仙');
      const hardGrid = generateAdventureGrid(hardConfig, '修仙');
      
      for (const row of easyGrid) {
        for (const cell of row) {
          if (cell.type === 'enemy' || cell.type === 'elite') easyEnemyCount++;
        }
      }
      
      for (const row of hardGrid) {
        for (const cell of row) {
          if (cell.type === 'enemy' || cell.type === 'elite') hardEnemyCount++;
        }
      }
    }
    
    // 高难度应该有更多敌人
    expect(hardEnemyCount).toBeGreaterThan(easyEnemyCount);
  });

  it('高难度应该减少空格比例', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const easyConfig = {
      rows: 7,
      cols: 7,
      difficulty: 1,
      realmName: '简单秘境',
      enemyLevelMin: 1,
      enemyLevelMax: 5,
      rewardMultiplier: 0.8,
      portalCount: 0,
      staminaCost: 5,
    };
    
    const hardConfig = {
      rows: 7,
      cols: 7,
      difficulty: 50,
      realmName: '困难秘境',
      enemyLevelMin: 40,
      enemyLevelMax: 60,
      rewardMultiplier: 2.0,
      portalCount: 0,
      staminaCost: 20,
    };
    
    let easyEmptyCount = 0;
    let hardEmptyCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const easyGrid = generateAdventureGrid(easyConfig, '修仙');
      const hardGrid = generateAdventureGrid(hardConfig, '修仙');
      
      for (const row of easyGrid) {
        for (const cell of row) {
          if (cell.type === 'empty') easyEmptyCount++;
        }
      }
      
      for (const row of hardGrid) {
        for (const cell of row) {
          if (cell.type === 'empty') hardEmptyCount++;
        }
      }
    }
    
    // 高难度应该有更少空格
    expect(hardEmptyCount).toBeLessThan(easyEmptyCount);
  });
});

// ============================================
// 世界观适配测试
// ============================================
describe('世界观适配', () => {
  it('不同世界观应该有不同的敌人名称', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 7,
      cols: 7,
      difficulty: 10,
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 15,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    const xiuxianGrid = generateAdventureGrid(config, '修仙');
    const gaowuGrid = generateAdventureGrid(config, '高武');
    const kejiGrid = generateAdventureGrid(config, '科技');
    
    // 找一个敌人格子的内容
    const findEnemyContent = (grid: typeof xiuxianGrid) => {
      for (const row of grid) {
        for (const cell of row) {
          if (cell.type === 'enemy') return cell.content;
        }
      }
      return '';
    };
    
    // 修仙世界应该有修仙风格的敌人
    const xiuxianEnemy = findEnemyContent(xiuxianGrid);
    expect(xiuxianEnemy).toBeTruthy();
    
    // 其他世界观也应该有对应的敌人
    const gaowuEnemy = findEnemyContent(gaowuGrid);
    expect(gaowuEnemy).toBeTruthy();
    
    const kejiEnemy = findEnemyContent(kejiGrid);
    expect(kejiEnemy).toBeTruthy();
  });

  it('Boss应该在最后一行且有正确的等级', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 20,
      realmName: '测试秘境',
      enemyLevelMin: 15,
      enemyLevelMax: 25,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 10,
    };
    
    const grid = generateAdventureGrid(config, '修仙');
    const lastRow = grid.length - 1;
    const bossCol = Math.floor(grid[0].length / 2);
    const bossCell = grid[lastRow][bossCol];
    
    expect(bossCell.type).toBe('boss');
    expect(bossCell.content).toContain('Boss');
    
    // Boss等级计算：difficulty 20 是中等难度，Boss等级 = enemyLevelMax + 5 = 30
    expect(bossCell.content).toContain('Lv.30');
  });
});

// ============================================
// 边界条件测试
// ============================================
describe('边界条件', () => {
  it('最小地图（5x5）应该正常生成', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const minConfig = {
      rows: 5,
      cols: 5,
      difficulty: 1,
      realmName: '最小秘境',
      enemyLevelMin: 1,
      enemyLevelMax: 5,
      rewardMultiplier: 1,
      portalCount: 0,
      staminaCost: 5,
    };
    
    const grid = generateAdventureGrid(minConfig, '修仙');
    
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    
    // 即使最小地图也应该有必要的元素
    let hasBoss = false;
    let hasEnemy = false;
    
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'boss') hasBoss = true;
        if (cell.type === 'enemy') hasEnemy = true;
      }
    }
    
    expect(hasBoss).toBe(true);
    expect(hasEnemy).toBe(true);
  });

  it('最大地图（30x30）应该正常生成', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure');
    
    const maxConfig = {
      rows: 30,
      cols: 30,
      difficulty: 100,
      realmName: '最大秘境',
      enemyLevelMin: 80,
      enemyLevelMax: 120,
      rewardMultiplier: 3,
      portalCount: 5,
      staminaCost: 30,
    };
    
    const grid = generateAdventureGrid(maxConfig, '修仙');
    
    expect(grid.length).toBe(30);
    expect(grid[0].length).toBe(30);
    
    // 大地图应该有传送门
    let portalCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') portalCount++;
      }
    }
    
    expect(portalCount).toBeGreaterThan(0);
  });
});
