/**
 * 背包物品工具函数
 * 提供背包操作的通用函数
 * 
 * 注意：这是纯函数模块，不是 React Hook
 */

import type { InventoryItem } from '@/shared/lib/types';

/**
 * 添加物品到背包（支持堆叠）
 */
export function addToInventory(
  inventory: InventoryItem[], 
  newItem: InventoryItem,
  checkStackable: boolean = true
): InventoryItem[] {
  // 防御性检查：确保 newItem 和 definition 存在
  if (!newItem || !newItem.definition) {
    console.warn('addToInventory: invalid item', newItem);
    return inventory;
  }

  const existingIndex = inventory.findIndex(
    item => item.definition.id === newItem.definition.id
  );
  
  if (existingIndex !== -1) {
    if (checkStackable && !inventory[existingIndex].definition.stackable) {
      return [...inventory, newItem];
    }
    
    const updated = [...inventory];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + newItem.quantity,
    };
    return updated;
  }
  
  return [...inventory, newItem];
}

/**
 * 从背包移除物品
 */
export function removeFromInventory(
  inventory: InventoryItem[], 
  itemId: string, 
  quantity: number
): InventoryItem[] {
  const index = inventory.findIndex(item => item?.definition?.id === itemId);
  
  if (index === -1) return inventory;
  
  const newInventory = [...inventory];
  
  if (newInventory[index].quantity <= quantity) {
    newInventory.splice(index, 1);
  } else {
    newInventory[index] = {
      ...newInventory[index],
      quantity: newInventory[index].quantity - quantity,
    };
  }
  
  return newInventory;
}

/**
 * 获取背包中灵石数量
 */
export function getSpiritStoneCount(inventory: InventoryItem[]): number {
  const spiritStone = inventory.find(item => item.definition.type === '灵石');
  return spiritStone ? spiritStone.quantity : 0;
}

/**
 * 检查背包是否有足够数量的物品
 */
export function hasEnoughItems(
  inventory: InventoryItem[], 
  itemId: string, 
  quantity: number
): boolean {
  const item = inventory.find(i => i.definition.id === itemId);
  return item ? item.quantity >= quantity : false;
}

/**
 * 批量添加物品到背包
 */
export function addItemsToInventory(
  inventory: InventoryItem[], 
  items: InventoryItem[]
): InventoryItem[] {
  return items.reduce((inv, item) => addToInventory(inv, item), inventory);
}
