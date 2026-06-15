/**
 * 领域 Hook 共享辅助函数
 */

import type { MessageRecord } from '@/core/types';

/**
 * 创建 addMessageInternal 适配器
 *
 * 模块 Hook 期望 signature: (messages, type, title, content, details?, rewards?) => MessageRecord[]
 * 此函数返回符合该签名的实现。
 */
export function createAddMessageInternal(): (
  messages: MessageRecord[],
  type: MessageRecord['type'],
  title: string,
  content: string,
  details?: string,
  rewards?: MessageRecord['rewards'],
) => MessageRecord[] {
  return (messages, type, title, content, details, rewards) => {
    const newMessage: MessageRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      title,
      content,
      details,
      rewards,
    };
    return [newMessage, ...messages].slice(0, 100);
  };
}

/**
 * 更新活跃效果（减少使用次数，移除已耗尽的效果）
 */
export function updateActiveEffects<T extends { type: string; remainingCount: number }>(effects: T[]): T[] {
  return effects
    .map(effect => {
      if (effect.type === 'cultivation_boost' || effect.type === 'breakthrough_boost') {
        return { ...effect, remainingCount: effect.remainingCount - 1 };
      }
      return effect;
    })
    .filter(effect => effect.remainingCount > 0);
}
