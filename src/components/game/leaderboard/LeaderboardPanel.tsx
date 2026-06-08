/**
 * 排行榜面板组件
 */

'use client';

import { useState } from 'react';

import { Crown, Swords, Target, TrendingUp, Trophy, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils';
import type { AllLeaderboards, LeaderboardEntry, LeaderboardType } from '@/types/multiplayer';

/** 排行榜配置 */
const LEADERBOARD_CONFIG: Record<LeaderboardType, {
  title: string;
  icon: React.ReactNode;
  valueFormatter: (entry: LeaderboardEntry) => string;
}> = {
  level: {
    title: '等级榜',
    icon: <TrendingUp className="h-4 w-4" />,
    valueFormatter: (e) => `Lv.${e.level}`,
  },
  combat: {
    title: '战力榜',
    icon: <Swords className="h-4 w-4" />,
    valueFormatter: (e) => e.combatPower.toLocaleString(),
  },
  boss_kills: {
    title: 'Boss 击杀榜',
    icon: <Target className="h-4 w-4" />,
    valueFormatter: (e) => `${e.achievements.bossKills} 只`,
  },
  legendary: {
    title: '传说物品榜',
    icon: <Crown className="h-4 w-4" />,
    valueFormatter: (e) => `${e.achievements.legendaryItems} 件`,
  },
  adventure: {
    title: '冒险完成榜',
    icon: <Trophy className="h-4 w-4" />,
    valueFormatter: (e) => `${e.achievements.adventuresCompleted} 次`,
  },
};

/** 排名徽章 */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        🥇
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="bg-gray-400/20 text-gray-300 border-gray-400/30">
        🥈
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="bg-amber-600/20 text-amber-500 border-amber-600/30">
        🥉
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      #{rank}
    </Badge>
  );
}

/** 排行榜条目 */
function LeaderboardItem({ entry, rank, type }: {
  entry: LeaderboardEntry;
  rank: number;
  type: LeaderboardType;
}) {
  const config = LEADERBOARD_CONFIG[type];

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      rank <= 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
    )}>
      <RankBadge rank={rank} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{entry.displayName || entry.playerName}</span>
          {entry.isOnline && (
            <span className="w-2 h-2 rounded-full bg-green-500" title="在线" />
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {entry.realm}
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-mono text-sm font-medium">
          {config.valueFormatter(entry)}
        </div>
      </div>
    </div>
  );
}

/** 排行榜列表 */
function LeaderboardList({
  entries,
  type,
  currentPlayerId,
}: {
  entries: LeaderboardEntry[];
  type: LeaderboardType;
  currentPlayerId?: string;
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-1">
        {entries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            暂无数据
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.playerId}
              className={cn(
                entry.playerId === currentPlayerId && 'ring-2 ring-primary/50 rounded-lg'
              )}
            >
              <LeaderboardItem
                entry={entry}
                rank={index + 1}
                type={type}
              />
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

/** Props */
interface LeaderboardPanelProps {
  /** 排行榜数据 */
  leaderboards: AllLeaderboards | null;
  /** 当前玩家 ID */
  currentPlayerId?: string;
  /** 在线人数 */
  onlineCount?: number;
  /** 类名 */
  className?: string;
}

/**
 * 排行榜面板
 */
export function LeaderboardPanel({
  leaderboards,
  currentPlayerId,
  onlineCount = 0,
  className,
}: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('level');

  // 获取当前排行榜数据
  const currentLeaderboard = leaderboards?.[activeTab] || [];

  return (
    <Card className={cn('w-full flex flex-col h-full', className)}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            排行榜
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {onlineCount} 在线
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)} className="flex flex-col h-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 shrink-0">
            {(Object.keys(LEADERBOARD_CONFIG) as LeaderboardType[]).map((type) => {
              const config = LEADERBOARD_CONFIG[type];
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="gap-1.5 data-[state=active]:bg-muted"
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {(Object.keys(LEADERBOARD_CONFIG) as LeaderboardType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-0 flex-1 overflow-hidden">
              <LeaderboardList
                entries={leaderboards?.[type] || []}
                type={type}
                currentPlayerId={currentPlayerId}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default LeaderboardPanel;
