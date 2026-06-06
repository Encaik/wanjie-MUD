/**
 * 自动修炼切换按钮组件
 */

'use client';

import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface AutoCultivateToggleProps {
  /** 是否正在自动修炼 */
  autoCultivating: boolean;
  /** 切换自动修炼 */
  onToggle: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否有足够灵石 */
  hasEnoughStones?: boolean;
}

export function AutoCultivateToggle({
  autoCultivating,
  onToggle,
  disabled,
  hasEnoughStones = true,
}: AutoCultivateToggleProps) {
  return (
    <Button
      className={`h-8 text-xs px-3 ${autoCultivating ? 'bg-destructive hover:bg-destructive/90' : ''}`}
      variant={autoCultivating ? 'destructive' : 'outline'}
      onClick={onToggle}
      disabled={disabled || !hasEnoughStones}
    >
      {autoCultivating ? (
        <>
          <Square className="w-3 h-3 mr-1" />
          停止
        </>
      ) : (
        <>
          <Play className="w-3 h-3 mr-1" />
          自动
        </>
      )}
    </Button>
  );
}
