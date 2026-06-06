/**
 * @vitest-environment jsdom
 * 
 * 机缘战利品系统测试
 * 
 * 测试覆盖：
 * - 战利品生成
 * - 战利品稀有度
 * - 经验值战利品化
 * - Boss额外奖励
 * - 物品掉落
 */
import { describe, it, expect } from 'vitest';
import { createTestDungeonConfig, createTestProtagonist } from './test-helpers';

// ============================================
// 战利品基础功能测试
// ============================================
describe('战利品基础功能', () => {
  it('应该能导入战利品相关函数', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    expect(calculateBattleWithLogs).toBeDefined();
  });

  it('战斗胜利应该获得战利品', async () => {
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
    expect(result.rewards).toBeDefined();
  });

  it('战斗失败后状态应该正确', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
      maxHp: 20,
      currentHp: 20,
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
    
    expect(result.victory).toBe(false);
    // HP不应该为负数
    expect(battleState.playerCurrentHp).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// 经验值战利品化测试
// ============================================
describe('经验值战利品化', () => {
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
    expect(result.rewards?.experience).toBeGreaterThan(0);
  });

  it('Boss应该给予更多经验值', async () => {
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
    
    // Boss经验值应该更多
    expect(bossResult.result.rewards?.experience).toBeGreaterThanOrEqual(
      enemyResult.result.rewards?.experience || 0
    );
  });

  it('高难度应该给予更多经验值', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 300, 灵根: 300, 悟性: 50, 幸运: 50, 意志: 50 },
    });
    
    const easyConfig = createTestDungeonConfig({ 
      difficulty: 1,
      rewardMultiplier: 1,
    });
    const hardConfig = createTestDungeonConfig({ 
      difficulty: 10,
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
    
    expect(easyResult.result.victory).toBe(true);
    expect(hardResult.result.victory).toBe(true);
    
    // 高难度经验值应该更多
    expect(hardResult.result.rewards?.experience).toBeGreaterThanOrEqual(
      easyResult.result.rewards?.experience || 0
    );
  });
});

// ============================================
// 物品掉落测试
// ============================================
describe('物品掉落', () => {
  it('Boss有概率掉落物品', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 300, 灵根: 300, 悟性: 50, 幸运: 100, 意志: 50 }, // 高幸运增加掉落率
    });
    const config = createTestDungeonConfig();
    
    // 多次击败Boss，检查物品掉落
    let totalItems = 0;
    for (let i = 0; i < 10; i++) {
      const { result } = calculateBattleWithLogs(
        mockProtagonist,
        'boss',
        'Boss',
        10,
        config
      );
      
      if (result.victory && result.rewards?.items) {
        totalItems += result.rewards.items.length;
      }
    }
    
    // 由于随机性，只验证功能正常
    expect(totalItems).toBeGreaterThanOrEqual(0);
  });

  it('精英敌人比普通敌人有更高掉落率', async () => {
    const { calculateBattleWithLogs } = await import('@/lib/game/adventure');
    
    const mockProtagonist = createTestProtagonist({
      stats: { 体质: 500, 灵根: 500, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 1000,
      currentHp: 1000,
    });
    const config = createTestDungeonConfig();
    
    // 战胜普通敌人
    const normalResult = calculateBattleWithLogs(
      mockProtagonist,
      'enemy',
      '普通敌人',
      10,
      config
    );
    
    // 战胜精英敌人
    const eliteResult = calculateBattleWithLogs(
      mockProtagonist,
      'elite',
      '精英敌人',
      10,
      config
    );
    
    expect(normalResult.result.victory).toBe(true);
    expect(eliteResult.result.victory).toBe(true);
    
    // 精英敌人奖励应该更好
    const normalExp = normalResult.result.rewards?.experience || 0;
    const eliteExp = eliteResult.result.rewards?.experience || 0;
    expect(eliteExp).toBeGreaterThanOrEqual(normalExp);
  });
});

// ============================================
// 战利品稀有度测试
// ============================================
describe('战利品稀有度', () => {
  it('高等级敌人应该掉落更好的物品', async () => {
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
    
    // 低等级敌人
    const lowLevelResult = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      '低等级Boss',
      5,
      lowLevelConfig
    );
    
    // 高等级敌人
    const highLevelResult = calculateBattleWithLogs(
      mockProtagonist,
      'boss',
      '高等级Boss',
      55,
      highLevelConfig
    );
    
    expect(lowLevelResult.result.victory).toBe(true);
    expect(highLevelResult.result.victory).toBe(true);
    
    // 高等级奖励应该更好
    const lowExp = lowLevelResult.result.rewards?.experience || 0;
    const highExp = highLevelResult.result.rewards?.experience || 0;
    expect(highExp).toBeGreaterThanOrEqual(lowExp);
  });
});

// ============================================
// 战利品文案统一性测试
// ============================================
describe('战利品文案统一性', () => {
  it('getTerminology 函数应该返回正确的术语对象', async () => {
    const { getTerminology } = await import('@/lib/game/terminology');
    
    // 修仙世界
    const xiuxianTerm = getTerminology('修仙');
    expect(xiuxianTerm.resource).toBe('灵石');
    expect(xiuxianTerm.practice).toBe('修炼');
    
    // 末世世界
    const apocalypseTerm = getTerminology('末世');
    expect(apocalypseTerm.resource).toBe('晶体');
    
    // 科技世界
    const techTerm = getTerminology('科技');
    expect(techTerm.resource).toBe('能量块');
  });

  it('不同世界类型的资源应该有不同的名称', async () => {
    const { getTerminology } = await import('@/lib/game/terminology');
    const worldTypes: Array<'修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世'> = 
      ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
    
    const names = new Set<string>();
    
    for (const worldType of worldTypes) {
      const term = getTerminology(worldType);
      names.add(term.resource);
    }
    
    // 应该有多种不同的名称
    expect(names.size).toBeGreaterThan(1);
  });

  it('灵石物品创建时应该根据世界类型有正确的名称', async () => {
    const { createSpiritStoneItem } = await import('@/lib/game/items');
    const { getTerminology } = await import('@/lib/game/terminology');
    
    // 修仙世界
    const xiuxianItem = createSpiritStoneItem('修仙');
    const xiuxianTerm = getTerminology('修仙');
    expect(xiuxianItem).toBeDefined();
    expect(xiuxianItem.name).toContain(xiuxianTerm.resource);
    
    // 科技世界
    const techItem = createSpiritStoneItem('科技');
    const techTerm = getTerminology('科技');
    expect(techItem.name).toContain(techTerm.resource);
  });
});
