/**
 * StatisticsPage — 统计面板页面（纯展示，无 Hook）
 */

'use client';

import { StatisticsPanel } from '@/modules/collection/components/StatisticsPanel';
import { useGameStore } from '@/views/game/state/GameStore';

export function StatisticsPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;

  return (
    <StatisticsPanel
      statistics={gameState.statistics}
      protagonist={p}
    />
  );
}
