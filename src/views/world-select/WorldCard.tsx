'use client';

import { Flame, Gem, Skull, Sparkles, Sword, Zap } from 'lucide-react';

import type { World, WorldDifficulty } from '@/core/types';
import { STAT_KEYS } from '@/modules/identity/data/statDisplayNames';
import { generateLevelStars } from '@/modules/identity/data/worldEffectsUtils';
import { RealmTable } from '@/shared/components';
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
// 难度配置
// ============================================

/** 难度等级元数据 */
const DIFFICULTY_META: Record<WorldDifficulty, {
  level: number;
  label: string;
  icon: typeof Flame;
  barColor: string;
  textColor: string;
  bgColor: string;
  glowColor: string;
}> = {
  '简单': { level: 1, label: '简单', icon: Flame, barColor: 'bg-emerald-400',  textColor: 'text-emerald-600 dark:text-emerald-400',   bgColor: 'bg-emerald-500/10',  glowColor: 'shadow-emerald-400/20' },
  '普通': { level: 2, label: '普通', icon: Flame, barColor: 'bg-sky-400',     textColor: 'text-sky-600 dark:text-sky-400',           bgColor: 'bg-sky-500/10',     glowColor: 'shadow-sky-400/20' },
  '困难': { level: 3, label: '困难', icon: Flame, barColor: 'bg-amber-400',   textColor: 'text-amber-600 dark:text-amber-400',       bgColor: 'bg-amber-500/10',   glowColor: 'shadow-amber-400/20' },
  '噩梦': { level: 4, label: '噩梦', icon: Skull, barColor: 'bg-orange-400',  textColor: 'text-orange-600 dark:text-orange-400',     bgColor: 'bg-orange-500/10',  glowColor: 'shadow-orange-400/20' },
  '地狱': { level: 5, label: '地狱', icon: Skull, barColor: 'bg-red-400',     textColor: 'text-red-600 dark:text-red-400',           bgColor: 'bg-red-500/10',     glowColor: 'shadow-red-400/20' },
  '深渊': { level: 6, label: '深渊', icon: Skull, barColor: 'bg-purple-400',  textColor: 'text-purple-600 dark:text-purple-400',     bgColor: 'bg-purple-500/10',  glowColor: 'shadow-purple-400/20' },
};

// ============================================
// 子组件
// ============================================

/** 四角隅饰 */
function CornerOrnaments({ borderClass }: { borderClass: string }) {
  const corners = [
    'top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
    'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
    'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
    'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
  ];
  return <>
    {corners.map((pos, i) => (
      <span
        key={i}
        className={cn(
          'absolute w-4 h-4 opacity-40 transition-opacity duration-500 group-hover:opacity-80',
          pos, borderClass,
        )}
        aria-hidden="true"
      />
    ))}
  </>;
}

/** 难度计量条 — 6 段可视化难度指示器 */
function DifficultyMeter({ difficulty }: { difficulty: WorldDifficulty }) {
  const meta = DIFFICULTY_META[difficulty];
  const Icon = meta.icon;
  const maxLevel = 6;

  return (
    <div className="flex items-center gap-2">
      {/* 图标 */}
      <span className={cn('shrink-0', meta.textColor)}>
        <Icon className="w-3.5 h-3.5" />
      </span>

      {/* 分段计量条 */}
      <div className="flex-1 flex gap-[2px]">
        {Array.from({ length: maxLevel }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500',
              i < meta.level
                ? cn(meta.barColor, 'shadow-sm', meta.glowColor)
                : 'bg-muted/40',
            )}
          />
        ))}
      </div>

      {/* 文字标签 */}
      <span className={cn(
        'text-[11px] font-medium font-serif tracking-wider shrink-0',
        meta.textColor,
      )}>
        {meta.label}
      </span>
    </div>
  );
}

/** 属性芯片 — 带彩色左边框和图标首字 */
function StatChip({ label, index }: { label: string; index: number }) {
  // 属性色盘（暖色系，与修仙主题协调）
  const COLORS = [
    'border-l-amber-400/70 bg-amber-500/8 text-amber-700 dark:text-amber-300',
    'border-l-emerald-400/70 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    'border-l-blue-400/70 bg-blue-500/8 text-blue-700 dark:text-blue-300',
    'border-l-purple-400/70 bg-purple-500/8 text-purple-700 dark:text-purple-300',
    'border-l-rose-400/70 bg-rose-500/8 text-rose-700 dark:text-rose-300',
  ];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-sm',
        'border-l-[2.5px] text-[11px] font-medium font-serif',
        'transition-all duration-300',
        'hover:scale-105 hover:shadow-sm',
        COLORS[index % COLORS.length],
      )}
    >
      <span className="text-[9px] opacity-50 font-bold">{label[0]}</span>
      <span>{label}</span>
    </span>
  );
}

/** 境界链 — 水平视觉进度 */
function RealmChain({ tiers, mainName }: { tiers: Array<{ name: string; levelRange: [number, number] }>; mainName: string }) {
  if (!tiers.length) return null;

  return (
    <div className="space-y-1">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Gem className="w-3 h-3 text-amber-500/60" />
        <span className="text-[10px] text-muted-foreground/70 tracking-widest font-serif uppercase">
          {mainName}体系
        </span>
      </div>

      {/* 境界链 */}
      <div className="flex items-center gap-0 flex-wrap">
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-serif font-medium',
                'bg-linear-to-b from-muted/30 to-muted/10',
                'border border-border/40',
                'text-foreground/70',
                'transition-all duration-200 hover:text-foreground hover:border-border/60',
              )}
              title={`${tier.name} · Lv.${tier.levelRange[0]}-${tier.levelRange[1]}`}
            >
              {tier.name}
            </span>
            {i < tiers.length - 1 && (
              <span className="text-[8px] text-muted-foreground/25 mx-0.5 select-none">▸</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 区块分隔线 */
function SectionDivider() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-border/30 to-transparent" />
      <span className="w-1 h-1 rounded-full bg-border/40" />
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-border/30 to-transparent" />
    </div>
  );
}

// ============================================
// 主组件
// ============================================

/**
 * 世界卡片 — 星盘碎片
 *
 * 每个世界卡片是一块"星盘碎片"，包含：
 * - 四角隅饰（CSS 边框几何形）
 * - 世界图标作为视觉锚点
 * - 可视化难度计量条（替代抽象星星）
 * - 彩色属性芯片 + 分区标题
 * - 境界链视觉化展示
 * - 装饰性分隔线
 * - hover 金边辉光 + 微浮
 */
export function WorldCard({ world, index, onSelect }: WorldCardProps) {
  const visualConfig = world.visualConfig;
  const handleSelect = useDebounce(() => onSelect(world), 600);
  const difficultyMeta = DIFFICULTY_META[world.difficulty];

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden',
        'border-2 transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        visualConfig.borderColor,
      )}
      style={{
        animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* ===== 四角隅饰 ===== */}
      <CornerOrnaments borderClass={visualConfig.borderColor} />

      {/* ===== 世界观渐变背景 ===== */}
      <div
        className={cn(
          'absolute inset-0 bg-linear-to-br opacity-15 transition-opacity duration-500',
          'group-hover:opacity-30',
          visualConfig.gradientClass,
        )}
      />

      {/* ===== 顶部氛围光 ===== */}
      <div
        className={cn(
          'absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px',
          'bg-linear-to-r from-transparent via-border/40 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        )}
      />

      <CardContent className="p-3 flex flex-col flex-1 relative gap-2">
        {/* ===== 世界图标（视觉锚点） ===== */}
        <div className="flex justify-center">
          <div className={cn(
            'relative flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-linear-to-br from-muted/20 to-transparent',
            'border border-border/30',
            'transition-all duration-300',
            'group-hover:scale-110 group-hover:shadow-lg',
            difficultyMeta.glowColor,
          )}>
            <span
              className="text-[1.5rem] leading-none transition-transform duration-300"
              aria-hidden="true"
            >
              {visualConfig.icon}
            </span>
          </div>
        </div>

        {/* ===== 世界名 ===== */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-foreground font-serif tracking-[0.12em]">
            {world.name}
          </h3>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">
            {world.description}
          </p>
        </div>

        <SectionDivider />

        {/* ===== 难度计量条 ===== */}
        <DifficultyMeter difficulty={world.difficulty} />

        {/* ===== 类型 + 标签行 ===== */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 世界类型 */}
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 text-[10px] font-serif font-medium',
              'rounded-sm border-[1.5px] tracking-wider',
              visualConfig.accentColor,
              visualConfig.borderColor,
            )}
          >
            {world.type}
          </span>
          {/* 新手标记 */}
          {world.baseCoefficient <= 1.0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-serif rounded-sm border-[1.5px] border-emerald-400/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
              <Zap className="w-2.5 h-2.5" />
              新手友好
            </span>
          )}
          {/* 挑战标记 */}
          {world.baseCoefficient >= 1.5 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-serif rounded-sm border-[1.5px] border-red-400/40 text-red-600 dark:text-red-400 bg-red-500/5">
              <Flame className="w-2.5 h-2.5" />
              高难挑战
            </span>
          )}
        </div>

        {/* ===== 属性体系 ===== */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-500/60" />
            <span className="text-[10px] text-muted-foreground/70 tracking-widest font-serif uppercase">
              天地属性
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STAT_KEYS.map((key, i) => (
              <StatChip
                key={key}
                label={world.statDisplayNames?.[key] || key}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* ===== 境界体系 ===== */}
        {world.realmSystem && world.realmSystem.tiers && (
          <RealmChain
            tiers={world.realmSystem.tiers}
            mainName={world.realmSystem.mainRealmName || '境界'}
          />
        )}

        {/* ===== 势力 ===== */}
        {world.majorForces && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sword className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/70 tracking-widest font-serif uppercase">
                主要势力
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-serif pl-5">
              {world.majorForces}
            </p>
          </div>
        )}

        {/* ===== 危险 & 机缘 ===== */}
        {(world.dangers.length > 0 || world.opportunities.length > 0) && (
          <>
            <SectionDivider />
            <div className="grid grid-cols-2 gap-2">
              {/* 危险 */}
              {world.dangers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Skull className="w-3 h-3 text-destructive/60" />
                    <span className="text-[10px] text-destructive/60 font-medium font-serif tracking-wider">
                      危险
                    </span>
                    <span className="text-[9px] text-destructive/30 font-serif">
                      {world.dangers.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {world.dangers.slice(0, 2).map((d, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-sm cursor-help',
                            'bg-destructive/5 border border-destructive/10',
                            'transition-all duration-200 hover:bg-destructive/10',
                          )}>
                            <span className="text-[10px] text-destructive/80 truncate flex-1 font-serif">
                              {d.name}
                            </span>
                            <span className="text-[8px] text-destructive/40 shrink-0 tracking-wider">
                              {generateLevelStars(d.dangerLevel)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] p-2">
                          <div className="font-medium text-destructive text-xs">{d.name}</div>
                          <div className="text-[10px] text-muted-foreground">{d.description}</div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* 机缘 */}
              {world.opportunities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-500/60" />
                    <span className="text-[10px] text-emerald-500/60 font-medium font-serif tracking-wider">
                      机缘
                    </span>
                    <span className="text-[9px] text-emerald-400/30 font-serif">
                      {world.opportunities.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {world.opportunities.slice(0, 2).map((o, i) => (
                      <div
                        key={i}
                        className={cn(
                          'px-2 py-1 rounded-sm',
                          'bg-emerald-500/5 border border-emerald-500/10',
                          'transition-all duration-200 hover:bg-emerald-500/10',
                        )}
                      >
                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate block font-serif">
                          {o.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== 踏入按钮 ===== */}
        <Button
          onClick={handleSelect}
          className={cn(
            'w-full font-serif tracking-[0.15em] text-xs h-8 mt-auto',
            'transition-all duration-300',
            'group-hover:shadow-md group-hover:shadow-primary/10',
          )}
          size="sm"
        >
          <Sword className="w-3.5 h-3.5 mr-1.5 opacity-70" />
          踏入此界
        </Button>
      </CardContent>
    </Card>
  );
}
