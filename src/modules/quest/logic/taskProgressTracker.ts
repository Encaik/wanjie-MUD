/**
 * 任务进度追踪器 — 事件驱动实现
 *
 * 接收游戏事件，检查新手引导步骤完成情况。
 * 所有函数皆为纯函数，不产生副作用。
 *
 * @module modules/quest/logic
 */

import type { Protagonist } from '@/core/types';
import type { GameEvent } from '@/core/events';

import { TUTORIAL_GUIDE } from './tutorialGuide';
import type { TutorialStep, TutorialPhase } from './tutorialGuide';
import type { TaskReward } from '../types';

// ============================================
// 引导状态类型
// ============================================

/**
 * 新手引导持久化状态
 *
 * 存储在 GameState.tutorialState 中，支持存档读档。
 */
export interface TutorialState {
  /** 是否已完成全部引导 */
  completed: boolean;
  /** 当前阶段 ID */
  currentPhaseId: string;
  /** 当前步骤 ID */
  currentStepId: string;
  /** 已完成步骤 ID 列表 */
  completedStepIds: string[];
  /** 已完成的阶段 ID 列表 */
  completedPhaseIds: string[];
  /** 已查看过的弹窗步骤 ID 列表 */
  viewedDialogStepIds: string[];
}

/**
 * 引导进度检查结果
 */
export interface TutorialProgressResult {
  /** 更新后的引导状态 */
  tutorialState: TutorialState;
  /** 新完成的步骤（如果有） */
  newlyCompletedStep?: TutorialStep;
  /** 新完成的阶段（如果有） */
  newlyCompletedPhase?: TutorialPhase;
  /** 待发放的阶段奖励（如果有） */
  phaseRewardToClaim?: TaskReward;
  /** 待发放的步骤奖励（如果有） */
  stepRewardToClaim?: TaskReward;
  /** 是否全部引导完成 */
  allCompleted: boolean;
}

// ============================================
// 默认状态
// ============================================

/**
 * 创建默认引导状态（新玩家）
 */
export function createDefaultTutorialState(): TutorialState {
  return {
    completed: false,
    currentPhaseId: TUTORIAL_GUIDE.phases[0].id,
    currentStepId: TUTORIAL_GUIDE.phases[0].steps[0].id,
    completedStepIds: [],
    completedPhaseIds: [],
    viewedDialogStepIds: [],
  };
}

// ============================================
// 核心检查函数
// ============================================

/**
 * 检查引导进度
 *
 * 接收一个游戏事件，检查当前步骤是否完成。
 * 如果完成，返回更新后的状态和奖励信息。
 *
 * @param event - 游戏事件
 * @param state - 当前引导状态
 * @param protagonist - 主角数据
 * @returns 进度检查结果
 */
export function checkTutorialProgress(
  event: GameEvent,
  state: TutorialState,
  protagonist: Protagonist,
): TutorialProgressResult {
  // 引导已全部完成，不做任何处理
  if (state.completed) {
    return {
      tutorialState: state,
      allCompleted: true,
    };
  }

  // 查找当前步骤
  const currentStep = findCurrentStep(state);
  if (!currentStep) {
    // 引导已全部完成
    return {
      tutorialState: { ...state, completed: true },
      allCompleted: true,
    };
  }

  // 检查当前步骤是否匹配此事件
  if (event.type !== currentStep.triggerEvent) {
    return { tutorialState: state, allCompleted: false };
  }

  // 检查步骤条件
  if (!currentStep.condition(event, protagonist)) {
    return { tutorialState: state, allCompleted: false };
  }

  // 步骤完成！
  const newCompletedStepIds = [...state.completedStepIds, currentStep.id];

  // 检查当前阶段是否所有步骤都完成
  const currentPhase = findCurrentPhase(state);
  if (!currentPhase) {
    return {
      tutorialState: { ...state, completed: true },
      allCompleted: true,
    };
  }

  const phaseSteps = currentPhase.steps;
  const phaseStepIds = phaseSteps.map(s => s.id);
  const phaseCompleted = phaseStepIds.every(sid => newCompletedStepIds.includes(sid));

  let newCompletedPhaseIds = state.completedPhaseIds;
  let phaseRewardToClaim: TaskReward | undefined;
  let newlyCompletedPhase: TutorialPhase | undefined;

  if (phaseCompleted && !state.completedPhaseIds.includes(currentPhase.id)) {
    newCompletedPhaseIds = [...state.completedPhaseIds, currentPhase.id];
    phaseRewardToClaim = currentPhase.phaseReward;
    newlyCompletedPhase = currentPhase;
  }

  // 检查全部引导是否完成
  const allPhases = TUTORIAL_GUIDE.phases;
  const allCompleted = allPhases.every(p => newCompletedPhaseIds.includes(p.id));

  // 计算下一步
  let nextStepId = currentStep.id;
  let nextPhaseId = state.currentPhaseId;

  if (phaseCompleted && !allCompleted) {
    // 进入下一阶段
    const nextPhase = allPhases.find(p => p.order === currentPhase.order + 1);
    if (nextPhase) {
      nextPhaseId = nextPhase.id;
      nextStepId = nextPhase.steps[0].id;
    }
  } else if (!phaseCompleted) {
    // 当前阶段内推进到下一步
    const currentStepIndex = phaseSteps.findIndex(s => s.id === currentStep.id);
    const nextStep = phaseSteps[currentStepIndex + 1];
    if (nextStep) {
      nextStepId = nextStep.id;
    }
  }

  const newState: TutorialState = {
    ...state,
    completed: allCompleted,
    currentPhaseId: nextPhaseId,
    currentStepId: nextStepId,
    completedStepIds: newCompletedStepIds,
    completedPhaseIds: newCompletedPhaseIds,
  };

  return {
    tutorialState: newState,
    newlyCompletedStep: currentStep,
    newlyCompletedPhase,
    phaseRewardToClaim,
    stepRewardToClaim: currentStep.stepReward,
    allCompleted,
  };
}

/**
 * 获取当前步骤需要显示的弹窗（如果未查看过）
 *
 * @param state - 引导状态
 * @returns 待显示的弹窗信息，如果已查看或无弹窗则返回 null
 */
export function getPendingDialog(
  state: TutorialState,
): { step: TutorialStep; dialog: NonNullable<TutorialStep['dialog']> } | null {
  if (state.completed) return null;

  const currentStep = findCurrentStep(state);
  if (!currentStep?.dialog) return null;
  if (state.viewedDialogStepIds.includes(currentStep.id)) return null;

  return { step: currentStep, dialog: currentStep.dialog };
}

/**
 * 标记弹窗已查看
 */
export function markDialogViewed(
  state: TutorialState,
  stepId: string,
): TutorialState {
  if (state.viewedDialogStepIds.includes(stepId)) return state;
  return {
    ...state,
    viewedDialogStepIds: [...state.viewedDialogStepIds, stepId],
  };
}

/**
 * 获取当前引导进度信息（用于 UI 展示）
 */
export function getTutorialProgressInfo(state: TutorialState): {
  completedStepCount: number;
  totalStepCount: number;
  completedPhaseCount: number;
  totalPhaseCount: number;
  currentPhase: TutorialPhase | undefined;
  currentStep: TutorialStep | undefined;
  allCompleted: boolean;
  progress: number; // 0-1
} {
  const totalStepCount = getTotalStepCount();
  const totalPhaseCount = TUTORIAL_GUIDE.phases.length;
  const currentPhase = findCurrentPhase(state);
  const currentStep = findCurrentStep(state);

  return {
    completedStepCount: state.completedStepIds.length,
    totalStepCount,
    completedPhaseCount: state.completedPhaseIds.length,
    totalPhaseCount,
    currentPhase,
    currentStep,
    allCompleted: state.completed,
    progress: totalStepCount > 0 ? state.completedStepIds.length / totalStepCount : 0,
  };
}

// ============================================
// 旧角色兼容（检测已有初始物品自动完成阶段 0）
// ============================================

/**
 * 检测旧存档角色是否已有初始物品
 *
 * 如果 backpack 中已有灵石/丹药，说明角色在旧系统中已创建，
 * 阶段 0 应自动完成避免重复发放初始物品。
 *
 * @param protagonist - 主角数据
 * @returns 是否应跳过阶段 0
 */
export function shouldSkipPhaseZero(protagonist: Protagonist): boolean {
  const inventory = protagonist.inventory ?? [];
  const starterItemIds = ['wanjie:common:spirit_stone', 'wanjie:cultivation:qi_gathering_pill', 'wanjie:cultivation:foundation_pill', 'wanjie:common:rejuvenation_pill'];
  // 有至少 2 种初始物品即认为是旧角色
  const foundCount = starterItemIds.filter(id =>
    inventory.some(i => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = i as any;
      const defId = item?.definition?.id ?? item?.templateId;
      return defId === id;
    })
  ).length;
  return foundCount >= 2;
}

/**
 * 为旧角色创建兼容引导状态（阶段 0 自动完成）
 */
export function createLegacyCompatibleTutorialState(protagonist: Protagonist): TutorialState {
  const base = createDefaultTutorialState();

  if (shouldSkipPhaseZero(protagonist)) {
    const phase0 = TUTORIAL_GUIDE.phases[0];
    const phase1 = TUTORIAL_GUIDE.phases[1];
    return {
      ...base,
      currentPhaseId: phase1.id,
      currentStepId: phase1.steps[0].id,
      completedStepIds: phase0.steps.map(s => s.id),
      completedPhaseIds: [phase0.id],
    };
  }

  return base;
}

// ============================================
// 内部辅助
// ============================================

function findCurrentStep(state: TutorialState): TutorialStep | undefined {
  for (const phase of TUTORIAL_GUIDE.phases) {
    if (phase.id === state.currentPhaseId) {
      return phase.steps.find(s => s.id === state.currentStepId);
    }
  }
  return undefined;
}

function findCurrentPhase(state: TutorialState): TutorialPhase | undefined {
  return TUTORIAL_GUIDE.phases.find(p => p.id === state.currentPhaseId);
}

function getTotalStepCount(): number {
  return TUTORIAL_GUIDE.phases.reduce((sum, p) => sum + p.steps.length, 0);
}
