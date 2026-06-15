/**
 * AlchemyPage — 炼丹面板页面
 *
 * 调用 useCrafting，渲染炼丹面板。
 */

'use client';

import { AlchemyPanel } from '@/modules/crafting/components/AlchemyPanel';
import { useCrafting } from '@/views/game/domainHooks/useCrafting';
import { useGameStore } from '@/views/game/state/GameStore';

export function AlchemyPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const crafting = useCrafting();

  return (
    <AlchemyPanel
      inventory={p.inventory}
      playerLevel={p.level}
      crafting={gameState.crafting}
      onStartCrafting={crafting.startCrafting}
      onFinishCrafting={crafting.finishCrafting}
    />
  );
}
