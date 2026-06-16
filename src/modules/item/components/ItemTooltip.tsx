'use client';

/**
 * 统一物品详情浮层 — 品类感知 + 操作按钮
 */

import { type ReactNode, useCallback } from 'react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/overlay/tooltip';

import { TooltipCategorySection, CATEGORY_LABEL, SUBCATEGORY_LABEL } from './ItemTooltipSections';
import { RARITY_CONFIG } from '../data/rarity';

import type { RarityConfig } from '../data/rarity';
import type { ResolvedItem } from '../types';

interface ItemTooltipProps {
  children: ReactNode;
  item: ResolvedItem;
  side?: 'top' | 'right' | 'bottom' | 'left';
  onUse?: (item: ResolvedItem) => void;
  onEquip?: (item: ResolvedItem) => void;
}

export function ItemTooltip({ children, item, side = 'top', onUse, onEquip }: ItemTooltipProps) {
  const config = RARITY_CONFIG[item.rarity];
  const canUse = item.category === 'consumable' && item.quantity > 0;
  const canEquip = (item.category === 'equipment' || item.category === 'technique' || item.category === 'skill') && !item.equipped;

  const handleUse = useCallback(() => { onUse?.(item); }, [item, onUse]);
  const handleEquip = useCallback(() => { onEquip?.(item); }, [item, onEquip]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="w-[280px] border-2 shadow-xl p-0 overflow-hidden"
        style={{ borderColor: config.color + '60' }}
      >
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(to right, ${config.color}, ${config.color}60, transparent)` }}
        />

        <div className="p-3 space-y-2">
          <TooltipHeader item={item} config={config} />

          {item.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          )}

          <TooltipCategorySection item={item} />

          {(canUse || canEquip) && (
            <div className="border-t border-border pt-1.5 flex gap-2">
              {canUse && (
                <Button size="sm" variant="default" className="h-7 text-xs flex-1" onClick={handleUse}>
                  使用
                </Button>
              )}
              {canEquip && (
                <Button size="sm" variant="default" className="h-7 text-xs flex-1" onClick={handleEquip}>
                  装备
                </Button>
              )}
            </div>
          )}

          <TooltipFooter item={item} />
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** Header: 名称 + 稀有度徽章 + 类别 */
function TooltipHeader({ item, config }: { item: ResolvedItem; config: RarityConfig }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sm" style={{ color: config.color }}>
          {item.name}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0" style={{
          backgroundColor: config.color + '20',
          color: config.color,
        }}>
          {config.displayName}
        </Badge>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {CATEGORY_LABEL[item.category]}
        {item.subcategory && ` · ${SUBCATEGORY_LABEL[item.subcategory] || item.subcategory}`}
      </div>
    </div>
  );
}

function TooltipFooter({ item }: { item: ResolvedItem }) {
  if (!item.equipped) return null;
  return (
    <div className="border-t border-border pt-1.5 text-[10px] text-blue-400">
      已装备{item.equippedInSlot ? ` · ${SUBCATEGORY_LABEL[item.equippedInSlot] || item.equippedInSlot}` : ''}
    </div>
  );
}
