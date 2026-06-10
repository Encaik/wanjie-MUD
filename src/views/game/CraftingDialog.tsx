'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { 
  FlaskConical, 
  Anvil, 
  Clock, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles,
  Info,
  Package,
  Zap,
  Star
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { getRarityStyle } from '@/shared/ui/item-tooltip';
import { Progress } from '@/shared/ui/progress';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { 
  ALCHEMY_RECIPES, 
  ALCHEMY_MATERIALS, 
  getUnlockedRecipes, 
  hasEnoughMaterials,
  determineQuality,
  PillQuality,
  AlchemyRecipe,
  PILL_QUALITY_NAMES,
} from '@/modules/crafting/data/alchemyRecipes';
import { 
  FORGE_RECIPES, 
  FORGE_MATERIALS, 
  getUnlockedForgeRecipes, 
  hasEnoughForgeMaterials,
  determineEquipmentQuality,
  EquipmentQuality,
  ForgeRecipe,
  getSlotName,
  EQUIPMENT_QUALITY_NAMES,
} from '@/modules/crafting/data/forgeRecipes';
import { InventoryItem, CraftingState, ForgingState, ItemRarity } from '@/core/types';
import { cn } from '@/shared/utils';

interface CraftingDialogProps {
  type: 'alchemy' | 'forge';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryItem[];
  playerLevel: number;
  crafting: CraftingState | null;
  forging: ForgingState | null;
  onStartCrafting: (recipeId: string, duration: number, quality: PillQuality, success: boolean) => void;
  onFinishCrafting: (recipe: AlchemyRecipe, quality: PillQuality, success: boolean) => void;
  onStartForging: (recipeId: string, duration: number, quality: EquipmentQuality, success: boolean) => void;
  onFinishForging: (recipe: ForgeRecipe, quality: EquipmentQuality, success: boolean) => void;
}

// 品质颜色映射
const qualityColors: Record<string, string> = {
  '下品': 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  '中品': 'text-green-600 bg-green-100 dark:bg-green-900/30',
  '上品': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  '极品': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  '完美': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  '普通': 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  '精良': 'text-green-600 bg-green-100 dark:bg-green-900/30',
  '稀有': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  '史诗': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  '传说': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
};

// 稀有度边框样式
const rarityBorderStyles: Record<string, string> = {
  '普通': 'border-gray-300 dark:border-gray-700',
  '精良': 'border-green-400 dark:border-green-700',
  '稀有': 'border-blue-400 dark:border-blue-700',
  '史诗': 'border-purple-400 dark:border-purple-700',
  '传说': 'border-yellow-400 dark:border-yellow-700',
};

export function CraftingDialog({
  type,
  open,
  onOpenChange,
  inventory,
  playerLevel,
  crafting,
  forging,
  onStartCrafting,
  onFinishCrafting,
  onStartForging,
  onFinishForging,
}: CraftingDialogProps) {
  const [progress, setProgress] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  
  const onFinishCraftingRef = useRef(onFinishCrafting);
  const onFinishForgingRef = useRef(onFinishForging);
  const craftingRef = useRef<CraftingState | null>(null);
  const forgingRef = useRef<ForgingState | null>(null);
  const finishCalledRef = useRef(false);

  const isActive = type === 'alchemy' ? !!crafting : !!forging;
  const activeState = type === 'alchemy' ? crafting : forging;

  useEffect(() => {
    onFinishCraftingRef.current = onFinishCrafting;
    onFinishForgingRef.current = onFinishForging;
  }, [onFinishCrafting, onFinishForging]);

  useEffect(() => {
    craftingRef.current = crafting;
    if (!crafting) finishCalledRef.current = false;
  }, [crafting]);

  useEffect(() => {
    forgingRef.current = forging;
    if (!forging) finishCalledRef.current = false;
  }, [forging]);

  // 炼丹相关
  const alchemyRecipes = useMemo(() => getUnlockedRecipes(playerLevel), [playerLevel]);
  
  // 炼器相关
  const forgeRecipes = useMemo(() => getUnlockedForgeRecipes(playerLevel), [playerLevel]);

  // 进度动画
  useEffect(() => {
    if (!isActive || !activeState) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - (activeState.startTime || 0);
      const percentage = Math.min(100, (elapsed / (activeState.duration || 1)) * 100);
      setProgress(percentage);

      if (percentage >= 100 && !finishCalledRef.current) {
        finishCalledRef.current = true;
        if (type === 'alchemy' && craftingRef.current) {
          const recipe = alchemyRecipes.find(r => r.id === craftingRef.current!.recipeId);
          if (recipe) {
            onFinishCraftingRef.current(recipe, craftingRef.current.quality, craftingRef.current.success);
          }
        } else if (type === 'forge' && forgingRef.current) {
          const recipe = forgeRecipes.find(r => r.id === forgingRef.current!.recipeId);
          if (recipe) {
            onFinishForgingRef.current(recipe, forgingRef.current.quality, forgingRef.current.success);
          }
        }
        // 关闭弹窗
        setTimeout(() => onOpenChange(false), 500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, activeState, type, onOpenChange, alchemyRecipes, forgeRecipes]);

  const getMaterialCount = (materialId: string): number => {
    const item = inventory.find(i => i.definition.id === materialId);
    return item ? item.quantity : 0;
  };

  const getAlchemyMaterialInfo = (materialId: string) => {
    return ALCHEMY_MATERIALS.find(m => m.id === materialId);
  };

  const getForgeMaterialInfo = (materialId: string) => {
    return FORGE_MATERIALS.find(m => m.id === materialId);
  };

  const startAlchemy = useCallback((recipe: AlchemyRecipe) => {
    if (craftingRef.current) return;
    if (!hasEnoughMaterials(inventory, recipe.materials)) return;
    
    const quality = determineQuality();
    const success = Math.random() < (recipe.successRate / 100);
    const duration = 3000;
    
    onStartCrafting(recipe.id, duration, quality, success);
  }, [inventory, onStartCrafting]);

  const startForge = useCallback((recipe: ForgeRecipe) => {
    if (forgingRef.current) return;
    if (!hasEnoughForgeMaterials(inventory, recipe.materials)) return;
    
    const quality = determineEquipmentQuality();
    const success = Math.random() < (recipe.successRate / 100);
    const duration = 4000;
    
    onStartForging(recipe.id, duration, quality, success);
  }, [inventory, onStartForging]);

  const isAlchemy = type === 'alchemy';
  const title = isAlchemy ? '炼丹炉' : '锻造台';
  const Icon = isAlchemy ? FlaskConical : Anvil;
  const recipes = isAlchemy ? alchemyRecipes : forgeRecipes;

  // 获取丹药效果描述
  const getAlchemyEffectDesc = (recipe: AlchemyRecipe) => {
    if (!recipe.effects || recipe.effects.length === 0) return null;
    return recipe.effects.map((effect, idx) => {
      const effectText = effect.type === 'cultivation_boost' 
        ? `修炼效果+${effect.baseValue}%，持续${effect.duration}次`
        : effect.type === 'breakthrough_boost'
        ? `突破成功率+${effect.baseValue}%`
        : effect.type === 'restore_hp'
        ? `恢复${effect.baseValue}点生命`
        : effect.type === 'restore_mp'
        ? `恢复${effect.baseValue}点法力`
        : effect.type === 'restore'
        ? `恢复${effect.baseValue}点生命/法力`
        : effect.description || '特殊效果';
      return { text: effectText, type: effect.type };
    });
  };

  // 获取装备属性预览
  const getForgeStatPreview = (recipe: ForgeRecipe) => {
    const stats: string[] = [];
    if (recipe.baseStats) {
      if (recipe.baseStats.attackBonus) {
        stats.push(`攻击+${recipe.baseStats.attackBonus}%`);
      }
      if (recipe.baseStats.defenseBonus) {
        stats.push(`防御+${recipe.baseStats.defenseBonus}%`);
      }
      if (recipe.baseStats.power) {
        stats.push(`战力+${recipe.baseStats.power}`);
      }
    }
    return stats;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              {title}
            </DialogTitle>
            <Badge variant="outline" className="text-xs shrink-0">
              {isAlchemy ? '丹方' : '图纸'} × {recipes.length}
            </Badge>
          </div>
          <DialogDescription className="text-xs mt-1">
            {isAlchemy 
              ? '炼制丹药可提升修炼效率、恢复状态或增加突破概率'
              : '锻造装备可大幅提升战斗力，不同装备提供不同属性加成'}
          </DialogDescription>
        </DialogHeader>

        {/* 进行中的炼制 */}
        {isActive && activeState && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <span className="font-medium text-sm">
                    {isAlchemy 
                      ? alchemyRecipes.find(r => r.id === (activeState as CraftingState).recipeId)?.name 
                      : forgeRecipes.find(r => r.id === (activeState as ForgingState).recipeId)?.name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge className={cn("text-[10px] h-4", qualityColors[isAlchemy ? (activeState as CraftingState).quality : (activeState as ForgingState).quality])}>
                      {isAlchemy ? (activeState as CraftingState).quality : (activeState as ForgingState).quality}
                    </Badge>
                    {/* 不提前显示成功/失败结果 */}
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> 炼制中...
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">炼制进度</span>
                <p className="text-sm font-medium">{Math.floor(progress)}%</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {progress < 100 ? '炼制中，请稍候...' : '即将完成...'}
            </div>
          </div>
        )}

        {/* 配方列表 - 自适应高度 */}
        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-2 space-y-1.5">
            {recipes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">暂无可用配方</p>
                <p className="text-xs mt-0.5">提升等级可解锁更多</p>
              </div>
            ) : (
              recipes.map((recipe) => {
                const isAlchemyRecipe = isAlchemy;
                const materials = isAlchemyRecipe 
                  ? (recipe as AlchemyRecipe).materials 
                  : (recipe as ForgeRecipe).materials;
                const canCraft = isAlchemyRecipe
                  ? hasEnoughMaterials(inventory, (recipe as AlchemyRecipe).materials)
                  : hasEnoughForgeMaterials(inventory, (recipe as ForgeRecipe).materials);
                const startCraft = isAlchemyRecipe
                  ? () => startAlchemy(recipe as AlchemyRecipe)
                  : () => startForge(recipe as ForgeRecipe);
                const isSelected = selectedRecipe === recipe.id;
                const rarity = recipe.rarity as ItemRarity;
                const successRate = recipe.successRate;

                return (
                  <Card 
                    key={recipe.id}
                    className={cn(
                      "overflow-hidden transition-all cursor-pointer hover:shadow-md",
                      rarityBorderStyles[rarity] || 'border-border',
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedRecipe(isSelected ? null : recipe.id)}
                  >
                    <CardContent className="p-0">
                      {/* 头部信息 - 更紧凑 */}
                      <div className="flex items-center justify-between p-2 bg-muted/30">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center",
                            isAlchemy ? "bg-amber-100 dark:bg-amber-900/30" : "bg-slate-100 dark:bg-slate-900/30"
                          )}>
                            {isAlchemy ? (
                              <FlaskConical className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Anvil className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <span className={cn("font-medium text-sm", getRarityStyle(rarity, 'text'))}>
                              {recipe.name}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {!isAlchemyRecipe && (
                                <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                                  {getSlotName((recipe as ForgeRecipe).slot)}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                                {rarity}
                              </Badge>
                              <div className="flex items-center gap-0.5 text-[10px]">
                                <Zap className="w-2.5 h-2.5 text-amber-500" />
                                <span className={cn(
                                  "font-medium",
                                  successRate >= 80 ? "text-green-600" : 
                                  successRate >= 50 ? "text-amber-600" : "text-red-600"
                                )}>
                                  {successRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 展开详情 - 更紧凑 */}
                      {isSelected && (
                        <div className="border-t p-2 space-y-2 bg-muted/10">
                          {/* 描述 */}
                          <p className="text-xs text-muted-foreground">{recipe.description}</p>
                          
                          {/* 丹药效果或装备属性 */}
                          {isAlchemyRecipe ? (
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> 丹药效果
                              </div>
                              <div className="flex flex-wrap gap-0.5">
                                {getAlchemyEffectDesc(recipe as AlchemyRecipe)?.map((effect, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[9px] h-4 px-1">
                                    {effect.text}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <Star className="w-2.5 h-2.5" /> 装备属性
                              </div>
                              <div className="flex flex-wrap gap-0.5">
                                {getForgeStatPreview(recipe as ForgeRecipe).map((stat, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[9px] h-4 px-1">
                                    {stat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 材料需求 */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                              <Package className="w-2.5 h-2.5" /> 所需材料
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {materials.map((mat: any) => {
                                const materialInfo = isAlchemyRecipe
                                  ? getAlchemyMaterialInfo(mat.materialId)
                                  : getForgeMaterialInfo(mat.materialId);
                                const have = getMaterialCount(mat.materialId);
                                const enough = have >= mat.quantity;
                                
                                return (
                                  <div 
                                    key={mat.materialId}
                                    className={cn(
                                      "flex items-center justify-between p-1.5 rounded text-[10px]",
                                      enough ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                    )}
                                  >
                                    <span className="truncate">{materialInfo?.name || mat.materialId}</span>
                                    <span className={cn(
                                      "font-medium shrink-0 ml-1",
                                      enough ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                      {have}/{mat.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          <Button
                            size="sm"
                            className={cn(
                              "w-full h-7 text-xs",
                              canCraft && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            )}
                            disabled={!canCraft || isActive}
                            onClick={(e) => {
                              e.stopPropagation();
                              startCraft();
                            }}
                          >
                            {canCraft ? (
                              <>
                                <Icon className="w-3 h-3 mr-1" />
                                开始炼制 ({successRate}%)
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3 mr-1" />
                                材料不足
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {/* 收起状态的材料预览 - 更紧凑 */}
                      {!isSelected && (
                        <div className="px-2 pb-2">
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {materials.slice(0, 4).map((mat: any) => {
                              const materialInfo = isAlchemyRecipe
                                ? getAlchemyMaterialInfo(mat.materialId)
                                : getForgeMaterialInfo(mat.materialId);
                              const have = getMaterialCount(mat.materialId);
                              const enough = have >= mat.quantity;
                              
                              return (
                                <Tooltip key={mat.materialId}>
                                  <TooltipTrigger asChild>
                                    <span 
                                      className={cn(
                                        "text-[9px] px-1 py-0.5 rounded cursor-help",
                                        enough ? "bg-muted text-foreground" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                                      )}
                                    >
                                      {materialInfo?.name?.slice(0, 2)}:{have}/{mat.quantity}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p>{materialInfo?.name || mat.materialId}</p>
                                    <p className="text-muted-foreground">
                                      当前: {have} / 需要: {mat.quantity}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {materials.length > 4 && (
                              <span className="text-[9px] text-muted-foreground px-1">
                                +{materials.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
