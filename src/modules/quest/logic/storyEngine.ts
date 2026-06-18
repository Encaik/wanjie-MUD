/**
 * 故事线引擎
 *
 * 管理故事线节点遍历、解锁、进度计算。
 * 纯函数集合，无副作用。
 *
 * @module modules/quest/logic
 */

import type { StoryLine, StoryNode, QuestState } from '@/core/types';

// ============================================
// 节点查询
// ============================================

/** 按 ID 在故事线中查找节点 */
export function findNodeById(
  storyline: StoryLine,
  nodeId: string,
): StoryNode | undefined {
  for (const node of storyline.rootNodes) {
    const found = searchNode(node, nodeId);
    if (found) return found;
  }
  return undefined;
}

/** 递归搜索节点 */
function searchNode(node: StoryNode, targetId: string): StoryNode | undefined {
  if (node.id === targetId) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = searchNode(child, targetId);
      if (found) return found;
    }
  }
  return undefined;
}

// ============================================
// 展开与收集
// ============================================

/** 获取故事线中所有叶子任务 ID */
export function getAllLeafQuestIds(storyline: StoryLine): string[] {
  return collectQuestIds(storyline.rootNodes);
}

function collectQuestIds(nodes: StoryNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.type === 'quest_ref' && node.questId) {
      ids.push(node.questId);
    }
    if (node.children) {
      ids.push(...collectQuestIds(node.children));
    }
  }
  return ids;
}

/** 展平所有节点为数组（前序遍历） */
export function flattenNodes(storyline: StoryLine): StoryNode[] {
  return flatten(storyline.rootNodes);
}

function flatten(nodes: StoryNode[]): StoryNode[] {
  const result: StoryNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...flatten(node.children));
    }
  }
  return result;
}

// ============================================
// 解锁检查
// ============================================

/**
 * 检查节点是否可解锁
 *
 * @param node - 故事线节点
 * @param questState - 任务状态
 * @param playerLevel - 玩家等级
 * @param playerRealm - 玩家境界
 */
export function isNodeUnlockable(
  node: StoryNode,
  questState: QuestState,
  playerLevel: number = 0,
  playerRealm: string = '',
): boolean {
  if (!node.unlockCondition) return true;

  const { type, target } = node.unlockCondition;

  switch (type) {
    case 'quest_completed':
      return questState.completedQuestIds.includes(target);
    case 'level':
      return playerLevel >= Number(target);
    case 'realm':
      return playerRealm === target;
    case 'node_completed':
      return questState.storyCompletedNodeIds.includes(target);
    default:
      return true;
  }
}

// ============================================
// 进度查询
// ============================================

/**
 * 获取故事线的下一个可接任务 ID 列表
 *
 * 遍历所有叶子节点，返回第一个未完成且已解锁的 quest_ref 节点
 * 的任务 ID。如果所有节点已完成，返回空数组。
 *
 * @returns 可接取的任务 ID 数组
 */
export function getNextQuestIds(
  storyline: StoryLine,
  questState: QuestState,
  playerLevel: number = 0,
  playerRealm: string = '',
): string[] {
  const allNodes = flattenNodes(storyline);
  const completedNodes = new Set(questState.storyCompletedNodeIds);

  const nextIds: string[] = [];

  for (const node of allNodes) {
    if (node.type !== 'quest_ref' || !node.questId) continue;
    if (completedNodes.has(node.id)) continue;
    if (questState.completedQuestIds.includes(node.questId)) {
      // 任务已完成但节点未标记（可能在迁移）
      if (!questState.claimedQuestIds.includes(node.questId)) {
        continue; // 等待领取
      }
      // 单次任务已领取，标记节点完成
      continue;
    }
    // 任务在进行中
    if (questState.activeQuests[node.questId]) continue;

    if (isNodeUnlockable(node, questState, playerLevel, playerRealm)) {
      nextIds.push(node.questId);
    }
    // 找到第一个未完成的任务后停止（线性故事线）
    break;
  }

  return nextIds;
}

// ============================================
// 进度统计
// ============================================

/** 故事线进度信息 */
export interface StoryProgress {
  /** 已完成 quest_ref 节点数 */
  completedQuestCount: number;
  /** 总 quest_ref 节点数 */
  totalQuestCount: number;
  /** 已完成 phase 数 */
  completedPhaseCount: number;
  /** 总 phase 数 */
  totalPhaseCount: number;
  /** 进度比例 0-1 */
  progress: number;
  /** 是否全部完成 */
  allCompleted: boolean;
  /** 当前进行中的节点 ID */
  currentNodeId?: string;
}

/**
 * 获取故事线整体进度
 */
export function getStoryProgress(
  storyline: StoryLine,
  questState: QuestState,
): StoryProgress {
  const allNodes = flattenNodes(storyline);
  const questNodes = allNodes.filter(n => n.type === 'quest_ref' && n.questId);
  const phaseNodes = allNodes.filter(n => n.type === 'phase');

  const completedQuestCount = questNodes.filter(n =>
    questState.storyCompletedNodeIds.includes(n.id)
    || (n.questId && questState.completedQuestIds.includes(n.questId)),
  ).length;

  const completedPhaseCount = phaseNodes.filter(n =>
    questState.storyCompletedNodeIds.includes(n.id),
  ).length;

  const totalQuestCount = questNodes.length || 1; // 避免除以零

  const allCompleted = completedQuestCount >= questNodes.length;

  // 找到当前（第一个未完成）节点
  const currentNode = questNodes.find(n =>
    !questState.storyCompletedNodeIds.includes(n.id)
    && n.questId
    && !questState.completedQuestIds.includes(n.questId),
  );

  return {
    completedQuestCount,
    totalQuestCount: questNodes.length,
    completedPhaseCount,
    totalPhaseCount: phaseNodes.length,
    progress: Math.min(completedQuestCount / totalQuestCount, 1),
    allCompleted,
    currentNodeId: currentNode?.id,
  };
}

// ============================================
// 状态更新
// ============================================

/**
 * 标记节点为已完成
 *
 * 如果该节点是 quest_ref，且其所有同级节点也已完成，
 * 则自动标记父节点（section/phase）为已完成。
 */
export function markNodeCompleted(
  storyline: StoryLine,
  nodeId: string,
  questState: QuestState,
): QuestState {
  if (questState.storyCompletedNodeIds.includes(nodeId)) return questState;

  const newCompletedIds = [...questState.storyCompletedNodeIds, nodeId];

  // 自动完成父节点
  const node = findNodeById(storyline, nodeId);
  if (node) {
    const parentNode = findParentNode(storyline, nodeId);
    if (parentNode) {
      const siblings = parentNode.children ?? [];
      const allSiblingsDone = siblings.every(s =>
        s.type !== 'quest_ref'
        || newCompletedIds.includes(s.id)
        || (s.questId && questState.completedQuestIds.includes(s.questId)),
      );
      if (allSiblingsDone && !newCompletedIds.includes(parentNode.id)) {
        newCompletedIds.push(parentNode.id);
        // 递归检查祖节点
        return markNodeCompleted(storyline, parentNode.id, {
          ...questState,
          storyCompletedNodeIds: newCompletedIds,
        });
      }
    }
  }

  return {
    ...questState,
    storyCompletedNodeIds: newCompletedIds,
  };
}

/** 查找节点的父节点 */
function findParentNode(
  storyline: StoryLine,
  nodeId: string,
): StoryNode | undefined {
  for (const node of storyline.rootNodes) {
    const found = searchParent(node, nodeId);
    if (found) return found;
  }
  return undefined;
}

function searchParent(
  current: StoryNode,
  targetId: string,
): StoryNode | undefined {
  if (current.children) {
    for (const child of current.children) {
      if (child.id === targetId) return current;
      const found = searchParent(child, targetId);
      if (found) return found;
    }
  }
  return undefined;
}
