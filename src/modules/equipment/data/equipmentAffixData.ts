/**
 * 装备词缀与套装系统数据配置
 * 
 * 词缀：随机属性加成，让装备有独特性
 * 套装：收集特定装备触发套装效果
 */

import { ItemRarity, EquipmentSlot, LegacyStats, StatKey } from '@/core/types';

// ============================================
// 词缀系统
// ============================================

export type AffixType = 'prefix' | 'suffix';

// 词缀效果
export interface AffixEffect {
  type: 'stat' | 'power' | 'bonus' | 'special';
  stat?: StatKey;
  value?: number;
  specialId?: string;
  description: string;
}

// 词缀定义
export interface EquipmentAffix {
  id: string;
  name: string;
  type: AffixType;
  rarity: ItemRarity;
  effects: AffixEffect[];
  dropWeight: number;
  // 适用装备槽位（空为全部）
  applicableSlots?: EquipmentSlot[];
}

// 前缀词缀
export const PREFIX_AFFIXES: EquipmentAffix[] = [
  // 普通前缀
  { id: 'sharp', name: '锋利的', type: 'prefix', rarity: '普通', effects: [{ type: 'power', value: 8, description: '威力+8' }], dropWeight: 100 },
  { id: 'sturdy', name: '坚固的', type: 'prefix', rarity: '普通', effects: [{ type: 'stat', stat: '体质', value: 2, description: '体质+2' }], dropWeight: 100 },
  { id: 'swift', name: '轻盈的', type: 'prefix', rarity: '普通', effects: [{ type: 'stat', stat: '幸运', value: 2, description: '幸运+2' }], dropWeight: 100 },
  { id: 'wise', name: '智慧的', type: 'prefix', rarity: '普通', effects: [{ type: 'stat', stat: '悟性', value: 2, description: '悟性+2' }], dropWeight: 100 },
  { id: 'spirited', name: '灵动的', type: 'prefix', rarity: '普通', effects: [{ type: 'stat', stat: '灵根', value: 2, description: '灵根+2' }], dropWeight: 100 },
  { id: 'willful', name: '坚毅的', type: 'prefix', rarity: '普通', effects: [{ type: 'stat', stat: '意志', value: 2, description: '意志+2' }], dropWeight: 100 },
  
  // 稀有前缀
  { id: 'mystic', name: '玄妙的', type: 'prefix', rarity: '稀有', effects: [
    { type: 'stat', stat: '灵根', value: 4, description: '灵根+4' },
    { type: 'stat', stat: '悟性', value: 2, description: '悟性+2' }
  ], dropWeight: 50 },
  { id: 'heroic', name: '英武的', type: 'prefix', rarity: '稀有', effects: [
    { type: 'stat', stat: '体质', value: 4, description: '体质+4' },
    { type: 'stat', stat: '意志', value: 2, description: '意志+2' }
  ], dropWeight: 50 },
  { id: 'blessed', name: '祝福的', type: 'prefix', rarity: '稀有', effects: [
    { type: 'stat', stat: '幸运', value: 5, description: '幸运+5' },
    { type: 'bonus', value: 5, description: '加成+5%' }
  ], dropWeight: 45 },
  { id: 'dragon', name: '龙血的', type: 'prefix', rarity: '稀有', effects: [
    { type: 'stat', stat: '体质', value: 5, description: '体质+5' },
    { type: 'power', value: 15, description: '威力+15' }
  ], dropWeight: 40 },
  
  // 史诗前缀
  { id: 'legendary', name: '传说之', type: 'prefix', rarity: '史诗', effects: [
    { type: 'stat', stat: '体质', value: 5, description: '体质+5' },
    { type: 'stat', stat: '灵根', value: 5, description: '灵根+5' },
    { type: 'stat', stat: '悟性', value: 5, description: '悟性+5' }
  ], dropWeight: 20 },
  { id: 'immortal', name: '仙器的', type: 'prefix', rarity: '史诗', effects: [
    { type: 'power', value: 40, description: '威力+40' },
    { type: 'bonus', value: 15, description: '加成+15%' }
  ], dropWeight: 15 },
  { id: 'demon', name: '魔化的', type: 'prefix', rarity: '史诗', effects: [
    { type: 'stat', stat: '意志', value: 8, description: '意志+8' },
    { type: 'power', value: 30, description: '威力+30' },
    { type: 'special', specialId: 'demon_curse', description: '魔性侵蚀（轻微副作用）' }
  ], dropWeight: 12 },
  
  // 传说前缀
  { id: 'mythic', name: '神器的', type: 'prefix', rarity: '传说', effects: [
    { type: 'stat', stat: '体质', value: 8, description: '体质+8' },
    { type: 'stat', stat: '灵根', value: 8, description: '灵根+8' },
    { type: 'stat', stat: '悟性', value: 8, description: '悟性+8' },
    { type: 'power', value: 50, description: '威力+50' }
  ], dropWeight: 5 },
  { id: 'primordial', name: '太古的', type: 'prefix', rarity: '传说', effects: [
    { type: 'special', specialId: 'primordial_power', description: '太古之力：全属性+10' },
    { type: 'bonus', value: 25, description: '加成+25%' }
  ], dropWeight: 3 },
];

// 后缀词缀
export const SUFFIX_AFFIXES: EquipmentAffix[] = [
  // 普通后缀
  { id: 'of_power', name: '之力', type: 'suffix', rarity: '普通', effects: [{ type: 'bonus', value: 4, description: '加成+4%' }], dropWeight: 100 },
  { id: 'of_vitality', name: '之命', type: 'suffix', rarity: '普通', effects: [{ type: 'special', specialId: 'hp_bonus_5', description: 'HP上限+5%' }], dropWeight: 100 },
  { id: 'of_wisdom', name: '之智', type: 'suffix', rarity: '普通', effects: [{ type: 'stat', stat: '悟性', value: 3, description: '悟性+3' }], dropWeight: 100 },
  
  // 稀有后缀
  { id: 'of_fortune', name: '之幸', type: 'suffix', rarity: '稀有', effects: [{ type: 'stat', stat: '幸运', value: 6, description: '幸运+6' }], dropWeight: 50 },
  { id: 'of_insight', name: '之悟', type: 'suffix', rarity: '稀有', effects: [
    { type: 'stat', stat: '悟性', value: 5, description: '悟性+5' },
    { type: 'bonus', value: 5, description: '加成+5%' }
  ], dropWeight: 45 },
  { id: 'of_might', name: '之威', type: 'suffix', rarity: '稀有', effects: [
    { type: 'power', value: 20, description: '威力+20' },
    { type: 'bonus', value: 8, description: '加成+8%' }
  ], dropWeight: 40 },
  { id: 'of_protection', name: '之守', type: 'suffix', rarity: '稀有', effects: [
    { type: 'special', specialId: 'defense_10', description: '防御力+10%' }
  ], dropWeight: 40 },
  
  // 史诗后缀
  { id: 'of_legend', name: '之传', type: 'suffix', rarity: '史诗', effects: [
    { type: 'power', value: 35, description: '威力+35' },
    { type: 'stat', stat: '幸运', value: 8, description: '幸运+8' }
  ], dropWeight: 15 },
  { id: 'of_immortal', name: '之仙', type: 'suffix', rarity: '史诗', effects: [
    { type: 'special', specialId: 'immortal_body', description: '仙体：HP恢复+10%/回合' }
  ], dropWeight: 12 },
  
  // 传说后缀
  { id: 'of_god', name: '之神', type: 'suffix', rarity: '传说', effects: [
    { type: 'special', specialId: 'god_blessing', description: '神之祝福：全属性+12，威力+60' }
  ], dropWeight: 3 },
];

// 合并所有词缀
export const ALL_AFFIXES: EquipmentAffix[] = [...PREFIX_AFFIXES, ...SUFFIX_AFFIXES];

// 根据稀有度获取可用词缀
export function getAffixesByRarity(rarity: ItemRarity, type?: AffixType): EquipmentAffix[] {
  return ALL_AFFIXES.filter(a => {
    if (type && a.type !== type) return false;
    const rarityOrder: ItemRarity[] = ['普通', '稀有', '史诗', '传说'];
    return rarityOrder.indexOf(a.rarity) <= rarityOrder.indexOf(rarity);
  });
}

// 随机选择词缀
export function rollRandomAffix(rarity: ItemRarity, type: AffixType): EquipmentAffix | null {
  const affixes = getAffixesByRarity(rarity, type);
  if (affixes.length === 0) return null;
  
  const totalWeight = affixes.reduce((sum, a) => sum + a.dropWeight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const affix of affixes) {
    roll -= affix.dropWeight;
    if (roll <= 0) return affix;
  }
  
  return affixes[0];
}

// ============================================
// 套装系统
// ============================================

// 套装奖励等级
export interface SetBonusLevel {
  requiredPieces: number;
  effects: {
    stats?: Partial<LegacyStats>;
    power?: number;
    bonus?: number;
    special?: { id: string; name: string; description: string };
  };
  description: string;
}

// 套装定义
export interface EquipmentSetConfig {
  id: string;
  name: string;
  description: string;
  // 包含的装备槽位
  pieces: EquipmentSlot[];
  // 套装奖励
  bonuses: SetBonusLevel[];
  // 限定世界类型
  worldType?: string;
  // 套装稀有度（决定掉落概率）
  rarity: ItemRarity;
}

// 套装配置
export const EQUIPMENT_SETS: EquipmentSetConfig[] = [
  // ========== 攻击型套装 ==========
  {
    id: 'azure_dragon',
    name: '青龙套装',
    description: '传说中的青龙之力，攻守兼备',
    pieces: ['melee', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 12 } }, description: '体质+12' },
      { requiredPieces: 3, effects: { power: 60, bonus: 25 }, description: '威力+60，加成+25%' },
      { requiredPieces: 4, effects: { stats: { 体质: 25, 灵根: 15 }, special: { id: 'dragon_breath', name: '龙息', description: '攻击时20%概率造成龙息伤害' } }, description: '龙息：攻击时20%概率附加龙息伤害' }
    ],
    worldType: '修仙',
    rarity: '史诗'
  },
  {
    id: 'sword_sage',
    name: '剑圣套装',
    description: '剑道至高传承，专攻极致',
    pieces: ['melee', 'ranged', 'body', 'head'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 灵根: 10, 悟性: 8 } }, description: '灵根+10，悟性+8' },
      { requiredPieces: 3, effects: { bonus: 35, special: { id: 'sword_aura', name: '剑气', description: '攻击附带剑气' } }, description: '加成+35%，剑气：攻击距离+1' },
      { requiredPieces: 4, effects: { stats: { 灵根: 20, 悟性: 15 }, special: { id: 'sword_master', name: '剑圣', description: '暴击率+15%' } }, description: '剑圣：暴击率+15%，暴击伤害+50%' }
    ],
    worldType: '修仙',
    rarity: '传说'
  },
  {
    id: 'warlord',
    name: '战神套装',
    description: '战神遗蜕，力战无双',
    pieces: ['melee', 'head', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 15 }, power: 30 }, description: '体质+15，威力+30' },
      { requiredPieces: 3, effects: { stats: { 意志: 10 }, bonus: 20 }, description: '意志+10，加成+20%' },
      { requiredPieces: 4, effects: { power: 80, special: { id: 'war_cry', name: '战吼', description: '战斗开始时降低敌人攻击力' } }, description: '威力+80，战吼：开局降低敌人10%攻击力' },
      { requiredPieces: 5, effects: { stats: { 体质: 30, 意志: 20 }, special: { id: 'war_god', name: '战神之躯', description: 'HP低于30%时伤害+50%' } }, description: '战神之躯：低血量时伤害大幅提升' }
    ],
    worldType: '高武',
    rarity: '传说'
  },
  
  // ========== 防御型套装 ==========
  {
    id: 'steel_sentinel',
    name: '钢铁守卫',
    description: '科技世界的终极防护系统',
    pieces: ['head', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 18 } }, description: '体质+18' },
      { requiredPieces: 3, effects: { bonus: 35 }, description: '防御加成+35%' },
      { requiredPieces: 4, effects: { stats: { 体质: 35 }, special: { id: 'energy_shield', name: '能量护盾', description: '每回合恢复5%HP' } }, description: '能量护盾：每回合恢复5%HP' }
    ],
    worldType: '科技',
    rarity: '史诗'
  },
  {
    id: 'diamond_body',
    name: '金刚护体',
    description: '金刚不坏，万法不侵',
    pieces: ['head', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 15, 意志: 10 } }, description: '体质+15，意志+10' },
      { requiredPieces: 3, effects: { bonus: 40, special: { id: 'damage_reduction', name: '伤害减免', description: '受到伤害-10%' } }, description: '防御加成+40%，伤害减免10%' },
      { requiredPieces: 4, effects: { stats: { 体质: 40 }, special: { id: 'invincible', name: '金身', description: '受到致命伤害时无敌1回合' } }, description: '金身：受到致命伤害时无敌1回合（每场战斗一次）' }
    ],
    worldType: '修仙',
    rarity: '传说'
  },
  
  // ========== 法术型套装 ==========
  {
    id: 'archmage',
    name: '大法师套装',
    description: '魔法的终极奥义',
    pieces: ['ranged', 'head', 'body', 'legs'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 灵根: 15, 悟性: 10 } }, description: '灵根+15，悟性+10' },
      { requiredPieces: 3, effects: { power: 50, special: { id: 'mana_overflow', name: '魔力涌动', description: 'MP恢复+20%' } }, description: '威力+50，MP恢复+20%' },
      { requiredPieces: 4, effects: { stats: { 灵根: 30, 悟性: 20 }, special: { id: 'spell_master', name: '法术精通', description: '法术威力+30%' } }, description: '法术精通：法术威力+30%，MP消耗-20%' }
    ],
    worldType: '魔幻',
    rarity: '传说'
  },
  {
    id: 'elementalist',
    name: '元素使者',
    description: '掌控四元素之力',
    pieces: ['melee', 'ranged', 'head', 'body'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 灵根: 12 } }, description: '灵根+12' },
      { requiredPieces: 3, effects: { power: 40, bonus: 15 }, description: '威力+40，加成+15%' },
      { requiredPieces: 4, effects: { stats: { 灵根: 25 }, special: { id: 'element_fusion', name: '元素融合', description: '元素伤害+50%' } }, description: '元素融合：元素伤害+50%' }
    ],
    worldType: '魔幻',
    rarity: '史诗'
  },
  
  // ========== 平衡型套装 ==========
  {
    id: 'shadow_dancer',
    name: '影舞者套装',
    description: '如影随形，攻守合一',
    pieces: ['melee', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 幸运: 10, 悟性: 8 } }, description: '幸运+10，悟性+8' },
      { requiredPieces: 3, effects: { power: 35, bonus: 20, special: { id: 'shadow_step', name: '影步', description: '闪避率+10%' } }, description: '威力+35，加成+20%，闪避率+10%' },
      { requiredPieces: 4, effects: { stats: { 幸运: 20, 悟性: 15 }, special: { id: 'shadow_clone', name: '分身', description: '10%概率分身攻击' } }, description: '分身：10%概率额外攻击一次' }
    ],
    rarity: '史诗'
  },
  {
    id: 'universal',
    name: '万法归一',
    description: '无世界限制的通用套装',
    pieces: ['melee', 'ranged', 'head', 'body', 'legs', 'feet'],
    bonuses: [
      { requiredPieces: 2, effects: { stats: { 体质: 8, 灵根: 8 } }, description: '体质+8，灵根+8' },
      { requiredPieces: 3, effects: { stats: { 悟性: 8, 意志: 8 }, power: 30 }, description: '悟性+8，意志+8，威力+30' },
      { requiredPieces: 4, effects: { stats: { 幸运: 10 }, bonus: 25 }, description: '幸运+10，加成+25%' },
      { requiredPieces: 5, effects: { power: 60, stats: { 体质: 15, 灵根: 15 } }, description: '威力+60，体质+15，灵根+15' },
      { requiredPieces: 6, effects: { stats: { 体质: 20, 灵根: 20, 悟性: 20, 意志: 15, 幸运: 15 }, special: { id: 'universal_master', name: '万法归一', description: '全属性大幅提升' } }, description: '万法归一：全属性+20' }
    ],
    rarity: '传说'
  }
];

// 根据世界类型获取套装
export function getSetsByWorldType(worldType?: string): EquipmentSetConfig[] {
  return EQUIPMENT_SETS.filter(set => !set.worldType || set.worldType === worldType);
}

// 计算套装效果
export function calculateSetBonus(
  equippedPieces: { slot: EquipmentSlot; setId: string | null }[]
): { set: EquipmentSetConfig; activeBonuses: SetBonusLevel[]; pieceCount: number }[] {
  const result: { set: EquipmentSetConfig; activeBonuses: SetBonusLevel[]; pieceCount: number }[] = [];
  
  // 按 setId 分组
  const setPieces: Map<string, EquipmentSlot[]> = new Map();
  for (const piece of equippedPieces) {
    if (piece.setId) {
      if (!setPieces.has(piece.setId)) {
        setPieces.set(piece.setId, []);
      }
      setPieces.get(piece.setId)!.push(piece.slot);
    }
  }
  
  // 计算每个套装的激活效果
  for (const [setId, slots] of setPieces) {
    const set = EQUIPMENT_SETS.find(s => s.id === setId);
    if (!set) continue;
    
    const pieceCount = new Set(slots).size; // 去重
    const activeBonuses = set.bonuses.filter(b => pieceCount >= b.requiredPieces);
    
    if (activeBonuses.length > 0) {
      result.push({ set, activeBonuses, pieceCount });
    }
  }
  
  return result;
}

// ============================================
// 强化系统
// ============================================

export const ENHANCEMENT_CONFIG = {
  maxLevel: 15,
  // 每级成功率（%）
  successRates: [100, 100, 100, 95, 90, 85, 75, 65, 55, 45, 35, 28, 22, 15, 8],
  // 每级费用
  costs: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400, 204800, 409600, 819200, 1638400],
  // 每级加成
  bonuses: [
    { power: 5, bonus: 2 },    // +1
    { power: 12, bonus: 5 },   // +2
    { power: 20, bonus: 8 },   // +3
    { power: 30, bonus: 12 },  // +4
    { power: 42, bonus: 16 },  // +5
    { power: 56, bonus: 21 },  // +6
    { power: 72, bonus: 27 },  // +7
    { power: 90, bonus: 33 },  // +8
    { power: 110, bonus: 40 }, // +9
    { power: 135, bonus: 48 }, // +10
    { power: 165, bonus: 57 }, // +11
    { power: 200, bonus: 67 }, // +12
    { power: 240, bonus: 78 }, // +13
    { power: 290, bonus: 90 }, // +14
    { power: 350, bonus: 105 }, // +15
  ],
  // 失败惩罚
  failPenalty: {
    // 是否降级
    downgrade: [false, false, false, false, false, false, true, true, true, true, true, true, true, true, true],
    // 是否销毁
    destroy: [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true],
  }
};

// 获取强化等级加成
export function getEnhancementBonus(level: number): { power: number; bonus: number } {
  if (level <= 0 || level > ENHANCEMENT_CONFIG.maxLevel) {
    return { power: 0, bonus: 0 };
  }
  return ENHANCEMENT_CONFIG.bonuses[level - 1];
}

// ============================================
// 重铸系统
// ============================================

export const REFINEMENT_CONFIG = {
  maxRefinements: 3,
  cost: 10000,
  description: '重新随机词缀，保留强化等级'
};
