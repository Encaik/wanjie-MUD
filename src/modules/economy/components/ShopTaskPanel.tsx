/**
 * 商店任务面板
 * 
 * 显示商店相关任务
 */

'use client';

import { useState } from 'react';

import { 
  ClipboardList, 
  Check, 
  Gift, 
  ChevronDown, 
  ChevronUp,
  Circle,
  CheckCircle2,
} from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { 
  ShopTaskState,
  ShopTaskCheckData, 
  ShopTask,
  SHOP_TASKS,
  getDailyShopTasks,
  getWeeklyShopTasks,
  getTaskProgressText,
} from '@/modules/economy/logic/shop/shopTaskService';
import { cn } from '@/shared/utils';


interface ShopTaskPanelProps {
  taskState: ShopTaskState;
  shopData: ShopTaskCheckData;
  onClaim: (taskId: string) => void;
  compact?: boolean;
}

export function ShopTaskPanel({
  taskState,
  shopData,
  onClaim,
  compact = false,
}: ShopTaskPanelProps) {
  const [expanded, setExpanded] = useState(!compact);

  const dailyTasks = getDailyShopTasks();
  const weeklyTasks = getWeeklyShopTasks();

  const completedDaily = dailyTasks.filter(
    t => taskState.completedTaskIds.includes(t.id)
  ).length;
  const claimedDaily = dailyTasks.filter(
    t => taskState.claimedTaskIds.includes(t.id)
  ).length;

  const renderTask = (task: ShopTask) => {
    const isCompleted = taskState.completedTaskIds.includes(task.id);
    const isClaimed = taskState.claimedTaskIds.includes(task.id);
    const canClaim = isCompleted && !isClaimed;
    const progressText = getTaskProgressText(task, shopData);

    return (
      <div
        key={task.id}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg',
          isClaimed && 'opacity-50',
          !isCompleted && 'bg-muted/30',
          canClaim && 'bg-green-500/10 border border-green-500/30'
        )}
      >
        {/* 状态图标 */}
        <div className="shrink-0">
          {isClaimed ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : isCompleted ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* 任务信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium',
              isClaimed && 'line-through text-muted-foreground'
            )}>
              {task.name}
            </span>
            {task.type === 'daily' ? (
              <Badge variant="outline" className="text-[9px]">每日</Badge>
            ) : (
              <Badge variant="secondary" className="text-[9px]">每周</Badge>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {task.description}
          </div>
          {!isCompleted && progressText && (
            <div className="text-[10px] text-blue-500">{progressText}</div>
          )}
        </div>

        {/* 奖励 */}
        <div className="shrink-0 text-right">
          {canClaim ? (
            <Button
              size="sm"
              variant="default"
              className="h-6 text-[10px] bg-green-500 hover:bg-green-600"
              onClick={() => onClaim(task.id)}
            >
              <Gift className="w-3 h-3 mr-1" />
              领取
            </Button>
          ) : (
            <div className="text-[10px] text-muted-foreground">
              {task.reward.spiritStones && (
                <span className="text-yellow-500">💎{task.reward.spiritStones}</span>
              )}
              {task.reward.contribution && (
                <span className="text-blue-500 ml-1">⭐{task.reward.contribution}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 紧凑模式
  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          'flex items-center justify-between w-full p-2 rounded-lg',
          'bg-muted/30 hover:bg-muted/50 transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">商店任务</span>
          <Badge variant="outline" className="text-[10px]">
            {claimedDaily}/{dailyTasks.length}
          </Badge>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">商店任务</span>
        </div>
        {compact && (
          <button onClick={() => setExpanded(false)}>
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* 每日任务 */}
      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground px-1">
          每日任务 ({claimedDaily}/{dailyTasks.length})
        </div>
        {dailyTasks.map(renderTask)}
      </div>

      {/* 周常任务 */}
      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground px-1">
          每周任务
        </div>
        {weeklyTasks.map(renderTask)}
      </div>
    </div>
  );
}

/** 任务完成提示 */
export function TaskCompleteToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
      <Gift className="w-5 h-5 text-green-500" />
      <div className="flex-1">
        <div className="text-sm font-medium">任务完成！</div>
        <div className="text-xs text-muted-foreground">{message}</div>
      </div>
      <Button size="sm" variant="ghost" onClick={onClose}>
        确定
      </Button>
    </div>
  );
}
