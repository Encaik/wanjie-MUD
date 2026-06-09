'use client';

import { useState, useEffect, useMemo } from 'react';

import { Heart, Zap, Shield, Activity, User, TrendingUp, TrendingDown, Swords, ShieldCheck, Flame, Info } from 'lucide-react';

import { StatDetailDialog } from '@/shared/components/StatDetailDialog';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { 
  useProtagonistInfo, 
  useStats, 
  useCombatStats 
} from '@/views/game/useGameHooks';
import { calculatePlayerCombatPower, getCombatPowerRank, formatCombatPower } from '@/modules/combat/logic/combatPower';
import { Protagonist, getFinalStats } from '@/shared/lib/types';

// 属性图标和颜色配置
const statConfig = [
  { icon: Heart, key: '体质' as const, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200/50 dark:border-red-800/50' },
  { icon: Zap, key: '灵根' as const, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200/50 dark:border-blue-800/50' },
  { icon: Shield, key: '意志' as const, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200/50 dark:border-yellow-800/50' },
  { icon: Activity, key: '悟性' as const, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200/50 dark:border-purple-800/50' },
  { icon: User, key: '幸运' as const, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200/50 dark:border-green-800/50' },
];

// 属性变化记录
interface StatChange {
  stat: string;
  oldValue: number;
  newValue: number;
  timestamp: number;
}

interface StatusPanelProps {
  protagonist: Protagonist;
}

export function StatusPanel({ protagonist }: StatusPanelProps) {
  const info = useProtagonistInfo();
  const stats = useStats();
  const combatStats = useCombatStats();
  
  // 追踪属性变化
  const [prevStats, setPrevStats] = useState(protagonist.stats);
  const [statChanges, setStatChanges] = useState<StatChange[]>([]);
  
  useEffect(() => {
    const changes: StatChange[] = [];
    const statKeys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
    const finalStats = getFinalStats(protagonist.stats);
    const prevFinalStats = getFinalStats(prevStats);
    
    for (const key of statKeys) {
      if (prevFinalStats[key] !== finalStats[key]) {
        changes.push({
          stat: key,
          oldValue: prevFinalStats[key],
          newValue: finalStats[key],
          timestamp: Date.now()
        });
      }
    }
    
    if (changes.length > 0) {
      setStatChanges(prev => [...changes, ...prev.slice(0, 4)]);
      setPrevStats(protagonist.stats);
      
      setTimeout(() => {
        setStatChanges(prev => prev.filter(c => Date.now() - c.timestamp < 3000));
      }, 3000);
    }
  }, [protagonist.stats, prevStats]);
  
  // 获取属性变化状态
  const getStatChange = (statKey: string): { direction: 'up' | 'down' | null; amount: number } => {
    const change = statChanges.find(c => c.stat === statKey && Date.now() - c.timestamp < 3000);
    if (change) {
      const diff = change.newValue - change.oldValue;
      return { direction: diff > 0 ? 'up' : diff < 0 ? 'down' : null, amount: Math.abs(diff) };
    }
    return { direction: null, amount: 0 };
  };

  if (!info || !stats || !combatStats) {
    return <StatusPanelFallback protagonist={protagonist} />;
  }

  return (
    <Card>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          {info.name}
          <Badge variant="secondary" className="ml-auto">{info.realm}</Badge>
          <StatDetailDialog 
            protagonist={protagonist}
            trigger={
              <button className="p-1 rounded hover:bg-accent transition-colors" title="查看属性详情">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            }
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 属性 - 卡片式展示 */}
        <div className="grid grid-cols-5 gap-1">
          {stats.statDetails.map((stat, index) => {
            const config = statConfig[index];
            const change = getStatChange(stat.key);
            
            return (
              <div 
                key={stat.key} 
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg ${config.bg} border ${config.border} relative`}
              >
                <config.icon className={`w-3.5 h-3.5 ${config.color} shrink-0`} />
                <span className="text-[9px] text-muted-foreground mt-0.5">{stat.displayName}</span>
                <span className={`text-xs font-bold ${config.color}`}>{stat.value}</span>
                <span className="text-[8px] text-muted-foreground/70">
                  {stat.baseValue}+{stat.growthValue}
                </span>
                {change.direction === 'up' && (
                  <span className="absolute -top-1 -right-1 text-[9px] text-green-500 flex items-center bg-green-100 dark:bg-green-900/50 rounded-full px-0.5">
                    <TrendingUp className="w-2 h-2" />{change.amount}
                  </span>
                )}
                {change.direction === 'down' && (
                  <span className="absolute -top-1 -right-1 text-[9px] text-red-500 flex items-center bg-red-100 dark:bg-red-900/50 rounded-full px-0.5">
                    <TrendingDown className="w-2 h-2" />{change.amount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* 战力值 */}
        <CombatPowerDisplay protagonist={protagonist} />

        {/* 攻击/防御 - 使用 hooks 数据 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="flex items-center gap-1">
              <Swords className="w-3 h-3 text-red-500" />
              <span className="text-[10px] text-muted-foreground">攻击</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{combatStats.attack}</span>
              {(combatStats.totalAttackBonus > 0) && (
                <span className="text-[8px] text-red-500/70">+{combatStats.totalAttackBonus}%</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">防御</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{combatStats.defense}</span>
              {(combatStats.totalDefenseBonus > 0) && (
                <span className="text-[8px] text-blue-500/70">+{combatStats.totalDefenseBonus}%</span>
              )}
            </div>
          </div>
        </div>
        
        {/* 加成详情 */}
        {(combatStats.attackBonus > 0 || combatStats.equipmentAttackBonus > 0 || 
          combatStats.defenseBonus > 0 || combatStats.equipmentDefenseBonus > 0) && (
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>功法攻击</span>
              <span className="text-red-500">+{combatStats.attackBonus}%</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>功法防御</span>
              <span className="text-blue-500">+{combatStats.defenseBonus}%</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>装备攻击</span>
              <span className="text-red-500">+{combatStats.equipmentAttackBonus}%</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>装备防御</span>
              <span className="text-blue-500">+{combatStats.equipmentDefenseBonus}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 战力显示组件
function CombatPowerDisplay({ protagonist }: { protagonist: Protagonist }) {
  const combatPower = useMemo(() => {
    return calculatePlayerCombatPower(
      protagonist,
      protagonist.techniques,
      protagonist.equipments,
      protagonist.activeEffects
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
        <Badge variant="outline" className={`text-[10px] font-bold ${rank.color} border-current`}>
          {rank.rank}
        </Badge>
        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
          {formatted}
        </span>
      </div>
    </div>
  );
}

// Fallback 组件
function StatusPanelFallback({ protagonist }: StatusPanelProps) {
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
