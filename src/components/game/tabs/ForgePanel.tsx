'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { Anvil, Clock, Package, Shield, AlertCircle, Sword, Shirt, Footprints, Glasses } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRarityStyle } from '@/components/ui/item-tooltip';
import { 
  FORGE_RECIPES, 
  FORGE_MATERIALS, 
  getUnlockedForgeRecipes, 
  hasEnoughForgeMaterials,
  determineEquipmentQuality,
  EquipmentQuality,
  ForgeRecipe,
  getSlotName,
} from '@/lib/data/forgeRecipes';
import { InventoryItem, ItemRarity, ForgingState, EquipmentSlot } from '@/lib/game/types';
import { cn } from '@/utils';

// 部位图标映射
const SLOT_ICONS: Record<string, React.ReactNode> = {
  'melee': <Sword className="w-4 h-4" />,
  'ranged': <Sword className="w-4 h-4" />,
  'head': <Glasses className="w-4 h-4" />,
  'body': <Shirt className="w-4 h-4" />,
  'legs': <Footprints className="w-4 h-4" />,
  'feet': <Footprints className="w-4 h-4" />,
};

// 属性名映射
const STAT_NAMES: Record<string, string> = {
  'attackBonus': '攻击',
  'defenseBonus': '防御',
  'power': '威力',
};

// 获取属性中文名
const getStatName = (stat: string): string => {
  return STAT_NAMES[stat] || stat;
};

interface ForgePanelProps {
  inventory: InventoryItem[];
  playerLevel: number;
  forging: ForgingState | null;
  onStartForging: (recipeId: string, duration: number, quality: EquipmentQuality, success: boolean) => void;
  onFinishForging: (recipe: ForgeRecipe, quality: EquipmentQuality, success: boolean) => void;
}

export function ForgePanel({ 
  inventory, 
  playerLevel, 
  forging,
  onStartForging,
  onFinishForging,
}: ForgePanelProps) {
  const [progress, setProgress] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | 'all'>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<ForgeRecipe | null>(null);
  
  const onFinishForgingRef = useRef(onFinishForging);
  const forgingRef = useRef<ForgingState | null>(null);
  const finishCalledRef = useRef(false);
  
  useEffect(() => {
    onFinishForgingRef.current = onFinishForging;
  }, [onFinishForging]);
  
  useEffect(() => {
    forgingRef.current = forging;
    if (!forging) {
      finishCalledRef.current = false;
    }
  }, [forging]);

  // 获取已解锁的配方
  const unlockedRecipes = useMemo(() => {
    return getUnlockedForgeRecipes(playerLevel);
  }, [playerLevel]);

  // 按部位筛选配方
  const filteredRecipes = useMemo(() => {
    if (selectedSlot === 'all') return unlockedRecipes;
    return unlockedRecipes.filter(r => r.slot === selectedSlot);
  }, [unlockedRecipes, selectedSlot]);

  // 获取材料数量
  const getMaterialCount = (materialId: string): number => {
    const item = inventory.find(i => i.definition.id === materialId);
    return item ? item.quantity : 0;
  };

  // 获取材料信息
  const getMaterialInfo = (materialId: string) => {
    return FORGE_MATERIALS.find(m => m.id === materialId);
  };

  // 开始炼制
  const startForging = useCallback((recipe: ForgeRecipe) => {
    if (forgingRef.current) return;
    if (!hasEnoughForgeMaterials(inventory, recipe.materials)) return;
    
    const success = Math.random() * 100 < recipe.successRate;
    const quality = success ? determineEquipmentQuality() : '普通';
    
    onStartForging(recipe.id, recipe.craftTime * 1000, quality, success);
    setProgress(0);
  }, [inventory, onStartForging]);

  // 更新进度
  useEffect(() => {
    if (!forging) {
      setProgress(0);
      return;
    }
    
    let animationFrameId: number;
    
    const updateProgress = () => {
      const current = forgingRef.current;
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
  }, [forging]);

  // 完成炼制
  useEffect(() => {
    if (!forging || progress < 100) return;
    if (finishCalledRef.current) return;
    
    const recipe = FORGE_RECIPES.find(r => r.id === forging.recipeId);
    if (!recipe) return;
    
    finishCalledRef.current = true;
    onFinishForgingRef.current(recipe, forging.quality, forging.success);
  }, [forging, progress]);

  // 获取当前炼制的配方
  const currentRecipe = forging ? FORGE_RECIPES.find(r => r.id === forging.recipeId) : null;

  // 统计各部位配方数量
  const slotCounts = useMemo(() => {
    const counts: Record<string, number> = { all: unlockedRecipes.length };
    unlockedRecipes.forEach(r => {
      counts[r.slot] = (counts[r.slot] || 0) + 1;
    });
    return counts;
  }, [unlockedRecipes]);

  return (
    <div className="flex flex-col h-full">
      {/* 上半部分：当前炼制状态 - 紧凑 */}
      {forging && currentRecipe ? (
        <div className="shrink-0 p-2 mb-1.5 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Anvil className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-medium text-sm">{currentRecipe.name}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {forging.quality}
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {getSlotName(currentRecipe.slot)}
              </Badge>
            </div>
            <span className={cn("text-[10px]", forging.success ? "text-green-500" : "text-red-500")}>
              {forging.success ? '成功' : '失败'}
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
          
          {/* 属性预览 - 更紧凑 */}
          {currentRecipe.baseStats && (
            <div className="mt-1.5 flex flex-wrap gap-0.5">
              {Object.entries(currentRecipe.baseStats).map(([stat, value]) => (
                <Badge key={stat} variant="secondary" className="text-[9px] h-4 px-1">
                  {getStatName(stat)}+{value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0 p-2 mb-1.5 rounded-lg border border-dashed text-muted-foreground">
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <Anvil className="w-4 h-4" />
            <span>选择配方开始炼器</span>
          </div>
        </div>
      )}

      {/* 下半部分：配方列表 - flex布局自适应高度 */}
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border bg-card">
        <div className="shrink-0 px-2.5 py-2 border-b">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Package className="w-3.5 h-3.5" />
              器方列表
            </div>
            <Badge variant="outline" className="text-[10px] h-4">
              {unlockedRecipes.length}
            </Badge>
          </div>
          
          {/* 部位筛选 - 更紧凑 */}
          <div className="flex gap-1 flex-wrap">
            <Button
              size="sm"
              variant={selectedSlot === 'all' ? 'default' : 'outline'}
              className="h-5 text-[10px] px-1.5"
              onClick={() => setSelectedSlot('all')}
            >
              全部({slotCounts.all})
            </Button>
            {(['melee', 'body', 'head', 'legs', 'feet'] as const).map(slot => (
              slotCounts[slot] > 0 && (
                <Button
                  key={slot}
                  size="sm"
                  variant={selectedSlot === slot ? 'default' : 'outline'}
                  className="h-5 text-[10px] px-1.5"
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="scale-75">{SLOT_ICONS[slot]}</span>
                  {getSlotName(slot)}({slotCounts[slot]})
                </Button>
              )
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {filteredRecipes.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
              <p>暂无器方</p>
              <p className="text-[10px] mt-0.5">提升等级解锁更多</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {filteredRecipes.map(recipe => {
                const hasMaterials = hasEnoughForgeMaterials(inventory, recipe.materials);
                const isForging = forging?.recipeId === recipe.id;
                const rarity = recipe.rarity as ItemRarity;
                
                return (
                  <div
                    key={recipe.id}
                    className={cn(
                      "p-2 rounded border transition-all cursor-pointer",
                      getRarityStyle(rarity, 'border'),
                      isForging 
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
                        {/* 装备名称和部位 - 单行 */}
                        <div className="flex items-center gap-1 mb-1">
                          <span className="opacity-60 scale-90">
                            {SLOT_ICONS[recipe.slot] || <Shield className="w-3 h-3" />}
                          </span>
                          <span className={cn("font-medium text-xs", getRarityStyle(rarity, 'text'))}>
                            {recipe.name}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                            {recipe.successRate}%
                          </Badge>
                        </div>
                        
                        {/* 属性预览 - 单行紧凑 */}
                        {recipe.baseStats && (
                          <div className="flex flex-wrap gap-0.5 mb-1">
                            {Object.entries(recipe.baseStats).slice(0, 3).map(([stat, value]) => (
                              <span key={stat} className="text-[9px] text-muted-foreground">
                                {getStatName(stat)}+{value}
                              </span>
                            ))}
                            {Object.keys(recipe.baseStats).length > 3 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{Object.keys(recipe.baseStats).length - 3}
                              </span>
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
                        variant={isForging ? "default" : "outline"}
                        className="h-6 px-2 text-[10px] shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startForging(recipe);
                        }}
                        disabled={!hasMaterials || (!!forging && !isForging)}
                      >
                        {isForging ? (
                          <>
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {Math.floor(progress)}%
                          </>
                        ) : (
                          <>
                            <Anvil className="w-2.5 h-2.5 mr-0.5" />
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
