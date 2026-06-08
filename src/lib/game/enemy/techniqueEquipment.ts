/**
 * 敌人功法装备生成系统
 * 
 * 核心设计：
 * 1. 敌人拥有真实的功法和装备
 * 2. 从功法装备中提取可用技能
 * 3. 与玩家系统完全同构
 */

import {
  TierEquipmentConfig,
  TIER_EQUIPMENT_CONFIG,
} from './types';
import { BattleSkill } from '../battle/types';
import { ELEMENTS, WEAPON_CATEGORIES } from '../stats/calculator';
import { 
  Technique, 
  Equipment, 
  ItemRarity,
  TechniqueType,
  EquipmentSlot,
  WorldType,
  Element,
  WeaponCategory,
} from '../types';

// ============================================
// 工具函数
// ============================================

/**
 * 生成唯一ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 加权随机选择
 */
function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) return key;
  }
  
  return entries[0][0];
}

/**
 * 随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机选择数组元素
 */
function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// 功法生成
// ============================================

/** 功法名称前缀 */
const TECHNIQUE_PREFIXES: Record<ItemRarity, string[]> = {
  '普通': ['基础', '入门', '初级'],
  '稀有': ['精要', '进阶', '中级'],
  '史诗': ['奥义', '秘传', '高级'],
  '传说': ['天阶', '绝世', '无上'],
  '神话': ['混沌', '鸿蒙', '太初'],
};

/** 功法名称后缀 */
const TECHNIQUE_SUFFIXES: Record<TechniqueType, string[]> = {
  attack: ['诀', '法', '术', '经'],
  defense: ['盾', '甲', '罩', '壁'],
};

/** 元素中文名 */
const ELEMENT_NAMES: Record<Element, string> = {
  fire: '火',
  ice: '冰',
  thunder: '雷',
  wind: '风',
  earth: '土',
  light: '光',
  dark: '暗',
};

/** 武器类别中文名 */
const WEAPON_NAMES: Record<WeaponCategory, string> = {
  sword: '剑',
  blade: '刀',
  fist: '拳',
  bow: '弓',
  spear: '枪',
};

/**
 * 生成敌人功法
 */
export function generateEnemyTechnique(
  level: number,
  rarity: ItemRarity,
  type: TechniqueType,
  element: Element,
  worldType: WorldType
): Technique {
  const prefix = randomChoice(TECHNIQUE_PREFIXES[rarity]);
  const suffix = randomChoice(TECHNIQUE_SUFFIXES[type]);
  const elementName = ELEMENT_NAMES[element];
  const name = `${prefix}${elementName}系${suffix}`;
  
  // 根据稀有度确定最大等级
  const maxLevelMap: Record<ItemRarity, number> = {
    '普通': 5, '稀有': 7, '史诗': 8, '传说': 9, '神话': 10,
  };
  
  // 根据等级和稀有度计算属性
  const rarityMultiplier = {
    '普通': 1.0, '稀有': 1.3, '史诗': 1.6, '传说': 2.0, '神话': 2.5,
  }[rarity];
  
  const basePower = Math.floor((10 + level * 3) * rarityMultiplier);
  const baseBonus = Math.floor((5 + level * 0.5) * rarityMultiplier);
  const baseMpCost = Math.floor(10 + level * 2);
  
  // 技能槽位
  const skillSlots = Math.min(level, maxLevelMap[rarity]);
  const maxSkillSlots = maxLevelMap[rarity];
  
  return {
    id: generateId('tech'),
    name,
    type,
    rarity,
    description: `${rarity}${elementName}系${type === 'attack' ? '攻击' : '防御'}功法`,
    
    level,
    exp: 0,
    expToNext: Math.floor(100 * Math.pow(1.5, level - 1)),
    maxLevel: maxLevelMap[rarity],
    
    power: basePower,
    bonus: baseBonus,
    baseMpCost,
    
    element,
    subElement: undefined,
    
    compatibleWeapon: Math.random() > 0.5 ? randomChoice(WEAPON_CATEGORIES) : null,
    compatibleBonus: Math.floor(10 + level * 0.5),
    
    skillSlots,
    maxSkillSlots,
    allSkills: generateTechniqueSkills(level, rarity, type),
    equippedSkills: [],
    
    source: 'drop',
    isFragment: false,
  };
}

/**
 * 生成功法技能（简化版，用于敌人）
 */
function generateTechniqueSkills(
  level: number,
  rarity: ItemRarity,
  type: TechniqueType
): any[] {
  const skills: any[] = [];
  const skillCount = {
    '普通': 1, '稀有': 2, '史诗': 3, '传说': 4, '神话': 5,
  }[rarity];
  
  // 【修复】根据稀有度提高技能伤害倍率基础值
  const rarityMultiplier = {
    '普通': 1.0,
    '稀有': 1.15,
    '史诗': 1.3,
    '传说': 1.5,
    '神话': 1.8,
  }[rarity];
  
  for (let i = 0; i < skillCount; i++) {
    // 【修复】调整解锁等级计算，确保低等级敌人也有技能
    // 第一个技能解锁等级为1，后续技能按比例递增
    const unlockLevel = i === 0 ? 1 : Math.floor((i + 1) * (10 / (skillCount + 1)));
    if (unlockLevel > level) continue;
    
    // 【修复】提高技能伤害倍率：基础1.5 + 技能序号*0.3 * 稀有度加成
    // 普通敌人: 1.5, 1.8, 2.1, 2.4, 2.7
    // 神话敌人: 2.7, 3.24, 3.78, 4.32, 4.86
    const baseMultiplier = 1.5 + i * 0.3;
    const finalMultiplier = baseMultiplier * rarityMultiplier;
    
    skills.push({
      id: `skill_${i}`,
      name: type === 'attack' ? `攻击技能${i + 1}` : `防御技能${i + 1}`,
      description: type === 'attack' ? '造成伤害' : '减少伤害',
      unlockLevel,
      mpCost: Math.floor(10 + level * 2 + i * 5),
      cooldown: 3 + i,
      // 简化效果结构
      effects: [{
        type: type === 'attack' ? 'damage' : 'heal',
        baseValue: type === 'attack' ? finalMultiplier : (level * 2 + i * 5),
        statScaling: 1,
        target: 'single',
      }],
      tags: [],
    });
  }
  
  return skills;
}

/**
 * 批量生成敌人功法
 */
export function generateEnemyTechniques(
  config: TierEquipmentConfig,
  enemyLevel: number,
  worldType: WorldType
): Technique[] {
  const slotCount = randomInt(config.techniqueSlots.min, config.techniqueSlots.max);
  const techniques: Technique[] = [];
  
  for (let i = 0; i < slotCount; i++) {
    // 确定稀有度
    const rarity = weightedRandom(config.techniqueRarity);
    
    // 确定功法类型
    const type: TechniqueType = Math.random() > 0.5 ? 'attack' : 'defense';
    
    // 确定元素
    const element = randomChoice(ELEMENTS);
    
    // 功法等级（略低于敌人等级）
    const techLevel = Math.max(1, enemyLevel + randomInt(-2, 1));
    
    techniques.push(generateEnemyTechnique(techLevel, rarity, type, element, worldType));
  }
  
  return techniques;
}

// ============================================
// 装备生成
// ============================================

/** 装备名称前缀 */
const EQUIPMENT_PREFIXES: Record<ItemRarity, string[]> = {
  '普通': ['铁', '铜', '石'],
  '稀有': ['精钢', '玄铁', '灵石'],
  '史诗': ['紫金', '星辰', '神铁'],
  '传说': ['天外', '混沌', '圣物'],
  '神话': ['创世', '鸿蒙', '太初'],
};

/** 装备类型名称 */
const EQUIPMENT_TYPE_NAMES: Record<EquipmentSlot, string> = {
  melee: '剑',
  ranged: '弓',
  head: '冠',
  body: '甲',
  legs: '靴',
  feet: '履',
};

/**
 * 生成敌人装备
 */
export function generateEnemyEquipment(
  level: number,
  rarity: ItemRarity,
  slot: EquipmentSlot,
  worldType: WorldType
): Equipment {
  const prefix = randomChoice(EQUIPMENT_PREFIXES[rarity]);
  const typeName = EQUIPMENT_TYPE_NAMES[slot];
  const name = `${prefix}${typeName}`;
  
  // 根据稀有度确定最大等级
  const maxLevelMap: Record<ItemRarity, number> = {
    '普通': 5, '稀有': 7, '史诗': 8, '传说': 9, '神话': 10,
  };
  
  // 根据等级和稀有度计算属性
  const rarityMultiplier = {
    '普通': 1.0, '稀有': 1.3, '史诗': 1.6, '传说': 2.0, '神话': 2.5,
  }[rarity];
  
  const isWeapon = slot === 'melee' || slot === 'ranged';
  const baseBonus = Math.floor((3 + level * 0.5) * rarityMultiplier);
  const basePower = Math.floor((10 + level * 2) * rarityMultiplier);
  
  // 技巧槽位
  const techniqueSlots = isWeapon ? Math.min(level, maxLevelMap[rarity]) : 0;
  const maxTechniqueSlots = isWeapon ? maxLevelMap[rarity] : 0;
  
  return {
    id: generateId('equip'),
    name,
    slot,
    rarity,
    description: `${rarity}${isWeapon ? '武器' : '护甲'}`,
    
    level,
    exp: 0,
    expToNext: Math.floor(50 * Math.pow(1.3, level - 1)),
    maxLevel: maxLevelMap[rarity],
    
    weaponCategory: isWeapon ? randomChoice(WEAPON_CATEGORIES) : null,
    
    element: isWeapon ? randomChoice(ELEMENTS) : null,
    compatibleElement: Math.random() > 0.5 ? randomChoice(ELEMENTS) : null,
    compatibleBonus: Math.floor(5 + level * 0.3),
    
    attackBonus: isWeapon ? baseBonus : 0,
    defenseBonus: !isWeapon ? baseBonus : 0,
    power: basePower,
    
    techniqueSlots,
    maxTechniqueSlots,
    allTechniques: isWeapon ? generateWeaponTechniques(level, rarity) : [],
    equippedTechniques: [],
    
    source: 'drop',
    isFragment: false,
  };
}

/**
 * 生成武器技巧（简化版，用于敌人）
 */
function generateWeaponTechniques(
  level: number,
  rarity: ItemRarity
): any[] {
  const techniques: any[] = [];
  const techCount = {
    '普通': 0, '稀有': 1, '史诗': 2, '传说': 3, '神话': 4,
  }[rarity];
  
  for (let i = 0; i < techCount; i++) {
    const unlockLevel = Math.floor((i + 1) * (10 / (techCount + 1)));
    if (unlockLevel > level) continue;
    
    techniques.push({
      id: `tech_${i}`,
      name: `技巧${i + 1}`,
      description: '武器技巧',
      unlockLevel,
      trigger: {
        type: 'active',
        cooldown: 4 + i,
      },
      effects: [{
        type: 'damage_bonus',
        value: 1.3 + i * 0.15,
        description: `伤害加成 ${(1.3 + i * 0.15).toFixed(2)}倍`,
      }],
    });
  }
  
  return techniques;
}

/**
 * 批量生成敌人装备
 */
export function generateEnemyEquipments(
  config: TierEquipmentConfig,
  enemyLevel: number,
  worldType: WorldType
): Equipment[] {
  const equipments: Equipment[] = [];
  const slotCount = config.equipmentSlots;
  
  // 装备槽位列表（优先武器）
  const slotPriority: EquipmentSlot[] = ['melee', 'body', 'head', 'legs', 'feet', 'ranged'];
  
  for (let i = 0; i < Math.min(slotCount, slotPriority.length); i++) {
    const slot = slotPriority[i];
    
    // 确定稀有度
    const rarity = weightedRandom(config.equipmentRarity);
    
    // 装备等级（略低于敌人等级）
    const equipLevel = Math.max(1, enemyLevel + randomInt(-3, 1));
    
    equipments.push(generateEnemyEquipment(equipLevel, rarity, slot, worldType));
  }
  
  return equipments;
}

// ============================================
// 技能生成
// ============================================

/**
 * 从功法和装备生成可用技能列表
 */
export function generateEnemySkills(
  techniques: Technique[],
  equipments: Equipment[]
): BattleSkill[] {
  const skills: BattleSkill[] = [];
  
  // 从功法中提取技能
  for (const technique of techniques) {
    if (technique.allSkills) {
      for (const skill of technique.allSkills) {
        if (skill.unlockLevel <= technique.level) {
          // 从效果数组中提取伤害倍率和治疗量
          const damageEffect = skill.effects?.find((e: any) => e.type === 'damage');
          const healEffect = skill.effects?.find((e: any) => e.type === 'heal');
          
          // 【修复】使用技能自身的 MP 消耗，如果没有则使用功法基础消耗的 80%
          const mpCost = skill.mpCost ?? Math.floor((technique.baseMpCost || 20) * 0.8);
          
          skills.push({
            id: `${technique.id}_${skill.id}`,
            name: skill.name,
            description: skill.description || '',
            type: technique.type === 'attack' ? 'attack' : 'defense',
            mpCost,
            cooldown: skill.cooldown ?? 3,
            effect: {
              damageMultiplier: damageEffect?.baseValue || 1,
              healing: healEffect?.baseValue || 0,
            },
            element: technique.element,
            techniqueId: technique.id,
            source: 'technique',
            skillCategory: 'technique',
          });
        }
      }
    }
  }
  
  // 从装备中提取技能
  for (const equipment of equipments) {
    if (equipment.allTechniques) {
      for (const tech of equipment.allTechniques) {
        if (tech.unlockLevel <= equipment.level) {
          // 从效果数组中提取伤害加成
          const damageEffect = tech.effects?.find((e: any) => e.type === 'damage_bonus');
          
          skills.push({
            id: `${equipment.id}_${tech.id}`,
            name: tech.name,
            description: tech.description || '',
            type: 'attack',
            mpCost: 0, // 斗技不消耗法力
            cooldown: tech.trigger?.cooldown ?? 4,
            effect: {
              damageMultiplier: damageEffect?.value ?? 1.2,
            },
            weaponCategory: equipment.weaponCategory,
            equipmentId: equipment.id,
            source: 'equipment',
            skillCategory: 'combat',
          });
        }
      }
    }
  }
  
  return skills;
}

// ============================================
// 完整生成
// ============================================

/**
 * 敌人功法装备生成结果
 */
export interface EnemyTechniqueEquipmentResult {
  techniques: Technique[];
  equipments: Equipment[];
  skills: BattleSkill[];
  statBonus: {
    hp: number;
    attack: number;
    defense: number;
    mp: number;
  };
}

/**
 * 完整生成敌人功法装备
 */
export function generateEnemyTechniqueEquipment(
  tier: 'normal' | 'elite' | 'miniboss' | 'boss',
  enemyLevel: number,
  worldType: WorldType
): EnemyTechniqueEquipmentResult {
  const config = TIER_EQUIPMENT_CONFIG[tier];
  
  // 生成功法
  const techniques = generateEnemyTechniques(config, enemyLevel, worldType);
  
  // 生成装备
  const equipments = generateEnemyEquipments(config, enemyLevel, worldType);
  
  // 生成技能
  const skills = generateEnemySkills(techniques, equipments);
  
  // 计算属性加成
  const statBonus = {
    hp: techniques.reduce((sum, t) => sum + (t.type === 'defense' ? t.bonus * 5 : 0), 0) +
        equipments.reduce((sum, e) => sum + (e.defenseBonus || 0) * 5, 0),
    attack: techniques.reduce((sum, t) => sum + (t.type === 'attack' ? t.bonus : 0), 0) +
            equipments.reduce((sum, e) => sum + (e.attackBonus || 0), 0),
    defense: techniques.reduce((sum, t) => sum + (t.type === 'defense' ? t.bonus : 0), 0) +
             equipments.reduce((sum, e) => sum + (e.defenseBonus || 0), 0),
    mp: techniques.reduce((sum, t) => sum + (t.type === 'attack' ? t.bonus * 0.5 : 0), 0) +
        equipments.reduce((sum, e) => sum + (e.attackBonus || 0) * 0.3, 0),
  };
  
  return {
    techniques,
    equipments,
    skills,
    statBonus,
  };
}
