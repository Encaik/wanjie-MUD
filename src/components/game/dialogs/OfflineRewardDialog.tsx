/**
 * 离线收益对话框
 * 
 * 显示离线期间获得的固定收益：
 * 1. 货币（灵石）
 * 2. 经验值
 * 3. 物品（碎片/材料）
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Coins, 
  Sparkles, 
  Package,
} from 'lucide-react';
import { IdleRewards } from '@/lib/game/tower/types';

/**
 * 离线处理结果
 */
export interface OfflineProcessResultV2 {
  /** 离线时长（毫秒） */
  offlineDuration: number;
  /** 离线时长描述 */
  offlineDurationText: string;
  /** 收益 */
  rewards: IdleRewards;
  /** 体力恢复数量 */
  staminaRecovered: number;
}

interface OfflineRewardDialogProps {
  /** 离线结果 */
  offlineResult: OfflineProcessResultV2 | null;
  /** 关闭回调 */
  onClose: () => void;
}

export function OfflineRewardDialog({ 
  offlineResult, 
  onClose 
}: OfflineRewardDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (offlineResult) {
      setOpen(true);
    }
  }, [offlineResult]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  if (!offlineResult) return null;

  const rewards = offlineResult.rewards;
  
  // 计算是否有实际收益
  const hasRewards = 
    rewards.experience > 0 ||
    rewards.spiritStones > 0 ||
    rewards.fragments.length > 0 ||
    rewards.materials.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            欢迎回来
          </DialogTitle>
          <DialogDescription>
            离线时长：{offlineResult.offlineDurationText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 货币（灵石） */}
          {rewards.spiritStones > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">灵石</span>
              </div>
              <Badge variant="secondary" className="text-yellow-500">
                +{rewards.spiritStones.toLocaleString()}
              </Badge>
            </div>
          )}

          {/* 经验 */}
          {rewards.experience > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">经验</span>
              </div>
              <Badge variant="secondary" className="text-yellow-500">
                +{rewards.experience.toLocaleString()}
              </Badge>
            </div>
          )}

          {/* 碎片 */}
          {rewards.fragments.length > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" />
                <span className="text-sm">碎片</span>
              </div>
              <Badge variant="secondary" className="text-purple-500">
                +{rewards.fragments.reduce((sum, f) => sum + f.quantity, 0)}
              </Badge>
            </div>
          )}

          {/* 材料 */}
          {rewards.materials.length > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                <span className="text-sm">材料</span>
              </div>
              <Badge variant="secondary" className="text-green-500">
                +{rewards.materials.reduce((sum, m) => sum + m.quantity, 0)}
              </Badge>
            </div>
          )}

          {/* 无收益提示 */}
          {!hasRewards && (
            <div className="text-center py-4 text-muted-foreground text-sm space-y-2">
              <p>离线时间较短，未获得收益</p>
              <p className="text-xs">离线时长：{offlineResult.offlineDurationText}</p>
              <p className="text-xs text-amber-600">需要离线超过5分钟才能获得收益</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose} size="sm">
            收取奖励
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
