'use client';

import {
  Globe,
  Building2,
  Zap,
  AlertTriangle,
  Star,
  Skull,
  ArrowRight,
} from 'lucide-react';

import { getWorldVisualConfig } from '@/core/registry';
import type { World, Protagonist, WorldDifficulty } from '@/core/types';
import {
  formatDanger,
  formatOpportunity,
  getDangerLevelStyle,
  getOpportunityLevelStyle,
  generateLevelStars,
} from '@/modules/identity/data/worldEffectsUtils';
import { getRealmName, getNextMainRealmLevel, getMainRealmName } from '@/modules/progression/data/realmData';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Progress } from '@/shared/ui/feedback/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/overlay/tooltip';
import { cn } from '@/shared/utils';

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
  const visualConfig = getWorldVisualConfig(world.worldviewId);
  const difficultyConfig = DIFFICULTY_CONFIG[world.difficulty];

  // 世界进度
  const worldProgress = protagonist?.level
    ? Math.min(100, (protagonist.level / 100) * 100)
    : 0;

  return (
    <Card className="relative overflow-hidden">
      {/* 四角隅饰 */}
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-primary/20 rounded-tl-sm z-10" aria-hidden="true" />
      <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-primary/20 rounded-tr-sm z-10" aria-hidden="true" />
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-primary/20 rounded-bl-sm z-10" aria-hidden="true" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-primary/20 rounded-br-sm z-10" aria-hidden="true" />
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="font-medium truncate">{world.name}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">{world.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 世界类型卡片 */}
        <div className={cn('p-2 rounded-lg border', visualConfig.bgGradient, visualConfig.borderColor)}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={visualConfig.accentColor}>{visualConfig.icon}</span>
              <span className="text-xs font-medium">{world.type}世界</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-[10px]', difficultyConfig.bg, difficultyConfig.text)}>
                {world.difficulty}
              </Badge>
              <span className={cn('text-sm font-bold', visualConfig.accentColor)}>
                ×{(world.actualCoefficient ?? 1.0).toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{world.description}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* 境界体系  */}
        <RealmSection world={world} protagonist={protagonist} />

        {/* 主要势力 */}
        {world.factions && world.factions.length > 0 && (
          <FactionSection factions={world.factions} />
        )}

        {/* 危险与机缘 */}
        <DangerOpportunitySection world={world} />

        {/* 修行进度 */}
        {protagonist && (
          <ProgressSection
            world={world}
            protagonist={protagonist}
            worldProgress={worldProgress}
          />
        )}
      </CardContent>
    </Card>
  );
}

/** 境界体系展示 */
interface RealmSectionProps {
  world: World;
  protagonist?: Protagonist;
}

function RealmSection({ world, protagonist }: RealmSectionProps) {
  const currentRealm = protagonist
    ? getRealmName(world.realmSystem, protagonist.level)
    : world.realmSystem.tiers[0]?.name ?? '未知';

  const currentTierIndex = world.realmSystem.tiers.findIndex(
    tier => protagonist?.level != null
      && protagonist.level >= tier.levelRange[0]
      && protagonist.level <= tier.levelRange[1],
  );

  const currentTier = currentTierIndex >= 0 ? world.realmSystem.tiers[currentTierIndex] : null;
  const tierProgress = currentTier && protagonist
    ? Math.min(100, ((protagonist.level - currentTier.levelRange[0] + 1)
      / (currentTier.levelRange[1] - currentTier.levelRange[0] + 1)) * 100)
    : 0;

  const nextMainRealmLevel = protagonist
    ? getNextMainRealmLevel(world.realmSystem, protagonist.level) : null;
  const nextMainRealmName = nextMainRealmLevel
    ? getMainRealmName(world.realmSystem, nextMainRealmLevel) : null;
  const levelsToNext = nextMainRealmLevel && protagonist
    ? nextMainRealmLevel - protagonist.level : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Zap className="w-3 h-3 text-yellow-500" />
        <span>境界传承</span>
      </div>
      {protagonist && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span>当前：<span className="font-medium text-foreground">{currentRealm}</span></span>
            {nextMainRealmName && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                下一 <ArrowRight className="w-2.5 h-2.5" />
                <span className="font-medium text-primary">{nextMainRealmName}</span>
                {levelsToNext != null && levelsToNext > 0 && (
                  <span className="text-muted-foreground"> (还需 {levelsToNext} 级)</span>
                )}
              </span>
            )}
          </div>
          <Progress value={tierProgress} className="h-1" />
        </div>
      )}
      {/* 完整境界链 */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {world.realmSystem.tiers.map((tier, idx) => {
          const isCurrent = idx === currentTierIndex;
          const isPassed = idx < currentTierIndex;
          return (
            <span key={idx} className="flex items-center gap-0.5">
              <Badge
                variant={isCurrent ? 'default' : isPassed ? 'secondary' : 'outline'}
                className={cn(
                  'text-[9px] py-0 px-1.5 h-4',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isPassed && 'bg-muted text-muted-foreground',
                )}
              >
                {tier.name}
              </Badge>
              {idx < world.realmSystem.tiers.length - 1 && (
                <span className="text-[8px] text-border">→</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** 势力展示 */
function FactionSection({ factions }: { factions: World['factions'] }) {
  return (
    <>
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Building2 className="w-3 h-3 text-blue-500" />
          <span>天下势力（{factions.length}）</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {factions.map((faction, index) => (
            <Badge
              key={faction.id || index}
              variant="outline"
              className="text-[9px] py-0 px-1.5 h-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400"
            >
              {faction.name}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}

/** 危险与机缘两列展示 */
function DangerOpportunitySection({ world }: { world: World }) {
  return (
    <>
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      <div className="grid grid-cols-2 gap-2">
        {/* 危险列 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium">
            <Skull className="w-2.5 h-2.5" />
            <span>凶险</span>
          </div>
          {world.dangers.length > 0 ? (
            <div className="space-y-1">
              {world.dangers.map((danger, idx) => {
                const info = formatDanger(danger);
                const style = getDangerLevelStyle(info.level);
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="p-1.5 rounded bg-red-50/50 dark:bg-red-950/20 cursor-help border border-red-200/30 dark:border-red-800/30">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-medium text-red-700 dark:text-red-400 truncate">{info.name}</span>
                          <span className={cn('text-[9px] shrink-0', style.stars)}>{generateLevelStars(info.level)}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] p-1.5 text-[10px]">
                      <div className="font-medium text-red-600 dark:text-red-400">{info.name}</div>
                      <div className="text-muted-foreground mt-0.5">{info.description}</div>
                      {info.effects.map((e, i) => (
                        <div key={i} className="text-red-600/80 dark:text-red-400/80">• {e}</div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">暂无凶险</p>
          )}
        </div>

        {/* 机缘列 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Star className="w-2.5 h-2.5" />
            <span>机缘</span>
          </div>
          {world.opportunities.length > 0 ? (
            <div className="space-y-1">
              {world.opportunities.map((opportunity, idx) => {
                const info = formatOpportunity(opportunity);
                const style = getOpportunityLevelStyle(info.level);
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="p-1.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 cursor-help border border-emerald-200/30 dark:border-emerald-800/30">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">{info.name}</span>
                          <span className={cn('text-[9px] shrink-0', style.stars)}>{generateLevelStars(info.level)}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] p-1.5 text-[10px]">
                      <div className="font-medium text-emerald-600 dark:text-emerald-400">{info.name}</div>
                      <div className="text-muted-foreground mt-0.5">{info.description}</div>
                      {info.effects.map((e, i) => (
                        <div key={i} className="text-emerald-600/80 dark:text-emerald-400/80">• {e}</div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">暂无机缘</p>
          )}
        </div>
      </div>
    </>
  );
}

/** 修行进度展示 */
interface ProgressSectionProps {
  world: World;
  protagonist: Protagonist;
  worldProgress: number;
}

function ProgressSection({ world, protagonist, worldProgress }: ProgressSectionProps) {
  const nextMainRealmLevel = getNextMainRealmLevel(world.realmSystem, protagonist.level);
  const nextMainRealmName = nextMainRealmLevel
    ? getMainRealmName(world.realmSystem, nextMainRealmLevel) : null;
  const levelsToNext = nextMainRealmLevel
    ? nextMainRealmLevel - protagonist.level : null;

  return (
    <>
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">
            修行进度 <span className="font-medium text-foreground">Lv.{protagonist.level}</span>
          </span>
          <span className="text-muted-foreground">
            {worldProgress.toFixed(0)}% · {world.difficulty}
          </span>
        </div>
        <Progress value={worldProgress} className="h-1" />
        {nextMainRealmName && levelsToNext != null && levelsToNext > 0 ? (
          <p className="text-[9px] text-muted-foreground">
            下一主境界 <span className="font-medium text-primary">{nextMainRealmName}</span>（Lv.{nextMainRealmLevel}），还需 {levelsToNext} 级
          </p>
        ) : protagonist.level >= 100 && (
          <div className="flex items-center gap-1 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-[10px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>已达巅峰，可挑战天道前往新世界</span>
          </div>
        )}
      </div>
    </>
  );
}
