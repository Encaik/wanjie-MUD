/**
 * QuestPanel — 板块驱动任务中心
 *
 * 数据驱动的通用任务面板。引导弹窗在任务接取时通过全局 DialogLayer 弹出，
 * 不再在渲染时扫全部未查看弹窗。教程板块单槽顺序推进。
 *
 * @module modules/quest
 */

'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';

import { CheckCircle2, Circle, ScrollText, Lock, Gift, Clock, RefreshCw, Sparkles } from 'lucide-react';

import { BoardRegistry } from '@/core/registry/BoardRegistry';
import type { QuestDefinition } from '@/core/types';
import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { openDialog } from '@/views/game/dialogs/useDialogController';

import type { UseQuestReturn } from '../hooks/useQuest';

// ============================================
// 常量
// ============================================

const BOARD_STATE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  locked: Lock, empty: ScrollText, available: Circle,
  claimable: Gift, cooling_down: Clock, completed: CheckCircle2,
};

const STATE_COLORS: Record<string, string> = {
  locked: 'text-muted-foreground', empty: 'text-muted-foreground',
  available: 'text-game-cultivation', claimable: 'text-amber-500',
  cooling_down: 'text-blue-400', completed: 'text-game-recovery',
};

// ============================================
// Props
// ============================================

interface QuestPanelProps {
  quest: UseQuestReturn;
}

// ============================================
// 组件
// ============================================

export function QuestPanel({ quest }: QuestPanelProps) {
  const boards = useMemo(() => {
    const all = BoardRegistry.getInstance().getAll();
    return all.map(b => ({
      ...b,
      state: quest.getBoardUIState(b.id),
      quests: quest.getBoardQuests(b.id),
    }));
  }, [quest]);

  const [activeTab, setActiveTab] = useState<string>(boards[0]?.id ?? '');

  // ===== 板块出现时刷新填充槽位 =====
  // 板块可能异步注册（GameStore 动态 import initQuestRegistries），
  // 用 boards.length 作为依赖确保板块出现后立即刷新。
  useEffect(() => {
    if (boards.length === 0) return;
    const allBoards = BoardRegistry.getInstance().getAll();
    for (const board of allBoards) {
      quest.refreshBoardIfNeeded(board.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.length]);

  const handleTabChange = useCallback((boardId: string) => {
    const b = boards.find(x => x.id === boardId);
    if (b?.state === 'locked') return;
    setActiveTab(boardId);
    quest.refreshBoardIfNeeded(boardId);
  }, [boards, quest]);

  /**
   * 接取任务 + 弹窗触发
   *
   * 接取后若任务有引导弹窗且未查看过，通过全局 DialogLayer 弹出。
   * 弹窗确认时标记已查看，阻止重复弹出。
   */
  const handleAccept = useCallback((q: QuestDefinition) => {
    quest.acceptQuest(q.id);

    // 任务有弹窗且未查看 → 全局弹窗
    if (q.dialog && !quest.hasViewedDialog(q.id)) {
      const currencyName = quest.getCurrencyName();
      openDialog('questDialog', {
        title: q.dialog.title.replace(/\{currency\}/g, currencyName),
        content: q.dialog.content.replace(/\{currency\}/g, currencyName),
        confirmText: q.dialog.confirmText ?? '知道了',
        onDismiss: () => {
          quest.markDialogViewed?.(q.id);
        },
      });
    }
  }, [quest]);

  const handleClaim = useCallback((q: QuestDefinition) => {
    quest.claimQuestReward(q.id);

    // 领取后若任务有完成弹窗 → 全局弹窗
    if (q.dialog && !quest.hasViewedDialog(q.id)) {
      const currencyName = quest.getCurrencyName();
      openDialog('questDialog', {
        title: `完成: ${q.name}`,
        content: q.dialog.content.replace(/\{currency\}/g, currencyName),
        confirmText: q.dialog.confirmText ?? '知道了',
        onDismiss: () => {
          quest.markDialogViewed?.(q.id);
        },
      });
    }
  }, [quest]);

  const activeBoard = boards.find(b => b.id === activeTab);

  return (
    <Card className="relative overflow-hidden">
      <CardCornerDecorations />
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="w-4 h-4 text-primary" />
          任务
        </CardTitle>
      </CardHeader>

      {/* 动态板块 Tab */}
      <div className="px-3 flex gap-1 overflow-x-auto pb-1">
        {boards.map(board => {
          const isActive = activeTab === board.id;
          const Icon = BOARD_STATE_ICONS[board.state] ?? Circle;

          return (
            <button
              key={board.id}
              onClick={() => handleTabChange(board.id)}
              className={`
                relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-t-lg transition-all flex-shrink-0
                ${isActive ? 'bg-card text-game-cultivation border-t border-l border-r border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}
                ${board.state === 'locked' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={board.state === 'locked'}
            >
              <Icon className={`w-3 h-3 ${STATE_COLORS[board.state] ?? ''}`} />
              {board.name}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-game-cultivation to-game-mental" />
              )}
            </button>
          );
        })}
      </div>

      <CardContent className="pt-2 pb-2 space-y-2">
        {/* 教程进度条 */}
        {activeTab === 'board_tutorial' && (
          <TutorialProgress quest={quest} boards={boards} />
        )}

        {activeBoard && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{activeBoard.description}</span>
              {activeBoard.refreshRule.type !== 'never' && (
                <button
                  onClick={() => quest.refreshBoardIfNeeded(activeBoard.id)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeBoard.state === 'locked' && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <Lock className="w-6 h-6 mx-auto mb-1 opacity-30" />
                前置条件未满足，暂未解锁
              </div>
            )}

            {activeBoard.state === 'empty' && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <ScrollText className="w-6 h-6 mx-auto mb-1 opacity-30" />
                暂无可用任务
              </div>
            )}

            {(activeBoard.state === 'available' || activeBoard.state === 'claimable' || activeBoard.state === 'completed') && (
              <div className="space-y-1.5">
                {activeBoard.quests.map(q => {
                  const questState = quest.getQuestState(q.id);

                  return (
                    <QuestRow
                      key={q.id}
                      quest={q}
                      questState={questState}
                      onAccept={() => handleAccept(q)}
                      onClaim={() => handleClaim(q)}
                    />
                  );
                })}
              </div>
            )}

            {activeBoard.state === 'cooling_down' && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <Clock className="w-5 h-5 mx-auto mb-1 text-blue-400" />任务冷却中
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 教程进度条
// ============================================

function TutorialProgress({ quest, boards }: { quest: UseQuestReturn; boards: Array<{ id: string; quests: QuestDefinition[] }> }) {
  const progress = useMemo(() => quest.getStoryProgress('storyline_tutorial'), [quest]);
  if (!progress || progress.allCompleted) return null;

  const tutorialBoard = boards.find(b => b.id === 'board_tutorial');
  const totalQuests = tutorialBoard?.quests.length ?? 0;

  return (
    <div className="bg-gradient-to-r from-game-cultivation/10 to-game-mental/10 rounded-lg p-2 border border-game-cultivation/30">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-game-cultivation" />
        <span className="text-xs font-medium text-game-cultivation">新手引导</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {progress.completedQuestCount}/{progress.totalQuestCount}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-game-cultivation to-game-mental rounded-full transition-all"
          style={{ width: `${Math.max(progress.progress * 100, totalQuests > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// 任务行
// ============================================

interface QuestRowState {
  completed: boolean;
  claimed: boolean;
  active: boolean;
}

function QuestRow({ quest, questState, onAccept, onClaim }: {
  quest: QuestDefinition;
  questState: QuestRowState;
  onAccept: () => void;
  onClaim: () => void;
}) {
  const { completed, claimed, active } = questState;

  let statusIcon: React.ReactNode;
  let actionButton: React.ReactNode;

  if (claimed) {
    statusIcon = <CheckCircle2 className="w-3 h-3 text-game-recovery flex-shrink-0" />;
    actionButton = (
      <span className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-game-recovery">
        已领取
      </span>
    );
  } else if (completed && !claimed) {
    statusIcon = <Gift className="w-3 h-3 text-amber-500 flex-shrink-0" />;
    actionButton = (
      <button
        onClick={onClaim}
        className="flex-shrink-0 px-2 py-1 text-[10px] font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-colors hover:bg-amber-200 dark:hover:bg-amber-900/50"
      >
        <span className="flex items-center gap-1"><Gift className="w-2.5 h-2.5" />领取</span>
      </button>
    );
  } else if (active) {
    statusIcon = <Circle className="w-3 h-3 text-blue-400 flex-shrink-0" />;
    actionButton = (
      <span className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-blue-400">
        进行中
      </span>
    );
  } else {
    statusIcon = <Circle className="w-3 h-3 text-game-cultivation flex-shrink-0" />;
    actionButton = (
      <button
        onClick={onAccept}
        className="flex-shrink-0 px-2 py-1 text-[10px] font-medium rounded bg-game-cultivation/10 text-game-cultivation transition-colors hover:bg-game-cultivation/20"
      >
        接取
      </button>
    );
  }

  return (
    <div className="bg-muted/30 rounded p-2 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {statusIcon}
          <span className={`text-xs font-medium truncate ${claimed ? 'text-muted-foreground' : 'text-foreground'}`}>
            {quest.name}
          </span>
          {quest.difficulty && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{quest.difficulty}</Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{quest.description}</p>
      </div>
      {actionButton}
    </div>
  );
}
