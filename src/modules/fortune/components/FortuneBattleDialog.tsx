/**
 * FortuneBattleDialog — 机缘战斗弹窗
 *
 * 当 pendingBattle 非 null 时显示。≤200 行
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
import type { BattleEncounter } from '../types';

interface FortuneBattleDialogProps {
  battle: BattleEncounter;
  onVictory: () => void;
  onFlee: () => void;
}

function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    normal: '普通', elite: '精英', miniboss: '小头目', boss: 'Boss',
  };
  return labels[tier] || tier;
}

function tierColor(tier: string): string {
  const colors: Record<string, string> = {
    normal: 'text-muted-foreground', elite: 'text-yellow-400',
    miniboss: 'text-orange-400', boss: 'text-red-400',
  };
  return colors[tier] || '';
}

export function FortuneBattleDialog({ battle, onVictory, onFlee }: FortuneBattleDialogProps) {
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>⚔️ 遭遇敌人</DialogTitle>
          <DialogDescription>
            你在机缘中遇到了一个敌人，准备战斗！
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
            <span className="text-sm">敌人</span>
            <span className="font-semibold">{battle.enemyName}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
            <span className="text-sm">等级</span>
            <span>Lv.{battle.enemyLevel}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
            <span className="text-sm">阶级</span>
            <span className={tierColor(battle.enemyTier)}>
              {tierLabel(battle.enemyTier)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFlee} className="flex-1">
            🏃 逃跑
          </Button>
          <Button onClick={onVictory} className="flex-1">
            ⚔️ 战斗
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
