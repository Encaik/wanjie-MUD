/**
 * useShop — 商店领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露购买物品 action。
 */

'use client';

import { useCallback } from 'react';

import { addItem, removeItem, findItemsByTemplate, getItemCount } from '@/modules/item/logic';

import { useGameStore } from '../state/GameStore';
import { createAddMessageInternal } from './helpers';

export function useShop() {
  const { dispatch } = useGameStore();
  const addMsgInt = createAddMessageInternal();

  const getCurrencyName = (type: string, worldType?: string): string => {
    if (type === 'spirit_stone') {
      const names: Record<string, string> = { '修仙': '灵石', '高武': '武晶', '科幻': '能量块', '魔法': '魔晶', '异能': '源能石', '仙界': '仙石', '武侠': '银两', '末世': '补给点' };
      return worldType ? (names[worldType] || '灵石') : '灵石';
    }
    const nameMap: Record<string, string> = { contribution: '贡献', honor_point: '荣誉', sect_point: '宗门积分', ascension_mark: '飞升印记', event_token: '活动代币' };
    return nameMap[type] || type;
  };

  const buyShopItem = useCallback((
    itemId: string, price: number, currencyType: string, type: 'item' | 'technique' | 'equipment',
    itemData?: Record<string, unknown>, quantity: number = 1,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const totalCost = price * quantity;
      const itemName = (itemData?.name as string) || itemId;
      const currencyName = getCurrencyName(currencyType, prev.protagonist.world.type);

      // 添加购买物品到背包
      let newItems = addItem(prev.protagonist.items, itemId, quantity);

      // 更新货币余额
      const newCurrenciesState = {
        ...(prev.protagonist.currencies ?? { contribution: 0, spirit_stone: 0 }),
      };
      if (newCurrencies?.spirit_stone !== undefined) {
        const currentSpiritStones = getItemCount(newItems, 'wanjie:common:spirit_stone');
        if (newCurrencies.spirit_stone > currentSpiritStones) {
          newItems = addItem(newItems, 'wanjie:common:spirit_stone', newCurrencies.spirit_stone - currentSpiritStones);
        }
      }
      if (newCurrencies?.contribution !== undefined) {
        (newCurrenciesState as Record<string, number>).contribution = newCurrencies.contribution;
      }

      const message = quantity > 1
        ? `花费 ${totalCost} ${currencyName}，购买了 ${quantity} 个「${itemName}」`
        : `花费 ${totalCost} ${currencyName}，购买了「${itemName}」`;

      return {
        ...prev,
        protagonist: { ...prev.protagonist, items: newItems, currencies: newCurrenciesState },
        messages: addMsgInt(prev.messages, 'success', '购买成功', message),
      };
    });
  }, [dispatch]);

  const buyWithContribution = useCallback((itemId: string, price: number, type: 'item' | 'technique' | 'equipment', itemData?: Record<string, unknown>, quantity: number = 1) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const totalCost = price * quantity;
      const itemName = (itemData?.name as string) || itemId;
      const newItems = addItem(prev.protagonist.items, itemId, quantity);
      const message = quantity > 1
        ? `花费 ${totalCost} 贡献，购买了 ${quantity} 个「${itemName}」`
        : `花费 ${totalCost} 贡献，购买了「${itemName}」`;
      return { ...prev, protagonist: { ...prev.protagonist, items: newItems }, messages: addMsgInt(prev.messages, 'success', '购买成功', message) };
    });
  }, [dispatch]);

  return { buyShopItem, buyWithContribution };
}
