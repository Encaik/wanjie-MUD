/**
 * 任务奖励分发器
 *
 * 纯函数集合，处理任务/阶段奖励的计算和发放。
 *
 * @module modules/quest/logic
 */

import type { QuestReward } from '@/core/types';

/** 奖励发放结果 */
export interface RewardResult {
  success: boolean;
  experience: number;
  spiritStones: number;
  items: { itemId: string; quantity: number }[];
  attitudeChanges: { npcId: string; change: number }[];
  reputationChanges: { factionId: string; change: number }[];
  unlockedQuests: string[];
  message: string;
}

/** 创建空的奖励结果 */
export function createEmptyRewardResult(): RewardResult {
  return {
    success: true,
    experience: 0,
    spiritStones: 0,
    items: [],
    attitudeChanges: [],
    reputationChanges: [],
    unlockedQuests: [],
    message: '',
  };
}

/**
 * 合并多个奖励
 *
 * @param rewards - 奖励列表
 * @returns 合并后的奖励结果
 */
export function mergeRewards(rewards: QuestReward[]): RewardResult {
  const result = createEmptyRewardResult();

  for (const reward of rewards) {
    if (reward.experience) result.experience += reward.experience;
    if (reward.spiritStones) result.spiritStones += reward.spiritStones;
    if (reward.items) result.items.push(...reward.items);
    if (reward.attitudeChanges) result.attitudeChanges.push(...reward.attitudeChanges);
    if (reward.reputation) result.reputationChanges.push(reward.reputation);
    if (reward.unlockQuests) result.unlockedQuests.push(...reward.unlockQuests);
  }

  result.message = buildRewardMessage(result);
  return result;
}

/**
 * 构建奖励的可读消息
 */
export function buildRewardMessage(result: RewardResult): string {
  const parts: string[] = [];

  if (result.experience > 0) parts.push(`经验 +${result.experience}`);
  if (result.spiritStones > 0) parts.push(`灵石 +${result.spiritStones}`);
  if (result.items.length > 0) {
    parts.push(`获得: ${result.items.map(i => `${i.itemId} x${i.quantity}`).join(', ')}`);
  }
  if (result.attitudeChanges.length > 0) {
    parts.push(result.attitudeChanges.map(a => `${a.npcId} 好感度 ${a.change > 0 ? '+' : ''}${a.change}`).join(', '));
  }
  if (result.reputationChanges.length > 0) {
    parts.push(result.reputationChanges.map(r => `${r.factionId} 声望 ${r.change > 0 ? '+' : ''}${r.change}`).join(', '));
  }
  if (result.unlockedQuests.length > 0) {
    parts.push('解锁新任务!');
  }

  return parts.join(' | ');
}
