/**
 * 世界效果应用逻辑
 * 
 * 处理危险和机缘效果在游戏中的实际应用
 */

import { Enemy } from './enemy/types';
import { Protagonist, StatName } from './types';
import { World } from './types';
import {
  WorldDanger,
  WorldOpportunity,
  TriggerType,
  DangerEffect,
  OpportunityEffect,
} from '../data/worldEffectsData';

// ============================================
// 类型定义
// ============================================

/** 应用效果结果 */
export interface AppliedEffect {
  id: string;
  type: 'danger' | 'opportunity';
  name: string;
  description: string;
  /** 属性修改 */
  statModifications?: Partial<Record<StatName, number>>;
  /** 资源修改 */
  resourceModifications?: {
    hp?: number;
    mp?: number;
    spiritStones?: number;
    exp?: number;
  };
  /** 敌人增益 */
  enemyBuffs?: {
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;
  };
  /** 特殊效果 */
  specialEffects?: {
    type: string;
    value?: number;
  };
  /** 掉落加成 */
  dropBonus?: {
    rarityBoost: number;
    extraDropChance: number;
  };
  /** 持续时间 */
  duration: number;
  /** 是否可驱散 */
  dispellable?: boolean;
}

/** 效果应用结果 */
export interface EffectApplyResult {
  effects: AppliedEffect[];
  messages: string[];
  /** 对敌人的增益（用于战斗前应用） */
  enemyBuffs?: {
    attackBonus: number;
    defenseBonus: number;
    hpBonus: number;
  };
}

/** 世界状态（追踪已应用的效果） */
export interface WorldEffectState {
  /** 已激活的危险效果 */
  activeDangers: AppliedEffect[];
  /** 已激活的机缘效果 */
  activeOpportunities: AppliedEffect[];
  /** 世界加成的经验系数 */
  expMultiplier: number;
  /** 世界加成的灵石系数 */
  spiritStoneMultiplier: number;
  /** 世界加成的掉落系数 */
  dropMultiplier: number;
  /** 掉落品质加成 */
  rarityBonus: {
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
}

// ============================================
// 危险效果应用
// ============================================

/**
 * 应用世界危险效果
 */
export function applyDangerEffects(
  world: World,
  protagonist: Protagonist,
  triggerType: TriggerType
): EffectApplyResult {
  const effects: AppliedEffect[] = [];
  const messages: string[] = [];
  const enemyBuffs = { attackBonus: 0, defenseBonus: 0, hpBonus: 0 };
  
  for (const danger of world.dangers) {
    // 检查触发条件
    if (danger.triggerCondition.type !== triggerType) continue;
    if (Math.random() > danger.triggerCondition.chance) continue;
    
    // 应用效果
    const applied = applySingleDanger(danger, protagonist);
    effects.push(applied);
    messages.push(`⚠️ ${danger.name}: ${danger.description}`);
    
    // 累加敌人增益
    if (applied.enemyBuffs) {
      enemyBuffs.attackBonus += applied.enemyBuffs.attackBonus || 0;
      enemyBuffs.defenseBonus += applied.enemyBuffs.defenseBonus || 0;
      enemyBuffs.hpBonus += applied.enemyBuffs.hpBonus || 0;
    }
  }
  
  return { effects, messages, enemyBuffs };
}

/**
 * 应用单个危险效果
 */
function applySingleDanger(
  danger: WorldDanger,
  protagonist: Protagonist
): AppliedEffect {
  const effect = danger.effect;
  const result: AppliedEffect = {
    id: danger.id,
    type: 'danger',
    name: danger.name,
    description: danger.description,
    duration: danger.duration,
    dispellable: danger.dispellable,
  };
  
  // 属性修改
  if (effect.statModifications && Object.keys(effect.statModifications).length > 0) {
    result.statModifications = { ...effect.statModifications };
    
    // 直接应用到主角
    for (const [stat, value] of Object.entries(effect.statModifications)) {
      const statName = stat as StatName;
      if (protagonist.stats.growth[statName] !== undefined) {
        protagonist.stats.growth[statName] += value;
      }
    }
  }
  
  // 资源修改（立即生效）
  if (effect.resourceModifications) {
    result.resourceModifications = { ...effect.resourceModifications };
    
    if (effect.resourceModifications.hp) {
      protagonist.currentHp = Math.max(1, protagonist.currentHp + effect.resourceModifications.hp);
    }
    if (effect.resourceModifications.mp) {
      protagonist.currentMp = Math.max(0, protagonist.currentMp + effect.resourceModifications.mp);
    }
    if (effect.resourceModifications.spiritStones) {
      // 灵石存储在 currencies 中
      if (!protagonist.currencies) {
        protagonist.currencies = { contribution: 0, spirit_stone: 0 };
      }
      protagonist.currencies.spirit_stone = Math.max(0, (protagonist.currencies.spirit_stone || 0) + effect.resourceModifications.spiritStones);
    }
  }
  
  // 敌人增益
  if (effect.enemyBuffs) {
    result.enemyBuffs = { ...effect.enemyBuffs };
  }
  
  // 特殊效果
  if (effect.specialEffects) {
    result.specialEffects = { ...effect.specialEffects };
  }
  
  return result;
}

// ============================================
// 机缘效果应用
// ============================================

/**
 * 应用世界机缘效果
 */
export function applyOpportunityEffects(
  world: World,
  protagonist: Protagonist,
  triggerType: TriggerType
): EffectApplyResult {
  const effects: AppliedEffect[] = [];
  const messages: string[] = [];
  const enemyBuffs = { attackBonus: 0, defenseBonus: 0, hpBonus: 0 };
  
  // 获取已激活的危险ID，检查冲突
  const activeDangerIds = new Set<string>(); // 可从状态中获取
  
  for (const opportunity of world.opportunities) {
    // 检查触发条件
    if (opportunity.triggerCondition.type !== triggerType) continue;
    if (Math.random() > opportunity.triggerCondition.chance) continue;
    
    // 检查冲突
    if (opportunity.conflictsWith?.some(id => activeDangerIds.has(id))) continue;
    
    // 应用效果
    const applied = applySingleOpportunity(opportunity, protagonist);
    effects.push(applied);
    messages.push(`✨ ${opportunity.name}: ${opportunity.description}`);
  }
  
  return { effects, messages, enemyBuffs };
}

/**
 * 应用单个机缘效果
 */
function applySingleOpportunity(
  opportunity: WorldOpportunity,
  protagonist: Protagonist
): AppliedEffect {
  const effect = opportunity.effect;
  const result: AppliedEffect = {
    id: opportunity.id,
    type: 'opportunity',
    name: opportunity.name,
    description: opportunity.description,
    duration: opportunity.duration,
  };
  
  // 属性加成
  if (effect.statModifications && Object.keys(effect.statModifications).length > 0) {
    result.statModifications = { ...effect.statModifications };
    
    // 直接应用到主角
    for (const [stat, value] of Object.entries(effect.statModifications)) {
      const statName = stat as StatName;
      if (protagonist.stats.growth[statName] !== undefined) {
        protagonist.stats.growth[statName] += value;
      }
    }
  }
  
  // 资源获取
  if (effect.resourceGains) {
    result.resourceModifications = { ...effect.resourceGains };
    
    if (effect.resourceGains.hp) {
      protagonist.currentHp = Math.min(
        protagonist.maxHp,
        protagonist.currentHp + effect.resourceGains.hp
      );
    }
    if (effect.resourceGains.mp) {
      protagonist.currentMp = Math.min(
        protagonist.maxMp,
        protagonist.currentMp + effect.resourceGains.mp
      );
    }
    if (effect.resourceGains.spiritStones) {
      // 灵石存储在 currencies 中
      if (!protagonist.currencies) {
        protagonist.currencies = { contribution: 0, spirit_stone: 0 };
      }
      protagonist.currencies.spirit_stone = (protagonist.currencies.spirit_stone || 0) + effect.resourceGains.spiritStones;
    }
  }
  
  // 特殊效果
  if (effect.specialEffects) {
    result.specialEffects = { ...effect.specialEffects };
  }
  
  // 掉落加成
  if (effect.dropBonus) {
    result.dropBonus = { ...effect.dropBonus };
  }
  
  return result;
}

// ============================================
// 世界效果状态管理
// ============================================

/**
 * 创建初始世界效果状态
 */
export function createInitialWorldEffectState(): WorldEffectState {
  return {
    activeDangers: [],
    activeOpportunities: [],
    expMultiplier: 1,
    spiritStoneMultiplier: 1,
    dropMultiplier: 1,
    rarityBonus: { rare: 0, epic: 0, legendary: 0, mythic: 0 },
  };
}

/**
 * 应用世界效果到状态
 */
export function applyWorldEffectsToState(
  state: WorldEffectState,
  world: World
): WorldEffectState {
  const newState = { ...state };
  
  // 应用世界奖励系数
  newState.expMultiplier = world.rewardCoefficient.expCoefficient;
  newState.spiritStoneMultiplier = world.rewardCoefficient.spiritStoneCoefficient;
  newState.dropMultiplier = world.rewardCoefficient.dropCoefficient;
  newState.rarityBonus = { ...world.rewardCoefficient.rarityBonus };
  
  // 应用永久性危险效果
  for (const danger of world.dangers) {
    if (danger.triggerCondition.type === 'on_enter' && danger.duration === -1) {
      const applied: AppliedEffect = {
        id: danger.id,
        type: 'danger',
        name: danger.name,
        description: danger.description,
        duration: -1,
        statModifications: danger.effect.statModifications,
        specialEffects: danger.effect.specialEffects,
        enemyBuffs: danger.effect.enemyBuffs,
        dispellable: danger.dispellable,
      };
      newState.activeDangers.push(applied);
    }
  }
  
  // 应用永久性机缘效果
  for (const opportunity of world.opportunities) {
    if (opportunity.triggerCondition.type === 'on_enter' && opportunity.duration === -1) {
      const applied: AppliedEffect = {
        id: opportunity.id,
        type: 'opportunity',
        name: opportunity.name,
        description: opportunity.description,
        duration: -1,
        statModifications: opportunity.effect.statModifications,
        specialEffects: opportunity.effect.specialEffects,
        dropBonus: opportunity.effect.dropBonus,
      };
      newState.activeOpportunities.push(applied);
    }
  }
  
  return newState;
}

/**
 * 计算实际经验加成
 */
export function calculateExpMultiplier(state: WorldEffectState): number {
  let multiplier = state.expMultiplier;
  
  // 叠加机缘效果
  for (const opp of state.activeOpportunities) {
    if (opp.specialEffects?.type === 'double_exp' && opp.specialEffects.value) {
      multiplier *= opp.specialEffects.value;
    }
  }
  
  // 叠加危险效果
  for (const danger of state.activeDangers) {
    if (danger.specialEffects?.type === 'reduced_exp' && danger.specialEffects.value) {
      multiplier *= (1 - danger.specialEffects.value);
    }
  }
  
  return Math.max(0.1, multiplier); // 最低10%
}

/**
 * 计算实际掉落加成
 */
export function calculateDropMultiplier(state: WorldEffectState): number {
  let multiplier = state.dropMultiplier;
  
  for (const opp of state.activeOpportunities) {
    if (opp.specialEffects?.type === 'double_drop' && opp.specialEffects.value) {
      multiplier *= opp.specialEffects.value;
    }
  }
  
  return multiplier;
}

/**
 * 计算品质加成
 */
export function calculateRarityBonus(state: WorldEffectState): {
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
} {
  const bonus = { ...state.rarityBonus };
  
  for (const opp of state.activeOpportunities) {
    if (opp.dropBonus) {
      bonus.rare += opp.dropBonus.rarityBoost * 0.1;
      bonus.epic += opp.dropBonus.rarityBoost * 0.08;
      bonus.legendary += opp.dropBonus.rarityBoost * 0.05;
      bonus.mythic += opp.dropBonus.rarityBoost * 0.03;
    }
  }
  
  return bonus;
}

// ============================================
// 战斗相关
// ============================================

/**
 * 应用世界效果到敌人
 */
export function applyWorldEffectsToEnemy(
  enemy: Enemy,
  world: World,
  worldEffectState: WorldEffectState
): Enemy {
  // 应用世界难度系数
  const difficultyBonus = {
    hp: world.actualCoefficient,
    attack: world.actualCoefficient * 0.9,
    defense: world.actualCoefficient * 0.8,
  };
  
  // 应用危险效果中的敌人增益
  const dangerBonus = { attack: 0, defense: 0, hp: 0 };
  for (const danger of worldEffectState.activeDangers) {
    if (danger.enemyBuffs) {
      dangerBonus.attack += danger.enemyBuffs.attackBonus || 0;
      dangerBonus.defense += danger.enemyBuffs.defenseBonus || 0;
      dangerBonus.hp += danger.enemyBuffs.hpBonus || 0;
    }
  }
  
  // 计算最终属性
  const modifiedEnemy: Enemy = {
    ...enemy,
    currentHp: Math.floor(enemy.maxHp * difficultyBonus.hp * (1 + dangerBonus.hp)),
    maxHp: Math.floor(enemy.maxHp * difficultyBonus.hp * (1 + dangerBonus.hp)),
    stats: {
      ...enemy.stats,
      attack: Math.floor(enemy.stats.attack * difficultyBonus.attack * (1 + dangerBonus.attack)),
      defense: Math.floor(enemy.stats.defense * difficultyBonus.defense * (1 + dangerBonus.defense)),
    },
  };
  
  return modifiedEnemy;
}

/**
 * 检查是否可以治疗
 */
export function canHeal(worldEffectState: WorldEffectState): boolean {
  return !worldEffectState.activeDangers.some(
    d => d.specialEffects?.type === 'no_heal'
  );
}

/**
 * 检查是否可以逃跑
 */
export function canEscape(worldEffectState: WorldEffectState): boolean {
  return !worldEffectState.activeDangers.some(
    d => d.specialEffects?.type === 'no_escape'
  );
}

/**
 * 计算伤害减免
 */
export function calculateDamageReduction(worldEffectState: WorldEffectState): number {
  let reduction = 0;
  
  for (const opp of worldEffectState.activeOpportunities) {
    if (opp.specialEffects?.type === 'reduced_damage' && opp.specialEffects.value) {
      reduction += opp.specialEffects.value;
    }
  }
  
  return Math.min(0.8, reduction); // 最高80%减免
}
