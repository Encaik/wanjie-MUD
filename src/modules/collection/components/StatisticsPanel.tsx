'use client';

import { useMemo } from 'react';

import { 
  Swords, 
  Sparkles, 
  Package, 
  Map, 
  Trophy, 
  TrendingUp,
  Target,
  Star,
  Users,
  BarChart3,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { calculateStatisticsSummary, StatisticsSummary } from '@/modules/collection/logic/statistics/statisticsSystem';
import { GameStatistics, Protagonist, getFinalStats } from '@/shared/lib/types';
import { cn } from '@/shared/utils';

interface StatisticsPanelProps {
  statistics: GameStatistics;
  protagonist: Protagonist | null;
}

// 统计项组件
function StatItem({ 
  label, 
  value, 
  icon,
  highlight = false,
}: { 
  label: string; 
  value: string | number; 
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-3 rounded-md",
      highlight && "bg-primary/5"
    )}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-medium tabular-nums",
        highlight && "text-primary font-bold"
      )}>
        {value}
      </span>
    </div>
  );
}

// 统计区块组件
function StatSection({ 
  title, 
  icon,
  children 
}: { 
  title: string; 
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <div className="space-y-0.5">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// 进度条组件
function ProgressBar({ 
  label, 
  current, 
  max, 
  color = "primary" 
}: { 
  label: string; 
  current: number; 
  max: number;
  color?: string;
}) {
  const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{current}/{max}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            color === "primary" && "bg-primary",
            color === "emerald" && "bg-emerald-500",
            color === "amber" && "bg-amber-500",
            color === "blue" && "bg-blue-500",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function StatisticsPanel({ statistics, protagonist }: StatisticsPanelProps) {
  const summary = useMemo(() => calculateStatisticsSummary(statistics), [statistics]);
  
  // 计算成就进度
  const achievementProgress = useMemo(() => {
    const claimed = statistics.achievementRewardsClaimed;
    const unlocked = statistics.maxLevel; // 简化：用等级作为解锁参考
    return { claimed, unlocked };
  }, [statistics]);
  
  return (
    <div className="space-y-4 p-1">
      {/* 总览卡片 */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-muted/30">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary tabular-nums">
                {summary.totalActions}
              </div>
              <div className="text-xs text-muted-foreground mt-1">总行动次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                {summary.combat.totalKills}
              </div>
              <div className="text-xs text-muted-foreground mt-1">击败敌人</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 tabular-nums">
                {protagonist?.level ?? statistics.maxLevel}
              </div>
              <div className="text-xs text-muted-foreground mt-1">最高等级</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 tabular-nums">
                {summary.collection.techniques + summary.collection.equipments}
              </div>
              <div className="text-xs text-muted-foreground mt-1">收集物品</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 详细统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 战斗统计 */}
        <StatSection title="战斗统计" icon={<Swords className="w-4 h-4 text-red-500" />}>
          <StatItem 
            label="击败敌人" 
            value={summary.combat.totalKills} 
            icon={<Target className="w-3 h-3" />}
            highlight={summary.combat.totalKills > 100}
          />
          <StatItem 
            label="Boss击杀" 
            value={summary.combat.bossKills} 
            icon={<Star className="w-3 h-3" />}
            highlight={summary.combat.bossKills > 0}
          />
          <StatItem 
            label="精英击杀" 
            value={summary.combat.eliteKills} 
            icon={<TrendingUp className="w-3 h-3" />}
          />
          <StatItem 
            label="普通敌人" 
            value={Math.max(0, summary.combat.normalKills)} 
          />
        </StatSection>
        
        {/* 修炼统计 */}
        <StatSection title="修炼统计" icon={<Sparkles className="w-4 h-4 text-purple-500" />}>
          <StatItem 
            label="修炼次数" 
            value={summary.growth.cultivations} 
            highlight={summary.growth.cultivations > 50}
          />
          <StatItem 
            label="突破次数" 
            value={summary.growth.breakthroughs} 
            highlight={summary.growth.breakthroughs > 5}
          />
          <StatItem 
            label="使用物品" 
            value={summary.growth.itemsUsed} 
          />
          <StatItem 
            label="最高强化等级" 
            value={`+${statistics.maxEnhancementLevel}`} 
          />
        </StatSection>
        
        {/* 收集统计 */}
        <StatSection title="收集统计" icon={<Package className="w-4 h-4 text-amber-500" />}>
          <StatItem 
            label="功法收集" 
            value={summary.collection.techniques} 
            highlight={summary.collection.techniques > 5}
          />
          <StatItem 
            label="装备收集" 
            value={summary.collection.equipments} 
          />
          <StatItem 
            label="传说物品" 
            value={summary.collection.legendaryItems} 
            highlight={summary.collection.legendaryItems > 0}
          />
          <StatItem 
            label="激活羁绊" 
            value={summary.extended.bondsActivated} 
          />
        </StatSection>
        
        {/* 探索统计 */}
        <StatSection title="探索统计" icon={<Map className="w-4 h-4 text-blue-500" />}>
          <StatItem 
            label="完成机缘" 
            value={summary.exploration.adventuresCompleted} 
            highlight={summary.exploration.adventuresCompleted > 0}
          />
          <StatItem 
            label="流派等级" 
            value={summary.extended.pathSelected ? summary.extended.pathLevel : '-'} 
          />
          <StatItem 
            label="功法小成" 
            value={statistics.techniqueProficiencyXiaocheng} 
          />
          <StatItem 
            label="功法大成" 
            value={statistics.techniqueProficiencyDacheng} 
          />
        </StatSection>
      </div>
      
      {/* 成就与势力 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 成就统计 */}
        <StatSection title="成就统计" icon={<Trophy className="w-4 h-4 text-yellow-500" />}>
          <StatItem 
            label="领取奖励" 
            value={summary.extended.achievementsClaimed} 
            highlight
          />
          <div className="px-3 pt-2">
            <ProgressBar 
              label="成就领取" 
              current={achievementProgress.claimed} 
              max={Math.max(achievementProgress.claimed + 5, 10)} 
              color="amber"
            />
          </div>
        </StatSection>
        
        {/* 势力统计 */}
        <StatSection title="势力统计" icon={<Users className="w-4 h-4 text-green-500" />}>
          <StatItem 
            label="势力状态" 
            value={summary.extended.factionJoined ? '已加入' : '未加入'} 
            highlight={summary.extended.factionJoined}
          />
          <StatItem 
            label="友善声望" 
            value={statistics.reputationFriendly ? '已达成' : '未达成'} 
          />
          <StatItem 
            label="尊敬声望" 
            value={statistics.reputationHonored ? '已达成' : '未达成'} 
          />
          <StatItem 
            label="崇敬声望" 
            value={statistics.reputationExalted ? '已达成' : '未达成'} 
          />
        </StatSection>
      </div>
      
      {/* 玩家属性快照 */}
      {protagonist && (
        <StatSection title="角色属性" icon={<BarChart3 className="w-4 h-4 text-cyan-500" />}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-1">
            {Object.entries(getFinalStats(protagonist.stats)).map(([key, value]) => (
              <div key={key} className="text-center py-2 bg-muted/30 rounded-md">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="text-lg font-bold tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        </StatSection>
      )}
    </div>
  );
}
