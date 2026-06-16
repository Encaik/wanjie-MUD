'use client';

/**
 * 统一背包面板
 *
 * 卡片网格布局 + 品类 Tab 筛选。
 * 操作按钮在 ItemTooltip 浮层中。
 */

import { useState, useMemo, useCallback } from 'react';

import { Package } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/data-display/tabs';

import { ItemCard } from './ItemCard';
import { ItemGrid } from './ItemGrid';
import { ItemTooltip } from './ItemTooltip';
import { useEquipment } from '../hooks/useEquipment';
import { useInventory } from '../hooks/useInventory';
import { useSkills } from '../hooks/useSkills';

import type { ResolvedItem, ItemCategory } from '../types';

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
  const { items, useItem: consumeItem, getResolvedItem } = useInventory();
  const { equipItem } = useEquipment();
  const { equipSkill } = useSkills();

  const allItems = useMemo(() => {
    return items
      .map(i => {
        try { return getResolvedItem(i); } catch { return null; }
      })
      .filter((item): item is ResolvedItem => item !== null);
  }, [items, getResolvedItem]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return allItems;
    return allItems.filter(i => i.category === activeTab);
  }, [allItems, activeTab]);

  const handleUse = useCallback((item: ResolvedItem) => {
    if (item.category === 'consumable' && item.quantity > 0) {
      consumeItem(item.instanceId);
    }
  }, [consumeItem]);

  const handleEquip = useCallback((item: ResolvedItem) => {
    if (item.equipped) return;
    if (item.category === 'equipment') {
      const ext = item.ext as { equipSlot?: string };
      if (ext.equipSlot) equipItem(item.instanceId, ext.equipSlot);
    } else if (item.category === 'technique') {
      const slotPrefix = item.subcategory === 'attack' ? 'technique_attack' : 'technique_defense';
      equipItem(item.instanceId, `${slotPrefix}_0`);
    } else if (item.category === 'skill') {
      equipSkill(item.instanceId, 'skill_weapon_melee_0');
    }
  }, [equipItem, equipSkill]);

  const renderItem = useCallback((item: ResolvedItem) => {
    return (
      <ItemTooltip key={item.instanceId} item={item} side="top" onUse={handleUse} onEquip={handleEquip}>
        <ItemCard item={item} />
      </ItemTooltip>
    );
  }, [handleUse, handleEquip]);

  const getTabCount = useCallback((key: string) => {
    if (key === 'all') return allItems.length;
    return allItems.filter(i => i.category === key).length;
  }, [allItems]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 pt-3 shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-primary" />
          背包
          <span className="text-[10px] text-muted-foreground font-normal">
            ({allItems.length}种)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-3 flex-1 overflow-hidden space-y-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1">
            {CATEGORY_TABS.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs px-2 py-1">
                {tab.label}
                {getTabCount(tab.key) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                    {getTabCount(tab.key)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-2">
            <div className="min-h-[280px] max-h-[460px] overflow-y-auto">
              <ItemGrid emptyMessage={`暂无${CATEGORY_TABS.find(t => t.key === activeTab)?.label || '物品'}`}>
                {filteredItems.map(renderItem)}
              </ItemGrid>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
