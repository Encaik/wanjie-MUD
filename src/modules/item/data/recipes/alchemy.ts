/**
 * 炼丹配方
 *
 * 输入材料 Item → 产出丹药 Item
 * 所有物品 ID 使用三段式格式：source:worldview:item_name
 */

import type { ItemCategory } from '../../types';

/** 炼丹配方 */
export interface AlchemyRecipe {
  id: string;
  name: string;
  description: string;
  /** 输入材料 { templateId: quantity } */
  inputs: Record<string, number>;
  /** 产出物品 templateId */
  outputTemplateId: string;
  /** 产出数量 */
  outputQuantity: number;
  /** 成功率 (0-1) */
  successRate: number;
  /** 炼制时间（秒） */
  craftTimeSeconds: number;
  /** 需要的炼丹师等级 */
  requiredAlchemyLevel: number;
  /** 需要的物品类别（读作配方分类） */
  category: ItemCategory;
}

/** 所有炼丹配方 */
export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'craft_rejuvenation',
    name: '炼制回春丹',
    description: '以灵草为原料炼制回春丹。',
    inputs: { 'wanjie:common:spirit_herb': 2 },
    outputTemplateId: 'wanjie:common:rejuvenation_pill',
    outputQuantity: 1,
    successRate: 0.9,
    craftTimeSeconds: 10,
    requiredAlchemyLevel: 1,
    category: 'consumable',
  },
  {
    id: 'craft_healing',
    name: '炼制疗伤丹',
    description: '以灵草和灵石碎片为原料炼制疗伤丹。',
    inputs: { 'wanjie:common:spirit_herb': 3, 'wanjie:common:spirit_gem': 1 },
    outputTemplateId: 'wanjie:common:healing_pill',
    outputQuantity: 1,
    successRate: 0.8,
    craftTimeSeconds: 20,
    requiredAlchemyLevel: 3,
    category: 'consumable',
  },
  {
    id: 'craft_qi_gathering',
    name: '炼制聚气丹',
    description: '以千年灵芝和妖兽利爪为原料炼制聚气丹。',
    inputs: { 'wanjie:common:thousand_year_lingzhi': 2, 'wanjie:common:beast_claw': 1 },
    outputTemplateId: 'wanjie-core:cultivation:qi_gathering_pill',
    outputQuantity: 1,
    successRate: 0.75,
    craftTimeSeconds: 30,
    requiredAlchemyLevel: 5,
    category: 'consumable',
  },
  {
    id: 'craft_foundation',
    name: '炼制筑基丹',
    description: '以千年灵芝和妖丹为原料炼制筑基丹。',
    inputs: { 'wanjie:common:thousand_year_lingzhi': 3, 'wanjie:common:demon_core': 1 },
    outputTemplateId: 'wanjie-core:cultivation:foundation_pill',
    outputQuantity: 1,
    successRate: 0.6,
    craftTimeSeconds: 60,
    requiredAlchemyLevel: 8,
    category: 'consumable',
  },
  {
    id: 'craft_golden_core',
    name: '炼制结金丹',
    description: '以万年雪莲和龙晶为原料炼制结金丹。',
    inputs: { 'wanjie:common:ten_thousand_year_lotus': 2, 'wanjie:common:dragon_crystal': 1 },
    outputTemplateId: 'wanjie-core:cultivation:golden_core_pill',
    outputQuantity: 1,
    successRate: 0.4,
    craftTimeSeconds: 120,
    requiredAlchemyLevel: 12,
    category: 'consumable',
  },
];

/** 按 ID 查找炼丹配方 */
export function getAlchemyRecipe(id: string): AlchemyRecipe | undefined {
  return ALCHEMY_RECIPES.find(r => r.id === id);
}
