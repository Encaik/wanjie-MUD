/**
 * QuestPage — 任务面板页面
 *
 * Tab 式任务中心：新手引导 | 势力任务 | NPC 任务
 */

'use client';

import { QuestPanel } from '@/modules/quest';
import { createDefaultTutorialState } from '@/modules/quest';
import { useGameStore } from '@/views/game/state/GameStore';

export function QuestPage() {
  const { gameState } = useGameStore();

  return (
    <QuestPanel
      tutorialState={gameState.tutorialState || createDefaultTutorialState()}
      statistics={gameState.statistics}
      questState={gameState.questState}
      factionJoined={!!gameState.protagonist?.factionId}
    />
  );
}
