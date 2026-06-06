'use client';

import { ActionResult, InventoryItem, CharacterStats } from '@/lib/game/types';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// 重置确认弹窗
interface ResetConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetConfirmDialog({ isOpen, onClose, onConfirm }: ResetConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            确认重置游戏
          </DialogTitle>
          <DialogDescription>
            重置游戏将清除所有进度，包括角色数据、背包物品、功法装备和成就记录。
            此操作不可撤销！
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            确认重置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 退出确认弹窗
interface ExitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExitConfirmDialog({ isOpen, onClose, onConfirm }: ExitConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            退出历练
          </DialogTitle>
          <DialogDescription>
            退出历练将丢失当前进度，是否确定退出？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            继续历练
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            确认退出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 动作结果弹窗
interface ActionResultDialogProps {
  result: ActionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onCollectLoot?: () => void;
  loot?: InventoryItem[];
}

export function ActionResultDialog({ result, isOpen, onClose, onCollectLoot, loot }: ActionResultDialogProps) {
  if (!result) return null;

  // 根据结果类型显示不同标题
  let title = '操作结果';
  if (result.victory !== undefined) {
    title = result.victory ? '战斗胜利' : '战斗失败';
  } else if (result.breakthroughAttempt !== undefined) {
    title = result.breakthroughSuccess ? '突破成功' : '突破失败';
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">{result.message}</p>
          {result.rewards && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">获得奖励：</p>
              {result.rewards.experience && <p className="text-sm">经验: +{result.rewards.experience}</p>}
              {result.rewards.items && result.rewards.items.length > 0 && (
                <div className="text-sm">
                  物品: {result.rewards.items.map((item) => `${item.definition.name} x${item.quantity}`).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {loot && loot.length > 0 && onCollectLoot && (
            <Button variant="default" onClick={onCollectLoot}>
              拾取战利品
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 主弹窗管理器
interface DialogManagerProps {
  // 重置弹窗
  showResetConfirm: boolean;
  onCloseResetConfirm: () => void;
  onConfirmReset: () => void;
  
  // 退出弹窗
  showExitConfirm: boolean;
  onCloseExitConfirm: () => void;
  onConfirmExit: () => void;
  
  // 结果弹窗
  lastResult: ActionResult | null;
  onCloseResult: () => void;
  onCollectLoot?: () => void;
  loot?: InventoryItem[];
}

export function DialogManager({
  showResetConfirm,
  onCloseResetConfirm,
  onConfirmReset,
  showExitConfirm,
  onCloseExitConfirm,
  onConfirmExit,
  lastResult,
  onCloseResult,
  onCollectLoot,
  loot,
}: DialogManagerProps) {
  return (
    <>
      <ResetConfirmDialog
        isOpen={showResetConfirm}
        onClose={onCloseResetConfirm}
        onConfirm={onConfirmReset}
      />
      <ExitConfirmDialog
        isOpen={showExitConfirm}
        onClose={onCloseExitConfirm}
        onConfirm={onConfirmExit}
      />
      <ActionResultDialog
        result={lastResult}
        isOpen={!!lastResult}
        onClose={onCloseResult}
        onCollectLoot={onCollectLoot}
        loot={loot}
      />
    </>
  );
}
