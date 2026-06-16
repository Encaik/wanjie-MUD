'use client';

/**
 * 统一背包面板
 *
 * 按 category Tab 切换显示所有物品。
 * 使用 useInventory() 从全局状态获取数据。
 */

import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/data-display/tabs';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Progress } from '@/shared/ui/feedback/progress';
import { cn } from '@/shared/utils/cn';
import { useInventory } from '../hooks/useInventory';
import { useEquipment } from '../hooks/useEquipment';
import { useSkills } from '../hooks/useSkills';
import { ItemTooltip } from './ItemTooltip';
import type { ResolvedItem, ItemCategory } from '../types';

/** Tab 定义 */
const CATEGORY_TABS: { key: ItemCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'equipment', label: '装备' },
  { key: 'technique', label: '功法' },
  { key: 'skill', label: '技能' },
  { key: 'consumable', label: '丹药' },
  { key: 'material', label: '材料' },
  { key: 'currency', label: '货币' },
  { key: 'fragment', label: '碎片' },
];

export function InventoryPanel() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { items, useItem, getResolvedItem, addItem } = useInventory();
  const { equipItem } = useEquipment();
  const { equipSkill } = useSkills();

  /** 解析所有物品 */
  const allItems = useMemo(() => {
    return items.map(i => {
      try { return getResolvedItem(i); }
      catch { return null; }
    }).filter(Boolean) as ResolvedItem[];
  }, [items, getResolvedItem]);

  /** 按 Tab 筛选 */
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return allItems;
    return allItems.filter(i => i.category === activeTab);
  }, [allItems, activeTab]);

  /** 处理物品点击 */
  const handleItemClick = useCallback((item: ResolvedItem) => {
    if (item.equipped) return;
    if (item.category === 'consumable') {
      useItem(item.instanceId);
    }
  }, [useItem]);

  /** 渲染物品卡片 */
  const renderItem = (item: ResolvedItem) => {
    const isEquippable = item.category === 'equipment' || item.category === 'technique';
    const isSkill = item.category === 'skill';
    const isUpgradable = item.maxLevel > 1 && item.level < item.maxLevel;

    return (
      <ItemTooltip key={item.instanceId} item={item}>
        <div
          className={cn(
            'relative flex items-center gap-2 rounded-lg border p-2 cursor-pointer',
            'hover:bg-accent/50 transition-colors',
            item.equipped && 'border-blue-500/50 bg-blue-500/5',
          )}
          onClick={() => handleItemClick(item)}
        >
          {/* 稀有度色条 */}
          <div className={cn(
            'w-0.5 h-8 rounded-full',
            item.rarity === 'common' && 'bg-gray-400',
            item.rarity === 'uncommon' && 'bg-green-500',
            item.rarity === 'rare' && 'bg-blue-500',
            item.rarity === 'epic' && 'bg-purple-500',
            item.rarity === 'legendary' && 'bg-orange-500',
            item.rarity === 'mythic' && 'bg-red-500',
          )} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">{item.name}</span>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground">x{item.quantity}</span>
              )}
              {item.equipped && (
                <Badge variant="secondary" className="text-[10px] px-1 h-4">已装备</Badge>
              )}
            </div>

            {isUpgradable && (
              <div className="mt-1">
                <Progress
                  value={(item.exp / item.expToNext) * 100}
                  className="h-1"
                  indicatorClassName="bg-yellow-500"
                />
              </div>
            )}
          </div>

          {/* 快捷操作 */}
          <div className="flex items-center gap-1 shrink-0">
            {isEquippable && !item.equipped && item.ext && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  const slotId = (item.ext as { equipSlot?: string }).equipSlot;
                  if (slotId) equipItem(item.instanceId, slotId);
                }}
              >
                <span className="text-[10px]">装备</span>
              </Button>
            )}
            {isSkill && !item.equipped && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  // 尝试装备到第一个可用技能槽
                  const slotId = item.category === 'skill' ? 'skill_weapon_melee_0' : '';
                  if (slotId) equipSkill(item.instanceId, slotId);
                }}
              >
                <span className="text-[10px]">装备</span>
              </Button>
            )}
            {item.category === 'consumable' && item.quantity > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
              >
                <span className="text-[10px]">使用</span>
              </Button>
            )}
          </div>
        </div>
      </ItemTooltip>
    );
  };

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1">
          {CATEGORY_TABS.map(tab => {
            const count = tab.key === 'all'
              ? allItems.length
              : allItems.filter(i => i.category === tab.key).length;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs px-2 py-1">
                {tab.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">{count}</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-2">
          {filteredItems.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              暂无物品
            </div>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredItems.map(renderItem)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
