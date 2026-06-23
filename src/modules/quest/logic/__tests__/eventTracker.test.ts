/**
 * eventTracker 单元测试
 */
import { describe, it, expect } from 'vitest';

import type { GameEvent } from '@/core/events';
import type { QuestState, ActiveQuest, QuestStage, QuestDefinition } from '@/core/types';
import { createDefaultQuestState } from '@/core/types';

import { matchEventToObjectives, applyEventToQuests } from '../eventTracker';

// ============================================
// 测试数据
// ============================================

function makeStage(overrides: Partial<QuestStage> = {}): QuestStage {
  return {
    id: 'stage_1',
    name: '阶段1',
    description: '',
    objectives: [
      { type: 'kill_enemy', target: 'slime', count: 3, description: '击败史莱姆 x3' },
      { type: 'collect_item', target: 'herb', count: 2, description: '收集药草 x2' },
    ],
    completions: { done: { description: '完成' } },
    ...overrides,
  };
}

function makeActive(): ActiveQuest {
  return { questId: 'q1', currentStageId: 'stage_1', objectives: {}, startedAt: Date.now() };
}

function makeKillEvent(enemyId: string): GameEvent {
  return { type: 'combat:enemy_killed', timestamp: Date.now(), payload: { enemyId } };
}

function makeCollectEvent(itemId: string): GameEvent {
  return { type: 'item:obtained', timestamp: Date.now(), payload: { templateId: itemId } };
}

// ============================================
// matchEventToObjectives
// ============================================

describe('matchEventToObjectives', () => {
  it('kill 事件应匹配到 kill_enemy 目标', () => {
    const stage = makeStage();
    const active = makeActive();
    const event = makeKillEvent('slime');

    const matches = matchEventToObjectives(event, active, stage);
    expect(matches.length).toBe(1);
    expect(matches[0].key).toBe('kill_enemy:slime');
    expect(matches[0].delta).toBe(1);
  });

  it('不匹配的 kill 事件不应匹配', () => {
    const stage = makeStage();
    const active = makeActive();
    const event = makeKillEvent('wolf');

    const matches = matchEventToObjectives(event, active, stage);
    expect(matches.length).toBe(0);
  });

  it('collect 事件应匹配到 collect_item 目标', () => {
    const stage = makeStage();
    const active = makeActive();
    const event = makeCollectEvent('herb');

    const matches = matchEventToObjectives(event, active, stage);
    expect(matches.length).toBe(1);
    expect(matches[0].key).toBe('collect_item:herb');
  });

  it('达到所需数量时 delta 应补齐', () => {
    const stage = makeStage();
    const active: ActiveQuest = {
      ...makeActive(),
      objectives: { 'kill_enemy:slime': 2 }, // 已击杀 2/3
    };
    const event = makeKillEvent('slime');

    const matches = matchEventToObjectives(event, active, stage);
    expect(matches[0].delta).toBe(1); // 补齐到 3
  });

  it('已达上限时不再匹配', () => {
    const stage = makeStage();
    const active: ActiveQuest = {
      ...makeActive(),
      objectives: { 'kill_enemy:slime': 3 }, // 已达上限
    };
    const event = makeKillEvent('slime');

    const matches = matchEventToObjectives(event, active, stage);
    expect(matches.length).toBe(0);
  });

  it('隐藏目标也应匹配', () => {
    const stage = makeStage({
      objectives: [
        { type: 'kill_enemy', target: 'boss', count: 1, description: '隐藏boss', hidden: true },
      ],
    });
    const active = makeActive();
    const event = makeKillEvent('boss');

    const matches = matchEventToObjectives(event, active, stage);
    expect(matches.length).toBe(1);
  });
});

// ============================================
// applyEventToQuests
// ============================================

describe('applyEventToQuests', () => {
  it('无活跃任务时不报错', () => {
    const qs = createDefaultQuestState();
    const event = makeKillEvent('slime');
    const result = applyEventToQuests(event, qs);
    expect(result.newlyCompletedQuestIds).toEqual([]);
  });
});
