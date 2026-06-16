/**
 * 统一槽位配置表（扁平化设计）
 * 三大类独立槽位，无父子依赖关系。
 */

import type { SlotDefinition } from '../types';

export const SLOT_DEFINITIONS: SlotDefinition[] = [
  { slotId: 'weapon_melee', displayName: '近战武器', category: 'equipment', acceptedCategory: 'equipment', acceptedSubcategory: 'weapon_melee' },
  { slotId: 'weapon_ranged', displayName: '远程武器', category: 'equipment', acceptedCategory: 'equipment', acceptedSubcategory: 'weapon_ranged' },
  { slotId: 'armor_head', displayName: '头部', category: 'equipment', acceptedCategory: 'equipment', acceptedSubcategory: 'armor_head' },
  { slotId: 'armor_body', displayName: '身体', category: 'equipment', acceptedCategory: 'equipment', acceptedSubcategory: 'armor_body' },
  { slotId: 'armor_legs', displayName: '腿部', category: 'equipment', acceptedCategory: 'equipment', acceptedSubcategory: 'armor_legs' },
  { slotId: 'armor_feet', displayName: '脚部', category: 'equipment', acceptedCategory: 'equipment', acceptedSubcategory: 'armor_feet' },
  { slotId: 'technique_1', displayName: '功法一', category: 'technique', acceptedCategory: 'technique' },
  { slotId: 'technique_2', displayName: '功法二', category: 'technique', acceptedCategory: 'technique' },
  { slotId: 'technique_3', displayName: '功法三', category: 'technique', acceptedCategory: 'technique' },
  { slotId: 'skill_1', displayName: '技能一', category: 'skill', acceptedCategory: 'skill' },
  { slotId: 'skill_2', displayName: '技能二', category: 'skill', acceptedCategory: 'skill' },
  { slotId: 'skill_3', displayName: '技能三', category: 'skill', acceptedCategory: 'skill' },
  { slotId: 'skill_4', displayName: '技能四', category: 'skill', acceptedCategory: 'skill' },
  { slotId: 'skill_5', displayName: '技能五', category: 'skill', acceptedCategory: 'skill' },
  { slotId: 'skill_6', displayName: '技能六', category: 'skill', acceptedCategory: 'skill' },
];

export const FIXED_SLOT_IDS = SLOT_DEFINITIONS.map(s => s.slotId);

export function createEmptySlots(): Record<string, string | null> {
  const slots: Record<string, string | null> = {};
  for (const def of SLOT_DEFINITIONS) slots[def.slotId] = null;
  return slots;
}

export function getSlotsByCategory(category: 'equipment' | 'technique' | 'skill'): SlotDefinition[] {
  return SLOT_DEFINITIONS.filter(s => s.category === category);
}

export function getSlotDefinition(slotId: string): SlotDefinition | undefined {
  return SLOT_DEFINITIONS.find(s => s.slotId === slotId);
}
