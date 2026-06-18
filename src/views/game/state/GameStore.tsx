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

    // 注册内置故事线和板块（仅执行一次）
    import('@/modules/quest/events').then(({ initQuestRegistries }) => {
      initQuestRegistries();
    });

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
    // 旧教程兼容性已移除，新系统由 quest.dialog + eventTracker 驱动
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
          // 统计更新
          next = { ...next, statistics: processStatisticsEvent(next.statistics, event as any) };
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
