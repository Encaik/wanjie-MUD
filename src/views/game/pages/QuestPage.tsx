/**
 * QuestPage — 任务面板页面
 *
 * 统一展示新手引导任务和 quest 引擎进行中的任务。
 */

'use client';

import { QuestPanel } from '@/modules/quest';
import { useGameStore } from '@/views/game/state/GameStore';

export function QuestPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;

  return (
    <QuestPanel
      completedTutorialTaskIds={gameState.completedTutorialTaskIds || []}
      level={p.level}
      activeEffects={p.activeEffects}
      statistics={gameState.statistics}
      questState={gameState.questState}
    />
  );
}
