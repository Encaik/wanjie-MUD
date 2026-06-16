/**
 * 斗技模板（来自武器）
 *
 * 技能是 category=skill 的独立物品，可装备到武器的技能槽位。
 */

import type { SkillTemplate, SkillTag } from '@/modules/item/types';

export const HEAVY_STRIKE: SkillTemplate = {
  templateId: 'heavy_strike',
  name: '重击',
  description: '蓄力一击，造成高于普通攻击的伤害。',
  category: 'skill',
  subcategory: 'combat_skill',
  rarity: 'common',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 25, mpCost: 0, cooldown: 2 },
  price: 200,
  element: null,
  isDroppable: true,
  ext: {
    weaponRestriction: undefined,
    isUltimate: false,
    cooldown: 2,
    effects: [{ type: 'damage', baseValue: 25, statScaling: 1.5, target: 'single' }],
    tags: ['instant'] as SkillTag[],
  },
};

export const WHIRLWIND_SLASH: SkillTemplate = {
  templateId: 'whirlwind_slash',
  name: '旋风斩',
  description: '旋转武器攻击周围所有敌人，造成群体伤害。',
  category: 'skill',
  subcategory: 'combat_skill',
  rarity: 'uncommon',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 35, mpCost: 0, cooldown: 3 },
  price: 500,
  element: 'wind',
  isDroppable: true,
  ext: {
    weaponRestriction: 'blade',
    isUltimate: false,
    cooldown: 3,
    effects: [{ type: 'damage', baseValue: 35, statScaling: 1.0, target: 'all' }],
    tags: ['aoe'] as SkillTag[],
  },
};

export const LIFESTEAL_STRIKE: SkillTemplate = {
  templateId: 'lifesteal_strike',
  name: '嗜血一击',
  description: '以血祭剑，造成伤害的同时吸取敌方生命值。',
  category: 'skill',
  subcategory: 'combat_skill',
  rarity: 'rare',
  maxStack: 1,
  maxLevel: 7,
  baseStats: { power: 45, mpCost: 0, cooldown: 3 },
  price: 2000,
  element: 'dark',
  isDroppable: true,
  ext: {
    weaponRestriction: 'sword',
    isUltimate: false,
    cooldown: 3,
    effects: [
      { type: 'damage', baseValue: 45, statScaling: 1.2, target: 'single' },
      { type: 'heal', baseValue: 20, statScaling: 0.5, target: 'self', description: '吸血效果' },
    ],
    tags: ['instant', 'lifesteal'] as SkillTag[],
  },
};

export const FATAL_STRIKE: SkillTemplate = {
  templateId: 'fatal_strike',
  name: '致命一击',
  description: '瞄准敌人要害的致命攻击，暴击率大幅提升。对生命值低的敌人额外造成伤害。',
  category: 'skill',
  subcategory: 'combat_skill',
  rarity: 'epic',
  maxStack: 1,
  maxLevel: 8,
  baseStats: { power: 70, mpCost: 0, cooldown: 5 },
  price: 6000,
  element: null,
  isDroppable: true,
  ext: {
    weaponRestriction: undefined,
    isUltimate: true,
    cooldown: 5,
    effects: [
      { type: 'damage', baseValue: 70, statScaling: 2.0, target: 'single' },
    ],
    tags: ['instant', 'execute'] as SkillTag[],
  },
};

export const COUNTER_STANCE: SkillTemplate = {
  templateId: 'counter_stance',
  name: '反击架势',
  description: '摆出反击架势，受到攻击时自动反击敌人。',
  category: 'skill',
  subcategory: 'combat_skill',
  rarity: 'uncommon',
  maxStack: 1,
  maxLevel: 5,
  baseStats: { power: 20, mpCost: 0, cooldown: 4 },
  price: 600,
  element: null,
  isDroppable: true,
  ext: {
    weaponRestriction: undefined,
    isUltimate: false,
    cooldown: 4,
    effects: [
      { type: 'buff', baseValue: 30, statScaling: 0, target: 'self', duration: 2, description: '受击时反击' },
    ],
    tags: ['counter'] as SkillTag[],
  },
};

/** 所有斗技模板 */
export const COMBAT_SKILL_TEMPLATES: SkillTemplate[] = [
  HEAVY_STRIKE,
  WHIRLWIND_SLASH,
  LIFESTEAL_STRIKE,
  FATAL_STRIKE,
  COUNTER_STANCE,
];
