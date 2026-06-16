/**
 * slotSystem 单元测试
 */
import { describe, it, expect } from 'vitest';
import { createItemInstance, addItem } from '../itemManager';
import { validateEquip, equipItem, unequipItem, createDynamicSkillSlots } from '../slotSystem';
import { createEmptySlots } from '../../data/slots';

describe('slotSystem', () => {
  describe('validateEquip', () => {
    it('类别不匹配返回错误', () => {
      const pill = createItemInstance('rejuvenation_pill');
      const slotDef = { slotId: 'weapon_melee', displayName: '近战武器', category: 'equipment' as const, acceptedCategory: 'equipment' as const, isDynamic: false };
      const result = validateEquip(pill, slotDef);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('类型不匹配');
    });

    it('碎片无法装备', () => {
      const frag = createItemInstance('iron_sword', { isFragment: true });
      const slotDef = { slotId: 'weapon_melee', displayName: '近战武器', category: 'equipment' as const, acceptedCategory: 'equipment' as const, acceptedSubcategory: 'weapon_melee', isDynamic: false };
      const result = validateEquip(frag, slotDef);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('碎片');
    });

    it('类别匹配返回有效', () => {
      const sword = createItemInstance('iron_sword');
      const slotDef = { slotId: 'weapon_melee', displayName: '近战武器', category: 'equipment' as const, acceptedCategory: 'equipment' as const, acceptedSubcategory: 'weapon_melee', isDynamic: false };
      const result = validateEquip(sword, slotDef);
      expect(result.valid).toBe(true);
    });
  });

  describe('equipItem / unequipItem', () => {
    it('装备成功更新 slots', () => {
      let inv = addItem([], 'iron_sword', 1);
      const swordId = inv[0].instanceId;
      const slots = createEmptySlots();

      const result = equipItem(inv, slots, swordId, 'weapon_melee');
      expect(result.success).toBe(true);
      expect(result.updatedSlots!['weapon_melee']).toBe(swordId);
    });

    it('装备已占用槽位自动替换', () => {
      let inv = addItem([], 'iron_sword', 1);
      inv = addItem(inv, 'spirit_sword', 1);
      const sword1Id = inv[0].instanceId;
      const sword2Id = inv[1].instanceId;
      const slots = createEmptySlots();

      const r1 = equipItem(inv, slots, sword1Id, 'weapon_melee');
      expect(r1.success).toBe(true);

      const r2 = equipItem(r1.updatedInventory!, r1.updatedSlots!, sword2Id, 'weapon_melee');
      expect(r2.success).toBe(true);
      expect(r2.updatedSlots!['weapon_melee']).toBe(sword2Id);
    });

    it('卸下槽位恢复物品状态', () => {
      let inv = addItem([], 'iron_sword', 1);
      const swordId = inv[0].instanceId;
      let slots = createEmptySlots();

      const equipResult = equipItem(inv, slots, swordId, 'weapon_melee');
      expect(equipResult.success).toBe(true);

      const unequipResult = unequipItem(equipResult.updatedInventory!, equipResult.updatedSlots!, 'weapon_melee');
      expect(unequipResult.success).toBe(true);
      expect(unequipResult.updatedSlots!['weapon_melee']).toBeNull();
    });
  });

  describe('createDynamicSkillSlots', () => {
    it('功法创建技能槽位', () => {
      const slots = createDynamicSkillSlots('fire_scripture', 'technique_atk_1');
      expect(slots.length).toBe(2); // epic technique = 2 skill slots
      expect(slots[0].slotId).toBe('skill_technique_atk_1_0');
      expect(slots[0].isDynamic).toBe(true);
      expect(slots[0].acceptedCategory).toBe('skill');
    });

    it('非装备/功法不创建技能槽', () => {
      const slots = createDynamicSkillSlots('spirit_stone', 'weapon_melee');
      expect(slots.length).toBe(0);
    });
  });
});
