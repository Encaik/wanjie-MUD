/**
 * useQuest — 任务系统桥接 Hook
 *
 * 连接 QuestRegistry → 对话引擎 → GameState.questState，
 * 提供 NPC 对话时的任务选项注入和任务生命周期管理。
 *
 * @module modules/quest/hooks
 */

import { useCallback } from 'react';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type {
  GameState,
  QuestDefinition,
  QuestState,
  CoreStatKey,
} from '@/core/types';
import {
  checkPrerequisites,
  startQuest,
  completeStage,
  completeQuest,
  getActiveQuestForNPC,
} from '../logic/questEngine';
import { injectQuestOptions } from '@/modules/npc/logic/dialogueEngine';
import type { InjectedQuestOptions } from '@/modules/npc/logic/dialogueEngine';
import type { PlayerCheckData } from '../logic/questEngine';

/**
 * 从 GameState 提取前置条件检查所需数据
 */
function extractPlayerCheckData(state: GameState): PlayerCheckData {
  const p = state.protagonist;
  return {
    level: p?.level ?? 1,
    realm: p?.realm ?? '凡人',
    factionId: p?.factionId ?? null,
    attitudes: {}, // TODO: 接入态度系统后填充
    coreStats: (p?.v3CoreStats ?? {}) as Record<string, number>,
    attributes: (p?.v3Attributes ?? {}) as Record<string, number>,
    inventoryItemIds: (p?.inventory ?? []).map(i => i.definition?.id ?? i.id).filter(Boolean),
  };
}

export interface UseQuestReturn {
  /** 为 NPC 对话注入任务选项 */
  injectForNPC: (npcId: string) => InjectedQuestOptions;
  /** 接取任务 */
  acceptQuest: (questId: string) => QuestState;
  /** 提交任务当前阶段 */
  turnInQuest: (questId: string, completionKey: string) => { questState: QuestState; completed: boolean };
  /** 更新目标进度 */
  updateProgress: (objectiveType: string, target: string, delta?: number) => void;
}

/**
 * 任务系统桥接 Hook
 *
 * @param gameState - 完整游戏状态
 * @param setGameState - 状态更新函数
 */
export function useQuest(
  gameState: GameState,
  setGameState: (updater: (prev: GameState) => GameState) => void,
): UseQuestReturn {
  const worldviewId = gameState.selectedWorld?.worldviewId ?? '';
  const questState = gameState.questState;

  const getPlayerData = useCallback(() => extractPlayerCheckData(gameState), [gameState]);

  /** 为 NPC 对话注入任务选项 */
  const injectForNPC = useCallback((npcId: string): InjectedQuestOptions => {
    const player = getPlayerData();
    const registry = QuestRegistry.getInstance();

    const availableQuests = registry.getAvailableQuests(
      worldviewId,
      questState,
      (q) => checkPrerequisites(q, player, questState).passed,
    ).filter(q => {
      // questPool 过滤：若 world.questPool 非空，只允许池中任务
      const pool = gameState.selectedWorld?.questPool;
      if (pool && pool.length > 0) return pool.includes(q.id);
      return true;
    }).filter(q =>
      // 只返回该 NPC 作为 quest giver 的任务
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

  /** 接取任务 */
  const acceptQuest = useCallback((questId: string): QuestState => {
    const quest = QuestRegistry.getInstance().getById(questId);
    if (!quest) return questState;

    const newQuestState = startQuest(questId, quest, questState);
    setGameState(prev => ({ ...prev, questState: newQuestState }));
    return newQuestState;
  }, [questState, setGameState]);

  /** 提交任务 */
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
      });
    } else {
      newQuestState = {
        ...questState,
        activeQuests: { ...questState.activeQuests, [questId]: activeQuest },
      };
    }

    setGameState(prev => ({ ...prev, questState: newQuestState }));
    return { questState: newQuestState, completed };
  }, [questState, setGameState]);

  /** 更新目标进度 */
  const updateProgress = useCallback((objectiveType: string, target: string, delta: number = 1) => {
    setGameState(prev => {
      const newActiveQuests = { ...prev.questState.activeQuests };
      let changed = false;
      for (const [qId, active] of Object.entries(newActiveQuests)) {
        const quest = QuestRegistry.getInstance().getById(qId);
        if (!quest) continue;
        const stage = quest.stages.find(s => s.id === active.currentStageId);
        if (!stage) continue;
        // 检查此 objective 是否属于当前 stage
        const hasObjective = stage.objectives.some(
          o => o.type === objectiveType && o.target === target
        );
        if (hasObjective) {
          const key = `${objectiveType}:${target}`;
          const current = active.objectives[key] ?? 0;
          newActiveQuests[qId] = {
            ...active,
            objectives: { ...active.objectives, [key]: current + delta },
          };
          changed = true;
        }
      }
      if (!changed) return prev;
      return {
        ...prev,
        questState: { ...prev.questState, activeQuests: newActiveQuests },
      };
    });
  }, [setGameState]);

  return { injectForNPC, acceptQuest, turnInQuest, updateProgress };
}
