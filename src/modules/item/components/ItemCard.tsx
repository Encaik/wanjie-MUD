'use client';

/**
 * 物品卡片组件 — 纯展示，按品类差异化渲染
 *
 * 操作（使用/装备）由 ItemTooltip 中的按钮处理。
 */

import { type ReactNode } from 'react';

import { Sword, Shield, Crown, Footprints } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Progress } from '@/shared/ui/feedback/progress';
import { cn } from '@/shared/utils/cn';

import { RARITY_CONFIG } from '../data/rarity';

import type { RarityConfig } from '../data/rarity';
import type { ResolvedItem, Rarity } from '../types';

interface ItemCardProps {
  item: ResolvedItem;
  className?: string;
}

/** 装备槽位图标 */
const SLOT_ICON: Record<string, typeof Sword> = {
  weapon_melee: Sword, weapon_ranged: Sword,
  armor_head: Crown, armor_body: Shield, armor_legs: Footprints, armor_feet: Footprints,
};

const PILL_ICON: Record<string, string> = {
  pill_hp: '❤️', pill_mp: '💙', pill_cultivation: '🌿', pill_breakthrough: '⚡', pill_stat: '💪', scroll: '📃',
};

const MATERIAL_ICON: Record<string, string> = {
  herb: '🌿', ore: '⛏️', gem: '💎', beast_part: '🦴', exp_fodder: '💠', special: '🔮',
};

const SKILL_TAG_LABEL: Record<string, string> = {
  instant: '瞬发', channeling: '吟唱', aoe: '范围', dot: '持续伤', hot: '持续疗',
  shield: '护盾', lifesteal: '吸血', execute: '斩杀', combo: '连击',
  counter: '反击', buff: '增益', debuff: '减益',
};

const GLOW_ANIMATION: Partial<Record<Rarity, string>> = {
  mythic: 'animate-glow-pulse-strong',
  legendary: 'animate-glow-pulse-strong',
  epic: 'animate-glow-pulse',
};

function isUpgradable(item: ResolvedItem): boolean {
  return item.maxLevel > 1 && item.level < item.maxLevel;
}

export function ItemCard({ item, className }: ItemCardProps) {
  const config = RARITY_CONFIG[item.rarity];

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 p-1.5 w-full aspect-square',
        'transition-colors duration-200 select-none',
        GLOW_ANIMATION[item.rarity],
        'hover:shadow-lg hover:brightness-110',
        item.equipped && 'ring-1 ring-blue-500/50',
        className,
      )}
      style={{
        borderColor: config.color,
        backgroundColor: config.color + '1A',
        '--glow-color': config.color + '80',
        '--glow-color-weak': config.color + '30',
      } as React.CSSProperties}
    >
      {/* 已装备角标 */}
      {item.equipped && (
        <div className="absolute -top-1 -right-1 z-10">
          <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-blue-500/80 text-white border-0">
            已装备
          </Badge>
        </div>
      )}

      {/* 内容区 */}
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        {renderCardContent(item)}
      </div>

      {/* 数量角标（仅可堆叠且不可升级物品） */}
      {item.maxLevel === 1 && item.quantity > 1 && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-medium text-muted-foreground tabular-nums leading-none">
          ×{item.quantity}
        </span>
      )}
    </div>
  );
}

function renderCardContent(item: ResolvedItem) {
  switch (item.category) {
    case 'equipment': return renderEquipmentCard(item);
    case 'technique': return renderTechniqueCard(item);
    case 'skill': return renderSkillCard(item);
    case 'consumable': return <><span className="text-lg">{PILL_ICON[item.subcategory] || '🧪'}</span><span className="text-[10px] font-medium text-center truncate w-full leading-tight">{item.name}</span></>;
    case 'material': return <><span className="text-lg">{MATERIAL_ICON[item.subcategory] || '📦'}</span><span className="text-[10px] font-medium text-center truncate w-full leading-tight">{item.name}</span></>;
    case 'currency': return <><span className="text-lg">💰</span><span className="text-[10px] text-center truncate w-full leading-tight">{item.name}</span></>;
    case 'fragment': {
      const ext = item.ext as { sourceName?: string };
      return <><span className="text-base">🧩</span><span className="text-[9px] text-center truncate w-full leading-tight opacity-75">{ext?.sourceName || '未知'}</span></>;
    }
    default: return <><span className="text-base">📦</span><span className="text-[10px] font-medium text-center truncate w-full leading-tight">{item.name}</span></>;
  }
}

function renderEquippableCard(item: ResolvedItem, icon: ReactNode) {
  const expPercent = item.expToNext > 0 ? (item.exp / item.expToNext) * 100 : 0;
  return (
    <>
      {icon}
      <span className="text-[11px] font-medium text-center truncate w-full leading-tight">{item.name}</span>
      {isUpgradable(item) && (
        <div className="w-full px-1">
          <Progress value={expPercent} className="h-1" indicatorClassName="bg-yellow-500" />
        </div>
      )}
      {!isUpgradable(item) && item.maxLevel > 1 && (
        <span className="text-[9px] text-muted-foreground">等级{item.level} MAX</span>
      )}
    </>
  );
}

function renderEquipmentCard(item: ResolvedItem) {
  const SlotIcon = SLOT_ICON[item.subcategory] || Sword;
  return renderEquippableCard(item, <SlotIcon className="w-5 h-5 text-muted-foreground" />);
}

function renderTechniqueCard(item: ResolvedItem) {
  return renderEquippableCard(item, <span className="text-base">{item.subcategory === 'attack' ? '⚔️' : '🛡️'}</span>);
}

function renderSkillCard(item: ResolvedItem) {
  const ext = item.ext as { tags?: string[] };
  const tags: string[] = ext?.tags ?? [];
  const displayTags = tags.slice(0, 2);

  return (
    <>
      <span className="text-base">{item.subcategory === 'magic_skill' ? '🔮' : '💥'}</span>
      <span className="text-[10px] font-medium text-center truncate w-full leading-tight">{item.name}</span>
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {displayTags.map(tag => (
            <span key={tag} className="text-[7px] px-1 py-0 rounded border border-border text-muted-foreground leading-tight">
              {SKILL_TAG_LABEL[tag] || tag}
            </span>
          ))}
          {tags.length > 2 && <span className="text-[7px] text-muted-foreground">+{tags.length - 2}</span>}
        </div>
      )}
    </>
  );
}
