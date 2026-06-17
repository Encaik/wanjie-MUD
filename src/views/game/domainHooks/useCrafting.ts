/**
 * useCrafting — 炼丹/炼器领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露开始/完成炼丹、炼器 action。
 */

'use client';

import { useCallback } from 'react';

import type { CraftingState, ForgingState } from '@/core/types';
import { addItem, createItemInstance } from '@/modules/item/logic';

import { useGameStore } from '../state/GameStore';
import { createAddMessageInternal } from './helpers';

export function useCrafting() {
  const { dispatch } = useGameStore();
  const addMsgInt = createAddMessageInternal();

  const startCrafting = useCallback((recipeId: string) => {
    dispatch(prev => ({
      ...prev,
      crafting: { recipeId, startTime: Date.now(), duration: 5000, quality: '中品' as const, success: true } as CraftingState,
    }));
  }, [dispatch]);

  const finishCrafting = useCallback(() => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      // 使用新物品系统：addItem 自动处理堆叠和创建
      const newItems = addItem(prev.protagonist.items, 'qi_gathering_pill', 1);
      return { ...prev, crafting: null, protagonist: { ...prev.protagonist, items: newItems }, messages: addMsgInt(prev.messages, 'success', '炼丹完成', '炼制成功！获得聚气丹！') };
    });
  }, [dispatch]);

  const startForging = useCallback((recipeId: string) => {
    dispatch(prev => ({
      ...prev,
      forging: { recipeId, startTime: Date.now(), duration: 5000, quality: '普通' as const, success: true } as ForgingState,
    }));
  }, [dispatch]);

  const finishForging = useCallback(() => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      // 使用新物品系统生成装备实例
      const newEquipment = createItemInstance('sword_iron', { source: 'craft' });
      const newItems = [...prev.protagonist.items, newEquipment];
      return { ...prev, forging: null, protagonist: { ...prev.protagonist, items: newItems }, messages: addMsgInt(prev.messages, 'success', '炼器完成', '炼制成功！获得铁剑！') };
    });
  }, [dispatch]);

  return { startCrafting, finishCrafting, startForging, finishForging };
}
