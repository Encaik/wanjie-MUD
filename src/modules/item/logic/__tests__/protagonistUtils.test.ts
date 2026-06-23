/**
 * protagonistUtils 便捷访问器单元测试
 */
import { describe, it, expect } from 'vitest';

import type { Protagonist } from '@/core/types';

import { createEmptySlots } from '../../data/slots';
import { createItemInstance, addItem } from '../itemManager';
import {
  getEquippedResolved,
  getAllEquipped,
  getEquippedTechniques,
  getSpiritStones,
  getMeleeWeapon,
  hasEquipped,
} from '../protagonistUtils';

import type { ItemInstance } from '../../types';

/** 创建最小测试 Protagonist */
function makeProtagonist(items: ItemInstance[] = [], slots: Record<string, string | null> = {}): Protagonist {
  return {
    character: {} as Protagonist['character'],
    world: {} as Protagonist['world'],
    backstory: '', level: 1, realm: '凡人',
    stats: {} as Protagonist['stats'],
    statCapBonuses: {},
    items, slots, maxSlotCounts: {},
    inventory: [], equipments: [], equippedMelee: null, equippedRanged: null,
    equippedHead: null, equippedBody: null, equippedLegs: null, equippedFeet: null,
    techniques: [], equippedAttackTechniques: [], equippedDefenseTechniques: [],
    activeEffects: [], experience: 0, overflowExperience: 0,
    currentHp: 100, maxHp: 100, currentMp: 50, maxMp: 50,
    factionId: null,
  } as Protagonist;
}

describe('protagonistUtils', () => {
  describe('getSpiritStones', () => {
    it('获取灵石余额', () => {
      const items = addItem([], 'wanjie:common:spirit_stone', 500);
      const p = makeProtagonist(items);
      expect(getSpiritStones(p)).toBe(500);
    });

    it('无灵石返回 0', () => {
      const p = makeProtagonist([]);
      expect(getSpiritStones(p)).toBe(0);
    });
  });

  describe('getEquippedResolved', () => {
    it('获取已装备武器', () => {
      const items = addItem([], 'wanjie-core:cultivation:iron_sword', 1);
      const swordId = items[0].instanceId;
      const slots = { ...createEmptySlots(), weapon_melee: swordId };
      const p = makeProtagonist(items, slots);
      const resolved = getEquippedResolved(p, 'weapon_melee');
      expect(resolved).not.toBeNull();
      expect(resolved!.name).toBe('铁剑');
    });

    it('空槽位返回 null', () => {
      const p = makeProtagonist([], createEmptySlots());
      expect(getEquippedResolved(p, 'weapon_melee')).toBeNull();
    });
  });

  describe('getMeleeWeapon', () => {
    it('获取近战武器', () => {
      const items = addItem([], 'wanjie-core:cultivation:iron_sword', 1);
      const slots = { ...createEmptySlots(), weapon_melee: items[0].instanceId };
      const p = makeProtagonist(items, slots);
      const weapon = getMeleeWeapon(p);
      expect(weapon?.name).toBe('铁剑');
    });
  });

  describe('getEquippedTechniques', () => {
    it('获取已装备功法', () => {
      const items = addItem([], 'wanjie-core:cultivation:fire_scripture', 1);
      const techId = items[0].instanceId;
      const slots = { ...createEmptySlots(), technique_atk_1: techId };
      const p = makeProtagonist(items, slots);
      const techs = getEquippedTechniques(p);
      expect(techs.length).toBe(1);
      expect(techs[0].name).toBe('焚天诀');
    });
  });

  describe('hasEquipped', () => {
    it('检查是否装备了某模板物品', () => {
      const items = addItem([], 'wanjie-core:cultivation:iron_sword', 1);
      const slots = { ...createEmptySlots(), weapon_melee: items[0].instanceId };
      const p = makeProtagonist(items, slots);
      expect(hasEquipped(p, 'wanjie-core:cultivation:iron_sword')).toBe(true);
      expect(hasEquipped(p, 'wanjie-core:cultivation:spirit_sword')).toBe(false);
    });
  });

  describe('getAllEquipped', () => {
    it('获取所有已装备物品', () => {
      let items = addItem([], 'wanjie-core:cultivation:iron_sword', 1);
      items = addItem(items, 'wanjie-core:cultivation:light_armor_mantra', 1);
      const slots = {
        ...createEmptySlots(),
        weapon_melee: items[0].instanceId,
        technique_def_1: items[1].instanceId,
      };
      const p = makeProtagonist(items, slots);
      const all = getAllEquipped(p);
      expect(Object.keys(all).length).toBe(2);
    });
  });
});
