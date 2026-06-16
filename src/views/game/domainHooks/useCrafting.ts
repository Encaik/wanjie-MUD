// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * useCrafting — 炼丹/炼器领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露开始/完成炼丹、炼器 action。
 */

'use client';

import { useCallback } from 'react';

import type { ItemDefinition, CraftingState, ForgingState } from '@/core/types';
import { createInventoryItem } from '@/core/types';

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
      const newInventory = [...prev.protagonist.inventory];
      const pillDef: ItemDefinition = { id: 'pill_test', name: '测试丹药', type: '丹药', rarity: '普通' as const, description: '测试用丹药', effects: [], stackable: true, maxStack: 99 };
      newInventory.push(createInventoryItem(pillDef, 1));
      return { ...prev, crafting: null, protagonist: { ...prev.protagonist, inventory: newInventory }, messages: addMsgInt(prev.messages, 'success', '炼丹完成', '炼制成功！') };
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
      // TODO: 统一物品系统迁移 — createMinimalEquipment 暂代
      const newEquipment = { id: `eq_${Date.now()}`, name: '炼制武器', slot: 'melee' as const, rarity: '普通' as const, level: 1, exp: 0, attackBonus: 10, defenseBonus: 0, power: 20, description: '炼制获得的武器', isFragment: false, equipped: false, element: null, weaponCategory: null, compatibleElement: null, compatibleBonus: 0, providesSkillSlots: 0, acceptedSkillTag: 'instant' as const, allTechniques: [], equippedTechniques: [], techniqueSlots: 0, maxTechniqueSlots: 0, enhancement: 0, refinement: 0, affixes: [], setId: null };
      return { ...prev, forging: null, protagonist: { ...prev.protagonist, equipments: [...prev.protagonist.equipments, newEquipment] }, messages: addMsgInt(prev.messages, 'success', '炼器完成', '炼制成功！') };
    });
  }, [dispatch]);

  return { startCrafting, finishCrafting, startForging, finishForging };
}
