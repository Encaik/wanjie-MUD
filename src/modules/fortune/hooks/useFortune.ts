/**
 * modules/fortune/hooks/useFortune.ts — 机缘主 Hook
 *
 * 职责：派生状态 + 组合操作函数。操作逻辑在 useFortuneActions 中。
 * ≤200 行
 */

'use client';

import { useMemo } from 'react';

import {
  calculateSenseLevel,
  getVisibleCells,
  senseDirections,
  getStaminaStatus,
} from '../logic';
import { useFortuneActions } from './useFortuneActions';

import type { FortuneSlice } from '../types';

interface UseFortuneOptions {
  slice: FortuneSlice;
  updateSlice: (updater: (prev: FortuneSlice) => FortuneSlice) => void;
  wuxing: number;
  lingshi: number;
  maxHp: number;
  maxMp: number;
  playerLevel: number;
  seed: number;
}

export function useFortune(options: UseFortuneOptions) {
  const { slice, updateSlice, wuxing, lingshi, maxHp, maxMp, playerLevel, seed } = options;

  // ─── 派生状态 ───
  const senseLevel = useMemo(() => calculateSenseLevel(wuxing, lingshi), [wuxing, lingshi]);

  const visibleCells = useMemo(() => {
    if (!slice.session) return [];
    return getVisibleCells(slice.session.currentMap, slice.session.playerPosition, senseLevel);
  }, [slice.session, senseLevel]);

  const directionHints = useMemo(() => {
    if (!slice.session) return [];
    return senseDirections(slice.session.currentMap, slice.session.playerPosition, senseLevel);
  }, [slice.session, senseLevel]);

  const staminaStatus = useMemo(() => {
    if (!slice.session) return null;
    return getStaminaStatus(slice.session);
  }, [slice.session]);

  // ─── 操作函数 ───
  const actions = useFortuneActions({ updateSlice, playerLevel, seed, maxHp, maxMp });

  return {
    slice, senseLevel, visibleCells, directionHints, staminaStatus,
    ...actions,
  };
}
