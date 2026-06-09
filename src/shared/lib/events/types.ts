/**
 * 事件系统类型定义
 *
 * 定义事件记录、事件链和持久后果相关的类型。
 */

// ============================================
// 事件记录
// ============================================

/** 单条事件历史记录 */
export interface EventRecord {
  /** 事件 ID */
  eventId: string;
  /** 选择序号 */
  choiceIndex: number;
  /** 触发时间戳 */
  timestamp: number;
}

// ============================================
// 事件前置条件
// ============================================

/** 事件前置条件定义 */
export interface EventPrerequisite {
  /** 需要的前置事件 ID（可选） */
  requiredEventId?: string;
  /** 需要的选择序号（可选） */
  requiredChoiceIndex?: number;
  /** 需要的 NPC 关系最小值 */
  requiredNpcRelation?: { npcId: string; minValue: number };
  /** 需要的状态标记 */
  requiredFlags?: string[];
  /** 禁止的状态标记（有任一标记时不可触发） */
  forbiddenFlags?: string[];
}

// ============================================
// 事件分支
// ============================================

/** 事件选择分支 */
export interface EventBranch {
  /** 分支条件：满足前置条件时显示 */
  condition: EventPrerequisite;
  /** 分支特有的选项列表 */
  choices: Array<{
    text: string;
    effects: Record<string, unknown>;
    result: string;
  }>;
}

// ============================================
// 事件后果
// ============================================

/** NPC 关系变更 */
export interface NPCRelationChange {
  /** NPC ID */
  npcId: string;
  /** 关系变化值（正=提升，负=恶化） */
  delta: number;
}

/** 状态标记变更 */
export interface FlagChange {
  /** 标记名称 */
  flag: string;
  /** 设置值 */
  value: boolean | number | string;
  /** 持续时间（事件次数，-1 = 永久） */
  duration: number;
}

/** 事件后果定义 */
export interface Consequence {
  /** NPC 关系变更列表 */
  npcRelations?: NPCRelationChange[];
  /** 状态标记变更列表 */
  flagChanges?: FlagChange[];
  /** 世界状态变更 */
  worldStateChange?: Record<string, unknown>;
}

// ============================================
// 事件链
// ============================================

/** 事件链中的单个事件定义 */
export interface ChainEventDef {
  /** 事件 ID */
  eventId: string;
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description: string;
  /** 在链中的序号（1-based） */
  chainIndex: number;
  /** 事件选项 */
  choices: Array<{
    text: string;
    effects: Record<string, unknown>;
    result: string;
    /** 该选项产生的后果 */
    consequences?: Consequence;
  }>;
}

/** 事件链定义 */
export interface EventChain {
  /** 链 ID */
  chainId: string;
  /** 链名称 */
  name: string;
  /** 链描述 */
  description: string;
  /** 适用世界类型 */
  worldTypes: string[];
  /** 链中的事件列表（按顺序） */
  events: ChainEventDef[];
  /** 完成奖励 */
  completionReward: {
    description: string;
    effects: Record<string, unknown>;
  };
}
