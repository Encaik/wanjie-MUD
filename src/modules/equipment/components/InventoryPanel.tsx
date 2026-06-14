'use client';

import { useState } from 'react';

import { Package, Heart, Zap, Star, TrendingUp, Sword } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { ItemTooltip } from '@/shared/ui/data-display/item-tooltip';
import { getRarityStyle } from '@/modules/theme/data/rarityStyles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/data-display/tabs';
import { useInventory, useProtagonist } from '@/views/game';
import { getResourceName } from '@/modules/equipment/logic/items';
import { InventoryItem, ActiveEffect, WorldType, ItemRarity } from '@/core/types';
import { cn } from '@/shared/utils';

interface InventoryPanelProps {
  inventory?: InventoryItem[];
  activeEffects?: ActiveEffect[];
  onUseItem?: (itemId: string) => void;
  worldType?: WorldType;
  useGlobalState?: boolean;
  className?: string;
}

// 效果类型图标
const effectTypeIcons: Record<string, typeof Heart> = {
  'cultivation_boost': TrendingUp,
  'stat_boost': Star,
  'restore_hp': Heart,
  'restore_mp': Zap,
  'luck_boost': Star,
  'combat_boost': Sword,
  'breakthrough_boost': TrendingUp,
};

export function InventoryPanel({ 
  inventory: propsInventory, 
  activeEffects: propsEffects, 
  onUseItem: propsUseItem, 
  worldType: propsWorldType,
  useGlobalState = true,
  className,
}: InventoryPanelProps) {
  // 尝试从全局状态获取数据
  const globalInventory = useGlobalState ? useInventory() : null;
  const globalProtagonist = useGlobalState ? useProtagonist() : null;
  
  // 优先使用 props，其次使用全局状态
  const inventory: InventoryItem[] = propsInventory ?? globalInventory?.inventory ?? [];
  const activeEffects: ActiveEffect[] = propsEffects ?? globalInventory?.activeEffects ?? [];
  const onUseItem = propsUseItem ?? globalInventory?.useItem ?? (() => {});
  const worldType = propsWorldType ?? globalProtagonist?.world.type;
  
  const resourceName = worldType ? getResourceName(worldType) : '灵石';
  
  // 排序道具：灵石永远在最前
  const sortedInventory = [...inventory].sort((a, b) => {
    if (a.definition.type === '灵石' && b.definition.type !== '灵石') return -1;
    if (a.definition.type !== '灵石' && b.definition.type === '灵石') return 1;
    if (a.definition.type === '丹药' && b.definition.type !== '丹药') return -1;
    if (a.definition.type !== '丹药' && b.definition.type === '丹药') return 1;
    return 0;
  });
  
  // 按类型分组道具
  const itemsByType = {
    all: sortedInventory,
    丹药: inventory.filter((i: InventoryItem) => i.definition.type === '丹药'),
    材料: inventory.filter((i: InventoryItem) => i.definition.type === '材料'),
    其他: inventory.filter((i: InventoryItem) => !['丹药', '材料', '灵石'].includes(i.definition.type)),
  };
  
  // 内部 tab 状态 - 避免重新渲染时重置
  const [inventoryTab, setInventoryTab] = useState<string>('all');

  // 渲染单个物品格子 - 统一使用ItemTooltip
  const renderItemGrid = (item: InventoryItem) => {
    const isSpiritStone = item.definition.type === '灵石';
    const displayName = isSpiritStone ? resourceName : item.definition.name;
    const canUse = !isSpiritStone && item.definition.effects.length > 0;
    const rarity = (item.definition.rarity || '普通') as ItemRarity;
    
    // 构建属性列表
    const stats = item.definition.effects.map(effect => ({
      label: effect.type === 'breakthrough_boost' ? '突破加成' :
             effect.type === 'cultivation_boost' ? '修炼加成' :
             effect.type === 'restore_hp' ? '恢复生命' :
             effect.type === 'restore_mp' ? '恢复法力' :
             effect.type === 'stat_boost' ? '属性提升' : '效果',
      value: effect.description,
      color: effect.type === 'breakthrough_boost' ? 'purple' :
             effect.type === 'cultivation_boost' ? 'green' :
             effect.type === 'restore_hp' ? 'red' :
             effect.type === 'restore_mp' ? 'blue' : undefined,
    }));
    
    // 资源类型显示数量
    if (isSpiritStone) {
      stats.unshift({ label: '数量', value: item.quantity.toString(), color: 'amber' });
    }
    
    return (
      <ItemTooltip
        key={item.definition.id}
        name={displayName}
        rarity={rarity}
        type={isSpiritStone ? '修炼资源' : item.definition.type}
        description={item.definition.description || (isSpiritStone ? '修炼所需的通用资源' : undefined)}
        stats={stats}
        side="top"
      >
        <div
          className={cn(
            'relative rounded-md border p-1.5 transition-all cursor-pointer',
            'hover:scale-105 active:scale-95',
            getRarityStyle(rarity, 'border'),
            getRarityStyle(rarity, 'bg')
          )}
          onClick={() => canUse && onUseItem(item.definition.id)}
        >
          <div className="text-center">
            <div className={cn(
              'text-[10px] font-medium truncate',
              getRarityStyle(rarity, 'text')
            )}>
              {displayName}
            </div>
            <div className="text-[9px] text-muted-foreground">x{item.quantity}</div>
          </div>
        </div>
      </ItemTooltip>
    );
  };

  // 渲染效果标签
  const renderEffectBadge = (effect: ActiveEffect, index: number) => {
    const Icon = effectTypeIcons[effect.type] || Star;
    return (
      <Badge key={`${effect.itemId}-${index}`} variant="secondary" className="text-[9px] h-4 gap-0.5">
        <Icon className="w-2.5 h-2.5" />
        {effect.itemName}
        <span className="text-muted-foreground ml-0.5">
          {effect.remainingCount}次
        </span>
      </Badge>
    );
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-1 pt-2 shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-primary" />
          背包
          <span className="text-[10px] text-muted-foreground font-normal">
            ({inventory.length}种)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 flex-1 overflow-y-auto space-y-2">
        {/* 活跃效果 */}
        {activeEffects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeEffects.map((effect, idx) => renderEffectBadge(effect, idx))}
          </div>
        )}

        {/* 道具分类标签 */}
        <Tabs value={inventoryTab} onValueChange={setInventoryTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-7">
            <TabsTrigger value="all" className="text-[10px]">全部</TabsTrigger>
            <TabsTrigger value="pills" className="text-[10px]">丹药</TabsTrigger>
            <TabsTrigger value="materials" className="text-[10px]">材料</TabsTrigger>
            <TabsTrigger value="others" className="text-[10px]">其他</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-2">
            <div className="grid grid-cols-4 gap-1">
              {itemsByType.all.map(item => renderItemGrid(item))}
            </div>
          </TabsContent>
          <TabsContent value="pills" className="mt-2">
            <div className="grid grid-cols-4 gap-1">
              {itemsByType.丹药.map(item => renderItemGrid(item))}
            </div>
            {itemsByType.丹药.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-3">
                暂无丹药
              </div>
            )}
          </TabsContent>
          <TabsContent value="materials" className="mt-2">
            <div className="grid grid-cols-4 gap-1">
              {itemsByType.材料.map(item => renderItemGrid(item))}
            </div>
            {itemsByType.材料.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-3">
                暂无材料
              </div>
            )}
          </TabsContent>
          <TabsContent value="others" className="mt-2">
            <div className="grid grid-cols-4 gap-1">
              {itemsByType.其他.map(item => renderItemGrid(item))}
            </div>
            {itemsByType.其他.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-3">
                暂无其他物品
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
