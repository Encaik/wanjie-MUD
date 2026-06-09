'use client';

import { ReactNode } from 'react';

import type { ItemRarity } from '@/shared/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { getRarityStyle, getStatColor } from '@/shared/utils/rarityStyles';

// 向后兼容：重导出从 item-tooltip 移出的组件和工具
export { EmptySlotCard, BackpackHeader, EmptyBackpackHint } from './empty-slot';
export { UpgradeableItemTooltip } from './upgradeable-item-tooltip';
export { RARITY_STYLES, getRarityStyle, getStatColor, STAT_COLOR_MAP } from '@/shared/utils/rarityStyles';

/** 统一物品tooltip属性 */
interface ItemTooltipProps {
  children: ReactNode;
  name: string;
  rarity: ItemRarity;
  type: string;
  description?: string;
  stats?: { label: string; value: string | number; color?: string }[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/** 统一物品tooltip — 显示名称、稀有度、描述、属性加成 */
export function ItemTooltip({
  children, name, rarity, type, description, stats = [],
  side = 'top', className = '',
}: ItemTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        data-slot="item-tooltip-content"
        className={`max-w-[200px] bg-popover text-popover-foreground border-2 border-border shadow-lg ${className}`}
      >
        <div className="space-y-1.5">
          {/* 名称 */}
          <div className={`font-medium text-sm font-serif ${getRarityStyle(rarity, 'text')}`}>
            {name}
          </div>

          {/* 类型和稀有度 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-serif">{type}</span>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 font-serif ${getRarityStyle(rarity, 'badge')}`}>
              {rarity}
            </Badge>
          </div>

          {/* 描述 */}
          {description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed font-serif">{description}</p>
          )}

          {/* 属性加成 */}
          {stats.length > 0 && (
            <div className="pt-1 space-y-0.5">
              <div className="bg-gradient-to-r from-transparent via-border to-transparent h-px mb-1" />
              {stats.map((stat, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-serif">{stat.label}</span>
                  <span className={`font-serif ${getStatColor(stat.color)}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
