/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

import { isProtagonist, isTechnique, isEquipment, isObject, isNumber } from '@/lib/game/typeGuards';
import type { Protagonist, Technique, Equipment, CharacterStats, ItemRarity, TechniqueType } from '@/lib/game/types';

describe('typeGuards', () => {
  describe('isObject', () => {
    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isObject(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
    });

    it('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ name: 'test' })).toBe(true);
    });
  });

  describe('isNumber', () => {
    it('should return false for non-numbers', () => {
      expect(isNumber('string')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });

    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(42)).toBe(true);
      expect(isNumber(-1)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });
  });

  describe('isProtagonist', () => {
    it('should return false for null', () => {
      expect(isProtagonist(null)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isProtagonist({})).toBe(false);
      expect(isProtagonist({ name: 'test' })).toBe(false);
    });

    it('should return true for valid protagonist', () => {
      // 创建一个最小的有效 protagonist 对象
      const mockProtagonist = {
        character: {
          id: 1,
          name: 'Test',
          gender: '男' as const,
          age: 16,
          origin: { name: 'Test', description: 'Test', impact: { '体质': 10, '灵根': 10, '悟性': 10, '幸运': 10, '意志': 10 }, level: 'common' as const, totalImpact: 10 },
          trait: { name: 'Test', description: 'Test', impact: { '体质': 10, '灵根': 10, '悟性': 10, '幸运': 10, '意志': 10 }, level: 'common' as const, totalImpact: 10 },
          personality: { name: 'Test', description: 'Test', impact: { '体质': 10, '灵根': 10, '悟性': 10, '幸运': 10, '意志': 10 }, level: 'common' as const, totalImpact: 10 },
          talent: { name: 'Test', description: 'Test', impact: { '体质': 10, '灵根': 10, '悟性': 10, '幸运': 10, '意志': 10 }, level: 'common' as const, totalImpact: 10 },
          background: '',
          stats: { '体质': 10, '灵根': 10, '悟性': 10, '幸运': 10, '意志': 10 },
          totalPower: 50,
        },
        level: 1,
        realm: '凡人境',
        stats: { '体质': 10, '灵根': 10, '悟性': 10, '幸运': 10, '意志': 10 },
        statCapBonuses: { '体质': 0, '灵根': 0, '悟性': 0, '幸运': 0, '意志': 0 },
        inventory: [],
        activeEffects: [],
        experience: 0,
        overflowExperience: 0,
        currentHp: 100,
        maxHp: 100,
        currentMp: 50,
        maxMp: 50,
        techniques: [],
        equippedAttackTechniques: [null, null, null],
        equippedDefenseTechniques: [null, null, null],
        equipments: [],
        equippedMelee: null,
        equippedRanged: null,
        equippedHead: null,
        equippedBody: null,
        equippedLegs: null,
        equippedFeet: null,
        spiritStones: 0,
        experienceToNextLevel: 100,
        world: {} as any,
        backstory: '',
      };
      expect(isProtagonist(mockProtagonist)).toBe(true);
    });
  });

  describe('isTechnique', () => {
    it('should return false for null', () => {
      expect(isTechnique(null)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isTechnique({})).toBe(false);
      expect(isTechnique({ name: 'test' })).toBe(false);
    });

    it('should return true for valid technique', () => {
      const { createMinimalTechnique } = require('@/lib/game/rarityUtils');
      const validTechnique = createMinimalTechnique(
        'tech-1',
        'Basic Attack',
        'attack',
        '普通',
        { description: 'A basic attack', power: 10 }
      );
      expect(isTechnique(validTechnique)).toBe(true);
    });
  });

  describe('isEquipment', () => {
    it('should return false for null', () => {
      expect(isEquipment(null)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isEquipment({})).toBe(false);
      expect(isEquipment({ name: 'test' })).toBe(false);
    });

    it('should return true for valid equipment', () => {
      const { createMinimalEquipment } = require('@/lib/game/rarityUtils');
      const validEquipment = createMinimalEquipment(
        'equip-1',
        'Iron Sword',
        'melee',
        '普通',
        { description: 'A basic sword', attackBonus: 10 }
      );
      expect(isEquipment(validEquipment)).toBe(true);
    });
  });
});
