/**
 * hooks/useRewardDisplay.ts — 奖励展示 Hook
 *
 * 将 RollResult 转化为 UI 就绪的展示数据：
 * - 按稀有度排序的物品列表
 * - 汇总货币
 * - 格式化文本
 */

import { useMemo } from 'react';
import type { RollResult, RollResultItem, RollResultCurrency } from '../types';

/** 展示就绪的单个物品 */
export interface DisplayItem {
  templateId: string;
  instanceId: string;
  quantity: number;
  rarity: string;
  /** 稀有度排序键（越大越稀有） */
  rarityOrder: number;
}

/** 展示就绪的奖励数据 */
export interface RewardDisplayData {
  /** 按稀有度降序排列的物品 */
  items: DisplayItem[];
  /** 货币汇总（同类型合并） */
  currencies: RollResultCurrency[];
  /** 格式化摘要 */
  summary: string;
  /** 是否为空奖励 */
  isEmpty: boolean;
}

/** 稀有度排序映射 */
const RARITY_SORT_ORDER: Record<string, number> = {
  mythic: 6,
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

/**
 * 将 RollResult 转化为 UI 展示数据
 *
 * 物品按稀有度降序排列，同类型货币合并。
 *
 * @param result - 池子滚动结果
 * @returns UI 就绪的展示数据
 */
export function useRewardDisplay(result: RollResult | null): RewardDisplayData {
  return useMemo(() => {
    if (!result) {
      return { items: [], currencies: [], summary: '', isEmpty: true };
    }

    // 物品按稀有度降序排列
    const items: DisplayItem[] = result.items
      .map(item => ({
        templateId: item.templateId,
        instanceId: item.instanceId,
        quantity: item.quantity,
        rarity: item.rarity,
        rarityOrder: RARITY_SORT_ORDER[item.rarity] ?? 0,
      }))
      .sort((a, b) => b.rarityOrder - a.rarityOrder);

    // 同类型货币合并
    const currencyMap = new Map<string, number>();
    for (const c of result.currencies) {
      currencyMap.set(c.type, (currencyMap.get(c.type) ?? 0) + c.amount);
    }
    const currencies: RollResultCurrency[] = Array.from(currencyMap.entries()).map(
      ([type, amount]) => ({ type, amount })
    );

    return {
      items,
      currencies,
      summary: result.summary,
      isEmpty: items.length === 0 && currencies.length === 0,
    };
  }, [result]);
}
