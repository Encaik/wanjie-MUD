/**
 * terrainSystem 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  getMoveCost,
  getVisionModifier,
  getTerrainNodeModifiers,
  canMoveOnTerrain,
  resolveTerrainEffect,
} from '../terrainSystem';
import type { TerrainType, FortuneSession } from '../../types';

function makeSession(stamina: number): FortuneSession {
  return {
    id: 'test', fortuneType: 'spirit_vein', currentDepth: 1, maxDepth: 3,
    currentMap: null as unknown as FortuneSession['currentMap'],
    playerPosition: { row: 0, col: 0 },
    stamina, maxStamina: 15,
    accumulatedLoot: { spiritStones: 0, items: [], fragments: [], experience: 0 },
    activeBuffs: [], enemiesDefeated: 0, nodesVisited: 0, startTime: 0,
    depthLoots: [], seed: 1,
  };
}

describe('terrainSystem', () => {
  describe('getMoveCost', () => {
    it('平地移动消耗 1', () => { expect(getMoveCost('plain')).toBe(1); });
    it('山崖移动消耗 2', () => { expect(getMoveCost('cliff')).toBe(2); });
    it('灵泉移动消耗 0', () => { expect(getMoveCost('spring')).toBe(0); });
    it('所有地形都有合法消耗', () => {
      const terrains: TerrainType[] = ['plain', 'forest', 'cave', 'cliff', 'swamp', 'spring', 'ruins'];
      for (const t of terrains) {
        expect(getMoveCost(t)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getVisionModifier', () => {
    it('平地视野修正 0', () => { expect(getVisionModifier('plain')).toBe(0); });
    it('密林视野修正 -1', () => { expect(getVisionModifier('forest')).toBe(-1); });
    it('洞窟视野修正 -99（特殊标记）', () => { expect(getVisionModifier('cave')).toBe(-99); });
    it('山崖视野修正 +1', () => { expect(getVisionModifier('cliff')).toBe(1); });
  });

  describe('resolveTerrainEffect', () => {
    it('毒沼扣 2% HP', () => {
      const eff = resolveTerrainEffect('swamp', 100, 100);
      expect(eff.hpChangeRatio).toBe(-0.02);
    });
    it('灵泉恢复 30% HP/MP', () => {
      const eff = resolveTerrainEffect('spring', 100, 100);
      expect(eff.hpChangeRatio).toBe(0.30);
      expect(eff.mpChangeRatio).toBe(0.30);
    });
    it('平地无 HP/MP 变化', () => {
      const eff = resolveTerrainEffect('plain', 100, 100);
      expect(eff.hpChangeRatio).toBe(0);
      expect(eff.mpChangeRatio).toBe(0);
    });
  });

  describe('canMoveOnTerrain', () => {
    it('体力充足时可以移动', () => {
      const s = makeSession(10);
      expect(canMoveOnTerrain(s, 'plain').canMove).toBe(true);
    });
    it('体力不足山崖时不能移动', () => {
      const s = makeSession(1);
      expect(canMoveOnTerrain(s, 'cliff').canMove).toBe(false);
    });
    it('体力为 0 时灵泉仍可移动（消耗 0）', () => {
      const s = makeSession(0);
      expect(canMoveOnTerrain(s, 'spring').canMove).toBe(true);
    });
  });

  describe('getTerrainNodeModifiers', () => {
    it('密林宝箱概率 ×2', () => {
      const mods = getTerrainNodeModifiers('forest');
      expect(mods.treasure).toBe(2.0);
    });
    it('遗迹试炼碑概率 ×3', () => {
      const mods = getTerrainNodeModifiers('ruins');
      expect(mods.challenge).toBe(3.0);
    });
    it('平地无修正', () => {
      const mods = getTerrainNodeModifiers('plain');
      expect(Object.keys(mods).length).toBe(0);
    });
  });
});
