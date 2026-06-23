/**
 * FactionPage — 势力面板页面
 *
 * 调用 useFaction + useAdventure（历练事件），渲染势力面板。
 */

'use client';

import { useCallback } from 'react';

import { getRandomEvent } from '@/modules/exploration/logic/dungeon/events';
import { FactionPanel } from '@/modules/faction/components/FactionPanel';
import { getCurrencyAmount } from '@/modules/item/logic';
import { useFaction } from '@/views/game/domainHooks/useFaction';
import { useGameStore } from '@/views/game/state/GameStore';

export function FactionPage() {
  const { gameState, dispatch: setGameState } = useGameStore();
  const p = gameState.protagonist!;
  const faction = useFaction();

  // 简化历练（随机事件）
  const startExperience = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentEvent: p ? getRandomEvent(p.world.type) : null,
    }));
  }, [setGameState, p]);

  const handleEventChoice = useCallback((choiceIndex: number) => {
    setGameState(prev => {
      if (!prev.currentEvent) return prev;
      const choice = prev.currentEvent.choices[choiceIndex];
      return {
        ...prev,
        currentEvent: null,
        lastActionResult: { success: true, message: choice?.result || '事件已处理' },
      };
    });
  }, [setGameState]);

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
      onExplore={startExperience}
      onChoose={handleEventChoice}
      playerLevel={p.level}
    />
  );
}
