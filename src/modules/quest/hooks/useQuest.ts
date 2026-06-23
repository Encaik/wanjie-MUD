/**
 * useQuest — 统一任务系统 Hook
 *
 * 连接 QuestRegistry / StoryLineRegistry / BoardRegistry → GameState.questState，
 * 提供任务接取、手动领奖、板块刷新、故事线查询等全部操作。
 *
 * @module modules/quest/hooks
 */

import { useCallback } from 'react';

import { gameEventBus } from '@/core/events';
import { BoardRegistry } from '@/core/registry/BoardRegistry';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import { StoryLineRegistry } from '@/core/registry/StoryLineRegistry';
import { emitItemObtained, emitSpiritStonesGained } from '@/core/statistics';
import type { GameState, QuestState, QuestDefinition } from '@/core/types';
import { hasTemplate, getTemplate } from '@/modules/item/data';
import { addItem } from '@/modules/item/logic/itemManager';
import { injectQuestOptions } from '@/modules/npc/logic/dialogueEngine';
import type { InjectedQuestOptions } from '@/modules/npc/logic/dialogueEngine';
import { getWorldviewCurrencyItemId } from '@/modules/reward-pool/logic/poolEngine';

import {
  needsRefresh,
  refreshBoard,
  advanceBoardSlot,
  getBoardUIState,
} from '../logic/boardEngine';
import { buildQuestClaimedPayload } from '../logic/eventTracker';
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
    inventoryItemIds: (p?.items ?? []).map(i => i.templateId).filter(Boolean),
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
  // 单个任务状态查询
  getQuestState: (questId: string) => { completed: boolean; claimed: boolean; active: boolean };
  // 弹窗
  hasViewedDialog: (questId: string) => boolean;
  markDialogViewed: (questId: string) => void;
  // 世界观感知
  /** 获取当前世界观的主货币显示名（如"灵石""银两"） */
  getCurrencyName: () => string;
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

  /** 获取当前世界观主货币显示名 */
  const getCurrencyName = useCallback((): string => {
    try {
      const id = getWorldviewCurrencyItemId(worldviewId);
      return getTemplate(id).name;
    } catch { return '灵石'; }
  }, [worldviewId]);

  const getPlayerData = useCallback(() => extractPlayerCheckData(gameState), [gameState]);

  // ============================================
  // 事件追踪器初始化（仅在挂载时注册一次，通过 ref 获取最新 questState）
  // ============================================

  // 注：任务事件追踪器已提升至 GameLayout 层注册（始终挂载，跨页面工作）

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

    let newQuestState = startQuest(questId, quest, {
      ...questState,
      acceptedTimestamps: {
        ...questState.acceptedTimestamps,
        [questId]: Date.now(),
      },
    });

    // 首任务「欢迎来到万界」接取即完成（无实际条件，进入游戏即满足）
    if (questId === 'tutorial_welcome') {
      newQuestState = completeQuest(questId, {
        ...newQuestState,
        completedTimestamps: {
          ...newQuestState.completedTimestamps,
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
    }

    // 任务接取消息
    const isTutorialWelcome = questId === 'tutorial_welcome';

    setGameState(prev => ({
      ...prev,
      questState: newQuestState,
      messages: [{
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          type: 'info' as const,
          title: '任务',
          content: `已接取「${quest.name}」${isTutorialWelcome ? '（自动完成，请在任务面板领取初始物资）' : ''}`,
        } as import('@/core/types').MessageRecord,
        ...(prev.messages ?? []),
      ].slice(0, 100),
    }));
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
   * 检查完成后发放奖励到主角背包、货币、经验，标记已领取，发送消息通知。
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

    const worldviewId = gameState.selectedWorld?.worldviewId;
    const currencyId = getWorldviewCurrencyItemId(worldviewId ?? '');
    const result = calculateStaticQuestRewards(quest.rewards, stageRewards, worldviewId);
    // 货币已是物品的一部分（poolEngine 在 processStaticEntry 中已按世界观解析）
    const allRewardItems = result.items;
    const rewardMessage = result.message || `任务完成: ${quest.name}`;

    // 发放奖励 + 标记领取 + 推进槽位 + 消息通知
    setGameState(prev => {
      if (!prev.protagonist) return prev;

      let newProtagonist = { ...prev.protagonist };

      // 发放经验
      if (result.experience > 0) {
        newProtagonist = {
          ...newProtagonist,
          experience: newProtagonist.experience + result.experience,
        };
      }

      // 发放物品（含货币，已由 poolEngine 在产出时按世界观解析）
      if (allRewardItems.length > 0) {
        let inventory = [...(newProtagonist.items ?? [])];
        let missingCount = 0;
        for (const item of allRewardItems) {
          if (hasTemplate(item.itemId)) {
            inventory = addItem(inventory, item.itemId, item.quantity, { source: 'quest' });
          } else {
            missingCount++;
          }
        }
        newProtagonist = { ...newProtagonist, items: inventory };
        if (missingCount > 0) {
          console.warn(`[Quest] ${missingCount} 种物品模板尚未加载，跳过入库（ModInitProvider 加载中）`);
        }
      }

      // 标记已领取
      let newQuestState: typeof prev.questState = {
        ...prev.questState,
        claimedQuestIds: [...prev.questState.claimedQuestIds, questId],
      };

      // 推进该任务所属板块的槽位
      if (quest.boardIds) {
        const player = getPlayerData();
        for (const boardId of quest.boardIds) {
          const board = BoardRegistry.getInstance().getById(boardId);
          if (!board) continue;
          const newSlots = advanceBoardSlot(board, newQuestState, Date.now(), player);
          newQuestState = {
            ...newQuestState,
            boardSlots: {
              ...newQuestState.boardSlots,
              [boardId]: {
                questIds: newSlots[boardId],
                lastRefresh: newQuestState.boardLastRefresh[boardId] ?? Date.now(),
              },
            },
          };
        }
      }

      // 构建奖励消息（写入 GameState.messages 显示在右侧消息栏）
      const hasRewards = result.experience > 0 || result.items.length > 0;
      const msgTitle = `奖励领取: ${quest.name}`;
      const msgContent = hasRewards ? rewardMessage : '奖励已领取';

      const newMessages = prev.messages
        ? [{
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: 'success' as const,
            title: msgTitle,
            content: msgContent,
          } as import('@/core/types').MessageRecord,
          ...prev.messages,
        ].slice(0, 100)
        : [];

      return {
        ...prev,
        protagonist: newProtagonist,
        questState: newQuestState,
        messages: newMessages,
      };
    });

    for (const item of allRewardItems) {
      if (!hasTemplate(item.itemId)) continue;

      emitItemObtained(item.itemId, item.quantity);
      if (item.itemId === currencyId) {
        emitSpiritStonesGained(item.quantity);
      }
    }

    gameEventBus.emit(
      'quest:claimed',
      buildQuestClaimedPayload(questId, quest.name, rewardMessage),
    );

    return { success: true, rewardMessage };
  }, [questState, setGameState, getPlayerData]);

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
    const player = getPlayerData();
    const { boardSlots, boardLastRefresh } = refreshBoard(board, questState, now, rng, player);

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
  }, [questState, setGameState, getPlayerData]);

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
  // 单个任务状态查询
  // ============================================

  const getQuestState = useCallback((questId: string) => {
    return {
      completed: questState.completedQuestIds.includes(questId),
      claimed: questState.claimedQuestIds.includes(questId),
      active: !!questState.activeQuests[questId],
    };
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
    getQuestState,
    hasViewedDialog: hasViewedDialogFn,
    markDialogViewed: markDialogViewedFn,
    getCurrencyName,
  };
}
