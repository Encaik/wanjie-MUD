'use client';

import { Skull, Sparkles, Star, Info } from 'lucide-react';

import { RealmTable } from '@/components/game/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  formatDanger,
  formatOpportunity,
  getDangerLevelStyle,
  getOpportunityLevelStyle,
  generateLevelStars,
} from '@/lib/data/worldEffectsUtils';
import { World, WorldType, WorldDifficulty } from '@/lib/game/types';
import { cn } from '@/utils';

interface WorldSelectProps {
  worlds: World[];
  onSelect: (world: World) => void;
}

// 世界类型颜色
const worldTypeColors: Record<WorldType, { bg: string; border: string; text: string }> = {
  '修仙': { bg: 'bg-primary/10', border: 'hover:border-primary/50', text: 'text-primary' },
  '高武': { bg: 'bg-destructive/10', border: 'hover:border-destructive/50', text: 'text-destructive' },
  '科技': { bg: 'bg-secondary/30', border: 'hover:border-secondary/50', text: 'text-secondary-foreground' },
  '魔幻': { bg: 'bg-accent/20', border: 'hover:border-accent/50', text: 'text-accent-foreground' },
  '异能': { bg: 'bg-primary/15', border: 'hover:border-primary/60', text: 'text-primary' },
  '仙侠': { bg: 'bg-accent/25', border: 'hover:border-accent/60', text: 'text-accent-foreground' },
  '武侠': { bg: 'bg-muted/50', border: 'hover:border-muted-foreground/50', text: 'text-muted-foreground' },
  '末世': { bg: 'bg-destructive/15', border: 'hover:border-destructive/60', text: 'text-destructive' },
};

// 难度样式
const difficultyStyles: Record<WorldDifficulty, { badge: string }> = {
  '简单': {
    badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  },
  '普通': {
    badge: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  '困难': {
    badge: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  },
  '噩梦': {
    badge: 'bg-red-500/15 text-red-600 border-red-500/30',
  },
  '地狱': {
    badge: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  },
  '深渊': {
    badge: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  },
};

export function WorldSelect({ worlds, onSelect }: WorldSelectProps) {
  return (
    <div className="min-h-dvh md:min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">选择你的世界</h1>
          <p className="text-muted-foreground text-sm">万界宇宙，命运将你带向何方</p>
          
          {/* 难度图例 */}
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap mt-4">
            <span className="text-muted-foreground">难度：</span>
            {(['简单', '普通', '困难', '噩梦', '地狱', '深渊'] as WorldDifficulty[]).map((diff) => (
              <Badge key={diff} variant="outline" className={cn("text-xs", difficultyStyles[diff].badge)}>
                {diff}
              </Badge>
            ))}
          </div>
        </div>

        {/* 世界网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {worlds.map((world) => {
            const colors = worldTypeColors[world.type];
            
            return (
              <Card 
                key={world.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 border",
                  colors.border,
                  "hover:shadow-md flex flex-col"
                )}
                onClick={() => onSelect(world)}
              >
                <CardContent className="p-4 flex flex-col flex-1">
                  {/* 头部：世界名称 + 类型 + 难度 - 固定高度 */}
                  <div className="flex items-center justify-between min-h-[28px]">
                    <h3 className="text-base font-semibold text-foreground">{world.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn("text-xs", colors.bg, colors.text)}>
                        {world.type}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", difficultyStyles[world.difficulty].badge)}>
                        {world.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* 世界描述 - 固定高度（2行） */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px] mt-2">
                    {world.description}
                  </p>

                  {/* 境界体系 - 统一高度 */}
                  <div className="bg-muted/30 rounded-md p-2 mt-3 min-h-[52px]">
                    <div className="text-xs text-foreground/80 font-medium">境界体系</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <RealmTable realmSystem={world.realmSystem} compact />
                    </div>
                  </div>

                  {/* 主要势力 - 统一高度 */}
                  <div className="bg-muted/30 rounded-md p-2 mt-2 min-h-[52px]">
                    <div className="text-xs text-foreground/80 font-medium">主要势力</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{world.majorForces}</div>
                  </div>

                  {/* 危险 - 显示详细信息 */}
                  <div className="mt-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Skull className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">危险</span>
                    </div>
                    {world.dangers.length > 0 ? (
                      <div className="space-y-1">
                        {world.dangers.slice(0, 2).map((danger, idx) => {
                          const info = formatDanger(danger);
                          const style = getDangerLevelStyle(info.level);
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 p-1 rounded bg-red-50/50 dark:bg-red-950/20 cursor-help">
                                  <span className="text-[10px] font-medium text-red-700 dark:text-red-400 truncate flex-1">
                                    {info.name}
                                  </span>
                                  <span className={`text-[9px] ${style.stars}`}>
                                    {generateLevelStars(info.level)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs p-2 bg-popover text-popover-foreground border border-red-200 dark:border-red-800">
                                <div className="space-y-1.5">
                                  <div className="font-medium text-red-600 dark:text-red-400">{info.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{info.description}</div>
                                  <div className="text-[10px] space-y-0.5">
                                    <div className="text-muted-foreground">类型: {info.type}</div>
                                    {info.effects.length > 0 && (
                                      <div className="text-red-600 dark:text-red-400">
                                        {info.effects.map((e, i) => <div key={i}>• {e}</div>)}
                                      </div>
                                    )}
                                    <div className="text-muted-foreground">触发: {info.trigger}</div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {world.dangers.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{world.dangers.length - 2} 个危险
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">暂无危险</p>
                    )}
                  </div>

                  {/* 机缘 - 显示详细信息 */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-500 font-medium">机缘</span>
                    </div>
                    {world.opportunities.length > 0 ? (
                      <div className="space-y-1">
                        {world.opportunities.slice(0, 2).map((opportunity, idx) => {
                          const info = formatOpportunity(opportunity);
                          const style = getOpportunityLevelStyle(info.level);
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 p-1 rounded bg-emerald-50/50 dark:bg-emerald-950/20 cursor-help">
                                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate flex-1">
                                    {info.name}
                                  </span>
                                  <span className={`text-[9px] ${style.stars}`}>
                                    {generateLevelStars(info.level)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs p-2 bg-popover text-popover-foreground border border-emerald-200 dark:border-emerald-800">
                                <div className="space-y-1.5">
                                  <div className="font-medium text-emerald-600 dark:text-emerald-400">{info.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{info.description}</div>
                                  <div className="text-[10px] space-y-0.5">
                                    <div className="text-muted-foreground">类型: {info.type}</div>
                                    {info.effects.length > 0 && (
                                      <div className="text-emerald-600 dark:text-emerald-400">
                                        {info.effects.map((e, i) => <div key={i}>• {e}</div>)}
                                      </div>
                                    )}
                                    <div className="text-muted-foreground">触发: {info.trigger}</div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {world.opportunities.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{world.opportunities.length - 2} 个机缘
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">暂无机缘</p>
                    )}
                  </div>

                  {/* 难度系数 - 固定在底部 */}
                  <div className="border-t border-border pt-2 mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">难度系数</span>
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        (world.actualCoefficient ?? 1.0) >= 3.0 ? "text-purple-500" :
                        (world.actualCoefficient ?? 1.0) >= 2.5 ? "text-red-500" :
                        (world.actualCoefficient ?? 1.0) >= 2.0 ? "text-amber-500" :
                        (world.actualCoefficient ?? 1.0) >= 1.5 ? "text-blue-500" : "text-emerald-500"
                      )}>
                        {(world.actualCoefficient ?? 1.0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
