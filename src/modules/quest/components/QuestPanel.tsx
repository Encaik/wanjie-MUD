/**
 * QuestPanel — 板块驱动任务中心 + 任务弹窗
 *
 * 弹窗由 quest.dialog 驱动：任务变为"可接取"时，若未查看过弹窗则弹出。
 *
 * @module modules/quest
 */

'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Circle, ScrollText, Lock, Gift, Clock, RefreshCw, Sparkles, X } from 'lucide-react';

import { BoardRegistry } from '@/core/registry/BoardRegistry';
import type { QuestDefinition, QuestDialog } from '@/core/types';
import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Button } from '@/shared/ui/actions/button';

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
  const [dialog, setDialog] = useState<QuestDialog | null>(null);
  const [dialogQuestId, setDialogQuestId] = useState<string | null>(null);

  // ===== 弹窗检测：任务变为可接取时检查是否有未查看的弹窗 =====
  useEffect(() => {
    for (const board of boards) {
      if (board.state !== 'available') continue;
      for (const q of board.quests) {
        if (!q.dialog) continue;
        if (quest.hasViewedDialog?.(q.id)) continue;
        setDialog(q.dialog);
        setDialogQuestId(q.id);
        return; // 一次只弹一个
      }
    }
  }, [boards, quest]);

  const handleTabChange = useCallback((boardId: string) => {
    const b = boards.find(x => x.id === boardId);
    if (b?.state === 'locked') return;
    setActiveTab(boardId);
    quest.refreshBoardIfNeeded(boardId);
  }, [boards, quest]);

  const handleDismissDialog = useCallback(() => {
    if (dialogQuestId) {
      quest.markDialogViewed(dialogQuestId);
    }
    setDialog(null);
    setDialogQuestId(null);
  }, [dialogQuestId, quest]);

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
        {/* ===== 教程进度条（检测 tutorial 板块的故事线进度） ===== */}
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

            {(activeBoard.state === 'available' || activeBoard.state === 'claimable') && (
              <div className="space-y-1.5">
                {activeBoard.quests.map(q => (
                  <QuestRow
                    key={q.id}
                    quest={q}
                    isClaimable={quest.getBoardUIState(activeBoard.id) === 'claimable'}
                    onAccept={() => quest.acceptQuest(q.id)}
                    onClaim={() => quest.claimQuestReward(q.id)}
                  />
                ))}
              </div>
            )}

            {(activeBoard.state === 'cooling_down' || activeBoard.state === 'completed') && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {activeBoard.state === 'cooling_down' ? (
                  <><Clock className="w-5 h-5 mx-auto mb-1 text-blue-400" />任务冷却中</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-game-recovery" />全部完成</>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* ===== 任务弹窗 ===== */}
      {dialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="bg-card border border-border rounded-lg p-4 mx-4 max-w-sm w-full shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-game-cultivation" />
                <h3 className="text-sm font-semibold text-foreground">{dialog.title}</h3>
              </div>
              <button onClick={handleDismissDialog} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground whitespace-pre-line mb-3">
              {dialog.content}
            </div>
            <Button onClick={handleDismissDialog} className="w-full text-xs" size="sm">
              {dialog.confirmText ?? '知道了'}
            </Button>
          </div>
        </div>
      )}
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

function QuestRow({ quest, isClaimable, onAccept, onClaim }: {
  quest: QuestDefinition;
  isClaimable: boolean;
  onAccept: () => void;
  onClaim: () => void;
}) {
  return (
    <div className="bg-muted/30 rounded p-2 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isClaimable
            ? <Gift className="w-3 h-3 text-amber-500 flex-shrink-0" />
            : <Circle className="w-3 h-3 text-game-cultivation flex-shrink-0" />
          }
          <span className="text-xs font-medium text-foreground truncate">{quest.name}</span>
          {quest.difficulty && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{quest.difficulty}</Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{quest.description}</p>
      </div>
      <button
        onClick={isClaimable ? onClaim : onAccept}
        className={`flex-shrink-0 px-2 py-1 text-[10px] font-medium rounded transition-colors ${
          isClaimable
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-game-cultivation/10 text-game-cultivation'
        }`}
      >
        {isClaimable ? (
          <span className="flex items-center gap-1"><Gift className="w-2.5 h-2.5" />领取</span>
        ) : '接取'}
      </button>
    </div>
  );
}
