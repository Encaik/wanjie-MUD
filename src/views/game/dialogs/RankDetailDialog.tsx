'use client';

import { useState } from 'react';

import {
  Crown,
  TrendingUp,
  Check,
  Lock,
  Star,
  Coins,
  Shield,
  Zap,
} from 'lucide-react';

import {
  getRanksByFactionType,
  FactionRankConfig,
  REPUTATION_LEVELS,
  ReputationLevel,
} from '@/modules/faction/data/factionProgressData';
import { Button } from '@/shared/ui/actions/button';
import { Badge } from '@/shared/ui/data-display/badge';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/overlay/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/overlay/tooltip';

interface RankDetailDialogProps {
  factionType: string;
  currentRank: string;
  currentReputation: number;
  onPromote?: (rankId: string) => { success: boolean; message: string };
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

// 检查声望等级是否满足要求
function hasRequiredReputationLevel(
  currentReputation: number,
  requiredLevel: ReputationLevel
): boolean {
  const requiredMin = REPUTATION_LEVELS[requiredLevel].min;
  return currentReputation >= requiredMin;
}

// 福利类型图标
const benefitIcons: Record<string, React.ReactNode> = {
  discount: <Coins className="w-3 h-3" />,
  salary: <Coins className="w-3 h-3" />,
  access: <Shield className="w-3 h-3" />,
  skill: <Zap className="w-3 h-3" />,
  special: <Star className="w-3 h-3" />,
};

export function RankDetailDialog({
  factionType,
  currentRank,
  currentReputation,
  onPromote,
  trigger,
}: RankDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [promotingRank, setPromotingRank] = useState<string | null>(null);

  const ranks = getRanksByFactionType(factionType);
  const currentIndex = ranks.findIndex((r) => r.id === currentRank);

  const handlePromote = async (rankId: string) => {
    if (!onPromote) return;

    setPromotingRank(rankId);
    try {
      const result = onPromote(rankId);
      if (result.success) {
        // 成功后关闭弹窗
        setTimeout(() => setOpen(false), 500);
      }
    } finally {
      setPromotingRank(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5">
            <Crown className="w-2.5 h-2.5 mr-0.5" />
            职位详情
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            职位详情
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4" style={{ maxHeight: '60vh' }}>
          <div className="space-y-2">
            {ranks.map((rank, index) => {
              const isCurrentRank = rank.id === currentRank;
              const isUnlocked = index <= currentIndex;
              const canPromote =
                !isCurrentRank &&
                !isUnlocked &&
                currentReputation >= rank.requiredReputation;
              const isLocked =
                !isCurrentRank && !isUnlocked && !canPromote;

              return (
                <div
                  key={rank.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrentRank
                      ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30'
                      : isUnlocked
                        ? 'bg-muted/50 border-muted'
                        : canPromote
                          ? 'bg-green-500/5 border-green-500/30 hover:border-green-500/50'
                          : 'bg-muted/30 border-muted/50 opacity-60'
                  }`}
                >
                  {/* 职位头部 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isCurrentRank && (
                        <Badge className="bg-purple-500 text-white text-[10px]">
                          当前
                        </Badge>
                      )}
                      {isUnlocked && !isCurrentRank && (
                        <Badge variant="outline" className="text-[10px]">
                          <Check className="w-2.5 h-2.5 mr-0.5" />
                          已晋升
                        </Badge>
                      )}
                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span
                        className={`font-semibold ${
                          isCurrentRank
                            ? 'text-purple-600 dark:text-purple-400'
                            : canPromote
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-foreground'
                        }`}
                      >
                        {rank.name}
                      </span>
                    </div>
                    {/* 晋升按钮 */}
                    {canPromote && onPromote && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-6 text-[10px] px-2 bg-green-500 hover:bg-green-600"
                        onClick={() => handlePromote(rank.id)}
                        disabled={promotingRank === rank.id}
                      >
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                        {promotingRank === rank.id ? '晋升中...' : '晋升'}
                      </Button>
                    )}
                  </div>

                  {/* 职位描述 */}
                  <p className="text-xs text-muted-foreground mb-2">
                    {rank.description}
                  </p>

                  {/* 需求条件 */}
                  <div className="flex items-center gap-3 text-[10px] mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-500" />
                      <span
                        className={
                          currentReputation >= rank.requiredReputation
                            ? 'text-green-500'
                            : 'text-muted-foreground'
                        }
                      >
                        需要 {rank.requiredReputation.toLocaleString()} 声望
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={
                          hasRequiredReputationLevel(
                            currentReputation,
                            rank.requiredReputationLevel
                          )
                            ? 'text-green-500'
                            : 'text-muted-foreground'
                        }
                      >
                        声望等级: {REPUTATION_LEVELS[rank.requiredReputationLevel].name}
                      </span>
                    </div>
                  </div>

                  {/* 福利列表 */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground mr-1">
                      福利:
                    </span>
                    {rank.benefits.map((benefit, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={`text-[9px] h-4 cursor-help ${
                              isUnlocked
                                ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                : 'bg-muted/50'
                            }`}
                          >
                            {benefitIcons[benefit.type]}
                            <span className="ml-0.5">
                              {benefit.type === 'discount' && `${benefit.value}%折扣`}
                              {benefit.type === 'salary' && `${benefit.value}灵石`}
                              {benefit.type === 'access' && '特权'}
                              {benefit.type === 'skill' && '技能'}
                              {benefit.type === 'special' && '特殊'}
                            </span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {benefit.description}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
