/**
 * 终局玩法系统单元测试
 * 
 * 测试内容：
 * - 飞升境界系统
 * - 排行榜系统
 * - 每周Boss系统
 * - 飞升商店系统
 */

import {
  // 飞升境界
  RealmService,
  ASCENSION_REALMS,
  MARK_GAIN_CONFIGS,
  ASCENSION_MILESTONES,
  ASCENSION_CORE_CONFIG,
  
  // 排行榜
  LeaderboardService,
  LEADERBOARD_NAMES,
  
  // 每周Boss
  WeeklyBossGenerator,
  WeeklyBossService,
  
  // 飞升商店
  AscensionShopService,
  ASCENSION_SHOP_ITEMS,
  
  // 类型
  PlayerAscensionState,
  LeaderboardType,
  AscensionMarkSource,
} from '@/lib/game/ascension';

// ============================================
// 测试工具函数
// ============================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n📦 ${name}`);
  try {
    fn();
    console.log(`  ✅ All tests passed`);
  } catch (error) {
    console.log(`  ❌ Test failed: ${error instanceof Error ? error.message : error}`);
  }
}

function it(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    throw error;
  }
}

// ============================================
// 飞升境界系统测试
// ============================================

describe('飞升境界系统', () => {
  it('应该正确创建初始状态', () => {
    const state = RealmService.createInitialState();
    
    assertEqual(state.marks, 0, '初始印记应为0');
    assertEqual(state.totalMarksEarned, 0, '累计印记应为0');
    assertEqual(state.currentRealmId, 'mortal', '初始境界应为凡人');
    assertEqual(state.ascensionCount, 0, '飞升次数应为0');
    assert(state.unlockedFeatures.length === 0, '初始无解锁功能');
  });
  
  it('应该正确获取当前境界', () => {
    const state = RealmService.createInitialState();
    const realm = RealmService.getCurrentRealm(state);
    
    assertEqual(realm.id, 'mortal', '初始境界应为凡人');
    assertEqual(realm.name, '凡人', '境界名称应为凡人');
    assertEqual(realm.requiredMarks, 0, '凡人境界不需要印记');
  });
  
  it('应该正确计算印记获取量', () => {
    const bossMarks = RealmService.calculateMarkGain('boss', 10);
    const weeklyBossMarks = RealmService.calculateMarkGain('weekly_boss', 10);
    
    assert(bossMarks > 0, 'Boss印记应大于0');
    assert(weeklyBossMarks > bossMarks, '每周Boss印记应多于普通Boss');
    
    // 验证等级缩放
    const highLevelMarks = RealmService.calculateMarkGain('boss', 100);
    assert(highLevelMarks > bossMarks, '高等级应获得更多印记');
  });
  
  it('应该正确获得印记', () => {
    const state = RealmService.createInitialState();
    const newState = RealmService.gainMarks(state, 100, 'boss');
    
    assertEqual(newState.marks, 100, '印记应为100');
    assertEqual(newState.totalMarksEarned, 100, '累计印记应为100');
    assertEqual(newState.currentRealmId, 'mortal', '境界仍为凡人（需要150印记升到超脱者）');
  });
  
  it('应该正确消耗印记', () => {
    const state = RealmService.createInitialState();
    const stateWithMarks = RealmService.gainMarks(state, 100, 'boss');
    
    // 正常消耗
    const result1 = RealmService.spendMarks(stateWithMarks, 50);
    assert(result1.success, '消耗应成功');
    assertEqual(result1.newState.marks, 50, '剩余印记应为50');
    
    // 余额不足
    const result2 = RealmService.spendMarks(stateWithMarks, 150);
    assert(!result2.success, '余额不足时应失败');
    assertEqual(result2.newState.marks, 100, '印记不应减少');
  });
  
  it('应该正确升级境界', () => {
    const state = RealmService.createInitialState();
    
    // 获得150印记（超脱者门槛）
    const state1 = RealmService.gainMarks(state, 150, 'weekly_boss');
    assertEqual(state1.currentRealmId, 'transcendent', '应升级到超脱者');
    assert(state1.unlockedFeatures.includes('ascension_shop'), '应解锁飞升商店');
    assert(state1.unlockedFeatures.includes('leaderboard'), '应解锁排行榜');
    
    // 获得400印记（仙人门槛）
    const state2 = RealmService.gainMarks(state1, 250, 'weekly_boss');
    assertEqual(state2.currentRealmId, 'immortal', '应升级到仙人');
    assert(state2.unlockedFeatures.includes('advanced_techniques'), '应解锁高级功法');
  });
  
  it('应该正确获取里程碑', () => {
    const milestone1 = RealmService.getCurrentMilestone(1);
    assert(milestone1 !== null, '第1次飞升应有里程碑');
    assertEqual(milestone1?.title, '初窥门径', '里程碑名称应为初窥门径');
    
    const milestone5 = RealmService.getCurrentMilestone(5);
    assert(milestone5 !== null, '第5次飞升应有里程碑');
    assertEqual(milestone5?.title, '世界旅行者', '里程碑名称应为世界旅行者');
    
    const nextMilestone = RealmService.getNextMilestone(2);
    assert(nextMilestone !== null, '第2次飞升应有下一个里程碑');
    assertEqual(nextMilestone?.required, 3, '下一个里程碑需要3次飞升');
  });
  
  it('应该正确获取额外传承槽位', () => {
    const slots1 = RealmService.getExtraInheritanceSlots(1);
    assertEqual(slots1.techniques, 0, '飞升1次无额外槽位');
    
    const slots3 = RealmService.getExtraInheritanceSlots(3);
    assertEqual(slots3.techniques, 1, '飞升3次应有1个额外功法槽位');
    assertEqual(slots3.equipments, 1, '飞升3次应有1个额外装备槽位');
  });
});

// ============================================
// 排行榜系统测试
// ============================================

describe('排行榜系统', () => {
  beforeEach: {
    LeaderboardService.clearAll();
  }
  
  it('应该正确更新分数', () => {
    const entry = LeaderboardService.updateScore(
      'combat_power',
      'player1',
      '测试玩家1',
      1000
    );
    
    assert(entry !== null, '应返回排行榜条目');
    assertEqual(entry?.rank, 1, '排名应为第1');
    assertEqual(entry?.score, 1000, '分数应为1000');
  });
  
  it('应该正确排序排行榜', () => {
    LeaderboardService.updateScore('combat_power', 'player1', '玩家1', 1000);
    LeaderboardService.updateScore('combat_power', 'player2', '玩家2', 2000);
    LeaderboardService.updateScore('combat_power', 'player3', '玩家3', 1500);
    
    const topEntries = LeaderboardService.getTopEntries('combat_power', 10);
    
    assertEqual(topEntries.length, 3, '应有3个条目');
    assertEqual(topEntries[0].playerId, 'player2', '第1名应为player2');
    assertEqual(topEntries[0].rank, 1, 'player2排名应为1');
    assertEqual(topEntries[1].playerId, 'player3', '第2名应为player3');
    assertEqual(topEntries[2].playerId, 'player1', '第3名应为player1');
  });
  
  it('应该正确处理速度排行榜（降序）', () => {
    // 速度排行榜：时间越短越好
    LeaderboardService.updateScore('speedrun', 'player1', '玩家1', 100); // 100秒
    LeaderboardService.updateScore('speedrun', 'player2', '玩家2', 50);  // 50秒
    
    const topEntries = LeaderboardService.getTopEntries('speedrun', 10);
    
    assertEqual(topEntries[0].playerId, 'player2', '最快应为player2');
    assertEqual(topEntries[0].score, 50, '最快时间为50秒');
  });
  
  it('应该正确增加分数', () => {
    LeaderboardService.updateScore('achievement', 'player1', '玩家1', 100);
    LeaderboardService.addScore('achievement', 'player1', '玩家1', 50);
    
    const entry = LeaderboardService.getPlayerEntry('achievement', 'player1');
    assertEqual(entry?.score, 150, '累计分数应为150');
  });
  
  it('应该正确获取玩家排名', () => {
    LeaderboardService.updateScore('combat_power', 'player1', '玩家1', 1000);
    LeaderboardService.updateScore('combat_power', 'player2', '玩家2', 2000);
    
    const rank = LeaderboardService.getPlayerRank('combat_power', 'player1');
    assertEqual(rank, 2, 'player1排名应为第2');
  });
  
  it('应该正确获取排行榜奖励', () => {
    const reward1 = LeaderboardService.getRewardForRank(1);
    assert(reward1 !== null, '第1名应有奖励');
    assertEqual(reward1?.rankRange[0], 1, '奖励排名范围应从1开始');
    assert((reward1?.rewards.ascensionMarks ?? 0) > 0, '奖励应包含飞升印记');
    
    const reward3 = LeaderboardService.getRewardForRank(3);
    assert(reward3 !== null, '第3名应有奖励');
    assertEqual(reward3?.rankRange[0], 2, '第3名应在第2-3名范围内');
  });
  
  it('应该正确获取排行榜统计', () => {
    LeaderboardService.updateScore('combat_power', 'player1', '玩家1', 1000);
    LeaderboardService.updateScore('combat_power', 'player2', '玩家2', 2000);
    
    const stats = LeaderboardService.getLeaderboardStats('combat_power');
    
    assertEqual(stats.totalPlayers, 2, '应有2个玩家');
    assertEqual(stats.highestScore, 2000, '最高分应为2000');
    assertEqual(stats.lowestScore, 1000, '最低分应为1000');
  });
});

// ============================================
// 每周Boss系统测试
// ============================================

describe('每周Boss系统', () => {
  beforeEach: {
    WeeklyBossService.clearAll();
  }
  
  it('应该正确生成每周Boss', () => {
    const boss = WeeklyBossGenerator.generateWeeklyBoss(50);
    
    assert(boss.id.startsWith('weekly_boss_'), 'Boss ID格式正确');
    assert(boss.name.length > 0, 'Boss应有名称');
    assert(boss.hp > 0, 'Boss应有HP');
    assert(boss.attack > 0, 'Boss应有攻击力');
    assert(boss.defense > 0, 'Boss应有防御力');
    assert(boss.element !== undefined, 'Boss应有元素属性');
    assert(boss.specialAbility !== undefined, 'Boss应有特殊能力');
    assert(boss.rewards.length > 0, 'Boss应有奖励');
  });
  
  it('应该正确获取当前周数', () => {
    const weekNumber = WeeklyBossGenerator.getCurrentWeekNumber();
    assert(weekNumber > 0, '周数应大于0');
  });
  
  it('应该正确获取当前Boss', () => {
    const boss = WeeklyBossService.getCurrentBoss(50);
    
    assert(boss !== null, '应返回Boss');
    assert(WeeklyBossService.isBossAvailable(boss), 'Boss应该可用');
  });
  
  it('应该正确记录伤害', () => {
    const boss = WeeklyBossService.getCurrentBoss(50);
    const record = WeeklyBossService.recordDamage('player1', '玩家1', boss, 10000);
    
    assertEqual(record.totalDamage, 10000, '总伤害应为10000');
    assertEqual(record.bestDamage, 10000, '最高伤害应为10000');
    assertEqual(record.attempts, 1, '尝试次数应为1');
    
    // 再次记录伤害
    const record2 = WeeklyBossService.recordDamage('player1', '玩家1', boss, 8000);
    assertEqual(record2.totalDamage, 18000, '总伤害应为18000');
    assertEqual(record2.bestDamage, 10000, '最高伤害应保持10000');
    assertEqual(record2.attempts, 2, '尝试次数应为2');
  });
  
  it('应该正确计算Boss伤害', () => {
    const boss = WeeklyBossService.getCurrentBoss(50);
    const damage = WeeklyBossService.calculateBossDamage(boss, 100);
    
    assert(damage > 0, 'Boss伤害应大于0');
    assert(damage <= boss.attack, '伤害不应超过Boss攻击力');
  });
  
  it('应该正确创建战斗状态', () => {
    const boss = WeeklyBossService.getCurrentBoss(50);
    const state = WeeklyBossService.createBattleState(boss);
    
    assertEqual(state.bossCurrentHp, boss.hp, '初始HP应等于Boss最大HP');
    assertEqual(state.currentRound, 0, '初始回合应为0');
    assert(!state.isOver, '战斗不应结束');
    assert(!state.victory, '不应胜利');
    assertEqual(state.totalDamageDealt, 0, '初始伤害应为0');
  });
  
  it('应该正确获取Boss提示', () => {
    const boss = WeeklyBossService.getCurrentBoss(50);
    const tips = WeeklyBossService.getBossTips(boss);
    
    assert(tips.length > 0, '应有提示');
    assert(tips.some(t => t.includes('特殊能力')), '应有特殊能力提示');
  });
  
  it('应该正确计算奖励', () => {
    const boss = WeeklyBossService.getCurrentBoss(50);
    
    // 记录伤害
    WeeklyBossService.recordDamage('player1', '玩家1', boss, boss.hp * 0.2);
    
    // 模拟首杀
    const isFirstKill = WeeklyBossService.checkFirstKill(boss);
    assert(isFirstKill, '首次检查应为首杀');
    
    // 再次检查
    const isSecondKill = WeeklyBossService.checkFirstKill(boss);
    assert(!isSecondKill, '第二次检查不应为首杀');
  });
});

// ============================================
// 飞升商店系统测试
// ============================================

describe('飞升商店系统', () => {
  let testState: PlayerAscensionState;
  
  beforeEach: {
    testState = RealmService.createInitialState();
    AscensionShopService.clearHistory();
  }
  
  it('应该正确获取可用商品', () => {
    const items = AscensionShopService.getAvailableItems(testState);
    
    // 凡人境界应只能购买无境界要求的商品
    const restrictedItems = items.filter(item => item.requiredRealm);
    assertEqual(restrictedItems.length, 0, '不应有境界限制的商品');
    
    // 应有可购买的商品
    assert(items.length > 0, '应有可用商品');
  });
  
  it('应该正确按类型获取商品', () => {
    const boostItems = AscensionShopService.getItemsByType('boost', testState);
    
    boostItems.forEach(item => {
      assertEqual(item.type, 'boost', '所有商品类型应为boost');
    });
  });
  
  it('应该正确检查购买条件', () => {
    // 获取一个可购买的商品
    const items = AscensionShopService.getAvailableItems(testState);
    const affordableItem = items.find(item => item.price <= testState.marks);
    
    if (affordableItem) {
      const check = AscensionShopService.canPurchase(affordableItem, testState, 'player1');
      assert(!check.canPurchase, '印记不足时应无法购买');
      assert(check.reason.includes('印记不足'), '原因应为印记不足');
    }
    
    // 测试有足够印记的情况
    const stateWithMarks = RealmService.gainMarks(testState, 100, 'boss');
    const item = items[0];
    const check = AscensionShopService.canPurchase(item, stateWithMarks, 'player1');
    
    if (item.price <= 100 && !item.requiredRealm) {
      assert(check.canPurchase, '有足够印记时应可购买');
    }
  });
  
  it('应该正确购买商品', () => {
    // 给玩家足够的印记
    const stateWithMarks = RealmService.gainMarks(testState, 200, 'boss');
    
    // 获取一个可购买的商品
    const items = AscensionShopService.getAvailableItems(stateWithMarks);
    const affordableItem = items.find(item => item.price <= 200 && !item.requiredRealm);
    
    if (affordableItem) {
      const result = AscensionShopService.purchase(affordableItem, stateWithMarks, 'player1');
      
      assert(result.success, '购买应成功');
      assert(result.newState.marks < stateWithMarks.marks, '印记应减少');
      assert(result.purchase !== undefined, '应有购买记录');
      
      // 检查购买次数
      const count = AscensionShopService.getPurchasedCount('player1', affordableItem.id);
      assertEqual(count, 1, '购买次数应为1');
    }
  });
  
  it('应该正确处理购买上限', () => {
    const stateWithMarks = RealmService.gainMarks(testState, 500, 'boss');
    
    // 获取有购买上限的商品
    const limitedItem = ASCENSION_SHOP_ITEMS.find(item => item.purchaseLimit && item.price <= 500);
    
    if (limitedItem) {
      // 第一次购买
      const result1 = AscensionShopService.purchase(limitedItem, stateWithMarks, 'player1');
      assert(result1.success, '第一次购买应成功');
      
      // 尝试超过上限
      for (let i = 1; i < (limitedItem.purchaseLimit || 0); i++) {
        AscensionShopService.purchase(limitedItem, result1.newState, 'player1');
      }
      
      const finalState = result1.newState;
      const finalResult = AscensionShopService.purchase(limitedItem, finalState, 'player1');
      
      const count = AscensionShopService.getPurchasedCount('player1', limitedItem.id);
      if (count >= (limitedItem.purchaseLimit || 0)) {
        assert(!finalResult.success, '超过上限应无法购买');
      }
    }
  });
  
  it('应该正确获取推荐商品', () => {
    const stateWithMarks = RealmService.gainMarks(testState, 100, 'boss');
    const recommended = AscensionShopService.getRecommendedItems(stateWithMarks, 3);
    
    assertEqual(recommended.length, 3, '应返回3个推荐商品');
  });
  
  it('应该正确获取商店统计', () => {
    const stateWithMarks = RealmService.gainMarks(testState, 100, 'boss');
    const stats = AscensionShopService.getShopStats(stateWithMarks);
    
    assert(stats.totalItems > 0, '应有可用商品');
    assert(stats.affordableItems >= 0, '应有可负担商品数量');
    assert(Object.keys(stats.byType).length > 0, '应有按类型统计');
  });
});

// ============================================
// 运行所有测试
// ============================================

console.log('\n🧪 终局玩法系统单元测试');
console.log('='.repeat(50));

// 运行测试
console.log('\n测试完成！');
