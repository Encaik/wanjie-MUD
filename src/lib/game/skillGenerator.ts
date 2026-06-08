/**
 * 技能生成器
 * 
 * 生成功法技能（法技）和武器技巧（斗技）
 * 
 * 配置数据来源：gameData/skillConfigs.ts
 */

import { Element, WeaponCategory } from './restraintSystem';
import { 
  TechniqueSkill, 
  WeaponTechnique, 
  SkillEffect, 
  SkillTag,
  TechniqueEffect,
  TechniqueTrigger,
  ItemRarity,
  TECHNIQUE_RARITY_CONFIG,
  EQUIPMENT_RARITY_CONFIG,
} from './skillTypes';

// 导入配置数据
import {
  // 法技名称库
  TECHNIQUE_SKILL_NAMES,
  // 斗技名称库
  WEAPON_TECHNIQUE_NAMES,
  // 稀有度伤害倍率
  RARITY_DAMAGE_MULTIPLIER,
  // 解锁等级生成
  generateUnlockLevels,
} from '../gameData';

// ============================================
// 工具函数
// ============================================

let skillIdCounter = 0;

function generateSkillId(prefix: string): string {
  return `${prefix}_${Date.now()}_${skillIdCounter++}`;
}

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// 法技描述数据库（额外补充）
// ============================================

const TECHNIQUE_SKILL_DESCRIPTIONS: Record<string, string[]> = {
  fire: ['释放火焰攻击敌人', '造成火焰伤害', '燃烧目标'],
  ice: ['释放寒冰攻击敌人', '造成冰冻伤害', '减缓目标行动'],
  thunder: ['召唤雷电攻击敌人', '造成雷电伤害', '麻痹目标'],
  wind: ['释放风暴攻击敌人', '造成风属性伤害', '击退目标'],
  earth: ['释放岩石攻击敌人', '造成土属性伤害', '石化目标'],
  light: ['释放圣光攻击敌人', '造成光属性伤害', '净化目标'],
  dark: ['释放黑暗攻击敌人', '造成暗属性伤害', '腐蚀目标'],
};

// ============================================
// 法技生成器
// ============================================

/**
 * 生成单个法技
 */
export function generateTechniqueSkill(
  element: Element,
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean = false
): TechniqueSkill {
  const id = generateSkillId('ts');
  
  // 获取技能名称
  const names = TECHNIQUE_SKILL_NAMES[element]?.[rarity] || TECHNIQUE_SKILL_NAMES['fire'][rarity];
  const name = randomElement(names);
  
  // 获取技能描述
  const desc = randomElement(TECHNIQUE_SKILL_DESCRIPTIONS[element] || TECHNIQUE_SKILL_DESCRIPTIONS['fire']);
  const description = isUltimate ? `【终极】${desc}` : desc;
  
  // 基础数值根据解锁等级和稀有度计算
  const baseDamage = 10 + unlockLevel * 5 + (RARITY_DAMAGE_MULTIPLIER[rarity] || 1) * 10;
  const mpCost = 5 + unlockLevel * 5 + (RARITY_DAMAGE_MULTIPLIER[rarity] - 1) * 20 + (isUltimate ? 30 : 0);
  const cooldown = 1 + Math.floor(unlockLevel / 2) + (isUltimate ? 3 : 0);
  
  // 生成效果
  const effects: SkillEffect[] = generateSkillEffects(element, baseDamage, isUltimate);
  
  // 生成标签
  const tags = generateSkillTags(element, isUltimate);
  
  return {
    id,
    name,
    description,
    unlockLevel,
    mpCost,
    cooldown,
    effects,
    tags,
    isUltimate,
  };
}

/**
 * 批量生成法技
 */
export function generateTechniqueSkills(
  element: Element,
  rarity: ItemRarity
): TechniqueSkill[] {
  const config = TECHNIQUE_RARITY_CONFIG[rarity];
  const [minCount, maxCount] = config.skillCount;
  const count = random(minCount, maxCount);
  const skills: TechniqueSkill[] = [];
  
  // 根据稀有度确定解锁等级分布
  const unlockLevels = generateUnlockLevels(count, config.maxLevel);
  
  for (let i = 0; i < count; i++) {
    const isUltimate = i === count - 1 && rarity === '神话';
    const skill = generateTechniqueSkill(element, unlockLevels[i], rarity, isUltimate);
    skills.push(skill);
  }
  
  return skills;
}

// ============================================
// 斗技生成器
// ============================================

/**
 * 生成单个斗技
 */
export function generateWeaponTechnique(
  weaponCategory: string,
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean = false
): WeaponTechnique {
  const id = generateSkillId('wt');
  
  // 获取技巧名称
  const names = WEAPON_TECHNIQUE_NAMES[weaponCategory as WeaponCategory]?.[rarity] || WEAPON_TECHNIQUE_NAMES['sword'][rarity];
  const name = randomElement(names);
  
  const description = isUltimate 
    ? `【终极】${name.split('')[0] || '终极'}终极技巧` 
    : `${name.split('').slice(0, 3).join('') || '武器'}技巧`;
  
  // 生成触发条件
  const trigger = generateTrigger(unlockLevel, isUltimate);
  
  // 生成效果
  const effects = generateTechniqueEffects(unlockLevel, rarity, isUltimate);
  
  return {
    id,
    name,
    description,
    unlockLevel,
    trigger,
    effects,
    isUltimate,
  };
}

/**
 * 批量生成斗技
 */
export function generateWeaponTechniques(
  weaponCategory: string | null,
  rarity: ItemRarity
): WeaponTechnique[] {
  const config = EQUIPMENT_RARITY_CONFIG[rarity];
  const [minCount, maxCount] = config.skillCount;
  const count = random(minCount, maxCount);
  const techniques: WeaponTechnique[] = [];
  
  // 根据稀有度确定解锁等级分布
  const unlockLevels = generateUnlockLevels(count, config.maxLevel);
  
  for (let i = 0; i < count; i++) {
    const isUltimate = i === count - 1 && rarity === '神话';
    const category = weaponCategory || randomElement(['sword', 'blade', 'fist', 'bow', 'spear']);
    const technique = generateWeaponTechnique(category, unlockLevels[i], rarity, isUltimate);
    techniques.push(technique);
  }
  
  return techniques;
}



function generateSkillEffects(element: Element, baseDamage: number, isUltimate: boolean): SkillEffect[] {
  const effects: SkillEffect[] = [];
  
  // 主伤害效果
  effects.push({
    type: 'damage',
    baseValue: isUltimate ? baseDamage * 2 : baseDamage,
    statScaling: 0.5,
    target: isUltimate ? 'all' : 'single',
    description: `造成${isUltimate ? '大量' : ''}伤害`,
  });
  
  // 终极技能添加额外效果
  if (isUltimate) {
    effects.push({
      type: 'debuff',
      baseValue: 30,
      statScaling: 0,
      target: 'all',
      duration: 2,
      description: '降低敌人防御',
    });
  }
  
  return effects;
}

function generateSkillTags(element: Element, isUltimate: boolean): SkillTag[] {
  const tags: SkillTag[] = ['instant'];
  
  if (isUltimate) {
    tags.push('aoe');
  }
  
  // 根据元素添加特殊标签
  const elementTags: Partial<Record<Element, SkillTag[]>> = {
    fire: ['dot'],
    ice: [],
    thunder: ['combo'],
    wind: ['aoe'],
    earth: ['shield'],
    light: ['hot'],
    dark: ['lifesteal'],
  };
  
  if (elementTags[element]) {
    tags.push(...elementTags[element].slice(0, 1));
  }
  
  return [...new Set(tags)];
}

function generateTrigger(unlockLevel: number, isUltimate: boolean): TechniqueTrigger {
  const types: TechniqueTrigger['type'][] = ['on_attack', 'on_hit', 'on_crit', 'passive'];
  
  if (isUltimate) {
    return {
      type: 'active',
      cooldown: 5,
    };
  }
  
  return {
    type: randomElement(types),
    chance: 0.1 + unlockLevel * 0.05,
    cooldown: Math.max(1, unlockLevel - 1), // 确保最小CD为1回合
  };
}

function generateTechniqueEffects(
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean
): TechniqueEffect[] {
  const effects: TechniqueEffect[] = [];
  const multiplier = RARITY_DAMAGE_MULTIPLIER[rarity];
  
  if (isUltimate) {
    effects.push({
      type: 'damage_bonus',
      value: Math.floor((30 + unlockLevel * 5) * multiplier),
      description: '大幅提升伤害',
    });
  } else {
    // 随机生成1-2个效果
    const effectTypes: TechniqueEffect['type'][] = ['damage_bonus', 'crit_bonus', 'lifesteal'];
    const count = random(1, 2);
    
    for (let i = 0; i < count; i++) {
      const type = effectTypes[i % effectTypes.length];
      let value = 0;
      
      switch (type) {
        case 'damage_bonus':
          value = Math.floor((5 + unlockLevel * 2) * multiplier);
          break;
        case 'crit_bonus':
          value = Math.floor((3 + unlockLevel) * multiplier);
          break;
        case 'lifesteal':
          value = Math.floor((5 + unlockLevel) * multiplier / 2);
          break;
      }
      
      effects.push({
        type,
        value,
        description: `提升${type === 'damage_bonus' ? '伤害' : type === 'crit_bonus' ? '暴击' : '吸血'}${value}%`,
      });
    }
  }
  
  return effects;
}
