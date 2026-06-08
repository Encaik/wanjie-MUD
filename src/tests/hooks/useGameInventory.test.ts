/**
 * @vitest-environment jsdom
 * 
 * 背包工具函数测试
 * 
 * 测试覆盖：
 * - 添加物品
 * - 移除物品
 * - 获取灵石数量
 * - 检查物品数量
 */
import { describe, it, expect } from 'vitest';

import { addToInventory, removeFromInventory, getSpiritStoneCount, hasEnoughItems } from '@/hooks/utils/inventoryUtils';
import { spiritStoneItems } from '@/lib/game/utils/items';
import type { InventoryItem } from '@/lib/game/types';
import { createInventoryItem } from '@/lib/game/types';

describe('背包工具函数', () => {
  describe('addToInventory', () => {
    it('应该能添加新物品到空背包', () => {
      const inventory: InventoryItem[] = [];
      const newItem = createInventoryItem(spiritStoneItems[0], 100);
      
      const result = addToInventory(inventory, newItem);
      
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(100);
    });

    it('相同物品应该堆叠', () => {
      const inventory: InventoryItem[] = [createInventoryItem(spiritStoneItems[0], 100)];
      const newItem = createInventoryItem(spiritStoneItems[0], 50);
      
      const result = addToInventory(inventory, newItem);
      
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(150);
    });
  });

  describe('removeFromInventory', () => {
    it('应该能移除物品', () => {
      const inventory: InventoryItem[] = [createInventoryItem(spiritStoneItems[0], 100)];
      
      const result = removeFromInventory(inventory, spiritStoneItems[0].id, 30);
      
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(70);
    });

    it('移除全部数量时应该删除物品条目', () => {
      const inventory: InventoryItem[] = [createInventoryItem(spiritStoneItems[0], 100)];
      
      const result = removeFromInventory(inventory, spiritStoneItems[0].id, 100);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getSpiritStoneCount', () => {
    it('应该返回灵石数量', () => {
      const inventory: InventoryItem[] = [createInventoryItem(spiritStoneItems[0], 500)];
      
      const count = getSpiritStoneCount(inventory);
      
      expect(count).toBe(500);
    });

    it('没有灵石时应该返回0', () => {
      const inventory: InventoryItem[] = [];
      
      const count = getSpiritStoneCount(inventory);
      
      expect(count).toBe(0);
    });
  });

  describe('hasEnoughItems', () => {
    it('物品足够时应该返回true', () => {
      const inventory: InventoryItem[] = [createInventoryItem(spiritStoneItems[0], 100)];
      
      const result = hasEnoughItems(inventory, spiritStoneItems[0].id, 50);
      
      expect(result).toBe(true);
    });

    it('物品不足时应该返回false', () => {
      const inventory: InventoryItem[] = [createInventoryItem(spiritStoneItems[0], 30)];
      
      const result = hasEnoughItems(inventory, spiritStoneItems[0].id, 50);
      
      expect(result).toBe(false);
    });
  });
});
