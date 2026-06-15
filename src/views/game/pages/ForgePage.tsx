/**
 * ForgePage — 炼器面板页面
 *
 * 调用 useCrafting，渲染炼器面板。
 */

'use client';

import { ForgePanel } from '@/modules/crafting/components/ForgePanel';
import { useCrafting } from '@/views/game/domainHooks/useCrafting';
import { useGameStore } from '@/views/game/state/GameStore';

export function ForgePage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const crafting = useCrafting();

  return (
    <ForgePanel
      inventory={p.inventory}
      playerLevel={p.level}
      forging={gameState.forging}
      onStartForging={crafting.startForging}
      onFinishForging={crafting.finishForging}
    />
  );
}
