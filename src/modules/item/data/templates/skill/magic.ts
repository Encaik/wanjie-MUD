/**
 * 法技模板（来自功法）
 *
 * 技能是 category=skill 的独立物品，可装备到功法的技能槽位。
 */

import type { SkillTemplate, SkillTag } from '@/modules/item/types';

export const FIREBALL: SkillTemplate = {
  templateId: 'wanjie:cultivation:fireball',
  name: '火球术',
  description: '凝聚火焰之力，释放一颗火球攻击单个敌人，造成火焰伤害。',
  category: 'skill',
  subcategory: 'magic_skill',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 30, mpCost: 10, cooldown: 1 },
  price: 300,
  element: 'fire',
  isDroppable: true,
  ext: {
    requiredElement: 'fire',
    isUltimate: false,
    cooldown: 1,
    effects: [{ type: 'damage', baseValue: 30, statScaling: 0.8, target: 'single' }],
    tags: ['instant'] as SkillTag[],
  },
};

export const ICE_LANCE: SkillTemplate = {
  templateId: 'wanjie:cultivation:ice_lance',
  name: '冰枪术',
  description: '凝结寒冰为枪，投射攻击单个敌人，造成冰霜伤害并可能减速。',
  category: 'skill',
  subcategory: 'magic_skill',
  rarity: 'uncommon',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 45, mpCost: 15, cooldown: 2 },
  price: 500,
  element: 'ice',
  isDroppable: true,
  ext: {
    requiredElement: 'ice',
    isUltimate: false,
    cooldown: 2,
    effects: [
      { type: 'damage', baseValue: 45, statScaling: 1.0, target: 'single' },
      { type: 'debuff', baseValue: 20, statScaling: 0, target: 'single', duration: 2, description: '减速20%' },
    ],
    tags: ['instant', 'debuff'] as SkillTag[],
  },
};

export const THUNDER_STORM: SkillTemplate = {
  templateId: 'wanjie:cultivation:thunder_storm',
  name: '雷霆万钧',
  description: '召唤天雷轰击所有敌人，造成大范围雷电伤害。',
  category: 'skill',
  subcategory: 'magic_skill',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { power: 80, mpCost: 40, cooldown: 4 },
  price: 5000,
  element: 'thunder',
  isDroppable: true,
  ext: {
    requiredElement: 'thunder',
    isUltimate: true,
    cooldown: 4,
    effects: [
      { type: 'damage', baseValue: 80, statScaling: 1.5, target: 'all' },
    ],
    tags: ['instant', 'aoe'] as SkillTag[],
  },
};

export const HEALING_LIGHT: SkillTemplate = {
  templateId: 'wanjie:cultivation:healing_light',
  name: '治愈之光',
  description: '以灵力化为治愈之光，恢复自身或单个友方生命值。',
  category: 'skill',
  subcategory: 'magic_skill',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 0, mpCost: 8, cooldown: 2 },
  price: 200,
  element: 'light',
  isDroppable: true,
  ext: {
    requiredElement: 'light',
    isUltimate: false,
    cooldown: 2,
    effects: [
      { type: 'heal', baseValue: 40, statScaling: 0.5, target: 'single', description: '恢复生命值' },
    ],
    tags: ['hot'] as SkillTag[],
  },
};

export const SPIRIT_SHIELD: SkillTemplate = {
  templateId: 'wanjie:cultivation:spirit_shield',
  name: '灵气护盾',
  description: '以灵力在身前凝聚护盾，吸收一定量的伤害。',
  category: 'skill',
  subcategory: 'magic_skill',
  rarity: 'uncommon',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 0, mpCost: 12, cooldown: 3 },
  price: 400,
  element: null,
  isDroppable: true,
  ext: {
    requiredElement: undefined,
    isUltimate: false,
    cooldown: 3,
    effects: [
      { type: 'shield', baseValue: 60, statScaling: 0.3, target: 'self', duration: 3, description: '吸收伤害' },
    ],
    tags: ['shield'] as SkillTag[],
  },
};

export const EARTH_QUAKE: SkillTemplate = {
  templateId: 'wanjie:cultivation:earth_quake',
  name: '地动术',
  description: '震动大地，对所有敌人造成土系伤害并可能眩晕。',
  category: 'skill',
  subcategory: 'magic_skill',
  rarity: 'rare',
  maxStack: 1,
  maxLevel: 7,
  baseStats: { power: 60, mpCost: 30, cooldown: 3 },
  price: 2000,
  element: 'earth',
  isDroppable: true,
  ext: {
    requiredElement: 'earth',
    isUltimate: false,
    cooldown: 3,
    effects: [
      { type: 'damage', baseValue: 60, statScaling: 1.2, target: 'all' },
      { type: 'debuff', baseValue: 30, statScaling: 0, target: 'all', duration: 1, description: '30%概率眩晕' },
    ],
    tags: ['aoe', 'debuff'] as SkillTag[],
  },
};

/** 所有法技模板 */
export const MAGIC_SKILL_TEMPLATES: SkillTemplate[] = [
  FIREBALL,
  ICE_LANCE,
  THUNDER_STORM,
  HEALING_LIGHT,
  SPIRIT_SHIELD,
  EARTH_QUAKE,
];
