/**
 * useEquipment — 装备/功法领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露装备/卸下功法装备、升级、碎片合成等 action。
 */

'use client';

import { useCallback } from 'react';

import type { Technique, TechniqueType, Equipment, EquipmentSlot, ItemRarity } from '@/core/types';
import {
  createEmptyFragmentInventory,
  synthesizeRarityFragmentGroup,
  synthesizeFragmentByName,
  getFragmentGroupsByName,
} from '@/modules/crafting/logic/fragmentSystem';
import { upgradeTechnique, upgradeEquipment, getMaterialExpValue } from '@/modules/equipment/logic/upgradeSystem';

import { useGameStore } from '../GameStore';
import { useAddMessage } from '../useAddMessage';
import { createAddMessageInternal } from './helpers';


export function useEquipment() {
  const { gameState, dispatch } = useGameStore();
  const addMessage = useAddMessage();
  const addMsgInt = createAddMessageInternal();

  // 装备功法
  const equipTechnique = useCallback((technique: Technique, slotIndex?: number) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const type = technique.type;
      const slotsKey = type === 'attack' ? 'equippedAttackTechniques' : 'equippedDefenseTechniques';
      const currentSlots = prev.protagonist[slotsKey] || [null, null, null];
      const slots: (Technique | null)[] = [currentSlots[0] ?? null, currentSlots[1] ?? null, currentSlots[2] ?? null];

      if (slots.some(t => t?.id === technique.id)) return prev;

      let targetIndex = slotIndex;
      if (targetIndex === undefined || targetIndex < 0 || targetIndex > 2) {
        targetIndex = slots.findIndex(t => t === null);
        if (targetIndex === -1) targetIndex = 0;
      }

      const newSlots = [...slots] as [Technique | null, Technique | null, Technique | null];
      newSlots[targetIndex] = technique;

      return { ...prev, protagonist: { ...prev.protagonist, [slotsKey]: newSlots } };
    });
  }, [dispatch]);

  // 卸下功法
  const unequipTechnique = useCallback((type: 'attack' | 'defense', slotIndex?: number) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const slotsKey = type === 'attack' ? 'equippedAttackTechniques' : 'equippedDefenseTechniques';
      const currentSlots = prev.protagonist[slotsKey] || [null, null, null];
      const slots: (Technique | null)[] = [currentSlots[0] ?? null, currentSlots[1] ?? null, currentSlots[2] ?? null];

      if (slotIndex !== undefined && slotIndex >= 0 && slotIndex <= 2) {
        const newSlots = [...slots] as [Technique | null, Technique | null, Technique | null];
        newSlots[slotIndex] = null;
        return { ...prev, protagonist: { ...prev.protagonist, [slotsKey]: newSlots } };
      }
      return { ...prev, protagonist: { ...prev.protagonist, [slotsKey]: [null, null, null] as [Technique | null, Technique | null, Technique | null] } };
    });
  }, [dispatch]);

  // 装备物品
  const equipEquipment = useCallback((equipment: Equipment) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          [`equipped${equipment.slot.charAt(0).toUpperCase() + equipment.slot.slice(1)}`]: equipment,
        } as any,
      };
    });
  }, [dispatch]);

  // 卸下装备
  const unequipEquipment = useCallback((slot: EquipmentSlot) => {
    dispatch(prev => ({
      ...prev,
      protagonist: prev.protagonist ? {
        ...prev.protagonist,
        [`equipped${slot.charAt(0).toUpperCase() + slot.slice(1)}`]: null,
      } as any : null,
    }));
  }, [dispatch]);

  // 更新功法
  const updateTechnique = useCallback((updatedTechnique: Technique) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const idx = prev.protagonist.techniques.findIndex(t => t.id === updatedTechnique.id);
      if (idx === -1) return prev;
      const newTechniques = [...prev.protagonist.techniques];
      newTechniques[idx] = updatedTechnique;
      return { ...prev, protagonist: { ...prev.protagonist, techniques: newTechniques } };
    });
  }, [dispatch]);

  // 更新装备
  const updateEquipment = useCallback((updatedEquipment: Equipment) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const idx = prev.protagonist.equipments.findIndex(e => e.id === updatedEquipment.id);
      if (idx === -1) return prev;
      const newEquipments = [...prev.protagonist.equipments];
      newEquipments[idx] = updatedEquipment;
      const slotKey = `equipped${updatedEquipment.slot.charAt(0).toUpperCase() + updatedEquipment.slot.slice(1)}` as keyof typeof prev.protagonist;
      const currentEquipped = prev.protagonist[slotKey] as Equipment | null;
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          equipments: newEquipments,
          ...(currentEquipped?.id === updatedEquipment.id ? { [slotKey]: updatedEquipment } : {}),
        } as any,
      };
    });
  }, [dispatch]);

  // 升级功法
  const performUpgradeTechnique = useCallback((targetId: string, materialIds: string[]) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const technique = prev.protagonist.techniques.find(t => t.id === targetId);
      if (!technique) return prev;
      const materialTechniques = prev.protagonist.techniques.filter(t => materialIds.includes(t.id));
      if (materialTechniques.length === 0) return prev;
      const totalExp = materialTechniques.reduce((sum, t) => sum + getMaterialExpValue(t.level, t.rarity), 0);
      const { technique: upgraded, levelsGained } = upgradeTechnique(technique, totalExp);
      const updatedTechniques = prev.protagonist.techniques
        .filter(t => !materialIds.includes(t.id))
        .map(t => t.id === targetId ? upgraded : t);
      const updateEquipped = (ts: (Technique | null)[]) => ts.map(t => t?.id === targetId ? upgraded : t);
      const msg = levelsGained > 0
        ? `消耗 ${materialTechniques.length} 个材料，${technique.name} 升级到 Lv.${upgraded.level}！`
        : `消耗 ${materialTechniques.length} 个材料，获得 ${totalExp} 经验`;
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          techniques: updatedTechniques,
          equippedAttackTechniques: updateEquipped(prev.protagonist.equippedAttackTechniques),
          equippedDefenseTechniques: updateEquipped(prev.protagonist.equippedDefenseTechniques),
        },
        messages: addMsgInt(prev.messages, levelsGained > 0 ? 'success' : 'info', '功法升级', msg),
      };
    });
  }, [dispatch]);

  // 升级装备
  const performUpgradeEquipment = useCallback((targetId: string, materialIds: string[]) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const equipment = prev.protagonist.equipments.find(e => e.id === targetId);
      if (!equipment) return prev;
      const materialEquipments = prev.protagonist.equipments.filter(e => materialIds.includes(e.id));
      if (materialEquipments.length === 0) return prev;
      const totalExp = materialEquipments.reduce((sum, e) => sum + getMaterialExpValue(e.level, e.rarity), 0);
      const { equipment: upgraded, levelsGained } = upgradeEquipment(equipment, totalExp);
      const updatedEquipments = prev.protagonist.equipments
        .filter(e => !materialIds.includes(e.id))
        .map(e => e.id === targetId ? upgraded : e);
      const updateField = <T extends Equipment | null>(eq: T): T => eq?.id === targetId ? upgraded as T : eq;
      const msg = levelsGained > 0
        ? `消耗 ${materialEquipments.length} 件材料，${equipment.name} 升级到 Lv.${upgraded.level}！`
        : `消耗 ${materialEquipments.length} 件材料，获得 ${totalExp} 经验`;
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          equipments: updatedEquipments,
          equippedMelee: updateField(prev.protagonist.equippedMelee),
          equippedRanged: updateField(prev.protagonist.equippedRanged),
          equippedHead: updateField(prev.protagonist.equippedHead),
          equippedBody: updateField(prev.protagonist.equippedBody),
          equippedLegs: updateField(prev.protagonist.equippedLegs),
          equippedFeet: updateField(prev.protagonist.equippedFeet),
        },
        messages: addMsgInt(prev.messages, levelsGained > 0 ? 'success' : 'info', '装备升级', msg),
      };
    });
  }, [dispatch]);

  // 碎片合成
  const synthesizeFragment = useCallback((type: 'technique' | 'equipment', rarity: ItemRarity, sourceName?: string) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const fragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
      let result: { success: boolean; item?: any; message: string };
      if (sourceName) {
        result = synthesizeFragmentByName(fragmentInventory, sourceName, type);
      } else {
        const groups = getFragmentGroupsByName(fragmentInventory);
        const group = groups.find(g => g.type === type && g.rarity === rarity && g.canSynthesize);
        result = group
          ? synthesizeFragmentByName(fragmentInventory, group.sourceName, type)
          : synthesizeRarityFragmentGroup(fragmentInventory, type, rarity, prev.protagonist.level, prev.protagonist.world.worldviewId);
      }
      if (result.success && result.item) {
        if (type === 'technique') {
          return {
            ...prev,
            protagonist: { ...prev.protagonist, techniques: [...prev.protagonist.techniques, result.item], fragmentInventory },
            messages: addMsgInt(prev.messages, 'success', '合成成功', result.message),
          };
        }
        return {
          ...prev,
          protagonist: { ...prev.protagonist, equipments: [...prev.protagonist.equipments, result.item], fragmentInventory },
          messages: addMsgInt(prev.messages, 'success', '重铸成功', result.message),
        };
      }
      return { ...prev, messages: addMsgInt(prev.messages, 'failure', type === 'technique' ? '合成失败' : '重铸失败', result.message) };
    });
  }, [dispatch]);

  return { equipTechnique, unequipTechnique, equipEquipment, unequipEquipment, updateTechnique, updateEquipment, performUpgradeTechnique, performUpgradeEquipment, synthesizeFragment };
}
