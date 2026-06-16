/**
 * useEquipment — 装备操作 Hook
 */

import { useCallback } from 'react';
import { useGameStore } from '@/views/game/state/GameStore';
import type { GameState } from '@/core/types';
import { equipItem as equipItemLogic, unequipItem as unequipItemLogic } from '../logic/slotSystem';
import { resolveItem, findItemByInstance } from '../logic/itemManager';
import { SLOT_DEFINITIONS } from '../data/slots';

export function useEquipment() {
  const { gameState, dispatch } = useGameStore();

  const p = gameState.protagonist;
  const items = p?.items ?? [];
  const slots = p?.slots ?? {};

  const equipItem = useCallback((instanceId: string, slotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = equipItemLogic(currentP.items, currentP.slots, instanceId, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        const pp = prev.protagonist;
        if (!pp) return prev;
        return {
          ...prev,
          protagonist: {
            ...pp,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          } as GameState['protagonist'],
        };
      });
    }
    return result;
  }, [gameState.protagonist, dispatch]);

  const unequipItem = useCallback((slotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = unequipItemLogic(currentP.items, currentP.slots, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        const pp = prev.protagonist;
        if (!pp) return prev;
        return {
          ...prev,
          protagonist: {
            ...pp,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          } as GameState['protagonist'],
        };
      });
    }
    return result;
  }, [gameState.protagonist, dispatch]);

  const getEquippedItem = useCallback((slotId: string) => {
    const instanceId = slots[slotId];
    if (!instanceId) return null;
    const instance = findItemByInstance(items, instanceId);
    if (!instance) return null;
    return resolveItem(instance);
  }, [items, slots]);

  const getEquipmentSlots = useCallback(() => {
    return SLOT_DEFINITIONS.filter(s => s.category === 'equipment');
  }, []);

  return {
    slots,
    equipItem,
    unequipItem,
    getEquippedItem,
    getEquipmentSlots,
  };
}
