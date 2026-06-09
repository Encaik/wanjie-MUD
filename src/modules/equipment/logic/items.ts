import { getTerminology } from '@/modules/narrative/logic/terminology';
import { ItemDefinition, WorldType } from '@/shared/lib/types';

// 根据世界类型获取灵石名称 - 使用统一术语系统
export function getResourceName(worldType: WorldType): string {
  return getTerminology(worldType).resource;
}

// 根据世界类型获取灵石描述 - 使用统一术语系统
export function getResourceDesc(worldType: WorldType): string {
  return getTerminology(worldType).resourceDesc;
}

/**
 * 创建世界适配的灵石物品定义
 * 不同世界使用不同的资源名称
 */
export function createSpiritStoneItem(worldType: WorldType): ItemDefinition {
  const terminology = getTerminology(worldType);
  return {
    id: 'spirit_stone',
    name: terminology.resource,
    type: '灵石',
    rarity: '普通',
    description: terminology.resourceDesc,
    effects: [],
    stackable: true,
    maxStack: 999999
  };
}

// 灵石定义（作为基础货币道具）- 保留用于兼容，但建议使用 createSpiritStoneItem
export const spiritStoneItems: ItemDefinition[] = [
  {
    id: 'spirit_stone',
    name: '灵石',
    type: '灵石',
    rarity: '普通',
    description: '通用资源，可用于修炼',
    effects: [],
    stackable: true,
    maxStack: 999999
  }
];

// 突破丹药定义
export const breakthroughItems: ItemDefinition[] = [
  {
    id: 'pill_breakthrough_low',
    name: '筑基丹',
    type: '丹药',
    rarity: '稀有',
    description: '辅助低境界突破的丹药，可提升20%突破成功率',
    effects: [
      {
        type: 'breakthrough_boost',
        value: 20,
        duration: 1,
        description: '突破成功率提升20%（下次突破生效）'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_breakthrough_mid',
    name: '结金丹',
    type: '丹药',
    rarity: '史诗',
    description: '辅助中境界突破的丹药，可提升40%突破成功率',
    effects: [
      {
        type: 'breakthrough_boost',
        value: 40,
        duration: 1,
        description: '突破成功率提升40%（下次突破生效）'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_breakthrough_high',
    name: '渡劫丹',
    type: '丹药',
    rarity: '传说',
    description: '辅助高境界突破的丹药，可提升60%突破成功率',
    effects: [
      {
        type: 'breakthrough_boost',
        value: 60,
        duration: 1,
        description: '突破成功率提升60%（下次突破生效）'
      }
    ],
    stackable: true,
    maxStack: 99
  }
];

// 修炼丹药定义
export const cultivationPillItems: ItemDefinition[] = [
  {
    id: 'pill_cultivation_low',
    name: '聚气丹',
    type: '丹药',
    rarity: '普通',
    description: '低级修炼丹药，可提升修炼效果',
    effects: [
      {
        type: 'cultivation_boost',
        value: 20,
        duration: 3,
        description: '修炼效果提升20%（持续3次）'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_cultivation_mid',
    name: '凝元丹',
    type: '丹药',
    rarity: '稀有',
    description: '中级修炼丹药，可大幅提升修炼效果',
    effects: [
      {
        type: 'cultivation_boost',
        value: 50,
        duration: 3,
        description: '修炼效果提升50%（持续3次）'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_cultivation_high',
    name: '化神丹',
    type: '丹药',
    rarity: '史诗',
    description: '高级修炼丹药，可极大提升修炼效果',
    effects: [
      {
        type: 'cultivation_boost',
        value: 100,
        duration: 3,
        description: '修炼效果提升100%（持续3次）'
      }
    ],
    stackable: true,
    maxStack: 99
  }
];

// 恢复丹药定义
export const restorePillItems: ItemDefinition[] = [
  {
    id: 'pill_hp_low',
    name: '回春丹',
    type: '丹药',
    rarity: '普通',
    description: '低级回血丹药，恢复少量生命值',
    effects: [
      {
        type: 'restore_hp',
        value: 30,
        description: '恢复30点生命值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_hp_mid',
    name: '益寿丹',
    type: '丹药',
    rarity: '稀有',
    description: '中级回血丹药，恢复中量生命值',
    effects: [
      {
        type: 'restore_hp',
        value: 80,
        description: '恢复80点生命值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_hp_high',
    name: '仙灵丹',
    type: '丹药',
    rarity: '史诗',
    description: '高级回血丹药，恢复大量生命值',
    effects: [
      {
        type: 'restore_hp',
        value: 200,
        description: '恢复200点生命值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_mp_low',
    name: '聚灵丹',
    type: '丹药',
    rarity: '普通',
    description: '低级回蓝丹药，恢复少量法力值',
    effects: [
      {
        type: 'restore_mp',
        value: 20,
        description: '恢复20点法力值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_mp_mid',
    name: '凝神丹',
    type: '丹药',
    rarity: '稀有',
    description: '中级回蓝丹药，恢复中量法力值',
    effects: [
      {
        type: 'restore_mp',
        value: 50,
        description: '恢复50点法力值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_mp_high',
    name: '天元丹',
    type: '丹药',
    rarity: '史诗',
    description: '高级回蓝丹药，恢复大量法力值',
    effects: [
      {
        type: 'restore_mp',
        value: 120,
        description: '恢复120点法力值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_both_low',
    name: '双修丹',
    type: '丹药',
    rarity: '稀有',
    description: '低级双修丹药，同时恢复生命和法力',
    effects: [
      {
        type: 'restore_hp',
        value: 25,
        description: '恢复25点生命值'
      },
      {
        type: 'restore_mp',
        value: 15,
        description: '恢复15点法力值'
      }
    ],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'pill_both_high',
    name: '九转还魂丹',
    type: '丹药',
    rarity: '传说',
    description: '传说中的神丹，可大幅恢复生命和法力',
    effects: [
      {
        type: 'restore_hp',
        value: 150,
        description: '恢复150点生命值'
      },
      {
        type: 'restore_mp',
        value: 100,
        description: '恢复100点法力值'
      }
    ],
    stackable: true,
    maxStack: 99
  }
];

// 材料道具定义
export const materialItems: ItemDefinition[] = [
  // 草药类
  {
    id: 'material_herb_low',
    name: '灵草',
    type: '材料',
    rarity: '普通',
    description: '低级灵草，可用于炼丹',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  {
    id: 'material_herb_mid',
    name: '仙草',
    type: '材料',
    rarity: '稀有',
    description: '中级仙草，可用于炼制高级丹药',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  {
    id: 'material_heart',
    name: '灵心草',
    type: '材料',
    rarity: '稀有',
    description: '蕴含灵心的珍稀草药，可用于炼制高级装备',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  // 矿石类
  {
    id: 'material_ore_low',
    name: '玄铁',
    type: '材料',
    rarity: '普通',
    description: '低级矿石，可用于炼器',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  {
    id: 'material_ore_mid',
    name: '秘银',
    type: '材料',
    rarity: '稀有',
    description: '中级矿石，可用于锻造高级装备',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  {
    id: 'material_ore_high',
    name: '天晶',
    type: '材料',
    rarity: '史诗',
    description: '高级晶石，可用于炼制法宝',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  // 宝石类
  {
    id: 'material_gem_low',
    name: '灵石碎片',
    type: '材料',
    rarity: '普通',
    description: '低级宝石碎片，蕴含微弱灵力',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  {
    id: 'material_gem_mid',
    name: '仙晶',
    type: '材料',
    rarity: '稀有',
    description: '中级宝石，蕴含灵力',
    effects: [],
    stackable: true,
    maxStack: 999
  },
  // 妖兽材料类
  {
    id: 'material_essence',
    name: '妖丹',
    type: '材料',
    rarity: '史诗',
    description: '妖兽内丹，蕴含强大能量',
    effects: [],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'material_soul',
    name: '魂晶',
    type: '材料',
    rarity: '史诗',
    description: '凝聚魂力的晶石，极为珍贵',
    effects: [],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'material_blood',
    name: '灵兽血',
    type: '材料',
    rarity: '稀有',
    description: '灵兽之血，蕴含灵性',
    effects: [],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'material_leather',
    name: '灵兽皮',
    type: '材料',
    rarity: '稀有',
    description: '灵兽之皮，坚韧异常',
    effects: [],
    stackable: true,
    maxStack: 99
  },
  {
    id: 'material_bone',
    name: '灵兽骨',
    type: '材料',
    rarity: '史诗',
    description: '灵兽之骨，蕴含强大力量',
    effects: [],
    stackable: true,
    maxStack: 99
  }
];

// 根据ID获取道具定义
export function getItemById(id: string): ItemDefinition | undefined {
  const allItems = [
    ...spiritStoneItems,
    ...breakthroughItems,
    ...cultivationPillItems,
    ...restorePillItems,
    ...materialItems
  ];
  return allItems.find(item => item.id === id);
}

// 根据难度获取随机道具
export function getRandomItem(difficulty: number): ItemDefinition | undefined {
  const items: ItemDefinition[] = [];
  
  // 低难度：低级丹药和材料
  if (difficulty <= 15) {
    items.push(
      cultivationPillItems[0], 
      ...materialItems.filter(m => m.rarity === '普通'),
      restorePillItems[0],  // 回春丹
      restorePillItems[3]   // 聚灵丹
    );
  }
  // 中难度：中级丹药和材料
  if (difficulty > 15 && difficulty <= 50) {
    items.push(
      cultivationPillItems[1], 
      ...materialItems.filter(m => m.rarity === '稀有'),
      restorePillItems[1],  // 益寿丹
      restorePillItems[4],  // 凝神丹
      restorePillItems[6]   // 双修丹
    );
  }
  // 高难度：高级丹药和材料
  if (difficulty > 50) {
    items.push(
      cultivationPillItems[2], 
      ...materialItems.filter(m => m.rarity === '史诗'),
      breakthroughItems[1],
      restorePillItems[2],  // 仙灵丹
      restorePillItems[5],  // 天元丹
      restorePillItems[7]   // 九转还魂丹
    );
  }
  
  return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : undefined;
}

// 商店物品定义
export interface ShopItem {
  id: string;
  name: string;
  type: '丹药' | '材料' | '功法' | '装备';
  rarity: string;
  description: string;
  price: number;
  levelRequirement?: number;
}

// 获取商店物品列表
export function getShopItems(worldType: WorldType, playerLevel: number): {
  pills: ShopItem[];
  materials: ShopItem[];
  techniques: ShopItem[];
  equipments: ShopItem[];
} {
  const terminology = getTerminology(worldType);
  
  // 丹药
  const pills: ShopItem[] = [
    { id: 'pill_breakthrough_low', name: '筑基丹', type: '丹药', rarity: '稀有', description: '突破成功率提升20%', price: 500, levelRequirement: 5 },
    { id: 'pill_breakthrough_mid', name: '结金丹', type: '丹药', rarity: '史诗', description: '突破成功率提升40%', price: 2000, levelRequirement: 15 },
    { id: 'pill_breakthrough_high', name: '渡劫丹', type: '丹药', rarity: '传说', description: '突破成功率提升60%', price: 8000, levelRequirement: 30 },
    { id: 'pill_cultivation_low', name: '聚气丹', type: '丹药', rarity: '普通', description: '修炼效果提升20%（3次）', price: 100 },
    { id: 'pill_cultivation_mid', name: '凝元丹', type: '丹药', rarity: '稀有', description: '修炼效果提升50%（3次）', price: 500 },
    { id: 'pill_cultivation_high', name: '化神丹', type: '丹药', rarity: '史诗', description: '修炼效果提升100%（3次）', price: 2000, levelRequirement: 20 },
    { id: 'pill_hp_mid', name: '益寿丹', type: '丹药', rarity: '稀有', description: '恢复80点生命值', price: 200 },
    { id: 'pill_mp_mid', name: '凝神丹', type: '丹药', rarity: '稀有', description: '恢复50点法力值', price: 200 },
  ];

  // 材料
  const materials: ShopItem[] = [
    { id: 'material_herb_low', name: '灵草', type: '材料', rarity: '普通', description: '低级灵草，可用于炼丹', price: 50 },
    { id: 'material_herb_mid', name: '仙草', type: '材料', rarity: '稀有', description: '中级仙草，可用于炼制高级丹药', price: 300 },
    { id: 'material_ore_low', name: '玄铁', type: '材料', rarity: '普通', description: '低级矿石，可用于炼器', price: 80 },
    { id: 'material_ore_high', name: '天晶', type: '材料', rarity: '史诗', description: '高级晶石，可用于炼制法宝', price: 1500 },
    { id: 'material_essence', name: '妖丹', type: '材料', rarity: '稀有', description: '妖兽内丹，蕴含强大能量', price: 500 },
    { id: 'material_beast_bone', name: '兽骨', type: '材料', rarity: '普通', description: '妖兽骨骼，可用于炼器', price: 100 },
    { id: 'material_spirit_wood', name: '灵木', type: '材料', rarity: '稀有', description: '灵性木材，可用于炼制法宝', price: 400 },
    { id: 'material_heart_iron', name: '玄心铁', type: '材料', rarity: '史诗', description: '稀有金属，可大幅提升装备品质', price: 2000 },
  ];

  // 功法（根据世界类型生成名称）
  const techniqueNames: string[] = (terminology as any).techniqueNames || ['烈焰诀', '寒冰诀', '雷霆诀', '狂风诀', '厚土诀', '星辰诀', '幽冥诀', '天罡诀'];
  const techniqueTypes = ['攻击', '防御'] as const;
  const rarities = ['普通', '稀有', '史诗', '传说'];
  
  const techniques: ShopItem[] = techniqueNames.slice(0, 8).map((name: string, i: number) => {
    const type = techniqueTypes[i % 2];
    const rarityIndex = Math.min(Math.floor(i / 2), 3);
    const rarity = rarities[rarityIndex];
    const basePrice = { '普通': 300, '稀有': 1000, '史诗': 3000, '传说': 8000 }[rarity] || 300;
    return {
      id: `shop_technique_${i}`,
      name,
      type: '功法' as const,
      rarity,
      description: `${type}型功法，适合${rarity === '传说' ? '高阶' : rarity === '史诗' ? '中高阶' : rarity === '稀有' ? '中阶' : '初阶'}修炼者`,
      price: basePrice * (type === '攻击' ? 1 : 1.2),
      levelRequirement: (rarityIndex + 1) * 10,
    };
  });

  // 装备（根据世界类型生成名称）
  const weaponNames: string[] = (terminology as any).weaponNames || ['长剑', '短刀', '长枪', '法杖', '巨斧', '飞刀', '古琴', '玉笛'];
  const armorNames: string[] = (terminology as any).armorNames || ['布甲', '皮甲', '铁甲', '玄甲', '法袍', '道袍', '战甲', '金甲'];
  
  const equipments: ShopItem[] = [
    ...weaponNames.slice(0, 4).map((name: string, i: number) => {
      const rarityIndex = Math.min(i, 3);
      const rarity = rarities[rarityIndex];
      const basePrice = { '普通': 200, '稀有': 800, '史诗': 2500, '传说': 6000 }[rarity] || 200;
      return {
        id: `shop_weapon_${i}`,
        name,
        type: '装备' as const,
        rarity,
        description: `${rarity}品质武器，攻击力加成`,
        price: basePrice,
        levelRequirement: (rarityIndex + 1) * 8,
      };
    }),
    ...armorNames.slice(0, 4).map((name: string, i: number) => {
      const rarityIndex = Math.min(i, 3);
      const rarity = rarities[rarityIndex];
      const basePrice = { '普通': 250, '稀有': 1000, '史诗': 3000, '传说': 7000 }[rarity] || 250;
      return {
        id: `shop_armor_${i}`,
        name,
        type: '装备' as const,
        rarity,
        description: `${rarity}品质防具，防御力加成`,
        price: basePrice,
        levelRequirement: (rarityIndex + 1) * 8,
      };
    }),
  ];

  return { pills, materials, techniques, equipments };
}
