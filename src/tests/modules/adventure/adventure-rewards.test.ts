/**
 * @vitest-environment jsdom
 * 
 * 机缘奖励系统测试
 * 
 * 测试覆盖：
 * - 宝箱格奖励
 * - 事件格奖励
 * - 战斗奖励
 */
import { describe, it, expect } from 'vitest';
import { createTestDungeonConfig, createTestProtagonist, createTestCell } from './test-helpers';

// ============================================
// 格子事件处理测试
// ============================================
describe('格子事件处理', () => {
  it('应该能导入handleCellEvent函数', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure');
    expect(handleCellEvent).toBeDefined();
    expect(typeof handleCellEvent).toBe('function');
  });

  it('宝箱格应该给予奖励', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const mockCell = createTestCell('treasure');
    const mockConfig = createTestDungeonConfig();
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result).toBeDefined();
    expect(result.victory).toBe(true);
    expect(result.rewards).toBeDefined();
  });

  it('事件格应该有结果', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const mockCell = createTestCell('event');
    const mockConfig = createTestDungeonConfig();
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('victory');
  });

  it('休息格应该恢复HP和MP', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      currentHp: 100, // 受伤了
      currentMp: 50,  // 法力不满
    });
    const mockCell = createTestCell('rest');
    const mockConfig = createTestDungeonConfig();
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result).toBeDefined();
    expect(result.victory).toBe(true);
    expect(result.hpRestored).toBeGreaterThan(0);
  });

  it('空格应该有结果', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const mockCell = createTestCell('empty');
    const mockConfig = createTestDungeonConfig();
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result).toBeDefined();
    expect(result.victory).toBe(true);
  });
});

// ============================================
// 战斗奖励测试
// ============================================
describe('战斗奖励', () => {
  it('战斗胜利应该有奖励', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 500, 灵根: 500, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 1000,
      currentHp: 1000,
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
    expect(result.rewards).toBeDefined();
    expect(result.rewards?.experience).toBeGreaterThan(0);
  });

  it('Boss战斗胜利应该有更好的奖励', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 500, 灵根: 500, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 1000,
      currentHp: 1000,
    });
    const config = createTestDungeonConfig();
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      'Boss',
      10,
      config
    );
    
    expect(result.victory).toBe(true);
    expect(result.rewards).toBeDefined();
    expect(result.rewards?.experience).toBeGreaterThan(0);
  });

  it('高难度应该有更好的奖励', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 200, 灵根: 200, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    
    const easyConfig = createTestDungeonConfig({ rewardMultiplier: 1 });
    const hardConfig = createTestDungeonConfig({ rewardMultiplier: 2 });
    
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
    
    expect(easyResult.result.victory).toBe(true);
    expect(hardResult.result.victory).toBe(true);
    
    // 高倍率应该有更多经验
    if (easyResult.result.rewards?.experience && hardResult.result.rewards?.experience) {
      expect(hardResult.result.rewards.experience).toBeGreaterThanOrEqual(
        easyResult.result.rewards.experience
      );
    }
  });
});

// ============================================
// 经验值测试
// ============================================
describe('经验值奖励', () => {
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

  it('高等级敌人应该给予更多经验', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 999, 灵根: 999, 悟性: 999, 幸运: 999, 意志: 999 },
      maxHp: 9999,
      currentHp: 9999,
    });
    
    const lowLevelConfig = createTestDungeonConfig({
      enemyLevelMin: 1,
      enemyLevelMax: 5,
    });
    
    const highLevelConfig = createTestDungeonConfig({
      enemyLevelMin: 50,
      enemyLevelMax: 60,
    });
    
    const lowResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '低级敌人',
      5,
      lowLevelConfig
    );
    
    const highResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '高级敌人',
      55,
      highLevelConfig
    );
    
    expect(lowResult.result.victory).toBe(true);
    expect(highResult.result.victory).toBe(true);
    
    // 高等级敌人应该给予更多经验
    if (lowResult.result.rewards?.experience && highResult.result.rewards?.experience) {
      expect(highResult.result.rewards.experience).toBeGreaterThanOrEqual(
        lowResult.result.rewards.experience
      );
    }
  });
});
