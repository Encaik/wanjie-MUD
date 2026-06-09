/**
 * 战斗决策系统
 * 
 * 职责：
 * 1. 生成可用决策选项
 * 2. 验证决策合法性
 * 3. 执行玩家决策
 * 4. 敌人AI决策
 * 5. 支持多敌人回合
 */

import { 
  BattleSkill,
  isSkillUsable, 
  isSkillRecommended, 
  getSkillExtraInfo,
  calculateSkillDamage,
} from './skillSystem';
import { 
  BattleAction, 
  BattleActionType,
  BattleActionResult,
  DecisionOption,
  DecisionContext,
  ExtendedBattleState,
  TurnResult,
  BattleStatistics,
  BATTLE_CONSTANTS,
  BattleActionRecord,
  StatBuff,
  BattlePhase,
} from './types';
import { calculateDamage, calculateCritRate, COMBAT_CONFIG } from '@/modules/progression/logic/balanceConfig';
import { 
  calculateRestraintResult, 
  formatRestraintDescription,
  EnemyAttributes,
  getDefenseAttributes,
} from '@/modules/combat/logic/restraintSystem';
import { InventoryItem, EnemyTier } from '@/shared/lib/types';
import {
  BattleEnemy,
  TurnOrderEntry,
  getAliveEnemies,
  getAliveEnemyCount,
  areAllEnemiesDefeated,
  getEnemyTotalAttack,
  getEnemyTotalDefense,
  updateEnemySkillCooldowns,
  updateEnemyBuffs,
  applyDamageToEnemy,
  applyHealToEnemy,
} from './enemyState';
import { clamp, clampNonNegative, applyDamage, applyHeal } from '@/shared/utils/numberUtils';

import type { BattleSkillType } from './types';

// ============================================
// 决策选项生成
// ============================================

/**
 * 获取所有可用决策选项
 */
export function getAvailableDecisions(context: DecisionContext): DecisionOption[] {
  const { state } = context;
  const options: DecisionOption[] = [];
  
  // 1. 普通攻击 - 始终可用
  options.push({
    action: { type: 'normal_attack' },
    label: '攻击',
    description: '使用武器进行普通攻击',
    disabled: false,
    icon: '⚔️',
    extraInfo: {
      damage: `~${state.playerAttack}`,
    },
  });
  
  // 2. 功法技能
  const skillOptions = generateSkillOptions(state);
  options.push(...skillOptions);
  
  // 3. 使用物品
  const itemOptions = generateItemOptions(state);
  options.push(...itemOptions);
  
  // 4. 防御
  options.push({
    action: { type: 'defend' },
    label: '防御',
    description: `减少${BATTLE_CONSTANTS.DEFEND_DAMAGE_REDUCTION * 100}%受到的伤害，恢复${BATTLE_CONSTANTS.DEFEND_MP_RECOVERY}点法力`,
    disabled: false,
    icon: '🛡️',
    extraInfo: {
      healing: `+${BATTLE_CONSTANTS.DEFEND_MP_RECOVERY}MP`,
    },
  });
  
  // 5. 逃跑 - Boss战不可用
  const canFlee = state.battleConfig.canFlee && 
    state.enemyTier !== 'boss' && 
    state.battleConfig.battleType !== 'weekly_boss';
  
  const fleeRate = canFlee ? calculateFleeRate(state) : 0;
  
  options.push({
    action: { type: 'flee' },
    label: '逃跑',
    description: canFlee 
      ? `有${Math.round(fleeRate * 100)}%概率逃离战斗`
      : 'Boss战中无法逃跑',
    disabled: !canFlee,
    disabledReason: !canFlee ? 'Boss战无法逃跑' : undefined,
    icon: '🏃',
  });
  
  return options;
}

/**
 * 生成功法和斗技选项
 */
function generateSkillOptions(state: ExtendedBattleState): DecisionOption[] {
  const options: DecisionOption[] = [];
  
  // 分，法技和斗技
  const techniqueSkills = state.availableSkills.filter(s => s.skillCategory === 'technique');
  const combatTechniques = state.availableSkills.filter(s => s.skillCategory === 'combat');
  
  // 法技（来自功法，消耗MP）
  if (techniqueSkills.length > 0) {
    techniqueSkills.forEach(skill => {
      const usableCheck = isSkillUsable(skill, state);
      const recommended = isSkillRecommended(skill, state);
      const extraInfo = getSkillExtraInfo(skill);
      
      options.push({
        action: { type: 'technique_attack', techniqueSkillId: skill.id } as BattleAction,
        label: skill.name,
        description: skill.description,
        disabled: !usableCheck.usable,
        disabledReason: usableCheck.reason,
        recommended: recommended.recommended,
        recommendedReason: recommended.reason,
        icon: '✨',
        extraInfo: {
          mpCost: skill.mpCost,
          cooldown: state.skillCooldowns.get(skill.id) || 0,
        },
      });
    });
  }
  
  // 斗技（来自武器，无MP消耗）
  if (combatTechniques.length > 0) {
    combatTechniques.forEach(skill => {
      const usableCheck = isCombatTechniqueUsable(skill, state);
      const recommended = isCombatTechniqueRecommended(skill, state);
      const extraInfo = getSkillExtraInfo(skill);
      
      options.push({
        action: { type: 'combat_technique', combatTechniqueId: skill.id } as BattleAction,
        label: skill.name,
        description: skill.description,
        disabled: !usableCheck.usable,
        disabledReason: usableCheck.reason,
        recommended: recommended.recommended,
        recommendedReason: recommended.reason,
        icon: '⚔️',
        extraInfo: {
          cooldown: state.skillCooldowns.get(skill.id) || 0,
        },
      });
    });
  }
  
  return options;
}

/**
 * 检查斗技是否可用
 */
function isCombatTechniqueUsable(
  skill: BattleSkill,
  state: ExtendedBattleState
): { usable: boolean; reason?: string } {
  // 斗技不消耗MP，只检查冷却
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
    if (skill.requirements.minLevel && state.playerLevel < skill.requirements.minLevel) {
      return { usable: false, reason: `等级不足${skill.requirements.minLevel}` };
    }
  }
  
  return { usable: true };
}

/**
 * 判断斗技是否推荐使用
 */
function isCombatTechniqueRecommended(
  skill: BattleSkill,
  state: ExtendedBattleState
): { recommended: boolean; reason?: string } {
  const { enemyAttributes, enemyCurrentHp, enemyMaxHp } = state;
  
  // 克制关系推荐
  if (skill.element && enemyAttributes.element) {
    const multiplier = getElementMultiplier(skill.element, enemyAttributes.element);
    if (multiplier > 1.1) {
      return { recommended: true, reason: '克制敌人' };
    }
  }
  
  // 敌人高血量时高伤害斗技推荐
  const enemyHpPercent = enemyCurrentHp / enemyMaxHp;
  if (enemyHpPercent > 0.5 && skill.type === 'attack' && (skill.effect.damageMultiplier || 0) > 1.3) {
    return { recommended: true, reason: '高伤害' };
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
  
  if ((attacker === 'light' && defender === 'dark') ||
      (attacker === 'dark' && defender === 'light')) {
    return 1.2;
  }
  
  if (counterMap[attacker] === defender) {
    return 1.25;
  }
  if (counterMap[defender] === attacker) {
    return 0.85;
  }
  
  return 1.0;
}

/**
 * 生成物品使用选项
 */
function generateItemOptions(state: ExtendedBattleState): DecisionOption[] {
  // 筛选可在战斗中使用的物品，并排除冷却中的物品
  const usableItems = state.availableItems.filter(item => {
    // 检查物品是否在冷却中
    const cooldown = state.itemCooldowns.get(item.definition.id) || 0;
    if (cooldown > 0) return false;
    
    return item.definition.effects?.some(e =>
      ['restore_hp', 'restore_mp', 'stat_boost', 'combat_boost'].includes(e.type)
    );
  });
  
  return usableItems.map(item => {
    const effectDesc = getItemEffectDescription(item);
    const healingEffect = item.definition.effects?.find(e => e.type === 'restore_hp');
    
    return {
      action: { type: 'use_item', itemId: item.id } as BattleAction,
      label: item.definition.name,
      description: effectDesc,
      disabled: item.quantity <= 0,
      disabledReason: item.quantity <= 0 ? '数量不足' : undefined,
      icon: '🧪',
    };
  });
}

/**
 * 获取物品效果描述
 */
function getItemEffectDescription(item: InventoryItem): string {
  const effects = item.definition.effects || [];
  const parts: string[] = [];
  
  effects.forEach(effect => {
    switch (effect.type) {
      case 'restore_hp':
        parts.push(`恢复${effect.value}HP`);
        break;
      case 'restore_mp':
        parts.push(`恢复${effect.value}MP`);
        break;
      case 'stat_boost':
        parts.push(effect.description);
        break;
      case 'combat_boost':
        parts.push(`战斗增益+${effect.value}%`);
        break;
    }
  });
  
  return parts.join('，') || '无效果';
}

// ============================================
// 决策执行
// ============================================

/**
 * 执行玩家行动
 */
export function executePlayerAction(
  action: BattleAction,
  state: ExtendedBattleState,
  rng: () => number = Math.random
): BattleActionResult {
  switch (action.type) {
    case 'normal_attack':
      return executeNormalAttack(state, rng);

    case 'technique_attack':
      return executeTechniqueAttack(action.techniqueSkillId!, state);

    case 'combat_technique':
      return executeCombatTechnique(action.combatTechniqueId!, state, rng);

    case 'defend':
      return executeDefend(state);

    case 'use_item':
      return executeUseItem(action.itemId!, state);

    case 'flee':
      return executeFlee(state, rng);
    
    default:
      return {
        action,
        success: false,
        message: '未知行动类型',
        failReason: 'invalid_action',
      };
  }
}

/**
 * 执行普通攻击
 */
function executeNormalAttack(state: ExtendedBattleState, rng: () => number = Math.random): BattleActionResult {
  const { playerAttack, playerLuck, playerLevel, playerDefense, enemyLevel } = state;
  
  // ============================================
  // 多敌人系统：获取目标敌人
  // ============================================
  let targetEnemy: BattleEnemy | null = null;
  let targetIndex = state.selectedEnemyIndex;
  
  // 优先使用多敌人系统
  if (state.enemies.length > 0) {
    const aliveEnemies = getAliveEnemies(state.enemies);
    if (aliveEnemies.length > 0) {
      // 确保选中的敌人索引有效
      if (targetIndex >= state.enemies.length || !state.enemies[targetIndex]?.isAlive) {
        targetIndex = state.enemies.findIndex(e => e.isAlive);
        state.selectedEnemyIndex = targetIndex;
      }
      targetEnemy = state.enemies[targetIndex];
    }
  }
  
  // 获取目标防御力
  const enemyDefense = targetEnemy ? getEnemyTotalDefense(targetEnemy) : state.enemyDefense;
  const enemyAttributes = targetEnemy?.attributes || state.enemyAttributes;
  
  // 计算暴击
  const critRate = calculateCritRate(playerLuck);
  const isCrit = rng() < critRate;
  
  // 计算伤害
  const levelDiff = playerLevel - (targetEnemy?.level || enemyLevel);
  let damage = calculateDamage(playerAttack, enemyDefense, levelDiff);
  
  // 暴击加成
  if (isCrit) {
    damage = Math.floor(damage * BATTLE_CONSTANTS.CRIT_DAMAGE_MULTIPLIER);
  }
  
  // 计算克制关系（普通攻击使用武器属性）
  const playerWeaponAttrs = {
    element: null as any,
    weaponCategory: null as any,
  };
  
  const restraint = calculateRestraintResult(
    playerWeaponAttrs.element,
    enemyAttributes.element,
    playerWeaponAttrs.weaponCategory,
    enemyAttributes.weaponCategory
  );
  
  // 应用克制效果
  damage = Math.floor(damage * restraint.damageMultiplier);
  
  // 伤害上下界约束
  const targetMaxHp = targetEnemy?.maxHp || state.enemyMaxHp;
  const maxDamage = Math.floor(targetMaxHp * BATTLE_CONSTANTS.MAX_DAMAGE_RATIO);
  const minDamage = Math.floor(playerAttack * BATTLE_CONSTANTS.MIN_DAMAGE_RATIO);
  damage = clamp(damage, minDamage, maxDamage);
  
  // 应用伤害
  if (targetEnemy) {
    applyDamageToEnemy(targetEnemy, damage);
    // 同步更新向后兼容字段
    state.enemyCurrentHp = targetEnemy.currentHp;
  } else {
    state.enemyCurrentHp = applyDamage(state.enemyCurrentHp, damage, state.enemyMaxHp);
  }
  
  // 构建结果
  const enemyName = targetEnemy?.name || state.enemyName;
  let message = isCrit ? '你发动暴击攻击！' : '你发动攻击';
  if (restraint.restraintType !== 'neutral') {
    message += ` ${formatRestraintDescription(restraint, '你', enemyName)}`;
  }
  message += `，对${enemyName}造成${damage}点伤害。`;
  
  return {
    action: { type: 'normal_attack' },
    success: true,
    damage,
    message,
    critical: isCrit,
    restraint,
  };
}

/**
 * 执行法技（功法技能：消耗MP，高伤害）
 */
function executeTechniqueAttack(skillId: string, state: ExtendedBattleState): BattleActionResult {
  const skill = state.availableSkills.find(s => s.id === skillId);
  
  if (!skill) {
    return {
      action: { type: 'technique_attack', techniqueSkillId: skillId },
      success: false,
      message: '法技不存在',
      failReason: 'skill_not_found',
    };
  }
  
  // 检查可用性
  const usableCheck = isSkillUsable(skill, state);
  if (!usableCheck.usable) {
    return {
      action: { type: 'technique_attack', techniqueSkillId: skillId },
      success: false,
      message: usableCheck.reason || '无法使用',
      failReason: 'skill_unusable',
    };
  }
  
  // 消耗MP
  state.playerCurrentMp = Math.max(0, state.playerCurrentMp - skill.mpCost);
  
  // 设置冷却
  if (skill.cooldown > 0) {
    state.skillCooldowns.set(skill.id, skill.cooldown + 1);
  }
  
  // ============================================
  // 多敌人系统：获取目标敌人
  // ============================================
  let targetEnemy: BattleEnemy | null = null;
  let targetIndex = state.selectedEnemyIndex;
  
  if (state.enemies.length > 0) {
    const aliveEnemies = getAliveEnemies(state.enemies);
    if (aliveEnemies.length > 0) {
      if (targetIndex >= state.enemies.length || !state.enemies[targetIndex]?.isAlive) {
        targetIndex = state.enemies.findIndex(e => e.isAlive);
        state.selectedEnemyIndex = targetIndex;
      }
      targetEnemy = state.enemies[targetIndex];
    }
  }
  
  const enemyAttributes = targetEnemy?.attributes || state.enemyAttributes;
  const targetMaxHp = targetEnemy?.maxHp || state.enemyMaxHp;
  const enemyDefense = targetEnemy ? getEnemyTotalDefense(targetEnemy) : state.enemyDefense;
  
  // 计算伤害
  const baseDamage = calculateSkillDamage(skill, state.playerAttack, state);
  
  // 应用防御减伤（与普通攻击一致）
  const defenseReductionFactor = 100; // 与 COMBAT_CONFIG.defenseReductionFactor 一致
  const defenseReduction = defenseReductionFactor / (defenseReductionFactor + enemyDefense);
  const damageAfterDefense = Math.floor(baseDamage * defenseReduction);
  
  // 计算克制关系
  const restraint = calculateRestraintResult(
    skill.element || null,
    enemyAttributes.element,
    skill.weaponCategory || null,
    enemyAttributes.weaponCategory
  );
  
  let damage = Math.floor(damageAfterDefense * restraint.damageMultiplier);
  
  // 伤害约束
  const maxDamage = Math.floor(targetMaxHp * BATTLE_CONSTANTS.MAX_DAMAGE_RATIO * 1.5);
  damage = Math.min(damage, maxDamage);
  
  // 应用伤害
  if (targetEnemy) {
    applyDamageToEnemy(targetEnemy, damage);
    state.enemyCurrentHp = targetEnemy.currentHp;
  } else {
    state.enemyCurrentHp = applyDamage(state.enemyCurrentHp, damage, state.enemyMaxHp);
  }
  
  // 处理特殊效果
  let specialMessage = '';
  if (skill.effect.special) {
    specialMessage = applySpecialEffect(skill.effect.special, state, damage);
  }
  
  // 处理治疗效果
  let healing = 0;
  if (skill.effect.healing) {
    healing = skill.effect.healing;
    state.playerCurrentHp = applyHeal(state.playerCurrentHp, healing, state.playerMaxHp);
  }
  if (skill.effect.healingPercent) {
    healing = Math.floor(state.playerMaxHp * skill.effect.healingPercent);
    state.playerCurrentHp = applyHeal(state.playerCurrentHp, healing, state.playerMaxHp);
  }
  
  // 构建结果
  const enemyName = targetEnemy?.name || state.enemyName;
  let message = `你施展了「${skill.name}」！`;
  if (restraint.restraintType !== 'neutral') {
    message += ` ${formatRestraintDescription(restraint, skill.name, enemyName)}`;
  }
  message += ` 对${enemyName}造成${damage}点伤害。`;
  if (healing > 0) {
    message += ` 恢复${healing}点生命。`;
  }
  if (specialMessage) {
    message += ` ${specialMessage}`;
  }
  
  return {
    action: { type: 'technique_attack', techniqueSkillId: skillId },
    success: true,
    damage,
    healing,
    mpChange: -skill.mpCost,
    message,
    restraint,
    skill,
  };
}

/**
 * 执行斗技（武器技巧：无MP消耗，中等伤害）
 */
function executeCombatTechnique(skillId: string, state: ExtendedBattleState, rng: () => number = Math.random): BattleActionResult {
  const skill = state.availableSkills.find(s => s.id === skillId);
  
  if (!skill) {
    return {
      action: { type: 'combat_technique', combatTechniqueId: skillId },
      success: false,
      message: '斗技不存在',
      failReason: 'skill_not_found',
    };
  }
  
  // 检查可用性
  const usableCheck = isCombatTechniqueUsable(skill, state);
  if (!usableCheck.usable) {
    return {
      action: { type: 'combat_technique', combatTechniqueId: skillId },
      success: false,
      message: usableCheck.reason || '无法使用',
      failReason: 'skill_unusable',
    };
  }
  
  // 斗技不消耗MP
  
  // 【修复】设置冷却时加1，因为回合结束会统一减1
  if (skill.cooldown > 0) {
    state.skillCooldowns.set(skill.id, skill.cooldown + 1);
  }
  
  // ============================================
  // 多敌人系统：获取目标敌人
  // ============================================
  let targetEnemy: BattleEnemy | null = null;
  let targetIndex = state.selectedEnemyIndex;
  
  if (state.enemies.length > 0) {
    const aliveEnemies = getAliveEnemies(state.enemies);
    if (aliveEnemies.length > 0) {
      if (targetIndex >= state.enemies.length || !state.enemies[targetIndex]?.isAlive) {
        targetIndex = state.enemies.findIndex(e => e.isAlive);
        state.selectedEnemyIndex = targetIndex;
      }
      targetEnemy = state.enemies[targetIndex];
    }
  }
  
  const enemyAttributes = targetEnemy?.attributes || state.enemyAttributes;
  const targetMaxHp = targetEnemy?.maxHp || state.enemyMaxHp;
  const enemyDefense = targetEnemy ? getEnemyTotalDefense(targetEnemy) : state.enemyDefense;
  
  // 计算伤害 - 斗技伤害中等（基于武器加成）
  const weaponBonus = skill.effect.damageMultiplier || 1.5; // 斗技默认1.5倍伤害
  const baseDamage = Math.floor(state.playerAttack * weaponBonus);
  
  // 应用随机浮动 - 斗技浮动±20%
  const variance = 0.20;
  const minMultiplier = Math.max(0.5, 1 - variance);
  const maxMultiplier = Math.min(2.0, 1 + variance);
  const randomMultiplier = minMultiplier + rng() * (maxMultiplier - minMultiplier);
  const damageAfterVariance = Math.floor(baseDamage * randomMultiplier);
  
  // 应用防御减伤
  const defenseReductionFactor = 100;
  const defenseReduction = defenseReductionFactor / (defenseReductionFactor + enemyDefense);
  const damageAfterDefense = Math.floor(damageAfterVariance * defenseReduction);
  
  // 计算克制关系
  const restraint = calculateRestraintResult(
    skill.element || null,
    enemyAttributes.element,
    skill.weaponCategory || null,
    enemyAttributes.weaponCategory
  );
  
  let damage = Math.floor(damageAfterDefense * restraint.damageMultiplier);
  
  // 伤害约束
  const maxDamage = Math.floor(targetMaxHp * BATTLE_CONSTANTS.MAX_DAMAGE_RATIO * 1.2);
  damage = Math.min(damage, maxDamage);
  
  // 应用伤害
  if (targetEnemy) {
    applyDamageToEnemy(targetEnemy, damage);
    state.enemyCurrentHp = targetEnemy.currentHp;
  } else {
    state.enemyCurrentHp = applyDamage(state.enemyCurrentHp, damage, state.enemyMaxHp);
  }
  
  // 处理特殊效果
  let specialMessage = '';
  if (skill.effect.special) {
    specialMessage = applySpecialEffect(skill.effect.special, state, damage);
  }
  
  // 构建结果
  const enemyName = targetEnemy?.name || state.enemyName;
  let message = `你使出了「${skill.name}」！`;
  if (restraint.restraintType !== 'neutral') {
    message += ` ${formatRestraintDescription(restraint, skill.name, enemyName)}`;
  }
  message += ` 对${enemyName}造成${damage}点伤害。`;
  if (specialMessage) {
    message += ` ${specialMessage}`;
  }
  
  return {
    action: { type: 'combat_technique', combatTechniqueId: skillId },
    success: true,
    damage,
    message,
    restraint,
    skill,
  };
}

/**
 * 执行防御
 */
function executeDefend(state: ExtendedBattleState): BattleActionResult {
  state.playerIsDefending = true;
  
  // 恢复MP
  const mpRecovery = BATTLE_CONSTANTS.DEFEND_MP_RECOVERY;
  state.playerCurrentMp = Math.min(state.playerMaxMp, state.playerCurrentMp + mpRecovery);
  
  return {
    action: { type: 'defend' },
    success: true,
    mpChange: mpRecovery,
    message: `你摆出防御姿态，准备抵御攻击。恢复${mpRecovery}点法力。`,
  };
}

/**
 * 执行使用物品
 */
function executeUseItem(itemId: string, state: ExtendedBattleState): BattleActionResult {
  const itemIndex = state.availableItems.findIndex(i => i.id === itemId);
  
  if (itemIndex < 0) {
    return {
      action: { type: 'use_item', itemId },
      success: false,
      message: '物品不存在',
      failReason: 'item_not_found',
    };
  }
  
  const item = state.availableItems[itemIndex];
  
  if (item.quantity <= 0) {
    return {
      action: { type: 'use_item', itemId },
      success: false,
      message: '物品数量不足',
      failReason: 'item_insufficient',
    };
  }
  
  // 消耗物品
  item.quantity--;
  if (item.quantity <= 0) {
    state.availableItems.splice(itemIndex, 1);
  }
  
  // 设置物品冷却（2回合：本回合+下回合不能使用）
  const itemDefId = item.definition.id;
  state.itemCooldowns.set(itemDefId, 2);
  
  // 应用效果
  let healing = 0;
  let mpChange = 0;
  const effects: any[] = [];
  
  for (const effect of item.definition.effects || []) {
    switch (effect.type) {
      case 'restore_hp':
        healing = effect.value;
        state.playerCurrentHp = applyHeal(state.playerCurrentHp, healing, state.playerMaxHp);
        break;
      case 'restore_mp':
        mpChange = effect.value;
        state.playerCurrentMp = Math.min(state.playerMaxMp, state.playerCurrentMp + mpChange);
        break;
      case 'stat_boost':
        // 添加临时Buff
        effects.push({
          type: effect.type,
          stat: effect.description.match(/体质/) ? '体质' as const :
                effect.description.match(/灵根/) ? '灵根' as const :
                effect.description.match(/悟性/) ? '悟性' as const :
                effect.description.match(/幸运/) ? '幸运' as const : '意志' as const,
          value: effect.value,
          remainingCount: effect.duration || 3,
        });
        break;
    }
  }
  
  return {
    action: { type: 'use_item', itemId },
    success: true,
    healing,
    mpChange,
    message: `你使用了「${item.definition.name}」。${healing > 0 ? `恢复${healing}点生命。` : ''}${mpChange > 0 ? `恢复${mpChange}点法力。` : ''}`,
    effects,
    item,
  };
}

/**
 * 执行逃跑
 */
function executeFlee(state: ExtendedBattleState, rng: () => number = Math.random): BattleActionResult {
  const fleeRate = calculateFleeRate(state);
  const success = rng() < fleeRate;
  
  return {
    action: { type: 'flee' },
    success,
    message: success 
      ? '你成功逃离了战斗！'
      : '逃跑失败！敌人挡住了你的去路。',
  };
}

/**
 * 计算逃跑成功率
 */
function calculateFleeRate(state: ExtendedBattleState): number {
  const levelDiff = state.playerLevel - state.enemyLevel;
  
  let rate = BATTLE_CONSTANTS.BASE_FLEE_RATE;
  rate += levelDiff * BATTLE_CONSTANTS.FLEE_LEVEL_BONUS;
  
  // Boss惩罚
  if (state.enemyTier === 'boss' || state.enemyTier === 'miniboss') {
    rate -= BATTLE_CONSTANTS.FLEE_BOSS_PENALTY;
  }
  
  return clamp(rate, BATTLE_CONSTANTS.MIN_FLEE_RATE, BATTLE_CONSTANTS.MAX_FLEE_RATE);
}

/**
 * 应用特殊效果
 */
function applySpecialEffect(
  effect: any,
  state: ExtendedBattleState,
  damage: number
): string {
  switch (effect.type) {
    case 'life_steal':
      const healAmount = Math.floor(damage * effect.percent / 100);
      state.playerCurrentHp = applyHeal(state.playerCurrentHp, healAmount, state.playerMaxHp);
      return `吸血恢复${healAmount}点生命！`;
    
    case 'shield':
      // TODO: 实现护盾系统
      return `获得${effect.amount}点护盾！`;
    
    case 'stun':
      // TODO: 实现眩晕系统
      return `敌人被眩晕${effect.rounds}回合！`;
    
    default:
      return '';
  }
}

// ============================================
// 敌人AI决策
// ============================================

/**
 * 执行敌人行动
 */
export function executeEnemyAction(state: ExtendedBattleState, rng: () => number = Math.random): BattleActionResult {
  // 重置玩家防御状态
  const playerWasDefending = state.playerIsDefending;
  state.playerIsDefending = false;
  
  // 敌人基础属性
  const { enemyAttack, enemyLevel, playerDefense, playerLevel } = state;
  
  // 计算玩家血量百分比（用于AI决策）
  const playerHpPercent = state.playerCurrentHp / state.playerMaxHp;
  
  // 敌人技能选择逻辑
  const enemySkills = state.enemySkills || [];
  const enemyCurrentMp = state.enemyCurrentMp || 0;
  const enemyCooldowns = state.enemySkillCooldowns || new Map<string, number>();
  
  // 过滤可用技能
  const usableSkills = enemySkills.filter(skill => {
    const cooldown = enemyCooldowns.get(skill.id) || 0;
    const mpCost = skill.mpCost || 0;
    return cooldown === 0 && mpCost <= enemyCurrentMp;
  });
  
  // 选择技能策略
  let selectedSkill: BattleSkill | null = null;
  let useSkill = false;
  
  if (usableSkills.length > 0) {
    // 选择伤害最高的技能作为默认选择
    const sortedSkills = [...usableSkills].sort((a, b) => {
      const aDmg = a.effect?.damageMultiplier || 1;
      const bDmg = b.effect?.damageMultiplier || 1;
      return bDmg - aDmg;
    });
    
    // 玩家血量低于30%时，优先斩杀类技能
    if (playerHpPercent < 0.3) {
      const executeSkill = usableSkills.find(s => s.tags?.includes('execute'));
      if (executeSkill) {
        selectedSkill = executeSkill;
        useSkill = true;
      }
    }
    
    // 【修复】敌人更积极使用技能 - 大幅提高使用概率
    if (!useSkill) {
      // 根据敌人类型确定基础技能使用概率
      const baseSkillUseChance = state.enemyTier === 'boss' ? 0.85 : 
                                  state.enemyTier === 'miniboss' ? 0.7 :
                                  state.enemyTier === 'elite' ? 0.5 : 0.35;
      
      // 根据玩家血量调整概率（玩家血量越低，敌人越积极使用技能）
      const hpAdjustedChance = baseSkillUseChance + (1 - playerHpPercent) * 0.15;
      
      // 选择技能：优先选择伤害最高的
      if (rng() < hpAdjustedChance && sortedSkills.length > 0) {
        selectedSkill = sortedSkills[0];
        useSkill = true;
      }
    }
  }
  
  // 计算伤害
  const levelDiff = enemyLevel - playerLevel;
  const baseDamage = calculateDamage(enemyAttack, playerDefense, levelDiff);
  let damage = baseDamage;
  let skillName = '';
  
  // 如果使用技能
  if (useSkill && selectedSkill) {
    // 【修复】技能伤害计算 - 提高敌人技能伤害
    // 基础倍率 * 技能倍率 * 敌人类型加成
    const skillMultiplier = selectedSkill.effect?.damageMultiplier || 1;
    
    // 敌人类型伤害加成
    const tierDamageBonus = state.enemyTier === 'boss' ? 1.5 : 
                            state.enemyTier === 'miniboss' ? 1.3 :
                            state.enemyTier === 'elite' ? 1.2 : 1.1;
    
    // 技能总伤害 = 基础伤害 * 技能倍率 * 类型加成
    damage = Math.floor(baseDamage * skillMultiplier * tierDamageBonus);
    skillName = selectedSkill.name;
    
    // 消耗MP
    state.enemyCurrentMp = (state.enemyCurrentMp || 0) - (selectedSkill.mpCost || 0);
    
    // 【修复】设置冷却时加1，因为回合结束会统一减1
    // 这样冷却=3的技能实际需要等3回合后才能使用
    if (selectedSkill.cooldown && selectedSkill.cooldown > 0) {
      state.enemySkillCooldowns = state.enemySkillCooldowns || new Map<string, number>();
      state.enemySkillCooldowns.set(selectedSkill.id, selectedSkill.cooldown + 1);
    }
  }
  
  // 应用克制关系
  const restraint = calculateRestraintResult(
    state.enemyAttributes.element,
    null, // TODO: 玩家防御属性
    state.enemyAttributes.weaponCategory,
    null
  );
  damage = Math.floor(damage * restraint.receivedMultiplier);
  
  // 防御减伤
  if (playerWasDefending) {
    damage = Math.floor(damage * (1 - BATTLE_CONSTANTS.DEFEND_DAMAGE_REDUCTION));
  }
  
  // 伤害约束
  const maxDamage = Math.floor(state.playerMaxHp * BATTLE_CONSTANTS.MAX_DAMAGE_RATIO);
  const minDamage = Math.floor(enemyAttack * BATTLE_CONSTANTS.MIN_DAMAGE_RATIO);
  damage = clamp(damage, minDamage, maxDamage);
  
  // 应用伤害
  state.playerCurrentHp = applyDamage(state.playerCurrentHp, damage, state.playerMaxHp);
  
  // 构建结果消息
  let message = '';
  if (useSkill && selectedSkill) {
    message = `${state.enemyName}使用【${skillName}】`;
  } else {
    message = `${state.enemyName}发动攻击`;
  }
  
  if (restraint.restraintType !== 'neutral') {
    message += `，${formatRestraintDescription(restraint, state.enemyName, '你')}`;
  }
  if (playerWasDefending) {
    message += '，你的防御减轻了伤害';
  }
  message += `，造成${damage}点伤害。`;
  
  // 【修复】不要在这里减少冷却，应该在回合结束时统一减少
  // 敌人技能冷却会在 executeTurn 中与玩家冷却一起更新
  
  return {
    action: { type: useSkill ? 'technique_attack' : 'normal_attack', techniqueSkillId: selectedSkill?.id },
    success: true,
    damage,
    message,
    restraint,
    skill: selectedSkill ?? undefined,
  };
}

// ============================================
// 回合执行
// ============================================

/**
 * 执行完整回合（支持多敌人）
 */
export function executeTurn(
  action: BattleAction,
  state: ExtendedBattleState,
  statistics: BattleStatistics,
  rng: () => number = Math.random
): TurnResult {
  const result: TurnResult = {
    events: [],
    battleOver: false,
  };
  
  // 执行玩家行动
  result.playerResult = executePlayerAction(action, state, rng);
  
  // 更新统计
  if (result.playerResult.success) {
    if (result.playerResult.damage) {
      statistics.playerTotalDamage += result.playerResult.damage;
      statistics.maxDamageDealt = Math.max(statistics.maxDamageDealt, result.playerResult.damage);
    }
    if (result.playerResult.critical) {
      statistics.critCount++;
    }
    if (action.type === 'technique_attack' || action.type === 'combat_technique') {
      statistics.skillUseCount++;
    }
    if (action.type === 'use_item') {
      statistics.itemUseCount++;
    }
    if (action.type === 'defend') {
      statistics.defendCount++;
    }
  }
  
  // 记录行动
  state.actionHistory.push({
    round: state.currentRound,
    actor: 'player',
    action,
    result: result.playerResult,
    timestamp: Date.now(),
  });
  
  // ============================================
  // 多敌人战斗检查
  // ============================================
  
  // 检查是否所有敌人都被击败
  if (areAllEnemiesDefeated(state.enemies)) {
    state.isOver = true;
    state.victory = true;
    state.phase = 'battle_end';
    result.battleOver = true;
    result.victory = true;
    result.endReason = '所有敌人被击败';
    return result;
  }
  
  // 向后兼容：检查单敌人是否死亡
  if (state.enemyCurrentHp <= 0 && state.enemies.length === 0) {
    state.isOver = true;
    state.victory = true;
    state.phase = 'battle_end';
    result.battleOver = true;
    result.victory = true;
    result.endReason = '敌人被击败';
    return result;
  }
  
  // 逃跑成功
  if (action.type === 'flee' && result.playerResult.success) {
    state.isOver = true;
    state.victory = false;
    state.fled = true;
    state.phase = 'battle_end';
    result.battleOver = true;
    result.victory = false;
    result.fled = true;
    result.endReason = '逃跑成功';
    return result;
  }
  
  // ============================================
  // 敌人回合（多敌人轮流行动）
  // ============================================
  
  const aliveEnemies = getAliveEnemies(state.enemies);
  const enemyResults: BattleActionResult[] = [];
  
  for (const enemy of aliveEnemies) {
    // 检查敌人是否被眩晕
    if (enemy.isStunned && enemy.stunRounds > 0) {
      enemy.stunRounds--;
      if (enemy.stunRounds <= 0) {
        enemy.isStunned = false;
      }
      enemyResults.push({
        action: { type: 'normal_attack' },
        success: false,
        message: `${enemy.name}被眩晕，无法行动！`,
      });
      continue;
    }
    
    // 执行单个敌人的行动
    const enemyResult = executeSingleEnemyAction(state, enemy, statistics, rng);
    enemyResults.push(enemyResult);
    
    // 检查玩家是否死亡
    if (state.playerCurrentHp <= 0) {
      state.isOver = true;
      state.victory = false;
      state.phase = 'battle_end';
      result.battleOver = true;
      result.victory = false;
      result.endReason = '你被击败';
      result.enemyResult = enemyResults[0]; // 返回第一个敌人的结果
      return result;
    }
  }
  
  // 设置敌人结果（使用第一个敌人结果用于兼容）
  result.enemyResult = enemyResults[0];
  
  // 更新所有敌人的技能冷却和Buff
  state.enemies.forEach(enemy => {
    updateEnemySkillCooldowns(enemy);
    updateEnemyBuffs(enemy);
  });
  
  // 向后兼容：更新单敌人的冷却
  if (state.enemySkillCooldowns) {
    state.enemySkillCooldowns.forEach((remaining, skillId) => {
      if (remaining > 0) {
        state.enemySkillCooldowns!.set(skillId, remaining - 1);
      }
    });
  }
  
  // 更新玩家技能冷却
  state.skillCooldowns.forEach((remaining, skillId) => {
    if (remaining > 0) {
      state.skillCooldowns.set(skillId, remaining - 1);
    }
  });
  
  // 更新物品冷却
  state.itemCooldowns.forEach((remaining, itemId) => {
    if (remaining > 0) {
      state.itemCooldowns.set(itemId, remaining - 1);
    }
  });
  
  return result;
}

/**
 * 执行单个敌人的行动（多敌人系统）
 */
export function executeSingleEnemyAction(
  state: ExtendedBattleState,
  enemy: BattleEnemy,
  statistics: BattleStatistics,
  rng: () => number = Math.random
): BattleActionResult {
  const playerWasDefending = state.playerIsDefending;
  
  // 获取敌人实际属性（含Buff）
  const enemyAttack = getEnemyTotalAttack(enemy);
  const enemyDefense = getEnemyTotalDefense(enemy);
  
  // 计算玩家血量百分比
  const playerHpPercent = state.playerCurrentHp / state.playerMaxHp;
  
  // 敌人技能选择逻辑
  const enemySkills = enemy.skills || [];
  const enemyCurrentMp = enemy.currentMp || 0;
  const enemyCooldowns = enemy.skillCooldowns || new Map<string, number>();
  
  // 过滤可用技能
  const usableSkills = enemySkills.filter(skill => {
    const cooldown = enemyCooldowns.get(skill.id) || 0;
    const mpCost = skill.mpCost || 0;
    return cooldown === 0 && mpCost <= enemyCurrentMp;
  });
  
  // 选择技能策略
  let selectedSkill: BattleSkill | null = null;
  let useSkill = false;
  
  if (usableSkills.length > 0) {
    // 选择伤害最高的技能
    const sortedSkills = [...usableSkills].sort((a, b) => {
      const aDmg = a.effect?.damageMultiplier || 1;
      const bDmg = b.effect?.damageMultiplier || 1;
      return bDmg - aDmg;
    });
    
    // 玩家血量低于30%时，优先斩杀类技能
    if (playerHpPercent < 0.3) {
      const executeSkill = usableSkills.find(s => s.tags?.includes('execute'));
      if (executeSkill) {
        selectedSkill = executeSkill;
        useSkill = true;
      }
    }
    
    if (!useSkill) {
      const baseSkillUseChance = enemy.tier === 'boss' ? 0.85 : 
                                  enemy.tier === 'miniboss' ? 0.7 :
                                  enemy.tier === 'elite' ? 0.5 : 0.35;
      const hpAdjustedChance = baseSkillUseChance + (1 - playerHpPercent) * 0.15;
      
      if (rng() < hpAdjustedChance && sortedSkills.length > 0) {
        selectedSkill = sortedSkills[0];
        useSkill = true;
      }
    }
  }
  
  // 计算伤害
  const levelDiff = enemy.level - state.playerLevel;
  const baseDamage = calculateDamage(enemyAttack, state.playerDefense, levelDiff);
  let damage = baseDamage;
  let skillName = '';
  
  // 如果使用技能
  if (useSkill && selectedSkill) {
    const skillMultiplier = selectedSkill.effect?.damageMultiplier || 1;
    const tierDamageBonus = enemy.tier === 'boss' ? 1.5 : 
                            enemy.tier === 'miniboss' ? 1.3 :
                            enemy.tier === 'elite' ? 1.2 : 1.1;
    
    damage = Math.floor(baseDamage * skillMultiplier * tierDamageBonus);
    skillName = selectedSkill.name;
    
    // 消耗MP
    enemy.currentMp = (enemy.currentMp || 0) - (selectedSkill.mpCost || 0);
    
    // 设置冷却
    if (selectedSkill.cooldown && selectedSkill.cooldown > 0) {
      enemy.skillCooldowns.set(selectedSkill.id, selectedSkill.cooldown + 1);
    }
  }
  
  // 应用克制关系
  const restraint = calculateRestraintResult(
    enemy.attributes.element,
    null,
    enemy.attributes.weaponCategory,
    null
  );
  damage = Math.floor(damage * restraint.receivedMultiplier);
  
  // 防御减伤
  if (playerWasDefending) {
    damage = Math.floor(damage * (1 - BATTLE_CONSTANTS.DEFEND_DAMAGE_REDUCTION));
  }
  
  // 伤害约束
  const maxDamage = Math.floor(state.playerMaxHp * BATTLE_CONSTANTS.MAX_DAMAGE_RATIO);
  const minDamage = Math.floor(enemyAttack * BATTLE_CONSTANTS.MIN_DAMAGE_RATIO);
  damage = clamp(damage, minDamage, maxDamage);
  
  // 应用伤害到玩家
  state.playerCurrentHp = applyDamage(state.playerCurrentHp, damage, state.playerMaxHp);
  
  // 记录敌人造成的伤害
  enemy.totalDamageDealt += damage;
  
  // 构建结果消息
  let message = '';
  if (useSkill && selectedSkill) {
    message = `${enemy.name}使用【${skillName}】`;
  } else {
    message = `${enemy.name}发动攻击`;
  }
  
  if (restraint.restraintType !== 'neutral') {
    message += `，${formatRestraintDescription(restraint, enemy.name, '你')}`;
  }
  if (playerWasDefending) {
    message += '，你的防御减轻了伤害';
  }
  message += `，造成${damage}点伤害。`;
  
  // 更新统计
  statistics.enemyTotalDamage += damage;
  statistics.maxDamageReceived = Math.max(statistics.maxDamageReceived, damage);
  
  return {
    action: { type: useSkill ? 'technique_attack' : 'normal_attack', techniqueSkillId: selectedSkill?.id },
    success: true,
    damage,
    message,
    restraint,
    skill: selectedSkill ?? undefined,
  };
}

/**
 * 执行自动战斗（AI托管）
 */
export function executeAutoTurn(
  state: ExtendedBattleState,
  statistics: BattleStatistics,
  rng: () => number = Math.random
): TurnResult {
  // AI选择最佳行动
  const action = selectBestAction(state, rng);
  return executeTurn(action, state, statistics, rng);
}

/**
 * AI选择最佳行动
 */
function selectBestAction(state: ExtendedBattleState, rng: () => number = Math.random): BattleAction {
  const context: DecisionContext = { state, round: state.currentRound };
  const options = getAvailableDecisions(context);
  
  // 过滤可用选项
  const availableOptions = options.filter(o => !o.disabled);
  
  if (availableOptions.length === 0) {
    return { type: 'normal_attack' };
  }
  
  // 优先选择推荐选项
  const recommended = availableOptions.filter(o => o.recommended);
  if (recommended.length > 0) {
    return recommended[Math.floor(rng() * recommended.length)].action;
  }

  // 低血量时优先防御
  const hpPercent = state.playerCurrentHp / state.playerMaxHp;
  if (hpPercent < 0.3) {
    const defend = availableOptions.find(o => o.action.type === 'defend');
    if (defend) return defend.action;
  }

  // 有可用的攻击技能
  // 有可用的法技且MP充足
  const techniqueSkills = availableOptions.filter(o => o.action.type === 'technique_attack');
  if (techniqueSkills.length > 0 && state.playerCurrentMp > 20) {
    return techniqueSkills[Math.floor(rng() * techniqueSkills.length)].action;
  }

  // 有可用的斗技
  const combatTechniques = availableOptions.filter(o => o.action.type === 'combat_technique');
  if (combatTechniques.length > 0) {
    return combatTechniques[Math.floor(rng() * combatTechniques.length)].action;
  }
  
  // 默认普通攻击
  return { type: 'normal_attack' };
}
