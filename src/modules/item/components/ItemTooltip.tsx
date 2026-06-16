'use client';

/**
 * 统一物品提示浮层
 *
 * 根据 ItemInstance 的 category 显示不同信息：
 * 货币=余额 / 消耗品=效果 / 装备=属性+斗技槽 / 功法=属性+法技槽 / 技能=效果+标签
 */

import { type ReactNode } from 'react';
import type { ResolvedItem, Rarity } from '../types';
import { Badge } from '@/shared/ui/data-display/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/overlay/tooltip';

interface ItemTooltipProps {
  children: ReactNode;
  item: ResolvedItem;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/** 稀有度颜色映射（对齐 quality-* CSS 变量） */
const RARITY_TEXT_CLASS: Record<Rarity, string> = {
  common: 'text-quality-common',
  uncommon: 'text-quality-uncommon',
  rare: 'text-quality-rare',
  epic: 'text-quality-epic',
  legendary: 'text-quality-legendary',
  mythic: 'text-quality-mythic',
};

export function ItemTooltip({ children, item, side = 'top' }: ItemTooltipProps) {
  const rarityText = RARITY_TEXT_CLASS[item.rarity];
  const isEquippable = item.category === 'equipment' || item.category === 'technique';
  const isSkill = item.category === 'skill';
  const isConsumable = item.category === 'consumable';

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-[220px] border-2 shadow-lg">
        <div className="space-y-1.5">
          {/* 名称 + 稀有度 */}
          <div className="flex items-center gap-1.5">
            <span className={`font-medium text-sm ${rarityText}`}>{item.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {item.rarity === 'common' ? '凡品' :
               item.rarity === 'uncommon' ? '精良' :
               item.rarity === 'rare' ? '稀有' :
               item.rarity === 'epic' ? '史诗' :
               item.rarity === 'legendary' ? '传说' : '神话'}
            </Badge>
          </div>

          {/* 类别 */}
          <div className="text-[11px] text-muted-foreground capitalize">
            {item.category === 'currency' ? '货币' :
             item.category === 'consumable' ? '消耗品' :
             item.category === 'material' ? '材料' :
             item.category === 'equipment' ? '装备' :
             item.category === 'technique' ? '功法' :
             item.category === 'skill' ? '技能' : '碎片'}
            {item.subcategory && ` · ${item.subcategory}`}
          </div>

          {/* 描述 */}
          {item.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          )}

          {/* 等级（可升级物品） */}
          {item.maxLevel > 1 && (
            <div className="text-[11px] text-muted-foreground">
              等级 {item.level}/{item.maxLevel}
              {item.level < item.maxLevel && ` · EXP ${item.exp}/${item.expToNext}`}
            </div>
          )}

          {/* 属性 */}
          {Object.keys(item.actualStats).length > 0 && (
            <div className="border-t pt-1 space-y-0.5">
              {Object.entries(item.actualStats).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-mono text-green-400">+{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* 技能槽位 */}
          {isEquippable && ((item.ext as { providesSkillSlots?: number }).providesSkillSlots ?? 0) > 0 && (
            <div className="text-[11px] text-blue-400">
              技能槽: {(item.ext as { providesSkillSlots: number }).providesSkillSlots} 个
            </div>
          )}

          {/* 技能效果 */}
          {isSkill && (item.ext as { effects?: { description?: string }[] }).effects && (
            <div className="border-t pt-1 space-y-0.5">
              {(item.ext as { effects: { description?: string }[] }).effects.map((eff, i) => (
                eff.description && <div key={i} className="text-[11px] text-yellow-400">{eff.description}</div>
              ))}
            </div>
          )}

          {/* 消耗品效果 */}
          {isConsumable && (item.ext as { effects?: { description?: string }[] }).effects && (
            <div className="border-t pt-1 space-y-0.5">
              {(item.ext as { effects: { description?: string }[] }).effects.map((eff, i) => (
                eff.description && <div key={i} className="text-[11px] text-green-400">{eff.description}</div>
              ))}
            </div>
          )}

          {/* 碎片标记 */}
          {item.isFragment && (
            <div className="text-[11px] text-orange-400">碎片 · 集齐可合成</div>
          )}

          {/* 装备状态 */}
          {item.equipped && (
            <div className="text-[11px] text-blue-400">
              已装备 {item.equippedInSlot ? `· 槽位: ${item.equippedInSlot}` : ''}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
