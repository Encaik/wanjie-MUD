/**
 * visionSystem 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSenseLevel,
  getEffectiveVision,
} from '../visionSystem';

describe('visionSystem', () => {
  describe('calculateSenseLevel', () => {
    it('极低属性返回 Lv.0', () => {
      expect(calculateSenseLevel(5, 5)).toBe(0);
    });
    it('悟性 15 灵识 10 → Lv.1', () => {
      // score = 15*0.6 + 10*0.4 = 9+4 = 13 >= 10
      expect(calculateSenseLevel(15, 10)).toBe(1);
    });
    it('悟性 40 灵识 20 → Lv.2', () => {
      // score = 24+8 = 32 >= 30
      expect(calculateSenseLevel(40, 20)).toBe(2);
    });
    it('悟性 80 灵识 50 → Lv.3', () => {
      // score = 48+20 = 68 >= 60
      expect(calculateSenseLevel(80, 50)).toBe(3);
    });
    it('Lv.0 边界：score=9', () => {
      // 悟性 10 灵识 7 → 6+2.8=8.8 < 10
      expect(calculateSenseLevel(10, 7)).toBe(0);
    });
  });

  describe('getEffectiveVision', () => {
    it('Lv.0 在平地上视野=1', () => {
      expect(getEffectiveVision(0, 'plain')).toBe(1);
    });
    it('Lv.1 在平地上视野=2', () => {
      expect(getEffectiveVision(1, 'plain')).toBe(2);
    });
    it('Lv.2 在密林中视野=2（3-1）', () => {
      expect(getEffectiveVision(2, 'forest')).toBe(2);
    });
    it('Lv.3 在山崖上视野=4（4+1，上限4）', () => {
      expect(getEffectiveVision(3, 'cliff')).toBe(4);
    });
    it('任何等级在洞窟中视野=1', () => {
      expect(getEffectiveVision(3, 'cave')).toBe(1);
      expect(getEffectiveVision(0, 'cave')).toBe(1);
    });
    it('视野不小于 1', () => {
      expect(getEffectiveVision(0, 'forest')).toBe(1);
    });
  });
});
