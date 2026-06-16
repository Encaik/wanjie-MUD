/**
 * 修仙世界功法模板
 */

import type { TechniqueTemplate, SkillTag } from '@/modules/item/types';

const SKILL_TAG = 'magic' as SkillTag;

export const FIRE_SCRIPTURE: TechniqueTemplate = {
  templateId: 'fire_scripture',
  name: '焚天诀',
  description: '至阳至烈的火系攻击功法，修炼至极致可焚尽万物。',
  category: 'technique',
  subcategory: 'attack',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { power: 80, bonus: 30, baseMpCost: 25 },
  price: 10000,
  element: 'fire',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    
    
    
    
    baseMpCost: 25,
  },
};

export const THUNDER_FIST_MANUAL: TechniqueTemplate = {
  templateId: 'thunder_fist_manual',
  name: '奔雷拳经',
  description: '以拳御雷的霸道功法，拳出雷动，刚猛无俦。',
  category: 'technique',
  subcategory: 'attack',
  rarity: 'rare',
  maxStack: 1,
  maxLevel: 7,
  baseStats: { power: 55, bonus: 20, baseMpCost: 20 },
  price: 4000,
  element: 'thunder',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    
    
    
    
    baseMpCost: 20,
  },
};

export const WIND_SWORD_ART: TechniqueTemplate = {
  templateId: 'wind_sword_art',
  name: '清风剑法',
  description: '飘逸灵动的风系攻击功法，剑出如风，无迹可寻。',
  category: 'technique',
  subcategory: 'attack',
  rarity: 'uncommon',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 30, bonus: 12, baseMpCost: 12 },
  price: 1200,
  element: 'wind',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    
    
    
    
    baseMpCost: 12,
  },
};

export const IRON_BODY_SCRIPTURE: TechniqueTemplate = {
  templateId: 'iron_body_scripture',
  name: '金刚不坏功',
  description: '佛门炼体防御功法，修炼至大成可铸金刚不坏之身。',
  category: 'technique',
  subcategory: 'defense',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { power: 40, bonus: 40, baseMpCost: 30 },
  price: 12000,
  element: 'earth',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    
    
    
    
    baseMpCost: 30,
  },
};

export const WATER_SHIELD_ART: TechniqueTemplate = {
  templateId: 'water_shield_art',
  name: '水镜术',
  description: '以水化镜的防御功法，可偏转敌方攻击，以柔克刚。',
  category: 'technique',
  subcategory: 'defense',
  rarity: 'rare',
  maxStack: 1,
  maxLevel: 7,
  baseStats: { power: 25, bonus: 25, baseMpCost: 18 },
  price: 3500,
  element: 'ice',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    
    
    
    
    baseMpCost: 18,
  },
};

export const LIGHT_ARMOR_MANTRA: TechniqueTemplate = {
  templateId: 'light_armor_mantra',
  name: '灵光护体诀',
  description: '基础防御功法，以灵力在体表形成光甲，抵御伤害。',
  category: 'technique',
  subcategory: 'defense',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 3,
  baseStats: { power: 10, bonus: 10, baseMpCost: 8 },
  price: 400,
  element: 'light',
  worldType: 'cultivation',
  isDroppable: true,
  ext: {
    
    
    
    
    baseMpCost: 8,
  },
};

/** 修仙世界所有功法模板 */
export const CULTIVATION_TECHNIQUE_TEMPLATES: TechniqueTemplate[] = [
  FIRE_SCRIPTURE,
  THUNDER_FIST_MANUAL,
  WIND_SWORD_ART,
  IRON_BODY_SCRIPTURE,
  WATER_SHIELD_ART,
  LIGHT_ARMOR_MANTRA,
];
