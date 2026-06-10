/**
 * 敌人增强系统
 * 
 * 为敌人添加"虚拟功法"和"虚拟装备"系统
 * 让敌人也能指数成长，保持与玩家的战力平衡
 * 
 * 设计理念：
 * - 玩家通过功法+装备获得百分比加成（叠加成长）
 * - 敌人根据等级获得类似的虚拟加成
 * - 高等级敌人/Boss拥有更强的虚拟装备和功法
 */

import { EnemyTier } from '@/core/types';

/**
 * 敌人虚拟功法配置
 */
export interface EnemyVirtualTechnique {
  /** 功法名称模板 */
  nameTemplate: string;
  /** 攻击加成百分比 */
  attackBonus: number;
  /** 防御加成百分比 */
  defenseBonus: number;
  /** HP加成百分比 */
  hpBonus: number;
}

/**
 * 敌人虚拟装备配置
 */
export interface EnemyVirtualEquipment {
  /** 装备名称模板 */
  nameTemplate: string;
  /** 攻击加成百分比 */
  attackBonus: number;
  /** 防御加成百分比 */
  defenseBonus: number;
  /** HP加成百分比 */
  hpBonus: number;
}

/**
 * 敌人增强结果
 */
export interface EnemyEnhancement {
  /** 虚拟功法列表 */
  techniques: EnemyVirtualTechnique[];
  /** 虚拟装备列表 */
  equipments: EnemyVirtualEquipment[];
  /** 总攻击加成百分比 */
  totalAttackBonus: number;
  /** 总防御加成百分比 */
  totalDefenseBonus: number;
  /** 总HP加成百分比 */
  totalHpBonus: number;
  /** 增强描述 */
  description: string;
}

/**
 * 敌人等级分段配置
 * 定义每个等级段敌人获得的功法/装备强度
 */
interface EnemyTierThreshold {
  minLevel: number;
  maxLevel: number;
  /** 功法数量 */
  techniqueCount: number;
  /** 装备数量 */
  equipmentCount: number;
  /** 单个功法基础加成 */
  techniqueBonus: number;
  /** 单个装备基础加成 */
  equipmentBonus: number;
}

const ENEMY_TIER_THRESHOLDS: EnemyTierThreshold[] = [
  { minLevel: 1, maxLevel: 19, techniqueCount: 0, equipmentCount: 0, techniqueBonus: 0, equipmentBonus: 0 },
  { minLevel: 20, maxLevel: 39, techniqueCount: 1, equipmentCount: 1, techniqueBonus: 5, equipmentBonus: 3 },
  { minLevel: 40, maxLevel: 59, techniqueCount: 1, equipmentCount: 2, techniqueBonus: 8, equipmentBonus: 5 },
  { minLevel: 60, maxLevel: 79, techniqueCount: 2, equipmentCount: 2, techniqueBonus: 10, equipmentBonus: 8 },
  { minLevel: 80, maxLevel: 99, techniqueCount: 2, equipmentCount: 3, techniqueBonus: 15, equipmentBonus: 10 },
  { minLevel: 100, maxLevel: 119, techniqueCount: 3, equipmentCount: 3, techniqueBonus: 18, equipmentBonus: 12 },
  { minLevel: 120, maxLevel: 999, techniqueCount: 3, equipmentCount: 4, techniqueBonus: 22, equipmentBonus: 15 },
];

/**
 * 敌人等级类型额外加成
 */
const TIER_BONUS: Record<EnemyTier, { attack: number; defense: number; hp: number }> = {
  normal: { attack: 0, defense: 0, hp: 0 },
  elite: { attack: 15, defense: 10, hp: 20 },
  miniboss: { attack: 30, defense: 25, hp: 50 },
  boss: { attack: 50, defense: 40, hp: 100 },
};

/**
 * 新手区域（难度<=10）敌人等级类型额外加成
 * 大幅降低加成，确保新手能击败
 */
const NEWBIE_TIER_BONUS: Record<EnemyTier, { attack: number; defense: number; hp: number }> = {
  normal: { attack: 0, defense: 0, hp: 0 },
  elite: { attack: 5, defense: 5, hp: 10 },
  miniboss: { attack: 10, defense: 8, hp: 20 },
  boss: { attack: 15, defense: 10, hp: 25 },  // 新手Boss只有25%的HP加成，而非100%
};

/**
 * 功法名称模板
 */
const TECHNIQUE_NAMES = [
  '蛮力诀', '铁布衫', '金刚功', '混元气', '霸体术',
  '狂暴功', '护身法', '罡气诀', '血煞功', '魔焰诀',
  '天魔功', '修罗诀', '血海经', '魔道典', '邪神诀',
];

/**
 * 装备名称模板
 */
const EQUIPMENT_NAMES = {
  weapon: ['锈铁剑', '精钢刀', '玄铁枪', '灵器剑', '仙兵刃', '神兵'],
  armor: ['布衣', '皮甲', '铁甲', '精钢甲', '灵甲', '仙甲', '神甲'],
  accessory: ['护符', '玉佩', '戒指', '项链', '法宝'],
};

/**
 * 获取敌人等级段配置
 */
function getTierThreshold(level: number): EnemyTierThreshold {
  for (const threshold of ENEMY_TIER_THRESHOLDS) {
    if (level >= threshold.minLevel && level <= threshold.maxLevel) {
      return threshold;
    }
  }
  return ENEMY_TIER_THRESHOLDS[ENEMY_TIER_THRESHOLDS.length - 1];
}

/**
 * 计算等级加成系数
 * 等级越高，功法/装备效果越强
 */
function getLevelMultiplier(level: number): number {
  // 每20级增加10%效果
  return 1 + Math.floor(level / 20) * 0.1;
}

/**
 * 生成敌人虚拟功法
 */
function generateVirtualTechniques(
  level: number,
  count: number,
  baseBonus: number
): EnemyVirtualTechnique[] {
  if (count === 0) return [];
  
  const techniques: EnemyVirtualTechnique[] = [];
  const levelMultiplier = getLevelMultiplier(level);
  const shuffledNames = [...TECHNIQUE_NAMES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    const bonus = Math.floor(baseBonus * levelMultiplier);
    const isAttackOriented = Math.random() > 0.5;
    
    techniques.push({
      nameTemplate: shuffledNames[i % shuffledNames.length],
      attackBonus: isAttackOriented ? bonus : Math.floor(bonus * 0.5),
      defenseBonus: isAttackOriented ? Math.floor(bonus * 0.3) : bonus,
      hpBonus: Math.floor(bonus * 0.2),
    });
  }
  
  return techniques;
}

/**
 * 生成敌人虚拟装备
 */
function generateVirtualEquipments(
  level: number,
  count: number,
  baseBonus: number
): EnemyVirtualEquipment[] {
  if (count === 0) return [];
  
  const equipments: EnemyVirtualEquipment[] = [];
  const levelMultiplier = getLevelMultiplier(level);
  const qualityIndex = Math.min(Math.floor(level / 20), EQUIPMENT_NAMES.weapon.length - 1);
  
  const types: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory'];
  
  for (let i = 0; i < count && i < 3; i++) {
    const bonus = Math.floor(baseBonus * levelMultiplier);
    const type = types[i % types.length];
    const name = EQUIPMENT_NAMES[type][qualityIndex];
    
    equipments.push({
      nameTemplate: name,
      attackBonus: type === 'weapon' ? bonus : Math.floor(bonus * 0.3),
      defenseBonus: type === 'armor' ? bonus : Math.floor(bonus * 0.4),
      hpBonus: type === 'accessory' ? Math.floor(bonus * 0.5) : Math.floor(bonus * 0.2),
    });
  }
  
  // 如果数量超过3，添加额外装备
  for (let i = 3; i < count; i++) {
    const bonus = Math.floor(baseBonus * levelMultiplier * 0.8);
    equipments.push({
      nameTemplate: '秘宝',
      attackBonus: Math.floor(bonus * 0.5),
      defenseBonus: Math.floor(bonus * 0.5),
      hpBonus: bonus,
    });
  }
  
  return equipments;
}

/**
 * 计算敌人增强属性
 * 
 * @param enemyLevel 敌人等级
 * @param enemyTier 敌人类型（普通/精英/小Boss/Boss）
 * @param difficultyValue 难度等级（可选，用于新手区域判断）
 * @returns 敌人增强结果
 */
export function calculateEnemyEnhancement(
  enemyLevel: number,
  enemyTier: EnemyTier,
  difficultyValue: number = 1
): EnemyEnhancement {
  // 获取等级段配置
  const threshold = getTierThreshold(enemyLevel);
  
  // 生成虚拟功法
  const techniques = generateVirtualTechniques(
    enemyLevel,
    threshold.techniqueCount,
    threshold.techniqueBonus
  );
  
  // 生成虚拟装备
  const equipments = generateVirtualEquipments(
    enemyLevel,
    threshold.equipmentCount,
    threshold.equipmentBonus
  );
  
  // 计算总加成
  let totalAttackBonus = 0;
  let totalDefenseBonus = 0;
  let totalHpBonus = 0;
  
  for (const technique of techniques) {
    totalAttackBonus += technique.attackBonus;
    totalDefenseBonus += technique.defenseBonus;
    totalHpBonus += technique.hpBonus;
  }
  
  for (const equipment of equipments) {
    totalAttackBonus += equipment.attackBonus;
    totalDefenseBonus += equipment.defenseBonus;
    totalHpBonus += equipment.hpBonus;
  }
  
  // 应用敌人类型加成（新手区域使用更低的加成）
  const tierBonus = difficultyValue <= 10 
    ? NEWBIE_TIER_BONUS[enemyTier] 
    : TIER_BONUS[enemyTier];
  totalAttackBonus += tierBonus.attack;
  totalDefenseBonus += tierBonus.defense;
  totalHpBonus += tierBonus.hp;
  
  // 生成描述
  const parts: string[] = [];
  if (techniques.length > 0) {
    parts.push(`功法: ${techniques.map(t => t.nameTemplate).join('、')}`);
  }
  if (equipments.length > 0) {
    parts.push(`装备: ${equipments.map(e => e.nameTemplate).join('、')}`);
  }
  const description = parts.length > 0 ? parts.join(' | ') : '无特殊能力';
  
  return {
    techniques,
    equipments,
    totalAttackBonus,
    totalDefenseBonus,
    totalHpBonus,
    description,
  };
}

/**
 * 应用敌人增强到基础属性
 * 
 * @param baseHp 基础HP
 * @param baseAttack 基础攻击
 * @param baseDefense 基础防御
 * @param enhancement 增强配置
 * @returns 增强后的属性
 */
export function applyEnemyEnhancement(
  baseHp: number,
  baseAttack: number,
  baseDefense: number,
  enhancement: EnemyEnhancement
): { hp: number; attack: number; defense: number } {
  // 百分比加成是叠加的（与玩家相同）
  return {
    hp: Math.floor(baseHp * (1 + enhancement.totalHpBonus / 100)),
    attack: Math.floor(baseAttack * (1 + enhancement.totalAttackBonus / 100)),
    defense: Math.floor(baseDefense * (1 + enhancement.totalDefenseBonus / 100)),
  };
}

/**
 * 获取敌人增强简短描述（用于战斗日志）
 */
export function getEnemyEnhancementShortDesc(enhancement: EnemyEnhancement): string {
  if (enhancement.techniques.length === 0 && enhancement.equipments.length === 0) {
    return '';
  }
  
  const parts: string[] = [];
  if (enhancement.totalAttackBonus > 0) {
    parts.push(`攻击+${enhancement.totalAttackBonus}%`);
  }
  if (enhancement.totalDefenseBonus > 0) {
    parts.push(`防御+${enhancement.totalDefenseBonus}%`);
  }
  if (enhancement.totalHpBonus > 0) {
    parts.push(`气血+${enhancement.totalHpBonus}%`);
  }
  
  return parts.join(' ');
}
