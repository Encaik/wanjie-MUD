/**
 * useShop — 商店领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露购买物品 action。
 */

'use client';

import { useCallback } from 'react';

import type { ItemDefinition } from '@/core/types';
import { createInventoryItem } from '@/core/types';
import { addToInventory } from '@/modules/equipment/hooks/inventoryUtils';

import { useGameStore } from '../GameStore';
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
    itemData?: any, quantity: number = 1,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const totalCost = price * quantity;
      const itemDef = itemData as ItemDefinition | undefined;

      if (!itemDef || !itemDef.name) {
        const currencyName = getCurrencyName(currencyType, prev.protagonist.world.type);
        const message = `花费 ${totalCost} ${currencyName}`;
        let newInventory = prev.protagonist.inventory;
        if (newCurrencies?.spirit_stone !== undefined) {
          const idx = newInventory.findIndex(i => i.definition.id === 'spirit_stone');
          if (idx !== -1) { newInventory = [...newInventory]; newInventory[idx] = { ...newInventory[idx], quantity: newCurrencies.spirit_stone }; }
        }
        return {
          ...prev,
          protagonist: { ...prev.protagonist, inventory: newInventory, currencies: { ...prev.protagonist.currencies, contribution: newCurrencies?.contribution ?? prev.protagonist.currencies?.contribution ?? 0 } },
          messages: addMsgInt(prev.messages, 'success', '购买成功', message),
        };
      }

      const itemName = itemDef.name || itemId;
      const currencyName = getCurrencyName(currencyType, prev.protagonist.world.type);
      const newItem = createInventoryItem(itemDef, quantity);
      let newInventory = addToInventory(prev.protagonist.inventory, newItem);

      if (newCurrencies?.spirit_stone !== undefined) {
        const idx = newInventory.findIndex(i => i.definition.id === 'spirit_stone');
        if (idx !== -1) { newInventory = [...newInventory]; newInventory[idx] = { ...newInventory[idx], quantity: newCurrencies.spirit_stone }; }
        else if (newCurrencies.spirit_stone > 0) {
          const def: ItemDefinition = { id: 'spirit_stone', name: '武晶', type: '灵石', rarity: '普通', description: '修仙界的通用货币', stackable: true, maxStack: 999999, effects: [] };
          newInventory = addToInventory(newInventory, createInventoryItem(def, newCurrencies.spirit_stone));
        }
      }

      const message = quantity > 1 ? `花费 ${totalCost} ${currencyName}，购买了 ${quantity} 个「${itemName}」` : `花费 ${totalCost} ${currencyName}，购买了「${itemName}」`;
      return {
        ...prev,
        protagonist: { ...prev.protagonist, inventory: newInventory, currencies: { ...prev.protagonist.currencies, contribution: newCurrencies?.contribution ?? prev.protagonist.currencies?.contribution ?? 0 } },
        messages: addMsgInt(prev.messages, 'success', '购买成功', message),
      };
    });
  }, [dispatch]);

  const buyWithContribution = useCallback((itemId: string, price: number, type: 'item' | 'technique' | 'equipment', itemData?: any, quantity: number = 1) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const totalCost = price * quantity;
      const itemDef = itemData as ItemDefinition;
      const itemName = itemDef?.name || itemId;
      const newItem = createInventoryItem(itemDef, quantity);
      const newInventory = addToInventory(prev.protagonist.inventory, newItem);
      const message = quantity > 1 ? `花费 ${totalCost} 贡献，购买了 ${quantity} 个「${itemName}」` : `花费 ${totalCost} 贡献，购买了「${itemName}」`;
      return { ...prev, protagonist: { ...prev.protagonist, inventory: newInventory }, messages: addMsgInt(prev.messages, 'success', '购买成功', message) };
    });
  }, [dispatch]);

  return { buyShopItem, buyWithContribution };
}
