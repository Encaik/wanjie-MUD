/**
 * 机缘路由页面 — 接入新 fortune 模块
 */

'use client';

import { useMemo } from 'react';
import { FortunePage } from '@/views/game/pages/FortunePage';
import { useFortune } from '@/modules/fortune';
import { useGameStore } from '@/views/game/state/GameStore';

export default function Page() {
  const { gameState, dispatch: setGameState } = useGameStore();
  const protagonist = gameState.protagonist;

  const fortune = useFortune({
    slice: gameState.fortuneSlice,
    updateSlice: (updater) => {
      setGameState((prev) => ({
        ...prev,
        fortuneSlice: updater(prev.fortuneSlice),
      }));
    },
    wuxing: protagonist?.stats?.base?.悟性 ?? 10,
    lingshi: protagonist?.stats?.base?.灵根 ?? 10,
    maxHp: protagonist?.maxHp ?? 100,
    maxMp: protagonist?.maxMp ?? 100,
    playerLevel: protagonist?.level ?? 1,
    seed: Date.now(),
  });

  return <FortunePage fortuneSlice={gameState.fortuneSlice} fortune={fortune} />;
}
