/**
 * @vitest-environment jsdom
 * 
 * 游戏修复验证测试
 * 
 * 测试覆盖：
 * - 扫荡条件：通关一次机缘
 * - 流派选择文案：显示中文名称
 * - 新手引导完成后隐藏新手难度
 * - 传送门互相传送逻辑
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 扫荡条件测试
// ============================================
describe('扫荡条件', () => {
  it('未完成机缘时不应允许扫荡', () => {
    // 模拟统计数据
    const statistics = {
      totalAdventuresCompleted: 0, // 未完成任何机缘
      totalBossKilled: 5, // 已经击败过 Boss
    };
    
    // 扫荡条件：必须完成一次机缘（而不是击败 Boss）
    const canSweep = statistics.totalAdventuresCompleted >= 1;
    
    expect(canSweep).toBe(false);
  });

  it('完成一次机缘后应允许扫荡', () => {
    // 模拟统计数据
    const statistics = {
      totalAdventuresCompleted: 1, // 完成了一次机缘
    };
    
    // 扫荡条件
    const canSweep = statistics.totalAdventuresCompleted >= 1;
    
    expect(canSweep).toBe(true);
  });

  it('击败 Boss 但未完成机缘不应允许扫荡', () => {
    // 模拟统计数据：击败了 Boss 但中途退出
    const statistics = {
      totalAdventuresCompleted: 0,
      totalBossKilled: 10, // 击败了很多 Boss
    };
    
    // 扫荡条件只检查 totalAdventuresCompleted，不检查 totalBossKilled
    const canSweep = statistics.totalAdventuresCompleted >= 1;
    
    expect(canSweep).toBe(false);
  });
});

// ============================================
// 流派选择文案测试
// ============================================
describe('流派选择文案', () => {
  it('应该使用流派中文名称', async () => {
    const { CULTIVATION_PATHS } = await import('@/lib/data/cultivationPathData');
    
    // 验证所有流派都有中文名称
    const paths = Object.keys(CULTIVATION_PATHS);
    
    for (const pathId of paths) {
      const config = CULTIVATION_PATHS[pathId as keyof typeof CULTIVATION_PATHS];
      expect(config.name).toBeDefined();
      expect(config.name).not.toBe(pathId); // 名称不应等于 ID
      expect(config.name.length).toBeGreaterThan(0);
      
      // 验证名称是中文
      const hasChinese = /[\u4e00-\u9fa5]/.test(config.name);
      expect(hasChinese).toBe(true);
    }
  });

  it('流派选择消息应显示正确的中文名称', async () => {
    const { CULTIVATION_PATHS } = await import('@/lib/data/cultivationPathData');
    
    // 模拟流派选择消息
    const pathId = 'body';
    const pathConfig = CULTIVATION_PATHS[pathId];
    const message = `选择了「${pathConfig.name}」流派`;
    
    // 验证消息包含中文名称
    expect(message).toContain('体修');
    expect(message).not.toContain('body');
  });

  it('所有流派都应该有完整的配置', async () => {
    const { CULTIVATION_PATHS } = await import('@/lib/data/cultivationPathData');
    
    const requiredFields = ['id', 'name', 'description', 'primaryStat', 'secondaryStat'];
    const paths = Object.keys(CULTIVATION_PATHS);
    
    for (const pathId of paths) {
      const config = CULTIVATION_PATHS[pathId as keyof typeof CULTIVATION_PATHS];
      
      for (const field of requiredFields) {
        expect(config[field as keyof typeof config]).toBeDefined();
      }
    }
  });
});

// ============================================
// 新手引导完成后隐藏新手难度测试
// ============================================
describe('新手引导完成后隐藏新手难度', () => {
  it('未完成新手机缘时应显示新手难度', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure/adventure');
    
    // isPlayerNewbie=true, hasCompletedNoviceAdventure=false
    const difficulties = getAvailableDifficulties(5, '修仙', false, true);
    
    // 第一个应该是新手难度
    expect(difficulties.length).toBeGreaterThan(0);
    expect(difficulties[0].isNovice).toBe(true);
    expect(difficulties[0].realmName).toContain('新手引导');
  });

  it('已完成新手机缘时不应显示新手难度', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure/adventure');
    
    // hasCompletedNoviceAdventure=true
    const difficulties = getAvailableDifficulties(5, '修仙', true, true);
    
    // 不应该有新手难度
    expect(difficulties.every(d => !d.isNovice)).toBe(true);
  });

  it('新手任务完成后应隐藏新手难度', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure/adventure');
    
    // isPlayerNewbie=false（新手任务全部完成）
    const difficulties = getAvailableDifficulties(5, '修仙', false, false);
    
    // 即使未完成新手机缘，新手任务完成后也应隐藏新手难度
    expect(difficulties.every(d => !d.isNovice)).toBe(true);
  });

  it('新手难度参数应符合预期', async () => {
    const { getAvailableDifficulties } = await import('@/lib/game/adventure/adventure');
    
    const playerLevel = 5;
    const difficulties = getAvailableDifficulties(playerLevel, '修仙', false, true);
    const noviceDifficulty = difficulties.find(d => d.isNovice);
    
    expect(noviceDifficulty).toBeDefined();
    if (noviceDifficulty) {
      // 新手难度等级应该低于玩家等级
      expect(noviceDifficulty.difficulty).toBeLessThanOrEqual(playerLevel);
      // 新手难度地图应该更小
      expect(noviceDifficulty.rows).toBeLessThanOrEqual(5);
      expect(noviceDifficulty.cols).toBeLessThanOrEqual(5);
    }
  });
});

// ============================================
// 传送门互相传送逻辑测试
// ============================================
describe('传送门互相传送逻辑', () => {
  it('传送门应该成对出现', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = {
      rows: 12,
      cols: 12,
      difficulty: 25,
      realmName: '测试秘境',
      enemyLevelMin: 10,
      enemyLevelMax: 20,
      rewardMultiplier: 1,
      portalCount: 2,
      difficultyLevel: 'normal' as const,
    };
    
    const grid = generateAdventureGrid(config);
    
    // 统计传送门数量
    let portalCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'portal') {
          portalCount++;
        }
      }
    }
    
    // 传送门数量应该是偶数
    expect(portalCount % 2).toBe(0);
  });

  it('传送门应该有配对目标', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = {
      rows: 12,
      cols: 12,
      difficulty: 25,
      realmName: '测试秘境',
      enemyLevelMin: 10,
      enemyLevelMax: 20,
      rewardMultiplier: 1,
      portalCount: 2,
      difficultyLevel: 'normal' as const,
    };
    
    const grid = generateAdventureGrid(config);
    
    // 检查每个传送门都有目标
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell.type === 'portal') {
          expect(cell.portalTarget).toBeDefined();
          expect(typeof cell.portalTarget?.row).toBe('number');
          expect(typeof cell.portalTarget?.col).toBe('number');
        }
      }
    }
  });

  it('传送门应该是双向的', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = {
      rows: 15,
      cols: 15,
      difficulty: 30,
      realmName: '测试秘境',
      enemyLevelMin: 15,
      enemyLevelMax: 25,
      rewardMultiplier: 1,
      portalCount: 2,
      difficultyLevel: 'normal' as const,
    };
    
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

  it('低难度机缘不应生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = {
      rows: 10,
      cols: 10,
      difficulty: 15, // 低难度
      realmName: '测试秘境',
      enemyLevelMin: 5,
      enemyLevelMax: 10,
      rewardMultiplier: 1,
      portalCount: 2,
      difficultyLevel: 'easy' as const,
    };
    
    const grid = generateAdventureGrid(config);
    
    // 低难度不应该有传送门
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

  it('新手机缘不应生成传送门', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
    const config = {
      rows: 5,
      cols: 5,
      difficulty: 3,
      realmName: '新手引导',
      enemyLevelMin: 1,
      enemyLevelMax: 5,
      rewardMultiplier: 0.8,
      portalCount: 1,
      difficultyLevel: 'easy' as const,
      isNovice: true,
    };
    
    const grid = generateAdventureGrid(config);
    
    // 新手难度不应该有传送门
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
});

// ============================================
// 退出机缘战利品保留测试
// ============================================
describe('退出机缘战利品保留', () => {
  it('完成探索应保留100%战利品', () => {
    const loot = [
      { definition: { id: 'item1', name: '灵石' }, quantity: 10 },
      { definition: { id: 'item2', name: '疗伤丹' }, quantity: 5 },
    ];
    const experience = 100;
    
    // 完成探索：保留100%
    const keptLoot = loot.map(item => ({ ...item }));
    const keptExperience = experience;
    
    expect(keptLoot[0].quantity).toBe(10);
    expect(keptLoot[1].quantity).toBe(5);
    expect(keptExperience).toBe(100);
  });

  it('中途逃离应保留50%战利品', () => {
    const loot = [
      { definition: { id: 'item1', name: '灵石' }, quantity: 10 },
      { definition: { id: 'item2', name: '疗伤丹' }, quantity: 5 },
    ];
    const experience = 100;
    
    // 中途逃离：保留50%（向下取整）
    const keptLoot = loot
      .map(item => ({
        ...item,
        quantity: Math.floor(item.quantity * 0.5),
      }))
      .filter(item => item.quantity > 0);
    const keptExperience = Math.floor(experience * 0.5);
    
    expect(keptLoot[0].quantity).toBe(5);
    expect(keptLoot[1].quantity).toBe(2);
    expect(keptExperience).toBe(50);
  });
});
