/**
 * 任务引擎
 *
 * 纯函数集合：前置条件校验、任务启动、进度追踪、阶段完成、任务完成。
 *
 * @module modules/quest/logic
 */

import type {
  QuestDefinition,
  QuestStage,
  QuestPrerequisite,
  ActiveQuest,
  QuestState,
} from '@/core/types';
import { createDefaultQuestState } from '@/core/types';

// ============================================
// 前置条件校验
// ============================================

/** 前置条件检查所需的玩家数据（最小子集） */
export interface PlayerCheckData {
  level: number;
  realm: string;
  factionId?: string | null;
  /** NPC 态度值表（npcId → attitude） */
  attitudes: Record<string, number>;
  /** 核心值 */
  coreStats: Record<string, number>;
  /** 属性值 */
  attributes: Record<string, number>;
  /** 背包物品 ID 列表 */
  inventoryItemIds: string[];
}

/**
 * 检查单个前置条件是否满足
 */
export function checkSinglePrerequisite(
  prereq: QuestPrerequisite,
  player: PlayerCheckData,
): { passed: boolean; reason?: string } {
  switch (prereq.type) {
    case 'level': {
      const required = Number(prereq.target);
      if (player.level < required) return { passed: false, reason: `需要等级 ${required}（当前 ${player.level}）` };
      return { passed: true };
    }
    case 'realm': {
      if (player.realm !== prereq.target) return { passed: false, reason: `需要境界 ${prereq.target}（当前 ${player.realm}）` };
      return { passed: true };
    }
    case 'faction': {
      if (player.factionId !== prereq.target) return { passed: false, reason: `需要加入 ${prereq.target}` };
      return { passed: true };
    }
    case 'attitude': {
      const current = player.attitudes[prereq.target] ?? 0;
      const min = prereq.minValue ?? 0;
      if (current < min) return { passed: false, reason: `需要对 ${prereq.target} 的好感度达到 ${min}（当前 ${current}）` };
      return { passed: true };
    }
    case 'coreStat': {
      const current = player.coreStats[prereq.target] ?? 0;
      const min = prereq.minValue ?? 1;
      if (current < min) return { passed: false, reason: `需要 ${prereq.target} 达到 ${min}（当前 ${current}）` };
      return { passed: true };
    }
    case 'attribute': {
      const current = player.attributes[prereq.target] ?? 0;
      const min = prereq.minValue ?? 1;
      if (current < min) return { passed: false, reason: `需要 ${prereq.target} 达到 ${min}（当前 ${current}）` };
      return { passed: true };
    }
    case 'item_owned': {
      if (!player.inventoryItemIds.includes(prereq.target)) return { passed: false, reason: `需要持有 ${prereq.target}` };
      return { passed: true };
    }
    case 'quest_completed': {
      // Handled externally via QuestState — this is a fallback
      return { passed: false, reason: 'quest_completed 需由外部检查' };
    }
    default:
      return { passed: false, reason: `未知前置条件类型: ${(prereq as QuestPrerequisite).type}` };
  }
}

/**
 * 检查任务的所有前置条件
 *
 * @param quest - 任务定义
 * @param player - 玩家数据
 * @param questState - 任务状态（用于 quest_completed 检查）
 * @returns 全部通过则 passed=true，否则返回首个不满足条件
 */
export function checkPrerequisites(
  quest: QuestDefinition,
  player: PlayerCheckData,
  questState: QuestState,
): { passed: boolean; failedPrerequisite?: QuestPrerequisite; reason?: string } {
  for (const prereq of quest.prerequisites) {
    if (prereq.type === 'quest_completed') {
      if (!questState.completedQuests.includes(prereq.target)) {
        return { passed: false, failedPrerequisite: prereq, reason: `需要先完成任务: ${prereq.target}` };
      }
      continue;
    }
    const result = checkSinglePrerequisite(prereq, player);
    if (!result.passed) {
      return { passed: false, failedPrerequisite: prereq, reason: result.reason };
    }
  }
  return { passed: true };
}

// ============================================
// 任务状态管理
// ============================================

/**
 * 开始任务
 *
 * @param questId - 任务 ID
 * @param quest - 任务定义
 * @param questState - 当前任务状态
 * @returns 更新后的 QuestState
 */
export function startQuest(
  questId: string,
  quest: QuestDefinition,
  questState: QuestState,
): QuestState {
  if (questState.activeQuests[questId]) return questState; // 已在活跃中
  if (!quest.stages || quest.stages.length === 0) return questState;

  const firstStage = quest.stages[0];
  const active: ActiveQuest = {
    questId,
    currentStageId: firstStage.id,
    objectives: {},
    startedAt: Date.now(),
  };

  return {
    ...questState,
    activeQuests: { ...questState.activeQuests, [questId]: active },
  };
}

/**
 * 更新目标进度
 *
 * @param activeQuest - 活跃任务
 * @param objectiveType - 目标类型
 * @param target - 目标 key
 * @param delta - 增量
 * @returns 更新后的 ActiveQuest
 */
export function updateObjectiveProgress(
  activeQuest: ActiveQuest,
  objectiveType: string,
  target: string,
  delta: number = 1,
): ActiveQuest {
  const key = `${objectiveType}:${target}`;
  const current = activeQuest.objectives[key] ?? 0;
  return {
    ...activeQuest,
    objectives: { ...activeQuest.objectives, [key]: current + delta },
  };
}

/**
 * 检查 Stage 的所有 objectives 是否完成
 *
 * @param stage - 任务阶段
 * @param activeQuest - 活跃任务
 * @returns true = 所有非隐藏目标均完成
 */
export function checkStageCompletion(
  stage: QuestStage,
  activeQuest: ActiveQuest,
): boolean {
  return stage.objectives
    .filter(o => !o.hidden)
    .every(o => {
      const key = `${o.type}:${o.target}`;
      const current = activeQuest.objectives[key] ?? 0;
      const required = o.count ?? 1;
      return current >= required;
    });
}

/**
 * 完成当前 Stage，进入下一 Stage
 *
 * @param quest - 任务定义
 * @param activeQuest - 活跃任务
 * @param completionKey - 完成方式 key（对应 completions 中的 key）
 * @returns { activeQuest, completed } — completed=true 表示任务结束
 */
export function completeStage(
  quest: QuestDefinition,
  activeQuest: ActiveQuest,
  completionKey: string,
): { activeQuest: ActiveQuest; completed: boolean } {
  const stage = quest.stages.find(s => s.id === activeQuest.currentStageId);
  if (!stage) return { activeQuest, completed: true };

  const completion = stage.completions[completionKey];
  if (!completion) return { activeQuest, completed: false };

  if (!completion.nextStageId) {
    return { activeQuest, completed: true };
  }

  return {
    activeQuest: { ...activeQuest, currentStageId: completion.nextStageId },
    completed: false,
  };
}

/**
 * 完成任务
 *
 * @param questId - 任务 ID
 * @param questState - 任务状态
 * @returns 更新后的 QuestState
 */
export function completeQuest(
  questId: string,
  questState: QuestState,
): QuestState {
  const { [questId]: _removed, ...remainingActive } = questState.activeQuests;
  return {
    ...questState,
    activeQuests: remainingActive,
    completedQuests: [...questState.completedQuests, questId],
    stageHistory: {
      ...questState.stageHistory,
      [questId]: [...(questState.stageHistory[questId] ?? []), _removed?.currentStageId ?? ''],
    },
  };
}

/**
 * 查询 NPC 是否有活跃任务可提交
 *
 * @param npcId - NPC ID
 * @param questRegistry - 任务注册中心（提供 getById）
 * @param questState - 玩家任务状态
 * @returns 可提交的任务定义数组
 */
export function getActiveQuestForNPC(
  npcId: string,
  getQuestById: (id: string) => QuestDefinition | undefined,
  questState: QuestState,
): QuestDefinition[] {
  const result: QuestDefinition[] = [];
  for (const active of Object.values(questState.activeQuests)) {
    const quest = getQuestById(active.questId);
    if (!quest) continue;
    const stage = quest.stages.find(s => s.id === active.currentStageId);
    if (!stage) continue;
    // 检查当前 Stage 是否与此 NPC 相关
    const isTurnIn = stage.objectives.some(o => o.type === 'talk_to_npc' && o.target === npcId);
    const hasDialogue = stage.npcDialogueOnEnter?.npcId === npcId;
    if (isTurnIn || hasDialogue) {
      result.push(quest);
    }
  }
  return result;
}

/** 初始化或获取默认 questState（用于嵌入 GameState） */
export function ensureQuestState(existing?: QuestState): QuestState {
  return existing ?? createDefaultQuestState();
}
