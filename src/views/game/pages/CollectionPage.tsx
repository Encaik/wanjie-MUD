/**
 * CollectionPage — 图鉴面板页面（纯展示，无 Hook）
 */

'use client';

import { CollectionPanel } from '@/modules/collection/components/CollectionPanel';
import { useGameStore } from '@/views/game/state/GameStore';

export function CollectionPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;

  return (
    <CollectionPanel
      techniques={p.techniques}
      equipments={p.equipments}
      statistics={gameState.statistics}
    />
  );
}
