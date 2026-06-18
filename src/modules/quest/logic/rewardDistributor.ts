/**
 * 任务奖励分发器
 *
 * 纯函数集合，处理任务/阶段奖励的计算和发放。
 * 货币按世界观自动映射为对应物品，不特殊处理。
 *
 * @module modules/quest/logic
 */

import type { QuestReward } from '@/core/types';
import { hasTemplate, getTemplate } from '@/modules/item/data';
import { getWorldviewCurrencyItemId } from '@/modules/reward-pool/logic/poolEngine';

// ============================================
// 奖励结果类型
// ============================================

/** 奖励发放结果（货币已统一为物品，与其他物品无差别） */
export interface RewardResult {
  success: boolean;
  experience: number;
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
    items: [],
    attitudeChanges: [],
    reputationChanges: [],
    unlockedQuests: [],
    message: '',
  };
}

// ============================================
// 合并 / 消息
// ============================================

/**
 * 合并多个奖励
 */
export function mergeRewards(rewards: QuestReward[], worldviewId?: string): RewardResult {
  const result = createEmptyRewardResult();

  for (const reward of rewards) {
    if (reward.experience) result.experience += reward.experience;
    if (reward.spiritStones && reward.spiritStones > 0) {
      // 货币按世界观解析为具体物品
      const currencyId = getWorldviewCurrencyItemId(worldviewId);
      result.items.push({ itemId: currencyId, quantity: reward.spiritStones });
    }
    if (reward.items) result.items.push(...reward.items);
    if (reward.attitudeChanges) result.attitudeChanges.push(...reward.attitudeChanges);
    if (reward.reputation) result.reputationChanges.push(reward.reputation);
    if (reward.unlockQuests) result.unlockedQuests.push(...reward.unlockQuests);
  }

  result.message = buildRewardMessage(result, worldviewId);
  return result;
}

/**
 * 构建奖励的可读消息
 *
 * 货币显示名称通过 worldviewId 解析。
 */
export function buildRewardMessage(result: RewardResult, worldviewId?: string): string {
  const parts: string[] = [];

  if (result.experience > 0) parts.push(`经验 +${result.experience}`);

  if (result.items.length > 0) {
    parts.push(`获得: ${result.items.map(i => {
      let name: string;
      if (hasTemplate(i.itemId)) {
        name = getTemplate(i.itemId).name;
      } else {
        name = i.itemId.split(':').pop() ?? i.itemId;
      }
      return `${name} x${i.quantity}`;
    }).join(', ')}`);
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

// ============================================
// 奖励池桥接
// ============================================

export async function calculateQuestRewards(
  questRewards: QuestReward[],
  stageRewards: QuestReward[],
  rewardPoolConfig?: { poolId: string; multiplier?: number },
  rollPool?: (poolId: string, ctx: Record<string, unknown>) => Promise<{
    items: Array<{ templateId: string; quantity: number }>;
    summary: string;
  }>,
  rollContext?: Record<string, unknown>,
): Promise<RewardResult> {
  if (rewardPoolConfig && rollPool && rollContext) {
    try {
      const poolResult = await rollPool(rewardPoolConfig.poolId, {
        ...rollContext,
        quantityMultiplier: rewardPoolConfig.multiplier ?? 1,
      });

      const result = createEmptyRewardResult();
      // 货币已在 poolResult.items 中（poolEngine 已解析为世界观货币）
      result.items = poolResult.items.map(i => ({
        itemId: i.templateId,
        quantity: i.quantity,
      }));
      result.message = poolResult.summary;

      const staticResult = mergeRewards(stageRewards);
      result.experience += staticResult.experience;
      result.items.push(...staticResult.items);
      result.attitudeChanges.push(...staticResult.attitudeChanges);
      result.reputationChanges.push(...staticResult.reputationChanges);
      result.unlockedQuests.push(...staticResult.unlockedQuests);
      result.message = [poolResult.summary, staticResult.message].filter(Boolean).join(' | ');

      return result;
    } catch {
      // 回退静态
    }
  }

  return mergeRewards([...questRewards, ...stageRewards]);
}

export function calculateStaticQuestRewards(
  questRewards: QuestReward[],
  stageRewards: QuestReward[],
  worldviewId?: string,
): RewardResult {
  return mergeRewards([...questRewards, ...stageRewards], worldviewId);
}
