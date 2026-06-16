/**
 * 词缀池
 *
 * 前缀12个 + 后缀11个，按稀有度分级。
 * 从 modules/equipment/data/equipmentAffixData.ts 迁移并适配新稀有度体系。
 */

import type { ItemAffix, Rarity } from '../types';

// ══════════════════════════════════════════════════════════════════
// 前缀（提供攻击/伤害/元素加成）
// ══════════════════════════════════════════════════════════════════

const PREFIX_TEMPLATES: Omit<ItemAffix, 'id'>[] = [
  { type: 'prefix', name: '锋利的', rarity: 'common', description: '攻击力+5', effects: { attackBonus: 5 } },
  { type: 'prefix', name: '坚固的', rarity: 'common', description: '防御力+5', effects: { defenseBonus: 5 } },
  { type: 'prefix', name: '锐利的', rarity: 'uncommon', description: '攻击力+12', effects: { attackBonus: 12 } },
  { type: 'prefix', name: '坚韧的', rarity: 'uncommon', description: '防御力+12', effects: { defenseBonus: 12 } },
  { type: 'prefix', name: '烈焰', rarity: 'rare', description: '火属性攻击+20%', effects: { fireDamage: 20 } },
  { type: 'prefix', name: '寒冰', rarity: 'rare', description: '冰属性攻击+20%', effects: { iceDamage: 20 } },
  { type: 'prefix', name: '雷霆', rarity: 'rare', description: '雷属性攻击+20%', effects: { thunderDamage: 20 } },
  { type: 'prefix', name: '强攻', rarity: 'epic', description: '攻击力+30，暴击率+5%', effects: { attackBonus: 30, critRate: 5 } },
  { type: 'prefix', name: '不朽', rarity: 'epic', description: '防御力+30，生命+100', effects: { defenseBonus: 30, maxHp: 100 } },
  { type: 'prefix', name: '灭世', rarity: 'legendary', description: '攻击力+60，全部元素伤害+25%', effects: { attackBonus: 60, allElementDamage: 25 } },
  { type: 'prefix', name: '鸿蒙', rarity: 'mythic', description: '攻击力+100，暴击率+10%，暴击伤害+50%', effects: { attackBonus: 100, critRate: 10, critDamage: 50 } },
  { type: 'prefix', name: '混沌', rarity: 'mythic', description: '全属性+15%，伤害吸收+10%', effects: { allStats: 15, damageAbsorb: 10 } },
];

// ══════════════════════════════════════════════════════════════════
// 后缀（提供生命/速度/特殊效果）
// ══════════════════════════════════════════════════════════════════

const SUFFIX_TEMPLATES: Omit<ItemAffix, 'id'>[] = [
  { type: 'suffix', name: '之轻', rarity: 'common', description: '速度+3', effects: { speed: 3 } },
  { type: 'suffix', name: '之力', rarity: 'common', description: '威力+5', effects: { power: 5 } },
  { type: 'suffix', name: '之魂', rarity: 'uncommon', description: '最大生命+50', effects: { maxHp: 50 } },
  { type: 'suffix', name: '之灵', rarity: 'uncommon', description: '最大法力+30', effects: { maxMp: 30 } },
  { type: 'suffix', name: '之眼', rarity: 'rare', description: '命中率+10%', effects: { accuracy: 10 } },
  { type: 'suffix', name: '之影', rarity: 'rare', description: '闪避率+8%', effects: { evasion: 8 } },
  { type: 'suffix', name: '之心', rarity: 'epic', description: '生命+150，法力+80', effects: { maxHp: 150, maxMp: 80 } },
  { type: 'suffix', name: '之翼', rarity: 'epic', description: '速度+15，闪避率+12%', effects: { speed: 15, evasion: 12 } },
  { type: 'suffix', name: '之怒', rarity: 'legendary', description: '暴击伤害+80%', effects: { critDamage: 80 } },
  { type: 'suffix', name: '之星', rarity: 'legendary', description: '全属性+10%，经验获取+20%', effects: { allStats: 10, expBonus: 20 } },
  { type: 'suffix', name: '之神', rarity: 'mythic', description: '技能冷却-1回合，法力消耗-30%', effects: { cooldownReduction: 1, mpCostReduction: 30 } },
];

/** 所有词缀模板 */
const ALL_AFFIX_TEMPLATES = [...PREFIX_TEMPLATES, ...SUFFIX_TEMPLATES];

/** 按稀有度筛选词缀 */
export function getAffixTemplatesByRarity(rarity: Rarity): Omit<ItemAffix, 'id'>[] {
  return ALL_AFFIX_TEMPLATES.filter(a => a.rarity === rarity);
}

/** 按稀有度范围筛选词缀（<= maxRarity） */
export function getAffixTemplatesUpToRarity(maxRarity: Rarity): Omit<ItemAffix, 'id'>[] {
  const order = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  const maxIdx = order.indexOf(maxRarity);
  return ALL_AFFIX_TEMPLATES.filter(a => order.indexOf(a.rarity) <= maxIdx);
}

/** 所有词缀（含前缀+后缀） */
export { ALL_AFFIX_TEMPLATES, PREFIX_TEMPLATES, SUFFIX_TEMPLATES };
