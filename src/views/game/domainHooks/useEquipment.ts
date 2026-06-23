/**
 * useEquipment — 装备/功法领域 Hook（统一物品系统）
 */

'use client';

import { useCallback } from 'react';

import type { GameState } from '@/core/types';
import { fragmentItem, synthesizeFragments } from '@/modules/item/logic/itemFragment';
import {
  findItemByInstance,
  hasEnough,
} from '@/modules/item/logic/itemManager';
import { resolveItem } from '@/modules/item/logic/itemManager';
import { upgradeItem } from '@/modules/item/logic/itemUpgrade';
import {
  equipItem as equipItemFn,
  unequipItem as unequipItemFn,
} from '@/modules/item/logic/slotSystem';

import { createAddMessageInternal } from './helpers';
import { useAddMessage } from '../hooks/useAddMessage';
import { useGameStore } from '../state/GameStore';

export function useEquipment() {
  const { gameState, dispatch } = useGameStore();
  const addMessage = useAddMessage();
  const addMsgInt = createAddMessageInternal();

  const p = gameState.protagonist;

  /** 装备功法到槽位 */
  const equipTechnique = useCallback((instanceId: string, slotId?: string) => {
    if (!p) return;
    const items = p.items;
    const slots = p.slots;

    // 找空闲功法槽位
    const targetSlot = slotId || (
      ['technique_atk_1', 'technique_atk_2', 'technique_atk_3', 'technique_def_1', 'technique_def_2', 'technique_def_3']
        .find(s => !slots[s])
    );
    if (!targetSlot) {
      addMessage('failure', '没有空闲的功法槽位', '');
      return;
    }

    const result = equipItemFn(items, slots, instanceId, targetSlot);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          },
        };
      });
      addMessage('info', result.message || '装备成功', '');
    } else {
      addMessage('failure', result.error || '装备失败', '');
    }
  }, [p, dispatch, addMessage]);

  /** 卸下功法 */
  const unequipTechnique = useCallback((slotId: string) => {
    if (!p) return;
    const result = unequipItemFn(p.items, p.slots, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          },
        };
      });
      addMessage('info', result.message || '卸下成功', '');
    }
  }, [p, dispatch, addMessage]);

  /** 装备装备 */
  const equipEquipment = useCallback((instanceId: string) => {
    if (!p) return;
    const instance = findItemByInstance(p.items, instanceId);
    if (!instance) return;
    const resolved = resolveItem(instance);
    const slotId = (resolved.ext as { equipSlot?: string }).equipSlot;
    if (!slotId) {
      addMessage('failure', '无法确定装备槽位', '');
      return;
    }

    const result = equipItemFn(p.items, p.slots, instanceId, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          },
        };
      });
      addMessage('info', result.message || '装备成功', '');
    }
  }, [p, dispatch, addMessage]);

  /** 卸下装备 */
  const unequipEquipment = useCallback((slotId: string) => {
    if (!p) return;
    const result = unequipItemFn(p.items, p.slots, slotId);
    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          },
        };
      });
    }
  }, [p, dispatch]);

  /** 升级物品 */
  const upgradeItemAction = useCallback((instanceId: string, materialTemplateId: string, quantity: number) => {
    if (!p) return;
    try {
      const result = upgradeItem(p.items, instanceId, [{ templateId: materialTemplateId, quantity }]);
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, items: result.inventory } };
      });
      if (result.leveledUp) {
        const resolved = resolveItem(result.upgradedItem);
        addMessage('info', `${resolved.name} 升级到 ${result.upgradedItem.level} 级！`, '');
      }
    } catch (e: unknown) {
      addMessage('failure', (e as Error).message, '');
    }
  }, [p, dispatch, addMessage]);

  /** 拆解物品 */
  const fragmentItemAction = useCallback((instanceId: string) => {
    if (!p) return;
    try {
      const newItems = fragmentItem(p.items, instanceId);
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, items: newItems } };
      });
      addMessage('info', '拆解成功', '');
    } catch (e: unknown) {
      addMessage('failure', (e as Error).message, '');
    }
  }, [p, dispatch, addMessage]);

  /** 合成碎片 */
  const synthesizeAction = useCallback((templateId: string) => {
    if (!p) return { success: false, message: '主角不存在' };
    const result = synthesizeFragments(p.items, templateId);
    if (result.synthesizedItem) {
      dispatch((prev: GameState) => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, items: result.inventory } };
      });
      addMessage('info', result.message, '');
    }
    return { success: !!result.synthesizedItem, message: result.message };
  }, [p, dispatch, addMessage]);

  // 旧接口兼容包装
  const performUpgradeTechniqueOld = useCallback((targetId: string, materialIds: string[]) => {
    if (materialIds.length > 0) {
      upgradeItemAction(targetId, materialIds[0], 1);
    }
  }, [upgradeItemAction]);

  const equipTechniqueOld = useCallback((techniqueOrId: unknown, slotIndex?: number) => {
    const id = typeof techniqueOrId === 'string' ? techniqueOrId : (techniqueOrId as Record<string, unknown>)?.instanceId as string;
    if (id) equipTechnique(id, slotIndex !== undefined ? `technique_atk_${slotIndex + 1}` : undefined);
  }, [equipTechnique]);

  const equipEquipmentOld = useCallback((equipmentOrId: unknown) => {
    const id = typeof equipmentOrId === 'string' ? equipmentOrId : (equipmentOrId as Record<string, unknown>)?.instanceId as string;
    if (id) equipEquipment(id);
  }, [equipEquipment]);

  const synthesizeFragmentOld = useCallback((type: string, rarity: string, sourceName?: string) => {
    return synthesizeAction(sourceName || type);
  }, [synthesizeAction]);

  return {
    items: p?.items || [],
    slots: p?.slots || {},
    equipTechnique: equipTechniqueOld,
    unequipTechnique,
    equipEquipment: equipEquipmentOld,
    unequipEquipment,
    upgradeItem: upgradeItemAction,
    fragmentItem: fragmentItemAction,
    synthesize: synthesizeAction,
    performUpgradeTechnique: performUpgradeTechniqueOld,
    performUpgradeEquipment: performUpgradeTechniqueOld,
    synthesizeFragment: synthesizeFragmentOld,
    updateTechnique: (_t: unknown) => {},
    updateEquipment: (_e: unknown) => {},
  };
}
