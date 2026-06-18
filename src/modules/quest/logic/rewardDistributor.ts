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

// ============================================
// 奖励池桥接
// ============================================

/**
 * 计算任务奖励（静态 + 奖励池）
 *
 * 优先使用 quest.rewardPool 走奖励池动态生成，
 * 否则合并 quest.rewards 和阶段 rewards 静态发放。
 *
 * @param questRewards - 任务定义的静态奖励（quest.rewards）
 * @param stageRewards - 阶段累计奖励
 * @param rewardPoolConfig - 奖励池配置
 * @param rollPool - 奖励池滚动函数（外部注入，避免循环依赖）
 * @param rollContext - 奖励池上下文
 */
export async function calculateQuestRewards(
  questRewards: QuestReward[],
  stageRewards: QuestReward[],
  rewardPoolConfig?: { poolId: string; multiplier?: number },
  rollPool?: (poolId: string, ctx: Record<string, unknown>) => Promise<{
    items: Array<{ templateId: string; quantity: number }>;
    currencies: Array<{ type: string; amount: number }>;
    summary: string;
  }>,
  rollContext?: Record<string, unknown>,
): Promise<RewardResult> {
  // 奖励池路径
  if (rewardPoolConfig && rollPool && rollContext) {
    try {
      const poolResult = await rollPool(rewardPoolConfig.poolId, {
        ...rollContext,
        quantityMultiplier: rewardPoolConfig.multiplier ?? 1,
      });

      const result = createEmptyRewardResult();
      result.experience = 0; // 奖励池不产出经验（由静态奖励提供）
      result.spiritStones = poolResult.currencies
        .filter(c => c.type === 'spirit_stone')
        .reduce((sum, c) => sum + c.amount, 0);
      result.items = poolResult.items.map(i => ({
        itemId: i.templateId,
        quantity: i.quantity,
      }));
      result.message = poolResult.summary;

      // 合并静态阶段奖励
      const staticResult = mergeRewards(stageRewards);
      result.experience += staticResult.experience;
      result.spiritStones += staticResult.spiritStones;
      result.items.push(...staticResult.items);
      result.attitudeChanges.push(...staticResult.attitudeChanges);
      result.reputationChanges.push(...staticResult.reputationChanges);
      result.unlockedQuests.push(...staticResult.unlockedQuests);
      result.message = [poolResult.summary, staticResult.message].filter(Boolean).join(' | ');

      return result;
    } catch {
      // 奖励池失败，回退到静态奖励
    }
  }

  // 静态奖励路径
  return mergeRewards([...questRewards, ...stageRewards]);
}

/**
 * 同步版计算任务奖励（不依赖奖励池）
 *
 * 用于不需要走奖励池的简单任务。
 */
export function calculateStaticQuestRewards(
  questRewards: QuestReward[],
  stageRewards: QuestReward[],
): RewardResult {
  return mergeRewards([...questRewards, ...stageRewards]);
}
