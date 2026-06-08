'use client';

import { useMemo, useCallback } from 'react';

import { 
  Sparkles, 
  Swords, 
  Hammer,
  Lock,
  CheckCircle2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ItemTooltip, getRarityStyle } from '@/components/ui/item-tooltip';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FragmentInventory, 
  FragmentType,
  FragmentGroup,
  SYNTHESIS_REQUIREMENTS,
  RARITY_ORDER,
  getFragmentGroupsByName,
  getTotalFragmentCount,
  getSynthesizableCount,
  createEmptyFragmentInventory,
  synthesizeFragmentByName,
} from '@/lib/game/fragmentSystem';
import { ItemRarity, WorldType } from '@/lib/game/types';
import { cn } from '@/utils';

interface FragmentPanelProps {
  fragmentInventory: FragmentInventory;
  playerLevel: number;
  worldType?: WorldType;
  onSynthesize: (type: FragmentType, rarity: ItemRarity, sourceName?: string) => void;
  disabled?: boolean;
}

// 品质颜色映射
const rarityColors: Record<ItemRarity, string> = {
  '普通': 'text-gray-500',
  '稀有': 'text-blue-500',
  '史诗': 'text-purple-500',
  '传说': 'text-yellow-500',
  '神话': 'text-red-500',
};

const rarityProgressColors: Record<ItemRarity, string> = {
  '普通': '[&>div]:bg-gray-500',
  '稀有': '[&>div]:bg-blue-500',
  '史诗': '[&>div]:bg-purple-500',
  '传说': '[&>div]:bg-yellow-500',
  '神话': '[&>div]:bg-red-500',
};

// 单个碎片卡片 - 按物品名称分组
function FragmentCard({
  group,
  onSynthesize,
  disabled,
}: {
  group: FragmentGroup;
  onSynthesize: () => void;
  disabled?: boolean;
}) {
  const progressPercent = Math.floor(group.progress * 100);
  
  const typeIcon = group.type === 'technique' ? <Sparkles className="w-3 h-3" /> : <Swords className="w-3 h-3" />;
  const typeName = group.type === 'technique' ? '残本' : '残片';
  const actionName = group.type === 'technique' ? '合成' : '重铸';
  
  // 显示收集的序号
  const sortedIndices = [...group.collectedIndices].sort((a, b) => a - b);
  const indicesDisplay = sortedIndices.map(i => i.toString()).join(',');
  const allIndices = Array.from({ length: group.totalRequired }, (_, i) => i + 1);
  const missingIndices = allIndices.filter(i => !group.collectedIndices.includes(i));
  
  const stats = [
    { label: '已收集', value: `${group.collectedIndices.length}/${group.totalRequired}` },
    { label: '碎片序号', value: indicesDisplay || '-' },
    { label: '进度', value: `${progressPercent}%` },
  ];
  
  const description = group.canSynthesize
    ? `已收集全部碎片，可以${actionName}「${group.sourceName}」`
    : `缺少第 ${missingIndices.join(', ')} 片，继续收集可${actionName}`;
  
  return (
    <ItemTooltip
      name={`${group.sourceName}·${typeName}`}
      rarity={group.rarity}
      type={group.type === 'technique' ? '功法碎片' : '装备碎片'}
      description={description}
      stats={stats}
      side="top"
    >
      <div className={cn(
        'relative rounded border p-1.5 transition-all',
        'hover:scale-[1.02] active:scale-[0.98]',
        getRarityStyle(group.rarity, 'border'),
        getRarityStyle(group.rarity, 'bg'),
        group.canSynthesize && 'ring-1 ring-green-500/50'
      )}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className={cn('flex-shrink-0', rarityColors[group.rarity])}>{typeIcon}</span>
            <span className={cn('text-[10px] font-medium truncate', rarityColors[group.rarity])}>
              {group.sourceName}
            </span>
          </div>
          <Badge variant="outline" className={cn('text-[9px] flex-shrink-0 ml-1', rarityColors[group.rarity])}>
            {group.collectedIndices.length}/{group.totalRequired}
          </Badge>
        </div>
        
        {/* 显示已收集的序号 */}
        <div className="flex gap-0.5 mb-1 flex-wrap">
          {allIndices.map(idx => (
            <span 
              key={idx}
              className={cn(
                'text-[8px] px-0.5 rounded',
                group.collectedIndices.includes(idx) 
                  ? 'bg-green-500/20 text-green-600' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {idx}
            </span>
          ))}
        </div>
        
        <Progress 
          value={progressPercent} 
          className={cn('h-1 bg-muted', rarityProgressColors[group.rarity])}
        />
        
        <Button
          size="sm"
          className="w-full h-5 text-[9px] mt-1"
          disabled={!group.canSynthesize || disabled}
          onClick={(e) => {
            e.stopPropagation();
            onSynthesize();
          }}
        >
          {group.canSynthesize ? (
            <>
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              {actionName}
            </>
          ) : (
            <>
              <Lock className="w-2.5 h-2.5 mr-0.5" />
              收集中
            </>
          )}
        </Button>
      </div>
    </ItemTooltip>
  );
}

export function FragmentPanel({
  fragmentInventory,
  playerLevel,
  worldType,
  onSynthesize,
  disabled = false,
}: FragmentPanelProps) {
  // 确保碎片库存存在
  const inventory: FragmentInventory = useMemo(() => {
    return fragmentInventory || createEmptyFragmentInventory();
  }, [fragmentInventory]);
  
  // 获取按名称分组的碎片
  const groups = useMemo(() => {
    return getFragmentGroupsByName(inventory);
  }, [inventory]);
  
  // 功法碎片组
  const techniqueGroups = useMemo(() => {
    return groups.filter(g => g.type === 'technique');
  }, [groups]);
  
  // 装备碎片组
  const equipmentGroups = useMemo(() => {
    return groups.filter(g => g.type === 'equipment');
  }, [groups]);
  
  // 统计
  const totalFragments = useMemo(() => getTotalFragmentCount(inventory), [inventory]);
  const synthesizableCount = useMemo(() => getSynthesizableCount(inventory), [inventory]);

  return (
    <div className="h-full flex flex-col">
      {/* 统计信息 */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] text-muted-foreground">
          共 {totalFragments} 个碎片
        </span>
        {synthesizableCount > 0 && (
          <Badge className="text-[9px] bg-green-500 animate-pulse">
            可合成 {synthesizableCount} 个
          </Badge>
        )}
      </div>
      
      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-3">
          {/* 功法碎片 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium px-1">
              <Sparkles className="w-3 h-3" />
              功法残本
              <span className="ml-auto text-[9px]">
                {techniqueGroups.filter(g => g.canSynthesize).length} 可合成
              </span>
            </div>
            {techniqueGroups.length > 0 ? (
              <div className="grid grid-cols-2 gap-1">
                {techniqueGroups.map(group => (
                  <FragmentCard
                    key={`technique-${group.sourceName}`}
                    group={group}
                    onSynthesize={() => onSynthesize('technique', group.rarity, group.sourceName)}
                    disabled={disabled}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground text-center py-2">
                暂无功法残本
              </div>
            )}
          </div>
          
          {/* 装备碎片 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium px-1">
              <Swords className="w-3 h-3" />
              装备残片
              <span className="ml-auto text-[9px]">
                {equipmentGroups.filter(g => g.canSynthesize).length} 可重铸
              </span>
            </div>
            {equipmentGroups.length > 0 ? (
              <div className="grid grid-cols-2 gap-1">
                {equipmentGroups.map(group => (
                  <FragmentCard
                    key={`equipment-${group.sourceName}`}
                    group={group}
                    onSynthesize={() => onSynthesize('equipment', group.rarity, group.sourceName)}
                    disabled={disabled}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground text-center py-2">
                暂无装备残片
              </div>
            )}
          </div>
          
          {/* 说明 */}
          <div className="text-[9px] text-muted-foreground space-y-0.5 pt-2 border-t px-1">
            <p>• 击败敌人必定掉落碎片</p>
            <p>• 碎片标注具体功法/装备名称</p>
            <p>• 收集同名碎片的全部序号可合成</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
