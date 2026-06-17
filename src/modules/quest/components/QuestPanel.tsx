/**
 * QuestPanel — Tab 式任务中心
 *
 * 三个 Tab 独立展示不同的任务系统：
 * - 新手引导：分阶段步骤 + 进度条 + 弹窗触发
 * - 势力任务：日常/周常任务列表
 * - NPC 任务：QuestEngine 进行中的任务
 *
 * @module modules/quest
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ScrollText,
  ChevronRight,
  Swords,
  Users,
  Lock,
  Gift,
} from 'lucide-react';

import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Progress } from '@/shared/ui/feedback/progress';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type { GameStatistics, QuestState } from '@/core/types';

import { TUTORIAL_GUIDE } from '../logic/tutorialGuide';
import type { TutorialPhase, TutorialStep } from '../logic/tutorialGuide';
import {
  getTutorialProgressInfo,
  isStepRewardClaimable,
} from '../logic/taskProgressTracker';
import type { TutorialState } from '../logic/taskProgressTracker';

// ============================================
// Tab 类型
// ============================================

type QuestTab = 'tutorial' | 'faction' | 'npc';

interface TabConfig {
  id: QuestTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  locked?: boolean;
}

// ============================================
// Props
// ============================================

interface QuestPanelProps {
  /** 新手引导状态 */
  tutorialState: TutorialState;
  /** 统计数据 */
  statistics: GameStatistics;
  /** quest 引擎状态 */
  questState: QuestState;
  /** 是否已加入势力 */
  factionJoined?: boolean;
  /** 领取步骤奖励回调 */
  onClaimStepReward?: (stepId: string) => void;
}

// ============================================
// 组件
// ============================================

export function QuestPanel({
  tutorialState,
  statistics: _statistics,
  questState,
  factionJoined = false,
  onClaimStepReward,
}: QuestPanelProps) {
  const [activeTab, setActiveTab] = useState<QuestTab>(
    tutorialState?.completed ? 'npc' : 'tutorial',
  );

  const tutorialInfo = useMemo(
    () => getTutorialProgressInfo(tutorialState),
    [tutorialState],
  );

  const tabs: TabConfig[] = useMemo(() => [
    {
      id: 'tutorial',
      label: '新手引导',
      icon: Sparkles,
    },
    {
      id: 'faction',
      label: '势力任务',
      icon: Swords,
      locked: tutorialInfo.allCompleted ? !factionJoined : true,
    },
    {
      id: 'npc',
      label: 'NPC 任务',
      icon: Users,
      locked: !tutorialInfo.allCompleted,
    },
  ], [tutorialInfo.allCompleted, factionJoined]);

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

  const handleTabChange = useCallback((tab: QuestTab) => {
    const config = tabs.find(t => t.id === tab);
    if (config?.locked) return;
    setActiveTab(tab);
  }, [tabs]);

  const currentPhase = tutorialInfo.currentPhase;
  const currentStep = tutorialInfo.currentStep;
  const completedSteps = TUTORIAL_GUIDE.phases.flatMap((p: TutorialPhase) =>
    p.steps.filter((s: TutorialStep) => tutorialState?.completedStepIds.includes(s.id)),
  );

  return (
    <Card className="relative overflow-hidden">
      <CardCornerDecorations />
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="w-4 h-4 text-primary" />
          任务
        </CardTitle>
      </CardHeader>

      {/* Tab 栏 */}
      <div className="px-3 flex gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all
                ${isActive
                  ? 'bg-card text-game-cultivation border-t border-l border-r border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }
                ${tab.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={tab.locked}
            >
              {tab.locked ? <Lock className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-game-cultivation to-game-mental" />
              )}
            </button>
          );
        })}
      </div>

      <CardContent className="pt-2 pb-2 space-y-2">
        {/* ===== 新手引导 Tab ===== */}
        {activeTab === 'tutorial' && (
          <div className="space-y-2">
            {tutorialInfo.allCompleted ? (
              // 引导已完成
              <div className="bg-gradient-to-r from-game-cultivation/10 to-game-mental/10 rounded-lg p-3 text-center border border-game-cultivation/30">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <div className="text-sm font-medium text-game-cultivation">🎉 新手引导已全部完成！</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  正式任务系统已解锁，查看 NPC 任务和势力任务获取更多挑战。
                </div>
              </div>
            ) : (
              <>
                {/* 总进度条 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Progress
                      value={tutorialInfo.progress * 100}
                      className="h-1.5 bg-muted"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {tutorialInfo.completedStepCount}/{tutorialInfo.totalStepCount}
                  </span>
                </div>

                {/* 阶段指示器 */}
                <div className="flex gap-1 justify-center">
                  {TUTORIAL_GUIDE.phases.map((phase: TutorialPhase) => {
                    const isComplete = tutorialState?.completedPhaseIds.includes(phase.id);
                    const isCurrent = phase.id === tutorialInfo.currentPhase?.id;
                    return (
                      <div
                        key={phase.id}
                        className={`
                          flex-1 h-1 rounded-full transition-all
                          ${isComplete ? 'bg-game-recovery' : ''}
                          ${isCurrent ? 'bg-game-cultivation' : ''}
                          ${!isComplete && !isCurrent ? 'bg-muted' : ''}
                        `}
                        title={phase.name}
                      />
                    );
                  })}
                </div>

                {/* 当前阶段信息 */}
                {currentPhase && (
                  <div className="bg-gradient-to-r from-game-cultivation/10 to-game-mental/10 rounded-lg p-2 border border-game-cultivation/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-game-cultivation" />
                      <span className="text-xs font-medium text-game-cultivation">
                        {currentPhase.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        阶段 {tutorialInfo.completedPhaseCount + 1}/{tutorialInfo.totalPhaseCount}
                      </span>
                    </div>

                    {/* 当前步骤 */}
                    {currentStep && (
                      <div className="bg-card rounded p-2 space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <Circle className="w-3 h-3 text-game-cultivation mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground">
                              {currentStep.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {currentStep.description}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-game-cultivation bg-game-cultivation/10 px-1.5 py-0.5 rounded">
                          💡 {currentStep.hint}
                        </div>
                        {/* 当前步骤的领取奖励按钮 */}
                        {currentStep.stepReward && !tutorialState.claimedRewardStepIds.includes(currentStep.id) && onClaimStepReward && (
                          <button
                            onClick={() => onClaimStepReward(currentStep.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium
                              bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                              hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors
                              border border-amber-300/50 dark:border-amber-700/50"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            领取奖励
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 已完成步骤列表 */}
                {completedSteps.length > 0 && (
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {completedSteps.map(step => {
                      const canClaim = isStepRewardClaimable(step.id, tutorialState);
                      return (
                        <div key={step.id} className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0 text-game-recovery" />
                          <span className="line-through text-game-recovery flex-1">{step.name}</span>
                          {canClaim && onClaimStepReward && (
                            <button
                              onClick={() => onClaimStepReward(step.id)}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium
                                bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                                hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex-shrink-0"
                            >
                              <Gift className="w-2.5 h-2.5" />
                              领取
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== 势力任务 Tab ===== */}
        {activeTab === 'faction' && (
          <div className="space-y-2">
            {tabs.find(t => t.id === 'faction')?.locked ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <Lock className="w-5 h-5 mx-auto mb-1 opacity-30" />
                {!tutorialInfo.allCompleted
                  ? '完成新手引导后解锁'
                  : '加入势力后解锁'}
              </div>
            ) : (
              // TODO: 接入势力任务数据
              <div className="text-center py-4 text-xs text-muted-foreground">
                势力任务系统即将开放
              </div>
            )}
          </div>
        )}

        {/* ===== NPC 任务 Tab ===== */}
        {activeTab === 'npc' && (
          <div className="space-y-2">
            {tabs.find(t => t.id === 'npc')?.locked ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <Lock className="w-5 h-5 mx-auto mb-1 opacity-30" />
                完成新手引导后解锁 NPC 任务
              </div>
            ) : activeQuestEntries.length > 0 ? (
              <div className="space-y-1.5">
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
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <ScrollText className="w-5 h-5 mx-auto mb-1 opacity-30" />
                暂无进行中的任务
                <br />
                <span className="text-[10px]">与 NPC 对话可接取新任务</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
