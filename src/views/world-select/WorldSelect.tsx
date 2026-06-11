'use client';

import { Compass, Skull, Sparkles, Sword } from 'lucide-react';

import type { World, WorldDifficulty } from '@/core/types';
import { STAT_KEYS } from '@/modules/identity/data/statDisplayNames';
import {
  generateLevelStars,
} from '@/modules/identity/data/worldEffectsUtils';
import { RealmTable } from '@/shared/components';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { cn } from '@/shared/utils';

interface WorldSelectProps {
  worlds: World[];
  onSelect: (world: World) => void;
}

// 难度样式
const difficultyStyles: Record<WorldDifficulty, { badge: string }> = {
  '简单': { badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  '普通': { badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  '困难': { badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  '噩梦': { badge: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  '地狱': { badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  '深渊': { badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
};

export function WorldSelect({ worlds, onSelect }: WorldSelectProps) {
  return (
    <div className="min-h-dvh md:min-h-screen bg-background flex items-center justify-center">
      <div className="relative w-full max-w-7xl mx-auto p-4 md:p-8">
        {/* 标题区 */}
        <div className="text-center mb-4" style={{ animation: 'fade-in-up 0.6s ease-out forwards' }}>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Compass className="w-5 h-5 text-primary/50" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif tracking-[0.1em]">
              万象星盘 · 择一方天地
            </h1>
            <Compass className="w-5 h-5 text-primary/50" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
          </div>
          <p className="text-muted-foreground text-xs tracking-wide">
            星辰流转，命运之轮已开始转动…选择你将降临的世界
          </p>
        </div>

        {/* 世界网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {worlds.map((world, index) => {
            const visualConfig = world.visualConfig;

            return (
              <Card
                key={world.id}
                className={cn(
                  'border-2 flex flex-col relative overflow-hidden',
                  'hover:shadow-md hover:scale-[1.01] transition-all duration-300',
                  visualConfig.borderColor,
                )}
                style={{ animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both` }}
              >
                {/* 世界类型渐变背景 */}
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none', visualConfig.gradientClass)} />

                <CardContent className="p-3 flex flex-col flex-1 relative gap-2">
                  {/* 头部：图标 + 名称 + 类型 + 难度 + 标记 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-lg shrink-0" aria-hidden="true">{visualConfig.icon}</span>
                    <h3 className="text-sm font-bold text-foreground font-serif truncate">{world.name}</h3>
                    <Badge variant="outline" className={cn('text-[9px] shrink-0', difficultyStyles[world.difficulty].badge)}>
                      {world.difficulty}
                    </Badge>
                    <Badge className={cn('text-[9px] shrink-0', visualConfig.accentColor, visualConfig.borderColor.replace('border', 'bg').replace('/30', '/15'))}>
                      {world.type}
                    </Badge>
                    {world.baseCoefficient <= 1.0 && (
                      <Badge className="text-[9px] shrink-0 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">新手</Badge>
                    )}
                    {world.baseCoefficient >= 1.5 && (
                      <Badge className="text-[9px] shrink-0 bg-red-500/15 text-red-600 border-red-500/30">挑战</Badge>
                    )}
                  </div>

                  {/* 描述 */}
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {world.description}
                  </p>

                  {/* 属性体系 — 紧凑单行 */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] text-muted-foreground/60 shrink-0">属性：</span>
                    {STAT_KEYS.map((key) => (
                      <span key={key} className="text-[9px] px-1 py-0.5 rounded bg-muted/50 text-foreground/70">
                        {world.statDisplayNames?.[key] || key}
                      </span>
                    ))}
                  </div>

                  {/* 境界体系 — 紧凑 */}
                  {world.realmSystem && (
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      <RealmTable realmSystem={world.realmSystem} compact />
                    </div>
                  )}

                  {/* 势力 — 一行截断 */}
                  {world.majorForces && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      <span className="text-muted-foreground/50">势力：</span>
                      {world.majorForces}
                    </div>
                  )}

                  {/* 危险 — 一行三个 */}
                  {world.dangers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Skull className="w-3 h-3 text-destructive/70" />
                        <span className="text-[9px] text-destructive/70 font-medium">危险</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {world.dangers.map((d, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-destructive/5 cursor-help">
                                <span className="text-[9px] text-destructive/80 truncate">{d.name}</span>
                                <span className="text-[8px] text-destructive/40 shrink-0">{generateLevelStars(d.dangerLevel)}</span>
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

                  {/* 机缘 — 一行三个 */}
                  {world.opportunities.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3 text-emerald-500/70" />
                        <span className="text-[9px] text-emerald-500/70 font-medium">机缘</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {world.opportunities.map((o, i) => (
                          <div key={i} className="px-1 py-0.5 rounded bg-emerald-500/5">
                            <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 truncate block">{o.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 确认按钮 */}
                  <Button
                    className="w-full font-serif tracking-wide mt-auto text-xs h-8"
                    size="sm"
                    onClick={() => onSelect(world)}
                  >
                    <Sword className="w-3 h-3 mr-1" />
                    踏入此界
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
