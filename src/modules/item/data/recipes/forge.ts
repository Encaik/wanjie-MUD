/**
 * 炼器配方
 *
 * 输入材料 Item → 产出装备 Item
 */

/** 炼器配方 */
export interface ForgeRecipe {
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
  /** 需要的炼器师等级 */
  requiredForgeLevel: number;
}

/** 所有炼器配方 */
export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: 'forge_iron_sword',
    name: '锻造铁剑',
    description: '以铁矿石为原料锻造铁剑。',
    inputs: { iron_ore: 3 },
    outputTemplateId: 'iron_sword',
    outputQuantity: 1,
    successRate: 0.9,
    craftTimeSeconds: 15,
    requiredForgeLevel: 1,
  },
  {
    id: 'forge_spirit_sword',
    name: '淬炼灵剑',
    description: '以铁矿石和灵石碎片淬炼灵剑。',
    inputs: { iron_ore: 5, spirit_gem: 2 },
    outputTemplateId: 'spirit_sword',
    outputQuantity: 1,
    successRate: 0.8,
    craftTimeSeconds: 30,
    requiredForgeLevel: 3,
  },
  {
    id: 'forge_thunder_blade',
    name: '铸造惊雷刀',
    description: '以玄铁和妖兽利爪铸造惊雷刀。',
    inputs: { black_iron: 4, beast_claw: 3 },
    outputTemplateId: 'thunder_blade',
    outputQuantity: 1,
    successRate: 0.6,
    craftTimeSeconds: 60,
    requiredForgeLevel: 7,
  },
  {
    id: 'forge_dragon_scale',
    name: '铸造龙鳞甲',
    description: '以玄铁和龙晶铸造龙鳞甲。',
    inputs: { black_iron: 6, dragon_crystal: 1 },
    outputTemplateId: 'dragon_scale_armor',
    outputQuantity: 1,
    successRate: 0.4,
    craftTimeSeconds: 120,
    requiredForgeLevel: 10,
  },
];

/** 按 ID 查找炼器配方 */
export function getForgeRecipe(id: string): ForgeRecipe | undefined {
  return FORGE_RECIPES.find(r => r.id === id);
}
