/**
 * questEngine 测试
 *
 * 测试前置条件校验、阶段完成、任务状态管理等核心逻辑。
 */

import { describe, it, expect } from 'vitest';

import { createDefaultQuestState } from '@/core/types';
import type {
  QuestDefinition,
  QuestStage,
  ActiveQuest,
  QuestState,
} from '@/core/types';

import {
  checkPrerequisites,
  checkSinglePrerequisite,
  checkStageCompletion,
  completeStage,
  completeQuest,
  startQuest,
  updateObjectiveProgress,
} from '../questEngine';

import type { PlayerCheckData } from '../questEngine';

// ============================================
// 测试数据工厂
// ============================================

const defaultPlayer: PlayerCheckData = {
  level: 5,
  realm: '筑基',
  factionId: 'righteous_sect',
  attitudes: { merchant_wang: 30 },
  coreStats: { intelligence: 14, willpower: 10, perception: 12 },
  attributes: { constitution: 10, insight: 12 },
  inventoryItemIds: ['healing_pill_low'],
};

const twoStageQuest: QuestDefinition = {
  id: 'test_quest',
  name: '测试任务',
  description: '测试用',
  type: 'side',
  prerequisites: [],
  stages: [
    {
      id: 'stage_1',
      name: '第一阶段',
      description: '收集物品',
      objectives: [
        { type: 'collect_item', target: 'herb', count: 3, description: '采集 3 株药草' },
      ],
      completions: {
        done: { description: '继续', nextStageId: 'stage_2' },
      },
    },
    {
      id: 'stage_2',
      name: '第二阶段',
      description: '提交物品',
      objectives: [
        { type: 'talk_to_npc', target: 'merchant_wang', count: 1, description: '找王掌柜' },
      ],
      completions: {
        done: { description: '完成任务' },
      },
    },
  ],
  rewards: [{ experience: 100 }],
  repeatable: false,
};

// ============================================
// checkSinglePrerequisite
// ============================================

describe('checkSinglePrerequisite', () => {
  it('level 条件：达标时通过', () => {
    const result = checkSinglePrerequisite(
      { type: 'level', target: '3' },
      defaultPlayer,
    );
    expect(result.passed).toBe(true);
  });

  it('level 条件：不达标时失败并提示', () => {
    const result = checkSinglePrerequisite(
      { type: 'level', target: '10' },
      defaultPlayer,
    );
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('需要等级 10');
  });

  it('faction 条件：匹配时通过', () => {
    const result = checkSinglePrerequisite(
      { type: 'faction', target: 'righteous_sect' },
      defaultPlayer,
    );
    expect(result.passed).toBe(true);
  });

  it('faction 条件：不匹配时失败', () => {
    const result = checkSinglePrerequisite(
      { type: 'faction', target: 'demon_beasts' },
      defaultPlayer,
    );
    expect(result.passed).toBe(false);
  });

  it('coreStat 条件：达标时通过', () => {
    const result = checkSinglePrerequisite(
      { type: 'coreStat', target: 'intelligence', minValue: 12 },
      defaultPlayer,
    );
    expect(result.passed).toBe(true);
  });

  it('coreStat 条件：不达标时失败并提示', () => {
    const result = checkSinglePrerequisite(
      { type: 'coreStat', target: 'intelligence', minValue: 20 },
      defaultPlayer,
    );
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('intelligence');
  });

  it('item_owned 条件：拥有时通过', () => {
    const result = checkSinglePrerequisite(
      { type: 'item_owned', target: 'healing_pill_low' },
      defaultPlayer,
    );
    expect(result.passed).toBe(true);
  });

  it('item_owned 条件：未拥有时失败', () => {
    const result = checkSinglePrerequisite(
      { type: 'item_owned', target: 'legendary_sword' },
      defaultPlayer,
    );
    expect(result.passed).toBe(false);
  });

  it('attitude 条件：达标时通过', () => {
    const result = checkSinglePrerequisite(
      { type: 'attitude', target: 'merchant_wang', minValue: 20 },
      defaultPlayer,
    );
    expect(result.passed).toBe(true);
  });
});

// ============================================
// checkPrerequisites
// ============================================

describe('checkPrerequisites', () => {
  it('所有条件满足时通过', () => {
    const quest: QuestDefinition = {
      ...twoStageQuest,
      prerequisites: [
        { type: 'level', target: '3' },
        { type: 'faction', target: 'righteous_sect' },
      ],
    };
    const result = checkPrerequisites(quest, defaultPlayer, createDefaultQuestState());
    expect(result.passed).toBe(true);
  });

  it('首个不满足条件被返回', () => {
    const quest: QuestDefinition = {
      ...twoStageQuest,
      prerequisites: [
        { type: 'level', target: '20' },
        { type: 'faction', target: 'righteous_sect' },
      ],
    };
    const result = checkPrerequisites(quest, defaultPlayer, createDefaultQuestState());
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('需要等级 20');
  });

  it('quest_completed 条件：已完成时通过', () => {
    const quest: QuestDefinition = {
      ...twoStageQuest,
      prerequisites: [
        { type: 'quest_completed', target: 'intro_quest' },
      ],
    };
    const qs = { ...createDefaultQuestState(), completedQuestIds: ['intro_quest'] };
    const result = checkPrerequisites(quest, defaultPlayer, qs);
    expect(result.passed).toBe(true);
  });
});

// ============================================
// stage completion & quest flow
// ============================================

describe('任务流程', () => {
  it('startQuest 进入第一个 stage', () => {
    const qs = createDefaultQuestState();
    const next = startQuest('test_quest', twoStageQuest, qs);
    expect(next.activeQuests['test_quest']).toBeDefined();
    expect(next.activeQuests['test_quest'].currentStageId).toBe('stage_1');
  });

  it('updateObjectiveProgress 增加进度', () => {
    const active: ActiveQuest = {
      questId: 'test_quest',
      currentStageId: 'stage_1',
      objectives: {},
      startedAt: Date.now(),
    };
    const updated = updateObjectiveProgress(active, 'collect_item', 'herb', 2);
    expect(updated.objectives['collect_item:herb']).toBe(2);
  });

  it('checkStageCompletion：目标全部完成时返回 true', () => {
    const stage = twoStageQuest.stages[0];
    const active: ActiveQuest = {
      questId: 'test_quest',
      currentStageId: 'stage_1',
      objectives: { 'collect_item:herb': 3 },
      startedAt: Date.now(),
    };
    expect(checkStageCompletion(stage, active)).toBe(true);
  });

  it('checkStageCompletion：目标未完成时返回 false', () => {
    const stage = twoStageQuest.stages[0];
    const active: ActiveQuest = {
      questId: 'test_quest',
      currentStageId: 'stage_1',
      objectives: { 'collect_item:herb': 1 },
      startedAt: Date.now(),
    };
    expect(checkStageCompletion(stage, active)).toBe(false);
  });

  it('checkStageCompletion：隐藏目标不影响完成判定', () => {
    const stage: QuestStage = {
      id: 's1',
      name: 'Stage',
      description: '',
      objectives: [
        { type: 'collect_item', target: 'herb', count: 1, description: '可见目标' },
        { type: 'kill_enemy', target: 'boss', count: 1, description: '隐藏目标', hidden: true },
      ],
      completions: { done: { description: 'done' } },
    };
    const active: ActiveQuest = {
      questId: 'q',
      currentStageId: 's1',
      objectives: { 'collect_item:herb': 1 },
      startedAt: Date.now(),
    };
    expect(checkStageCompletion(stage, active)).toBe(true);
  });

  it('completeStage：有下一阶段时不标记为 completed', () => {
    const active: ActiveQuest = {
      questId: 'test_quest',
      currentStageId: 'stage_1',
      objectives: { 'collect_item:herb': 3 },
      startedAt: Date.now(),
    };
    const { activeQuest, completed } = completeStage(twoStageQuest, active, 'done');
    expect(completed).toBe(false);
    expect(activeQuest.currentStageId).toBe('stage_2');
  });

  it('completeStage：最后阶段标记为 completed', () => {
    const active: ActiveQuest = {
      questId: 'test_quest',
      currentStageId: 'stage_2',
      objectives: { 'talk_to_npc:merchant_wang': 1 },
      startedAt: Date.now(),
    };
    const { completed } = completeStage(twoStageQuest, active, 'done');
    expect(completed).toBe(true);
  });

  it('completeQuest：从活跃列表移除，加入已完成列表', () => {
    const qs: QuestState = {
      ...createDefaultQuestState(),
      activeQuests: {
        test_quest: {
          questId: 'test_quest',
          currentStageId: 'stage_2',
          objectives: {},
          startedAt: Date.now(),
        },
      },
    };
    const next = completeQuest('test_quest', qs);
    expect(next.activeQuests['test_quest']).toBeUndefined();
    expect(next.completedQuestIds).toContain('test_quest');
  });
});
