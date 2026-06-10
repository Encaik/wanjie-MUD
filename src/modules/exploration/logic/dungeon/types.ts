/**
 * 地牢随机事件系统类型定义
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 */

import { LegacyStats, StatKey, InventoryItem, ItemDefinition, ActiveEffect, EffectType, Protagonist } from '@/core/types';

// ============================================
// 事件类型枚举
// ============================================

/** 地牢事件类型 */
export type DungeonEventType = 
  | 'treasure'        // 宝箱
  | 'mystery'         // 神秘事件
  | 'trap'            // 陷阱
  | 'merchant'        // 商人
  | 'shrine'          // 神殿
  | 'hidden_room'     // 隐藏房间
  | 'elite_guardian'  // 精英守护者
  | 'blessing';       // 祝福

/** 事件类型配置 */
export interface EventTypeConfig {
  type: DungeonEventType;
  name: string;
  icon: string;
  description: string;
  baseWeight: number; // 基础权重
}

/** 所有事件类型配置 */
export const EVENT_TYPE_CONFIGS: Record<DungeonEventType, EventTypeConfig> = {
  treasure: {
    type: 'treasure',
    name: '宝箱',
    icon: '📦',
    description: '神秘的宝箱，可能蕴含宝物或陷阱',
    baseWeight: 15,
  },
  mystery: {
    type: 'mystery',
    name: '神秘事件',
    icon: '❓',
    description: '充满未知的事件，结果难以预料',
    baseWeight: 10,
  },
  trap: {
    type: 'trap',
    name: '陷阱',
    icon: '⚠️',
    description: '危险的陷阱，需要小心应对',
    baseWeight: 8,
  },
  merchant: {
    type: 'merchant',
    name: '商人',
    icon: '🧙',
    description: '神秘的流浪商人，出售稀有物品',
    baseWeight: 8,
  },
  shrine: {
    type: 'shrine',
    name: '神殿',
    icon: '🏛️',
    description: '古老的神殿，可能获得神灵的恩赐',
    baseWeight: 5,
  },
  hidden_room: {
    type: 'hidden_room',
    name: '隐藏房间',
    icon: '🚪',
    description: '隐藏的房间，可能藏有宝藏',
    baseWeight: 5,
  },
  elite_guardian: {
    type: 'elite_guardian',
    name: '精英守护者',
    icon: '⚔️',
    description: '强大的守护者，击败后可获得丰厚奖励',
    baseWeight: 3,
  },
  blessing: {
    type: 'blessing',
    name: '祝福',
    icon: '✨',
    description: '神圣的祝福，获得力量加持',
    baseWeight: 5,
  },
};

// ============================================
// 事件需求条件
// ============================================

/** 事件选择的需求条件 */
export interface ChoiceRequirements {
  /** 最低等级要求 */
  minLevel?: number;
  /** 最高等级限制 */
  maxLevel?: number;
  /** 最低HP要求（百分比，0-100） */
  minHpPercent?: number;
  /** 最低MP要求（百分比，0-100） */
  minMpPercent?: number;
  /** 需要的物品ID */
  itemId?: string;
  /** 需要的灵石数量 */
  spiritStones?: number;
  /** 需要的属性值 */
  stats?: Partial<LegacyStats>;
  /** 需要特定功法 */
  techniqueId?: string;
}

/** 检查需求条件的结果 */
export interface RequirementCheckResult {
  satisfied: boolean;
  missingReqs: string[]; // 未满足的需求描述
}

// ============================================
// 事件效果
// ============================================

/** 事件效果类型 */
export type EventEffectType = 
  | 'heal'            // 治愈
  | 'damage'          // 伤害
  | 'restore_mp'      // 恢复法力
  | 'drain_mp'        // 消耗法力
  | 'gain_spirit_stones'    // 获得灵石
  | 'lose_spirit_stones'    // 损失灵石
  | 'gain_exp'        // 获得经验
  | 'gain_item'       // 获得物品
  | 'lose_item'       // 失去物品
  | 'gain_stat'       // 获得属性
  | 'lose_stat'       // 失去属性
  | 'gain_buff'       // 获得增益
  | 'gain_debuff'     // 获得减益
  | 'teleport'        // 传送
  | 'reveal_map'      // 揭示地图
  | 'trigger_battle'; // 触发战斗

/** 事件Buff效果 */
export interface EventBuffEffect {
  /** 效果类型 */
  type: EffectType;
  /** 影响的属性 */
  stat?: StatKey;
  /** 效果值 */
  value: number;
  /** 剩余次数，-1表示永久 */
  remainingCount: number;
}

/** 事件效果 */
export interface EventEffect {
  type: EventEffectType;
  value?: number;
  stat?: StatKey;
  item?: ItemDefinition;
  buff?: EventBuffEffect;
  teleportTarget?: { row: number; col: number };
  battleConfig?: {
    enemyName: string;
    enemyLevel: number;
    enemyTier: 'elite' | 'miniboss';
  };
}

/** 事件结果 */
export interface DungeonOutcome {
  /** 结果ID */
  id: string;
  /** 概率（0-1） */
  probability: number;
  /** 效果列表 */
  effects: EventEffect[];
  /** 结果描述 */
  message: string;
}

// ============================================
// 事件选择
// ============================================

/** 事件选择选项 */
export interface DungeonChoice {
  /** 选择ID */
  id: string;
  /** 显示文本 */
  text: string;
  /** 需求条件 */
  requirements?: ChoiceRequirements;
  /** 可能的结果列表 */
  outcomes: DungeonOutcome[];
  /** 是否为推荐选项 */
  isRecommended?: boolean;
  /** 选择提示 */
  hint?: string;
}

// ============================================
// 事件定义
// ============================================

/** 事件出现条件 */
export interface EventConditions {
  /** 最低等级 */
  minLevel?: number;
  /** 最高等级 */
  maxLevel?: number;
  /** 最低HP百分比 */
  minHpPercent?: number;
  /** 最高HP百分比 */
  maxHpPercent?: number;
  /** 最低MP百分比 */
  minMpPercent?: number;
  /** 需要的物品 */
  requiredItems?: string[];
  /** 需要的属性 */
  requiredStats?: Partial<LegacyStats>;
  /** 地牢难度等级范围 */
  difficultyRange?: [number, number];
  /** 世界类型限制 */
  worldTypes?: string[];
  /** 是否只能触发一次 */
  oneTimeOnly?: boolean;
}

/** 地牢事件完整定义 */
export interface DungeonEvent {
  /** 事件唯一ID */
  id: string;
  /** 事件类型 */
  type: DungeonEventType;
  /** 事件名称 */
  name: string;
  /** 事件描述 */
  description: string;
  /** 事件图标 */
  icon: string;
  /** 出现条件 */
  conditions?: EventConditions;
  /** 可选的行动 */
  choices: DungeonChoice[];
  /** 抽取权重 */
  weight: number;
  /** 是否为稀有事件 */
  isRare?: boolean;
  /** 事件标签（用于分类和筛选） */
  tags?: string[];
}

// ============================================
// 事件触发配置
// ============================================

/** 事件触发配置 */
export interface EventTriggerConfig {
  /** 基础触发概率 */
  baseProbability: number;
  /** 修正因子 */
  modifiers: {
    /** 低血量时修正 */
    lowHp: number;
    /** 高等级时修正 */
    highLevel: number;
    /** 首次访问时修正 */
    firstVisit: number;
    /** 连续未触发时递增 */
    consecutiveMiss: number;
  };
  /** 冷却时间（毫秒） */
  cooldown?: number;
}

/** 默认触发配置 */
export const DEFAULT_TRIGGER_CONFIG: EventTriggerConfig = {
  baseProbability: 0.15, // 15%基础概率
  modifiers: {
    lowHp: 1.5,    // 低血量时提高50%
    highLevel: 0.8, // 高等级时降低20%
    firstVisit: 2.0, // 首次访问时翻倍
    consecutiveMiss: 1.1, // 连续未触发时每次增加10%
  },
};

// ============================================
// 事件执行结果
// ============================================

/** 事件执行上下文 */
export interface EventExecutionContext {
  /** 玩家信息 */
  player: Protagonist;
  /** 地牢配置 */
  dungeonConfig: {
    difficulty: number;
    rows: number;
    cols: number;
  };
  /** 当前格子位置 */
  position: { row: number; col: number };
  /** 格子类型 */
  cellType: string;
  /** 是否首次访问 */
  isFirstVisit: boolean;
}

/** 事件执行结果 */
export interface EventExecutionResult {
  /** 是否成功执行 */
  success: boolean;
  /** 选择的结果 */
  outcome: DungeonOutcome;
  /** 应用后的效果摘要 */
  appliedEffects: {
    hpChange?: number;
    mpChange?: number;
    spiritStonesChange?: number;
    expChange?: number;
    itemsGained?: InventoryItem[];
    itemsLost?: InventoryItem[];
    statsGained?: Partial<LegacyStats>;
    buffsGained?: ActiveEffect[];
    teleportTarget?: { row: number; col: number };
    triggeredBattle?: {
      enemyName: string;
      enemyLevel: number;
      enemyTier: 'elite' | 'miniboss';
    };
  };
  /** 结果消息 */
  message: string;
}

// ============================================
// 事件统计
// ============================================

/** 事件统计数据 */
export interface EventStatistics {
  /** 总触发次数 */
  totalTriggers: number;
  /** 各类型触发次数 */
  triggersByType: Record<DungeonEventType, number>;
  /** 各事件触发次数 */
  triggersByEventId: Record<string, number>;
  /** 最后触发时间 */
  lastTriggerTime: number;
  /** 已触发的一次性事件 */
  triggeredOneTimeEvents: Set<string>;
}

// ============================================
// 辅助类型
// ============================================

/** 事件预览信息（用于UI展示） */
export interface EventPreview {
  event: DungeonEvent;
  availableChoices: {
    choice: DungeonChoice;
    isAvailable: boolean;
    missingReqs: string[];
  }[];
}

/** 简化的事件结果（用于日志） */
export interface EventLogEntry {
  eventId: string;
  eventName: string;
  choiceId: string;
  outcomeId: string;
  message: string;
  timestamp: number;
}
