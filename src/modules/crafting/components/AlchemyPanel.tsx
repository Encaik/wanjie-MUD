'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { FlaskConical, Clock, Package, AlertCircle } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { getRarityStyle } from '@/shared/ui/item-tooltip';
import { 
  ALCHEMY_RECIPES, 
  ALCHEMY_MATERIALS, 
  getUnlockedRecipes, 
  hasEnoughMaterials,
  determineQuality,
  PillQuality,
  AlchemyRecipe,
} from '@/modules/crafting/data/alchemyRecipes';
import { InventoryItem, ItemRarity, CraftingState } from '@/core/types';
import { cn } from '@/shared/utils';

interface AlchemyPanelProps {
  inventory: InventoryItem[];
  playerLevel: number;
  crafting: CraftingState | null;
  onStartCrafting: (recipeId: string, duration: number, quality: PillQuality, success: boolean) => void;
  onFinishCrafting: (recipe: AlchemyRecipe, quality: PillQuality, success: boolean) => void;
}

export function AlchemyPanel({ 
  inventory, 
  playerLevel, 
  crafting,
  onStartCrafting,
  onFinishCrafting,
}: AlchemyPanelProps) {
  const [progress, setProgress] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<AlchemyRecipe | null>(null);
  
  // 使用 ref 来存储回调
  const onFinishCraftingRef = useRef(onFinishCrafting);
  const craftingRef = useRef<CraftingState | null>(null);
  const finishCalledRef = useRef(false);
  
  useEffect(() => {
    onFinishCraftingRef.current = onFinishCrafting;
  }, [onFinishCrafting]);
  
  useEffect(() => {
    craftingRef.current = crafting;
    if (!crafting) {
      finishCalledRef.current = false;
    }
  }, [crafting]);

  // 获取已解锁的配方
  const unlockedRecipes = useMemo(() => {
    return getUnlockedRecipes(playerLevel);
  }, [playerLevel]);

  // 获取材料数量
  const getMaterialCount = (materialId: string): number => {
    const item = inventory.find(i => i.definition.id === materialId);
    return item ? item.quantity : 0;
  };

  // 获取材料信息
  const getMaterialInfo = (materialId: string) => {
    return ALCHEMY_MATERIALS.find(m => m.id === materialId);
  };

  // 开始炼制
  const startCrafting = useCallback((recipe: AlchemyRecipe) => {
    if (craftingRef.current) return;
    if (!hasEnoughMaterials(inventory, recipe.materials)) return;
    
    const success = Math.random() * 100 < recipe.successRate;
    const quality = success ? determineQuality() : '下品';
    
    onStartCrafting(recipe.id, recipe.craftTime * 1000, quality, success);
    setProgress(0);
  }, [inventory, onStartCrafting]);

  // 更新进度
  useEffect(() => {
    if (!crafting) {
      setProgress(0);
      return;
    }
    
    let animationFrameId: number;
    
    const updateProgress = () => {
      const current = craftingRef.current;
      if (!current) return;
      
      const elapsed = Date.now() - current.startTime;
      const newProgress = Math.min(100, (elapsed / current.duration) * 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [crafting]);

  // 完成炼制
  useEffect(() => {
    if (!crafting || progress < 100) return;
    if (finishCalledRef.current) return;
    
    const recipe = ALCHEMY_RECIPES.find(r => r.id === crafting.recipeId);
    if (!recipe) return;
    
    finishCalledRef.current = true;
    onFinishCraftingRef.current(recipe, crafting.quality, crafting.success);
  }, [crafting, progress]);

  // 获取当前炼制的配方
  const currentRecipe = crafting ? ALCHEMY_RECIPES.find(r => r.id === crafting.recipeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* 上半部分：当前炼制状态 - 紧凑 */}
      {crafting && currentRecipe ? (
        <div className="shrink-0 p-2 mb-1.5 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-medium text-sm">{currentRecipe.name}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {crafting.quality}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {crafting.success ? '成功' : '失败'}
            </span>
          </div>
          
          {/* 进度条 - 更紧凑 */}
          <div className="relative h-6 bg-muted rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-medium">
              <Clock className="w-3 h-3" />
              <span>{Math.floor(progress)}%</span>
            </div>
          </div>
          
          {/* 预期效果 - 更紧凑 */}
          {currentRecipe.effects && currentRecipe.effects.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-0.5">
              {currentRecipe.effects.map((effect, idx) => (
                <Badge key={idx} variant="secondary" className="text-[9px] h-4 px-1">
                  {effect.type === 'cultivation_boost' && `修+${effect.baseValue}%`}
                  {effect.type === 'breakthrough_boost' && `突+${effect.baseValue}%`}
                  {effect.type === 'restore_hp' && `生+${effect.baseValue}`}
                  {effect.type === 'restore_mp' && `法+${effect.baseValue}`}
                  {effect.type === 'restore' && `恢+${effect.baseValue}`}
                  {effect.type === 'stat_boost' && `属+${effect.baseValue}`}
                  {effect.type === 'luck_boost' && `运+${effect.baseValue}%`}
                  {effect.type === 'combat_boost' && `战+${effect.baseValue}%`}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0 p-2 mb-1.5 rounded-lg border border-dashed text-muted-foreground">
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <FlaskConical className="w-4 h-4" />
            <span>选择配方开始炼丹</span>
          </div>
        </div>
      )}

      {/* 下半部分：配方列表 - flex布局自适应高度 */}
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border bg-card">
        <div className="shrink-0 px-2.5 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Package className="w-3.5 h-3.5" />
            丹方列表
          </div>
          <Badge variant="outline" className="text-[10px] h-4">
            {unlockedRecipes.length}
          </Badge>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {unlockedRecipes.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
              <p>暂无丹方</p>
              <p className="text-[10px] mt-0.5">提升等级解锁更多</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {unlockedRecipes.map(recipe => {
                const hasMaterials = hasEnoughMaterials(inventory, recipe.materials);
                const isCrafting = crafting?.recipeId === recipe.id;
                const rarity = recipe.rarity as ItemRarity;
                
                return (
                  <div
                    key={recipe.id}
                    className={cn(
                      "p-2 rounded border transition-all cursor-pointer",
                      getRarityStyle(rarity, 'border'),
                      isCrafting 
                        ? "bg-primary/10 border-primary" 
                        : selectedRecipe?.id === recipe.id 
                          ? "bg-muted/80" 
                          : "bg-background hover:bg-muted/50",
                      !hasMaterials && "opacity-60"
                    )}
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        {/* 配方名称和成功率 - 单行 */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn("font-medium text-xs", getRarityStyle(rarity, 'text'))}>
                            {recipe.name}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                            {recipe.successRate}%
                          </Badge>
                        </div>
                        
                        {/* 效果预览 - 单行紧凑 */}
                        {recipe.effects && recipe.effects.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mb-1">
                            {recipe.effects.slice(0, 3).map((effect, idx) => (
                              <span key={idx} className="text-[9px] text-muted-foreground">
                                {effect.type === 'cultivation_boost' && `修+${effect.baseValue}%`}
                                {effect.type === 'breakthrough_boost' && `突+${effect.baseValue}%`}
                                {effect.type === 'restore_hp' && `生+${effect.baseValue}`}
                                {effect.type === 'restore_mp' && `法+${effect.baseValue}`}
                              </span>
                            ))}
                            {recipe.effects.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{recipe.effects.length - 3}</span>
                            )}
                          </div>
                        )}
                        
                        {/* 材料需求 - 紧凑单行 */}
                        <div className="flex items-center gap-0.5 flex-wrap">
                          {recipe.materials.map(mat => {
                            const info = getMaterialInfo(mat.materialId);
                            const count = getMaterialCount(mat.materialId);
                            const enough = count >= mat.quantity;
                            return (
                              <span 
                                key={mat.materialId}
                                className={cn(
                                  "text-[9px] px-1 py-0.5 rounded",
                                  enough ? "bg-muted/50 text-muted-foreground" : "bg-red-500/10 text-red-500"
                                )}
                              >
                                {info?.name?.slice(0, 2)}{count}/{mat.quantity}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* 炼制按钮 - 更小 */}
                      <Button 
                        size="sm"
                        variant={isCrafting ? "default" : "outline"}
                        className="h-6 px-2 text-[10px] shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCrafting(recipe);
                        }}
                        disabled={!hasMaterials || (!!crafting && !isCrafting)}
                      >
                        {isCrafting ? (
                          <>
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {Math.floor(progress)}%
                          </>
                        ) : (
                          <>
                            <FlaskConical className="w-2.5 h-2.5 mr-0.5" />
                            {recipe.craftTime}s
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
