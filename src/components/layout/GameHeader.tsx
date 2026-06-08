'use client';

import { 
  Clock, Heart, Zap, Brain, Gem,
  Swords, Shield, Flame, Sparkles
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { CULTIVATION_PATHS, getPathLevelExp } from '@/lib/data/cultivationPathData';
import { getRealmName } from '@/lib/data/realmData';
import { getMaxExperience } from '@/lib/game/cultivation';
import { getResourceName } from '@/lib/game/items';
import { TimeSystemState, formatGameTimeShort } from '@/lib/game/timeSystem';
import { CultivationPath } from '@/lib/game/types';
import { Protagonist } from '@/lib/game/types';
import { MentalState } from '@/lib/game/typesExtension';
import { WORLD_TEXT_MAP } from '@/lib/text/WorldTextManager';
import { cn } from '@/utils';

// 流派图标和颜色
const PATH_CONFIG: Record<CultivationPath, { icon: React.ReactNode; color: string; barColor: string }> = {
  body: { icon: <Shield className="w-3 h-3" />, color: 'text-orange-500', barColor: 'bg-gradient-to-r from-orange-400 to-orange-500' },
  sword: { icon: <Swords className="w-3 h-3" />, color: 'text-cyan-500', barColor: 'bg-gradient-to-r from-cyan-400 to-cyan-500' },
  spell: { icon: <Sparkles className="w-3 h-3" />, color: 'text-blue-500', barColor: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  alchemy: { icon: <Zap className="w-3 h-3" />, color: 'text-green-500', barColor: 'bg-gradient-to-r from-green-400 to-green-500' },
  demon: { icon: <Flame className="w-3 h-3" />, color: 'text-red-500', barColor: 'bg-gradient-to-r from-red-400 to-red-500' },
};

interface GameHeaderProps {
  protagonist: Protagonist;
  actions?: React.ReactNode;
  timeSystem?: TimeSystemState | null;
  mentalState?: MentalState | null;
}

export function GameHeader({ protagonist, actions, timeSystem, mentalState }: GameHeaderProps) {
  const realmSystem = protagonist.world.realmSystem;
  const currentRealm = getRealmName(realmSystem, protagonist.level);
  const ascensionCount = protagonist.ascensionMark?.count ?? 0;
  const maxExp = getMaxExperience(protagonist.level);
  const expPercent = Math.floor((protagonist.experience / maxExp) * 100);
  
  const cultivationPath = protagonist.cultivationPath;
  const pathLevel = protagonist.pathLevel ?? 1;
  const pathExp = protagonist.pathExp ?? 0;
  const pathText = protagonist.world.type && cultivationPath 
    ? WORLD_TEXT_MAP[protagonist.world.type]?.paths?.[cultivationPath] 
    : null;
  const pathMaxExp = getPathLevelExp(pathLevel);
  const pathPercent = Math.floor((pathExp / pathMaxExp) * 100);
  
  const stability = mentalState?.stability ?? 70;
  const spiritStones = protagonist.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity ?? 0;
  const currencyName = getResourceName(protagonist.world.type);
  
  const hpPercent = Math.floor((protagonist.currentHp / protagonist.maxHp) * 100);
  const mpPercent = Math.floor((protagonist.currentMp / protagonist.maxMp) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      {/* 移动端布局（默认） */}
      <div className="flex flex-col gap-1.5 sm:hidden">
        {/* 第一行：标题 + 境界 + 灵石 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="font-bold text-sm truncate">{protagonist.character.name}</h1>
            <Badge variant="outline" className="text-[9px] shrink-0 px-1">{protagonist.world.type}</Badge>
            {timeSystem && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                <Clock className="w-2.5 h-2.5 text-amber-500" />
                <span>{formatGameTimeShort(timeSystem.gameTime)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="text-[10px] font-medium px-1.5">{currentRealm}</Badge>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              <Gem className="w-3 h-3 text-cyan-500" />
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{spiritStones.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* 第二行：HP/MP 条 */}
        <div className="flex items-center gap-2">
          <Heart className={cn("w-3 h-3 shrink-0", hpPercent > 50 ? "text-red-400" : "text-red-500")} />
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: `${hpPercent}%` }} />
          </div>
          <span className="text-[9px] font-medium tabular-nums w-12 text-right shrink-0">{protagonist.currentHp}/{protagonist.maxHp}</span>
          
          <Zap className="w-3 h-3 shrink-0 text-blue-400" />
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: `${mpPercent}%` }} />
          </div>
          <span className="text-[9px] font-medium tabular-nums w-12 text-right shrink-0">{protagonist.currentMp}/{protagonist.maxMp}</span>
        </div>
        
        {/* 第三行：经验/流派/心境 条 */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-primary shrink-0">EXP</span>
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full" style={{ width: `${expPercent}%` }} />
          </div>
          <span className="text-[9px] font-medium tabular-nums w-10 text-right shrink-0">{expPercent}%</span>
          
          {cultivationPath && (
            <>
              <span className={cn("shrink-0", PATH_CONFIG[cultivationPath].color)}>{PATH_CONFIG[cultivationPath].icon}</span>
              <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", PATH_CONFIG[cultivationPath].barColor)} style={{ width: `${pathPercent}%` }} />
              </div>
              <span className="text-[9px] font-medium w-8 shrink-0">Lv.{pathLevel}</span>
            </>
          )}
          
          <Brain className={cn(
            "w-3 h-3 shrink-0",
            stability >= 70 ? "text-purple-400" : stability >= 40 ? "text-yellow-400" : "text-red-400"
          )} />
          <div className="h-1.5 w-10 bg-muted rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full",
              stability >= 70 ? "bg-gradient-to-r from-purple-400 to-purple-500" :
              stability >= 40 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
              "bg-gradient-to-r from-red-400 to-red-500"
            )} style={{ width: `${stability}%` }} />
          </div>
          <span className={cn(
            "text-[9px] font-medium w-8 shrink-0",
            stability >= 70 ? "text-purple-500" : stability >= 40 ? "text-yellow-600" : "text-red-500"
          )}>{stability}%</span>
          
          <Badge variant="outline" className="text-[9px] px-1 shrink-0">Lv.{protagonist.level}</Badge>
          {ascensionCount > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 bg-yellow-500/10 border-yellow-500/30 text-yellow-600 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              {ascensionCount}
            </Badge>
          )}
          {actions}
        </div>
      </div>
      
      {/* 桌面端布局（sm 及以上） */}
      <div className="hidden sm:flex items-stretch gap-4 md:gap-6">
        {/* 区块1: 标题与时间 */}
        <div className="flex flex-col justify-center gap-1 shrink-0">
          <h1 className="font-bold text-base truncate">
            {protagonist.character.name}的修行之路
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate max-w-[120px]">{protagonist.world.name}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{protagonist.world.type}</Badge>
            {timeSystem && (
              <div className="flex items-center gap-1 text-[10px]">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{formatGameTimeShort(timeSystem.gameTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px bg-border" />

        {/* 区块2: 货币 */}
        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
            <Gem className="w-4 h-4 md:w-5 md:h-5 text-cyan-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">{currencyName}</span>
              <span className="text-sm md:text-base font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">{spiritStones.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px bg-border" />

        {/* 区块3: 信息条 */}
        <div className="flex-1 flex items-center gap-3 md:gap-5 min-w-0 overflow-x-auto">
          {/* HP */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center",
              "bg-gradient-to-br from-red-500/20 to-red-600/10"
            )}>
              <Heart className={cn("w-3.5 h-3.5 md:w-4 md:h-4", hpPercent > 50 ? "text-red-400" : "text-red-500")} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">生命</span>
                <span className="text-xs font-bold tabular-nums">{protagonist.currentHp}/{protagonist.maxHp}</span>
              </div>
              <div className="w-16 md:w-24 h-2 md:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all shadow-sm" 
                  style={{ width: `${hpPercent}%` }} 
                />
              </div>
            </div>
          </div>
          
          {/* MP */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-600/10">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">法力</span>
                <span className="text-xs font-bold tabular-nums">{protagonist.currentMp}/{protagonist.maxMp}</span>
              </div>
              <div className="w-16 md:w-24 h-2 md:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all shadow-sm" 
                  style={{ width: `${mpPercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* 经验 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
              <span className="text-[10px] md:text-xs font-bold text-primary">EXP</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">经验</span>
                <span className="text-xs font-bold tabular-nums">{protagonist.experience}/{maxExp}</span>
              </div>
              <div className="w-16 md:w-24 h-2 md:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all shadow-sm" 
                  style={{ width: `${expPercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* 流派 */}
          {cultivationPath && (
            <div className="flex items-center gap-2 shrink-0">
              <div className={cn(
                "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center",
                PATH_CONFIG[cultivationPath].color.replace('text-', 'bg-') + '/20'
              )}>
                <span className={PATH_CONFIG[cultivationPath].color}>{PATH_CONFIG[cultivationPath].icon}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">流派</span>
                  <span className="text-xs font-bold">{pathText?.name || CULTIVATION_PATHS[cultivationPath].name} Lv.{pathLevel}</span>
                </div>
                <div className="w-12 md:w-20 h-2 md:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={cn("h-full rounded-full transition-all shadow-sm", PATH_CONFIG[cultivationPath].barColor)} 
                    style={{ width: `${pathPercent}%` }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 心境 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center",
              stability >= 70 ? "bg-gradient-to-br from-purple-500/20 to-purple-600/10" :
              stability >= 40 ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10" :
              "bg-gradient-to-br from-red-500/20 to-red-600/10"
            )}>
              <Brain className={cn(
                "w-3.5 h-3.5 md:w-4 md:h-4",
                stability >= 70 ? "text-purple-400" : stability >= 40 ? "text-yellow-400" : "text-red-400"
              )} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">心境</span>
                <span className={cn(
                  "text-xs font-bold",
                  stability >= 70 ? "text-purple-500" : stability >= 40 ? "text-yellow-600" : "text-red-500"
                )}>
                  {stability >= 80 ? '澄明' : stability >= 60 ? '平稳' : stability >= 40 ? '动摇' : '不稳'} {stability}%
                </span>
              </div>
              <div className="w-12 md:w-20 h-2 md:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all shadow-sm",
                    stability >= 70 ? "bg-gradient-to-r from-purple-400 to-purple-500" :
                    stability >= 40 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                    "bg-gradient-to-r from-red-400 to-red-500"
                  )} 
                  style={{ width: `${stability}%` }} 
                />
              </div>
            </div>
          </div>

          {/* 境界 */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] text-muted-foreground font-medium">境界</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{currentRealm}</span>
                <Badge variant="outline" className="text-xs font-medium">Lv.{protagonist.level}</Badge>
                {ascensionCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    {ascensionCount}
                  </Badge>
                )}
              </div>
            </div>
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
