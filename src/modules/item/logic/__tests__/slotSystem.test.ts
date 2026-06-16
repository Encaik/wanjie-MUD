// @ts-nocheck — TODO: 更新测试匹配新槽位
/**
 * slotSystem 单元测试
 */
import { describe, it, expect } from 'vitest';
import { createItemInstance, addItem } from '../itemManager';
import { validateEquip, equipItem, unequipItem } from '../slotSystem';
import { createEmptySlots } from '../../data/slots';

describe('slotSystem', () => {
  const slotDef = { slotId: 'weapon_melee', category: 'equipment' as const, acceptedCategory: 'equipment' as const, acceptedSubcategory: 'weapon_melee', displayName: '近战武器' };

  describe('validateEquip', () => {
    it('类别不匹配返回错误', () => {
      const pill = createItemInstance('rejuvenation_pill');
      const result = validateEquip(pill, slotDef);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('类型不匹配');
    });

    it('碎片无法装备', () => {
      const frag = createItemInstance('iron_sword', { isFragment: true });
      const result = validateEquip(frag, slotDef);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('碎片');
    });

    it('类别匹配返回有效', () => {
      const sword = createItemInstance('iron_sword');
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

  // TODO: 统一物品系统迁移 — createDynamicSkillSlots 已移除（扁平槽位不需要动态创建）
});
