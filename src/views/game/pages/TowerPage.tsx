/**
 * TowerPage — 试炼塔面板页面
 *
 * 调用 useBattle，渲染试炼塔面板。
 */

'use client';

import { TowerPanel } from '@/modules/tower/components/TowerPanel';
import { createDefaultTowerProgress } from '@/modules/tower/logic/types';
import { useBattle } from '@/views/game/domainHooks/useBattle';
import { useGameStore } from '@/views/game/state/GameStore';

export function TowerPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const battle = useBattle();

  return (
    <TowerPanel
      towerProgress={p.towerProgress ?? createDefaultTowerProgress()}
      playerLevel={p.level}
      worldBalanceStats={p.world.worldStats}
      currentHp={p.currentHp}
      maxHp={p.maxHp}
      currentMp={p.currentMp}
      maxMp={p.maxMp}
      currentStamina={p.stamina ?? 100}
      maxStamina={p.maxStamina ?? 100}
      disabled={false}
      onChallenge={(floor, enemy) => battle.challengeTower(floor, enemy)}
    />
  );
}
