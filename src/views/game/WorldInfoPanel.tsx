'use client';

import { 
  Globe, 
  Building2, 
  Zap,
  AlertTriangle,
  Shield,
  Swords,
  Sparkles,
  Target,
  Star,
  Skull
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Separator } from '@/shared/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  formatDanger,
  formatOpportunity,
  getDangerLevelStyle,
  getOpportunityLevelStyle,
  generateLevelStars,
} from '@/modules/identity/data/worldEffectsUtils';
import { World, Protagonist, WorldType, WorldDifficulty } from '@/shared/lib/types';
import { cn } from '@/shared/utils';

// 世界类型颜色配置 - 与个人信息面板风格一致
const worldTypeConfig: Record<WorldType, { 
  bg: string; 
  border: string; 
  text: string; 
  icon: typeof Globe;
}> = {
  '修仙': { 
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', 
    border: 'border-amber-200/50 dark:border-amber-800/50', 
    text: 'text-amber-600 dark:text-amber-400',
    icon: Sparkles
  },
  '高武': { 
    bg: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30', 
    border: 'border-red-200/50 dark:border-red-800/50', 
    text: 'text-red-600 dark:text-red-400',
    icon: Swords
  },
  '科技': { 
    bg: 'bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30', 
    border: 'border-slate-200/50 dark:border-slate-800/50', 
    text: 'text-slate-600 dark:text-slate-400',
    icon: Globe
  },
  '魔幻': { 
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30', 
    border: 'border-purple-200/50 dark:border-purple-800/50', 
    text: 'text-purple-600 dark:text-purple-400',
    icon: Zap
  },
  '异能': { 
    bg: 'bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30', 
    border: 'border-cyan-200/50 dark:border-cyan-800/50', 
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: Zap
  },
  '仙侠': { 
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30', 
    border: 'border-emerald-200/50 dark:border-emerald-800/50', 
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: Sparkles
  },
  '武侠': { 
    bg: 'bg-gradient-to-br from-stone-50 to-neutral-50 dark:from-stone-950/30 dark:to-neutral-950/30', 
    border: 'border-stone-200/50 dark:border-stone-800/50', 
    text: 'text-stone-600 dark:text-stone-400',
    icon: Swords
  },
  '末世': { 
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30', 
    border: 'border-gray-200/50 dark:border-gray-800/50', 
    text: 'text-gray-600 dark:text-gray-400',
    icon: Shield
  },
};

// 难度配置
const DIFFICULTY_CONFIG: Record<WorldDifficulty, { color: string; bg: string; text: string }> = {
  '简单': { color: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  '普通': { color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  '困难': { color: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  '噩梦': { color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  '地狱': { color: 'bg-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  '深渊': { color: 'bg-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
};

interface WorldInfoPanelProps {
  world: World;
  protagonist?: Protagonist;
}

export function WorldInfoPanel({ world, protagonist }: WorldInfoPanelProps) {
  const typeConfig = worldTypeConfig[world.type];
  const difficultyConfig = DIFFICULTY_CONFIG[world.difficulty];
  const TypeIcon = typeConfig.icon;
  
  // 计算世界进度
  const worldProgress = protagonist?.level 
    ? Math.min(100, (protagonist.level / 100) * 100)
    : 0;
  
  // 获取当前境界索引
  const currentRealmIndex = world.realmSystem.tiers.findIndex(
    tier => protagonist?.level && 
      protagonist.level >= tier.levelRange[0] && 
      protagonist.level <= tier.levelRange[1]
  );

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="font-medium">{world.name}</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">{world.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 世界类型卡片 - 类似属性展示 */}
        <div className={`p-2 rounded-lg ${typeConfig.bg} border ${typeConfig.border}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <TypeIcon className={`w-4 h-4 ${typeConfig.text}`} />
              <span className="text-xs font-medium">{world.type}世界</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] ${difficultyConfig.bg} ${difficultyConfig.text}`}>
                {world.difficulty}
              </Badge>
              <span className={`text-sm font-bold ${typeConfig.text}`}>
                ×{(world.actualCoefficient ?? 1.0).toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{world.description}</p>
        </div>

        <Separator />

        {/* 境界体系 - 横向卡片展示 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>境界体系</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {world.realmSystem.tiers.map((tier, idx) => {
              const isCurrentRealm = currentRealmIndex === idx;
              const isPassed = currentRealmIndex > idx;
              return (
                <Badge 
                  key={idx}
                  variant={isCurrentRealm ? "default" : isPassed ? "secondary" : "outline"}
                  className={cn(
                    "text-[9px] py-0 px-1.5 h-4",
                    isCurrentRealm && "bg-primary text-primary-foreground",
                    isPassed && "bg-muted text-muted-foreground"
                  )}
                >
                  {tier.name}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 主要势力 - 横向展示 */}
        {world.factions && world.factions.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Building2 className="w-3 h-3 text-blue-500" />
              <span>主要势力</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {world.factions.slice(0, 4).map((faction, index) => (
                <Badge 
                  key={faction.id || index}
                  variant="outline" 
                  className="text-[9px] py-0 px-1.5 h-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400"
                >
                  {faction.name}
                </Badge>
              ))}
              {world.factions.length > 4 && (
                <span className="text-[9px] text-muted-foreground">+{world.factions.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* 危险与机缘 - 两列展示详细信息 */}
        <div className="grid grid-cols-2 gap-2">
          {/* 危险列 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[9px] text-red-600 dark:text-red-400 font-medium">
              <Skull className="w-2.5 h-2.5" />
              <span>危险</span>
            </div>
            {world.dangers.length > 0 ? (
              <div className="space-y-0.5">
                {world.dangers.slice(0, 2).map((danger, idx) => {
                  const info = formatDanger(danger);
                  const style = getDangerLevelStyle(info.level);
                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className="p-1 rounded bg-red-50/50 dark:bg-red-950/20 cursor-help">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-medium text-red-700 dark:text-red-400 truncate">
                              {info.name}
                            </span>
                            <span className={`text-[8px] ${style.stars} shrink-0`}>
                              {generateLevelStars(info.level)}
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] p-1.5 text-[10px]">
                        <div className="font-medium text-red-600 dark:text-red-400">{info.name}</div>
                        <div className="text-muted-foreground mt-0.5">{info.description}</div>
                        {info.effects.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-red-600/80 dark:text-red-400/80">
                            {info.effects.map((e, i) => <div key={i}>• {e}</div>)}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {world.dangers.length > 2 && (
                  <span className="text-[8px] text-muted-foreground">+{world.dangers.length - 2}</span>
                )}
              </div>
            ) : (
              <p className="text-[9px] text-muted-foreground">暂无危险</p>
            )}
          </div>
          
          {/* 机缘列 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Star className="w-2.5 h-2.5" />
              <span>机缘</span>
            </div>
            {world.opportunities.length > 0 ? (
              <div className="space-y-0.5">
                {world.opportunities.slice(0, 2).map((opportunity, idx) => {
                  const info = formatOpportunity(opportunity);
                  const style = getOpportunityLevelStyle(info.level);
                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className="p-1 rounded bg-emerald-50/50 dark:bg-emerald-950/20 cursor-help">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                              {info.name}
                            </span>
                            <span className={`text-[8px] ${style.stars} shrink-0`}>
                              {generateLevelStars(info.level)}
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] p-1.5 text-[10px]">
                        <div className="font-medium text-emerald-600 dark:text-emerald-400">{info.name}</div>
                        <div className="text-muted-foreground mt-0.5">{info.description}</div>
                        {info.effects.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-emerald-600/80 dark:text-emerald-400/80">
                            {info.effects.map((e, i) => <div key={i}>• {e}</div>)}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {world.opportunities.length > 2 && (
                  <span className="text-[8px] text-muted-foreground">+{world.opportunities.length - 2}</span>
                )}
              </div>
            ) : (
              <p className="text-[9px] text-muted-foreground">暂无机缘</p>
            )}
          </div>
        </div>
        
        {/* 玩家进度 */}
        {protagonist && (
          <>
            <Separator />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  当前: <span className="font-medium text-foreground">{protagonist.realm}</span>
                </span>
                <span className="text-muted-foreground">
                  Lv.{protagonist.level} · {worldProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={worldProgress} className="h-1" />
            </div>
            
            {/* 满级提示 */}
            {protagonist.level === 100 && (
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-[10px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>已达巅峰，可挑战天道前往新世界</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
