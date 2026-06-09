/**
 * 修炼系统类型定义
 *
 * 定义修炼策略选择、暴击事件和冷却管理等类型。
 */

import type { GrowthStats } from '@/shared/lib/types';

// ============================================
// 修炼策略
// ============================================

/** 修炼方式策略 */
export type CultivationStrategy = 'steady' | 'aggressive' | 'insight';

/** 修炼策略配置 */
export interface CultivationStrategyConfig {
  /** 策略标识 */
  id: CultivationStrategy;
  /** 策略名称 */
  name: string;
  /** 策略描述 */
  description: string;
  /** 灵石消耗（0 表示不消耗） */
  spiritStoneCost: number;
  /** 成功率偏移（相对于基础成功率） */
  successRateOffset: number;
  /** 属性增长倍率 */
  statGainMultiplier: number;
  /** 失败是否返还灵石比例（0 表示不返还） */
  refundOnFail: number;
  /** 是否可能触发意外突破 */
  canUnexpectedBreakthrough: boolean;
  /** 意外突破概率 */
  unexpectedBreakthroughRate: number;
  /** 失败后冷却时间（秒，0 表示无冷却） */
  cooldownOnFail: number;
}

/** 修炼策略配置表 */
export const CULTIVATION_STRATEGIES: Record<CultivationStrategy, CultivationStrategyConfig> = {
  steady: {
    id: 'steady',
    name: '稳健修炼',
    description: '中规中矩的修炼方式，消耗标准灵石，收益稳定。失败返还一半灵石。',
    spiritStoneCost: 20,
    successRateOffset: 0,
    statGainMultiplier: 1.0,
    refundOnFail: 0.5,
    canUnexpectedBreakthrough: false,
    unexpectedBreakthroughRate: 0,
    cooldownOnFail: 0,
  },
  aggressive: {
    id: 'aggressive',
    name: '激进修炼',
    description: '消耗双倍灵石强行冲关，成功时收益大幅提升，有概率触发意外突破。但失败损失惨重。',
    spiritStoneCost: 40,
    successRateOffset: -0.2,
    statGainMultiplier: 2.5,
    refundOnFail: 0,
    canUnexpectedBreakthrough: true,
    unexpectedBreakthroughRate: 0.10,
    cooldownOnFail: 0,
  },
  insight: {
    id: 'insight',
    name: '顿悟尝试',
    description: '不消耗灵石的冥想顿悟，成功概率极低但收益极高，可获得顿悟印记。失败进入冷却期。',
    spiritStoneCost: 0,
    successRateOffset: -0.7,
    statGainMultiplier: 3.0,
    refundOnFail: 0,
    canUnexpectedBreakthrough: false,
    unexpectedBreakthroughRate: 0,
    cooldownOnFail: 600, // 10分钟
  },
};

// ============================================
// 修炼暴击事件
// ============================================

/** 修炼暴击事件选项 */
export interface CultivationCritChoice {
  /** 选项文本 */
  text: string;
  /** 选项效果 */
  effects: {
    stats?: Partial<GrowthStats>;
    spiritStones?: number;
    fragmentId?: string;
    special?: string;
  };
  /** 选项结果描述 */
  result: string;
}

/** 修炼暴击事件 */
export interface CultivationCritEvent {
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description: string;
  /** 可选选项（2-3个） */
  choices: CultivationCritChoice[];
  /** 触发来源策略 */
  sourceStrategy: CultivationStrategy;
}

// ============================================
// 修炼结果（扩展版）
// ============================================

/** 扩展的修炼结果，包含策略相关信息 */
export interface CultivationStrategyResult {
  /** 是否成功 */
  success: boolean;
  /** 提示文本 */
  message: string;
  /** 使用的策略 */
  strategy: CultivationStrategy;
  /** 属性变化 */
  statChanges: Partial<GrowthStats>;
  /** 灵石消耗 */
  spiritStonesSpent: number;
  /** 返还的灵石 */
  spiritStonesRefunded: number;
  /** 获得经验 */
  experienceGain: number;
  /** 是否触发突破尝试 */
  breakthroughAttempt: boolean;
  /** 突破是否成功 */
  breakthroughSuccess?: boolean;
  /** 是否触发修炼暴击 */
  cultivationCrit: boolean;
  /** 暴击事件（触发时非空） */
  critEvent?: CultivationCritEvent;
  /** 是否触发意外突破 */
  unexpectedBreakthrough: boolean;
  /** 是否获得顿悟印记 */
  insightMarkGained: boolean;
  /** 冷却结束时间戳（0 表示无冷却） */
  cooldownUntil: number;
}

// ============================================
// 顿悟印记
// ============================================

/** 顿悟印记状态 */
export interface InsightMarkState {
  /** 当前印记数 */
  count: number;
  /** 兑换所需印记数 */
  requiredForExchange: number;
}
