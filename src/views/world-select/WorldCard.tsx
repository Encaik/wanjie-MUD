'use client';

import { Skull, Sparkles, Sword } from 'lucide-react';

import type { World, WorldDifficulty } from '@/core/types';
import { STAT_KEYS } from '@/modules/identity/data/statDisplayNames';
import { generateLevelStars } from '@/modules/identity/data/worldEffectsUtils';
import { RealmTable } from '@/shared/components';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/shared/utils';

interface WorldCardProps {
  world: World;
  index: number;
  onSelect: (world: World) => void;
}

// ============================================
// 难度样式
// ============================================

/** 难度星级映射 */
const DIFFICULTY_STARS: Record<WorldDifficulty, string> = {
  '简单': '⭐',
  '普通': '⭐⭐',
  '困难': '⭐⭐⭐',
  '噩梦': '⭐⭐⭐⭐',
  '地狱': '⭐⭐⭐⭐⭐',
  '深渊': '⭐⭐⭐⭐⭐⭐',
};

/** 印章 Badge 颜色 */
const SEAL_COLORS: Record<WorldDifficulty, string> = {
  '简单': 'border-emerald-400/50 text-emerald-600 dark:text-emerald-400',
  '普通': 'border-blue-400/50 text-blue-600 dark:text-blue-400',
  '困难': 'border-amber-400/50 text-amber-600 dark:text-amber-400',
  '噩梦': 'border-red-400/50 text-red-600 dark:text-red-400',
  '深渊': 'border-orange-400/50 text-orange-600 dark:text-orange-400',
  '地狱': 'border-purple-400/50 text-purple-600 dark:text-purple-400',
};

// ============================================
// 组件
// ============================================

/**
 * 世界卡片 — 星盘碎片
 *
 * 每个世界卡片是一块"星盘碎片"，包含：
 * - 四角隅饰（CSS 边框几何形）
 * - 世界图标作为视觉锚点（3rem）
 * - 印章风格 Badge（难度/类型）
 * - 装饰性分隔线
 * - hover 金边辉光 + 微浮
 */
export function WorldCard({ world, index, onSelect }: WorldCardProps) {
  const visualConfig = world.visualConfig;

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden cursor-pointer',
        'border-2 transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        visualConfig.borderColor,
      )}
      style={{
        animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both`,
      }}
      onClick={() => onSelect(world)}
    >
      {/* ===== 四角隅饰 ===== */}
      <span
        className={cn(
          'absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm',
          'opacity-50 transition-opacity group-hover:opacity-80',
          visualConfig.borderColor.replace('border', 'border-t').replace('/30', '/50'),
        )}
        style={{ borderLeftColor: 'inherit' }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-sm',
          'opacity-50 transition-opacity group-hover:opacity-80',
          visualConfig.borderColor.replace('border', 'border-t').replace('/30', '/50'),
        )}
        style={{ borderRightColor: 'inherit' }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-sm',
          'opacity-50 transition-opacity group-hover:opacity-80',
          visualConfig.borderColor.replace('border', 'border-b').replace('/30', '/50'),
        )}
        style={{ borderLeftColor: 'inherit' }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-sm',
          'opacity-50 transition-opacity group-hover:opacity-80',
          visualConfig.borderColor.replace('border', 'border-b').replace('/30', '/50'),
        )}
        style={{ borderRightColor: 'inherit' }}
        aria-hidden="true"
      />

      {/* ===== 世界观渐变背景 ===== */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-25 transition-opacity duration-300',
          'group-hover:opacity-40',
          visualConfig.gradientClass,
        )}
      />

      <CardContent className="p-4 flex flex-col flex-1 relative gap-3">
        {/* ===== 世界图标（视觉锚点） ===== */}
        <div className="flex justify-center">
          <span
            className={cn(
              'text-[2.5rem] leading-none transition-transform duration-300',
              'group-hover:scale-110',
            )}
            aria-hidden="true"
          >
            {visualConfig.icon}
          </span>
        </div>

        {/* ===== 世界名 + 装饰分隔线 ===== */}
        <div className="text-center space-y-1.5">
          <h3 className="text-base font-bold text-foreground font-serif tracking-[0.1em] truncate">
            {world.name}
          </h3>
          <div className="flex items-center gap-2 justify-center">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <span className="text-[10px] text-muted-foreground/30 tracking-widest select-none">
              ◆ ◇ ◆
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>
        </div>

        {/* ===== 描述 ===== */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 text-center">
          {world.description}
        </p>

        {/* ===== 印章 Badge 行 ===== */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {/* 难度印章 */}
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-serif',
              'border-[1.5px] rounded-sm -rotate-1 tracking-wider',
              SEAL_COLORS[world.difficulty],
            )}
          >
            {DIFFICULTY_STARS[world.difficulty]}
          </span>
          {/* 类型印章 */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 text-[10px] font-serif',
              'border-[1.5px] rounded-sm rotate-1 tracking-wider',
              visualConfig.accentColor,
              visualConfig.borderColor,
            )}
          >
            {world.type}
          </span>
          {/* 新手/挑战标记 */}
          {world.baseCoefficient <= 1.0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-serif border-[1.5px] rounded-sm border-emerald-400/50 text-emerald-600 dark:text-emerald-400 rotate-1">
              新手
            </span>
          )}
          {world.baseCoefficient >= 1.5 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-serif border-[1.5px] rounded-sm border-red-400/50 text-red-600 dark:text-red-400 -rotate-1">
              挑战
            </span>
          )}
        </div>

        {/* ===== 属性体系 ===== */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {STAT_KEYS.map((key) => (
            <span
              key={key}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-foreground/60 font-serif"
            >
              {world.statDisplayNames?.[key] || key}
            </span>
          ))}
        </div>

        {/* ===== 境界体系 ===== */}
        {world.realmSystem && (
          <div className="text-[10px] text-muted-foreground leading-tight text-center">
            <RealmTable realmSystem={world.realmSystem} compact />
          </div>
        )}

        {/* ===== 势力 ===== */}
        {world.majorForces && (
          <div className="text-[10px] text-muted-foreground truncate text-center">
            <span className="text-muted-foreground/50">势力：</span>
            {world.majorForces}
          </div>
        )}

        {/* ===== 危险 & 机缘（并排） ===== */}
        <div className="grid grid-cols-2 gap-2">
          {/* 危险 */}
          {world.dangers.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Skull className="w-3 h-3 text-destructive/60" />
                <span className="text-[10px] text-destructive/60 font-medium font-serif">危险</span>
              </div>
              <div className="space-y-0.5">
                {world.dangers.slice(0, 3).map((d, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/5 cursor-help">
                        <span className="text-[10px] text-destructive/80 truncate flex-1">{d.name}</span>
                        <span className="text-[8px] text-destructive/40 shrink-0">
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
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-500/60" />
                <span className="text-[10px] text-emerald-500/60 font-medium font-serif">机缘</span>
              </div>
              <div className="space-y-0.5">
                {world.opportunities.slice(0, 3).map((o, i) => (
                  <div key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate block">
                      {o.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== 踏入按钮 ===== */}
        <Button
          className={cn(
            'w-full font-serif tracking-[0.15em] text-xs h-9 mt-auto',
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
