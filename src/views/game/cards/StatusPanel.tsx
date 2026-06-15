'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

import {
  Heart, Zap, Shield, Activity, User, TrendingUp, TrendingDown,
  Swords, ShieldCheck, Flame, Info, Brain, Sparkles, Star,
} from 'lucide-react';

import type { Protagonist, MentalState, CultivationPath } from '@/core/types';
import { getFinalStats } from '@/core/types';
import {
  calculatePlayerCombatPower,
  getCombatPowerRank,
  formatCombatPower,
} from '@/modules/combat/logic/combatPower';
import { getPathLevelExp, CULTIVATION_PATHS } from '@/modules/progression/data/cultivationPathData';
import { getMaxExperience } from '@/modules/progression/logic/cultivation';
import { StatDetailDialog } from '@/shared/components/StatDetailDialog';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { cn } from '@/shared/utils';
import {
  useProtagonistInfo,
  useStats,
  useCombatStats,
  useHpMp,
} from '@/views/game/hooks/useGameHooks';

// 五大属性图标和颜色配置
const statConfig = [
  { icon: Heart, key: '体质' as const, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200/50 dark:border-red-800/50' },
  { icon: Zap, key: '灵根' as const, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200/50 dark:border-blue-800/50' },
  { icon: Shield, key: '意志' as const, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200/50 dark:border-yellow-800/50' },
  { icon: Activity, key: '悟性' as const, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200/50 dark:border-purple-800/50' },
  { icon: User, key: '幸运' as const, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200/50 dark:border-green-800/50' },
];

// 修炼流派图标和颜色配置
const PATH_CONFIG: Record<CultivationPath, { icon: React.ReactNode; color: string; barColor: string }> = {
  body: { icon: <Shield className="w-3 h-3" />, color: 'text-orange-500', barColor: 'bg-gradient-to-r from-orange-400 to-orange-500' },
  sword: { icon: <Swords className="w-3 h-3" />, color: 'text-cyan-500', barColor: 'bg-gradient-to-r from-cyan-400 to-cyan-500' },
  spell: { icon: <Sparkles className="w-3 h-3" />, color: 'text-blue-500', barColor: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  alchemy: { icon: <Zap className="w-3 h-3" />, color: 'text-green-500', barColor: 'bg-gradient-to-r from-green-400 to-green-500' },
  demon: { icon: <Flame className="w-3 h-3" />, color: 'text-red-500', barColor: 'bg-gradient-to-r from-red-400 to-red-500' },
};

/** 心境稳定度文字标签 */
function getStabilityLabel(stability: number): string {
  if (stability >= 80) return '澄明';
  if (stability >= 60) return '平稳';
  if (stability >= 40) return '动摇';
  return '不稳';
}

/** 心境稳定度颜色 */
function getStabilityColor(stability: number): string {
  if (stability >= 70) return 'text-purple-500';
  if (stability >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

/** 心境进度条背景色 */
function getStabilityBarColor(stability: number): string {
  if (stability >= 70) return 'bg-gradient-to-r from-purple-400 to-purple-500';
  if (stability >= 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
  return 'bg-gradient-to-r from-red-400 to-red-500';
}

interface StatChange {
  stat: string;
  oldValue: number;
  newValue: number;
  timestamp: number;
}

interface StatusPanelProps {
  protagonist: Protagonist;
  cultivationPath?: CultivationPath | null;
  pathLevel?: number;
  pathExp?: number;
  mentalState?: MentalState | null;
}

export function StatusPanel({
  protagonist,
  cultivationPath,
  pathLevel = 1,
  pathExp = 0,
  mentalState,
}: StatusPanelProps) {
  const info = useProtagonistInfo();
  const stats = useStats();
  const combatStats = useCombatStats();
  const hpMp = useHpMp();

  // 特殊资源名称（法力/灵力/真气等）
  const mpLabel = protagonist.world.specialResource?.displayName ?? '法力';

  // 推导经验值（当 info 未就绪时直接计算）
  const expPercent = info?.expPercentage
    ?? Math.min((protagonist.experience / getMaxExperience(protagonist.level)) * 100, 100);

  // 飞升次数
  const ascensionCount = protagonist.ascensionMark?.count ?? 0;

  // 追踪属性变化（用 ref 记录旧 stats，避免 effect 内 setState 级联渲染）
  const prevStatsRef = useRef(protagonist.stats);
  const [statChanges, setStatChanges] = useState<StatChange[]>([]);

  useEffect(() => {
    const statKeys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
    const newFinal = getFinalStats(protagonist.stats);
    const oldFinal = getFinalStats(prevStatsRef.current);
    const changes: StatChange[] = [];

    for (const key of statKeys) {
      if (oldFinal[key] !== newFinal[key]) {
        changes.push({
          stat: key,
          oldValue: oldFinal[key],
          newValue: newFinal[key],
          timestamp: Date.now(),
        });
      }
    }

    // 更新 ref，不触发额外渲染
    prevStatsRef.current = protagonist.stats;

    if (changes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 属性变化指示器是纯 UI 反馈，不会级联触发
      setStatChanges(prev => [...changes, ...prev.slice(0, 4)]);
      const timeout = setTimeout(() => {
        setStatChanges(prev => prev.filter(c => Date.now() - c.timestamp < 3000));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [protagonist.stats]);

  // 属性变化状态查询
  const getStatChange = (statKey: string): { direction: 'up' | 'down' | null; amount: number } => {
    const change = statChanges.find(c => c.stat === statKey && Date.now() - c.timestamp < 3000);
    if (change) {
      const diff = change.newValue - change.oldValue;
      return { direction: diff > 0 ? 'up' : diff < 0 ? 'down' : null, amount: Math.abs(diff) };
    }
    return { direction: null, amount: 0 };
  };

  if (!info || !stats || !combatStats || !hpMp) {
    return <StatusPanelFallback protagonist={protagonist} />;
  }

  return (
    <Card className="relative overflow-hidden">
      {/* 四角隅饰 */}
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-primary/20 rounded-tl-sm" aria-hidden="true" />
      <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-primary/20 rounded-tr-sm" aria-hidden="true" />
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-primary/20 rounded-bl-sm" aria-hidden="true" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-primary/20 rounded-br-sm" aria-hidden="true" />
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          {info.name}
          <Badge variant="secondary" className="text-[10px]">{info.realm}</Badge>
          {ascensionCount > 0 && (
            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
              <Star className="w-2.5 h-2.5 mr-0.5" />{ascensionCount}
            </Badge>
          )}
          <StatDetailDialog
            protagonist={protagonist}
            trigger={
              <button className="ml-auto p-1 rounded hover:bg-accent transition-colors" title="查看属性详情">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            }
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-1.5">
        {/* HP / MP / EXP 状态条 */}
        <StatusBars
          hpMp={hpMp}
          currentHp={protagonist.currentHp}
          maxHp={protagonist.maxHp}
          currentMp={protagonist.currentMp}
          maxMp={protagonist.maxMp}
          mpLabel={mpLabel}
          expPercent={expPercent}
          level={protagonist.level}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* 五大属性卡片 */}
        <StatCards stats={stats} getStatChange={getStatChange} />

        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* 战力值 */}
        <CombatPowerDisplay protagonist={protagonist} />

        {/* 攻击/防御 */}
        <AttackDefenseRow combatStats={combatStats} />

        {/* 修炼流派 + 心境（条件渲染） */}
        <CultivationInfo
          cultivationPath={cultivationPath}
          pathLevel={pathLevel}
          pathExp={pathExp}
          mentalState={mentalState}
        />
      </CardContent>
    </Card>
  );
}

/** HP/MP/EXP 状态条 */
interface StatusBarsProps {
  hpMp: NonNullable<ReturnType<typeof useHpMp>>;
  currentHp: number; maxHp: number;
  currentMp: number; maxMp: number;
  mpLabel: string;
  expPercent: number;
  level: number;
}

function StatusBars({ hpMp, currentHp, maxHp, currentMp, maxMp, mpLabel, expPercent, level }: StatusBarsProps) {
  const hpBarColor = hpMp.hpPercentage > 50 ? 'from-red-400 to-red-500' : 'from-red-500 to-red-600';
  const hpIconColor = hpMp.hpPercentage > 50 ? 'text-red-400' : 'text-red-500';
  const mpBarColor = hpMp.mpPercentage > 50 ? 'from-blue-400 to-blue-500' : 'from-blue-500 to-blue-600';
  const mpIconColor = hpMp.mpPercentage > 50 ? 'text-blue-400' : 'text-blue-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Heart className={cn('w-3 h-3 shrink-0', hpIconColor)} />
        <span className="text-[10px] text-muted-foreground w-7 shrink-0">生命</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all bg-gradient-to-r', hpBarColor)} style={{ width: `${hpMp.hpPercentage}%` }} />
        </div>
        <span className="text-[10px] font-medium tabular-nums w-16 text-right shrink-0">{currentHp}/{maxHp}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Zap className={cn('w-3 h-3 shrink-0', mpIconColor)} />
        <span className="text-[10px] text-muted-foreground w-7 shrink-0">{mpLabel.slice(0, 2)}</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all bg-gradient-to-r', mpBarColor)} style={{ width: `${hpMp.mpPercentage}%` }} />
        </div>
        <span className="text-[10px] font-medium tabular-nums w-16 text-right shrink-0">{currentMp}/{maxMp}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-primary w-3 shrink-0 text-center">E</span>
        <span className="text-[10px] text-muted-foreground w-7 shrink-0">经验</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all" style={{ width: `${expPercent}%` }} />
        </div>
        <span className="text-[10px] font-medium tabular-nums text-right shrink-0">{expPercent.toFixed(0)}%</span>
        <Badge variant="outline" className="text-[9px] px-1 h-4">Lv.{level}</Badge>
      </div>
    </div>
  );
}

/** 五大属性卡片网格 */
interface StatCardsProps {
  stats: NonNullable<ReturnType<typeof useStats>>;
  getStatChange: (key: string) => { direction: 'up' | 'down' | null; amount: number };
}

function StatCards({ stats, getStatChange }: StatCardsProps) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {stats.statDetails.map((stat, index) => {
        const config = statConfig[index];
        const change = getStatChange(stat.key);
        return (
          <div
            key={stat.key}
            className={cn('flex flex-col items-center justify-center p-1.5 rounded-lg relative', config.bg, config.border)}
          >
            <config.icon className={cn('w-3.5 h-3.5', config.color, 'shrink-0')} />
            <span className="text-[10px] text-muted-foreground mt-0.5">{stat.displayName}</span>
            <span className={cn('text-xs font-bold', config.color)}>{stat.value}</span>
            <span className="text-[10px] text-muted-foreground/85">{stat.baseValue}+{stat.growthValue}</span>
            {change.direction === 'up' && (
              <span className="absolute -top-1 -right-1 text-[10px] text-green-500 flex items-center bg-green-100 dark:bg-green-900/50 rounded-full px-0.5">
                <TrendingUp className="w-2 h-2" />{change.amount}
              </span>
            )}
            {change.direction === 'down' && (
              <span className="absolute -top-1 -right-1 text-[10px] text-red-500 flex items-center bg-red-100 dark:bg-red-900/50 rounded-full px-0.5">
                <TrendingDown className="w-2 h-2" />{change.amount}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 攻击/防御行 */
interface AttackDefenseRowProps {
  combatStats: NonNullable<ReturnType<typeof useCombatStats>>;
}

function AttackDefenseRow({ combatStats }: AttackDefenseRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50">
        <Swords className="w-3 h-3 text-red-500 shrink-0" />
        <span className="text-[10px] text-muted-foreground">攻</span>
        <span className="text-sm font-bold text-red-600 dark:text-red-400">{combatStats.attack}</span>
        {combatStats.totalAttackBonus > 0 && <span className="text-[10px] text-red-500/70">+{combatStats.totalAttackBonus}%</span>}
      </div>
      <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
        <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
        <span className="text-[10px] text-muted-foreground">防</span>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{combatStats.defense}</span>
        {combatStats.totalDefenseBonus > 0 && <span className="text-[10px] text-blue-500/70">+{combatStats.totalDefenseBonus}%</span>}
      </div>
    </div>
  );
}

/** 修炼流派 + 心境信息 */
interface CultivationInfoProps {
  cultivationPath?: CultivationPath | null;
  pathLevel: number;
  pathExp: number;
  mentalState?: MentalState | null;
}

function CultivationInfo({ cultivationPath, pathLevel, pathExp, mentalState }: CultivationInfoProps) {
  const pathMaxExp = getPathLevelExp(pathLevel);
  const pathPercent = Math.floor((pathExp / pathMaxExp) * 100);
  const stability = mentalState?.stability;

  if (!cultivationPath && stability == null) return null;

  return (
    <>
      {cultivationPath && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          <div className="flex items-center gap-1.5">
            <span className={PATH_CONFIG[cultivationPath].color}>{PATH_CONFIG[cultivationPath].icon}</span>
            <span className="text-[10px] text-muted-foreground">{CULTIVATION_PATHS[cultivationPath].name}</span>
            <Badge variant="outline" className="text-[9px] px-1 h-4">Lv.{pathLevel}</Badge>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden ml-1">
              <div className={cn('h-full rounded-full transition-all', PATH_CONFIG[cultivationPath].barColor)} style={{ width: `${pathPercent}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{pathPercent}%</span>
          </div>
        </>
      )}
      {stability != null && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          <div className="flex items-center gap-1.5">
            <Brain className={cn('w-3 h-3 shrink-0', getStabilityColor(stability))} />
            <span className="text-[10px] text-muted-foreground">心境</span>
            <span className={cn('text-[10px] font-medium', getStabilityColor(stability))}>{getStabilityLabel(stability)}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', getStabilityBarColor(stability))} style={{ width: `${stability}%` }} />
            </div>
            <span className={cn('text-[10px] font-medium tabular-nums', getStabilityColor(stability))}>{stability}%</span>
          </div>
        </>
      )}
    </>
  );
}

/** 战力显示组件 */
function CombatPowerDisplay({ protagonist }: { protagonist: Protagonist }) {
  const combatPower = useMemo(() => {
    return calculatePlayerCombatPower(
      protagonist,
      protagonist.techniques,
      protagonist.equipments,
      protagonist.activeEffects,
    );
  }, [protagonist]);

  const rank = getCombatPowerRank(combatPower);
  const formatted = formatCombatPower(combatPower);

  return (
    <div className="flex items-center justify-between p-1.5 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border border-orange-200/50 dark:border-orange-800/50">
      <div className="flex items-center gap-1">
        <Flame className="w-3 h-3 text-orange-500" />
        <span className="text-[10px] text-muted-foreground">战力</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-[10px] font-bold border-current', rank.color)}>
          {rank.rank}
        </Badge>
        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
          {formatted}
        </span>
      </div>
    </div>
  );
}

/** Fallback 组件 */
function StatusPanelFallback({ protagonist }: { protagonist: Protagonist }) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          {protagonist.character.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="text-xs text-muted-foreground">加载中...</div>
      </CardContent>
    </Card>
  );
}
