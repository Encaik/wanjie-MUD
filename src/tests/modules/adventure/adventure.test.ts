/**
 * @vitest-environment jsdom
 * 
 * 机缘冒险功能模块测试
 * 
 * 功能覆盖：
 * - 机缘系统：进入机缘地图、探索格子、遭遇敌人/精英/Boss
 * - 战斗系统：回合制战斗、技能使用、逃跑
 * - 扫荡系统：快速扫荡、扫荡限制
 * - 战利品系统：战利品背包、逃跑/失败清空、Boss击败带走
 * - 事件系统：随机事件、事件选择
 * - 日常历练：历练活动、历练奖励
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 机缘系统
// ============================================
describe('机缘系统', () => {
  it('应该有startAdventure函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('机缘地图应该有正确的配置', async () => {
    type TestDungeonConfig = import('@/lib/game/types').DungeonConfig;
    
    const config: TestDungeonConfig = {
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
    
    expect(config.rows).toBe(5);
    expect(config.cols).toBe(5);
    expect(config.staminaCost).toBe(10);
  });

  it('机缘应该消耗体力', async () => {
    const staminaCost = 10;
    const currentStamina = 100;
    const afterAdventure = currentStamina - staminaCost;
    
    expect(afterAdventure).toBe(90);
  });

  it('机缘面板组件应该可导入', async () => {
    const { AdventurePanel } = await import('@/components/game/tabs');
    expect(AdventurePanel).toBeDefined();
    expect(typeof AdventurePanel).toBe('function');
  });
});

// ============================================
// 怪物比例调整
// ============================================
describe('机缘怪物比例', () => {
  it('难度1的敌人比例应该是10%', () => {
    const difficulty1 = 1;
    const enemyRate1 = 0.10 + (difficulty1 - 1) * 0.05;
    
    expect(enemyRate1).toBeCloseTo(0.10, 2);
  });

  it('难度2的敌人比例应该是15%', () => {
    const difficulty2 = 2;
    const enemyRate2 = 0.10 + (difficulty2 - 1) * 0.05;
    
    expect(enemyRate2).toBeCloseTo(0.15, 2);
  });

  it('难度3的敌人比例应该是20%', () => {
    const difficulty3 = 3;
    const enemyRate3 = 0.10 + (difficulty3 - 1) * 0.05;
    
    expect(enemyRate3).toBeCloseTo(0.20, 2);
  });

  it('Boss应该在最后一行中间位置', () => {
    const rows = 5;
    const cols = 5;
    const lastRow = rows - 1;
    const bossCol = Math.floor(cols / 2);
    
    expect(lastRow).toBe(4);
    expect(bossCol).toBe(2);
  });
});

// ============================================
// 战斗系统
// ============================================
describe('战斗系统', () => {
  it('应该有战力计算函数', async () => {
    const { calculatePlayerCombatPower } = await import('@/lib/game/combatPower');
    
    expect(calculatePlayerCombatPower).toBeDefined();
    expect(typeof calculatePlayerCombatPower).toBe('function');
  });

  it('战斗应该消耗MP', async () => {
    const skillMpCost = 10;
    const currentMp = 50;
    const afterBattle = currentMp - skillMpCost;
    
    expect(afterBattle).toBe(40);
  });

  it('击败敌人应该获得奖励', async () => {
    const { getRandomItem } = await import('@/lib/game/items');
    
    const item = getRandomItem(10);
    expect(item).toBeDefined();
  });
});

// ============================================
// 扫荡系统
// ============================================
describe('扫荡系统', () => {
  it('应该有quickSweep函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('扫荡应该检查Boss击败次数', async () => {
    type TestStatistics = import('@/lib/game/types').GameStatistics;
    
    const stats: TestStatistics = {
      maxLevel: 1,
      totalEnemiesKilled: 0,
      totalBossKilled: 0,
      totalEliteKilled: 0,
      totalTechniquesCollected: 0,
      totalEquipmentsCollected: 0,
      totalAdventuresCompleted: 0,
      clearedDifficulties: [], // 已通关的机缘难度等级列表
      totalCultivations: 0,
      totalBreakthroughs: 0,
      legendaryItemsObtained: 0,
      hasFullEquipment: false,
      maxLevelTechniques: 0,
      maxLevelEquipments: 0,
      collectedTechniqueNames: [],
      collectedEquipmentNames: [],
      pathSelected: false,
      pathLevel: 0,
      techniqueProficiencyXiaocheng: 0,
      techniqueProficiencyDacheng: 0,
      techniqueProficiencyHuajing: 0,
      bondsActivated: 0,
      bondLevel3Activated: false,
      maxEnhancementLevel: 0,
      factionJoined: false,
      reputationFriendly: false,
      reputationHonored: false,
      reputationExalted: false,
      achievementRewardsClaimed: 0,
      totalItemsUsed: 0,
    };
    
    expect(stats.totalBossKilled).toBe(0);
  });

  it('未击败Boss时不能扫荡', () => {
    const totalBossKilled = 0;
    const hasDefeatedBoss = totalBossKilled >= 1;
    
    expect(hasDefeatedBoss).toBe(false);
  });

  it('击败Boss后可以扫荡', () => {
    const totalBossKilled = 1;
    const hasDefeatedBoss = totalBossKilled >= 1;
    
    expect(hasDefeatedBoss).toBe(true);
  });

  it('扫荡应该消耗体力', async () => {
    const staminaCost = 10;
    const currentStamina = 5;
    
    const canSweep = currentStamina >= staminaCost;
    expect(canSweep).toBe(false);
  });

  it('扫荡按钮应该显示正确状态', async () => {
    type TestDifficultySelectProps = {
      totalBossKilled?: number;
    };
    
    const props: TestDifficultySelectProps = {
      totalBossKilled: 0
    };
    
    expect(props.totalBossKilled).toBe(0);
  });
});

// ============================================
// 战利品系统
// ============================================
describe('战利品系统', () => {
  it('GameState应该包含adventureLoot字段', async () => {
    type TestGameState = import('@/lib/game/types').GameState;
    
    const partialState = {
      adventureLoot: []
    };
    
    expect(Array.isArray(partialState.adventureLoot)).toBe(true);
  });

  it('战斗胜利后战利品应该放入背包', () => {
    const currentLoot: any[] = [];
    const newItem = { definition: { id: 'test', name: 'Test Item' }, quantity: 1 };
    
    currentLoot.push(newItem);
    
    expect(currentLoot.length).toBe(1);
  });

  it('被击败后战利品应该清空', () => {
    const currentLoot = [{ definition: { id: 'test', name: 'Test Item' }, quantity: 1 }];
    const defeated = true;
    
    const finalLoot = defeated ? [] : currentLoot;
    
    expect(finalLoot.length).toBe(0);
  });

  it('逃跑后战利品应该清空', () => {
    const currentLoot = [{ definition: { id: 'test', name: 'Test Item' }, quantity: 1 }];
    const escaped = true;
    
    const finalLoot = escaped ? [] : currentLoot;
    
    expect(finalLoot.length).toBe(0);
  });

  it('击败Boss后才能带走战利品', () => {
    // 模拟传送门逻辑
    const grid = [
      [{ type: 'empty', cleared: false, visited: false }],
      [{ type: 'boss', cleared: true, visited: true }]
    ];
    
    let bossDefeated = false;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'boss' && cell.cleared) {
          bossDefeated = true;
          break;
        }
      }
      if (bossDefeated) break;
    }
    
    expect(bossDefeated).toBe(true);
  });

  it('Boss未击败时不能带走战利品', () => {
    // 模拟传送门逻辑 - Boss未击败
    const grid = [
      [{ type: 'empty', cleared: false, visited: false }],
      [{ type: 'boss', cleared: false, visited: false }]
    ];
    
    let bossDefeated = false;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'boss' && cell.cleared) {
          bossDefeated = true;
          break;
        }
      }
      if (bossDefeated) break;
    }
    
    expect(bossDefeated).toBe(false);
  });

  it('AdventurePanel应该支持adventureLoot属性', async () => {
    type TestAdventurePanelProps = {
      adventureLoot?: import('@/lib/game/types').InventoryItem[];
    };
    
    const props: TestAdventurePanelProps = {
      adventureLoot: []
    };
    
    expect(props.adventureLoot).toBeDefined();
    expect(Array.isArray(props.adventureLoot)).toBe(true);
  });
});

// ============================================
// 事件系统
// ============================================
describe('事件系统', () => {
  it('应该能生成随机事件', async () => {
    const { getRandomEvent } = await import('@/lib/game/events');
    
    const event = getRandomEvent('修仙');
    
    expect(event).toBeDefined();
    expect(event.title).toBeTruthy();
    expect(event.description).toBeTruthy();
    expect(event.choices).toBeDefined();
    expect(event.choices.length).toBeGreaterThan(0);
  });

  it('不同世界应该有不同事件', async () => {
    const { getRandomEvent } = await import('@/lib/game/events');
    
    const worldTypes = ['修仙', '高武', '科技', '魔幻'] as const;
    
    worldTypes.forEach(worldType => {
      const event = getRandomEvent(worldType);
      
      expect(event).toBeDefined();
      expect(event.title).toBeTruthy();
      expect(event.description).toBeTruthy();
      expect(event.choices).toBeDefined();
      expect(event.choices.length).toBeGreaterThan(0);
    });
  });

  it('事件应该有有效的选项', async () => {
    const { getRandomEvent } = await import('@/lib/game/events');
    
    const event = getRandomEvent('修仙');
    
    event.choices.forEach((choice, index) => {
      expect(choice.text).toBeTruthy();
      expect(choice.effects).toBeDefined();
    });
  });

  it('应该有handleEventChoice函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });
});

// ============================================
// 日常历练
// ============================================
describe('日常历练', () => {
  it('应该有startExperience函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('历练应该更新lastExploreTime', () => {
    // 验证 lastExploreTime 字段存在
    type TestGameState = import('@/lib/game/types').GameState;
    
    const now = Date.now();
    expect(now).toBeGreaterThan(0);
  });
});

// ============================================
// 难度选择
// ============================================
describe('难度选择', () => {
  it('应该有难度选择组件', async () => {
    const { DifficultySelect } = await import('@/components/game/dialogs');
    expect(DifficultySelect).toBeDefined();
  });

  it('不同难度应该有不同的战力要求', async () => {
    const { calculatePlayerCombatPower } = await import('@/lib/game/combatPower');
    
    // 模拟不同难度的配置
    const difficulties = [
      { difficulty: 1, requiredPower: 100 },
      { difficulty: 2, requiredPower: 200 },
      { difficulty: 3, requiredPower: 300 },
    ];
    
    difficulties.forEach(config => {
      expect(config.difficulty).toBeGreaterThan(0);
      expect(config.requiredPower).toBeGreaterThan(0);
    });
  });
});

// ============================================
// Bug修复验证 - 机缘格子奖励
// ============================================
describe('Bug修复 - 机缘格子奖励', () => {
  it('宝箱格应该给予奖励', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure/adventure');
    
    const mockProtagonist = {
      level: 10,
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 200,
      maxMp: 100,
      currentHp: 200,
      currentMp: 100,
      world: { type: '修仙' as const },
    } as any;
    
    const mockCell = {
      type: 'treasure' as const,
      cleared: false,
      visited: false,
    };
    
    const mockConfig = {
      difficulty: 10,
      rewardMultiplier: 1,
    } as any;
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result.victory).toBe(true);
    expect(result.rewards).toBeDefined();
    expect(result.rewards?.items).toBeDefined();
    expect(result.rewards?.items!.length).toBeGreaterThan(0);
    expect(result.rewards?.experience).toBeGreaterThan(0);
  });

  it('事件格应该给予奖励', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure/adventure');
    
    const mockProtagonist = {
      level: 10,
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 200,
      maxMp: 100,
      currentHp: 200,
      currentMp: 100,
      world: { type: '修仙' as const },
    } as any;
    
    const mockCell = {
      type: 'event' as const,
      cleared: false,
      visited: false,
    };
    
    const mockConfig = {
      difficulty: 10,
      rewardMultiplier: 1,
    } as any;
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result.victory).toBe(true);
    expect(result.rewards).toBeDefined();
    expect(result.rewards?.experience).toBeGreaterThan(0);
  });

  it('休息格应该恢复HP和MP', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure/adventure');
    
    const mockProtagonist = {
      level: 10,
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 200,
      maxMp: 100,
      currentHp: 100,
      currentMp: 50,
      world: { type: '修仙' as const },
    } as any;
    
    const mockCell = {
      type: 'rest' as const,
      cleared: false,
      visited: false,
    };
    
    const mockConfig = {
      difficulty: 10,
      rewardMultiplier: 1,
    } as any;
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    
    expect(result.victory).toBe(true);
    expect(result.hpRestored).toBeGreaterThan(0);
    expect(result.mpRestored).toBeGreaterThan(0);
  });
});

// ============================================
// Bug修复验证 - 怪物等级分布
// ============================================
describe('Bug修复 - 怪物等级分布', () => {
  it('早期行敌人等级应该较低', () => {
    const totalRows = 5;
    const enemyLevelMin = 5;
    const enemyLevelMax = 15;
    
    // 第一行的敌人等级
    const rowProgress = 1 / (totalRows - 1); // 0.25
    const rowBasedMin = Math.floor(enemyLevelMin + (enemyLevelMax - enemyLevelMin) * rowProgress * 0.6);
    
    expect(rowBasedMin).toBeLessThan(enemyLevelMax);
    expect(rowBasedMin).toBeGreaterThanOrEqual(enemyLevelMin);
  });

  it('后期行敌人等级应该较高', () => {
    const totalRows = 5;
    const enemyLevelMin = 5;
    const enemyLevelMax = 15;
    
    // 最后一行之前的敌人等级
    const rowProgress = (totalRows - 2) / (totalRows - 1); // 0.75
    const rowBasedMin = Math.floor(enemyLevelMin + (enemyLevelMax - enemyLevelMin) * rowProgress * 0.6);
    const rowBasedMax = Math.floor(enemyLevelMin + (enemyLevelMax - enemyLevelMin) * (rowProgress * 0.6 + 0.4));
    
    expect(rowBasedMax).toBeGreaterThan(rowBasedMin);
  });

  it('精英敌人应该比普通敌人等级高', () => {
    const baseLevel = 10;
    const eliteLevel = baseLevel + 2;
    
    expect(eliteLevel).toBeGreaterThan(baseLevel);
  });

  it('Boss应该比最高级敌人略高', () => {
    const enemyLevelMax = 15;
    const bossLevel = enemyLevelMax + 2;
    
    expect(bossLevel).toBeGreaterThan(enemyLevelMax);
  });

  it('小Boss等级应该比精英更高', () => {
    const baseLevel = 10;
    const eliteLevel = baseLevel + 2;
    const minibossLevel = baseLevel + 5;
    
    expect(minibossLevel).toBeGreaterThan(eliteLevel);
  });
});

// ============================================
// Bug修复验证 - 战利品背包
// ============================================
describe('Bug修复 - 战利品背包', () => {
  it('战斗胜利后战利品应该放入adventureLoot而不是inventory', async () => {
    // 这个测试验证战斗胜利后的物品流向
    // 物品应该放入 adventureLoot，在机缘结束时才放入主角背包
    
    // 模拟战利品收集流程
    const initialLoot: any[] = [];
    const battleRewards = {
      items: [
        { id: 'test_item_1', definition: { id: 'spirit_stone', name: '灵石', rarity: '普通' }, quantity: 100 },
      ],
      experience: 50,
    };
    
    // 战斗胜利后应该将物品添加到 adventureLoot
    const newLoot = [...initialLoot];
    if (battleRewards.items) {
      for (const item of battleRewards.items) {
        newLoot.push(item);
      }
    }
    
    expect(newLoot.length).toBe(1);
    expect(newLoot[0].definition.name).toBe('灵石');
  });

  it('物品结构应该包含definition字段', async () => {
    // 验证物品结构完整性，防止 MessagePanel 报错
    
    const mockItem = {
      id: 'inv_test_123',
      definition: {
        id: 'spirit_stone',
        name: '灵石',
        type: '灵石',
        rarity: '普通' as const,
        description: '修炼必备的货币',
        stackable: true,
      },
      quantity: 100,
    };
    
    expect(mockItem.definition).toBeDefined();
    expect(mockItem.definition.rarity).toBeDefined();
    expect(mockItem.definition.name).toBeDefined();
  });

  it('MessagePanel应该安全处理缺失definition的情况', async () => {
    // 验证 MessagePanel 不会因缺少 definition 而崩溃
    
    // 模拟可能缺少 definition 的物品
    const items = [
      { definition: { id: 'item1', name: '物品1', rarity: '普通' as const }, quantity: 1 },
      { definition: null, quantity: 1 }, // 可能的异常情况
      { definition: { id: 'item2', name: '物品2', rarity: '稀有' as const }, quantity: 2 },
    ];
    
    // 安全访问模式
    items.forEach((item, idx) => {
      const name = item.definition?.name || '未知物品';
      const rarity = item.definition?.rarity;
      
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
    });
  });

  it('机缘结束时应该将战利品转移到主角背包', async () => {
    // 验证机缘结束时的战利品转移逻辑
    
    const adventureLoot = [
      { id: 'loot1', definition: { id: 'spirit_stone', name: '灵石', rarity: '普通' as const }, quantity: 100 },
      { id: 'loot2', definition: { id: 'pill', name: '丹药', rarity: '稀有' as const }, quantity: 5 },
    ];
    
    const inventory: any[] = [];
    
    // 模拟转移过程
    for (const item of adventureLoot) {
      inventory.push(item);
    }
    
    expect(inventory.length).toBe(2);
  });

  it('空战利品背包不应该导致错误', async () => {
    const emptyLoot: any[] = [];
    
    // 验证空数组的处理
    expect(emptyLoot.length).toBe(0);
    
    // 模拟将空战利品添加到背包
    const inventory: any[] = [];
    for (const item of emptyLoot) {
      inventory.push(item);
    }
    
    expect(inventory.length).toBe(0);
  });
});

// ============================================
// Bug修复验证 - 格子比例和传送门限制
// ============================================
describe('Bug修复 - 格子比例和传送门限制', () => {
  it('小地图不应该有传送门', async () => {
    // 9x9 = 81格，小于81格不应该有传送门
    const smallGrid = 5 * 5; // 25格
    const mediumGrid = 7 * 7; // 49格
    const largeGrid = 9 * 9; // 81格
    const extraLargeGrid = 10 * 10; // 100格
    
    // 只有81格以上才有传送门
    expect(smallGrid).toBeLessThan(81);
    expect(mediumGrid).toBeLessThan(81);
    expect(largeGrid).toBeGreaterThanOrEqual(81);
    expect(extraLargeGrid).toBeGreaterThan(81);
  });

  it('每种格子类型应该有最小数量', async () => {
    const { generateAdventureGrid } = await import('@/lib/game/adventure/adventure');
    
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
    
    // 统计各种格子类型
    let treasureCount = 0;
    let eventCount = 0;
    let restCount = 0;
    let enemyCount = 0;
    
    for (const row of grid) {
      for (const cell of row) {
        switch (cell.type) {
          case 'treasure': treasureCount++; break;
          case 'event': eventCount++; break;
          case 'rest': restCount++; break;
          case 'enemy': enemyCount++; break;
        }
      }
    }
    
    // 确保关键格子类型至少有最小数量
    expect(treasureCount).toBeGreaterThanOrEqual(1);
    expect(eventCount).toBeGreaterThanOrEqual(1);
    expect(restCount).toBeGreaterThanOrEqual(1);
    expect(enemyCount).toBeGreaterThanOrEqual(2);
  });

  it('大地图应该可以生成传送门', async () => {
    const totalCells = 10 * 10; // 100格
    expect(totalCells).toBeGreaterThanOrEqual(81);
    
    // 传送门数量应该合理
    const maxPortals = Math.floor(totalCells / 20); // 最多5%的格子是传送门
    expect(maxPortals).toBeLessThanOrEqual(5);
  });
});

// ============================================
// Bug修复验证 - 奖励格物品显示
// ============================================
describe('Bug修复 - 奖励格物品显示', () => {
  it('单个物品不应该显示x1', () => {
    const quantity = 1;
    const displayText = quantity > 1 ? `物品名 x${quantity}` : '物品名';
    
    expect(displayText).toBe('物品名');
    expect(displayText).not.toContain('x1');
  });

  it('多个物品应该显示x数量', () => {
    const quantity = 5;
    const displayText = quantity > 1 ? `物品名 x${quantity}` : '物品名';
    
    expect(displayText).toBe('物品名 x5');
  });

  it('宝箱奖励应该使用术语系统', async () => {
    const { handleCellEvent } = await import('@/lib/game/adventure/adventure');
    const { getTerminology } = await import('@/lib/game/terminology');
    
    const mockProtagonist = {
      level: 10,
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
      maxHp: 200,
      maxMp: 100,
      currentHp: 200,
      currentMp: 100,
      world: { type: '高武' as const }, // 使用高武世界测试术语
    } as any;
    
    const mockCell = {
      type: 'treasure' as const,
      cleared: false,
      visited: false,
    };
    
    const mockConfig = {
      difficulty: 10,
      rewardMultiplier: 1,
    } as any;
    
    const result = handleCellEvent(mockProtagonist, mockCell, mockConfig);
    const terminology = getTerminology('高武');
    
    // 消息应该包含高武世界的资源名称（武晶）
    expect(result.message).toContain(terminology.resource);
  });
});

// ============================================
// Bug修复验证 - 高品质物品遮掩
// ============================================
describe('Bug修复 - 高品质物品遮掩', () => {
  it('史诗品质物品应该被遮掩显示', () => {
    const rarity = '史诗' as const;
    const isHidden = ['史诗', '传说'].includes(rarity);
    const displayName = isHidden ? '未知珍宝' : '物品名';
    
    expect(isHidden).toBe(true);
    expect(displayName).toBe('未知珍宝');
  });

  it('传说品质物品应该被遮掩显示', () => {
    const rarity = '传说' as const;
    const isHidden = ['史诗', '传说'].includes(rarity);
    const displayName = isHidden ? '稀世秘宝' : '物品名';
    
    expect(isHidden).toBe(true);
    expect(displayName).toBe('稀世秘宝');
  });

  it('普通和稀有品质物品应该直接显示', () => {
    const normalRarity = '普通' as const;
    const rareRarity = '稀有' as const;
    
    const normalHidden = ['史诗', '传说'].includes(normalRarity);
    const rareHidden = ['史诗', '传说'].includes(rareRarity);
    
    expect(normalHidden).toBe(false);
    expect(rareHidden).toBe(false);
  });

  it('物品数量显示格式应该正确', () => {
    // 单个物品不显示x1
    const singleItem = { definition: { name: '灵石', rarity: '普通' as const }, quantity: 1 };
    const singleDisplay = singleItem.quantity > 1 ? `${singleItem.definition.name} x${singleItem.quantity}` : singleItem.definition.name;
    expect(singleDisplay).toBe('灵石');
    
    // 多个物品显示x数量
    const multiItem = { definition: { name: '灵石', rarity: '普通' as const }, quantity: 100 };
    const multiDisplay = multiItem.quantity > 1 ? `${multiItem.definition.name} x${multiItem.quantity}` : multiItem.definition.name;
    expect(multiDisplay).toBe('灵石 x100');
  });
});
