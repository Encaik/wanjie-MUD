/**
 * FactionPage — 势力面板页面
 *
 * 调用 useFaction + useAdventure（历练事件），渲染势力面板。
 */

'use client';

import { FactionPanel } from '@/modules/faction/components/FactionPanel';
import { useAdventure } from '@/views/game/domainHooks/useAdventure';
import { useFaction } from '@/views/game/domainHooks/useFaction';
import { useGameStore } from '@/views/game/state/GameStore';
import { getCurrencyAmount } from '@/modules/item/logic';

export function FactionPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const faction = useFaction();
  const adventure = useAdventure();

  return (
    <FactionPanel
      worldType={p.world.type}
      worldFactions={p.world.factions}
      currentFactionId={p.factionId}
      factionProgress={p.factionProgress}
      contribution={p.currencies?.contribution ?? 0}
      onJoinFaction={faction.joinFaction}
      onLeaveFaction={faction.leaveFaction}
      onAcceptTask={faction.acceptTask}
      onSubmitTask={faction.submitTask}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FactionPanel 的 onRefreshTasks 类型与 hook 返回不完全匹配，与旧 PanelContent 保持一致
      onRefreshTasks={() => faction.refreshTasks() as any}
      onClaimDailySalary={faction.claimDailySalary}
      onPromoteRank={faction.promoteRank}
      spiritStoneCount={getCurrencyAmount(p.items, 'wanjie:common:spirit_stone')}
      onDonate={faction.donate}
      currentEvent={gameState.currentEvent}
      onExplore={adventure.startExperience}
      onChoose={adventure.handleEventChoice}
      playerLevel={p.level}
    />
  );
}
