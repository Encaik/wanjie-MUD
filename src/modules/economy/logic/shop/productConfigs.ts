/**
 * 商品配置
 * 
 * 定义所有商店的商品配置
 */

import { ProductConfig } from './types';

// ============================================
// 普通商店商品
// ============================================

export const NORMAL_SHOP_PRODUCTS: ProductConfig[] = [
  // === 突破丹药 ===
  {
    definition: {
      id: 'pill_breakthrough_low',
      name: '筑基丹',
      type: 'item',
      rarity: '稀有',
      description: '突破成功率提升20%',
      effects: [
        { label: '突破', value: '+20%', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 200 },
    },
    purchaseLimit: { type: 'daily', limit: 5 },
  },
  {
    definition: {
      id: 'pill_breakthrough_mid',
      name: '结金丹',
      type: 'item',
      rarity: '史诗',
      description: '突破成功率提升40%',
      effects: [
        { label: '突破', value: '+40%', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 500 },
    },
    conditions: [
      { type: 'level_min', value: 20, description: '需要20级' },
    ],
    purchaseLimit: { type: 'daily', limit: 3 },
  },
  {
    definition: {
      id: 'pill_breakthrough_high',
      name: '渡劫丹',
      type: 'item',
      rarity: '传说',
      description: '突破成功率提升60%',
      effects: [
        { label: '突破', value: '+60%', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 1500 },
    },
    conditions: [
      { type: 'level_min', value: 50, description: '需要50级' },
    ],
    purchaseLimit: { type: 'daily', limit: 1 },
  },

  // === 修炼丹药 ===
  {
    definition: {
      id: 'pill_cultivation_low',
      name: '聚气丹',
      type: 'item',
      rarity: '普通',
      description: '修炼效果提升15%',
      effects: [
        { label: '修炼', value: '+15%', color: 'green' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 50 },
    },
    purchaseLimit: { type: 'daily', limit: 10 },
  },
  {
    definition: {
      id: 'pill_cultivation_mid',
      name: '灵元丹',
      type: 'item',
      rarity: '稀有',
      description: '修炼效果提升30%',
      effects: [
        { label: '修炼', value: '+30%', color: 'green' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 200 },
    },
    conditions: [
      { type: 'level_min', value: 15, description: '需要15级' },
    ],
    purchaseLimit: { type: 'daily', limit: 5 },
  },
  {
    definition: {
      id: 'pill_cultivation_high',
      name: '玄灵丹',
      type: 'item',
      rarity: '史诗',
      description: '修炼效果提升50%',
      effects: [
        { label: '修炼', value: '+50%', color: 'green' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 600 },
    },
    conditions: [
      { type: 'level_min', value: 30, description: '需要30级' },
    ],
    purchaseLimit: { type: 'daily', limit: 3 },
  },

  // === 恢复丹药 ===
  {
    definition: {
      id: 'pill_restore_hp_low',
      name: '回血丹',
      type: 'item',
      rarity: '普通',
      description: '恢复100点生命值',
      effects: [
        { label: '生命', value: '+100', color: 'red' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 30 },
    },
    purchaseLimit: { type: 'daily', limit: 20 },
  },
  {
    definition: {
      id: 'pill_restore_mp_low',
      name: '回气丹',
      type: 'item',
      rarity: '普通',
      description: '恢复50点法力值',
      effects: [
        { label: '法力', value: '+50', color: 'blue' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 30 },
    },
    purchaseLimit: { type: 'daily', limit: 20 },
  },

  // === 材料 ===
  {
    definition: {
      id: 'material_herb_low',
      name: '灵草',
      type: 'item',
      rarity: '普通',
      description: '低级灵草，可用于炼丹',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 20 },
    },
    purchaseLimit: { type: 'daily', limit: 50 },
  },
  {
    definition: {
      id: 'material_herb_mid',
      name: '仙草',
      type: 'item',
      rarity: '稀有',
      description: '中级仙草，可用于炼制高级丹药',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 100 },
    },
    conditions: [
      { type: 'level_min', value: 15, description: '需要15级' },
    ],
    purchaseLimit: { type: 'daily', limit: 20 },
  },
  {
    definition: {
      id: 'material_ore_low',
      name: '玄铁',
      type: 'item',
      rarity: '普通',
      description: '低级矿石，可用于锻造',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 30 },
    },
    purchaseLimit: { type: 'daily', limit: 50 },
  },
  {
    definition: {
      id: 'material_ore_mid',
      name: '秘银',
      type: 'item',
      rarity: '稀有',
      description: '中级矿石，可用于锻造高级装备',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 150 },
    },
    conditions: [
      { type: 'level_min', value: 15, description: '需要15级' },
    ],
    purchaseLimit: { type: 'daily', limit: 20 },
  },
  {
    definition: {
      id: 'material_essence',
      name: '妖丹',
      type: 'item',
      rarity: '史诗',
      description: '妖兽内丹，蕴含强大能量',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 600 },
    },
    conditions: [
      { type: 'level_min', value: 25, description: '需要25级' },
    ],
    purchaseLimit: { type: 'daily', limit: 10 },
  },
  {
    definition: {
      id: 'material_soul',
      name: '魂晶',
      type: 'item',
      rarity: '传说',
      description: '凝聚魂力的晶石',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 2000 },
    },
    conditions: [
      { type: 'level_min', value: 40, description: '需要40级' },
    ],
    purchaseLimit: { type: 'daily', limit: 5 },
  },

  // === 随机功法 ===
  {
    definition: {
      id: 'random_technique',
      name: '随机功法',
      type: 'special',
      rarity: '稀有',
      description: '获得一本适合当前等级的随机功法',
      effects: [
        { label: '类型', value: '攻击/防御', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 300 },
      dynamic: { baseAmount: 300, levelMultiplier: 50, formula: 'linear' },
    },
    conditions: [
      { type: 'level_min', value: 5, description: '需要5级' },
    ],
    purchaseLimit: { type: 'daily', limit: 3 },
  },

  // === 随机装备 ===
  {
    definition: {
      id: 'random_equipment',
      name: '随机装备',
      type: 'special',
      rarity: '稀有',
      description: '获得一件适合当前等级的随机装备',
      effects: [
        { label: '类型', value: '武器/护甲', color: 'blue' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 200 },
      dynamic: { baseAmount: 200, levelMultiplier: 30, formula: 'linear' },
    },
    conditions: [
      { type: 'level_min', value: 5, description: '需要5级' },
    ],
    purchaseLimit: { type: 'daily', limit: 3 },
  },
];

// ============================================
// 势力商店商品
// ============================================

export const FACTION_SHOP_PRODUCTS: ProductConfig[] = [
  {
    definition: {
      id: 'fs_pill_breakthrough_mid',
      name: '筑基丹（中品）',
      type: 'item',
      rarity: '稀有',
      description: '势力专属，突破成功率大幅提升',
      effects: [
        { label: '突破', value: '+30%', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'contribution', amount: 500 },
    },
    conditions: [
      { type: 'faction_member', value: true, description: '需要加入势力' },
    ],
    purchaseLimit: { type: 'weekly', limit: 3 },
  },
  {
    definition: {
      id: 'fs_pill_cultivation_high',
      name: '聚气丹（上品）',
      type: 'item',
      rarity: '史诗',
      description: '势力专属，修炼效果显著提升',
      effects: [
        { label: '修炼', value: '+50%', color: 'green' },
      ],
    },
    price: {
      primary: { type: 'contribution', amount: 800 },
    },
    conditions: [
      { type: 'faction_member', value: true, description: '需要加入势力' },
    ],
    purchaseLimit: { type: 'weekly', limit: 2 },
  },
  {
    definition: {
      id: 'fs_material_essence',
      name: '妖丹（势力特供）',
      type: 'item',
      rarity: '史诗',
      description: '势力商店特供，品质保证',
      effects: [],
    },
    price: {
      primary: { type: 'contribution', amount: 400 },
    },
    conditions: [
      { type: 'faction_member', value: true, description: '需要加入势力' },
    ],
    purchaseLimit: { type: 'weekly', limit: 5 },
  },
  {
    definition: {
      id: 'fs_material_soul',
      name: '魂晶（势力特供）',
      type: 'item',
      rarity: '传说',
      description: '势力商店特供，稀有材料',
      effects: [],
    },
    price: {
      primary: { type: 'contribution', amount: 1500 },
    },
    conditions: [
      { type: 'faction_member', value: true, description: '需要加入势力' },
      { type: 'faction_rank_min', value: 'elder', description: '需要长老职阶' },
    ],
    purchaseLimit: { type: 'weekly', limit: 2 },
  },
  {
    definition: {
      id: 'fs_random_technique',
      name: '势力功法秘籍',
      type: 'special',
      rarity: '史诗',
      description: '势力传承功法，随机获得一本稀有功法',
      effects: [
        { label: '类型', value: '随机史诗', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'contribution', amount: 1000 },
    },
    conditions: [
      { type: 'faction_member', value: true, description: '需要加入势力' },
      { type: 'faction_rank_min', value: 'disciple', description: '需要弟子职阶' },
    ],
    purchaseLimit: { type: 'weekly', limit: 1 },
  },
];

// ============================================
// 黑市商品池（用于动态生成）
// ============================================

export const BLACKMARKET_PRODUCT_POOL: ProductConfig[] = [
  {
    definition: {
      id: 'bm_material_essence',
      name: '妖丹',
      type: 'item',
      rarity: '史诗',
      description: '妖兽内丹，蕴含强大能量',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 600 },
    },
    purchaseLimit: { type: 'daily', limit: 2 },
  },
  {
    definition: {
      id: 'bm_material_soul',
      name: '魂晶',
      type: 'item',
      rarity: '传说',
      description: '凝聚魂力的晶石',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 2000 },
    },
    purchaseLimit: { type: 'daily', limit: 2 },
  },
  {
    definition: {
      id: 'bm_material_blood',
      name: '灵兽血',
      type: 'item',
      rarity: '稀有',
      description: '灵兽之血，可用于炼丹',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 300 },
    },
    purchaseLimit: { type: 'daily', limit: 3 },
  },
  {
    definition: {
      id: 'bm_material_bone',
      name: '灵兽骨',
      type: 'item',
      rarity: '史诗',
      description: '灵兽骨骼，可用于锻造',
      effects: [],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 800 },
    },
    purchaseLimit: { type: 'daily', limit: 2 },
  },
  {
    definition: {
      id: 'bm_pill_breakthrough_mid',
      name: '结金丹',
      type: 'item',
      rarity: '史诗',
      description: '突破成功率提升40%',
      effects: [
        { label: '突破', value: '+40%', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 500 },
    },
    purchaseLimit: { type: 'daily', limit: 2 },
  },
  {
    definition: {
      id: 'bm_pill_cultivation_high',
      name: '玄灵丹',
      type: 'item',
      rarity: '史诗',
      description: '修炼效果提升50%',
      effects: [
        { label: '修炼', value: '+50%', color: 'green' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 600 },
    },
    purchaseLimit: { type: 'daily', limit: 2 },
  },
  {
    definition: {
      id: 'bm_pill_breakthrough_high',
      name: '渡劫丹',
      type: 'item',
      rarity: '传说',
      description: '突破成功率提升60%',
      effects: [
        { label: '突破', value: '+60%', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'spirit_stone', amount: 1500 },
    },
    purchaseLimit: { type: 'daily', limit: 1 },
  },
];

// ============================================
// 竞技商店商品
// ============================================

export const ARENA_SHOP_PRODUCTS: ProductConfig[] = [
  {
    definition: {
      id: 'arena_honor_box',
      name: '荣誉宝箱',
      type: 'special',
      rarity: '史诗',
      description: '打开获得随机装备或材料',
      effects: [
        { label: '类型', value: '随机', color: 'orange' },
      ],
    },
    price: {
      primary: { type: 'honor', amount: 500 },
    },
    purchaseLimit: { type: 'weekly', limit: 2 },
  },
  {
    definition: {
      id: 'arena_technique_page',
      name: '功法残页',
      type: 'item',
      rarity: '稀有',
      description: '用于功法升级，提升功法威力',
      effects: [
        { label: '用途', value: '功法升级', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'honor', amount: 300 },
    },
    purchaseLimit: { type: 'weekly', limit: 3 },
  },
  {
    definition: {
      id: 'arena_honor_medal',
      name: '荣誉勋章',
      type: 'special',
      rarity: '传说',
      description: '装饰道具，展示你的竞技实力',
      effects: [
        { label: '效果', value: '称号展示', color: 'yellow' },
      ],
    },
    price: {
      primary: { type: 'honor', amount: 1000 },
    },
    purchaseLimit: { type: 'monthly', limit: 1 },
  },
  {
    definition: {
      id: 'arena_battle_potion',
      name: '竞技药水',
      type: 'item',
      rarity: '稀有',
      description: '竞技场战斗中，攻击力提升10%',
      effects: [
        { label: '攻击', value: '+10%', color: 'red' },
        { label: '持续', value: '本场战斗', color: 'blue' },
      ],
    },
    price: {
      primary: { type: 'honor', amount: 50 },
    },
    purchaseLimit: { type: 'daily', limit: 5 },
  },
  {
    definition: {
      id: 'arena_title_voucher',
      name: '竞技称号券',
      type: 'special',
      rarity: '史诗',
      description: '解锁专属竞技称号',
      effects: [
        { label: '称号', value: '竞技之星', color: 'yellow' },
      ],
    },
    price: {
      primary: { type: 'honor', amount: 2000 },
    },
    purchaseLimit: { type: 'lifetime', limit: 1 },
  },
];

// ============================================
// 飞升商店商品
// ============================================

export const ASCENSION_SHOP_PRODUCTS: ProductConfig[] = [
  {
    definition: {
      id: 'ascension_pill',
      name: '飞升丹',
      type: 'item',
      rarity: '传说',
      description: '飞升后修炼速度提升20%',
      effects: [
        { label: '修炼', value: '+20%', color: 'cyan' },
        { label: '时效', value: '永久', color: 'yellow' },
      ],
    },
    price: {
      primary: { type: 'ascension_mark', amount: 100 },
    },
    purchaseLimit: { type: 'monthly', limit: 2 },
  },
  {
    definition: {
      id: 'ascension_material_box',
      name: '天界材料包',
      type: 'special',
      rarity: '史诗',
      description: '随机获得天界材料',
      effects: [
        { label: '类型', value: '随机天界材料', color: 'cyan' },
      ],
    },
    price: {
      primary: { type: 'ascension_mark', amount: 200 },
    },
    purchaseLimit: { type: 'weekly', limit: 1 },
  },
  {
    definition: {
      id: 'ascension_technique',
      name: '飞升功法',
      type: 'technique',
      rarity: '传说',
      description: '飞升专属功法，威力强大',
      effects: [
        { label: '类型', value: '随机传说功法', color: 'purple' },
      ],
    },
    price: {
      primary: { type: 'ascension_mark', amount: 500 },
    },
    purchaseLimit: { type: 'lifetime', limit: 1 },
  },
  {
    definition: {
      id: 'ascension_artifact_fragment',
      name: '神器碎片',
      type: 'fragment',
      rarity: '传说',
      description: '用于神器锻造',
      effects: [
        { label: '用途', value: '神器锻造', color: 'yellow' },
      ],
    },
    price: {
      primary: { type: 'ascension_mark', amount: 300 },
    },
    purchaseLimit: { type: 'weekly', limit: 2 },
  },
];

// ============================================
// 商品配置索引（用于快速查找）
// ============================================

export const ALL_PRODUCTS: Record<string, ProductConfig> = {
  // 普通商店
  ...Object.fromEntries(NORMAL_SHOP_PRODUCTS.map(p => [p.definition.id, p])),
  // 势力商店
  ...Object.fromEntries(FACTION_SHOP_PRODUCTS.map(p => [p.definition.id, p])),
  // 黑市
  ...Object.fromEntries(BLACKMARKET_PRODUCT_POOL.map(p => [p.definition.id, p])),
  // 竞技商店
  ...Object.fromEntries(ARENA_SHOP_PRODUCTS.map(p => [p.definition.id, p])),
  // 飞升商店
  ...Object.fromEntries(ASCENSION_SHOP_PRODUCTS.map(p => [p.definition.id, p])),
};

/**
 * 获取商品配置
 */
export function getProductConfig(productId: string): ProductConfig | undefined {
  return ALL_PRODUCTS[productId];
}
