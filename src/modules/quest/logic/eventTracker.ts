/**
 * Event-driven quest progress tracking.
 */

import type { GameEvent } from '@/core/events';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type {
  ActiveQuest,
  EventObjectiveMapping,
  QuestDefinition,
  QuestObjective,
  QuestStage,
  QuestState,
} from '@/core/types';

import { checkStageCompletion, updateObjectiveProgress } from './questEngine';

const DEFAULT_EVENT_MAPPING: EventObjectiveMapping[] = [
  { eventType: 'combat:enemy_killed', targetField: 'enemyId', objectiveType: 'kill_enemy' },
  { eventType: 'item:obtained', targetField: 'templateId', objectiveType: 'collect_item' },
  { eventType: 'item:used', targetField: 'templateId', objectiveType: 'use_item' },
  { eventType: 'player:level_up', targetField: 'newLevel', objectiveType: 'reach_level' },
  { eventType: 'cultivation:breakthrough', targetField: 'newRealm', objectiveType: 'reach_realm' },
  { eventType: 'cultivation:performed', targetField: '', objectiveType: 'cultivate' },
  { eventType: 'adventure:entered', targetField: 'locationId', objectiveType: 'explore_location' },
  { eventType: 'npc:dialogue_triggered', targetField: 'npcId', objectiveType: 'dialogue_check' },
  { eventType: 'faction:joined', targetField: 'factionId', objectiveType: 'join_faction' },
];

export function matchEventToObjectives(
  event: GameEvent,
  activeQuest: ActiveQuest,
  stage: QuestStage,
  questDef?: QuestDefinition,
): Array<{ key: string; delta: number }> {
  const results: Array<{ key: string; delta: number }> = [];
  const mappings = questDef?.eventMapping ?? DEFAULT_EVENT_MAPPING;

  for (const objective of stage.objectives) {
    const mapping = findMapping(mappings, event.type, objective.type);
    if (!mapping || !isEventMatch(event, mapping, objective)) continue;

    const key = `${objective.type}:${objective.target}`;
    const delta = mapping.getDelta ? mapping.getDelta(event) : 1;
    const current = activeQuest.objectives[key] ?? 0;
    const required = objective.count ?? 1;

    if (current >= required) continue;

    results.push({
      key,
      delta: Math.min(delta, required - current),
    });
  }

  return results;
}

function findMapping(
  mappings: EventObjectiveMapping[],
  eventType: string,
  objectiveType: string,
): EventObjectiveMapping | undefined {
  return mappings.find((mapping) => {
    const typeMatch = mapping.eventType === eventType
      || (mapping.eventType.endsWith('*') && eventType.startsWith(mapping.eventType.replace('*', '')));
    return typeMatch && mapping.objectiveType === objectiveType;
  });
}

function matchesTarget(actualValue: unknown, target: string | undefined, objectiveType: QuestObjective['type']): boolean {
  const actual = String(actualValue ?? '');
  const expected = String(target ?? '');

  if (actual === expected) return true;

  if (
    expected
    && (objectiveType === 'kill_enemy' || objectiveType === 'collect_item' || objectiveType === 'use_item')
  ) {
    return actual.endsWith(`:${expected}`);
  }

  return false;
}

function isEventMatch(
  event: GameEvent,
  mapping: EventObjectiveMapping,
  objective: QuestObjective,
): boolean {
  const payload = event.payload as Record<string, unknown>;

  if (objective.type === 'cultivate') return true;
  if ((objective.type === 'custom' || objective.type === 'join_faction') && !objective.target) return true;
  if (objective.type === 'kill_enemy' && !objective.target) return true;

  if (objective.type === 'reach_level') {
    const level = (payload[mapping.targetField] ?? payload.newLevel ?? 0) as number;
    return level >= Number(objective.target || objective.count || 1);
  }

  if (mapping.targetField) {
    return matchesTarget(payload[mapping.targetField], objective.target, objective.type);
  }

  return false;
}

export interface TrackerResult {
  questState: QuestState;
  changed: boolean;
  newlyCompletedQuestIds: string[];
  newlyCompletedStages: Array<{ questId: string; stageId: string }>;
}

export function applyEventToQuests(
  event: GameEvent,
  questState: QuestState,
  nowTimestamp: number = Date.now(),
): TrackerResult {
  const registry = QuestRegistry.getInstance();
  let newState = { ...questState };
  let changed = false;
  const newlyCompletedQuestIds: string[] = [];
  const newlyCompletedStages: Array<{ questId: string; stageId: string }> = [];

  for (const [questId, active] of Object.entries(newState.activeQuests)) {
    const questDef = registry.getById(questId);
    if (!questDef) continue;

    const stage = questDef.stages.find((item) => item.id === active.currentStageId);
    if (!stage) continue;

    const matches = matchEventToObjectives(event, active, stage, questDef);
    if (matches.length === 0) continue;

    let updatedActive = { ...active };
    for (const { key, delta } of matches) {
      updatedActive = updateObjectiveProgress(
        updatedActive,
        key.split(':')[0],
        key.split(':').slice(1).join(':'),
        delta,
      );
    }

    const stageCompleted = checkStageCompletion(stage, updatedActive);
    newState = {
      ...newState,
      activeQuests: {
        ...newState.activeQuests,
        [questId]: updatedActive,
      },
    };
    changed = true;

    if (!stageCompleted) continue;

    newlyCompletedStages.push({ questId, stageId: stage.id });
    const stageIndex = questDef.stages.findIndex((item) => item.id === stage.id);
    const isLastStage = stageIndex >= questDef.stages.length - 1;

    if ((questDef.stages.length === 1 || isLastStage) && !newState.completedQuestIds.includes(questId)) {
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

  return { questState: newState, changed, newlyCompletedQuestIds, newlyCompletedStages };
}

export function createQuestTracker(
  onStateUpdate: (updater: (prev: QuestState) => QuestState) => void,
  getQuestState: () => QuestState,
): (event: GameEvent) => void {
  return (event: GameEvent) => {
    const result = applyEventToQuests(event, getQuestState());
    if (result.changed) {
      onStateUpdate(() => result.questState);
    }
  };
}

export function buildQuestCompletedPayload(
  questId: string,
  questName: string,
): Record<string, unknown> {
  return { questId, questName, timestamp: Date.now() };
}

export function buildQuestClaimedPayload(
  questId: string,
  questName: string,
  rewardSummary: string,
): Record<string, unknown> {
  return { questId, questName, rewardSummary, timestamp: Date.now() };
}
