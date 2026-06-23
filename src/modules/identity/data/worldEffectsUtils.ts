/**
 * 世界危险与机缘效果格式化工具
 * 
 * 将效果数据转换为用户可读的描述文本
 */

import { StatName } from '@/core/types';

import { WorldDanger, WorldOpportunity, DangerEffect, OpportunityEffect } from './worldEffectsData';

/** 属性名称映射 */
const STAT_NAMES: Record<StatName, string> = {
  '体质': '体质',
  '灵根': '灵根',
  '悟性': '悟性',
  '幸运': '幸运',
  '意志': '意志',
};

/** 危险类型名称映射 */
const DANGER_TYPE_NAMES: Record<string, string> = {
  'stat_debuff': '属性削弱',
  'resource_drain': '资源消耗',
  'enemy_buff': '敌人强化',
  'special_mechanic': '特殊机制',
  'random_event': '随机事件',
};

/** 机缘类型名称映射 */
const OPPORTUNITY_TYPE_NAMES: Record<string, string> = {
  'stat_buff': '属性加成',
  'resource_gain': '资源获取',
  'special_ability': '特殊能力',
  'rare_drop': '稀有掉落',
  'favorable_event': '有利事件',
};

/**
 * 格式化危险效果
 */
export function formatDangerEffect(effect: DangerEffect): string[] {
  const effects: string[] = [];
  
  // 属性削弱
  if (effect.statModifications && Object.keys(effect.statModifications).length > 0) {
    const stats = Object.entries(effect.statModifications)
      .map(([stat, value]) => `${STAT_NAMES[stat as StatName] || stat}${value < 0 ? value : `+${value}`}`)
      .join('、');
    effects.push(`属性: ${stats}`);
  }
  
  // 资源消耗
  if (effect.resourceModifications) {
    const resources: string[] = [];
    if (effect.resourceModifications.hp) {
      resources.push(`每回合HP${effect.resourceModifications.hp}`);
    }
    if (effect.resourceModifications.mp) {
      resources.push(`每回合MP${effect.resourceModifications.mp}`);
    }
    if (effect.resourceModifications.spiritStones) {
      resources.push(`进入消耗${Math.abs(effect.resourceModifications.spiritStones)}灵石`);
    }
    if (resources.length > 0) {
      effects.push(`资源: ${resources.join('、')}`);
    }
  }
  
  // 敌人强化
  if (effect.enemyBuffs) {
    const buffs: string[] = [];
    if (effect.enemyBuffs.attackBonus) {
      buffs.push(`攻击+${Math.round(effect.enemyBuffs.attackBonus * 100)}%`);
    }
    if (effect.enemyBuffs.defenseBonus) {
      buffs.push(`防御+${Math.round(effect.enemyBuffs.defenseBonus * 100)}%`);
    }
    if (effect.enemyBuffs.hpBonus) {
      buffs.push(`生命+${Math.round(effect.enemyBuffs.hpBonus * 100)}%`);
    }
    if (buffs.length > 0) {
      effects.push(`敌人: ${buffs.join('、')}`);
    }
  }
  
  // 特殊效果
  if (effect.specialEffects) {
    const specialNames: Record<string, string> = {
      'no_heal': '无法治疗',
      'no_escape': '无法逃跑',
      'double_damage_chance': '双倍伤害风险',
      'curse': '诅咒状态',
      'reduced_exp': '经验减少',
    };
    const name = specialNames[effect.specialEffects.type] || effect.specialEffects.type;
    effects.push(`特殊: ${name}${effect.specialEffects.value ? ` (${effect.specialEffects.value}%)` : ''}`);
  }
  
  return effects;
}

/**
 * 格式化机缘效果
 */
export function formatOpportunityEffect(effect: OpportunityEffect): string[] {
  const effects: string[] = [];
  
  // 属性加成
  if (effect.statModifications && Object.keys(effect.statModifications).length > 0) {
    const stats = Object.entries(effect.statModifications)
      .map(([stat, value]) => `${STAT_NAMES[stat as StatName] || stat}+${value}`)
      .join('、');
    effects.push(`属性: ${stats}`);
  }
  
  // 资源获取
  if (effect.resourceGains) {
    const resources: string[] = [];
    if (effect.resourceGains.hp) {
      resources.push(`HP+${effect.resourceGains.hp}`);
    }
    if (effect.resourceGains.mp) {
      resources.push(`MP+${effect.resourceGains.mp}`);
    }
    if (effect.resourceGains.spiritStones) {
      resources.push(`灵石+${effect.resourceGains.spiritStones}`);
    }
    if (effect.resourceGains.exp) {
      resources.push(`经验+${effect.resourceGains.exp}`);
    }
    if (resources.length > 0) {
      effects.push(`资源: ${resources.join('、')}`);
    }
  }
  
  // 特殊效果
  if (effect.specialEffects) {
    const specialNames: Record<string, string> = {
      'double_exp': '双倍经验',
      'double_drop': '双倍掉落',
      'free_retreat': '免费撤退',
      'extra_loot': '额外战利品',
      'reduced_damage': '伤害减免',
    };
    const name = specialNames[effect.specialEffects.type] || effect.specialEffects.type;
    effects.push(`特殊: ${name}${effect.specialEffects.value ? ` (${effect.specialEffects.value}%)` : ''}`);
  }
  
  // 掉落加成
  if (effect.dropBonus) {
    const drops: string[] = [];
    if (effect.dropBonus.rarityBoost) {
      drops.push(`品质提升${effect.dropBonus.rarityBoost}级`);
    }
    if (effect.dropBonus.extraDropChance) {
      drops.push(`额外掉落+${Math.round(effect.dropBonus.extraDropChance * 100)}%`);
    }
    if (drops.length > 0) {
      effects.push(`掉落: ${drops.join('、')}`);
    }
  }
  
  return effects;
}

/**
 * 格式化危险完整信息
 */
export function formatDanger(danger: WorldDanger): {
  name: string;
  level: number;
  type: string;
  description: string;
  effects: string[];
  trigger: string;
  dispellable: boolean;
} {
  const triggerNames: Record<string, string> = {
    'on_enter': '进入世界',
    'on_battle_start': '战斗开始',
    'on_battle_end': '战斗结束',
    'on_turn': '每回合',
    'on_explore': '探索时',
    'random': '随机触发',
  };
  
  return {
    name: danger.name,
    level: danger.dangerLevel,
    type: DANGER_TYPE_NAMES[danger.type] || danger.type,
    description: danger.description,
    effects: formatDangerEffect(danger.effect),
    trigger: triggerNames[danger.triggerCondition.type] || danger.triggerCondition.type,
    dispellable: danger.dispellable,
  };
}

/**
 * 格式化机缘完整信息
 */
export function formatOpportunity(opportunity: WorldOpportunity): {
  name: string;
  level: number;
  type: string;
  description: string;
  effects: string[];
  trigger: string;
} {
  const triggerNames: Record<string, string> = {
    'on_enter': '进入世界',
    'on_battle_start': '战斗开始',
    'on_battle_end': '战斗结束',
    'on_turn': '每回合',
    'on_explore': '探索时',
    'random': '随机触发',
  };
  
  return {
    name: opportunity.name,
    level: opportunity.opportunityLevel,
    type: OPPORTUNITY_TYPE_NAMES[opportunity.type] || opportunity.type,
    description: opportunity.description,
    effects: formatOpportunityEffect(opportunity.effect),
    trigger: triggerNames[opportunity.triggerCondition.type] || opportunity.triggerCondition.type,
  };
}

/**
 * 获取危险等级样式类名
 */
export function getDangerLevelStyle(level: number): {
  badge: string;
  stars: string;
  text: string;
} {
  const styles = {
    1: {
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      stars: 'text-yellow-500',
      text: 'text-yellow-600',
    },
    2: {
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      stars: 'text-orange-500',
      text: 'text-orange-600',
    },
    3: {
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      stars: 'text-red-500',
      text: 'text-red-600',
    },
    4: {
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      stars: 'text-rose-500',
      text: 'text-rose-600',
    },
    5: {
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      stars: 'text-purple-500',
      text: 'text-purple-600',
    },
  };
  return styles[level as keyof typeof styles] || styles[1];
}

/**
 * 获取机缘等级样式类名
 */
export function getOpportunityLevelStyle(level: number): {
  badge: string;
  stars: string;
  text: string;
} {
  const styles = {
    1: {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      stars: 'text-emerald-500',
      text: 'text-emerald-600',
    },
    2: {
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
      stars: 'text-teal-500',
      text: 'text-teal-600',
    },
    3: {
      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      stars: 'text-cyan-500',
      text: 'text-cyan-600',
    },
    4: {
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      stars: 'text-blue-500',
      text: 'text-blue-600',
    },
    5: {
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      stars: 'text-amber-500',
      text: 'text-amber-600',
    },
  };
  return styles[level as keyof typeof styles] || styles[1];
}

/**
 * 生成等级星星
 *
 * 将等级转换为可视化星级（★☆），有效范围为 0-5。
 * 超出范围的值会被钳制到安全边界内，防止 String.repeat 抛出 RangeError。
 *
 * @param level - 等级数值（1-5 正常，超出会被钳制）
 * @returns 星级字符串，如 "★★★☆☆"
 */
export function generateLevelStars(level: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(level) || 0));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}
