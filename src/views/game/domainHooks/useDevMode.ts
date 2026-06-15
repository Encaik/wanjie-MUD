/**
 * useDevMode — 开发者模式 Hook
 *
 * 从 GameStore 自取状态，对外暴露无敌模式切换和开发者工具函数。
 */

'use client';

import { useCallback } from 'react';

import { DEFAULT_PROTAGONIST_EXTENSION } from '@/core/types';

import { useGameStore } from '../GameStore';
import { createAddMessageInternal } from './helpers';

export function useDevMode() {
  const { gameState, dispatch } = useGameStore();
  const addMsgInt = createAddMessageInternal();

  const devInvincible = gameState.devMode?.invincible ?? false;

  const onToggleDevInvincible = useCallback(() => {
    dispatch(prev => ({
      ...prev,
      devMode: { invincible: !prev.devMode?.invincible },
      messages: addMsgInt(prev.messages, 'info', '开发者', `战斗无敌模式: ${!prev.devMode?.invincible ? '已启用' : '已关闭'}`),
    }));
  }, [dispatch]);

  const devHandlers = {
    onUpdateLevel: useCallback((level: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, level: Math.max(1, Math.min(100, level)), experience: 0 }, messages: addMsgInt(prev.messages, 'info', '开发者', `等级设置为 ${level}`) };
      });
    }, [dispatch]),
    onUpdateExperience: useCallback((experience: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, experience: Math.max(0, experience) }, messages: addMsgInt(prev.messages, 'info', '开发者', `经验设置为 ${experience}`) };
      });
    }, [dispatch]),
    onUpdateHp: useCallback((hp: number, maxHp?: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        const newMax = maxHp ?? prev.protagonist.maxHp;
        return { ...prev, protagonist: { ...prev.protagonist, currentHp: Math.max(0, Math.min(newMax, hp)), maxHp: newMax }, messages: addMsgInt(prev.messages, 'info', '开发者', `HP设置为 ${hp}`) };
      });
    }, [dispatch]),
    onUpdateMp: useCallback((mp: number, maxMp?: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        const newMax = maxMp ?? prev.protagonist.maxMp;
        return { ...prev, protagonist: { ...prev.protagonist, currentMp: Math.max(0, Math.min(newMax, mp)), maxMp: newMax }, messages: addMsgInt(prev.messages, 'info', '开发者', `MP设置为 ${mp}`) };
      });
    }, [dispatch]),
    onUpdateStat: useCallback((stat: string, value: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, stats: { ...prev.protagonist.stats, [stat as keyof typeof prev.protagonist.stats]: Math.max(1, value) } }, messages: addMsgInt(prev.messages, 'info', '开发者', `${stat}设置为 ${value}`) };
      });
    }, [dispatch]),
    onUpdateMentalState: useCallback((mental: number, demonProbability?: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        const current = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        return { ...prev, protagonist: { ...prev.protagonist, mentalState: { ...current, stability: Math.max(0, Math.min(100, mental)), demonChance: demonProbability ?? current.demonChance } }, messages: addMsgInt(prev.messages, 'info', '开发者', `心境设置为 ${mental}`) };
      });
    }, [dispatch]),
    onUpdatePathLevel: useCallback((pathLevel: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        return { ...prev, protagonist: { ...prev.protagonist, pathLevel: Math.max(1, pathLevel), pathExp: 0 } };
      });
    }, [dispatch]),
    onAddItem: useCallback((itemId: string, quantity: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        const existing = prev.protagonist.inventory.find(i => i.definition.id === itemId);
        if (existing) {
          return { ...prev, protagonist: { ...prev.protagonist, inventory: prev.protagonist.inventory.map(i => i.definition.id === itemId ? { ...i, quantity: i.quantity + quantity } : i) } };
        }
        const { createInventoryItem } = require('@/core/types');
        const { getItemDefinition } = require('@/modules/equipment/logic/items');
        const def = getItemDefinition(itemId) || { id: itemId, name: itemId, type: '材料', rarity: '普通', description: '', effects: [], stackable: true, maxStack: 99 };
        return { ...prev, protagonist: { ...prev.protagonist, inventory: [...prev.protagonist.inventory, createInventoryItem(def, quantity)] } };
      });
    }, [dispatch]),
    onAddSpiritStones: useCallback((amount: number) => {
      dispatch(prev => {
        if (!prev.protagonist) return prev;
        const idx = prev.protagonist.inventory.findIndex(i => i.definition.id === 'spirit_stone');
        if (idx >= 0) {
          return { ...prev, protagonist: { ...prev.protagonist, inventory: prev.protagonist.inventory.map((i, j) => j === idx ? { ...i, quantity: i.quantity + amount } : i) } };
        }
        const def: any = { id: 'spirit_stone', name: '灵石', type: '灵石', rarity: '普通', description: '', effects: [], stackable: true, maxStack: 999999 };
        const { createInventoryItem } = require('@/core/types');
        return { ...prev, protagonist: { ...prev.protagonist, inventory: [...prev.protagonist.inventory, createInventoryItem(def, amount)] } };
      });
    }, [dispatch]),
    onAddTechnique: useCallback((techniqueId: string) => { /* 由 DeveloperPanel 处理 */ }, []),
    onAddEquipment: useCallback((equipmentId: string) => { /* 由 DeveloperPanel 处理 */ }, []),
    onAddTechniqueByConfig: useCallback((_type: any, _rarity: any) => {}, []),
    onAddEquipmentByConfig: useCallback((_slot: any, _rarity: any) => {}, []),
    onSetCultivationPath: useCallback((_pathId: string) => {}, []),
    onTriggerBreakthrough: useCallback(() => {}, []),
    onTriggerTribulation: useCallback(() => {}, []),
    onTriggerDemon: useCallback(() => {}, []),
    onResetCooldowns: useCallback(() => {}, []),
    onSetWorldType: useCallback((_worldType: string) => {}, []),
    onFullRestore: useCallback(() => {}, []),
    onAddAllItems: useCallback(() => {}, []),
    onMaxStats: useCallback(() => {}, []),
  };

  return { devInvincible, onToggleDevInvincible, devHandlers };
}
