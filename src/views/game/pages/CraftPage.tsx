/**
 * CraftPage — 炼制页面（合并旧炼丹/炼器）
 *
 * Tab 炼丹：筛选消耗品模板中的丹药，消耗材料生成丹药实例
 * Tab 炼器：筛选装备模板中的可锻造装备，消耗材料生成装备实例
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

import { useGameStore } from '@/views/game/state/GameStore';
import { useAddMessage } from '@/views/game/hooks/useAddMessage';
import {
  generateItemInstance,
  addItem,
  removeItem,
  hasEnough,
  resolveItem,
} from '@/modules/item/logic';
import { getTemplatesByCategory } from '@/modules/item/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/data-display/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/data-display/card';
import { Button } from '@/shared/ui/actions/button';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import { Badge } from '@/shared/ui/data-display/badge';
import { cn } from '@/shared/utils';

// ─── 配方接口 ───

interface RecipeInfo {
  templateId: string;
  name: string;
  rarity: string;
  description: string;
  ingredients: { templateId: string; name: string; quantity: number }[];
}

// ─── 组件 ───

export function CraftPage() {
  const { gameState, dispatch } = useGameStore();
  const addMessage = useAddMessage();
  const [activeTab, setActiveTab] = useState<'alchemy' | 'forge'>('alchemy');

  const p = gameState.protagonist;
  const items = p?.items ?? [];

  // 获取可炼制的消耗品模板
  const alchemyRecipes = useMemo((): RecipeInfo[] => {
    const consumableTemplates = getTemplatesByCategory('consumable');
    return consumableTemplates
      .filter(t => {
        // TODO: 在模板 ext 中定义炼制材料需求后替换此逻辑
        return t.rarity !== 'mythic';
      })
      .map(t => ({
        templateId: t.templateId,
        name: t.name,
        rarity: t.rarity,
        description: t.description,
        ingredients: [
          { templateId: 'mat_herb_lingzhi', name: '灵芝', quantity: 3 },
          { templateId: 'mat_herb_renshen', name: '人参', quantity: 1 },
        ],
      }));
  }, []);

  // 获取可锻造的装备模板
  const forgeRecipes = useMemo((): RecipeInfo[] => {
    const equipmentTemplates = getTemplatesByCategory('equipment');
    return equipmentTemplates
      .filter(t => t.rarity !== 'mythic')
      .map(t => ({
        templateId: t.templateId,
        name: t.name,
        rarity: t.rarity,
        description: t.description,
        ingredients: [
          { templateId: 'mat_ore_xuantie', name: '玄铁', quantity: 5 },
          { templateId: 'mat_ore_tongjing', name: '铜精', quantity: 3 },
        ],
      }));
  }, []);

  // 检查材料是否足够
  const checkIngredients = useCallback((ingredients: { templateId: string; quantity: number }[]): boolean => {
    return ingredients.every(ing => hasEnough(items, ing.templateId, ing.quantity));
  }, [items]);

  // 执行炼制
  const handleCraft = useCallback((recipe: RecipeInfo) => {
    if (!p) return;

    if (!checkIngredients(recipe.ingredients)) {
      addMessage('failure', '材料不足，无法炼制', '');
      return;
    }

    dispatch((prev) => {
      if (!prev.protagonist) return prev;
      let newItems = [...prev.protagonist.items];

      // 消耗材料
      for (const ing of recipe.ingredients) {
        // 找到对应的材料实例
        const matInstance = newItems.find(i => {
          try {
            const r = resolveItem(i);
            return r.templateId === ing.templateId && !i.equipped;
          } catch { return false; }
        });
        if (matInstance) {
          newItems = removeItem(newItems, matInstance.instanceId, ing.quantity);
        }
      }

      // 生成新物品
      const newInstance = generateItemInstance(recipe.templateId);
      newItems = addItem(newItems, recipe.templateId, 1, { source: 'craft' });

      return {
        ...prev,
        protagonist: { ...prev.protagonist, items: newItems },
      };
    });

    addMessage('success', `成功炼制了 ${recipe.name}！`, '');
  }, [p, checkIngredients, addMessage, dispatch]);

  // ─── 渲染配方卡 ───

  const renderRecipeCard = (recipe: RecipeInfo) => {
    const canCraft = checkIngredients(recipe.ingredients);

    return (
      <Card key={recipe.templateId} className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium truncate">{recipe.name}</p>
                <Badge variant="secondary" className="text-[9px]">{recipe.rarity}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{recipe.description}</p>

              {/* 材料列表 */}
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground">所需材料：</p>
                {recipe.ingredients.map(ing => {
                  const enough = hasEnough(items, ing.templateId, ing.quantity);
                  return (
                    <span
                      key={ing.templateId}
                      className={cn(
                        'inline-block text-[10px] mr-2',
                        enough ? 'text-muted-foreground' : 'text-red-500',
                      )}
                    >
                      {ing.name} ×{ing.quantity}
                    </span>
                  );
                })}
              </div>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs shrink-0"
              disabled={!canCraft}
              onClick={() => handleCraft(recipe)}
            >
              {activeTab === 'alchemy' ? '炼制' : '锻造'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ─── 主布局 ───

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'alchemy' | 'forge')}
        className="flex flex-col h-full"
      >
        <div className="shrink-0 px-3 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="alchemy" className="flex-1">炼丹</TabsTrigger>
            <TabsTrigger value="forge" className="flex-1">炼器</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 p-3">
          <TabsContent value="alchemy" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-1">
                {alchemyRecipes.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">暂无可炼制配方</p>
                ) : (
                  alchemyRecipes.map(renderRecipeCard)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="forge" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-1">
                {forgeRecipes.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">暂无可锻造配方</p>
                ) : (
                  forgeRecipes.map(renderRecipeCard)
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
