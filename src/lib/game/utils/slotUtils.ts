/**
 * 功法/装备槽位安全访问工具
 * 防止数组越界（修复 BUG-007）
 */

import { Technique, Equipment, TECHNIQUE_SLOT_COUNT } from '../types';

/**
 * 获取功法槽位数量
 */
export const TECHNIQUE_SLOT_SIZE = TECHNIQUE_SLOT_COUNT; // 3

/**
 * 安全获取功法槽位中的功法
 */
export function getTechniqueAtSlot(
  techniques: (Technique | null)[],
  index: number
): Technique | null {
  if (index < 0 || index >= TECHNIQUE_SLOT_SIZE) {
    console.warn(`[SlotUtils] Invalid technique slot index: ${index}`);
    return null;
  }
  // 确保数组长度足够
  if (index >= techniques.length) {
    return null;
  }
  return techniques[index] ?? null;
}

/**
 * 安全设置功法到指定槽位
 */
export function setTechniqueAtSlot(
  techniques: (Technique | null)[],
  technique: Technique,
  index: number
): (Technique | null)[] {
  if (index < 0 || index >= TECHNIQUE_SLOT_SIZE) {
    throw new Error(`[SlotUtils] Invalid technique slot index: ${index}`);
  }
  
  const newTechniques = [...techniques];
  // 确保数组长度正确
  while (newTechniques.length < TECHNIQUE_SLOT_SIZE) {
    newTechniques.push(null);
  }
  
  newTechniques[index] = technique;
  return newTechniques;
}

/**
 * 安全移除功法槽位中的功法
 */
export function removeTechniqueAtSlot(
  techniques: (Technique | null)[],
  index: number
): (Technique | null)[] {
  if (index < 0 || index >= TECHNIQUE_SLOT_SIZE) {
    console.warn(`[SlotUtils] Invalid technique slot index: ${index}`);
    return techniques;
  }
  
  const newTechniques = [...techniques];
  if (index < newTechniques.length) {
    newTechniques[index] = null;
  }
  return newTechniques;
}

/**
 * 获取第一个空闲功法槽位索引
 * @returns 空闲槽位索引，如果没有空闲槽位返回 -1
 */
export function findEmptyTechniqueSlot(
  techniques: (Technique | null)[]
): number {
  for (let i = 0; i < TECHNIQUE_SLOT_SIZE; i++) {
    if (!techniques[i]) {
      return i;
    }
  }
  return -1;
}

/**
 * 获取装备槽位数量
 */
export const EQUIPMENT_SLOT_SIZE = 6; // melee, ranged, head, body, legs, feet

/**
 * 装备槽位索引映射
 */
export const EQUIPMENT_SLOT_INDEX: Record<string, number> = {
  melee: 0,
  ranged: 1,
  head: 2,
  body: 3,
  legs: 4,
  feet: 5,
};

/**
 * 索引到装备槽位名称映射
 */
export const INDEX_TO_EQUIPMENT_SLOT: string[] = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'];

/**
 * 创建初始装备数组
 */
export function createEmptyEquipmentSlots(): (Equipment | null)[] {
  return Array(EQUIPMENT_SLOT_SIZE).fill(null);
}

/**
 * 安全获取装备槽位
 */
export function getEquipmentAtSlot(
  equipments: (Equipment | null)[],
  slot: string
): Equipment | null {
  const index = EQUIPMENT_SLOT_INDEX[slot];
  if (index === undefined) {
    console.warn(`[SlotUtils] Invalid equipment slot: ${slot}`);
    return null;
  }
  
  // 确保数组长度足够
  if (index >= equipments.length) {
    return null;
  }
  return equipments[index] ?? null;
}

/**
 * 安全设置装备到指定槽位
 */
export function setEquipmentAtSlot(
  equipments: (Equipment | null)[],
  equipment: Equipment,
  slot: string
): (Equipment | null)[] {
  const index = EQUIPMENT_SLOT_INDEX[slot];
  if (index === undefined) {
    throw new Error(`[SlotUtils] Invalid equipment slot: ${slot}`);
  }
  
  const newEquipments = [...equipments];
  // 确保数组长度正确
  while (newEquipments.length < EQUIPMENT_SLOT_SIZE) {
    newEquipments.push(null);
  }
  
  newEquipments[index] = equipment;
  return newEquipments;
}

/**
 * 安全移除装备槽位中的装备
 */
export function removeEquipmentAtSlot(
  equipments: (Equipment | null)[],
  slot: string
): (Equipment | null)[] {
  const index = EQUIPMENT_SLOT_INDEX[slot];
  if (index === undefined) {
    console.warn(`[SlotUtils] Invalid equipment slot: ${slot}`);
    return equipments;
  }
  
  const newEquipments = [...equipments];
  if (index < newEquipments.length) {
    newEquipments[index] = null;
  }
  return newEquipments;
}
