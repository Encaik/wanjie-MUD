/**
 * useFortuneActions — 机缘操作函数
 *
 * 从 useFortune 拆分，管理所有状态变更操作。≤200 行
 */

'use client';

import { useCallback } from 'react';

import {
  generateFortuneMap,
  resolveNode,
  createFloorTransition,
  getRetreatResult,
  calculateDeathPenalty,
  getCompletionBonus,
  getMoveCost,
  manhattanDistance,
} from '../logic';
import { INITIAL_FORTUNE_SLICE } from '../state';

import type { FortuneSlice, FortuneTypeId, FortuneSession, SettlementResult } from '../types';

interface ActionDeps {
  updateSlice: (updater: (prev: FortuneSlice) => FortuneSlice) => void;
  playerLevel: number;
  seed: number;
  maxHp: number;
  maxMp: number;
}

export function useFortuneActions(deps: ActionDeps) {
  const { updateSlice, playerLevel, seed, maxHp, maxMp } = deps;

  const startSession = useCallback((fortuneType: FortuneTypeId) => {
    updateSlice(prev => {
      const map = generateFortuneMap(fortuneType, 1, playerLevel, seed + Date.now());
      const session: FortuneSession = {
        id: `f_${fortuneType}_${Date.now()}`, fortuneType,
        currentDepth: 1, maxDepth: map.maxDepth, currentMap: map,
        playerPosition: map.playerStart, stamina: 15, maxStamina: 15,
        accumulatedLoot: { spiritStones: 0, items: [], fragments: [], experience: 0 },
        activeBuffs: [], enemiesDefeated: 0, nodesVisited: 0, startTime: Date.now(),
        depthLoots: [{ spiritStones: 0, items: [], fragments: [], experience: 0 }],
        seed: seed + Date.now(),
      };
      return { ...prev, session, phase: 'exploring' as const };
    });
  }, [updateSlice, playerLevel, seed]);

  const moveTo = useCallback((row: number, col: number) => {
    updateSlice(prev => {
      if (!prev.session) return prev;
      const s = prev.session;
      const cell = s.currentMap.grid[row]?.[col];
      if (!cell) return prev;
      const cost = getMoveCost(cell.terrain);
      if (s.stamina < cost) return prev;
      if (manhattanDistance(s.playerPosition, { row, col }) !== 1) return prev;

      let lr = prev.lastNodeResult;
      let pb = prev.pendingBattle;
      if (cell.node && !cell.node.isCleared) {
        lr = resolveNode(cell.node, s, { playerMaxHp: maxHp, playerMaxMp: maxMp, rng: () => Math.random() });
        if (lr.requiresBattle && lr.battleData) pb = lr.battleData;
      }

      const cleared = { ...cell, isVisited: true,
        node: cell.node && !cell.node.isCleared ? { ...cell.node, isCleared: !lr?.requiresBattle } : cell.node };
      const newGrid = s.currentMap.grid.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? cleared : c)));

      return { ...prev, session: { ...s, playerPosition: { row, col },
        stamina: s.stamina - cost, currentMap: { ...s.currentMap, grid: newGrid } },
        lastNodeResult: lr, pendingBattle: pb };
    });
  }, [updateSlice, maxHp, maxMp]);

  const reachExit = useCallback(() => {
    updateSlice(prev => prev.session
      ? { ...prev, phase: 'floor_transition' as const, floorTransition: createFloorTransition(prev.session) }
      : prev);
  }, [updateSlice]);

  const continueDeeper = useCallback(() => {
    updateSlice(prev => {
      if (!prev.session) return prev;
      const nd = prev.session.currentDepth + 1;
      const map = generateFortuneMap(prev.session.fortuneType, nd, playerLevel, prev.session.seed);
      return { ...prev, session: { ...prev.session, currentDepth: nd, currentMap: map,
        playerPosition: map.playerStart, depthLoots: [...prev.session.depthLoots, { ...prev.session.accumulatedLoot }] },
        phase: 'exploring' as const, floorTransition: null };
    });
  }, [updateSlice, playerLevel]);

  const retreat = useCallback(() => {
    updateSlice(prev => {
      if (!prev.session) return prev;
      const r = getRetreatResult(prev.session);
      return { ...prev, session: null, phase: 'result' as const,
        settlement: { type: 'retreat', finalLoot: r.retainedLoot,
          summary: `安全撤退！获得 ${r.retainedLoot.spiritStones} 灵石、${r.retainedLoot.experience} 经验`,
          unlockInfo: `解锁深度 ${r.unlockedSweepDepth} 扫荡` } };
    });
  }, [updateSlice]);

  const settle = useCallback((type: SettlementResult['type'], loot: FortuneSession['accumulatedLoot'], summary: string, unlockInfo?: string) => {
    updateSlice(prev => ({ ...prev, session: null, phase: 'result' as const,
      settlement: { type, finalLoot: loot, summary, unlockInfo } }));
  }, [updateSlice]);

  const handleDeath = useCallback(() => {
    updateSlice(prev => {
      if (!prev.session) return prev;
      const p = calculateDeathPenalty(prev.session);
      return { ...prev, session: null, phase: 'result' as const,
        settlement: { type: 'death', finalLoot: p.retainedLoot, summary: p.penaltyDescription } };
    });
  }, [updateSlice]);

  const handleCompletion = useCallback(() => {
    updateSlice(prev => {
      if (!prev.session) return prev;
      const b = getCompletionBonus(prev.session);
      const fl = { ...prev.session.accumulatedLoot,
        spiritStones: prev.session.accumulatedLoot.spiritStones + b.spiritStones,
        experience: prev.session.accumulatedLoot.experience + b.experience };
      return { ...prev, session: null, phase: 'result' as const,
        settlement: { type: 'completion', finalLoot: fl,
          summary: `通关！额外 +${b.spiritStones}灵石 +${b.experience}经验`, unlockInfo: '永久解锁扫荡' } };
    });
  }, [updateSlice]);

  const handleBattleEnd = useCallback((victory: boolean, _fled: boolean) => {
    updateSlice(prev => {
      if (!prev.session || !prev.pendingBattle) return prev;
      const b = prev.pendingBattle;
      if (!victory) return { ...prev, pendingBattle: null };
      const rec: Record<string, number> = { normal: 1, elite: 2, miniboss: 3, boss: 5 };
      const ns = Math.min(prev.session.maxStamina, prev.session.stamina + (rec[b.enemyTier] || 1));
      const pos = prev.session.playerPosition;
      const ng = prev.session.currentMap.grid.map((r, ri) => r.map((c, ci) =>
        ri === pos.row && ci === pos.col && c.node ? { ...c, node: { ...c.node, isCleared: true } } : c));
      return { ...prev, pendingBattle: null,
        session: { ...prev.session, stamina: ns, enemiesDefeated: prev.session.enemiesDefeated + 1,
          accumulatedLoot: { ...prev.session.accumulatedLoot,
            spiritStones: prev.session.accumulatedLoot.spiritStones + b.enemyLevel * 3 + 5,
            experience: prev.session.accumulatedLoot.experience + b.enemyLevel * 5 + 10 },
          currentMap: { ...prev.session.currentMap, grid: ng } } };
    });
  }, [updateSlice]);

  const addLoot = useCallback((loot: Partial<FortuneSession['accumulatedLoot']>) => {
    updateSlice(prev => {
      if (!prev.session) return prev;
      const c = prev.session.accumulatedLoot;
      return { ...prev, session: { ...prev.session, accumulatedLoot: {
        spiritStones: c.spiritStones + (loot.spiritStones || 0),
        items: [...c.items, ...(loot.items || [])],
        fragments: [...c.fragments, ...(loot.fragments || [])],
        experience: c.experience + (loot.experience || 0) } } };
    });
  }, [updateSlice]);

  const returnToHub = useCallback(() => {
    updateSlice(() => ({ ...INITIAL_FORTUNE_SLICE }));
  }, [updateSlice]);

  return { startSession, moveTo, reachExit, continueDeeper, retreat, settle,
    handleDeath, handleCompletion, handleBattleEnd, addLoot, returnToHub };
}
