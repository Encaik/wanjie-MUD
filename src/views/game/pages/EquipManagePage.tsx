/**
 * EquipManagePage — 装备管理页面（合并旧装备/功法/技能三页）
 *
 * 左侧：槽位面板（装备槽×6 + 功法槽×3 + 技能槽×6）
 * 右侧：物品选择列表（Tab分类：装备 | 功法 | 技能）
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

import { SLOT_DEFINITIONS, getSlotsByCategory } from '@/modules/item/data/slots';
import {
  equipItem,
  unequipItem,
  equipSkill,
  unequipSkill,
  resolveItem,
  findItemByInstance,
} from '@/modules/item/logic';
import type { SlotDefinition, SlotId, ResolvedItem } from '@/modules/item/types';
import { Button } from '@/shared/ui/actions/button';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/data-display/tabs';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import { cn } from '@/shared/utils';
import { useAddMessage } from '@/views/game/hooks/useAddMessage';
import { useGameStore } from '@/views/game/state/GameStore';

// ─── 槽位图标映射 ───

const SLOT_ICONS: Record<string, string> = {
  weapon_melee: '⚔️',
  weapon_ranged: '🏹',
  armor_head: '⛑️',
  armor_body: '🛡️',
  armor_legs: '👖',
  armor_feet: '👢',
  technique_1: '📜',
  technique_2: '📜',
  technique_3: '📜',
  skill_1: '✨',
  skill_2: '✨',
  skill_3: '✨',
  skill_4: '✨',
  skill_5: '✨',
  skill_6: '✨',
};

const CATEGORY_NAMES: Record<string, string> = {
  equipment: '装备',
  technique: '功法',
  skill: '技能',
};

// ─── 组件 ───

export function EquipManagePage() {
  const { gameState, dispatch } = useGameStore();
  const addMessage = useAddMessage();

  const p = gameState.protagonist;
  const items = p?.items ?? [];
  const slots = p?.slots ?? {};

  const [selectedCategory, setSelectedCategory] = useState<'equipment' | 'technique' | 'skill'>('equipment');
  const [selectedSlot, setSelectedSlot] = useState<SlotId | null>(null);

  // 获取各类槽位定义
  const equipmentSlots = useMemo(() => getSlotsByCategory('equipment'), []);
  const techniqueSlots = useMemo(() => getSlotsByCategory('technique'), []);
  const skillSlots = useMemo(() => getSlotsByCategory('skill'), []);

  // 获取已装备物品信息
  const getEquippedInSlot = useCallback((slotId: string): ResolvedItem | null => {
    const instanceId = slots[slotId];
    if (!instanceId) return null;
    const instance = findItemByInstance(items, instanceId);
    if (!instance) return null;
    try { return resolveItem(instance); } catch { return null; }
  }, [items, slots]);

  // 获取指定分类的未装备物品
  const availableItems = useMemo((): ResolvedItem[] => {
    return items
      .filter(i => {
        if (i.equipped || i.isFragment) return false;
        try {
          const resolved = resolveItem(i);
          return resolved.category === selectedCategory;
        } catch { return false; }
      })
      .map(i => resolveItem(i));
  }, [items, selectedCategory]);

  // 装备操作
  const handleEquip = useCallback((instanceId: string, slotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return;

    let result;
    const slotDef = SLOT_DEFINITIONS.find(s => s.slotId === slotId);
    if (slotDef?.category === 'skill') {
      result = equipSkill(currentP.items, currentP.slots, instanceId, slotId);
    } else {
      result = equipItem(currentP.items, currentP.slots, instanceId, slotId);
    }

    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev) => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          },
        };
      });
      addMessage('success', result.message || '装备成功', '');
    } else {
      addMessage('failure', result.error || '装备失败', '');
    }
  }, [gameState.protagonist, dispatch, addMessage]);

  const handleUnequip = useCallback((slotId: string) => {
    const currentP = gameState.protagonist;
    if (!currentP) return;

    const slotDef = SLOT_DEFINITIONS.find(s => s.slotId === slotId);
    let result;
    if (slotDef?.category === 'skill') {
      result = unequipSkill(currentP.items, currentP.slots, slotId);
    } else {
      result = unequipItem(currentP.items, currentP.slots, slotId);
    }

    if (result.success && result.updatedInventory && result.updatedSlots) {
      dispatch((prev) => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: result.updatedInventory!,
            slots: result.updatedSlots!,
          },
        };
      });
      addMessage('info', result.message || '卸下成功', '');
    }
  }, [gameState.protagonist, dispatch, addMessage]);

  // 点击槽位时切换右侧分类
  const handleSlotClick = useCallback((slotDef: SlotDefinition) => {
    setSelectedCategory(slotDef.category);
    setSelectedSlot(slotDef.slotId);
  }, []);

  // ─── 渲染：槽位组 ───

  const renderSlotGroup = (
    title: string,
    slotDefs: SlotDefinition[],
  ) => (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">{title}</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {slotDefs.map(def => {
          const equipped = getEquippedInSlot(def.slotId);
          const isSelected = selectedSlot === def.slotId;
          return (
            <button
              key={def.slotId}
              onClick={() => handleSlotClick(def)}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-all',
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : equipped
                    ? 'border-border/60 bg-card hover:border-primary/40'
                    : 'border-dashed border-border/30 bg-muted/20 hover:border-border/60',
              )}
            >
              <span className="text-lg">{SLOT_ICONS[def.slotId] || '🔲'}</span>
              <span className="text-[10px] text-muted-foreground">{def.displayName}</span>
              {equipped ? (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-tight truncate max-w-full">
                  {equipped.name}
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">空</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── 渲染：右侧物品列表 ───

  const renderItemList = () => {
    const slotDef = selectedSlot ? SLOT_DEFINITIONS.find(s => s.slotId === selectedSlot) : null;
    const currentEquipped = selectedSlot ? getEquippedInSlot(selectedSlot) : null;

    return (
      <div className="flex flex-col h-full">
        {/* 选中槽位信息 */}
        {slotDef && (
          <div className="shrink-0 px-3 py-2 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{SLOT_ICONS[slotDef.slotId] || '🔲'}</span>
                <div>
                  <p className="text-sm font-medium">{slotDef.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {CATEGORY_NAMES[slotDef.category]}槽位
                    {slotDef.acceptedSubcategory && ` · ${slotDef.acceptedSubcategory}`}
                  </p>
                </div>
              </div>
              {currentEquipped && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleUnequip(slotDef.slotId)}
                >
                  卸下
                </Button>
              )}
            </div>
            {currentEquipped && (
              <div className="mt-1.5 text-xs text-muted-foreground">
                已装备：<span className="font-medium text-foreground">{currentEquipped.name}</span>
                <span className="ml-2">Lv.{currentEquipped.level}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 切换分类 */}
        <div className="shrink-0 px-3 pt-2">
          <Tabs
            value={selectedCategory}
            onValueChange={(v) => { setSelectedCategory(v as 'equipment' | 'technique' | 'skill'); setSelectedSlot(null); }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="equipment" className="flex-1 text-xs">装备</TabsTrigger>
              <TabsTrigger value="technique" className="flex-1 text-xs">功法</TabsTrigger>
              <TabsTrigger value="skill" className="flex-1 text-xs">技能</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 物品列表 */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1.5">
              {availableItems.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  背包中没有可装备的{CATEGORY_NAMES[selectedCategory]}
                </p>
              ) : (
                availableItems.map(item => (
                  <Card
                    key={item.instanceId}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/40',
                      selectedSlot && 'hover:bg-primary/5',
                    )}
                    onClick={() => {
                      if (selectedSlot) {
                        handleEquip(item.instanceId, selectedSlot);
                      }
                    }}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {item.rarity} · Lv.{item.level}/{item.maxLevel}
                          {item.element && ` · ${item.element}`}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 ml-2">
                        {Object.entries(item.actualStats).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="ml-1">{k}:{v}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // ─── 主布局 ───

  return (
    <div className="grid grid-cols-12 gap-3 h-full">
      {/* 左侧：槽位面板 */}
      <div className="col-span-4 space-y-4 p-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">装备管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderSlotGroup('装备槽位', equipmentSlots)}
            {renderSlotGroup('功法槽位', techniqueSlots)}
            {renderSlotGroup('技能槽位', skillSlots)}
          </CardContent>
        </Card>
      </div>

      {/* 右侧：物品选择 */}
      <div className="col-span-8">
        <Card className="h-full flex flex-col">
          {renderItemList()}
        </Card>
      </div>
    </div>
  );
}
