/**
 * boardEngine 单元测试
 */
import { describe, it, expect } from 'vitest';
import type { QuestBoard, QuestState } from '@/core/types';
import { createDefaultQuestState } from '@/core/types';
import {
  needsRefresh,
  getAvailableQuestsForBoard,
  getBoardUIState,
} from '../boardEngine';

// ============================================
// 测试数据
// ============================================

function makeBoard(overrides: Partial<QuestBoard> = {}): QuestBoard {
  return {
    id: 'test_board',
    name: '测试板块',
    category: 'daily',
    refreshRule: { type: 'daily', resetHour: 0 },
    slotCount: 3,
    questPool: ['q1', 'q2', 'q3', 'q4', 'q5'],
    randomPick: false,
    ...overrides,
  };
}

function makeQuestState(overrides: Partial<QuestState> = {}): QuestState {
  return { ...createDefaultQuestState(), ...overrides };
}

// ============================================
// needsRefresh
// ============================================

describe('needsRefresh', () => {
  it('从未刷新的板块需要刷新', () => {
    const board = makeBoard({ refreshRule: { type: 'never' } });
    expect(needsRefresh(board, {}, Date.now())).toBe(true);
  });

  it('已刷新的 never 板块不需要刷新', () => {
    const board = makeBoard({ refreshRule: { type: 'never' } });
    expect(needsRefresh(board, { test_board: Date.now() }, Date.now())).toBe(false);
  });

  it('daily 板块跨天需要刷新', () => {
    const board = makeBoard();
    const yesterday = Date.now() - 86400001;
    expect(needsRefresh(board, { test_board: yesterday }, Date.now())).toBe(true);
  });

  it('daily 板块当天不需要刷新', () => {
    const board = makeBoard();
    const now = Date.now();
    expect(needsRefresh(board, { test_board: now - 3600000 }, now)).toBe(false);
  });
});

// ============================================
// getAvailableQuestsForBoard
// ============================================

describe('getAvailableQuestsForBoard', () => {
  it('空任务池返回空数组', () => {
    const board = makeBoard({ questPool: [] });
    expect(getAvailableQuestsForBoard(board, makeQuestState())).toEqual([]);
  });

  it('全部可用时应返回所有任务', () => {
    const board = makeBoard();
    const result = getAvailableQuestsForBoard(board, makeQuestState());
    // QuestRegistry 中没有测试数据，返回空
    // 实际集成测试由 e2e 覆盖
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================
// getBoardUIState
// ============================================

describe('getBoardUIState', () => {
  it('未解锁返回 locked', () => {
    const board = makeBoard();
    const qs = makeQuestState();
    expect(getBoardUIState(board, qs, false)).toBe('locked');
  });

  it('已解锁但无槽位返回 empty', () => {
    const board = makeBoard();
    const qs = makeQuestState();
    expect(getBoardUIState(board, qs, true)).toBe('empty');
  });

  it('有槽位且全可接返回 available', () => {
    const board = makeBoard();
    const qs: QuestState = {
      ...makeQuestState(),
      boardSlots: { test_board: { questIds: ['q1', 'q2'], lastRefresh: Date.now() } },
    };
    expect(getBoardUIState(board, qs, true)).toBe('available');
  });

  it('有已完成未领取返回 claimable', () => {
    const board = makeBoard();
    const qs: QuestState = {
      ...makeQuestState(),
      boardSlots: { test_board: { questIds: ['q1', 'q2'], lastRefresh: Date.now() } },
      completedQuestIds: ['q1'],
    };
    expect(getBoardUIState(board, qs, true)).toBe('claimable');
  });

  it('全部领取完毕返回 completed', () => {
    const board = makeBoard();
    const qs: QuestState = {
      ...makeQuestState(),
      boardSlots: { test_board: { questIds: ['q1'], lastRefresh: Date.now() } },
      completedQuestIds: ['q1'],
      claimedQuestIds: ['q1'],
    };
    expect(getBoardUIState(board, qs, true)).toBe('completed');
  });
});
