/**
 * useTechniques — 功法操作 Hook
 */

import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/views/game/state/GameStore';
import type { GameState } from '@/core/types';
import { equipItem as equipItemLogic, unequipItem as unequipItemLogic } from '../logic/slotSystem';
import { resolveItem, findItemByInstance } from '../logic/itemManager';
import { SLOT_DEFINITIONS } from '../data/slots';
import type { ItemInstance } from '../types';

export function useTechniques() {
  const { gameState, dispatch } = useGameStore();
  const p = gameState.protagonist;
  const items = p?.items ?? [];
  const slots = p?.slots ?? {};

  /** 功法槽位列表 */
  const techniqueSlots = useMemo(() =>
    SLOT_DEFINITIONS.filter(s => s.category === 'technique'),
  []);

  /** 装备功法 */
  const equipTechnique = useCallback((instanceId: string, slotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = equipItemLogic(currentP.items, currentP.slots, instanceId, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        const pp = prev.protagonist;
        if (!pp) return prev;
        return {
          ...prev,
          protagonist: { ...pp, items: result.updatedInventory!, slots: result.updatedSlots! } as GameState['protagonist'],
        };
      });
    }
    return result;
  }, [gameState.protagonist, dispatch]);

  /** 卸下功法 */
  const unequipTechnique = useCallback((slotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = unequipItemLogic(currentP.items, currentP.slots, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        const pp = prev.protagonist;
        if (!pp) return prev;
        return {
          ...prev,
          protagonist: { ...pp, items: result.updatedInventory!, slots: result.updatedSlots! } as GameState['protagonist'],
        };
      });
    }
    return result;
  }, [gameState.protagonist, dispatch]);

  /** 获取已装备的攻击功法 */
  const equippedAttack = useMemo(() => {
    return techniqueSlots
      .filter(s => s.acceptedSubcategory === 'attack')
      .map(s => {
        const id = slots[s.slotId];
        if (!id) return null;
        const inst = findItemByInstance(items, id);
        return inst ? resolveItem(inst) : null;
      });
  }, [techniqueSlots, slots, items]);

  /** 获取已装备的防御功法 */
  const equippedDefense = useMemo(() => {
    return techniqueSlots
      .filter(s => s.acceptedSubcategory === 'defense')
      .map(s => {
        const id = slots[s.slotId];
        if (!id) return null;
        const inst = findItemByInstance(items, id);
        return inst ? resolveItem(inst) : null;
      });
  }, [techniqueSlots, slots, items]);

  /** 获取背包中的功法 */
  const ownedTechniques = useMemo(() => {
    return items
      .filter(i => {
        try { return resolveItem(i).category === 'technique'; }
        catch { return false; }
      })
      .map(i => resolveItem(i));
  }, [items]);

  return {
    techniqueSlots,
    equippedAttack,
    equippedDefense,
    ownedTechniques,
    equipTechnique,
    unequipTechnique,
  };
}
