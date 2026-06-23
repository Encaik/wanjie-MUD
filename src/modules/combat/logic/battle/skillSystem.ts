// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * 战斗技能系统
 * 
 * 职责：
 * 1. 从功法/装备生成战斗技能
 * 2. 管理技能冷却
 * 3. 执行技能效果
 * 4. 技能推荐算法
 */

import { Technique, Equipment, ItemRarity } from '@/core/types';

import { 
  BattleSkill, 
  BattleSkillType,
  StatBuff,
  SpecialEffectType,
  ExtendedBattleState,
  BattleActionResult,
  BattleAction,
  BATTLE_CONSTANTS,
} from './types';

// 导出类型
export type { BattleSkill, BattleSkillType };
import { clamp, clampNonNegative } from '@/shared/utils/numberUtils';

// ============================================
// 技能生成配置
// ============================================

/** 稀有度对技能的影响 */
const RARITY_SKILL_CONFIG: Record<ItemRarity, {
  damageBonus: number;
  cooldownReduction: number;
  specialChance: number;
}> = {
  '普通': { damageBonus: 0, cooldownReduction: 0, specialChance: 0 },
  '稀有': { damageBonus: 0.1, cooldownReduction: 0, specialChance: 0.1 },
  '史诗': { damageBonus: 0.2, cooldownReduction: 1, specialChance: 0.2 },
  '传说': { damageBonus: 0.3, cooldownReduction: 1, specialChance: 0.3 },
  '神话': { damageBonus: 0.5, cooldownReduction: 2, specialChance: 0.5 },
};

/** 功法类型对应技能类型 */
const TECHNIQUE_TO_SKILL_TYPE: Record<'attack' | 'defense', BattleSkillType> = {
  'attack': 'attack',
  'defense': 'defense',
};

// ============================================
// 技能生成函数
// ============================================

/**
 * 从功法技能（TechniqueSkill）生成战斗技能
 * 使用技能自身的属性（名称、MP消耗、冷却等）
 */
export function generateSkillFromTechniqueSkill(
  skill: TechniqueSkill,
  technique: Technique
): BattleSkill {
  // 技能效果计算
  const mainEffect = skill.effects[0];
  const effectType = mainEffect?.type || 'damage';
  
  // 伤害/治疗计算：基础值 + 属性加成 * 角色属性
  // 这里先使用基础值，实际战斗中会根据角色属性放大
  let damageMultiplier = 1.0;
  let healing = 0;
  let healingPercent = 0;
  
  if (effectType === 'damage') {
    // 伤害倍率 = 基础倍率 + 威力/100
    damageMultiplier = 1.0 + (mainEffect.baseValue / 100);
  } else if (effectType === 'heal') {
    healing = mainEffect.baseValue;
    healingPercent = mainEffect.statScaling;
  }
  
  // 生成描述
  let description = '';
  if (effectType === 'damage') {
    description = `消耗${skill.mpCost}法力，造成${Math.round(damageMultiplier * 100)}%伤害`;
    if (skill.tags.includes('aoe')) description += '（范围）';
    if (skill.tags.includes('execute')) description += '（斩杀）';
  } else if (effectType === 'heal') {
    description = `消耗${skill.mpCost}法力，恢复${healing}生命`;
    if (skill.tags.includes('hot')) description += '（持续治疗）';
  }
  
  // 构建战斗技能
  const battleSkill: BattleSkill = {
    id: `skill_${technique.id}_${skill.id}`,
    name: skill.name,
    description,
    type: effectType === 'damage' ? 'attack' : effectType === 'heal' ? 'defense' : 'special',
    mpCost: skill.mpCost,
    cooldown: skill.cooldown,
    effect: {
      damageMultiplier: effectType === 'damage' ? damageMultiplier : undefined,
      healing: effectType === 'heal' ? healing : undefined,
      healingPercent: effectType === 'heal' ? healingPercent : undefined,
    },
    element: technique.element,
    weaponCategory: technique.compatibleWeapon,
    techniqueId: technique.id,
    source: 'technique',
    skillCategory: 'technique', // 法技分类
  };
  
  return battleSkill;
}

/**
 * 从已装备的功法批量生成战斗技能
 * 使用已装备槽位中的技能
 */
export function generateSkillsFromEquippedTechniques(
  techniques: (Technique | null)[]
): BattleSkill[] {
  const battleSkills: BattleSkill[] = [];
  
  techniques.forEach(technique => {
    if (!technique || technique.isFragment) return;
    
    // 从装备的技能槽位获取技能ID
    technique.equippedSkills.forEach(skillId => {
      if (!skillId) return;
      
      // 从 allSkills 中找到对应的技能
      const skill = technique.allSkills?.find(s => s.id === skillId);
      if (!skill) return;
      
      // 检查技能是否解锁
      if (skill.unlockLevel > technique.level) return;
      
      // 生成战斗技能
      const battleSkill = generateSkillFromTechniqueSkill(skill, technique);
      battleSkills.push(battleSkill);
    });
  });
  
  return battleSkills;
}

/**
 * 从功法生成战斗技能（根据功法属性计算）
 */
export function generateSkillFromTechnique(technique: Technique): BattleSkill {
  const config = RARITY_SKILL_CONFIG[technique.rarity];
  const skillType = TECHNIQUE_TO_SKILL_TYPE[technique.type];
  
  // 计算基础伤害倍率
  const baseMultiplier = 1 + (technique.power / 100) * (1 + technique.bonus / 100);
  const finalMultiplier = baseMultiplier * (1 + config.damageBonus);
  
  // 计算冷却时间
  const mpCost = technique.mpCost ?? technique.baseMpCost ?? 10;
  const baseCooldown = Math.max(1, Math.floor(mpCost / 20));
  const finalCooldown = Math.max(0, baseCooldown - config.cooldownReduction);
  
  const description = `法技：消耗${mpCost}法力，造成${Math.round(finalMultiplier * 100)}%伤害`;
  
  return {
    id: `skill_${technique.id}`,
    name: technique.name,
    description,
    type: skillType,
    mpCost: mpCost,
    cooldown: finalCooldown,
    effect: {
      damageMultiplier: skillType === 'attack' ? finalMultiplier : undefined,
      healing: skillType === 'defense' ? Math.floor(technique.power * 0.5) : undefined,
      healingPercent: skillType === 'defense' ? technique.bonus / 100 : undefined,
    },
    element: technique.element,
    weaponCategory: technique.compatibleWeapon,
    techniqueId: technique.id,
    source: 'technique',
    skillCategory: 'technique',
  };
}

/**
 * 批量生成技能
 */
export function generateSkillsFromTechniques(techniques: (Technique | null)[]): BattleSkill[] {
  return techniques
    .filter((t): t is Technique => t !== null)
    .map(generateSkillFromTechnique);
}

/**
 * 从武器技巧（WeaponTechnique）生成战斗技能
 * 使用技巧自身的属性（名称、冷却等）
 */
export function generateBattleSkillFromWeaponTechnique(
  technique: WeaponTechnique,
  equipment: Equipment
): BattleSkill {
  // 技巧效果计算
  const mainEffect = technique.effects[0];
  
  // 伤害倍率计算
  let damageMultiplier = 1.5; // 基础斗技伤害
  
  // 稀有度加成
  const rarityMultiplier: Record<ItemRarity, number> = {
    '普通': 1.0,
    '稀有': 1.1,
    '史诗': 1.2,
    '传说': 1.3,
    '神话': 1.5,
  };
  damageMultiplier *= rarityMultiplier[equipment.rarity] || 1.0;
  
  // 效果类型加成
  if (mainEffect?.type === 'damage_bonus') {
    damageMultiplier += mainEffect.value / 100;
  } else if (mainEffect?.type === 'crit_bonus') {
    damageMultiplier *= (1 + mainEffect.value / 200);
  } else if (mainEffect?.type === 'element_damage') {
    damageMultiplier += mainEffect.value / 100;
  }
  
  // 冷却时间：斗技冷却较长，避免连续使用同一技能
  const baseCooldown = technique.trigger.cooldown || 3; // 默认3回合
  const cooldown = Math.max(2, baseCooldown); // 至少2回合冷却
  
  // 生成描述
  let description = '斗技：无消耗，';
  if (mainEffect?.type === 'damage_bonus') {
    description += `造成${Math.round(damageMultiplier * 100)}%伤害`;
  } else if (mainEffect?.type === 'crit_bonus') {
    description += `暴击伤害+${mainEffect.value}%`;
  } else if (mainEffect?.type === 'lifesteal') {
    description += `造成${Math.round(damageMultiplier * 100)}%伤害，吸血${mainEffect.value}%`;
  } else if (mainEffect?.type === 'element_damage') {
    description += `附加元素伤害${mainEffect.value}`;
  } else {
    description += `造成${Math.round(damageMultiplier * 100)}%伤害`;
  }
  
  // 构建战斗技能
  const battleSkill: BattleSkill = {
    id: `combat_${equipment.id}_${technique.id}`,
    name: technique.name,
    description,
    type: 'attack',
    mpCost: 0, // 斗技无MP消耗
    cooldown: cooldown,
    effect: {
      damageMultiplier,
    },
    element: equipment.element,
    weaponCategory: equipment.weaponCategory,
    equipmentId: equipment.id,
    source: 'equipment',
    skillCategory: 'combat', // 斗技分类
  };
  
  // 添加特殊效果
  if (mainEffect?.type === 'lifesteal') {
    battleSkill.effect.special = { type: 'life_steal', percent: mainEffect.value };
  }
  
  return battleSkill;
}

/**
 * 从已装备的武器批量生成斗技
 * 使用已装备槽位中的技巧
 */
export function generateCombatSkillsFromEquippedWeapons(
  weapons: (Equipment | null)[]
): BattleSkill[] {
  const battleSkills: BattleSkill[] = [];
  
  weapons.forEach(equipment => {
    if (!equipment || equipment.isFragment) return;
    if (equipment.slot !== 'melee' && equipment.slot !== 'ranged') return;
    
    // 从装备的技巧槽位获取技巧ID
    equipment.equippedTechniques.forEach(techniqueId => {
      if (!techniqueId) return;
      
      // 从 allTechniques 中找到对应的技巧
      const technique = equipment.allTechniques?.find(t => t.id === techniqueId);
      if (!technique) return;
      
      // 检查技巧是否解锁
      if (technique.unlockLevel > equipment.level) return;
      
      // 生成战斗技能
      const battleSkill = generateBattleSkillFromWeaponTechnique(technique, equipment);
      battleSkills.push(battleSkill);
    });
  });
  
  return battleSkills;
}

/**
 * 从装备生成斗技（根据装备属性计算）
 */
export function generateCombatTechniqueFromEquipment(equipment: Equipment): BattleSkill | null {
  // 只有武器才能生成斗技
  if (equipment.slot !== 'melee' && equipment.slot !== 'ranged') {
    return null;
  }
  
  // 生成斗技伤害倍率：基于武器等级和品质
  const rarityMultiplier: Record<ItemRarity, number> = {
    '普通': 1.3,
    '稀有': 1.5,
    '史诗': 1.7,
    '传说': 2.0,
    '神话': 2.3,
  };
  const damageMultiplier = rarityMultiplier[equipment.rarity] || 1.5;
  
  // 计算冷却：斗技冷却时间较长，基于品质调整
  // 稀有度越高冷却越短，但最少2回合
  const cooldownByRarity: Record<ItemRarity, number> = {
    '普通': 4,
    '稀有': 3,
    '史诗': 3,
    '传说': 2,
    '神话': 2,
  };
  const cooldown = cooldownByRarity[equipment.rarity] || 3;
  
  // 斗技名称
  const weaponTypeName = equipment.weaponCategory === 'sword' ? '剑诀' :
                        equipment.weaponCategory === 'blade' ? '刀法' :
                        equipment.weaponCategory === 'fist' ? '拳法' :
                        equipment.weaponCategory === 'bow' ? '弓术' :
                        equipment.weaponCategory === 'spear' ? '枪术' :
                        '武技';
  
  return {
    id: `combat_${equipment.id}`,
    name: `${equipment.name}${weaponTypeName}`,
    description: `斗技：无消耗，造成${Math.round(damageMultiplier * 100)}%伤害`,
    type: 'attack',
    mpCost: 0, // 斗技无MP消耗
    cooldown: cooldown,
    effect: {
      damageMultiplier,
    },
    element: equipment.element,
    weaponCategory: equipment.weaponCategory,
    equipmentId: equipment.id,
    source: 'equipment',
    skillCategory: 'combat', // 斗技分类
  };
}

/**
 * 批量生成斗技
 */
export function generateCombatTechniquesFromEquipments(equipments: (Equipment | null)[]): BattleSkill[] {
  return equipments
    .filter((e): e is Equipment => e !== null && (e.slot === 'melee' || e.slot === 'ranged'))
    .map(generateCombatTechniqueFromEquipment)
    .filter((s): s is BattleSkill => s !== null);
}

// ============================================
// 技能描述生成
// ============================================

function generateSkillDescription(
  type: BattleSkillType,
  multiplier: number,
  mpCost: number
): string {
  const percentDamage = Math.round(multiplier * 100);
  
  if (type === 'attack') {
    return `消耗${mpCost}法力，造成${percentDamage}%伤害`;
  } else {
    return `消耗${mpCost}法力，防御并恢复生命`;
  }
}

/**
 * 生成随机特殊效果
 *
 * @param rarity - 物品稀有度
 * @param rng - 可选随机数生成器，默认使用 Math.random
 */
function generateRandomSpecialEffect(
  rarity: ItemRarity,
  rng: () => number = Math.random
): SpecialEffectType | undefined {
  const effects: Array<{ type: SpecialEffectType['type']; weight: number; value: number }> = [
    { type: 'life_steal', weight: 3, value: rarity === '传说' ? 20 : 10 },
    { type: 'ignore_defense', weight: 2, value: rarity === '传说' ? 30 : 15 },
    { type: 'multi_hit', weight: 2, value: 2 },
    { type: 'stun', weight: 1, value: 1 },
    { type: 'shield', weight: 2, value: rarity === '传说' ? 100 : 50 },
  ];

  const totalWeight = effects.reduce((sum, e) => sum + e.weight, 0);
  let random = rng() * totalWeight;

  for (const effect of effects) {
    random -= effect.weight;
    if (random <= 0) {
      switch (effect.type) {
        case 'life_steal':
          return { type: 'life_steal', percent: effect.value };
        case 'ignore_defense':
          return { type: 'ignore_defense', percent: effect.value };
        case 'multi_hit':
          return { type: 'multi_hit', count: effect.value };
        case 'stun':
          return { type: 'stun', rounds: effect.value };
        case 'shield':
          return { type: 'shield', amount: effect.value };
      }
    }
  }

  return undefined;
}

// ============================================
// 技能冷却管理
// ============================================

/**
 * 更新技能冷却
 */
export function updateSkillCooldowns(state: ExtendedBattleState): void {
  const newCooldowns = new Map<string, number>();
  
  state.skillCooldowns.forEach((remaining, skillId) => {
    if (remaining > 0) {
      newCooldowns.set(skillId, remaining - 1);
    }
  });
  
  state.skillCooldowns = newCooldowns;
}

/**
 * 设置技能冷却
 */
export function setSkillCooldown(state: ExtendedBattleState, skillId: string, cooldown: number): void {
  state.skillCooldowns.set(skillId, Math.max(0, cooldown));
}

/**
 * 检查技能是否可用
 * 法技需要检查MP，斗技只需要检查CD
 */
export function isSkillUsable(
  skill: BattleSkill,
  state: ExtendedBattleState
): { usable: boolean; reason?: string } {
  // 法技（technique）检查MP，斗技（combat）不检查MP
  if (skill.skillCategory === 'technique' && skill.mpCost > 0) {
    if (state.playerCurrentMp < skill.mpCost) {
      return { usable: false, reason: '法力不足' };
    }
  }
  
  // 检查冷却（所有技能都需要检查）
  const cooldown = state.skillCooldowns.get(skill.id) || 0;
  if (cooldown > 0) {
    return { usable: false, reason: `冷却中(${cooldown}回合)` };
  }
  
  // 检查需求条件
  if (skill.requirements) {
    if (skill.requirements.minHpPercent) {
      const hpPercent = state.playerCurrentHp / state.playerMaxHp;
      if (hpPercent < skill.requirements.minHpPercent) {
        return { usable: false, reason: `生命值不足${Math.round(skill.requirements.minHpPercent * 100)}%` };
      }
    }
    
    if (skill.requirements.minMp && state.playerCurrentMp < skill.requirements.minMp) {
      return { usable: false, reason: `法力不足${skill.requirements.minMp}` };
    }
    
    if (skill.requirements.minLevel && state.playerLevel < skill.requirements.minLevel) {
      return { usable: false, reason: `等级不足${skill.requirements.minLevel}` };
    }
  }
  
  return { usable: true };
}

// ============================================
// 技能推荐算法
// ============================================

/**
 * 判断技能是否推荐使用
 * 
 * 推荐逻辑：
 * 1. 克制敌人属性 -> 强烈推荐
 * 2. 低血量时防御技能 -> 推荐
 * 3. 敌人高血量时高伤害技能 -> 推荐
 * 4. 法技在MP充足时优先推荐（MP > 30%）
 */
export function isSkillRecommended(
  skill: BattleSkill,
  state: ExtendedBattleState
): { recommended: boolean; reason?: string } {
  const { enemyAttributes, playerCurrentHp, playerMaxHp, enemyCurrentHp, enemyMaxHp, playerCurrentMp, playerMaxMp } = state;
  
  // 1. 克制关系推荐
  if (skill.element && enemyAttributes.element) {
    const multiplier = getElementMultiplier(skill.element, enemyAttributes.element);
    if (multiplier > 1.1) {
      return { recommended: true, reason: '克制敌人' };
    }
  }
  
  // 2. 低血量时防御技能推荐
  const hpPercent = playerCurrentHp / playerMaxHp;
  if (hpPercent < BATTLE_CONSTANTS.LOW_HP_THRESHOLD && skill.type === 'defense') {
    return { recommended: true, reason: '生命危急' };
  }
  
  // 3. 敌人高血量时高伤害技能推荐
  const enemyHpPercent = enemyCurrentHp / enemyMaxHp;
  if (enemyHpPercent > 0.5 && skill.type === 'attack' && (skill.effect.damageMultiplier || 0) > 1.3) {
    return { recommended: true, reason: '高伤害' };
  }
  
  // 4. 法技在MP充足时推荐（优先使用法技）
  if (skill.skillCategory === 'technique' && skill.mpCost > 0) {
    const mpPercent = playerCurrentMp / playerMaxMp;
    // MP超过40%时，推荐使用法技
    if (mpPercent > 0.4 && playerCurrentMp >= skill.mpCost) {
      return { recommended: true, reason: '法力充足' };
    }
  }
  
  return { recommended: false };
}

/**
 * 获取元素克制倍率
 */
function getElementMultiplier(attacker: string, defender: string): number {
  const counterMap: Record<string, string> = {
    fire: 'ice',
    ice: 'thunder',
    thunder: 'wind',
    wind: 'earth',
    earth: 'fire',
  };
  
  // 光暗互克
  if ((attacker === 'light' && defender === 'dark') ||
      (attacker === 'dark' && defender === 'light')) {
    return 1.2;
  }
  
  // 普通克制
  if (counterMap[attacker] === defender) {
    return 1.25;
  }
  if (counterMap[defender] === attacker) {
    return 0.85;
  }
  
  return 1.0;
}

// ============================================
// 技能效果计算
// ============================================

/**
 * 计算技能伤害
 *
 * 设计原则：
 * 1. 技能伤害基于基础攻击力和技能倍率
 * 2. 所有技能伤害都有随机浮动（±20%）
 * 3. 强力技能浮动更大（±25%）
 * 4. Buff加成在浮动前计算
 *
 * @param skill - 使用的战斗技能
 * @param baseAttack - 基础攻击力
 * @param state - 扩展战斗状态
 * @param rng - 可选随机数生成器，默认使用 Math.random
 */
export function calculateSkillDamage(
  skill: BattleSkill,
  baseAttack: number,
  state: ExtendedBattleState,
  rng: () => number = Math.random
): number {
  let damage = baseAttack;
  
  // 应用技能倍率
  if (skill.effect.damageMultiplier) {
    damage *= skill.effect.damageMultiplier;
  }
  
  // 应用Buff
  state.playerBuffs.forEach(buff => {
    if (buff.stat === 'attack' || buff.stat === 'all') {
      if (buff.percent) {
        damage *= (1 + buff.percent);
      } else {
        damage += buff.value;
      }
    }
  });
  
  // 应用特殊效果
  if (skill.effect.special?.type === 'multi_hit') {
    // 多段攻击：每段伤害降低，但总伤害更高
    damage *= (0.7 + 0.1 * skill.effect.special.count);
  }
  
  // 应用随机浮动 - 关键修改！
  // 判断是否为强力技能（倍率>2.0的技能视为强力技能）
  const isPowerfulSkill = (skill.effect.damageMultiplier || 1) > 2.0;
  const variance = isPowerfulSkill ? 0.25 : 0.20; // 强力技能±25%，普通技能±20%
  
  // 浮动范围：1 - variance 到 1 + variance
  const minMultiplier = Math.max(0.5, 1 - variance);
  const maxMultiplier = Math.min(2.0, 1 + variance);
  const randomMultiplier = minMultiplier + rng() * (maxMultiplier - minMultiplier);
  
  damage = Math.floor(damage * randomMultiplier);
  
  // 确保伤害至少为1
  return Math.max(1, damage);
}

/**
 * 获取技能额外信息
 */
export function getSkillExtraInfo(skill: BattleSkill): {
  damage?: string;
  healing?: string;
  special?: string;
} {
  const info: { damage?: string; healing?: string; special?: string } = {};
  
  if (skill.effect.damageMultiplier) {
    info.damage = `${Math.round(skill.effect.damageMultiplier * 100)}%伤害`;
  }
  
  if (skill.effect.healing) {
    info.healing = `恢复${skill.effect.healing}HP`;
  }
  if (skill.effect.healingPercent) {
    info.healing = `恢复${Math.round(skill.effect.healingPercent * 100)}%HP`;
  }
  
  if (skill.effect.special) {
    switch (skill.effect.special.type) {
      case 'life_steal':
        info.special = `吸血${skill.effect.special.percent}%`;
        break;
      case 'ignore_defense':
        info.special = `无视${skill.effect.special.percent}%防御`;
        break;
      case 'multi_hit':
        info.special = `${skill.effect.special.count}连击`;
        break;
      case 'stun':
        info.special = `眩晕${skill.effect.special.rounds}回合`;
        break;
      case 'shield':
        info.special = `护盾${skill.effect.special.amount}`;
        break;
    }
  }
  
  return info;
}

// ============================================
// 内置技能
// ============================================

/** 获取基础攻击技能 */
export function getBasicAttackSkill(): BattleSkill {
  return {
    id: 'basic_attack',
    name: '普通攻击',
    description: '使用武器进行普通攻击，无消耗',
    type: 'attack',
    mpCost: 0,
    cooldown: 0,
    effect: {
      damageMultiplier: 1.0,
    },
    source: 'innate',
    skillCategory: 'technique', // 作为默认分类
  };
}

/** 获取防御技能 */
export function getDefendSkill(): BattleSkill {
  return {
    id: 'basic_defend',
    name: '防御',
    description: `进入防御姿态，受到伤害减少${BATTLE_CONSTANTS.DEFEND_DAMAGE_REDUCTION * 100}%，恢复${BATTLE_CONSTANTS.DEFEND_MP_RECOVERY}点法力`,
    type: 'defense',
    mpCost: 0,
    cooldown: 0,
    effect: {
      healing: BATTLE_CONSTANTS.DEFEND_MP_RECOVERY,
    },
    source: 'innate',
    skillCategory: 'technique', // 作为默认分类
  };
}

/** 获取逃跑技能 */
export function getFleeSkill(): BattleSkill {
  return {
    id: 'basic_flee',
    name: '逃跑',
    description: '尝试逃离战斗，成功率和等级差相关',
    type: 'special',
    mpCost: 0,
    cooldown: 0,
    effect: {},
    source: 'innate',
    skillCategory: 'technique', // 作为默认分类
  };
}
