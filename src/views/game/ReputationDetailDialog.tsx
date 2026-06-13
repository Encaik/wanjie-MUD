'use client';

import { useState } from 'react';

import { Star, ChevronRight } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/overlay/dialog';
import { Progress } from '@/shared/ui/feedback/progress';
import {
  REPUTATION_LEVELS,
  ReputationLevel,
  getReputationLevel,
} from '@/modules/faction/data/factionProgressData';


interface ReputationDetailDialogProps {
  currentReputation: number;
  trigger?: React.ReactNode;
}

// 声望等级顺序
const REPUTATION_ORDER: ReputationLevel[] = [
  'outsider',
  'neutral',
  'friendly',
  'honored',
  'revered',
  'exalted',
];

export function ReputationDetailDialog({
  currentReputation,
  trigger,
}: ReputationDetailDialogProps) {
  const [open, setOpen] = useState(false);

  const currentLevel = getReputationLevel(currentReputation);
  const currentLevelIndex = REPUTATION_ORDER.indexOf(currentLevel);
  const nextLevel = REPUTATION_ORDER[currentLevelIndex + 1];
  const nextLevelConfig = nextLevel ? REPUTATION_LEVELS[nextLevel] : null;
  const currentLevelConfig = REPUTATION_LEVELS[currentLevel];

  // 计算当前等级进度
  const progressPercent = nextLevelConfig
    ? Math.min(
        100,
        ((currentReputation - currentLevelConfig.min) /
          (nextLevelConfig.min - currentLevelConfig.min)) *
          100
      )
    : 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            查看声望详情
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            声望详情
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 当前声望 */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">当前声望</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {currentReputation.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">当前等级</span>
              <Badge className={`${currentLevelConfig.color} bg-current/10`}>
                {currentLevelConfig.name}
              </Badge>
            </div>
            {/* 进度条 */}
            {nextLevelConfig && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>下一等级: {nextLevelConfig.name}</span>
                  <span>{nextLevelConfig.min.toLocaleString()} 声望</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>

          {/* 声望等级列表 */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              声望等级一览
            </div>
            {REPUTATION_ORDER.map((level, index) => {
              const config = REPUTATION_LEVELS[level];
              const isCurrentLevel = level === currentLevel;
              const isUnlocked = index <= currentLevelIndex;
              const prevLevel = REPUTATION_ORDER[index - 1];
              const prevMin = prevLevel ? REPUTATION_LEVELS[prevLevel].min : 0;

              return (
                <div
                  key={level}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isCurrentLevel
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : isUnlocked
                        ? 'bg-muted/50'
                        : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isUnlocked && (
                      <div
                        className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                      />
                    )}
                    <span
                      className={`font-medium ${isCurrentLevel ? 'text-amber-600 dark:text-amber-400' : ''}`}
                    >
                      {config.name}
                    </span>
                    {isCurrentLevel && (
                      <Badge className="text-[9px] h-4 bg-amber-500 text-white">
                        当前
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {config.min.toLocaleString()}+
                    </span>
                    <Badge variant="outline" className="text-[9px] h-4">
                      商店 {config.bonus}%折扣
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
