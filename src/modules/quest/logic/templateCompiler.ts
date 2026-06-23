/**
 * 模板编译器 — QuestTemplate → QuestDefinition
 *
 * 将数据层的 QuestTemplate 编译为引擎运行时使用的 QuestDefinition。
 * 所有函数皆为纯函数，无副作用。
 *
 * 包含惰性编译缓存，避免重复编译同一模板。
 *
 * @module modules/quest/logic
 */

import { QuestTemplateRegistry } from '@/core/registry/QuestTemplateRegistry';
import type {
  QuestTemplate,
  QuestTemplateStage,
  QuestDefinition,
  QuestStage,
  QuestObjective,
  EventObjectiveMapping,
} from '@/core/types';

// ============================================
// 编译缓存
// ============================================

/** 编译缓存（templateId → QuestDefinition） */
const compilationCache = new Map<string, QuestDefinition>();

// ============================================
// 事件映射推导
// ============================================

/** 目标类型到默认事件类型的映射（反向查找） */
const OBJECTIVE_TO_EVENT: Record<string, { eventType: string; targetField: string }> = {
  'kill_enemy': { eventType: 'combat:enemy_killed', targetField: 'enemyId' },
  'collect_item': { eventType: 'item:obtained', targetField: 'templateId' },
  'use_item': { eventType: 'item:used', targetField: 'templateId' },
  'reach_level': { eventType: 'player:level_up', targetField: 'newLevel' },
  'reach_realm': { eventType: 'cultivation:breakthrough', targetField: 'newRealm' },
  'cultivate': { eventType: 'cultivation:performed', targetField: '' },
  'explore_location': { eventType: 'adventure:entered', targetField: 'locationId' },
  'dialogue_check': { eventType: 'npc:dialogue_triggered', targetField: 'npcId' },
  'join_faction': { eventType: 'faction:joined', targetField: 'factionId' },
};

/**
 * 从阶段列表推导事件映射
 *
 * 遍历所有阶段的 objective，为每种目标类型生成一条事件映射。
 * 如果模板中已直接提供 eventMapping（如 custom 类型），推导时跳过。
 */
export function deriveEventMapping(stages: QuestTemplateStage[]): EventObjectiveMapping[] {
  const seen = new Set<string>();
  const mappings: EventObjectiveMapping[] = [];

  for (const stage of stages) {
    for (const obj of stage.objectives) {
      // custom 类型没有默认事件映射，由调用方提供
      if (obj.type === 'custom' || obj.type === 'talk_to_npc') continue;
      if (seen.has(obj.type)) continue;
      seen.add(obj.type);

      const defaultMapping = OBJECTIVE_TO_EVENT[obj.type];
      if (defaultMapping) {
        mappings.push({
          eventType: defaultMapping.eventType,
          targetField: defaultMapping.targetField,
          objectiveType: obj.type,
        });
      }
    }
  }

  return mappings;
}

// ============================================
// compileTemplate — 核心编译函数
// ============================================

/**
 * 将 QuestTemplate 编译为 QuestDefinition
 *
 * 纯函数：相同输入 → 相同输出，无副作用。
 *
 * @param template - 任务模板
 * @returns 引擎可用的 QuestDefinition
 */
export function compileTemplate(template: QuestTemplate): QuestDefinition {
  // 合并：自动推导的标准映射 + 模板声明的自定义映射
  const derivedMapping = deriveEventMapping(template.stages);
  const customMapping = template.eventMapping ?? [];
  const mergedMapping = [...derivedMapping, ...customMapping];

  return {
    id: template.templateId,
    name: template.name,
    description: template.description,
    type: template.type as QuestDefinition['type'],
    difficulty: template.difficulty,
    prerequisites: template.prerequisites,
    stages: template.stages.map(compileStage),
    rewards: template.rewards ?? [],
    repeatable: template.repeatable,
    cooldownSeconds: template.cooldownSeconds,
    boardIds: template.boardIds,
    storylineId: template.storylineId,
    hiddenInPanel: template.hiddenInPanel,
    worldviewRestrictions: template.worldviewRestrictions,
    rewardPool: template.rewardPool,
    eventMapping: mergedMapping.length > 0 ? mergedMapping : undefined,
    dialog: template.acceptDialog?.[0] ? {
      title: template.acceptDialog[0].title,
      content: template.acceptDialog[0].content,
      confirmText: template.acceptDialog[0].confirmText,
    } : undefined,
  };
}

/** 编译单个阶段 */
function compileStage(stage: QuestTemplateStage): QuestStage {
  return {
    id: stage.id,
    name: stage.name,
    description: stage.description,
    objectives: stage.objectives.map(o => ({
      type: o.type as QuestObjective['type'],
      target: o.target,
      count: o.count,
      hidden: o.hidden,
      description: o.description,
    })),
    completions: Object.fromEntries(
      Object.entries(stage.completions).map(([key, val]) => [
        key,
        {
          description: val.description,
          nextStageId: val.nextStageId,
          stageRewards: stage.stageRewards,
        },
      ]),
    ),
  };
}

// ============================================
// ensureCompiled — 惰性编译 + 缓存
// ============================================

/**
 * 确保模板已编译为 QuestDefinition（惰性缓存）
 *
 * 首次查询时从 QuestTemplateRegistry 获取模板并编译。
 * 后续查询直接返回缓存结果。
 *
 * @param templateId - 模板 ID
 * @returns 编译后的 QuestDefinition，如果模板不存在则返回 undefined
 */
export function ensureCompiled(templateId: string): QuestDefinition | undefined {
  const cached = compilationCache.get(templateId);
  if (cached) return cached;

  const template = QuestTemplateRegistry.getInstance().get(templateId);
  if (!template) return undefined;

  const compiled = compileTemplate(template);
  compilationCache.set(templateId, compiled);
  return compiled;
}

/**
 * 清除编译缓存（用于热重载/测试）
 */
export function clearCompilationCache(): void {
  compilationCache.clear();
}
