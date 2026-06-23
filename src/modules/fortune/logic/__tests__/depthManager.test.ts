/**
 * depthManager 单元测试
 */

import { describe, it, expect } from 'vitest';

import {
  canEnterNextFloor,
  calculateDeathPenalty,
} from '../depthManager';

import type { FortuneSession } from '../../types';

function makeSession(depth: number, maxDepth: number, spiritStones: number): FortuneSession {
  return {
    id: 'test', fortuneType: 'spirit_vein',
    currentDepth: depth, maxDepth,
    currentMap: null as unknown as FortuneSession['currentMap'],
    playerPosition: { row: 0, col: 0 },
    stamina: 10, maxStamina: 15,
    accumulatedLoot: { spiritStones, items: [], fragments: [], experience: 100 },
    activeBuffs: [], enemiesDefeated: 0, nodesVisited: 0, startTime: 0,
    depthLoots: [
      { spiritStones: 50, items: [], fragments: [], experience: 50 },
      { spiritStones: 30, items: [], fragments: [], experience: 30 },
      { spiritStones: 20, items: [], fragments: [], experience: 20 },
    ],
    seed: 1,
  };
}

describe('depthManager', () => {
  describe('canEnterNextFloor', () => {
    it('未到最后一层可以继续', () => {
      expect(canEnterNextFloor(makeSession(1, 5, 0))).toBe(true);
    });
    it('到达最后一层不能继续', () => {
      expect(canEnterNextFloor(makeSession(5, 5, 0))).toBe(false);
    });
  });

  describe('calculateDeathPenalty', () => {
    it('F1 死亡丢失 50%', () => {
      const s = { ...makeSession(1, 5, 100), depthLoots: [{ spiritStones: 100, items: [], fragments: [], experience: 100 }] };
      s.accumulatedLoot = s.depthLoots[0];
      const p = calculateDeathPenalty(s);
      expect(p.retainedLoot.spiritStones).toBe(50);
      expect(p.lostLoot.spiritStones).toBe(50);
    });

    it('F2 死亡保留 F1 100% + F2 50%', () => {
      const s = makeSession(2, 5, 80);
      s.accumulatedLoot = { spiritStones: 80, items: [], fragments: [], experience: 80 };
      const p = calculateDeathPenalty(s);
      // F1=50(100%) + F2=30*0.5=15 → 65 retained
      expect(p.retainedLoot.spiritStones).toBe(65);
    });

    it('F3 死亡保留前 N-2 层 100%', () => {
      const s = makeSession(3, 5, 100);
      s.accumulatedLoot = { spiritStones: 100, items: [], fragments: [], experience: 100 };
      const p = calculateDeathPenalty(s);
      // F1=50(100%) + (F2+F3)*0.5 = (30+20)*0.5=25 → 75 retained
      expect(p.retainedLoot.spiritStones).toBe(75);
    });

    it('死亡惩罚有描述文本', () => {
      const s = { ...makeSession(1, 5, 100), depthLoots: [{ spiritStones: 100, items: [], fragments: [], experience: 100 }] };
      s.accumulatedLoot = s.depthLoots[0];
      const p = calculateDeathPenalty(s);
      expect(p.penaltyDescription.length).toBeGreaterThan(0);
    });
  });
});
