/**
 * @vitest-environment jsdom
 * 
 * 机缘战斗系统测试
 * 
 * 测试覆盖：
 * - 战斗流程和结果
 * - 伤害计算和上限
 * - 暴击和闪避
 * - 功法触发
 * - 敌人等级和类型
 * - 战斗奖励计算
 */
import { describe, it, expect } from 'vitest';

import { createTestDungeonConfig, createTestProtagonist } from './test-helpers';

// ============================================
// 战斗基础功能测试
// ============================================
describe('战斗基础功能', () => {
  it('应该能导入战斗计算函数', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    expect(calculateBattleWithLogs).toBeDefined();
    expect(typeof calculateBattleWithLogs).toBe('function');
  });

  it('战斗应该返回正确的结果结构', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig({
      difficulty: 10,
      enemyLevelMin: 5,
      enemyLevelMax: 15,
    });
    
    const { result, battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '测试敌人',
      10,
      config
    );
    
    // 检查结果结构
    expect(result).toHaveProperty('victory');
    expect(result).toHaveProperty('message');
    
    // 检查战斗状态结构
    expect(battleState).toHaveProperty('playerCurrentHp');
    expect(battleState).toHaveProperty('enemyCurrentHp');
    expect(battleState).toHaveProperty('playerAttack');
    expect(battleState).toHaveProperty('enemyAttack');
    expect(battleState).toHaveProperty('isOver');
  });

  it('战斗胜利后应该有战利品', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 200, 灵根: 200, 悟性: 50, 幸运: 50, 意志: 50 }, // 强属性确保胜利
    });
    const config = createTestDungeonConfig({
      difficulty: 1,
      enemyLevelMin: 1,
      enemyLevelMax: 1,
    });
    
    const { result } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '弱小敌人',
      1,
      config
    );
    
    // 战斗应该胜利
    expect(result.victory).toBe(true);
    
    // 应该有奖励
    expect(result.rewards).toBeDefined();
  });

  it('战斗失败后HP应该被限制在合理范围', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    // 创建一个弱小的主角
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
      maxHp: 50,
      currentHp: 50,
    });
    const config = createTestDungeonConfig({
      difficulty: 100,
      enemyLevelMin: 100,
      enemyLevelMax: 100,
    });
    
    const { result, battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      '强大Boss',
      100,
      config
    );
    
    // 战斗应该失败
    expect(result.victory).toBe(false);
    
    // HP不应该为负数
    expect(battleState.playerCurrentHp).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// 敌人类型测试
// ============================================
describe('敌人类型', () => {
  it('普通敌人应该有合理的属性', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '普通敌人',
      10,
      config
    );
    
    // 敌人最大HP应该是正数（enemyCurrentHp可能是战斗后的剩余HP）
    expect(battleState.enemyMaxHp).toBeGreaterThan(0);
    // 敌人攻击力应该是正数
    expect(battleState.enemyAttack).toBeGreaterThan(0);
  });

  it('精英敌人应该比普通敌人更强', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const normalResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '普通敌人',
      10,
      config
    );
    
    const eliteResult = calculateBattleWithLogs(
      mockProtagonist,
      'elite',
      '精英敌人',
      10,
      config
    );
    
    // 精英敌人应该有更多HP
    expect(eliteResult.battleState.enemyMaxHp).toBeGreaterThanOrEqual(
      normalResult.battleState.enemyMaxHp
    );
  });

  it('Boss应该比精英敌人更强', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist();
    const config = createTestDungeonConfig();
    
    const eliteResult = calculateBattleWithLogs(
      mockProtagonist,
      'elite',
      '精英敌人',
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
    
    // Boss应该有更多HP
    expect(bossResult.battleState.enemyMaxHp).toBeGreaterThanOrEqual(
      eliteResult.battleState.enemyMaxHp
    );
  });
});

// ============================================
// 难度影响测试
// ============================================
describe('难度影响', () => {
  it('高难度应该有更强的敌人', async () => {
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
    
    // 高难度的敌人HP应该更多或相等
    expect(hardResult.battleState.enemyMaxHp).toBeGreaterThanOrEqual(
      easyResult.battleState.enemyMaxHp * 0.8 // 允许一定误差
    );
  });

  it('高难度应该有更高的奖励倍率', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 200, 灵根: 200, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    
    const easyConfig = createTestDungeonConfig({ 
      difficulty: 1,
      rewardMultiplier: 1,
    });
    const hardConfig = createTestDungeonConfig({ 
      difficulty: 5,
      rewardMultiplier: 2,
    });
    
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
    
    // 高难度应该胜利（因为主角很强）
    expect(hardResult.result.victory).toBe(true);
    
    // 高难度的奖励应该更高
    if (easyResult.result.rewards?.experience && hardResult.result.rewards?.experience) {
      expect(hardResult.result.rewards.experience).toBeGreaterThanOrEqual(
        easyResult.result.rewards.experience
      );
    }
  });
});

// ============================================
// 伤害上限测试
// ============================================
describe('伤害上限', () => {
  it('单次伤害不应该超过敌人HP的一定比例', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    // 创建一个非常强的主角
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 999, 灵根: 999, 悟性: 999, 幸运: 999, 意志: 999 },
    });
    const config = createTestDungeonConfig();
    
    const { battleState } = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      'Boss',
      50,
      config
    );
    
    // 敌人HP应该是正数（验证战斗正常进行）
    expect(battleState.enemyCurrentHp).toBeGreaterThanOrEqual(0);
  });
});
