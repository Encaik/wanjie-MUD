// 炼器配方定义

import { EquipmentSlot, ItemRarity } from '@/core/types';

// 装备品质
export type EquipmentQuality = '普通' | '精良' | '优秀' | '完美';

// 品质加成配置
export const EQUIPMENT_QUALITY_MULTIPLIERS: Record<EquipmentQuality, number> = {
  '普通': 1.0,
  '精良': 1.2,
  '优秀': 1.5,
  '完美': 2.0,
};

// 品质概率
export const EQUIPMENT_QUALITY_CHANCES: Record<EquipmentQuality, number> = {
  '普通': 0.35,
  '精良': 0.35,
  '优秀': 0.22,
  '完美': 0.08,
};

// 品质名称映射
export const EQUIPMENT_QUALITY_NAMES: Record<EquipmentQuality, string> = {
  '普通': '普通',
  '精良': '精良',
  '优秀': '优秀',
  '完美': '完美',
};

// 材料定义（与炼丹共用部分材料）
export interface ForgeMaterial {
  id: string;
  name: string;
  rarity: '普通' | '稀有' | '史诗';
}

// 配方材料需求
export interface ForgeMaterialRequirement {
  materialId: string;
  quantity: number;
}

// 装备属性配置
export interface EquipmentStats {
  attackBonus?: number;   // 攻击加成百分比
  defenseBonus?: number;  // 防御加成百分比
  power?: number;         // 战力
}

// 炼器配方
export interface ForgeRecipe {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  slot: EquipmentSlot;
  materials: ForgeMaterialRequirement[];
  successRate: number;    // 基础成功率 (0-100)
  craftTime: number;      // 炼制时间（秒）
  unlockLevel: number;    // 解锁等级
  baseStats: EquipmentStats;  // 基础属性
  outputQuantity: number;     // 产出数量
}

// 炼器材料列表（主要使用矿石类）
export const FORGE_MATERIALS: ForgeMaterial[] = [
  // 草药类
  { id: 'material_herb_low', name: '灵草', rarity: '普通' },
  { id: 'material_herb_mid', name: '仙草', rarity: '稀有' },
  { id: 'material_heart', name: '灵心草', rarity: '稀有' },
  // 矿石类
  { id: 'material_ore_low', name: '玄铁', rarity: '普通' },
  { id: 'material_ore_mid', name: '秘银', rarity: '稀有' },
  // 宝石类
  { id: 'material_gem_low', name: '灵石碎片', rarity: '普通' },
  { id: 'material_gem_mid', name: '仙晶', rarity: '稀有' },
  // 妖兽材料类
  { id: 'material_essence', name: '妖丹', rarity: '史诗' },
  { id: 'material_soul', name: '魂晶', rarity: '史诗' },
  { id: 'material_blood', name: '灵兽血', rarity: '稀有' },
  { id: 'material_leather', name: '灵兽皮', rarity: '稀有' },
  { id: 'material_bone', name: '灵兽骨', rarity: '史诗' },
];

// 炼器配方列表
export const FORGE_RECIPES: ForgeRecipe[] = [
  // 近战武器
  {
    id: 'recipe_weapon_melee_low',
    name: '玄铁剑',
    description: '低级近战武器，提升攻击力',
    rarity: '普通',
    slot: 'melee',
    materials: [
      { materialId: 'material_ore_low', quantity: 3 },
      { materialId: 'material_gem_low', quantity: 1 },
    ],
    successRate: 85,
    craftTime: 40,
    unlockLevel: 1,
    baseStats: { attackBonus: 5, power: 10 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_weapon_melee_mid',
    name: '秘银剑',
    description: '中级近战武器，大幅提升攻击力',
    rarity: '稀有',
    slot: 'melee',
    materials: [
      { materialId: 'material_ore_mid', quantity: 3 },
      { materialId: 'material_gem_mid', quantity: 1 },
      { materialId: 'material_blood', quantity: 1 },
    ],
    successRate: 70,
    craftTime: 80,
    unlockLevel: 11,
    baseStats: { attackBonus: 12, power: 30 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_weapon_melee_high',
    name: '灵骨剑',
    description: '高级近战武器，极大提升攻击力',
    rarity: '史诗',
    slot: 'melee',
    materials: [
      { materialId: 'material_bone', quantity: 2 },
      { materialId: 'material_soul', quantity: 1 },
      { materialId: 'material_essence', quantity: 1 },
    ],
    successRate: 50,
    craftTime: 150,
    unlockLevel: 21,
    baseStats: { attackBonus: 25, power: 80 },
    outputQuantity: 1,
  },
  
  // 远程武器
  {
    id: 'recipe_weapon_ranged_low',
    name: '灵木弓',
    description: '低级远程武器，提升攻击力',
    rarity: '普通',
    slot: 'ranged',
    materials: [
      { materialId: 'material_herb_low', quantity: 2 },
      { materialId: 'material_gem_low', quantity: 2 },
    ],
    successRate: 85,
    craftTime: 40,
    unlockLevel: 3,
    baseStats: { attackBonus: 4, power: 8 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_weapon_ranged_mid',
    name: '风灵弓',
    description: '中级远程武器，大幅提升攻击力',
    rarity: '稀有',
    slot: 'ranged',
    materials: [
      { materialId: 'material_herb_mid', quantity: 2 },
      { materialId: 'material_gem_mid', quantity: 2 },
      { materialId: 'material_heart', quantity: 1 },
    ],
    successRate: 70,
    craftTime: 80,
    unlockLevel: 13,
    baseStats: { attackBonus: 10, power: 25 },
    outputQuantity: 1,
  },
  
  // 头部防具
  {
    id: 'recipe_armor_head_low',
    name: '玄铁盔',
    description: '低级头部防具，提升防御力',
    rarity: '普通',
    slot: 'head',
    materials: [
      { materialId: 'material_ore_low', quantity: 2 },
      { materialId: 'material_leather', quantity: 1 },
    ],
    successRate: 85,
    craftTime: 35,
    unlockLevel: 2,
    baseStats: { defenseBonus: 3, power: 6 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_armor_head_mid',
    name: '秘银盔',
    description: '中级头部防具，大幅提升防御力',
    rarity: '稀有',
    slot: 'head',
    materials: [
      { materialId: 'material_ore_mid', quantity: 2 },
      { materialId: 'material_leather', quantity: 2 },
      { materialId: 'material_gem_low', quantity: 1 },
    ],
    successRate: 72,
    craftTime: 70,
    unlockLevel: 12,
    baseStats: { defenseBonus: 8, power: 20 },
    outputQuantity: 1,
  },
  
  // 身体防具
  {
    id: 'recipe_armor_body_low',
    name: '玄铁甲',
    description: '低级身体防具，提升防御力',
    rarity: '普通',
    slot: 'body',
    materials: [
      { materialId: 'material_ore_low', quantity: 4 },
      { materialId: 'material_leather', quantity: 2 },
    ],
    successRate: 80,
    craftTime: 50,
    unlockLevel: 2,
    baseStats: { defenseBonus: 5, power: 12 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_armor_body_mid',
    name: '秘银甲',
    description: '中级身体防具，大幅提升防御力',
    rarity: '稀有',
    slot: 'body',
    materials: [
      { materialId: 'material_ore_mid', quantity: 4 },
      { materialId: 'material_leather', quantity: 2 },
      { materialId: 'material_blood', quantity: 1 },
    ],
    successRate: 65,
    craftTime: 100,
    unlockLevel: 12,
    baseStats: { defenseBonus: 15, power: 40 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_armor_body_high',
    name: '灵骨甲',
    description: '高级身体防具，极大提升防御力',
    rarity: '史诗',
    slot: 'body',
    materials: [
      { materialId: 'material_bone', quantity: 3 },
      { materialId: 'material_soul', quantity: 1 },
      { materialId: 'material_essence', quantity: 2 },
    ],
    successRate: 45,
    craftTime: 180,
    unlockLevel: 22,
    baseStats: { defenseBonus: 30, power: 100 },
    outputQuantity: 1,
  },
  
  // 腿部防具
  {
    id: 'recipe_armor_legs_low',
    name: '玄铁护腿',
    description: '低级腿部防具，提升防御力',
    rarity: '普通',
    slot: 'legs',
    materials: [
      { materialId: 'material_ore_low', quantity: 2 },
      { materialId: 'material_leather', quantity: 1 },
    ],
    successRate: 85,
    craftTime: 35,
    unlockLevel: 4,
    baseStats: { defenseBonus: 2, power: 5 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_armor_legs_mid',
    name: '秘银护腿',
    description: '中级腿部防具，大幅提升防御力',
    rarity: '稀有',
    slot: 'legs',
    materials: [
      { materialId: 'material_ore_mid', quantity: 2 },
      { materialId: 'material_leather', quantity: 1 },
      { materialId: 'material_gem_low', quantity: 1 },
    ],
    successRate: 72,
    craftTime: 65,
    unlockLevel: 14,
    baseStats: { defenseBonus: 6, power: 18 },
    outputQuantity: 1,
  },
  
  // 脚部防具
  {
    id: 'recipe_armor_feet_low',
    name: '玄铁靴',
    description: '低级脚部防具，提升防御力',
    rarity: '普通',
    slot: 'feet',
    materials: [
      { materialId: 'material_ore_low', quantity: 2 },
      { materialId: 'material_leather', quantity: 2 },
    ],
    successRate: 85,
    craftTime: 35,
    unlockLevel: 4,
    baseStats: { defenseBonus: 2, power: 4 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_armor_feet_mid',
    name: '秘银靴',
    description: '中级脚部防具，大幅提升防御力',
    rarity: '稀有',
    slot: 'feet',
    materials: [
      { materialId: 'material_ore_mid', quantity: 2 },
      { materialId: 'material_leather', quantity: 2 },
      { materialId: 'material_gem_low', quantity: 1 },
    ],
    successRate: 72,
    craftTime: 60,
    unlockLevel: 14,
    baseStats: { defenseBonus: 5, power: 15 },
    outputQuantity: 1,
  },
  
  // 传说装备
  {
    id: 'recipe_weapon_legendary',
    name: '天命剑',
    description: '传说级武器，攻击力惊人',
    rarity: '传说',
    slot: 'melee',
    materials: [
      { materialId: 'material_bone', quantity: 3 },
      { materialId: 'material_soul', quantity: 3 },
      { materialId: 'material_essence', quantity: 3 },
      { materialId: 'material_gem_mid', quantity: 2 },
    ],
    successRate: 30,
    craftTime: 300,
    unlockLevel: 31,
    baseStats: { attackBonus: 50, power: 200 },
    outputQuantity: 1,
  },
  {
    id: 'recipe_armor_legendary',
    name: '天命甲',
    description: '传说级防具，防御力惊人',
    rarity: '传说',
    slot: 'body',
    materials: [
      { materialId: 'material_bone', quantity: 4 },
      { materialId: 'material_soul', quantity: 2 },
      { materialId: 'material_essence', quantity: 4 },
      { materialId: 'material_gem_mid', quantity: 3 },
    ],
    successRate: 25,
    craftTime: 360,
    unlockLevel: 33,
    baseStats: { defenseBonus: 60, power: 250 },
    outputQuantity: 1,
  },
];

// 获取已解锁的配方
export function getUnlockedForgeRecipes(playerLevel: number): ForgeRecipe[] {
  return FORGE_RECIPES.filter(recipe => recipe.unlockLevel <= playerLevel);
}

// 根据ID获取配方
export function getForgeRecipeById(id: string): ForgeRecipe | undefined {
  return FORGE_RECIPES.find(recipe => recipe.id === id);
}

// 根据ID获取材料信息
export function getForgeMaterialById(id: string): ForgeMaterial | undefined {
  return FORGE_MATERIALS.find(material => material.id === id);
}

// 检查材料是否足够
export function hasEnoughForgeMaterials(
  inventory: { definition: { id: string }; quantity: number }[],
  requirements: ForgeMaterialRequirement[]
): boolean {
  for (const req of requirements) {
    const item = inventory.find(i => i.definition.id === req.materialId);
    if (!item || item.quantity < req.quantity) {
      return false;
    }
  }
  return true;
}

// 判定炼制品质
export function determineEquipmentQuality(): EquipmentQuality {
  const roll = Math.random();
  let cumulative = 0;
  
  const qualities: EquipmentQuality[] = ['普通', '精良', '优秀', '完美'];
  for (const quality of qualities) {
    cumulative += EQUIPMENT_QUALITY_CHANCES[quality];
    if (roll < cumulative) {
      return quality;
    }
  }
  return '普通';
}

// 计算最终属性
export function calculateFinalStats(baseStats: EquipmentStats, quality: EquipmentQuality): EquipmentStats {
  const multiplier = EQUIPMENT_QUALITY_MULTIPLIERS[quality];
  return {
    attackBonus: baseStats.attackBonus ? Math.floor(baseStats.attackBonus * multiplier) : undefined,
    defenseBonus: baseStats.defenseBonus ? Math.floor(baseStats.defenseBonus * multiplier) : undefined,
    power: baseStats.power ? Math.floor(baseStats.power * multiplier) : undefined,
  };
}

// 根据槽位获取中文名称
export function getSlotName(slot: EquipmentSlot): string {
  const names: Record<EquipmentSlot, string> = {
    melee: '近战武器',
    ranged: '远程武器',
    head: '头部防具',
    body: '身体防具',
    legs: '腿部防具',
    feet: '脚部防具',
  };
  return names[slot];
}
