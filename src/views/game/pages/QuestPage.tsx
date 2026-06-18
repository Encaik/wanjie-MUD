/**
 * QuestPage — 任务面板页面
 *
 * 板块驱动的任务中心。弹窗由 quest.dialog 驱动，
 * 教程进度由 storyEngine 驱动。不再依赖旧的 TutorialState。
 */

'use client';

import { QuestPanel, useQuest } from '@/modules/quest';
import { useGameStore } from '@/views/game/state/GameStore';

export function QuestPage() {
  const { gameState, dispatch } = useGameStore();
  const quest = useQuest(gameState, dispatch);

  return <QuestPanel quest={quest} />;
}
