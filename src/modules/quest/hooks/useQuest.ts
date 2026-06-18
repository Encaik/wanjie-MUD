/**
 * useQuest — 统一任务系统 Hook
 *
 * 连接 QuestRegistry / StoryLineRegistry / BoardRegistry → GameState.questState，
 * 提供任务接取、手动领奖、板块刷新、故事线查询等全部操作。
 *
 * @module modules/quest/hooks
 */

import { useCallback, useEffect, useRef } from 'react';

import { gameEventBus } from '@/core/events';
import { BoardRegistry } from '@/core/registry/BoardRegistry';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import { StoryLineRegistry } from '@/core/registry/StoryLineRegistry';
import type { GameState, QuestState, QuestDefinition } from '@/core/types';
import { injectQuestOptions } from '@/modules/npc/logic/dialogueEngine';
import type { InjectedQuestOptions } from '@/modules/npc/logic/dialogueEngine';

import {
  needsRefresh,
  refreshBoard,
  getBoardUIState,
} from '../logic/boardEngine';
import { createQuestTracker } from '../logic/eventTracker';
import {
  checkPrerequisites,
  startQuest,
  completeStage,
  completeQuest,
  getActiveQuestForNPC,
} from '../logic/questEngine';
import { calculateStaticQuestRewards } from '../logic/rewardDistributor';
import {
  getNextQuestIds,
  getStoryProgress,
  markNodeCompleted,
} from '../logic/storyEngine';

import type { BoardUIState } from '../logic/boardEngine';
import type { PlayerCheckData } from '../logic/questEngine';

// ============================================
// 辅助
// ============================================

function extractPlayerCheckData(state: GameState): PlayerCheckData {
  const p = state.protagonist;
  return {
    level: p?.level ?? 1,
    realm: p?.realm ?? '凡人',
    factionId: p?.factionId ?? null,
    attitudes: {},
    coreStats: (p?.v3CoreStats ?? {}) as Record<string, number>,
    attributes: (p?.v3Attributes ?? {}) as Record<string, number>,
    inventoryItemIds: (p?.inventory ?? []).map(i => i.definition?.id ?? i.id).filter(Boolean),
  };
}

// ============================================
// Hook 返回类型
// ============================================

export interface UseQuestReturn {
  // NPC 对话集成
  injectForNPC: (npcId: string) => InjectedQuestOptions;
  // 任务操作
  acceptQuest: (questId: string) => QuestState;
  turnInQuest: (questId: string, completionKey: string) => { questState: QuestState; completed: boolean };
  claimQuestReward: (questId: string) => { success: boolean; rewardMessage: string };
  // 故事线
  getStorylineQuestIds: (storylineId: string) => string[];
  getStoryProgress: (storylineId: string) => ReturnType<typeof getStoryProgress> | null;
  // 板块操作
  refreshBoardIfNeeded: (boardId: string) => void;
  getBoardUIState: (boardId: string) => BoardUIState;
  getBoardQuests: (boardId: string) => QuestDefinition[];
  // 弹窗
  hasViewedDialog: (questId: string) => boolean;
  markDialogViewed: (questId: string) => void;
}

// ============================================
// Hook
// ============================================

export function useQuest(
  gameState: GameState,
  setGameState: (updater: (prev: GameState) => GameState) => void,
): UseQuestReturn {
  const worldviewId = gameState.selectedWorld?.worldviewId ?? '';
  const questState = gameState.questState;

  const getPlayerData = useCallback(() => extractPlayerCheckData(gameState), [gameState]);

  // ============================================
  // 事件追踪器初始化（仅在挂载时注册一次，通过 ref 获取最新 questState）
  // ============================================

  const questStateRef = useRef(gameState.questState);

  useEffect(() => {
    questStateRef.current = gameState.questState;
  });

  useEffect(() => {
    const tracker = createQuestTracker(
      (updater) => {
        setGameState(prev => ({
          ...prev,
          questState: updater(prev.questState),
        }));
      },
      () => questStateRef.current,
    );

    gameEventBus.on('*', tracker);

    return () => {
      gameEventBus.off('*', tracker);
    };
     
  }, [setGameState]); // 仅在挂载时注册一次，通过 ref 获取最新状态

  // ============================================
  // NPC 对话集成
  // ============================================

  const injectForNPC = useCallback((npcId: string): InjectedQuestOptions => {
    const player = getPlayerData();
    const registry = QuestRegistry.getInstance();

    const availableQuests = registry.getAvailableQuests(
      worldviewId,
      questState,
      (q) => checkPrerequisites(q, player, questState).passed,
    ).filter(q => {
      const pool = gameState.selectedWorld?.questPool;
      if (pool && pool.length > 0) return pool.includes(q.id);
      return true;
    }).filter(q =>
      q.stages.some(s =>
        s.objectives.some(o => o.type === 'talk_to_npc' && o.target === npcId)
        || s.npcDialogueOnEnter?.npcId === npcId
      )
    );

    const turnInQuests = getActiveQuestForNPC(
      npcId,
      (id) => registry.getById(id),
      questState,
    );

    return injectQuestOptions(npcId, questState, availableQuests, turnInQuests);
  }, [worldviewId, questState, gameState.selectedWorld?.questPool, getPlayerData]);

  // ============================================
  // 任务操作
  // ============================================

  const acceptQuest = useCallback((questId: string): QuestState => {
    const quest = QuestRegistry.getInstance().getById(questId);
    if (!quest) return questState;

    const newQuestState = startQuest(questId, quest, {
      ...questState,
      acceptedTimestamps: {
        ...questState.acceptedTimestamps,
        [questId]: Date.now(),
      },
    });

    setGameState(prev => ({ ...prev, questState: newQuestState }));
    return newQuestState;
  }, [questState, setGameState]);

  const turnInQuest = useCallback((questId: string, completionKey: string) => {
    const quest = QuestRegistry.getInstance().getById(questId);
    const active = questState.activeQuests[questId];
    if (!quest || !active) return { questState, completed: false };

    const { activeQuest, completed } = completeStage(quest, active, completionKey);
    let newQuestState: QuestState;

    if (completed) {
      newQuestState = completeQuest(questId, {
        ...questState,
        activeQuests: { ...questState.activeQuests, [questId]: activeQuest },
        completedTimestamps: {
          ...questState.completedTimestamps,
          [questId]: Date.now(),
        },
      });

      // 标记故事线节点完成
      if (quest.storylineId) {
        const storyline = StoryLineRegistry.getInstance().getById(quest.storylineId);
        if (storyline) {
          const allNodes = storyline.rootNodes.flatMap(n => [n, ...(n.children ?? [])]);
          const node = allNodes.find(n => n.questId === questId);
          if (node) {
            newQuestState = markNodeCompleted(storyline, node.id, newQuestState);
          }
        }
      }
    } else {
      newQuestState = {
        ...questState,
        activeQuests: { ...questState.activeQuests, [questId]: activeQuest },
      };
    }

    setGameState(prev => ({ ...prev, questState: newQuestState }));
    return { questState: newQuestState, completed };
  }, [questState, setGameState]);

  /**
   * 手动领取任务奖励
   *
   * 检查任务是否已完成且未领取，然后计算并返回奖励信息。
   * 调用方需要自行发放物品/货币/经验到玩家身上。
   */
  const claimQuestReward = useCallback((questId: string): { success: boolean; rewardMessage: string } => {
    if (!questState.completedQuestIds.includes(questId)) {
      return { success: false, rewardMessage: '任务未完成，无法领取奖励' };
    }
    if (questState.claimedQuestIds.includes(questId)) {
      return { success: false, rewardMessage: '奖励已领取' };
    }

    const quest = QuestRegistry.getInstance().getById(questId);
    if (!quest) {
      return { success: false, rewardMessage: '任务数据不存在' };
    }

    // 收集阶段奖励
    const stageRewards = quest.stages
      .map(s => Object.values(s.completions))
      .flat()
      .filter(c => c.stageRewards)
      .flatMap(c => c.stageRewards ?? []);

    const result = calculateStaticQuestRewards(quest.rewards, stageRewards);

    // 标记为已领取
    setGameState(prev => ({
      ...prev,
      questState: {
        ...prev.questState,
        claimedQuestIds: [...prev.questState.claimedQuestIds, questId],
      },
    }));

    return { success: true, rewardMessage: result.message };
  }, [questState, setGameState]);

  // ============================================
  // 故事线查询
  // ============================================

  const getStorylineQuestIds = useCallback((storylineId: string): string[] => {
    const storyline = StoryLineRegistry.getInstance().getById(storylineId);
    if (!storyline) return [];

    return getNextQuestIds(
      storyline,
      questState,
      gameState.protagonist?.level ?? 1,
      gameState.protagonist?.realm ?? '',
    );
  }, [questState, gameState.protagonist]);

  const queryStoryProgress = useCallback((storylineId: string) => {
    const storyline = StoryLineRegistry.getInstance().getById(storylineId);
    if (!storyline) return null;
    return getStoryProgress(storyline, questState);
  }, [questState]);

  // ============================================
  // 板块操作
  // ============================================

  const refreshBoardIfNeeded = useCallback((boardId: string) => {
    const board = BoardRegistry.getInstance().getById(boardId);
    if (!board) return;

    const now = Date.now();
    if (!needsRefresh(board, questState.boardLastRefresh, now)) return;

    const rng = () => Math.random();
    const { boardSlots, boardLastRefresh } = refreshBoard(board, questState, now, rng);

    setGameState(prev => ({
      ...prev,
      questState: {
        ...prev.questState,
        boardSlots: { ...prev.questState.boardSlots, [board.id]: boardSlots[board.id] ? {
          questIds: boardSlots[board.id],
          lastRefresh: boardLastRefresh[board.id],
        } : prev.questState.boardSlots[board.id] },
        boardLastRefresh: { ...prev.questState.boardLastRefresh, ...boardLastRefresh },
      },
    }));
  }, [questState, setGameState]);

  const getBoardState = useCallback((boardId: string): BoardUIState => {
    const board = BoardRegistry.getInstance().getById(boardId);
    if (!board) return 'locked';

    const isUnlocked = !board.unlockConditions || board.unlockConditions.length === 0
      || board.unlockConditions.every(c => {
        if (c.type === 'quest_completed') return questState.completedQuestIds.includes(c.target);
        if (c.type === 'faction') return !!gameState.currentFactionId;
        if (c.type === 'level') return (gameState.protagonist?.level ?? 0) >= Number(c.target);
        return false;
      });

    return getBoardUIState(board, questState, isUnlocked);
  }, [questState, gameState.currentFactionId, gameState.protagonist]);

  const getBoardQuests = useCallback((boardId: string): QuestDefinition[] => {
    const board = BoardRegistry.getInstance().getById(boardId);
    if (!board) return [];

    const slots = questState.boardSlots[boardId]?.questIds ?? [];
    const registry = QuestRegistry.getInstance();

    return slots
      .map(id => registry.getById(id))
      .filter((q): q is QuestDefinition => !!q);
  }, [questState]);

  // ============================================
  // 弹窗
  // ============================================

  const hasViewedDialogFn = useCallback((questId: string): boolean => {
    return questState.viewedDialogQuestIds.includes(questId);
  }, [questState.viewedDialogQuestIds]);

  const markDialogViewedFn = useCallback((questId: string) => {
    if (questState.viewedDialogQuestIds.includes(questId)) return;
    setGameState(prev => ({
      ...prev,
      questState: {
        ...prev.questState,
        viewedDialogQuestIds: [...prev.questState.viewedDialogQuestIds, questId],
      },
    }));
  }, [questState.viewedDialogQuestIds, setGameState]);

  return {
    injectForNPC,
    acceptQuest,
    turnInQuest,
    claimQuestReward,
    getStorylineQuestIds,
    getStoryProgress: queryStoryProgress,
    refreshBoardIfNeeded,
    getBoardUIState: getBoardState,
    getBoardQuests,
    hasViewedDialog: hasViewedDialogFn,
    markDialogViewed: markDialogViewedFn,
  };
}
