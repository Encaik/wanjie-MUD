/**
 * modules/reward-pool/events.ts — 奖励事件定义与消息模板注册
 *
 * 当 poolEngine.rollPool() 产生奖励后，发射 'reward:generated' 事件。
 * MessageManager 通过模板匹配将事件转化为玩家可见的消息。
 */

import { gameEventBus } from '@/core/events';
import type { RollResult } from './types';

// ============================================
// 事件类型
// ============================================

/** 奖励生成事件的 payload */
export interface RewardGeneratedPayload {
  /** 来源池子 ID */
  poolId: string;
  /** 来源模块信息 */
  source: {
    module: string;
    nodeType?: string;
    depth?: number;
    floor?: number;
    eventId?: string;
  };
  /** 滚动结果 */
  result: RollResult;
}

/** 奖励事件类型常量 */
export const REWARD_EVENT_TYPE = 'reward:generated' as const;

// ============================================
// 事件发射
// ============================================

/**
 * 发射奖励生成事件
 *
 * 在 poolEngine.rollPool() 末尾调用，
 * 通知消息系统和其他监听者。
 */
export function emitRewardEvent(payload: RewardGeneratedPayload): void {
  gameEventBus.emit(REWARD_EVENT_TYPE, payload as unknown as Record<string, unknown>);
}

// ============================================
// 消息模板注册（在模块初始化时调用）
// ============================================

/**
 * 注册奖励消息模板到 MessageManager
 *
 * 应在应用启动时调用一次。
 */
export function registerRewardMessageTemplates(): void {
  // 模板注册延迟到 MessageManager 完全初始化后
  // 通过 channel 机制完成
}
