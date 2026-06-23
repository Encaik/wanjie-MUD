'use client';

import { useMemo } from 'react';

import { Package, EyeOff, Sparkles } from 'lucide-react';

import { InventoryItem, ItemRarity, WorldType } from '@/core/types';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';

interface AdventureLootPanelProps {
  loot: InventoryItem[];
  experience?: number; // 待结算经验值
  worldType: WorldType; // 世界类型（必填，无兜底默认值）
}

const rarityColorMap: Record<string, string> = {
  '普通': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300',
  '稀有': 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 border-blue-400',
  '史诗': 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 border-purple-400',
  '传说': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400 border-yellow-400',
};

// 高品质物品的遮掩名称
const hiddenItemNames: Record<string, string> = {
  '史诗': '未知珍宝',
  '传说': '稀世秘宝',
};

// 需要遮掩的品质
const HIDDEN_RARITIES: ItemRarity[] = ['史诗', '传说'];

export function AdventureLootPanel({ loot, experience = 0, worldType }: AdventureLootPanelProps) {
  if (loot.length === 0 && experience === 0) return null;

  // 获取世界术语
  const terminology = getTerminology(worldType);

  // 判断物品是否需要遮掩（高品质物品在通关前遮掩）
  const isItemHidden = (rarity: ItemRarity): boolean => {
    return HIDDEN_RARITIES.includes(rarity);
  };

  // 获取显示名称（使用统一术语系统）
  const getDisplayName = (item: InventoryItem): string => {
    const rarity = item.definition?.rarity;
    
    // 高品质物品遮掩显示
    if (isItemHidden(rarity)) {
      return hiddenItemNames[rarity] || '未知物品';
    }
    
    // 灵石使用世界统一术语
    if (item.definition?.id === 'spirit_stone') {
      return terminology.resource;
    }
    
    return item.definition?.name || '未知物品';
  };

  // 计算总物品数量
  const totalItems = loot.reduce((sum, i) => sum + i.quantity, 0);

  // 合并相同物品（按物品ID合并，显示总数量）
  const mergedLoot = useMemo(() => {
    const merged = new Map<string, InventoryItem>();
    for (const item of loot) {
      const id = item.definition?.id || 'unknown';
      if (merged.has(id)) {
        const existing = merged.get(id)!;
        merged.set(id, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        merged.set(id, { ...item });
      }
    }
    return Array.from(merged.values());
  }, [loot]);

  return (
    <Card>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="w-4 h-4" />
          本次战利品
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {totalItems}件物品
            </Badge>
          )}
          {experience > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
              <Sparkles className="w-3 h-3 mr-1" />
              {experience}经验
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        {mergedLoot.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {mergedLoot.map((item, idx) => {
              const rarity = item.definition?.rarity;
              const isHidden = isItemHidden(rarity);
              const displayName = getDisplayName(item);
              
              return (
                <div 
                  key={idx} 
                  className={`text-center p-1.5 rounded border ${isHidden ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300' : (rarityColorMap[rarity] || 'bg-muted border-border')}`}
                >
                  <div className="text-[10px] font-medium truncate flex items-center justify-center gap-0.5">
                    {isHidden && <EyeOff className="w-2.5 h-2.5 text-purple-500" />}
                    {displayName}
                  </div>
                  <div className="text-[9px] opacity-70">x{item.quantity}</div>
                </div>
              );
            })}
          </div>
        )}
        {experience > 0 && mergedLoot.length === 0 && (
          <div className="text-center py-2 text-sm text-green-600 dark:text-green-400">
            <Sparkles className="w-4 h-4 inline mr-1" />
            待结算经验值: {experience}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
          击败Boss后退出获得全部战利品和经验值，被击败会丢失80%
        </div>
      </CardContent>
    </Card>
  );
}
