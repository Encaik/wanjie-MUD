/**
 * useInventory — 统一背包操作 Hook
 */

import { useCallback } from 'react';
import type { ItemInstance } from '../types';
import {
  addItem as addItemLogic,
  removeItem as removeItemLogic,
  getItemCount,
  getCurrencyAmount,
  hasEnough,
  findItemsByTemplate,
  findItemByInstance,
  resolveItem,
} from '../logic/itemManager';
import { useConsumable } from '../logic/itemUse';
import { useGameStore } from '@/views/game/state/GameStore';
import type { GameState } from '@/core/types';

export function useInventory() {
  const { gameState, dispatch } = useGameStore();

  const items: ItemInstance[] = gameState.protagonist?.items ?? [];

  const addItem = useCallback((
    templateId: string,
    quantity: number,
    overrides?: Parameters<typeof addItemLogic>[3]
  ) => {
    dispatch((prev: GameState) => {
      const p = prev.protagonist;
      if (!p) return prev;
      return {
        ...prev,
        protagonist: {
          ...p,
          items: addItemLogic(p.items, templateId, quantity, overrides),
        } as GameState['protagonist'],
      };
    });
  }, [dispatch]);

  const removeItem = useCallback((instanceId: string, quantity: number) => {
    dispatch((prev: GameState) => {
      const p = prev.protagonist;
      if (!p) return prev;
      return {
        ...prev,
        protagonist: {
          ...p,
          items: removeItemLogic(p.items, instanceId, quantity),
        } as GameState['protagonist'],
      };
    });
  }, [dispatch]);

  const useItem = useCallback((instanceId: string) => {
    const p = gameState.protagonist;
    if (!p) throw new Error('主角不存在');
    const result = useConsumable(p.items, instanceId);
    dispatch((prev: GameState) => {
      const pp = prev.protagonist;
      if (!pp) return prev;
      return {
        ...prev,
        protagonist: { ...pp, items: result.inventory } as GameState['protagonist'],
      };
    });
    return result;
  }, [gameState.protagonist, dispatch]);

  return {
    items,
    addItem,
    removeItem,
    useItem,
    getCount: (templateId: string) => getItemCount(items, templateId),
    getCurrency: (currencyId: string) => getCurrencyAmount(items, currencyId),
    checkEnough: (templateId: string, count: number) => hasEnough(items, templateId, count),
    findByTemplate: (templateId: string) => findItemsByTemplate(items, templateId),
    findByInstance: (instanceId: string) => findItemByInstance(items, instanceId),
    getResolvedItem: (instance: ItemInstance) => resolveItem(instance),
    getByCategory: (category: string) => items.filter(i => {
      try { return resolveItem(i).category === category; }
      catch { return false; }
    }),
  };
}
