// 炼丹配方定义
import { EffectType } from '../game/types';

// 丹药品质
export type PillQuality = '下品' | '中品' | '上品' | '极品';

// 品质加成配置
export const QUALITY_MULTIPLIERS: Record<PillQuality, number> = {
  '下品': 1.0,
  '中品': 1.3,
  '上品': 1.6,
  '极品': 2.0,
};

// 品质概率（基于炼制成功后的品质判定）
export const QUALITY_CHANCES: Record<PillQuality, number> = {
  '下品': 0.40,
  '中品': 0.35,
  '上品': 0.20,
  '极品': 0.05,
};

// 品质名称映射
export const PILL_QUALITY_NAMES: Record<PillQuality, string> = {
  '下品': '下品',
  '中品': '中品',
  '上品': '上品',
  '极品': '极品',
};

// 材料定义
export interface AlchemyMaterial {
  id: string;
  name: string;
  rarity: '普通' | '稀有' | '史诗';
}

// 配方材料需求
export interface MaterialRequirement {
  materialId: string;
  quantity: number;
}

// 丹药效果配置
export interface PillEffect {
  type: EffectType;
  baseValue: number;  // 基础数值
  duration?: number;  // 持续次数（针对增益效果）
  description?: string;  // 效果描述
}

// 炼丹配方
export interface AlchemyRecipe {
  id: string;
  name: string;
  description: string;
  rarity: '普通' | '稀有' | '史诗' | '传说';
  materials: MaterialRequirement[];
  successRate: number;  // 基础成功率 (0-100)
  craftTime: number;    // 炼制时间（秒）
  unlockLevel: number;  // 解锁等级
  effects: PillEffect[];
  outputQuantity: number;  // 产出数量
  // 境界限制
  realmLevel?: number;  // 适用境界等级（1-10），不填则根据unlockLevel自动计算
  realmDescription?: string;  // 境界描述（用于显示）
}

// 材料列表
export const ALCHEMY_MATERIALS: AlchemyMaterial[] = [
  { id: 'material_herb_low', name: '灵草', rarity: '普通' },
  { id: 'material_herb_mid', name: '仙草', rarity: '稀有' },
  { id: 'material_herb_high', name: '神草', rarity: '史诗' },
  { id: 'material_ore_low', name: '玄铁', rarity: '普通' },
  { id: 'material_ore_mid', name: '秘银', rarity: '稀有' },
  { id: 'material_gem_low', name: '灵石碎片', rarity: '普通' },
  { id: 'material_gem_mid', name: '仙晶', rarity: '稀有' },
  { id: 'material_essence', name: '妖丹', rarity: '史诗' },
  { id: 'material_soul', name: '魂晶', rarity: '史诗' },
  { id: 'material_blood', name: '灵兽血', rarity: '稀有' },
  { id: 'material_heart', name: '灵心草', rarity: '稀有' },
];

// 炼丹配方列表
export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  // 低级丹药（1-10级解锁，境界1-2适用）
  {
    id: 'recipe_pill_cultivation_low',
    name: '聚气丹',
    description: '低级修炼丹药，可提升修炼效果',
    rarity: '普通',
    materials: [
      { materialId: 'material_herb_low', quantity: 3 },
    ],
    successRate: 85,
    craftTime: 30,
    unlockLevel: 1,
    effects: [
      { type: 'cultivation_boost', baseValue: 20, duration: 3 },
    ],
    outputQuantity: 1,
    realmLevel: 1,
    realmDescription: '炼气期适用',
  },
  {
    id: 'recipe_pill_hp_low',
    name: '回春丹',
    description: '低级回血丹药，恢复少量生命值',
    rarity: '普通',
    materials: [
      { materialId: 'material_herb_low', quantity: 2 },
      { materialId: 'material_heart', quantity: 1 },
    ],
    successRate: 90,
    craftTime: 25,
    unlockLevel: 1,
    effects: [
      { type: 'restore_hp', baseValue: 30 },
    ],
    outputQuantity: 2,
    realmLevel: 1,
    realmDescription: '炼气期适用',
  },
  {
    id: 'recipe_pill_mp_low',
    name: '聚神丹',
    description: '低级回蓝丹药，恢复少量法力值',
    rarity: '普通',
    materials: [
      { materialId: 'material_gem_low', quantity: 2 },
      { materialId: 'material_herb_low', quantity: 1 },
    ],
    successRate: 90,
    craftTime: 25,
    unlockLevel: 1,
    effects: [
      { type: 'restore_mp', baseValue: 30 },
    ],
    outputQuantity: 2,
    realmLevel: 1,
    realmDescription: '炼气期适用',
  },
  {
    id: 'recipe_pill_breakthrough_low',
    name: '筑基丹',
    description: '低级突破丹药，可提升突破成功率',
    rarity: '普通',
    materials: [
      { materialId: 'material_herb_mid', quantity: 1 },
      { materialId: 'material_ore_low', quantity: 2 },
    ],
    successRate: 70,
    craftTime: 45,
    unlockLevel: 5,
    effects: [
      { type: 'breakthrough_boost', baseValue: 15, duration: 1 },
    ],
    outputQuantity: 1,
    realmLevel: 2,
    realmDescription: '筑基期适用',
  },
  
  // 中级丹药（11-20级解锁，境界3-4适用）
  {
    id: 'recipe_pill_cultivation_mid',
    name: '凝元丹',
    description: '中级修炼丹药，可大幅提升修炼效果',
    rarity: '稀有',
    materials: [
      { materialId: 'material_herb_mid', quantity: 3 },
      { materialId: 'material_heart', quantity: 1 },
    ],
    successRate: 75,
    craftTime: 60,
    unlockLevel: 11,
    effects: [
      { type: 'cultivation_boost', baseValue: 50, duration: 3 },
    ],
    outputQuantity: 1,
    realmLevel: 3,
    realmDescription: '金丹期适用',
  },
  {
    id: 'recipe_pill_hp_mid',
    name: '疗伤丹',
    description: '中级回血丹药，恢复中等生命值',
    rarity: '稀有',
    materials: [
      { materialId: 'material_herb_mid', quantity: 2 },
      { materialId: 'material_blood', quantity: 1 },
    ],
    successRate: 80,
    craftTime: 40,
    unlockLevel: 12,
    effects: [
      { type: 'restore_hp', baseValue: 80 },
    ],
    outputQuantity: 2,
    realmLevel: 3,
    realmDescription: '金丹期适用',
  },
  {
    id: 'recipe_pill_mp_mid',
    name: '回元丹',
    description: '中级回蓝丹药，恢复中等法力值',
    rarity: '稀有',
    materials: [
      { materialId: 'material_gem_mid', quantity: 2 },
      { materialId: 'material_herb_mid', quantity: 1 },
    ],
    successRate: 80,
    craftTime: 40,
    unlockLevel: 12,
    effects: [
      { type: 'restore_mp', baseValue: 80 },
    ],
    outputQuantity: 2,
    realmLevel: 3,
    realmDescription: '金丹期适用',
  },
  {
    id: 'recipe_pill_breakthrough_mid',
    name: '通脉丹',
    description: '中级突破丹药，可大幅提升突破成功率',
    rarity: '稀有',
    materials: [
      { materialId: 'material_essence', quantity: 1 },
      { materialId: 'material_herb_mid', quantity: 2 },
      { materialId: 'material_ore_mid', quantity: 1 },
    ],
    successRate: 60,
    craftTime: 90,
    unlockLevel: 15,
    effects: [
      { type: 'breakthrough_boost', baseValue: 30, duration: 1 },
    ],
    outputQuantity: 1,
    realmLevel: 4,
    realmDescription: '元婴期适用',
  },
  
  // 高级丹药（21-30级解锁，境界5-6适用）
  {
    id: 'recipe_pill_cultivation_high',
    name: '化神丹',
    description: '高级修炼丹药，可极大提升修炼效果',
    rarity: '史诗',
    materials: [
      { materialId: 'material_herb_high', quantity: 2 },
      { materialId: 'material_soul', quantity: 1 },
      { materialId: 'material_essence', quantity: 1 },
    ],
    successRate: 55,
    craftTime: 120,
    unlockLevel: 21,
    effects: [
      { type: 'cultivation_boost', baseValue: 100, duration: 3 },
    ],
    outputQuantity: 1,
    realmLevel: 5,
    realmDescription: '化神期适用',
  },
  {
    id: 'recipe_pill_hp_high',
    name: '九转还魂丹',
    description: '高级回血丹药，恢复大量生命值',
    rarity: '史诗',
    materials: [
      { materialId: 'material_herb_high', quantity: 2 },
      { materialId: 'material_blood', quantity: 2 },
      { materialId: 'material_heart', quantity: 1 },
    ],
    successRate: 65,
    craftTime: 100,
    unlockLevel: 22,
    effects: [
      { type: 'restore_hp', baseValue: 200 },
    ],
    outputQuantity: 1,
    realmLevel: 5,
    realmDescription: '化神期适用',
  },
  {
    id: 'recipe_pill_breakthrough_high',
    name: '天元丹',
    description: '高级突破丹药，可极大提升突破成功率',
    rarity: '史诗',
    materials: [
      { materialId: 'material_soul', quantity: 2 },
      { materialId: 'material_essence', quantity: 2 },
      { materialId: 'material_herb_high', quantity: 1 },
    ],
    successRate: 45,
    craftTime: 180,
    unlockLevel: 25,
    effects: [
      { type: 'breakthrough_boost', baseValue: 50, duration: 1 },
    ],
    outputQuantity: 1,
    realmLevel: 5,
    realmDescription: '化神期适用',
  },
  
  // 传说丹药（31级以上解锁，境界7+适用）
  {
    id: 'recipe_pill_immortal',
    name: '仙元丹',
    description: '传说级修炼丹药，修炼效果翻倍',
    rarity: '传说',
    materials: [
      { materialId: 'material_herb_high', quantity: 3 },
      { materialId: 'material_soul', quantity: 2 },
      { materialId: 'material_essence', quantity: 3 },
    ],
    successRate: 30,
    craftTime: 300,
    unlockLevel: 31,
    effects: [
      { type: 'cultivation_boost', baseValue: 200, duration: 5 },
    ],
    outputQuantity: 1,
    realmLevel: 7,
    realmDescription: '合体期适用',
  },
  {
    id: 'recipe_pill_stat',
    name: '洗髓丹',
    description: '传说级丹药，永久提升全属性',
    rarity: '传说',
    materials: [
      { materialId: 'material_soul', quantity: 3 },
      { materialId: 'material_essence', quantity: 3 },
      { materialId: 'material_herb_high', quantity: 2 },
      { materialId: 'material_gem_mid', quantity: 2 },
    ],
    successRate: 25,
    craftTime: 360,
    unlockLevel: 35,
    effects: [
      { type: 'stat_boost', baseValue: 5 },
    ],
    outputQuantity: 1,
    realmLevel: 8,
    realmDescription: '大乘期适用',
  },
];

// 获取已解锁的配方
export function getUnlockedRecipes(playerLevel: number): AlchemyRecipe[] {
  return ALCHEMY_RECIPES.filter(recipe => recipe.unlockLevel <= playerLevel);
}

// 根据ID获取配方
export function getAlchemyRecipeById(id: string): AlchemyRecipe | undefined {
  return ALCHEMY_RECIPES.find(recipe => recipe.id === id);
}

// 根据ID获取材料信息
export function getAlchemyMaterialById(id: string): AlchemyMaterial | undefined {
  return ALCHEMY_MATERIALS.find(material => material.id === id);
}

// 检查材料是否足够
export function hasEnoughMaterials(
  inventory: { definition: { id: string }; quantity: number }[],
  requirements: MaterialRequirement[]
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
export function determineQuality(): PillQuality {
  const roll = Math.random();
  let cumulative = 0;
  
  const qualities: PillQuality[] = ['下品', '中品', '上品', '极品'];
  for (const quality of qualities) {
    cumulative += QUALITY_CHANCES[quality];
    if (roll < cumulative) {
      return quality;
    }
  }
  return '下品';
}

// 计算最终效果值
export function calculateFinalEffect(baseValue: number, quality: PillQuality): number {
  return Math.floor(baseValue * QUALITY_MULTIPLIERS[quality]);
}
