/**
 * GameStore — 游戏状态存储（替代 useGameState.tsx 中的 GameProvider）
 *
 * 提供 gameState（只读）+ dispatch（不可变更新）。
 * 包含完整初始化逻辑：离线处理、时间校准、自动存档、新手任务奖励。
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { emit, on } from '@/core/events';
import { createLogger } from '@/core/logger';
import { processStatisticsEvent } from '@/core/statistics';
import {
  cooldown,
  fetchServerTime,
  offline,
  realClock,
  timerService,
} from '@/core/time';
import type { GameState, MessageRecord } from '@/core/types';
import {
  createDefaultDailyRoundState,
  createDefaultWeeklyRoundState,
} from '@/core/types';
import { addItem } from '@/modules/item/logic';
import {
  createDefaultTutorialState,
  createLegacyCompatibleTutorialState,
  checkTutorialProgress,
  getPendingDialog,
  markDialogViewed,
} from '@/modules/quest';
import { worldEvents } from '@/modules/theme';
import { loadGameStateWithRecovery, safeSaveGameState } from '@/shared/utils/saveUtils';

import { createInitialGameState } from './initialState';

const log = createLogger('GameStore');

/** 消息分页状态 */
interface MessagePagination {
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
}

/** GameStore 暴露的值 */
export interface GameStoreValue {
  gameState: GameState;
  dispatch: React.Dispatch<React.SetStateAction<GameState>>;
  messagePagination: MessagePagination;
  setMessagePagination: React.Dispatch<React.SetStateAction<MessagePagination>>;
}

export const StoreContext = createContext<GameStoreValue | null>(null);

/** 发放引导奖励到主角背包和状态 */
function applyTutorialReward(
  state: GameState,
  reward: {
    spiritStones?: number;
    experience?: number;
    items?: Array<{ item: { id: string }; quantity: number }>;
    message?: string;
  },
): GameState {
  if (!state.protagonist) return state;
  let newItems = [...state.protagonist.items];

  // 发放物品
  if (reward.items) {
    for (const r of reward.items) {
      newItems = addItem(newItems, r.item.id, r.quantity);
    }
  }

  // 发放灵石
  if (reward.spiritStones && reward.spiritStones > 0) {
    newItems = addItem(newItems, 'wanjie:common:spirit_stone', reward.spiritStones);
  }

  return {
    ...state,
    protagonist: {
      ...state.protagonist,
      items: newItems,
      experience: state.protagonist.experience + (reward.experience || 0),
    },
  };
}

/** 内部消息添加辅助（不 dispatch，仅计算新数组） */
function addMsgToArr(
  messages: MessageRecord[],
  type: MessageRecord['type'],
  title: string,
  content: string,
  details?: string,
  rewards?: MessageRecord['rewards'],
): MessageRecord[] {
  const newMsg: MessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    title,
    content,
    details,
    rewards,
  };
  return [newMsg, ...messages].slice(0, 100);
}

/**
 * GameStoreProvider — 游戏状态提供者（替代旧 GameProvider）
 */
export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(
    () => loadGameStateWithRecovery() ?? createInitialGameState(),
  );
  const isInitialized = useRef(false);
  const [messagePagination, setMessagePagination] = useState<MessagePagination>({
    hasMoreMessages: false,
    isLoadingMessages: false,
  });

  // ===== 初始化 =====
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const scheduleDeferred = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 50));
    const idleHandle = scheduleDeferred(async () => {
      const serverNow = await fetchServerTime();

      setGameState((prev) => {
        if (!prev.protagonist) return prev;

        const time = prev.time;
        const offlineResult = offline.process(time, prev.protagonist!, serverNow, prev.autoCultivating || false);
        let updatedProtagonist = offline.applyResult(prev.protagonist, offlineResult);

        let updatedTime = realClock.login(time, serverNow);
        const { time: cleanedTime } = cooldown.clearExpired(updatedTime, serverNow);
        updatedTime = cleanedTime;

        if (offlineResult.needsDailyRefresh) {
          updatedTime = { ...updatedTime, real: { ...updatedTime.real, dailyRefreshAt: serverNow } };
        }
        if (offlineResult.needsWeeklyRefresh) {
          updatedTime = { ...updatedTime, real: { ...updatedTime.real, weeklyRefreshAt: serverNow } };
        }

        let updatedFactionProgress = updatedProtagonist.factionProgress;
        if (updatedFactionProgress) {
          const { dailyRound, weeklyRound } = updatedFactionProgress;
          let newDaily = dailyRound;
          let newWeekly = weeklyRound;
          if (dailyRound.roundCooldownEnd && serverNow >= dailyRound.roundCooldownEnd) {
            newDaily = createDefaultDailyRoundState();
          }
          if (weeklyRound.roundCooldownEnd && serverNow >= weeklyRound.roundCooldownEnd) {
            newWeekly = createDefaultWeeklyRoundState();
          }
          if (newDaily !== dailyRound || newWeekly !== weeklyRound) {
            updatedFactionProgress = { ...updatedFactionProgress, dailyRound: newDaily, weeklyRound: newWeekly };
          }
        }

        updatedProtagonist = { ...updatedProtagonist, factionProgress: updatedFactionProgress };

        const finalState: GameState = { ...prev, protagonist: updatedProtagonist, time: updatedTime };

        emit(worldEvents.events.world_changed, {
          worldviewId: finalState.protagonist!.world.worldviewId,
          worldType: finalState.protagonist!.world.type,
        });

        timerService.start(serverNow, updatedTime);

        return finalState;
      });
    });

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleHandle);
      else clearTimeout(idleHandle as unknown as number);
    };
  }, []);

  // ===== 登出保存 =====
  const saveWithLogout = useCallback((state: GameState) => {
    const now = Date.now();
    const updatedTime = realClock.logout(state.time, now);
    timerService.stop();
    safeSaveGameState({ ...state, time: updatedTime });
  }, []);

  // ===== 自动保存 =====
  useEffect(() => {
    if (!isInitialized.current) return;
    if (gameState.phase === 'character-select') return;
    const stateToSave = { ...gameState, time: realClock.logout(gameState.time, Date.now()) };
    const result = safeSaveGameState(stateToSave);
    if (!result.success) log.error('Failed to save:', result.error);
  }, [gameState]);

  // ===== 页面隐藏/关闭保存 =====
  useEffect(() => {
    if (!isInitialized.current) return;
    const handleHide = () => {
      const now = Date.now();
      const st = { ...gameState, time: realClock.logout(gameState.time, now) };
      timerService.stop();
      safeSaveGameState(st);
    };
    document.addEventListener('visibilitychange', handleHide);
    window.addEventListener('beforeunload', handleHide);
    return () => {
      document.removeEventListener('visibilitychange', handleHide);
      window.removeEventListener('beforeunload', handleHide);
    };
  }, [gameState, saveWithLogout]);

  // ===== 补全旧存档的 tutorialState =====
  useEffect(() => {
    if (!isInitialized.current) return;
    if (gameState.phase !== 'playing' || !gameState.protagonist) return;

    // 如果 tutorialState 不存在但有旧存档，创建兼容状态
    if (!gameState.tutorialState) {
      const legacyState = createLegacyCompatibleTutorialState(gameState.protagonist);
      setGameState(prev => ({ ...prev, tutorialState: legacyState }));
    }
  }, [gameState.phase]);

  // ===== 事件驱动：集中统计更新 + 引导进度 =====
  useEffect(() => {
    if (!isInitialized.current) return;

    // 节流：1 秒批量处理
    let pendingEvents: Array<{ type: string; payload: Record<string, unknown>; timestamp: number }> = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushEvents = () => {
      if (pendingEvents.length === 0) return;
      const events = pendingEvents;
      pendingEvents = [];

      setGameState(prev => {
        if (!prev.protagonist) return prev;

        let next = prev;

        for (const event of events) {
          // 1. 统计更新
          next = { ...next, statistics: processStatisticsEvent(next.statistics, event as any) };

          // 2. 引导进度检查
          const tutorialState = next.tutorialState || createDefaultTutorialState();
          const result = checkTutorialProgress(event as any, tutorialState, next.protagonist!);

          if (result.newlyCompletedStep) {
            let updatedState = result.tutorialState;

            // 发放步骤/阶段奖励
            const reward = result.stepRewardToClaim || result.phaseRewardToClaim;
            if (reward) {
              next = applyTutorialReward(next, reward);
            }

            // 阶段/引导完成消息
            if (result.phaseRewardToClaim) {
              next = {
                ...next,
                messages: addMsgToArr(next.messages, 'success', `【${result.newlyCompletedPhase?.name || '阶段'}完成】`, reward?.message || ''),
              };
            } else if (result.stepRewardToClaim) {
              next = {
                ...next,
                messages: addMsgToArr(next.messages, 'info', `新手引导`, `「${result.newlyCompletedStep.name}」完成！`),
              };
            }

            if (result.allCompleted) {
              next = { ...next, showTutorialCompletionDialog: true, messages: addMsgToArr(next.messages, 'success', '🎉 新手引导全部完成！', '你已掌握修行基础，正式任务系统已解锁！') };
            }

            next = { ...next, tutorialState: updatedState };
          }
        }

        return next;
      });
    };

    const unsub = on('*', (event: { type: string; payload: unknown; timestamp: number }) => {
      pendingEvents.push(event as any);
      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          flushTimer = null;
          flushEvents();
        }, 1000); // 1 秒节流
      }
    });

    return () => {
      unsub();
      if (flushTimer) clearTimeout(flushTimer);
    };
  }, []);

  const value: GameStoreValue = { gameState, dispatch: setGameState, messagePagination, setMessagePagination };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useGameStore(): GameStoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useGameStore must be used within a GameStoreProvider');
  return ctx;
}

export function useGameDispatch(): React.Dispatch<React.SetStateAction<GameState>> {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useGameDispatch must be used within a GameStoreProvider');
  return ctx.dispatch;
}
