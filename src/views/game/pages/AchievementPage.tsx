/**
 * AchievementPage — 成就面板页面
 *
 * 调用 useFaction（claimAchievementReward），渲染成就面板。
 */

'use client';

import { AchievementPanel } from '@/modules/collection/components/AchievementPanel';
import { useFaction } from '@/views/game/domainHooks/useFaction';
import { useGameStore } from '@/views/game/state/GameStore';

export function AchievementPage() {
  const { gameState } = useGameStore();
  const faction = useFaction();

  return (
    <AchievementPanel
      statistics={gameState.statistics}
      unlockedAchievementIds={gameState.unlockedAchievementIds}
      claimedAchievementIds={gameState.claimedAchievementIds}
      onClaimReward={faction.claimAchievementReward}
    />
  );
}
