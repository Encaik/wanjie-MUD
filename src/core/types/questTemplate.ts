/**
 * QuestTemplate — 标准任务模板类型
 *
 * 任务是数据，不是代码。QuestTemplate 是"任务是什么"的声明式描述，
 * 内置任务和 Mod 任务共享此格式。模板 JSON 可序列化，
 * 通过 compileTemplate() 编译为引擎运行时使用的 QuestDefinition。
 *
 * 分层关系：
 *   QuestTemplate (数据层) → compileTemplate() → QuestDefinition (引擎层) → QuestPanel (UI 层)
 *
 * @module core/types
 */

import type {
  QuestPrerequisite,
  QuestReward,
  QuestRewardPoolConfig,
  EventObjectiveMapping,
} from './types';

// ============================================
// QuestTemplate — 标准任务模板
// ============================================

/** 任务模板类型（与 QuestType 一致） */
export type QuestTemplateType = 'main' | 'side' | 'hidden' | 'daily' | 'weekly' | 'event';

/** 任务难度 */
export type QuestTemplateDifficulty = 'easy' | 'normal' | 'hard' | 'epic';

/**
 * 标准任务模板
 *
 * 内置和 Mod 共用同一格式。所有字段 JSON 可序列化，
 * 不包含函数或运行时行为（如 check()、getDelta()）。
 */
export interface QuestTemplate {
  /** 模板唯一标识（与 QuestDefinition.id 一致）。内置任务直接用任务名（如 'tutorial_welcome'），Mod 任务加 'mod_<modId>_' 前缀以避免冲突 */
  templateId: string;

  // === 基本信息 ===
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description: string;
  /** 任务类型 */
  type: QuestTemplateType;
  /** 任务难度（影响奖励稀有度） */
  difficulty?: QuestTemplateDifficulty;

  // === 阶段定义 ===
  /** 任务阶段，按索引顺序执行 */
  stages: QuestTemplateStage[];

  // === 弹窗 ===
  /** 任务接取时显示的弹窗列表（按序弹出，通常只有一个） */
  acceptDialog?: QuestTemplateDialog[];
  /** 任务完成时显示的弹窗 */
  completeDialog?: QuestTemplateDialog;

  // === 前置条件 ===
  /** 接取任务需满足的前置条件 */
  prerequisites: QuestPrerequisite[];

  // === 奖励 ===
  /** 静态奖励（简单任务直接用，复杂任务可与 rewardPool 叠加） */
  rewards?: QuestReward[];
  /** 奖励池配置（优先级高于静态 rewards，可叠加） */
  rewardPool?: QuestRewardPoolConfig;

  // === 关联 ===
  /** 所属故事线 ID（可选） */
  storylineId?: string;
  /** 所属板块 ID 列表（可选，多板块归属） */
  boardIds?: string[];

  // === 世界观限制 ===
  /** 限制出现的世界观 ID 列表（空 = 全世界观可见） */
  worldviewRestrictions?: string[];

  // === 重复性 ===
  /** 是否可重复接取 */
  repeatable: boolean;
  /** 冷却时间（秒，仅 repeatable 任务有效） */
  cooldownSeconds?: number;

  // === 可见性 ===
  /** 是否在任务面板中隐藏（隐藏任务通过特殊方式触发） */
  hiddenInPanel?: boolean;
  /** 自定义事件映射（用于 custom 目标类型，标准类型由编译器自动推导） */
  eventMapping?: EventObjectiveMapping[];

  // === 元信息 ===
  /** 模板来源。'builtin' = 内置，其他字符串 = Mod ID */
  source: 'builtin' | string;
}

// ============================================
// QuestTemplateStage — 任务阶段
// ============================================

/** 任务阶段定义 */
export interface QuestTemplateStage {
  /** 阶段唯一标识 */
  id: string;
  /** 阶段名称 */
  name: string;
  /** 阶段描述 */
  description: string;
  /** 完成目标列表（所有非隐藏目标必须完成才能推进） */
  objectives: QuestTemplateObjective[];
  /** 完成方式（key = 完成方式标识，value = 描述和下一阶段 ID） */
  completions: Record<string, QuestTemplateCompletion>;
  /** 阶段完成奖励（可选） */
  stageRewards?: QuestReward[];
}

/** 阶段完成方式 */
export interface QuestTemplateCompletion {
  /** 本完成方式的描述 */
  description: string;
  /** 下一阶段 ID（undefined = 任务结束） */
  nextStageId?: string;
}

// ============================================
// QuestTemplateObjective — 任务目标
// ============================================

/** 任务目标定义 */
export interface QuestTemplateObjective {
  /** 目标类型（kill_enemy | collect_item | reach_level | custom | ...） */
  type: string;
  /** 目标标识（enemyId, itemId, 等级值, 位置 ID 等） */
  target: string;
  /** 需要完成次数（默认 1） */
  count: number;
  /** 是否隐藏目标（进度追踪但 UI 不显示） */
  hidden?: boolean;
  /** 人类可读的目标描述 */
  description: string;
}

// ============================================
// QuestTemplateDialog — 任务弹窗
// ============================================

/** 任务关联弹窗 */
export interface QuestTemplateDialog {
  /** 弹窗标题 */
  title: string;
  /** 弹窗正文（支持换行文本） */
  content: string;
  /** 确认按钮文字 */
  confirmText: string;
  /** 弹窗视觉风格 */
  variant?: 'welcome' | 'system-intro' | 'quest-start' | 'quest-complete' | 'reward';
}
