'use client';

import { useMemo } from 'react';
import { Sparkles, CheckCircle2, Circle, ScrollText, ChevronRight } from 'lucide-react';

import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Progress } from '@/shared/ui/feedback/progress';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type { GameStatistics, QuestState, ActiveEffect } from '@/core/types';
import { TUTORIAL_TASKS, checkTutorialProgress } from '../logic/tutorialTasks';
import type { TutorialTask } from '../logic/tutorialTasks';

interface QuestPanelProps {
  /** 已完成的新手任务 ID 列表 */
  completedTutorialTaskIds: string[];
  /** 角色等级（用于新手任务检查） */
  level: number;
  /** 活跃效果（用于构造临时 protagonist） */
  activeEffects: ActiveEffect[];
  /** 统计数据 */
  statistics: GameStatistics;
  /** quest 引擎任务状态 */
  questState: QuestState;
}

/**
 * QuestPanel — 统一任务面板
 *
 * 展示新手引导任务和 quest 引擎中的进行中任务。
 * 两部分上下排列，用分隔线区分。
 */
export function QuestPanel({
  completedTutorialTaskIds,
  level,
  activeEffects,
  statistics,
  questState,
}: QuestPanelProps) {
  // 新手引导进度
  const tutorialProgress = useMemo(() => {
    // 构造临时 protagonist 用于检查任务进度（checkTutorialProgress 仅使用 level/activeEffects 字段）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 仅传递任务检查所需的最小字段
    const tempProtagonist = { level, activeEffects, statistics } as any;
    return checkTutorialProgress(
      tempProtagonist,
      statistics,
      completedTutorialTaskIds,
    );
  }, [level, activeEffects, statistics, completedTutorialTaskIds]);

  const { completedTasks, currentTask, progress } = tutorialProgress;

  // quest 引擎进行中的任务
  const activeQuestEntries = useMemo(() => {
    const registry = QuestRegistry.getInstance();
    return Object.entries(questState.activeQuests).map(([questId, active]) => {
      const quest = registry.getById(questId);
      return {
        questId,
        questName: quest?.name ?? questId,
        currentStageId: active.currentStageId,
        objectives: active.objectives,
      };
    });
  }, [questState.activeQuests]);

  const tutorialAllDone = progress >= 1;
  const hasActiveQuests = activeQuestEntries.length > 0;

  return (
    <Card className="relative overflow-hidden">
      <CardCornerDecorations />
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="w-4 h-4 text-primary" />
          任务
          {completedTasks.length > 0 && !tutorialAllDone && (
            <span className="text-[10px] text-muted-foreground font-normal ml-auto">
              {completedTasks.length}/{TUTORIAL_TASKS.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 新手引导区 */}
        {!tutorialAllDone && (
          <div className="bg-gradient-to-r from-game-cultivation/10 to-game-mental/10 rounded-lg p-2 border border-game-cultivation/30">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-game-cultivation">
                <Sparkles className="w-3.5 h-3.5" />
                <span>新手引导</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {completedTasks.length}/{TUTORIAL_TASKS.length}
              </Badge>
            </div>

            {/* 进度条 */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-game-cultivation to-game-mental rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* 当前任务 */}
            {currentTask && (
              <div className="bg-card rounded p-2 space-y-1">
                <div className="flex items-start gap-1.5">
                  <Circle className="w-3 h-3 text-game-cultivation mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">
                      {(currentTask as TutorialTask).title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {(currentTask as TutorialTask).description}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-game-cultivation bg-game-cultivation/10 px-1.5 py-0.5 rounded">
                  💡 {(currentTask as TutorialTask).hint}
                </div>
              </div>
            )}

            {/* 已完成任务列表 */}
            {completedTasks.length > 0 && (
              <div className="mt-1.5 space-y-0.5">
                {TUTORIAL_TASKS.filter(t => completedTasks.includes(t.id)).map(task => (
                  <div key={task.id} className="flex items-center gap-1 text-[10px] text-game-recovery">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span className="line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* quest 引擎进行中任务区 */}
        {hasActiveQuests && (
          <>
            {!tutorialAllDone && (
              <div className="border-t border-border/50" />
            )}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">
                进行中的任务
              </div>
              {activeQuestEntries.map(entry => (
                <div
                  key={entry.questId}
                  className="bg-muted/30 rounded p-2 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {entry.questName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      阶段：{entry.currentStageId}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* 空状态 */}
        {tutorialAllDone && !hasActiveQuests && (
          <div className="text-xs text-muted-foreground text-center py-3">
            暂无进行中的任务
          </div>
        )}
      </CardContent>
    </Card>
  );
}
