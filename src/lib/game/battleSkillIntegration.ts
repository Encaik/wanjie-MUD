/**
 * 战斗技能集成
 * 
 * 获取战斗中可用的技能选项
 * 只返回已装备的技能
 */

import { Protagonist, Technique, Equipment } from './types';
import { TechniqueSkill, WeaponTechnique } from './skillTypes';
import { getEquippedSkills, getEquippedTechniques } from './skillEquipSystem';

// ============================================
// 类型定义
// ============================================

/** 战斗中可用的技能选项 */
export interface BattleSkillOption {
  /** 技能来源 */
  source: 'technique' | 'weapon';
  /** 来源物品ID */
  sourceId: string;
  /** 来源物品名称 */
  sourceName: string;
  /** 技能ID */
  skillId: string;
  /** 技能名称 */
  skillName: string;
  /** 技能描述 */
  description: string;
  /** 法力消耗 */
  mpCost: number;
  /** 当前冷却 */
  currentCooldown: number;
  /** 是否可用 */
  isAvailable: boolean;
  /** 不可用原因 */
  unavailableReason?: string;
  /** 预估伤害/效果 */
  estimatedEffect?: {
    damage?: number;
    heal?: number;
  };
  /** 元素属性 */
  element?: string;
  /** 技能标签 */
  tags?: string[];
}

// ============================================
// 核心函数
// ============================================

/**
 * 获取战斗中可用的所有技能选项
 * 只返回已装备的技能
 */
export function getAvailableBattleSkills(
  protagonist: Protagonist
): BattleSkillOption[] {
  const options: BattleSkillOption[] = [];
  
  // 从功法获取已装备的法技
  for (const technique of protagonist.techniques) {
    if (!technique || technique.isFragment) continue;
    
    // 获取已装备的技能
    const equippedSkills = getEquippedSkills(technique);
    
    for (const skill of equippedSkills) {
      // 双重检查：确保技能已解锁
      if (skill.unlockLevel > technique.level) continue;
      
      options.push({
        source: 'technique',
        sourceId: technique.id,
        sourceName: technique.name,
        skillId: skill.id,
        skillName: skill.name,
        description: skill.description,
        mpCost: skill.mpCost,
        currentCooldown: 0, // TODO: 从战斗状态获取
        isAvailable: protagonist.currentMp >= skill.mpCost,
        unavailableReason: protagonist.currentMp < skill.mpCost ? '法力不足' : undefined,
        element: technique.element,
        tags: skill.tags,
      });
    }
  }
  
  // 从武器获取已装备的斗技
  const weapons = [
    protagonist.equippedMelee,
    protagonist.equippedRanged,
  ].filter((w): w is Equipment => w !== null && !w.isFragment);
  
  for (const weapon of weapons) {
    // 获取已装备的技巧
    const equippedTechniques = getEquippedTechniques(weapon);
    
    for (const technique of equippedTechniques) {
      // 双重检查：确保技巧已解锁
      if (technique.unlockLevel > weapon.level) continue;
      
      options.push({
        source: 'weapon',
        sourceId: weapon.id,
        sourceName: weapon.name,
        skillId: technique.id,
        skillName: technique.name,
        description: technique.description,
        mpCost: 0, // 斗技通常不消耗法力
        currentCooldown: 0,
        isAvailable: true,
        element: weapon.element || undefined,
      });
    }
  }
  
  return options;
}

/**
 * 获取功法的战斗技能选项
 */
export function getTechniqueBattleSkills(
  technique: Technique,
  currentMp: number
): BattleSkillOption[] {
  if (!technique || technique.isFragment) return [];
  
  const equippedSkills = getEquippedSkills(technique);
  const options: BattleSkillOption[] = [];
  
  for (const skill of equippedSkills) {
    if (skill.unlockLevel > technique.level) continue;
    
    options.push({
      source: 'technique',
      sourceId: technique.id,
      sourceName: technique.name,
      skillId: skill.id,
      skillName: skill.name,
      description: skill.description,
      mpCost: skill.mpCost,
      currentCooldown: 0,
      isAvailable: currentMp >= skill.mpCost,
      unavailableReason: currentMp < skill.mpCost ? '法力不足' : undefined,
      element: technique.element,
      tags: skill.tags,
    });
  }
  
  return options;
}

/**
 * 获取武器的战斗技能选项
 */
export function getWeaponBattleSkills(
  weapon: Equipment | null
): BattleSkillOption[] {
  if (!weapon || weapon.isFragment) return [];
  
  const equippedTechniques = getEquippedTechniques(weapon);
  const options: BattleSkillOption[] = [];
  
  for (const technique of equippedTechniques) {
    if (technique.unlockLevel > weapon.level) continue;
    
    options.push({
      source: 'weapon',
      sourceId: weapon.id,
      sourceName: weapon.name,
      skillId: technique.id,
      skillName: technique.name,
      description: technique.description,
      mpCost: 0,
      currentCooldown: 0,
      isAvailable: true,
      element: weapon.element || undefined,
    });
  }
  
  return options;
}

// ============================================
// 技能效果计算
// ============================================

/**
 * 计算技能伤害
 */
export function calculateSkillDamage(
  skill: TechniqueSkill,
  technique: Technique,
  attackerPower: number
): number {
  // 基础伤害
  let damage = skill.effects
    .filter(e => e.type === 'damage')
    .reduce((sum, e) => sum + e.baseValue, 0);
  
  // 属性加成
  const scaling = skill.effects
    .filter(e => e.type === 'damage')
    .reduce((sum, e) => sum + e.statScaling, 0);
  
  damage += attackerPower * scaling;
  
  // 功法加成
  damage *= 1 + technique.bonus / 100;
  
  // 等级加成
  damage *= 1 + (technique.level - 1) * 0.1;
  
  return Math.floor(damage);
}

/**
 * 计算技巧效果
 */
export function calculateTechniqueEffect(
  technique: WeaponTechnique,
  weapon: Equipment
): { type: string; value: number }[] {
  return technique.effects.map(e => ({
    type: e.type,
    value: Math.floor(e.value * (1 + weapon.level * 0.05)),
  }));
}

// ============================================
// 技能使用检查
// ============================================

/**
 * 检查技能是否可用
 */
export function canUseSkill(
  skill: BattleSkillOption,
  currentMp: number,
  cooldowns: Map<string, number>
): { canUse: boolean; reason?: string } {
  // 法力检查
  if (skill.mpCost > currentMp) {
    return { canUse: false, reason: '法力不足' };
  }
  
  // 冷却检查
  const currentCooldown = cooldowns.get(skill.skillId) || 0;
  if (currentCooldown > 0) {
    return { canUse: false, reason: `冷却中（剩余${currentCooldown}回合）` };
  }
  
  return { canUse: true };
}

/**
 * 获取技能提示文本
 */
export function getSkillTooltip(skill: BattleSkillOption): string {
  const parts: string[] = [];
  
  parts.push(skill.description);
  
  if (skill.mpCost > 0) {
    parts.push(`法力消耗: ${skill.mpCost}`);
  }
  
  if (skill.currentCooldown > 0) {
    parts.push(`冷却: ${skill.currentCooldown}回合`);
  }
  
  if (skill.element) {
    parts.push(`元素: ${skill.element}`);
  }
  
  if (skill.tags && skill.tags.length > 0) {
    parts.push(`标签: ${skill.tags.join(', ')}`);
  }
  
  return parts.join('\n');
}
