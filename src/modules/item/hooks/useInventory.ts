/**
 * useInventory — 统一背包操作 Hook
 *
 * 完全基于新物品系统（ItemInstance），零旧 inventory 依赖。
 */

import { useCallback } from 'react';
import type { ItemInstance, ConsumableTemplate } from '../types';
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
import { getTemplate } from '../data/index';
import { useGameStore } from '@/views/game/state/GameStore';
import type { GameState, ActiveEffect, GrowthStats } from '@/core/types';
import { processStatisticsEvent } from '@/core/statistics';
import { applyBaseStatChanges } from '@/modules/progression/logic/realmSystem';

/** 内部消息添加辅助 */
function addMessage(
  messages: GameState['messages'],
  type: 'success' | 'info' | 'warning',
  title: string,
  content: string,
): GameState['messages'] {
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    title,
    content,
    details: undefined,
    rewards: undefined,
  };
  return [msg, ...messages].slice(0, 100);
}

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

  /**
   * 使用消耗品（丹药等）
   *
   * 根据模板 subcategory 自动应用对应效果：
   * - pill_hp：恢复生命值
   * - pill_mp：恢复法力值
   * - pill_cultivation：添加修炼增益 activeEffect
   * - pill_breakthrough：添加突破增益 activeEffect
   * - pill_stat：应用属性提升
   *
   * 物品数量减少、消息通知、统计更新均为一次性副作用。
   */
  const useItem = useCallback((instanceId: string) => {
    const p = gameState.protagonist;
    if (!p) throw new Error('主角不存在');

    // 查找物品实例，获取模板信息
    const item = findItemByInstance(p.items, instanceId);
    if (!item) throw new Error(`物品不存在: ${instanceId}`);

    const template = getTemplate(item.templateId);
    if (template.category !== 'consumable') {
      throw new Error(`"${template.name}" 不是消耗品，无法使用`);
    }

    const ct = template as ConsumableTemplate;

    // 消耗物品（减少数量）
    const result = useConsumable(p.items, instanceId);

    dispatch((prev: GameState) => {
      const pp = prev.protagonist;
      if (!pp) return prev;

      let newProtagonist = { ...pp, items: result.inventory };
      let effectMsg = '';

      switch (ct.subcategory) {
        case 'pill_hp': {
          const hpRestore = ct.baseStats.hpRestore ?? 0;
          const newHp = Math.min(pp.maxHp, pp.currentHp + hpRestore);
          const healed = newHp - pp.currentHp;
          newProtagonist = { ...newProtagonist, currentHp: newHp };
          effectMsg = `恢复了 ${healed} 点生命值`;
          break;
        }
        case 'pill_mp': {
          const mpRestore = ct.baseStats.mpRestore ?? 0;
          const newMp = Math.min(pp.maxMp, pp.currentMp + mpRestore);
          const restored = newMp - pp.currentMp;
          newProtagonist = { ...newProtagonist, currentMp: newMp };
          effectMsg = `恢复了 ${restored} 点法力值`;
          break;
        }
        case 'pill_cultivation': {
          const boost = ct.baseStats.cultivationBoost ?? 0;
          const effects = ct.ext.effects ?? [];
          const duration = effects[0]?.duration ?? 10;
          const newEffects: ActiveEffect[] = pp.activeEffects ? [...pp.activeEffects] : [];
          const existingIdx = newEffects.findIndex(
            e => e.itemId === item.templateId && e.type === 'cultivation_boost',
          );
          if (existingIdx >= 0) {
            newEffects[existingIdx] = {
              ...newEffects[existingIdx],
              remainingCount: newEffects[existingIdx].remainingCount + duration,
            };
          } else {
            newEffects.push({
              itemId: item.templateId,
              itemName: template.name,
              type: 'cultivation_boost',
              value: boost,
              remainingCount: duration,
            });
          }
          newProtagonist = { ...newProtagonist, activeEffects: newEffects };
          effectMsg = `修炼效率提升 ${boost}%，持续 ${duration} 次修炼`;
          break;
        }
        case 'pill_breakthrough': {
          const boost = ct.baseStats.breakthroughBoost ?? 0;
          const effects = ct.ext.effects ?? [];
          const duration = effects[0]?.duration ?? 5;
          const newEffects: ActiveEffect[] = pp.activeEffects ? [...pp.activeEffects] : [];
          const existingIdx = newEffects.findIndex(
            e => e.itemId === item.templateId && e.type === 'breakthrough_boost',
          );
          if (existingIdx >= 0) {
            newEffects[existingIdx] = {
              ...newEffects[existingIdx],
              remainingCount: newEffects[existingIdx].remainingCount + duration,
            };
          } else {
            newEffects.push({
              itemId: item.templateId,
              itemName: template.name,
              type: 'breakthrough_boost',
              value: boost,
              remainingCount: duration,
            });
          }
          newProtagonist = { ...newProtagonist, activeEffects: newEffects };
          effectMsg = `突破成功率提升 ${boost}%，持续 ${duration} 次突破尝试`;
          break;
        }
        case 'pill_stat': {
          const statGains: Partial<GrowthStats> = {};
          if (ct.baseStats.constitutionBoost) statGains.体质 = ct.baseStats.constitutionBoost;
          if (ct.baseStats.spiritRootBoost) statGains.灵根 = ct.baseStats.spiritRootBoost;
          if (ct.baseStats.comprehensionBoost) statGains.悟性 = ct.baseStats.comprehensionBoost;
          if (ct.baseStats.willpowerBoost) statGains.意志 = ct.baseStats.willpowerBoost;
          if (ct.baseStats.luckBoost) statGains.幸运 = ct.baseStats.luckBoost;
          if (Object.keys(statGains).length > 0) {
            newProtagonist = {
              ...newProtagonist,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              stats: applyBaseStatChanges(pp.stats, statGains as any),
            };
            const statNames = Object.entries(statGains)
              .map(([k, v]) => `${k}+${v}`)
              .join('、');
            effectMsg = `属性提升：${statNames}`;
          }
          break;
        }
        default:
          effectMsg = '';
      }

      return {
        ...prev,
        protagonist: newProtagonist as GameState['protagonist'],
        statistics: processStatisticsEvent(prev.statistics, {
          type: 'item:used',
          payload: { templateId: item.templateId, count: 1 },
          timestamp: Date.now(),
        }),
        lastActionResult: {
          success: true,
          message: `使用了${template.name}！${effectMsg}`,
        },
        messages: addMessage(
          prev.messages,
          'success',
          '使用物品',
          `使用了「${template.name}」：${effectMsg}`,
        ),
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
