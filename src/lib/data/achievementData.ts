/**
 * 成就系统数据配置
 * 
 * 成就类型：
 * - level: 等级成就
 * - combat: 战斗成就
 * - collection: 收集成就
 * - exploration: 探索成就
 * - cultivation: 修炼成就
 * - special: 特殊成就
 */

import { spiritStoneItems, breakthroughItems, cultivationPillItems } from '../game/utils/items';
import { AchievementDefinition, AchievementType, ItemRarity, createInventoryItem } from '../game/types';

// 成就图标（使用 lucide-react 图标名称）
export const AchievementIcons: Record<string, string> = {
  level: 'Trophy',
  combat: 'Swords',
  collection: 'Package',
  exploration: 'Map',
  cultivation: 'Sparkles',
  special: 'Star',
};

// 成就类型中文名称
export const AchievementTypeNames: Record<AchievementType, string> = {
  level: '等级',
  combat: '战斗',
  collection: '收集',
  exploration: '探索',
  cultivation: '修炼',
  special: '特殊',
};

/**
 * 成就定义列表
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ========== 等级成就 ==========
  {
    id: 'level_10',
    name: '初窥门径',
    description: '达到10级',
    type: 'level',
    icon: 'Trophy',
    target: 10,
    rarity: '普通',
    rewards: {
      experience: 100,
      items: [createInventoryItem(spiritStoneItems[0], 100)],
    },
  },
  {
    id: 'level_20',
    name: '小有所成',
    description: '达到20级',
    type: 'level',
    icon: 'Trophy',
    target: 20,
    rarity: '普通',
    rewards: {
      experience: 300,
      items: [createInventoryItem(breakthroughItems[0], 2)],
    },
  },
  {
    id: 'level_30',
    name: '登堂入室',
    description: '达到30级',
    type: 'level',
    icon: 'Trophy',
    target: 30,
    rarity: '稀有',
    rewards: {
      experience: 500,
      items: [createInventoryItem(spiritStoneItems[0], 500)],
    },
  },
  {
    id: 'level_50',
    name: '炉火纯青',
    description: '达到50级',
    type: 'level',
    icon: 'Trophy',
    target: 50,
    rarity: '稀有',
    rewards: {
      experience: 1000,
      items: [
        createInventoryItem(breakthroughItems[1], 2),
        createInventoryItem(cultivationPillItems[1], 3),
      ],
    },
  },
  {
    id: 'level_80',
    name: '登峰造极',
    description: '达到80级',
    type: 'level',
    icon: 'Trophy',
    target: 80,
    rarity: '史诗',
    rewards: {
      experience: 2000,
      items: [createInventoryItem(breakthroughItems[2], 1)],
    },
  },
  {
    id: 'level_100',
    name: '大道圆满',
    description: '达到100级',
    type: 'level',
    icon: 'Trophy',
    target: 100,
    rarity: '传说',
    rewards: {
      experience: 5000,
      stats: { 体质: 5, 灵根: 5, 悟性: 5, 意志: 5, 幸运: 5 },
    },
  },

  // ========== 战斗成就 ==========
  {
    id: 'combat_enemies_50',
    name: '初试锋芒',
    description: '累计击败50个敌人',
    type: 'combat',
    icon: 'Swords',
    target: 50,
    rarity: '普通',
    rewards: {
      experience: 200,
      items: [createInventoryItem(spiritStoneItems[0], 200)],
    },
  },
  {
    id: 'combat_enemies_200',
    name: '身经百战',
    description: '累计击败200个敌人',
    type: 'combat',
    icon: 'Swords',
    target: 200,
    rarity: '普通',
    rewards: {
      experience: 500,
      items: [createInventoryItem(cultivationPillItems[0], 5)],
    },
  },
  {
    id: 'combat_enemies_500',
    name: '战无不胜',
    description: '累计击败500个敌人',
    type: 'combat',
    icon: 'Swords',
    target: 500,
    rarity: '稀有',
    rewards: {
      experience: 1000,
      items: [createInventoryItem(cultivationPillItems[1], 3)],
    },
  },
  {
    id: 'combat_boss_1',
    name: '首杀Boss',
    description: '首次击败Boss',
    type: 'combat',
    icon: 'Crown',
    target: 1,
    rarity: '稀有',
    rewards: {
      experience: 500,
      items: [createInventoryItem(breakthroughItems[0], 1)],
    },
  },
  {
    id: 'combat_boss_10',
    name: 'Boss克星',
    description: '累计击败10个Boss',
    type: 'combat',
    icon: 'Crown',
    target: 10,
    rarity: '史诗',
    rewards: {
      experience: 2000,
      items: [createInventoryItem(breakthroughItems[1], 2)],
    },
  },
  {
    id: 'combat_boss_30',
    name: 'Boss终结者',
    description: '累计击败30个Boss',
    type: 'combat',
    icon: 'Crown',
    target: 30,
    rarity: '传说',
    rewards: {
      experience: 5000,
      stats: { 体质: 3, 意志: 3 },
    },
  },

  // ========== 收集成就 ==========
  {
    id: 'collection_technique_5',
    name: '功法入门',
    description: '获得5本功法',
    type: 'collection',
    icon: 'BookOpen',
    target: 5,
    rarity: '普通',
    rewards: {
      experience: 200,
    },
  },
  {
    id: 'collection_technique_20',
    name: '功法收藏家',
    description: '获得20本功法',
    type: 'collection',
    icon: 'BookOpen',
    target: 20,
    rarity: '稀有',
    rewards: {
      experience: 500,
      stats: { 悟性: 3 },
    },
  },
  {
    id: 'collection_technique_50',
    name: '功法大师',
    description: '获得50本功法',
    type: 'collection',
    icon: 'BookOpen',
    target: 50,
    rarity: '史诗',
    rewards: {
      experience: 1500,
      stats: { 悟性: 5 },
    },
  },
  {
    id: 'collection_equipment_10',
    name: '装备收集者',
    description: '获得10件装备',
    type: 'collection',
    icon: 'Shield',
    target: 10,
    rarity: '普通',
    rewards: {
      experience: 200,
    },
  },
  {
    id: 'collection_equipment_30',
    name: '装备收藏家',
    description: '获得30件装备',
    type: 'collection',
    icon: 'Shield',
    target: 30,
    rarity: '稀有',
    rewards: {
      experience: 500,
      stats: { 体质: 3 },
    },
  },

  // ========== 探索成就 ==========
  {
    id: 'exploration_1',
    name: '初探秘境',
    description: '完成1次秘境探索',
    type: 'exploration',
    icon: 'Map',
    target: 1,
    rarity: '普通',
    rewards: {
      experience: 100,
    },
  },
  {
    id: 'exploration_10',
    name: '秘境常客',
    description: '完成10次秘境探索',
    type: 'exploration',
    icon: 'Map',
    target: 10,
    rarity: '普通',
    rewards: {
      experience: 300,
      items: [createInventoryItem(spiritStoneItems[0], 300)],
    },
  },
  {
    id: 'exploration_50',
    name: '秘境专家',
    description: '完成50次秘境探索',
    type: 'exploration',
    icon: 'Map',
    target: 50,
    rarity: '稀有',
    rewards: {
      experience: 1000,
      items: [createInventoryItem(breakthroughItems[0], 2)],
    },
  },
  {
    id: 'exploration_100',
    name: '秘境大师',
    description: '完成100次秘境探索',
    type: 'exploration',
    icon: 'Map',
    target: 100,
    rarity: '史诗',
    rewards: {
      experience: 3000,
      items: [createInventoryItem(breakthroughItems[1], 2)],
    },
  },

  // ========== 修炼成就 ==========
  {
    id: 'cultivation_100',
    name: '勤奋修炼',
    description: '累计修炼100次',
    type: 'cultivation',
    icon: 'Sparkles',
    target: 100,
    rarity: '普通',
    rewards: {
      experience: 200,
    },
  },
  {
    id: 'cultivation_500',
    name: '苦修之士',
    description: '累计修炼500次',
    type: 'cultivation',
    icon: 'Sparkles',
    target: 500,
    rarity: '普通',
    rewards: {
      experience: 500,
      stats: { 意志: 2 },
    },
  },
  {
    id: 'cultivation_1000',
    name: '修炼大师',
    description: '累计修炼1000次',
    type: 'cultivation',
    icon: 'Sparkles',
    target: 1000,
    rarity: '稀有',
    rewards: {
      experience: 1500,
      stats: { 意志: 5 },
    },
  },
  {
    id: 'cultivation_breakthrough_5',
    name: '突破新境',
    description: '累计突破5次',
    type: 'cultivation',
    icon: 'Zap',
    target: 5,
    rarity: '稀有',
    rewards: {
      experience: 500,
      items: [createInventoryItem(breakthroughItems[0], 2)],
    },
  },
  {
    id: 'cultivation_breakthrough_20',
    name: '境界突破者',
    description: '累计突破20次',
    type: 'cultivation',
    icon: 'Zap',
    target: 20,
    rarity: '史诗',
    rewards: {
      experience: 2000,
      stats: { 灵根: 5 },
    },
  },

  // ========== 特殊成就 ==========
  {
    id: 'special_first_legendary',
    name: '传说降临',
    description: '获得第一件传说品质物品',
    type: 'special',
    icon: 'Star',
    target: 1,
    rarity: '史诗',
    rewards: {
      experience: 1000,
      stats: { 幸运: 5 },
    },
  },
  {
    id: 'special_full_equipment',
    name: '全副武装',
    description: '所有装备槽位都已装备',
    type: 'special',
    icon: 'Shield',
    target: 1,
    rarity: '稀有',
    rewards: {
      experience: 500,
      stats: { 体质: 5 },
    },
  },
  {
    id: 'special_technique_max',
    name: '功法大成',
    description: '将一本功法升至满级',
    type: 'special',
    icon: 'BookOpen',
    target: 1,
    rarity: '史诗',
    rewards: {
      experience: 1000,
      stats: { 悟性: 5 },
    },
  },
  {
    id: 'special_equipment_max',
    name: '装备极致',
    description: '将一件装备升至满级',
    type: 'special',
    icon: 'Shield',
    target: 1,
    rarity: '史诗',
    rewards: {
      experience: 1000,
      stats: { 体质: 5 },
    },
  },

  // ========== 扩展系统成就 ==========
  // 流派成就
  {
    id: 'path_select',
    name: '道途初定',
    description: '选择修炼流派',
    type: 'special',
    icon: 'Compass',
    target: 1,
    rarity: '普通',
    rewards: {
      experience: 200,
      items: [createInventoryItem(spiritStoneItems[0], 200)],
    },
  },
  {
    id: 'path_level_5',
    name: '道途精进',
    description: '流派等级达到5级',
    type: 'cultivation',
    icon: 'TrendingUp',
    target: 5,
    rarity: '稀有',
    rewards: {
      experience: 500,
      stats: { 悟性: 3 },
    },
  },
  {
    id: 'path_level_10',
    name: '道途大成',
    description: '流派等级达到10级（满级）',
    type: 'cultivation',
    icon: 'Star',
    target: 10,
    rarity: '传说',
    rewards: {
      experience: 3000,
      stats: { 体质: 5, 灵根: 5, 悟性: 5 },
    },
  },
  
  // 功法熟练度成就
  {
    id: 'proficiency_xiaocheng',
    name: '功法小成',
    description: '将一本功法熟练度提升至小成',
    type: 'cultivation',
    icon: 'BookOpen',
    target: 1,
    rarity: '普通',
    rewards: {
      experience: 300,
    },
  },
  {
    id: 'proficiency_dacheng',
    name: '功法大成',
    description: '将一本功法熟练度提升至大成',
    type: 'cultivation',
    icon: 'BookOpen',
    target: 1,
    rarity: '稀有',
    rewards: {
      experience: 800,
      stats: { 悟性: 3 },
    },
  },
  {
    id: 'proficiency_huajing',
    name: '功法化境',
    description: '将一本功法熟练度提升至化境',
    type: 'cultivation',
    icon: 'Star',
    target: 1,
    rarity: '传说',
    rewards: {
      experience: 2000,
      stats: { 灵根: 5, 悟性: 5 },
    },
  },
  
  // 羁绊成就
  {
    id: 'bond_first',
    name: '羁绊初现',
    description: '首次激活功法羁绊',
    type: 'special',
    icon: 'Link',
    target: 1,
    rarity: '普通',
    rewards: {
      experience: 300,
    },
  },
  {
    id: 'bond_level3',
    name: '羁绊大师',
    description: '激活一个3级羁绊效果',
    type: 'special',
    icon: 'Link',
    target: 1,
    rarity: '史诗',
    rewards: {
      experience: 1500,
      stats: { 悟性: 5 },
    },
  },
  
  // 装备强化成就
  {
    id: 'enhance_5',
    name: '初步强化',
    description: '将一件装备强化至+5',
    type: 'collection',
    icon: 'Sparkles',
    target: 5,
    rarity: '普通',
    rewards: {
      experience: 300,
    },
  },
  {
    id: 'enhance_10',
    name: '强化大师',
    description: '将一件装备强化至+10',
    type: 'collection',
    icon: 'Sparkles',
    target: 10,
    rarity: '稀有',
    rewards: {
      experience: 800,
      stats: { 体质: 3 },
    },
  },
  
  // 势力声望成就
  {
    id: 'faction_join',
    name: '投身势力',
    description: '首次加入势力',
    type: 'special',
    icon: 'Building2',
    target: 1,
    rarity: '普通',
    rewards: {
      experience: 200,
    },
  },
  {
    id: 'reputation_friendly',
    name: '初获认可',
    description: '势力声望达到友善',
    type: 'special',
    icon: 'Heart',
    target: 1,
    rarity: '普通',
    rewards: {
      experience: 500,
    },
  },
  {
    id: 'reputation_honored',
    name: '声名远播',
    description: '势力声望达到尊敬',
    type: 'special',
    icon: 'Award',
    target: 1,
    rarity: '稀有',
    rewards: {
      experience: 1000,
      stats: { 意志: 3 },
    },
  },
  {
    id: 'reputation_exalted',
    name: '万众敬仰',
    description: '势力声望达到崇拜',
    type: 'special',
    icon: 'Crown',
    target: 1,
    rarity: '传说',
    rewards: {
      experience: 3000,
      stats: { 体质: 5, 意志: 5, 幸运: 3 },
    },
  },
];

/**
 * 根据类型获取成就列表
 */
export function getAchievementsByType(type: AchievementType): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(achievement => achievement.type === type);
}

/**
 * 根据ID获取成就
 */
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
}
