/**
 * storyEngine 单元测试
 */
import { describe, it, expect } from 'vitest';
import { createDefaultQuestState } from '@/core/types';
import type { StoryLine, StoryNode, QuestState } from '@/core/types';
import {
  findNodeById,
  getAllLeafQuestIds,
  flattenNodes,
  isNodeUnlockable,
  getNextQuestIds,
  getStoryProgress,
  markNodeCompleted,
} from '../storyEngine';

// ============================================
// 测试数据
// ============================================

function makeTestStoryline(): StoryLine {
  const questNodes: StoryNode[] = [
    { id: 'n_q1', name: '任务1', type: 'quest_ref', order: 1, questId: 'q1' },
    { id: 'n_q2', name: '任务2', type: 'quest_ref', order: 2, questId: 'q2' },
    { id: 'n_q3', name: '任务3', type: 'quest_ref', order: 3, questId: 'q3' },
    { id: 'n_q4', name: '任务4', type: 'quest_ref', order: 4, questId: 'q4',
      unlockCondition: { type: 'level', target: '5' } },
  ];

  return {
    id: 'test_story',
    name: '测试故事线',
    type: 'main',
    rootNodes: [
      {
        id: 'phase_1',
        name: '第一章',
        type: 'phase',
        order: 1,
        children: [
          {
            id: 'section_1',
            name: '第一节',
            type: 'section',
            order: 1,
            children: [questNodes[0], questNodes[1]],
          },
          {
            id: 'section_2',
            name: '第二节',
            type: 'section',
            order: 2,
            children: [questNodes[2], questNodes[3]],
          },
        ],
      },
    ],
  };
}

// ============================================
// findNodeById
// ============================================

describe('findNodeById', () => {
  it('应找到存在的节点', () => {
    const sl = makeTestStoryline();
    expect(findNodeById(sl, 'n_q1')?.name).toBe('任务1');
    expect(findNodeById(sl, 'phase_1')?.name).toBe('第一章');
    expect(findNodeById(sl, 'section_1')?.name).toBe('第一节');
  });

  it('不存在的节点返回 undefined', () => {
    const sl = makeTestStoryline();
    expect(findNodeById(sl, 'nonexistent')).toBeUndefined();
  });
});

// ============================================
// getAllLeafQuestIds
// ============================================

describe('getAllLeafQuestIds', () => {
  it('应收集所有叶子任务 ID', () => {
    const sl = makeTestStoryline();
    const ids = getAllLeafQuestIds(sl);
    expect(ids).toEqual(['q1', 'q2', 'q3', 'q4']);
  });
});

// ============================================
// flattenNodes
// ============================================

describe('flattenNodes', () => {
  it('应展平所有节点（含中间节点）', () => {
    const sl = makeTestStoryline();
    const nodes = flattenNodes(sl);
    const ids = nodes.map(n => n.id);
    expect(ids).toContain('phase_1');
    expect(ids).toContain('section_1');
    expect(ids).toContain('n_q1');
    expect(nodes.length).toBe(7); // 1 phase + 2 sections + 4 quests
  });
});

// ============================================
// isNodeUnlockable
// ============================================

describe('isNodeUnlockable', () => {
  it('无条件的节点始终可解锁', () => {
    const sl = makeTestStoryline();
    const node = findNodeById(sl, 'n_q1')!;
    expect(isNodeUnlockable(node, createDefaultQuestState())).toBe(true);
  });

  it('等级条件满足时解锁', () => {
    const sl = makeTestStoryline();
    const node = findNodeById(sl, 'n_q4')!;
    expect(isNodeUnlockable(node, createDefaultQuestState(), 5)).toBe(true);
  });

  it('等级条件不满足时不解锁', () => {
    const sl = makeTestStoryline();
    const node = findNodeById(sl, 'n_q4')!;
    expect(isNodeUnlockable(node, createDefaultQuestState(), 3)).toBe(false);
  });
});

// ============================================
// getNextQuestIds
// ============================================

describe('getNextQuestIds', () => {
  it('新故事线应返回第一个任务', () => {
    const sl = makeTestStoryline();
    const qs = createDefaultQuestState();
    const next = getNextQuestIds(sl, qs);
    expect(next).toEqual(['q1']);
  });

  it('应跳过已完成的任务，返回下一个', () => {
    const sl = makeTestStoryline();
    const qs: QuestState = {
      ...createDefaultQuestState(),
      completedQuestIds: ['q1'],
      claimedQuestIds: ['q1'],
      storyCompletedNodeIds: ['n_q1'],
    };
    const next = getNextQuestIds(sl, qs);
    expect(next).toEqual(['q2']);
  });

  it('全部完成返回空数组', () => {
    const sl = makeTestStoryline();
    const qs: QuestState = {
      ...createDefaultQuestState(),
      completedQuestIds: ['q1', 'q2', 'q3', 'q4'],
      claimedQuestIds: ['q1', 'q2', 'q3', 'q4'],
      storyCompletedNodeIds: ['n_q1', 'n_q2', 'n_q3', 'n_q4'],
    };
    const next = getNextQuestIds(sl, qs);
    expect(next).toEqual([]);
  });
});

// ============================================
// getStoryProgress
// ============================================

describe('getStoryProgress', () => {
  it('新故事线进度为 0', () => {
    const sl = makeTestStoryline();
    const progress = getStoryProgress(sl, createDefaultQuestState());
    expect(progress.progress).toBe(0);
    expect(progress.allCompleted).toBe(false);
    expect(progress.totalQuestCount).toBe(4);
  });

  it('完成一半任务进度为 0.5', () => {
    const sl = makeTestStoryline();
    const qs: QuestState = {
      ...createDefaultQuestState(),
      completedQuestIds: ['q1', 'q2'],
      storyCompletedNodeIds: ['n_q1', 'n_q2'],
    };
    const progress = getStoryProgress(sl, qs);
    expect(progress.progress).toBe(0.5);
    expect(progress.completedQuestCount).toBe(2);
  });
});

// ============================================
// markNodeCompleted
// ============================================

describe('markNodeCompleted', () => {
  it('应标记节点为已完成', () => {
    const sl = makeTestStoryline();
    const qs = createDefaultQuestState();
    const result = markNodeCompleted(sl, 'n_q1', qs);
    expect(result.storyCompletedNodeIds).toContain('n_q1');
  });

  it('同一父节点下所有子节点完成时自动标记父节点', () => {
    const sl = makeTestStoryline();
    let qs = createDefaultQuestState();
    qs = {
      ...qs,
      completedQuestIds: ['q1', 'q2'],
      storyCompletedNodeIds: ['n_q1'],
    };
    const result = markNodeCompleted(sl, 'n_q2', qs);
    expect(result.storyCompletedNodeIds).toContain('n_q2');
    expect(result.storyCompletedNodeIds).toContain('section_1'); // 自动完成
  });
});
