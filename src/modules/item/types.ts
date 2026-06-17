/**
 * modules/item/types.ts — 统一物品系统类型定义（扁平化槽位）
 *
 * 所有可拥有、可使用、可装备、可消耗、可升级的实体统一为 Item 体系。
 * 槽位系统：装备/功法/技能 独立固定槽位，无父子依赖关系。
 */

import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import type { WorldType } from '@/core/types';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemCategory = 'currency' | 'consumable' | 'material' | 'equipment' | 'technique' | 'skill' | 'fragment';
export type EquipmentSubcategory = 'weapon_melee' | 'weapon_ranged' | 'armor_head' | 'armor_body' | 'armor_legs' | 'armor_feet';
export type TechniqueSubcategory = 'attack' | 'defense';
export type SkillSubcategory = 'magic_skill' | 'combat_skill';
export type SkillTag = 'instant' | 'channeling' | 'aoe' | 'dot' | 'hot' | 'shield'
  | 'lifesteal' | 'execute' | 'combo' | 'counter' | 'buff' | 'debuff';

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield' | 'special';
  baseValue: number;
  statScaling: number;
  target: 'self' | 'single' | 'all' | 'random';
  duration?: number;
  description?: string;
}

export interface ItemAffix {
  id: string; name: string; type: 'prefix' | 'suffix';
  rarity: Rarity; description: string; effects: Record<string, number>;
}

// ─── 扁平槽位系统 ───

export type SlotId = string;

export interface SlotDefinition {
  slotId: SlotId;
  displayName: string;
  category: 'equipment' | 'technique' | 'skill';
  acceptedCategory: ItemCategory;
  acceptedSubcategory?: string;
}

// ─── 模板 ───

interface ItemTemplateBase {
  templateId: string; name: string; description: string;
  category: ItemCategory; rarity: Rarity; maxStack: number; maxLevel: number;
  baseStats: Record<string, number>; price: number; element: Element | null;
  worldType?: WorldType; worldviewRestrictions?: string[]; isDroppable: boolean;
}

export interface CurrencyTemplate extends ItemTemplateBase {
  category: 'currency'; subcategory: string;
  maxStack: 999_999_999; maxLevel: 1; ext: Record<string, never>;
}

export interface ConsumableTemplate extends ItemTemplateBase {
  category: 'consumable';
  subcategory: 'pill_hp' | 'pill_mp' | 'pill_cultivation' | 'pill_breakthrough' | 'pill_stat' | 'scroll';
  ext: { effects: SkillEffect[]; requiredLevel?: number; requiredRealm?: number; cooldownSeconds?: number };
}

export interface MaterialTemplate extends ItemTemplateBase {
  category: 'material';
  subcategory: 'herb' | 'ore' | 'gem' | 'beast_part' | 'exp_fodder' | 'special';
  ext: { expValue?: number; applicableCategory?: ItemCategory };
}

export interface EquipmentTemplate extends ItemTemplateBase {
  category: 'equipment'; subcategory: EquipmentSubcategory; maxStack: 1;
  ext: { equipSlot: SlotId; weaponCategory: WeaponCategory | null; compatibleElement: Element | null; compatibleBonus: number };
}

export interface TechniqueTemplate extends ItemTemplateBase {
  category: 'technique'; subcategory: TechniqueSubcategory; maxStack: 1;
  ext: { baseMpCost: number; subElement?: Element };
}

export interface SkillTemplate extends ItemTemplateBase {
  category: 'skill'; subcategory: SkillSubcategory; maxStack: 1;
  ext: { requiredElement?: Element; weaponRestriction?: WeaponCategory; isUltimate?: boolean; cooldown: number; effects: SkillEffect[]; tags: SkillTag[] };
}

export interface FragmentTemplate extends ItemTemplateBase {
  category: 'fragment'; subcategory: string; maxLevel: 1;
  ext: { sourceTemplateId: string; sourceName: string; sourceCategory: ItemCategory; sourceRarity: Rarity };
}

export type ItemTemplate = CurrencyTemplate | ConsumableTemplate | MaterialTemplate | EquipmentTemplate | TechniqueTemplate | SkillTemplate | FragmentTemplate;

// ─── 实例 ───

export interface ItemInstance {
  instanceId: string; templateId: string; quantity: number; level: number; exp: number;
  affixes: ItemAffix[]; equipped: boolean; equippedInSlot: SlotId | null;
  equippedSkills: Record<string, string | null>;
  element: Element | null; isFragment: boolean;
  obtainedAt: number; source: 'drop' | 'shop' | 'craft' | 'quest' | 'initial';
}

export interface EquipResult { success: boolean; message?: string; error?: string; updatedInventory?: ItemInstance[]; updatedSlots?: Record<SlotId, string | null>; }
export type ItemActionResult<T = ItemInstance> = { success: true; data: T; message?: string } | { success: false; error: string };

export interface ResolvedItem {
  instanceId: string; templateId: string; name: string; description: string;
  category: ItemCategory; subcategory: string; rarity: Rarity;
  quantity: number; level: number; maxLevel: number; exp: number; expToNext: number;
  equipped: boolean; equippedInSlot: SlotId | null; equippedSkills: Record<string, string | null>;
  element: Element | null; affixes: ItemAffix[]; isFragment: boolean;
  obtainedAt: number; source: string;
  actualStats: Record<string, number>; price: number;
  ext: ItemTemplate['ext']; instance: ItemInstance; template: ItemTemplate;
}

// ─── 命名空间 ID 系统 ───

/** 模板 ID 三段式正则：source:worldview:item_name */
const ID_PATTERN = /^([a-z][a-z0-9-]{2,31}):([a-z][a-z0-9-]{1,31}):([a-z][a-z0-9_]{1,63})$/;

/** 解析后的三段式 ID */
export interface ParsedTemplateId {
  source: string;
  worldview: string;
  itemName: string;
}

/**
 * 解析三段式模板 ID
 *
 * @param id - 模板 ID 字符串
 * @returns 解析结果，非标准 ID 返回 null
 */
export function parseTemplateId(id: string): ParsedTemplateId | null {
  const match = id.match(ID_PATTERN);
  if (!match) return null;
  return { source: match[1], worldview: match[2], itemName: match[3] };
}

/**
 * 构建标准三段式模板 ID
 *
 * @example buildTemplateId('wanjie', 'cultivation', 'iron_sword') => 'wanjie:cultivation:iron_sword'
 */
export function buildTemplateId(source: string, worldview: string, itemName: string): string {
  return `${source}:${worldview}:${itemName}`;
}

/**
 * 验证模板 ID 是否遵循三段式规范
 */
export function isValidTemplateId(id: string): boolean {
  return ID_PATTERN.test(id);
}
