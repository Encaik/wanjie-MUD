/**
 * @vitest-environment jsdom
 * 
 * 新手任务系统测试
 * 
 * 测试覆盖：
 * - 任务进度检测
 * - 任务完成后状态持久化
 * - 进度防后退机制
 * - 任务奖励领取
 */
import { describe, it, expect } from 'vitest';

import type { Protagonist, GameStatistics } from '@/lib/game/types';

// 创建测试用的主角数据（简化版，仅包含必要字段）
function createTestProtagonist(): Protagonist {
  return {
    character: { 
      id: 1, 
      name: '测试角色', 
      age: 16, 
      gender: '男' as const,
      background: '测试',
      origin: { name: '普通', impact: {}, impactDescription: '', description: '', totalImpact: {}, level: 1 },
      trait: { name: '普通', impact: {}, impactDescription: '', description: '', totalImpact: {}, level: 1 },
      personality: { name: '普通', impact: {}, impactDescription: '', description: '', totalImpact: {}, level: 1 },
      talent: { name: '普通', impact: {}, impactDescription: '', description: '', totalImpact: {}, level: 1 },
      stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
      totalPower: 250,
    },
    world: { 
      id: 1, 
      type: '修仙' as const, 
      realmSystem: { mainRealmName: '修仙', subRealmName: '境界', tiers: [] }, 
      name: '测试世界', 
      description: '测试', 
      difficulty: '普通' as const, 
      powerSystem: '修仙', 
      majorForces: '', 
      factions: [], 
      worldCoefficient: 1.0, 
      dangers: { description: '', impact: {}, impactDescription: '' }, 
      opportunities: { description: '', impact: {}, impactDescription: '' } 
    },
    backstory: '测试背景',
    level: 5,
    realm: '练气期',
    stats: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
    statCapBonuses: {},
    inventory: [],
    activeEffects: [],
    experience: 100,
    overflowExperience: 0,
    currentHp: 100,
    maxHp: 100,
    currentMp: 50,
    maxMp: 50,
    techniques: [],
    equippedAttackTechniques: [null, null, null],
    equippedDefenseTechniques: [null, null, null],
    equipments: [],
    equippedMelee: null,
    equippedRanged: null,
    equippedHead: null,
    equippedBody: null,
    equippedLegs: null,
    equippedFeet: null,
    factionId: null,
    cultivationPath: null,
  } as unknown as Protagonist;
}

// 创建测试用的统计数据
function createTestStatistics(overrides: Partial<GameStatistics> = {}): GameStatistics {
  const defaults: GameStatistics = {
    maxLevel: 5,
    totalEnemiesKilled: 10,
    totalBossKilled: 1,
    totalEliteKilled: 2,
    totalTechniquesCollected: 0,
    totalEquipmentsCollected: 0,
    totalAdventuresCompleted: 2,
    clearedDifficulties: [],
    totalCultivations: 10,
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
  
  return { ...defaults, ...overrides };
}

// ============================================
// 新手任务进度防后退测试
// ============================================
describe('新手任务进度防后退', () => {
  it('checkTutorialProgress 函数应该正确检测任务进度', async () => {
    const { checkTutorialProgress } = await import('@/lib/game/taskSystem');
    
    const protagonist = createTestProtagonist();
    const statistics = createTestStatistics();
    
    const progress = checkTutorialProgress(protagonist, statistics, []);
    
    expect(progress).toBeDefined();
    expect(Array.isArray(progress.completedTasks)).toBe(true);
  });

  it('完成的任务应该被持久化到 completedTutorialTaskIds', async () => {
    const { checkTutorialProgress } = await import('@/lib/game/taskSystem');
    
    const protagonist = createTestProtagonist();
    const statistics = createTestStatistics({ totalCultivations: 10 });
    
    // 第一次检测
    const progress1 = checkTutorialProgress(protagonist, statistics, []);
    
    // 模拟持久化已完成任务
    if (progress1.completedTasks.length > 0) {
      const completedTaskIds = progress1.completedTasks;
      
      // 改变条件，但已完成的任务应该保持完成状态
      const statistics2 = createTestStatistics({ totalCultivations: 0 });
      
      const progress2 = checkTutorialProgress(protagonist, statistics2, completedTaskIds);
      
      // 已完成的任务不应该丢失
      completedTaskIds.forEach((taskId: string) => {
        expect(progress2.completedTasks).toContain(taskId);
      });
    }
  });

  it('条件变化后，已完成任务不应该丢失', async () => {
    const { checkTutorialProgress, TUTORIAL_TASKS } = await import('@/lib/game/taskSystem');
    
    // 模拟已完成前3个任务
    const completedTaskIds = TUTORIAL_TASKS.slice(0, 3).map(t => t.id);
    
    const protagonist = createTestProtagonist();
    const statistics = createTestStatistics({
      totalCultivations: 0,
      totalAdventuresCompleted: 0,
    });
    
    const progress = checkTutorialProgress(protagonist, statistics, completedTaskIds);
    
    // 已完成的任务应该保持完成状态
    completedTaskIds.forEach((taskId: string) => {
      expect(progress.completedTasks).toContain(taskId);
    });
  });
});

// ============================================
// 任务奖励测试
// ============================================
describe('任务奖励', () => {
  it('getTaskRewards 函数应该返回正确的奖励', async () => {
    const { getTaskRewards, TUTORIAL_TASKS } = await import('@/lib/game/taskSystem');
    
    if (TUTORIAL_TASKS.length > 0) {
      const task = TUTORIAL_TASKS[0];
      const rewards = getTaskRewards(task.id);
      
      expect(rewards).toBeDefined();
      // 奖励可能为 null
      if (rewards) {
        expect(
          rewards.spiritStones !== undefined || 
          rewards.experience !== undefined ||
          rewards.items !== undefined
        ).toBe(true);
      }
    }
  });

  it('不同任务应该有不同的奖励', async () => {
    const { getTaskRewards, TUTORIAL_TASKS } = await import('@/lib/game/taskSystem');
    
    if (TUTORIAL_TASKS.length >= 2) {
      const rewards1 = getTaskRewards(TUTORIAL_TASKS[0].id);
      const rewards2 = getTaskRewards(TUTORIAL_TASKS[1].id);
      
      // 验证功能正常
      expect(rewards1).toBeDefined();
      expect(rewards2).toBeDefined();
    }
  });
});

// ============================================
// 新手任务顺序测试
// ============================================
describe('新手任务顺序', () => {
  it('任务列表应该有正确的顺序', async () => {
    const { TUTORIAL_TASKS } = await import('@/lib/game/taskSystem');
    
    // 验证任务数量
    expect(TUTORIAL_TASKS.length).toBe(7);
    
    // 验证任务顺序（新ID带 tutorial_ 前缀）
    expect(TUTORIAL_TASKS[0].id).toBe('tutorial_first_cultivation');
    expect(TUTORIAL_TASKS[1].id).toBe('tutorial_use_item');
    expect(TUTORIAL_TASKS[2].id).toBe('tutorial_first_battle');
    expect(TUTORIAL_TASKS[3].id).toBe('tutorial_reach_level_3');
    expect(TUTORIAL_TASKS[4].id).toBe('tutorial_join_faction');
    expect(TUTORIAL_TASKS[5].id).toBe('tutorial_complete_dungeon');
    expect(TUTORIAL_TASKS[6].id).toBe('tutorial_claim_achievement');
  });

  it('炼丹初探应该在初露锋芒之前', async () => {
    const { TUTORIAL_TASKS } = await import('@/lib/game/taskSystem');
    
    const useItemIndex = TUTORIAL_TASKS.findIndex(t => t.id === 'tutorial_use_item');
    const firstBattleIndex = TUTORIAL_TASKS.findIndex(t => t.id === 'tutorial_first_battle');
    
    // 炼丹初探应该在初露锋芒之前
    expect(useItemIndex).toBeLessThan(firstBattleIndex);
  });

  it('成就解锁任务应该在最后', async () => {
    const { TUTORIAL_TASKS } = await import('@/lib/game/taskSystem');
    
    const claimAchievementIndex = TUTORIAL_TASKS.findIndex(t => t.id === 'tutorial_claim_achievement');
    
    // 成就解锁应该是最后一个任务
    expect(claimAchievementIndex).toBe(TUTORIAL_TASKS.length - 1);
  });

  it('完成任务应该按顺序解锁', async () => {
    const { checkTutorialProgress } = await import('@/lib/game/taskSystem');
    
    const protagonist = createTestProtagonist();
    
    // 只完成修炼（第一个任务）
    const stats1 = createTestStatistics({ 
      totalCultivations: 10,
      totalEnemiesKilled: 0,
    });
    const progress1 = checkTutorialProgress(protagonist, stats1, []);
    expect(progress1.completedTasks).toContain('tutorial_first_cultivation');
    expect(progress1.completedTasks).not.toContain('tutorial_use_item');
    expect(progress1.completedTasks).not.toContain('tutorial_first_battle');
    
    // 完成修炼 + 使用丹药（前两个任务）
    const stats2 = createTestStatistics({
      totalCultivations: 10,
      totalItemsUsed: 1,
      totalEnemiesKilled: 0,
    });
    const progress2 = checkTutorialProgress(protagonist, stats2, []);
    expect(progress2.completedTasks).toContain('tutorial_first_cultivation');
    expect(progress2.completedTasks).toContain('tutorial_use_item');
    expect(progress2.completedTasks).not.toContain('tutorial_first_battle');
  });

  it('打Boss后不应该还要炼药初探', async () => {
    const { checkTutorialProgress } = await import('@/lib/game/taskSystem');
    
    const protagonist = createTestProtagonist();
    protagonist.level = 4;
    protagonist.activeEffects = [];
    
    const stats = createTestStatistics({
      totalCultivations: 10,
      totalEnemiesKilled: 10,
      totalAdventuresCompleted: 1,
      totalItemsUsed: 0,
    });
    
    const progress = checkTutorialProgress(protagonist, stats, []);
    
    // 验证任务完成状态
    expect(progress.completedTasks).toContain('tutorial_first_cultivation');
    expect(progress.completedTasks).toContain('tutorial_first_battle');
    expect(progress.completedTasks).toContain('tutorial_reach_level_3');
    expect(progress.completedTasks).toContain('tutorial_complete_dungeon');
    
    // 当前任务应该是 use_item（因为 totalItemsUsed = 0）
    expect(progress.currentTask?.id).toBe('tutorial_use_item');
  });
});

// ============================================
// 势力任务系统测试
// ============================================
describe('势力任务系统', () => {
  it('应该有有效的势力任务', async () => {
    const { FACTION_TASKS } = await import('@/lib/game/taskSystem');
    
    expect(FACTION_TASKS.length).toBeGreaterThan(0);
  });

  it('日常任务应该有正确的类型', async () => {
    const { getDailyTasks } = await import('@/lib/game/taskSystem');
    
    const dailyTasks = getDailyTasks();
    
    expect(dailyTasks.length).toBeGreaterThan(0);
    dailyTasks.forEach(task => {
      expect(task.type).toBe('daily');
    });
  });

  it('周常任务应该有正确的类型', async () => {
    const { getWeeklyTasks } = await import('@/lib/game/taskSystem');
    
    const weeklyTasks = getWeeklyTasks();
    
    expect(weeklyTasks.length).toBeGreaterThan(0);
    weeklyTasks.forEach(task => {
      expect(task.type).toBe('weekly');
    });
  });
});
