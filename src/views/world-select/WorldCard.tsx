'use client';

import { Flame, Gem, Shield, Skull, Sparkles, Sword, Zap } from 'lucide-react';

import type { World, WorldDifficulty } from '@/core/types';
import { STAT_KEYS } from '@/modules/identity/data/statDisplayNames';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent } from '@/shared/ui/data-display/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/overlay/tooltip';
import { cn, useDebounce } from '@/shared/utils';

interface WorldCardProps {
  world: World;
  index: number;
  onSelect: (world: World) => void;
}

// ============================================
// 常量配置
// ============================================

/** 难度等级元数据 */
const DIFFICULTY_META: Record<WorldDifficulty, {
  level: number;
  label: string;
  icon: typeof Flame;
  barColor: string;
  textColor: string;
}> = {
  '简单': { level: 1, label: '简单', icon: Flame, barColor: 'bg-emerald-400',  textColor: 'text-emerald-600 dark:text-emerald-400' },
  '普通': { level: 2, label: '普通', icon: Flame, barColor: 'bg-sky-400',     textColor: 'text-sky-600 dark:text-sky-400' },
  '困难': { level: 3, label: '困难', icon: Flame, barColor: 'bg-amber-400',   textColor: 'text-amber-600 dark:text-amber-400' },
  '噩梦': { level: 4, label: '噩梦', icon: Skull, barColor: 'bg-orange-400',  textColor: 'text-orange-600 dark:text-orange-400' },
  '地狱': { level: 5, label: '地狱', icon: Skull, barColor: 'bg-red-400',     textColor: 'text-red-600 dark:text-red-400' },
  '深渊': { level: 6, label: '深渊', icon: Skull, barColor: 'bg-purple-400',  textColor: 'text-purple-600 dark:text-purple-400' },
};

/** 五大属性色彩（用于芯片底色和边框） */
const STAT_COLORS = [
  { bg: 'bg-red-500/10',       border: 'border-red-500/30',       text: 'text-red-700 dark:text-red-400' },
  { bg: 'bg-emerald-500/10',   border: 'border-emerald-500/30',   text: 'text-emerald-700 dark:text-emerald-400' },
  { bg: 'bg-blue-500/10',      border: 'border-blue-500/30',      text: 'text-blue-700 dark:text-blue-400' },
  { bg: 'bg-purple-500/10',    border: 'border-purple-500/30',    text: 'text-purple-700 dark:text-purple-400' },
  { bg: 'bg-amber-500/10',     border: 'border-amber-500/30',     text: 'text-amber-700 dark:text-amber-400' },
];

// ============================================
// 子组件
// ============================================

/** 属性彩色芯片（纯标签展示，无进度条） */
function StatBadge({ label, index }: { label: string; index: number }) {
  const c = STAT_COLORS[index % STAT_COLORS.length];
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-md',
      'border text-xs font-semibold font-serif',
      c.bg, c.border, c.text,
    )}>
      {label}
    </span>
  );
}

/** 难度条（紧凑版） */
function DifficultyMeter({ difficulty }: { difficulty: WorldDifficulty }) {
  const meta = DIFFICULTY_META[difficulty];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-2">
      <span className={cn('shrink-0', meta.textColor)}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 flex gap-[3px]">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-all',
              i < meta.level ? meta.barColor : 'bg-muted/40',
            )}
          />
        ))}
      </div>
      <span className={cn('text-xs font-semibold font-serif shrink-0', meta.textColor)}>
        {meta.label}
      </span>
    </div>
  );
}

/** 带装饰线的区块标题 */
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold text-foreground/80 font-serif tracking-wide">
        {label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-border/30 to-transparent" />
    </div>
  );
}

// ============================================
// 主组件
// ============================================

/**
 * 世界卡片 — 星盘碎片
 *
 * 紧凑设计，一屏内可见多张卡片。
 * 展示：图标+名称、难度+类型、属性芯片、境界链、危险/机缘摘要、踏入按钮。
 */
export function WorldCard({ world, index, onSelect }: WorldCardProps) {
  const visualConfig = world.visualConfig;
  const handleSelect = useDebounce(() => onSelect(world), 600);

  const statLabels = STAT_KEYS.map(key => world.statDisplayNames?.[key] || key);
  const tiers = world.realmSystem?.tiers;
  const realmName = world.realmSystem?.mainRealmName || '境界';
  const hasDangers = world.dangers.length > 0;
  const hasOpportunities = world.opportunities.length > 0;

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden',
        'border-2 transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        visualConfig.borderColor,
      )}
      style={{ animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both` }}
    >
      {/* ===== 四角隅饰 ===== */}
      {(['top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
         'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
         'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
         'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
       ] as const).map((pos, i) => (
        <span key={i} className={cn(
          'absolute w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition-opacity',
          pos, visualConfig.borderColor,
        )} aria-hidden="true" />
      ))}

      {/* ===== 渐变背景 ===== */}
      <div className={cn(
        'absolute inset-0 bg-linear-to-br opacity-12 group-hover:opacity-25 transition-opacity',
        visualConfig.gradientClass,
      )} />

      <CardContent className="p-3 flex flex-col flex-1 relative gap-2.5">
        {/* ===== 头部：图标 + 名称 + 简介 ===== */}
        <div className="flex items-start gap-2.5">
          <div className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5',
            'bg-muted/30 border border-border/40',
            'group-hover:scale-110 transition-transform',
          )}>
            <span className="text-lg leading-none" aria-hidden="true">{visualConfig.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground font-serif tracking-wide truncate">
              {world.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
              {world.description}
            </p>
          </div>
        </div>

        {/* ===== 难度 + 类型标签 ===== */}
        <DifficultyMeter difficulty={world.difficulty} />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 text-xs font-semibold font-serif',
            'rounded border-2 tracking-wider',
            visualConfig.accentColor, visualConfig.borderColor,
          )}>
            {world.type}
          </span>
          {world.baseCoefficient <= 1.0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border border-emerald-400/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/8">
              <Zap className="w-3 h-3" />新手友好
            </span>
          )}
          {world.baseCoefficient >= 1.5 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border border-red-400/40 text-red-600 dark:text-red-400 bg-red-500/8">
              <Flame className="w-3 h-3" />高难挑战
            </span>
          )}
        </div>

        {/* ===== 属性芯片（纯标签） ===== */}
        <div className="space-y-1.5">
          <SectionLabel icon={<Sparkles className="w-3 h-3" />} label="天地属性" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {statLabels.map((label, i) => (
              <StatBadge key={label} label={label} index={i} />
            ))}
          </div>
        </div>

        {/* ===== 境界体系 ===== */}
        {tiers && tiers.length > 0 && (
          <div className="space-y-1.5">
            <SectionLabel icon={<Gem className="w-3 h-3" />} label={`${realmName}体系`} />
            <div className="flex items-center gap-0.5 flex-wrap">
              {tiers.slice(0, 6).map((tier, i) => (
                <div key={i} className="flex items-center">
                  <span className="px-1.5 py-0.5 rounded text-xs font-serif bg-muted/30 border border-border/30 text-foreground/70">
                    {tier.name}
                  </span>
                  {i < Math.min(tiers.length, 6) - 1 && (
                    <span className="text-[10px] text-muted-foreground/30 mx-0.5">▸</span>
                  )}
                </div>
              ))}
              {tiers.length > 6 && (
                <span className="text-xs text-muted-foreground/60 font-serif">+{tiers.length - 6}</span>
              )}
            </div>
          </div>
        )}

        {/* ===== 势力（单行截断） ===== */}
        {world.majorForces && (
          <div className="space-y-1">
            <SectionLabel icon={<Sword className="w-3 h-3" />} label="主要势力" />
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 font-serif">
              {world.majorForces}
            </p>
          </div>
        )}

        {/* ===== 危险 / 机缘（摘要标签） ===== */}
        {(hasDangers || hasOpportunities) && (
          <div className="flex items-center gap-3">
            {hasDangers && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs cursor-help text-destructive/80 hover:text-destructive transition-colors">
                    <Skull className="w-3 h-3" />
                    危险 ×{world.dangers.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] p-2">
                  <div className="space-y-1">
                    {world.dangers.slice(0, 3).map((d, i) => (
                      <div key={i} className="text-xs text-destructive">{d.name}</div>
                    ))}
                    {world.dangers.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">…等 {world.dangers.length} 项</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {hasOpportunities && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs cursor-help text-emerald-600 dark:text-emerald-400/80 hover:text-emerald-500 transition-colors">
                    <Sparkles className="w-3 h-3" />
                    机缘 ×{world.opportunities.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] p-2">
                  <div className="space-y-1">
                    {world.opportunities.slice(0, 3).map((o, i) => (
                      <div key={i} className="text-xs text-emerald-600 dark:text-emerald-400">{o.name}</div>
                    ))}
                    {world.opportunities.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">…等 {world.opportunities.length} 项</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* ===== 踏入按钮 ===== */}
        <Button
          onClick={handleSelect}
          className="w-full font-serif tracking-[0.15em] text-sm h-8 mt-auto"
          size="sm"
        >
          <Sword className="w-3.5 h-3.5 mr-1.5 opacity-70" />
          踏入此界
        </Button>
      </CardContent>
    </Card>
  );
}
