/**
 * 功法羁绊系统数据配置
 * 
 * 装备多个相关功法时触发羁绊效果，鼓励玩家搭配而非只装最强
 */

import { ItemRarity } from '@/shared/lib/types';

// 羁绊等级
export interface BondLevelConfig {
  level: number;
  requiredCount: number;
  effects: {
    powerBonus: number;  // 威力加成%
    bonusMultiplier: number; // 加成系数提升%
    special?: string; // 特殊效果
  };
}

// 羁绊定义
export interface TechniqueBondConfig {
  id: string;
  name: string;
  description: string;
  // 匹配关键词（功法名称包含这些关键词即匹配）
  keywords: string[];
  // 需要的最小匹配数量
  minMatches: number;
  // 各等级效果
  levels: BondLevelConfig[];
  // 稀有度（用于UI显示）
  rarity: ItemRarity;
  // 适用世界类型（空为通用）
  worldTypes?: string[];
}

// 功法羁绊配置
export const TECHNIQUE_BONDS: TechniqueBondConfig[] = [
  // ========== 元素类羁绊 ==========
  {
    id: 'fire_master',
    name: '火焰掌控',
    description: '装备多本火系功法，掌控火焰之力',
    keywords: ['火', '炎', '烈', '焚', '焰', '灼'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 10, bonusMultiplier: 5 } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 20, bonusMultiplier: 10, special: '灼烧：攻击时10%概率附加灼烧效果' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 35, bonusMultiplier: 20, special: '火神之体：火焰伤害减免30%' } },
    ],
    rarity: '稀有'
  },
  {
    id: 'ice_master',
    name: '寒冰之心',
    description: '装备多本冰系功法，寒冰护体',
    keywords: ['冰', '寒', '雪', '霜', '冻', '凛'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 10, bonusMultiplier: 5 } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 20, bonusMultiplier: 10, special: '冰盾：被攻击时10%概率冻结敌人1回合' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 35, bonusMultiplier: 20, special: '冰神之体：免疫冻结，减速效果转化为加速' } },
    ],
    rarity: '稀有'
  },
  {
    id: 'thunder_master',
    name: '雷霆万钧',
    description: '装备多本雷系功法，雷霆之力',
    keywords: ['雷', '电', '霆', '闪', '霹雳'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 12, bonusMultiplier: 6 } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 25, bonusMultiplier: 12, special: '雷击：攻击时15%概率附加雷电伤害' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 40, bonusMultiplier: 25, special: '雷神之体：受到攻击时30%概率雷击反击' } },
    ],
    rarity: '稀有'
  },
  {
    id: 'wind_master',
    name: '风之舞者',
    description: '装备多本风系功法，身轻如燕',
    keywords: ['风', '岚', '飓', '翼', '翔'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 8, bonusMultiplier: 8, special: '闪避率+5%' } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 15, bonusMultiplier: 15, special: '疾风：行动速度+20%' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 30, bonusMultiplier: 25, special: '风神之体：闪避率+15%，免疫减速' } },
    ],
    rarity: '稀有'
  },
  
  // ========== 武器类羁绊 ==========
  {
    id: 'sword_adept',
    name: '剑道通神',
    description: '装备多本剑类功法，剑意凛然',
    keywords: ['剑', '剑法', '剑诀', '剑意', '剑气', '剑术'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 15, bonusMultiplier: 8 } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 30, bonusMultiplier: 15, special: '剑气：攻击距离+1' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 50, bonusMultiplier: 30, special: '剑心通明：暴击率+10%，暴击伤害+30%' } },
    ],
    rarity: '史诗'
  },
  {
    id: 'blade_master',
    name: '刀霸天下',
    description: '装备多本刀类功法，刀气纵横',
    keywords: ['刀', '刀法', '刀诀', '刀意', '斩', '劈'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 12, bonusMultiplier: 10 } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 25, bonusMultiplier: 20, special: '刀势：对低血量敌人伤害+20%' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 45, bonusMultiplier: 35, special: '刀魔：攻击时无视目标20%防御' } },
    ],
    rarity: '史诗'
  },
  {
    id: 'fist_legend',
    name: '拳霸一方',
    description: '装备多本拳掌类功法，拳力无边',
    keywords: ['拳', '掌', '拳法', '掌法', '指', '爪'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 10, bonusMultiplier: 5, special: '连击：5%概率攻击两次' } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 20, bonusMultiplier: 12, special: '破甲：攻击时10%概率破甲' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 40, bonusMultiplier: 25, special: '拳意：每回合自动恢复5%HP' } },
    ],
    rarity: '稀有'
  },
  
  // ========== 防御类羁绊 ==========
  {
    id: 'iron_wall',
    name: '铜墙铁壁',
    description: '装备多本防御功法，固若金汤',
    keywords: ['盾', '防', '守', '护', '甲', '壁', '金钟'],
    minMatches: 2,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 5, bonusMultiplier: 15 } },
      { level: 2, requiredCount: 3, effects: { powerBonus: 10, bonusMultiplier: 25, special: '护盾：每回合开始获得5%最大HP护盾' } },
      { level: 3, requiredCount: 5, effects: { powerBonus: 20, bonusMultiplier: 40, special: '金刚：受到致命伤害时有30%概率保留1HP' } },
    ],
    rarity: '稀有'
  },
  
  // ========== 特殊类羁绊 ==========
  {
    id: 'yinyang_harmony',
    name: '阴阳调和',
    description: '同时装备阴阳两类功法，阴阳互补',
    keywords: [], // 特殊羁绊，需要单独判断
    minMatches: 0,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 15, bonusMultiplier: 10, special: '阴阳平衡：全属性+3' } },
    ],
    rarity: '史诗'
  },
  {
    id: 'demon_suppression',
    name: '正邪合一',
    description: '同时装备正道与魔道功法，正邪相融',
    keywords: [], // 特殊羁绊，需要单独判断
    minMatches: 0,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 25, bonusMultiplier: 15, special: '正邪之力：攻击力+15%，防御力+15%' } },
    ],
    rarity: '传说'
  },
  
  // ========== 稀有度羁绊 ==========
  {
    id: 'legendary_collection',
    name: '传说之师',
    description: '装备多本传说品质功法',
    keywords: [], // 按稀有度判断
    minMatches: 0,
    levels: [
      { level: 1, requiredCount: 2, effects: { powerBonus: 30, bonusMultiplier: 20, special: '传说光环：全属性+5' } },
      { level: 2, requiredCount: 4, effects: { powerBonus: 60, bonusMultiplier: 40, special: '传说之力：所有功法MP消耗-30%' } },
    ],
    rarity: '传说'
  },
  
  // ========== 世界专属羁绊 ==========
  {
    id: 'cultivation_orthodox',
    name: '修仙正统',
    description: '装备多本修仙界正统功法',
    keywords: ['仙', '道', '真', '玄', '灵', '元'],
    minMatches: 3,
    levels: [
      { level: 1, requiredCount: 3, effects: { powerBonus: 20, bonusMultiplier: 12, special: '仙缘：修炼效率+15%' } },
      { level: 2, requiredCount: 5, effects: { powerBonus: 40, bonusMultiplier: 25, special: '道法自然：突破成功率+10%' } },
    ],
    rarity: '史诗',
    worldTypes: ['修仙', '仙侠']
  },
  {
    id: 'martial_supreme',
    name: '武道至尊',
    description: '装备多本武道功法',
    keywords: ['武', '劲', '气', '拳', '腿', '内'],
    minMatches: 3,
    levels: [
      { level: 1, requiredCount: 3, effects: { powerBonus: 18, bonusMultiplier: 10, special: '武心：意志+5' } },
      { level: 2, requiredCount: 5, effects: { powerBonus: 35, bonusMultiplier: 22, special: '武道宗师：战斗获得经验+20%' } },
    ],
    rarity: '史诗',
    worldTypes: ['高武', '武侠']
  },
  {
    id: 'tech_evolution',
    name: '进化之路',
    description: '装备多本科技系技能模块',
    keywords: ['进化', '基因', '纳米', '量子', '机械', '能量'],
    minMatches: 3,
    levels: [
      { level: 1, requiredCount: 3, effects: { powerBonus: 15, bonusMultiplier: 10, special: '适应：受伤后防御力+10%' } },
      { level: 2, requiredCount: 5, effects: { powerBonus: 30, bonusMultiplier: 20, special: '超进化：所有属性+8' } },
    ],
    rarity: '史诗',
    worldTypes: ['科技']
  },
  {
    id: 'magic_supreme',
    name: '魔道至尊',
    description: '装备多本魔法典籍',
    keywords: ['魔', '咒', '法', '术', '元素', '符文'],
    minMatches: 3,
    levels: [
      { level: 1, requiredCount: 3, effects: { powerBonus: 20, bonusMultiplier: 12, special: '魔力涌动：MP恢复+20%' } },
      { level: 2, requiredCount: 5, effects: { powerBonus: 40, bonusMultiplier: 25, special: '禁咒：可施放禁咒' } },
    ],
    rarity: '史诗',
    worldTypes: ['魔幻']
  },
];

// 熟练度等级配置
export const PROFICIENCY_LEVELS = {
  入门: { min: 0, max: 199, powerBonus: 0, bonusMultiplier: 0, mpReduce: 0 },
  小成: { min: 200, max: 449, powerBonus: 10, bonusMultiplier: 5, mpReduce: 0 },
  大成: { min: 450, max: 699, powerBonus: 25, bonusMultiplier: 15, mpReduce: 10 },
  圆满: { min: 700, max: 899, powerBonus: 40, bonusMultiplier: 25, mpReduce: 20 },
  化境: { min: 900, max: 1000, powerBonus: 60, bonusMultiplier: 40, mpReduce: 30 }
} as const;

export type ProficiencyLevel = keyof typeof PROFICIENCY_LEVELS;

// 获取熟练度等级
export function getProficiencyLevel(proficiency: number): ProficiencyLevel {
  for (const [level, config] of Object.entries(PROFICIENCY_LEVELS)) {
    if (proficiency >= config.min && proficiency <= config.max) {
      return level as ProficiencyLevel;
    }
  }
  return '化境';
}

// 获取熟练度加成
export function getProficiencyBonus(proficiency: number) {
  const level = getProficiencyLevel(proficiency);
  return PROFICIENCY_LEVELS[level];
}

// 检查功法是否匹配羁绊
export function checkTechniqueBondMatch(
  techniqueName: string,
  bond: TechniqueBondConfig
): boolean {
  return bond.keywords.some(keyword => techniqueName.includes(keyword));
}

// 计算羁绊效果
export function calculateBondEffects(
  techniques: { name: string; rarity: ItemRarity }[]
): { bond: TechniqueBondConfig; level: BondLevelConfig; matchCount: number }[] {
  const activeBonds: { bond: TechniqueBondConfig; level: BondLevelConfig; matchCount: number }[] = [];
  
  for (const bond of TECHNIQUE_BONDS) {
    // 特殊羁绊单独处理
    if (bond.keywords.length === 0) {
      // TODO: 特殊羁绊逻辑
      continue;
    }
    
    const matchCount = techniques.filter(t => checkTechniqueBondMatch(t.name, bond)).length;
    
    if (matchCount >= bond.minMatches) {
      // 找到最高触发的等级
      const sortedLevels = [...bond.levels].sort((a, b) => b.requiredCount - a.requiredCount);
      const activeLevel = sortedLevels.find(l => matchCount >= l.requiredCount);
      
      if (activeLevel) {
        activeBonds.push({ bond, level: activeLevel, matchCount });
      }
    }
  }
  
  return activeBonds;
}
