/**
 * FloorTransition — 楼层过渡弹窗
 *
 * 每层出口到达后展示撤退/继续选择。
 * ≤200 行
 */

'use client';

import { Button } from '@/shared/ui/actions/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/overlay/dialog';

import type { FloorTransition as FloorTransitionData } from '../types';

interface FloorTransitionProps {
  /** 是否打开 */
  open: boolean;
  /** 过渡数据 */
  data: FloorTransitionData | null;
  /** 选择撤退 */
  onRetreat: () => void;
  /** 选择继续 */
  onContinue: () => void;
}

export function FloorTransition({
  open,
  data,
  onRetreat,
  onContinue,
}: FloorTransitionProps) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            🎉 第 {data.currentDepth} 层完成！
          </DialogTitle>
          <DialogDescription>
            你到达了楼层出口。是见好就收，还是继续深入？
          </DialogDescription>
        </DialogHeader>

        {/* 当前收获 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-muted/30 rounded">
            <span>本层收获</span>
            <span>
              💰{data.floorLoot.spiritStones} ⭐{data.floorLoot.experience}
              {data.floorLoot.fragments.length > 0 && ` 📜×${data.floorLoot.fragments.length}`}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-muted/30 rounded">
            <span>累计收获</span>
            <span className="font-semibold">
              💰{data.accumulatedLoot.spiritStones} ⭐{data.accumulatedLoot.experience}
            </span>
          </div>
        </div>

        {/* 下一层预览 */}
        {data.nextFloorPreview && (
          <div className="p-3 bg-primary/10 rounded text-sm space-y-1">
            <p className="font-semibold">下一层预览 — F{data.nextFloorPreview.depth}</p>
            <p>地图大小：{data.nextFloorPreview.gridSize}×{data.nextFloorPreview.gridSize}</p>
            <p>奖励倍率：×{data.nextFloorPreview.rewardMultiplier.toFixed(1)}</p>
            <p>敌人等级：Lv.{data.nextFloorPreview.enemyLevelRange[0]} ~ Lv.{data.nextFloorPreview.enemyLevelRange[1]}</p>
          </div>
        )}

        {!data.canContinue && (
          <p className="text-center text-sm text-muted-foreground">
            已是最后一层，撤退即可获得全部收获。
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onRetreat} className="flex-1">
            🏃 安全撤退
          </Button>
          {data.canContinue && (
            <Button onClick={onContinue} className="flex-1">
              ⚔️ 继续深入
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
