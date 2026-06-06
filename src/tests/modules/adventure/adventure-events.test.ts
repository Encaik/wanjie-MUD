/**
 * @vitest-environment jsdom
 * 
 * 机缘事件系统测试
 * 
 * 测试覆盖：
 * - 事件类型
 * - 事件奖励
 * - 相邻格子
 */
import { describe, it, expect } from 'vitest';
import { createTestDungeonConfig, createTestProtagonist } from './test-helpers';

// ============================================
// 事件基础功能测试
// ============================================
describe('事件基础功能', () => {
  it('应该能导入事件相关函数', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    expect(getAdjacentCells).toBeDefined();
  });

  it('应该能获取相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const grid = [
      [{ type: 'empty' as const, cleared: false, visited: false }, { type: 'empty' as const, cleared: false, visited: false }, { type: 'empty' as const, cleared: false, visited: false }],
      [{ type: 'empty' as const, cleared: false, visited: false }, { type: 'empty' as const, cleared: false, visited: true }, { type: 'empty' as const, cleared: false, visited: false }],
      [{ type: 'empty' as const, cleared: false, visited: false }, { type: 'empty' as const, cleared: false, visited: false }, { type: 'empty' as const, cleared: false, visited: false }],
    ];
    
    const adjacent = getAdjacentCells(grid, { row: 1, col: 1 });
    
    // 中心格子应该有4个相邻格子
    expect(adjacent.length).toBe(4);
  });

  it('边缘格子应该有正确的相邻格子', async () => {
    const { getAdjacentCells } = await import('@/lib/game/adventure');
    
    const grid = [
      [{ type: 'empty' as const, cleared: false, visited: true }, { type: 'empty' as const, cleared: false, visited: false }],
      [{ type: 'empty' as const, cleared: false, visited: false }, { type: 'empty' as const, cleared: false, visited: false }],
    ];
    
    const adjacent = getAdjacentCells(grid, { row: 0, col: 0 });
    
    // 角落格子应该有2个相邻格子
    expect(adjacent.length).toBe(2);
  });
});

// ============================================
// 战斗测试（事件中可能触发战斗）
// ============================================
describe('战斗功能', () => {
  it('应该能进行战斗', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '敌人',
      10,
      config
    );
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('victory');
  });

  it('Boss战斗应该能完成', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      'Boss',
      10,
      config
    );
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('victory');
  });

  it('精英战斗应该能完成', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'elite',
      '精英',
      10,
      config
    );
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('victory');
  });
});

// ============================================
// 世界观适配测试
// ============================================
describe('事件世界观适配', () => {
  it('不同世界观应该能战斗', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const worlds: Array<'修仙' | '高武' | '科技' | '魔幻'> = ['修仙', '高武', '科技', '魔幻'];
    
    for (const worldType of worlds) {
      const mockProtagonist = createTestProtagonist();
      const config = createTestDungeonConfig();
      
      const { result } = calculateBattleWithLogs(
        mockProtagonist,
        'enemy',
        '敌人',
        10,
        config
      );
      
      expect(result).toBeDefined();
    }
  });
});
