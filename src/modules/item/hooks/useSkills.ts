/**
 * useSkills — 技能操作 Hook
 */

import { useCallback, useMemo } from 'react';

import type { GameState } from '@/core/types';
import { useGameStore } from '@/views/game/state/GameStore';

import { resolveItem, findItemByInstance } from '../logic/itemManager';
import { equipSkill as equipSkillLogic, unequipSkill as unequipSkillLogic, getAvailableSkillSlots } from '../logic/skillSystem';

export function useSkills() {
  const { gameState, dispatch } = useGameStore();
  const p = gameState.protagonist;
  const items = p?.items ?? [];
  const slots = p?.slots ?? {};

  /** 装备技能到技能槽 */
  const equipSkill = useCallback((skillInstanceId: string, skillSlotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = equipSkillLogic(currentP.items, currentP.slots, skillInstanceId, skillSlotId);
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

  /** 卸下技能 */
  const unequipSkill = useCallback((skillSlotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = unequipSkillLogic(currentP.items, currentP.slots, skillSlotId);
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

  /** 可用技能槽位 */
  const availableSkillSlots = useMemo(() => getAvailableSkillSlots(slots), [slots]);

  /** 背包中的技能物品 */
  const ownedSkills = useMemo(() => {
    return items
      .filter(i => {
        try { return resolveItem(i).category === 'skill' && !i.isFragment && !i.equipped; }
        catch { return false; }
      })
      .map(i => resolveItem(i));
  }, [items]);

  /** 已装备到各槽位的技能 */
  const equippedSkills = useMemo(() => {
    const result: Record<string, ReturnType<typeof resolveItem> | null> = {};
    for (const slotId of availableSkillSlots) {
      const id = slots[slotId];
      if (id) {
        const inst = findItemByInstance(items, id);
        result[slotId] = inst ? resolveItem(inst) : null;
      } else {
        result[slotId] = null;
      }
    }
    return result;
  }, [availableSkillSlots, slots, items]);

  return {
    availableSkillSlots,
    ownedSkills,
    equippedSkills,
    equipSkill,
    unequipSkill,
  };
}
