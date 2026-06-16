/**
 * itemManager 单元测试
 */
import { describe, it, expect } from 'vitest';
import {
  createItemInstance,
  addItem,
  removeItem,
  getItemCount,
  getCurrencyAmount,
  hasEnough,
  findItemsByTemplate,
  findItemByInstance,
  resolveItem,
} from '../itemManager';

describe('itemManager', () => {
  describe('createItemInstance', () => {
    it('从模板创建物品实例', () => {
      const inst = createItemInstance('spirit_stone', { quantity: 100 });
      expect(inst.templateId).toBe('spirit_stone');
      expect(inst.quantity).toBe(100);
      expect(inst.level).toBe(1);
      expect(inst.instanceId).toBeTruthy();
      expect(inst.equipped).toBe(false);
    });

    it('装备物品 maxStack=1 默认 quantity=1', () => {
      const inst = createItemInstance('iron_sword');
      expect(inst.quantity).toBe(1);
    });
  });

  describe('addItem', () => {
    it('添加可堆叠物品自动合并', () => {
      const inv = addItem([], 'spirit_stone', 500);
      const inv2 = addItem(inv, 'spirit_stone', 300);
      expect(getItemCount(inv2, 'spirit_stone')).toBe(800);
      // 只应该有一个实例
      expect(inv2.filter(i => i.templateId === 'spirit_stone').length).toBe(1);
    });

    it('添加不可堆叠物品创建独立实例', () => {
      const inv = addItem([], 'iron_sword', 1);
      const inv2 = addItem(inv, 'iron_sword', 1);
      expect(getItemCount(inv2, 'iron_sword')).toBe(2);
      // 两把独立的剑
      expect(inv2.filter(i => i.templateId === 'iron_sword').length).toBe(2);
    });

    it('quantity=0 不添加', () => {
      const inv = addItem([], 'spirit_stone', 0);
      expect(inv.length).toBe(0);
    });
  });

  describe('removeItem', () => {
    it('移除部分数量', () => {
      let inv = addItem([], 'spirit_stone', 500);
      const instanceId = inv[0].instanceId;
      inv = removeItem(inv, instanceId, 200);
      expect(getItemCount(inv, 'spirit_stone')).toBe(300);
    });

    it('移除全部数量则删除实例', () => {
      let inv = addItem([], 'spirit_stone', 500);
      const instanceId = inv[0].instanceId;
      inv = removeItem(inv, instanceId, 500);
      expect(getItemCount(inv, 'spirit_stone')).toBe(0);
      expect(inv.length).toBe(0);
    });
  });

  describe('hasEnough', () => {
    it('数量足够返回 true', () => {
      const inv = addItem([], 'spirit_stone', 1000);
      expect(hasEnough(inv, 'spirit_stone', 500)).toBe(true);
    });

    it('数量不足返回 false', () => {
      const inv = addItem([], 'spirit_stone', 100);
      expect(hasEnough(inv, 'spirit_stone', 500)).toBe(false);
    });
  });

  describe('getCurrencyAmount', () => {
    it('获取灵石余额（语法糖）', () => {
      const inv = addItem([], 'spirit_stone', 888);
      expect(getCurrencyAmount(inv, 'spirit_stone')).toBe(888);
    });
  });

  describe('resolveItem', () => {
    it('解析装备实例获取完整信息', () => {
      const inst = createItemInstance('iron_sword', { level: 3 });
      const resolved = resolveItem(inst);
      expect(resolved.name).toBe('铁剑');
      expect(resolved.category).toBe('equipment');
      expect(resolved.level).toBe(3);
      expect(resolved.rarity).toBe('common');
      expect(resolved.actualStats.attackBonus).toBeGreaterThan(0);
    });

    it('解析功法实例获取完整信息', () => {
      const inst = createItemInstance('fire_scripture', { level: 1 });
      const resolved = resolveItem(inst);
      expect(resolved.name).toBe('焚天诀');
      expect(resolved.category).toBe('technique');
      expect(resolved.subcategory).toBe('attack');
    });

    it('解析货币实例', () => {
      const inst = createItemInstance('spirit_stone', { quantity: 500 });
      const resolved = resolveItem(inst);
      expect(resolved.name).toBe('灵石');
      expect(resolved.category).toBe('currency');
      expect(resolved.quantity).toBe(500);
    });
  });
});
