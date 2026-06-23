/**
 * useMentalState — 修炼心境状态管理 Hook
 *
 * 管理修炼过程中的心境状态变化，包括修炼后心境波动和心魔触发。
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { checkDemonTrigger } from '@/core/engine';
import type { MentalState, CultivationPath } from '@/core/types';
import { DEFAULT_PROTAGONIST_EXTENSION } from '@/core/types';

interface UseMentalStateOptions {
  /** 外部传入的心境状态（可选） */
  externalMentalState?: MentalState;
  /** 心境状态变更回调 */
  onMentalStateChange?: (mentalState: MentalState) => void;
  /** 当前经验值（用于检测修炼触发） */
  experience: number;
  /** 当前流派 */
  cultivationPath?: CultivationPath | null;
}

/**
 * 修炼心境状态管理 Hook
 */
export function useMentalState({
  externalMentalState,
  onMentalStateChange,
  experience,
  cultivationPath,
}: UseMentalStateOptions) {
  const [internalMentalState, setInternalMentalState] = useState<MentalState>(
    DEFAULT_PROTAGONIST_EXTENSION.mentalState,
  );

  const mentalState = externalMentalState ?? internalMentalState;

  const updateMentalState = useCallback((updater: (prev: MentalState) => MentalState) => {
    const base = externalMentalState ?? internalMentalState;
    const newState = updater(base);
    if (onMentalStateChange) {
      onMentalStateChange(newState);
    } else {
      setInternalMentalState(newState);
    }
    // 注意：此处依赖 externalMentalState/onMentalStateChange 的引用稳定性
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMentalStateChange]);

  const prevExpRef = useRef(experience);

  useEffect(() => {
    if (experience > prevExpRef.current) {
      // 30% 几率心境稳定度变化（-5 到 +5）
      if (Math.random() < 0.3) {
        const change = Math.floor(Math.random() * 11) - 5;
        const currentState = externalMentalState ?? internalMentalState;
        const newStability = Math.max(0, Math.min(100, currentState.stability + change));
        if (onMentalStateChange) {
          onMentalStateChange({ ...currentState, stability: newStability, lastChangeTime: Date.now() });
        } else {
          setInternalMentalState(prev => ({
            ...prev,
            stability: newStability,
            lastChangeTime: Date.now(),
          }));
        }
      }

      const currentState = externalMentalState ?? internalMentalState;
      const { triggered } = checkDemonTrigger(currentState, cultivationPath || null);
      if (triggered) {
        if (onMentalStateChange) {
          onMentalStateChange({
            ...currentState,
            demonChance: Math.min(0.5, currentState.demonChance + 0.01),
          });
        } else {
          setInternalMentalState(prev => ({
            ...prev,
            demonChance: Math.min(0.5, prev.demonChance + 0.01),
          }));
        }
      }
    }
    prevExpRef.current = experience;
    // 心境随修炼变化是设计意图，不需要稳定引用所有依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience]);

  return { mentalState, updateMentalState };
}
