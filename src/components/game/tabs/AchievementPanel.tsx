'use client';

import { useState, useMemo } from 'react';

import { Trophy, Swords, Package, Map, Sparkles, Star, Lock, CheckCircle, Gift } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ACHIEVEMENTS, 
  getAchievementsByType, 
  AchievementTypeNames 
} from '@/lib/data/achievementData';
import { 
  calculateAllAchievementStatuses,
  getAchievementProgress,
} from '@/lib/game/achievement/achievementUtils';
import { 
  GameStatistics,
} from '@/lib/game/types';
import { AchievementType, AchievementStatus, AchievementDefinition } from '@/lib/game/types';

interface AchievementPanelProps {
  statistics: GameStatistics;
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  onClaimReward?: (achievementId: string) => void;
}

// 成就类型图标
const TypeIcons: Record<AchievementType, React.ReactNode> = {
  level: <Trophy className="w-4 h-4" />,
  combat: <Swords className="w-4 h-4" />,
  collection: <Package className="w-4 h-4" />,
  exploration: <Map className="w-4 h-4" />,
  cultivation: <Sparkles className="w-4 h-4" />,
  special: <Star className="w-4 h-4" />,
};

// 稀有度颜色映射
const rarityColors: Record<string, string> = {
  '普通': 'text-gray-500',
  '稀有': 'text-blue-500',
  '史诗': 'text-purple-500',
  '传说': 'text-yellow-500',
};

const rarityBgColors: Record<string, string> = {
  '普通': 'bg-gray-500/10 border-gray-500/30',
  '稀有': 'bg-blue-500/10 border-blue-500/30',
  '史诗': 'bg-purple-500/10 border-purple-500/30',
  '传说': 'bg-yellow-500/10 border-yellow-500/30',
};

// 成就卡片
function AchievementCard({ 
  definition, 
  status,
  onClaimReward 
}: { 
  definition: AchievementDefinition; 
  status: AchievementStatus & { claimed?: boolean; canClaim?: boolean };
  onClaimReward?: () => void;
}) {
  const isUnlocked = status.unlocked;
  const progressPercent = getAchievementProgress(status);
  const canClaim = status.canClaim ?? false;
  const claimed = status.claimed ?? false;
  
  // 格式化奖励显示
  const formatRewards = () => {
    const rewards: { label: string; color?: string }[] = [];
    
    if (definition.rewards.experience) {
      rewards.push({ label: `经验 +${definition.rewards.experience}` });
    }
    
    if (definition.rewards.items) {
      definition.rewards.items.forEach(item => {
        rewards.push({ label: `${item.definition.name} x${item.quantity}` });
      });
    }
    
    if (definition.rewards.stats) {
      Object.entries(definition.rewards.stats).forEach(([stat, value]) => {
        rewards.push({ label: `${stat} +${value}` });
      });
    }
    
    return rewards;
  };
  
  const rewards = formatRewards();
  
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      isUnlocked 
        ? 'bg-primary/5 border-primary/30' 
        : 'bg-muted/30 border-border hover:border-border/80'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 p-2 rounded-lg ${
          isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {isUnlocked ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${isUnlocked ? 'text-primary' : 'text-foreground'}`}>
              {definition.name}
            </h4>
            {isUnlocked && !claimed && (
              <Badge variant="outline" className="text-[10px] bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
                已解锁
              </Badge>
            )}
            {claimed && (
              <Badge variant="outline" className="text-[10px] bg-green-500/10 border-green-500/30 text-green-600">
                已领取
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">
            {definition.description}
          </p>
          
          {!isUnlocked && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>进度</span>
                <span>{status.progress}/{definition.target}</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
          
          {rewards.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rewards.slice(0, 3).map((reward, idx) => (
                <Badge key={idx} variant="secondary" className="text-[9px]">
                  {reward.label}
                </Badge>
              ))}
              {rewards.length > 3 && (
                <Badge variant="secondary" className="text-[9px]">
                  +{rewards.length - 3}更多
                </Badge>
              )}
            </div>
          )}
          
          {canClaim && onClaimReward && (
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 h-7 text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20"
              onClick={onClaimReward}
            >
              <Gift className="w-3 h-3 mr-1" />
              领取奖励
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 成就类型标签页
function AchievementTypeTab({ 
  type, 
  achievements,
  statuses,
  onClaimReward 
}: { 
  type: AchievementType;
  achievements: AchievementDefinition[];
  statuses: (AchievementStatus & { claimed?: boolean; canClaim?: boolean })[];
  onClaimReward?: (achievementId: string) => void;
}) {
  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      const statusA = statuses.find(s => s.achievementId === a.id);
      const statusB = statuses.find(s => s.achievementId === b.id);
      
      // 可领取的排最前
      if (statusA?.canClaim && !statusB?.canClaim) return -1;
      if (!statusA?.canClaim && statusB?.canClaim) return 1;
      
      // 已完成的排后面
      if (statusA?.unlocked && !statusB?.unlocked) return 1;
      if (!statusA?.unlocked && statusB?.unlocked) return -1;
      
      // 按进度排序
      const progressA = statusA?.progress ?? 0;
      const progressB = statusB?.progress ?? 0;
      return progressB - progressA;
    });
  }, [achievements, statuses]);
  
  const unlockedCount = achievements.filter(a => 
    statuses.find(s => s.achievementId === a.id)?.unlocked
  ).length;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {TypeIcons[type]}
          <span className="text-sm font-medium">{AchievementTypeNames[type]}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {unlockedCount}/{achievements.length}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {sortedAchievements.map(definition => (
          <AchievementCard
            key={definition.id}
            definition={definition}
            status={statuses.find(s => s.achievementId === definition.id)!}
            onClaimReward={() => onClaimReward?.(definition.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function AchievementPanel({ 
  statistics,
  unlockedAchievementIds,
  claimedAchievementIds,
  onClaimReward 
}: AchievementPanelProps) {
  const [activeType, setActiveType] = useState<AchievementType>('level');
  
  // 计算所有成就状态
  const achievementStatuses = useMemo(() => {
    return calculateAllAchievementStatuses(
      statistics,
      unlockedAchievementIds,
      claimedAchievementIds
    );
  }, [statistics, unlockedAchievementIds, claimedAchievementIds]);
  
  // 检查新解锁的成就
  const newUnlocks = useMemo(() => {
    return achievementStatuses.filter(s => 
      s.unlocked && !claimedAchievementIds.includes(s.achievementId)
    );
  }, [achievementStatuses, claimedAchievementIds]);
  
  // 计算总体进度
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievementIds.length;
  const totalProgress = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100) 
    : 0;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            成就系统
            {newUnlocks.length > 0 && (
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                {newUnlocks.length}个可领取
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {unlockedCount}/{totalAchievements}
            </Badge>
          </div>
        </div>
        
        {/* 总体进度 */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>总体完成度</span>
            <span>{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden pt-0">
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as AchievementType)} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 h-8">
            {(['level', 'combat', 'collection', 'exploration', 'cultivation', 'special'] as AchievementType[]).map(type => (
              <TabsTrigger key={type} value={type} className="text-xs px-1">
                {TypeIcons[type]}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="flex-1 mt-2 -mx-4 px-4">
            {(['level', 'combat', 'collection', 'exploration', 'cultivation', 'special'] as AchievementType[]).map(type => (
              <TabsContent key={type} value={type} className="mt-0">
                <AchievementTypeTab
                  type={type}
                  achievements={getAchievementsByType(type)}
                  statuses={achievementStatuses as any}
                  onClaimReward={onClaimReward}
                />
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
