/**
 * useCrafting — 制作操作 Hook（炼丹/炼器/碎片合成）
 */

import { useCallback, useMemo } from 'react';

import type { GameState } from '@/core/types';
import { useGameStore } from '@/views/game/state/GameStore';

import { getTemplate } from '../data/index';
import { ALCHEMY_RECIPES } from '../data/recipes/alchemy';
import { FORGE_RECIPES } from '../data/recipes/forge';
import { fragmentItem, synthesizeFragments } from '../logic/itemFragment';
import { generateItemInstance } from '../logic/itemGenerator';
import { addItem, hasEnough, removeItem, getItemCount } from '../logic/itemManager';

export function useCrafting() {
  const { gameState, dispatch } = useGameStore();
  const p = gameState.protagonist;
  const items = p?.items ?? [];

  /** 检查炼丹配方可否制作 */
  const canCraftAlchemy = useCallback((recipeId: string) => {
    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    return Object.entries(recipe.inputs).every(([tplId, qty]) => hasEnough(items, tplId, qty));
  }, [items]);

  /** 执行炼丹 */
  const craftAlchemy = useCallback((recipeId: string) => {
    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { success: false, error: '配方不存在' };

    // 检查材料
    for (const [tplId, qty] of Object.entries(recipe.inputs)) {
      if (!hasEnough(items, tplId, qty)) {
        return { success: false, error: `材料不足：${getTemplate(tplId).name} 需要 ${qty} 个` };
      }
    }

    dispatch((prev: GameState) => {
      const pp = prev.protagonist;
      if (!pp) return prev;
      let newItems = pp.items;

      // 消耗材料
      for (const [tplId, qty] of Object.entries(recipe.inputs)) {
        const instances = newItems.filter(i => i.templateId === tplId && !i.equipped);
        let remaining = qty;
        for (const inst of instances) {
          if (remaining <= 0) break;
          const toRemove = Math.min(inst.quantity, remaining);
          remaining -= toRemove;
          newItems = removeItem(newItems, inst.instanceId, toRemove);
        }
      }

      // 产出
      const product = generateItemInstance(recipe.outputTemplateId, 1);
      product.source = 'craft';
      newItems = addItem(newItems, recipe.outputTemplateId, recipe.outputQuantity);

      return {
        ...prev,
        protagonist: { ...pp, items: newItems } as GameState['protagonist'],
      };
    });

    return { success: true, message: `成功炼制 ${getTemplate(recipe.outputTemplateId).name}！` };
  }, [items, dispatch]);

  /** 碎片合成 */
  const synthesize = useCallback((templateId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const result = synthesizeFragments(currentP.items, templateId);
    if (result.synthesizedItem) {
      dispatch((prev: GameState) => {
        const pp = prev.protagonist;
        if (!pp) return prev;
        return {
          ...prev,
          protagonist: { ...pp, items: result.inventory } as GameState['protagonist'],
        };
      });
    }
    return { success: !!result.synthesizedItem, message: result.message };
  }, [gameState.protagonist, dispatch]);

  /** 物品拆解 */
  const fragment = useCallback((instanceId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return { success: false, error: '主角不存在' };
    const newItems = fragmentItem(currentP.items, instanceId);
    dispatch((prev: GameState) => {
      const pp = prev.protagonist;
      if (!pp) return prev;
      return {
        ...prev,
        protagonist: { ...pp, items: newItems } as GameState['protagonist'],
      };
    });
    return { success: true, message: '拆解成功' };
  }, [gameState.protagonist, dispatch]);

  /** 所有配方 */
  const alchemyRecipes = useMemo(() => ALCHEMY_RECIPES, []);
  const forgeRecipes = useMemo(() => FORGE_RECIPES, []);

  return {
    alchemyRecipes,
    forgeRecipes,
    canCraftAlchemy,
    craftAlchemy,
    synthesize,
    fragment,
  };
}
