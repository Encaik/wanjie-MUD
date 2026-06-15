/**
 * useInventory — 物品/背包领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露使用物品 action。
 */

'use client';

import { useCallback } from 'react';

import type { ItemDefinition, FlatStats, GrowthStats } from '@/core/types';
import { createInventoryItem } from '@/core/types';
import { calculatePillEffect, getPillRealmLevel } from '@/modules/progression/logic/pillRealmSystem';
import { applyBaseStatChanges } from '@/modules/progression/logic/realmSystem';

import { useGameStore } from '../GameStore';
import { createAddMessageInternal } from './helpers';


export function useInventory() {
  const { dispatch } = useGameStore();
  const addMsgInt = createAddMessageInternal();

  const useItem = useCallback((itemId: string) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const itemIndex = prev.protagonist.inventory.findIndex(item => item.definition.id === itemId);
      if (itemIndex === -1) return prev;
      const item = prev.protagonist.inventory[itemIndex];
      if (item.definition.type === '灵石') return prev;
      if (item.definition.type === '材料' && item.definition.effects.length === 0) return prev;

      const isPill = item.definition.type === '丹药' || item.definition.type === '消耗品' || item.definition.name.includes('丹');
      let effectMultiplier = 1.0;
      let sideEffectStats: Partial<GrowthStats> = {};
      let realmMessage = '';

      if (isPill) {
        const pillRealmLevel = item.definition.realmLevel || getPillRealmLevel(item.definition.unlockLevel || 1);
        const pillResult = calculatePillEffect(prev.protagonist, pillRealmLevel);
        effectMultiplier = pillResult.effectMultiplier;
        realmMessage = pillResult.message;
        if (pillResult.hasSideEffect && pillResult.sideEffect?.stats) {
          sideEffectStats = pillResult.sideEffect.stats;
          realmMessage += ` ${pillResult.sideEffectMessage || ''}`;
        }
      }

      const newActiveEffects = [...prev.protagonist.activeEffects];
      let statChanges: Partial<FlatStats> = {};
      let effectMessage = '';
      let hpRestored = 0;
      let mpRestored = 0;

      for (const effect of item.definition.effects) {
        const adjustedValue = Math.floor(effect.value * effectMultiplier);
        if (effect.type === 'stat_boost') {
          statChanges = { 体质: Math.floor(adjustedValue * 0.3), 灵根: Math.floor(adjustedValue * 0.3), 悟性: Math.floor(adjustedValue * 0.2), 意志: Math.floor(adjustedValue * 0.2), 幸运: Math.floor(adjustedValue * 0.1) };
          effectMessage += '属性获得提升！';
        } else if (effect.type === 'restore_hp') { hpRestored += adjustedValue; effectMessage += `生命+${adjustedValue} `; }
        else if (effect.type === 'restore_mp') { mpRestored += adjustedValue; effectMessage += `法力+${adjustedValue} `; }
        else if (['cultivation_boost', 'breakthrough_boost', 'luck_boost', 'combat_boost'].includes(effect.type)) {
          const duration = effect.duration || 1;
          const adjVal = Math.floor(effect.value * effectMultiplier);
          const existingIdx = newActiveEffects.findIndex(e => e.itemId === item.definition.id && e.type === effect.type);
          if (existingIdx >= 0) {
            newActiveEffects[existingIdx] = { ...newActiveEffects[existingIdx], remainingCount: newActiveEffects[existingIdx].remainingCount + duration, value: adjVal };
          } else {
            newActiveEffects.push({ itemId: item.definition.id, itemName: item.definition.name, type: effect.type, value: adjVal, remainingCount: duration });
          }
          effectMessage += effect.description || `${effect.type}+${adjVal}%（剩余${duration}次）`;
        } else if (effect.duration && effect.duration > 0) {
          const adjVal = Math.floor(effect.value * effectMultiplier);
          const existingIdx = newActiveEffects.findIndex(e => e.itemId === item.definition.id && e.type === effect.type);
          if (existingIdx >= 0) {
            newActiveEffects[existingIdx] = { ...newActiveEffects[existingIdx], remainingCount: newActiveEffects[existingIdx].remainingCount + effect.duration, value: adjVal };
          } else {
            newActiveEffects.push({ itemId: item.definition.id, itemName: item.definition.name, type: effect.type, value: adjVal, remainingCount: effect.duration });
          }
          effectMessage += `${effect.description}（剩余${effect.duration}次）`;
        } else if (effect.type === 'restore') {
          statChanges.体质 = (statChanges.体质 || 0) + Math.floor(effect.value * effectMultiplier);
        }
      }

      if (Object.keys(sideEffectStats).length > 0) {
        for (const [stat, value] of Object.entries(sideEffectStats)) {
          statChanges[stat as keyof FlatStats] = (statChanges[stat as keyof FlatStats] || 0) + (value || 0);
        }
      }

      const newHp = Math.min(prev.protagonist.maxHp, Math.max(1, prev.protagonist.currentHp + hpRestored));
      const newMp = Math.min(prev.protagonist.maxMp, Math.max(0, prev.protagonist.currentMp + mpRestored));
      if (hpRestored > 0 || mpRestored > 0) effectMessage = `生命+${newHp - prev.protagonist.currentHp} 法力+${newMp - prev.protagonist.currentMp}`;
      if (realmMessage) effectMessage = `${effectMessage} [${realmMessage}]`;

      const newStats = Object.keys(statChanges).length > 0 ? applyBaseStatChanges(prev.protagonist.stats, statChanges as any) : prev.protagonist.stats;
      const newInventory = [...(prev.protagonist.inventory || [])];
      if (item.quantity > 1) { newInventory[itemIndex] = { ...item, quantity: item.quantity - 1 }; }
      else { newInventory.splice(itemIndex, 1); }

      const resultMessage = `使用了${item.definition.name}！${effectMessage}`;
      return {
        ...prev,
        protagonist: { ...prev.protagonist, stats: newStats, inventory: newInventory, activeEffects: newActiveEffects, currentHp: newHp, currentMp: newMp },
        statistics: { ...prev.statistics, totalItemsUsed: (prev.statistics.totalItemsUsed || 0) + 1 },
        lastActionResult: { success: true, message: resultMessage },
        messages: addMsgInt(prev.messages, 'success', '使用道具', resultMessage),
      };
    });
  }, [dispatch]);

  return { useItem };
}
