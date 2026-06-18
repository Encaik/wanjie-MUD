/**
 * 事件驱动任务追踪器
 *
 * 订阅全局 GameEvent，自动匹配活跃任务目标并更新进度。
 * 替代旧的轮询 check() 模式。
 *
 * @module modules/quest/logic
 */

import type { GameEvent } from '@/core/events';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type {
  QuestState,
  ActiveQuest,
  QuestDefinition,
  QuestStage,
  QuestObjective,
  EventObjectiveMapping,
} from '@/core/types';

import { updateObjectiveProgress, checkStageCompletion } from './questEngine';

// ============================================
// 默认事件→目标映射表
// ============================================

/** 默认的事件到任务目标类型映射 */
const DEFAULT_EVENT_MAPPING: EventObjectiveMapping[] = [
  { eventType: 'combat:enemy_killed', targetField: 'enemyId', objectiveType: 'kill_enemy' },
  { eventType: 'item:collected', targetField: 'itemId', objectiveType: 'collect_item' },
  { eventType: 'item:used', targetField: 'templateId', objectiveType: 'use_item' },
  { eventType: 'progression:level_up', targetField: 'newLevel', objectiveType: 'reach_level' },
  { eventType: 'progression:realm_broken', targetField: 'realm', objectiveType: 'reach_realm' },
  { eventType: 'cultivation:performed', targetField: '', objectiveType: 'cultivate' },
  { eventType: 'exploration:location_entered', targetField: 'locationId', objectiveType: 'explore_location' },
  { eventType: 'npc:dialogue_triggered', targetField: 'npcId', objectiveType: 'dialogue_check' },
  { eventType: 'faction:joined', targetField: 'factionId', objectiveType: 'join_faction' },
];

// ============================================
// 事件匹配
// ============================================

/**
 * 将事件匹配到活跃任务的目标
 *
 * @param event - 游戏事件
 * @param activeQuest - 活跃任务
 * @param stage - 当前阶段
 * @param questDef - 任务定义（用于获取自定义映射）
 * @returns 匹配到的目标列表，每个包含 objective key 和增量
 */
export function matchEventToObjectives(
  event: GameEvent,
  activeQuest: ActiveQuest,
  stage: QuestStage,
  questDef?: QuestDefinition,
): Array<{ key: string; delta: number }> {
  const results: Array<{ key: string; delta: number }> = [];

  // 使用任务的自定义映射或默认映射
  const mappings = questDef?.eventMapping ?? DEFAULT_EVENT_MAPPING;

  for (const objective of stage.objectives) {
    const mapping = findMapping(mappings, event.type, objective.type);
    if (!mapping) continue;

    // 检查是否匹配此事件
    if (!isEventMatch(event, mapping, objective)) continue;

    const key = `${objective.type}:${objective.target}`;
    const delta = mapping.getDelta
      ? mapping.getDelta(event)
      : 1;

    // 检查目标是否已完成
    const current = activeQuest.objectives[key] ?? 0;
    const required = objective.count ?? 1;
    if (current >= required) continue; // 已完成，跳过
    const effectiveDelta = Math.min(delta, required - current);
    results.push({ key, delta: effectiveDelta });
  }

  return results;
}

/** 查找匹配的映射规则 */
function findMapping(
  mappings: EventObjectiveMapping[],
  eventType: string,
  objectiveType: string,
): EventObjectiveMapping | undefined {
  return mappings.find(m => {
    // 精确匹配或通配符匹配
    const typeMatch = m.eventType === eventType
      || (m.eventType.endsWith('*') && eventType.startsWith(m.eventType.replace('*', '')));
    return typeMatch && m.objectiveType === objectiveType;
  });
}

/** 检查事件是否匹配目标 */
function isEventMatch(
  event: GameEvent,
  mapping: EventObjectiveMapping,
  objective: QuestObjective,
): boolean {
  const payload = event.payload as Record<string, unknown>;

  // cultivate / custom 类型且目标为空：无条件匹配
  if (objective.type === 'cultivate') return true;
  if ((objective.type === 'custom' || objective.type === 'join_faction') && !objective.target) return true;

  // kill_enemy 且目标为空：匹配任意敌人击杀
  if (objective.type === 'kill_enemy' && !objective.target) return true;

  // reach_level 类型：数值比较
  if (objective.type === 'reach_level') {
    const level = (payload[mapping.targetField] ?? payload['newLevel'] ?? 0) as number;
    return level >= Number(objective.target || objective.count || 1);
  }

  // 常规目标：payload 字段值与 target 匹配
  if (mapping.targetField) {
    const fieldValue = payload[mapping.targetField];
    return String(fieldValue) === objective.target;
  }

  // 无 targetField 但有 objective.target → 尝试匹配事件类型
  if (!mapping.targetField && objective.target) {
    // 事件类型中包含 target（如 achievement:claimed → target=claimed 不匹配，跳过）
    return false;
  }

  return false;
}

// ============================================
// 进度应用
// ============================================

/** 事件追踪结果 */
export interface TrackerResult {
  /** 更新后的 QuestState */
  questState: QuestState;
  /** 新完成的任务 ID 列表 */
  newlyCompletedQuestIds: string[];
  /** 新完成的阶段信息 */
  newlyCompletedStages: Array<{ questId: string; stageId: string }>;
}

/**
 * 将事件应用到所有活跃任务
 *
 * 遍历所有活跃任务，匹配事件，更新进度，
 * 检测阶段和任务完成。纯函数，返回新状态。
 *
 * @param event - 游戏事件
 * @param questState - 当前任务状态
 * @param nowTimestamp - 当前时间戳
 */
export function applyEventToQuests(
  event: GameEvent,
  questState: QuestState,
  nowTimestamp: number = Date.now(),
): TrackerResult {
  const registry = QuestRegistry.getInstance();
  let newState = { ...questState };
  const newlyCompletedQuestIds: string[] = [];
  const newlyCompletedStages: Array<{ questId: string; stageId: string }> = [];

  for (const [questId, active] of Object.entries(newState.activeQuests)) {
    const questDef = registry.getById(questId);
    if (!questDef) continue;

    const stage = questDef.stages.find(s => s.id === active.currentStageId);
    if (!stage) continue;

    // 匹配事件到目标
    const matches = matchEventToObjectives(event, active, stage, questDef);
    if (matches.length === 0) continue;

    // 应用进度更新
    let updatedActive = { ...active };
    for (const { key, delta } of matches) {
      updatedActive = updateObjectiveProgress(
        updatedActive,
        key.split(':')[0],
        key.split(':').slice(1).join(':'),
        delta,
      );
    }

    // 检查阶段是否完成
    const stageCompleted = checkStageCompletion(stage, updatedActive);

    newState = {
      ...newState,
      activeQuests: {
        ...newState.activeQuests,
        [questId]: updatedActive,
      },
    };

    if (stageCompleted) {
      newlyCompletedStages.push({ questId, stageId: stage.id });

      // 检查是否为最后阶段
      const isLastStage = !questDef.stages.some(s =>
        s.id !== stage.id && questDef.stages.indexOf(s) > questDef.stages.indexOf(stage),
      );

      // 简化：检查是否所有阶段都可以完成
      // 完整的阶段推进逻辑在 completeStage() 中
      // 这里只标记阶段完成，等待玩家与 NPC 交互推进

      // 如果是单阶段任务，直接标记完成
      if (questDef.stages.length === 1 || isLastStage) {
        if (!newState.completedQuestIds.includes(questId)) {
          newlyCompletedQuestIds.push(questId);
          newState = {
            ...newState,
            completedQuestIds: [...newState.completedQuestIds, questId],
            completedTimestamps: {
              ...newState.completedTimestamps,
              [questId]: nowTimestamp,
            },
          };
        }
      }
    }
  }

  return { questState: newState, newlyCompletedQuestIds, newlyCompletedStages };
}

// ============================================
// 事件发射辅助
// ============================================

/**
 * 创建 QuestEventTracker 的事件监听器函数
 *
 * 返回的函数可直接注册到 EventBus：
 *   gameEventBus.on('*', createQuestTracker(dispatch, getState))
 */
export function createQuestTracker(
  onStateUpdate: (updater: (prev: QuestState) => QuestState) => void,
  getQuestState: () => QuestState,
): (event: GameEvent) => void {
  return (event: GameEvent) => {
    const currentState = getQuestState();
    const result = applyEventToQuests(event, currentState);

    if (result.newlyCompletedQuestIds.length > 0 || result.newlyCompletedStages.length > 0) {
      onStateUpdate(() => result.questState);
    }
  };
}

// ============================================
// 构建事件 payload
// ============================================

/**
 * 构建 quest:completed 事件的 payload
 */
export function buildQuestCompletedPayload(
  questId: string,
  questName: string,
): Record<string, unknown> {
  return { questId, questName, timestamp: Date.now() };
}

/**
 * 构建 quest:claimed 事件的 payload
 */
export function buildQuestClaimedPayload(
  questId: string,
  questName: string,
  rewardSummary: string,
): Record<string, unknown> {
  return { questId, questName, rewardSummary, timestamp: Date.now() };
}
