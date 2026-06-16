/**
 * 修仙世界装备模板
 *
 * 6 个槽位（近战/远程/头/身/腿/脚）× 多种稀有度
 */

import type { EquipmentTemplate, SkillTag } from '@/modules/item/types';

// ─── 近战武器 ───

export const IRON_SWORD: EquipmentTemplate = {
  templateId: 'iron_sword',
  name: '铁剑',
  description: '凡铁锻造的普通长剑，剑身朴实无华。',
  category: 'equipment',
  subcategory: 'weapon_melee',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { attackBonus: 10, power: 5 },
  price: 200,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'weapon_melee',
    providesSkillSlots: 1,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: 'sword',
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const SPIRIT_SWORD: EquipmentTemplate = {
  templateId: 'spirit_sword',
  name: '灵剑',
  description: '以灵气淬炼的宝剑，剑身泛着淡淡灵光。',
  category: 'equipment',
  subcategory: 'weapon_melee',
  rarity: 'uncommon',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { attackBonus: 25, power: 15 },
  price: 800,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'weapon_melee',
    providesSkillSlots: 1,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: 'sword',
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const FLAME_DRAGON_SWORD: EquipmentTemplate = {
  templateId: 'flame_dragon_sword',
  name: '炎龙剑',
  description: '以赤龙之血淬火的传说之剑，挥动时烈焰翻腾，剑气化龙。',
  category: 'equipment',
  subcategory: 'weapon_melee',
  rarity: 'legendary',
  maxStack: 1,
  maxLevel: 9,
  baseStats: { attackBonus: 80, power: 50, critRate: 5 },
  price: 50000,
  element: 'fire',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'weapon_melee',
    providesSkillSlots: 3,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: 'sword',
    compatibleElement: 'fire',
    compatibleBonus: 15,
  },
};

export const THUNDER_BLADE: EquipmentTemplate = {
  templateId: 'thunder_blade',
  name: '惊雷刀',
  description: '刀身缠绕雷电，挥刀间雷光闪烁，惊雷炸响。',
  category: 'equipment',
  subcategory: 'weapon_melee',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { attackBonus: 50, power: 30 },
  price: 12000,
  element: 'thunder',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'weapon_melee',
    providesSkillSlots: 2,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: 'blade',
    compatibleElement: 'thunder',
    compatibleBonus: 10,
  },
};

// ─── 远程武器 ───

export const HUNTING_BOW: EquipmentTemplate = {
  templateId: 'hunting_bow',
  name: '猎弓',
  description: '山间猎户常用的硬木弓，朴实耐用。',
  category: 'equipment',
  subcategory: 'weapon_ranged',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { attackBonus: 8, power: 5 },
  price: 150,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'weapon_ranged',
    providesSkillSlots: 1,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: 'bow',
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const STARFALL_BOW: EquipmentTemplate = {
  templateId: 'starfall_bow',
  name: '落星弓',
  description: '以星辰陨铁铸造的神弓，箭出如流星陨落。',
  category: 'equipment',
  subcategory: 'weapon_ranged',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { attackBonus: 55, power: 35 },
  price: 15000,
  element: 'wind',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'weapon_ranged',
    providesSkillSlots: 2,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: 'bow',
    compatibleElement: 'wind',
    compatibleBonus: 12,
  },
};

// ─── 防具 ───

export const CLOTH_HAT: EquipmentTemplate = {
  templateId: 'cloth_hat',
  name: '布帽',
  description: '普通的布制头冠，聊胜于无的防护。',
  category: 'equipment',
  subcategory: 'armor_head',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { defenseBonus: 3, power: 2 },
  price: 100,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_head',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const SPIRIT_CROWN: EquipmentTemplate = {
  templateId: 'spirit_crown',
  name: '灵冠',
  description: '以灵石镶嵌的头冠，能抵御精神攻击。',
  category: 'equipment',
  subcategory: 'armor_head',
  rarity: 'rare',
  maxStack: 1,
  maxLevel: 7,
  baseStats: { defenseBonus: 20, power: 10 },
  price: 3000,
  element: 'light',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_head',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: 'light',
    compatibleBonus: 8,
  },
};

export const COTTON_ROBE: EquipmentTemplate = {
  templateId: 'cotton_robe',
  name: '棉布袍',
  description: '寻常棉布缝制的衣袍，穿着舒适。',
  category: 'equipment',
  subcategory: 'armor_body',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { defenseBonus: 5, power: 3 },
  price: 150,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_body',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const DRAGON_SCALE_ARMOR: EquipmentTemplate = {
  templateId: 'dragon_scale_armor',
  name: '龙鳞甲',
  description: '以真龙鳞片铸造的神甲，刀枪不入，水火不侵。',
  category: 'equipment',
  subcategory: 'armor_body',
  rarity: 'legendary',
  maxStack: 1,
  maxLevel: 9,
  baseStats: { defenseBonus: 60, power: 35 },
  price: 40000,
  element: 'fire',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_body',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: 'fire',
    compatibleBonus: 10,
  },
};

export const COTTON_LEGGINGS: EquipmentTemplate = {
  templateId: 'cotton_leggings',
  name: '棉布裤',
  description: '普通的棉布裤，行动方便。',
  category: 'equipment',
  subcategory: 'armor_legs',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { defenseBonus: 4, power: 2 },
  price: 120,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_legs',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const WIND_WALKER_LEGGINGS: EquipmentTemplate = {
  templateId: 'wind_walker_leggings',
  name: '御风护腿',
  description: '铭刻风系阵法的护腿，穿戴者身轻如燕。',
  category: 'equipment',
  subcategory: 'armor_legs',
  rarity: 'rare',
  maxStack: 1,
  maxLevel: 7,
  baseStats: { defenseBonus: 18, power: 8 },
  price: 2500,
  element: 'wind',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_legs',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: 'wind',
    compatibleBonus: 5,
  },
};

export const COTTON_BOOTS: EquipmentTemplate = {
  templateId: 'cotton_boots',
  name: '布靴',
  description: '普通的布制靴子。',
  category: 'equipment',
  subcategory: 'armor_feet',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { defenseBonus: 3, power: 2 },
  price: 100,
  element: null,
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_feet',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: null,
    compatibleBonus: 0,
  },
};

export const CLOUD_BOOTS: EquipmentTemplate = {
  templateId: 'cloud_boots',
  name: '踏云靴',
  description: '以云锦编织的仙靴，穿戴者踏云而行，速度激增。',
  category: 'equipment',
  subcategory: 'armor_feet',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { defenseBonus: 15, power: 8 },
  price: 8000,
  element: 'wind',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    equipSlot: 'armor_feet',
    providesSkillSlots: 0,
    acceptedSkillTag: 'combat' as SkillTag,
    weaponCategory: null,
    compatibleElement: 'wind',
    compatibleBonus: 8,
  },
};

/** 修仙世界所有装备模板 */
export const CULTIVATION_EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  IRON_SWORD,
  SPIRIT_SWORD,
  FLAME_DRAGON_SWORD,
  THUNDER_BLADE,
  HUNTING_BOW,
  STARFALL_BOW,
  CLOTH_HAT,
  SPIRIT_CROWN,
  COTTON_ROBE,
  DRAGON_SCALE_ARMOR,
  COTTON_LEGGINGS,
  WIND_WALKER_LEGGINGS,
  COTTON_BOOTS,
  CLOUD_BOOTS,
];
