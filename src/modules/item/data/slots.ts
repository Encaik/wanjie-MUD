/**
 * 统一槽位配置表
 *
 * 12 个固定槽位 + 动态技能槽位。
 * 新增槽位只需向 SLOT_DEFINITIONS 添加记录，不需改任何逻辑代码。
 */

import type { SlotDefinition } from '../types';

/** 所有固定槽位定义 */
export const SLOT_DEFINITIONS: SlotDefinition[] = [
  // ─── 装备槽位 ───
  {
    slotId: 'weapon_melee',
    displayName: '近战武器',
    category: 'equipment',
    acceptedCategory: 'equipment',
    acceptedSubcategory: 'weapon_melee',
    isDynamic: false,
  },
  {
    slotId: 'weapon_ranged',
    displayName: '远程武器',
    category: 'equipment',
    acceptedCategory: 'equipment',
    acceptedSubcategory: 'weapon_ranged',
    isDynamic: false,
  },
  {
    slotId: 'armor_head',
    displayName: '头部',
    category: 'equipment',
    acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_head',
    isDynamic: false,
  },
  {
    slotId: 'armor_body',
    displayName: '身体',
    category: 'equipment',
    acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_body',
    isDynamic: false,
  },
  {
    slotId: 'armor_legs',
    displayName: '腿部',
    category: 'equipment',
    acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_legs',
    isDynamic: false,
  },
  {
    slotId: 'armor_feet',
    displayName: '脚部',
    category: 'equipment',
    acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_feet',
    isDynamic: false,
  },

  // ─── 攻击功法槽位（3 个）───
  {
    slotId: 'technique_atk_1',
    displayName: '攻击功法①',
    category: 'technique',
    acceptedCategory: 'technique',
    acceptedSubcategory: 'attack',
    isDynamic: false,
    maxCount: 3,
  },
  {
    slotId: 'technique_atk_2',
    displayName: '攻击功法②',
    category: 'technique',
    acceptedCategory: 'technique',
    acceptedSubcategory: 'attack',
    isDynamic: false,
  },
  {
    slotId: 'technique_atk_3',
    displayName: '攻击功法③',
    category: 'technique',
    acceptedCategory: 'technique',
    acceptedSubcategory: 'attack',
    isDynamic: false,
  },

  // ─── 防御功法槽位（3 个）───
  {
    slotId: 'technique_def_1',
    displayName: '防御功法①',
    category: 'technique',
    acceptedCategory: 'technique',
    acceptedSubcategory: 'defense',
    isDynamic: false,
    maxCount: 3,
  },
  {
    slotId: 'technique_def_2',
    displayName: '防御功法②',
    category: 'technique',
    acceptedCategory: 'technique',
    acceptedSubcategory: 'defense',
    isDynamic: false,
  },
  {
    slotId: 'technique_def_3',
    displayName: '防御功法③',
    category: 'technique',
    acceptedCategory: 'technique',
    acceptedSubcategory: 'defense',
    isDynamic: false,
  },
];

/** 固定槽位 ID 列表 */
export const FIXED_SLOT_IDS = SLOT_DEFINITIONS.map(s => s.slotId);

/** 初始化空槽位映射 */
export function createEmptySlots(): Record<string, string | null> {
  const slots: Record<string, string | null> = {};
  for (const def of SLOT_DEFINITIONS) {
    slots[def.slotId] = null;
  }
  return slots;
}

/** 按大类获取槽位定义 */
export function getSlotsByCategory(category: 'equipment' | 'technique' | 'skill'): SlotDefinition[] {
  return SLOT_DEFINITIONS.filter(s => s.category === category);
}

/** 获取槽位定义 */
export function getSlotDefinition(slotId: string): SlotDefinition | undefined {
  return SLOT_DEFINITIONS.find(s => s.slotId === slotId);
}
