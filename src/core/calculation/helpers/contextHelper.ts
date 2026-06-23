/**
 * 计算上下文助手
 * 
 * 提供从游戏对象构建计算上下文的便捷方法
 */

import type { Protagonist, ActiveEffect, EnemyTier } from '@/core/types';
import type { WorldDanger, WorldOpportunity } from '@/modules/identity/data/worldEffectsData';
import { resolveItem, findItemByInstance } from '@/modules/item/logic/itemManager';
import type { ResolvedItem } from '@/modules/item/types';

import { ContextBuilder } from '../context/builder';


import type { CalculationContext, WorldEffectInput } from '../context/types';


/**
 * 从主角对象构建计算上下文
 * 
 * @param protagonist 主角对象
 * @returns 计算上下文
 */
export function buildContextFromProtagonist(protagonist: Protagonist): CalculationContext {
  return buildContextFromUnifiedProtagonist(protagonist);
}

/**
 * 转换世界危险数据格式
 */
function convertWorldDanger(danger: WorldDanger): WorldEffectInput {
  return {
    id: danger.id,
    name: danger.name,
    type: 'danger',
    level: danger.dangerLevel,
    statModifications: danger.effect?.statModifications || {},
    resourceModifications: danger.effect?.resourceModifications,
    enemyBuffs: danger.effect?.enemyBuffs,
    specialEffects: danger.effect?.specialEffects ? [danger.effect.specialEffects.type] : [],
  };
}

/**
 * 转换世界机缘数据格式
 */
function convertWorldOpportunity(opportunity: WorldOpportunity): WorldEffectInput {
  return {
    id: opportunity.id,
    name: opportunity.name,
    type: 'opportunity',
    level: opportunity.opportunityLevel,
    statModifications: opportunity.effect?.statModifications || {},
    resourceModifications: opportunity.effect?.resourceGains,
    specialEffects: opportunity.effect?.specialEffects ? [opportunity.effect.specialEffects.type] : [],
  };
}

/**
 * 转换激活效果数据格式
 */
function convertActiveEffect(effect: ActiveEffect): CalculationContext['state']['activeEffects'][0] {
  return {
    id: effect.itemId,
    itemId: effect.itemId,
    itemName: effect.itemName,
    type: effect.type,
    value: effect.value,
    remainingCount: effect.remainingCount,
  };
}

/**
 * 从境界名称获取境界等级
 */
function getRealmLevel(realmName: string): number {
  // 简单实现：从境界名称推断等级
  // 实际实现可能需要从境界系统配置中获取
  const realmLevelMap: Record<string, number> = {
    '炼气期': 1,
    '筑基期': 2,
    '金丹期': 3,
    '元婴期': 4,
    '化神期': 5,
    '渡劫期': 6,
    '大乘期': 7,
  };
  
  for (const [name, level] of Object.entries(realmLevelMap)) {
    if (realmName.includes(name)) {
      return level;
    }
  }
  
  return 1;
}

/**
 * 快速计算玩家战力
 * 
 * 这是旧的 calculatePlayerCombatPower 的新实现
 * 使用统一计算系统
 */
export function quickCalculatePlayerPower(
  protagonist: Protagonist,
  _techniques?: unknown[],
  _equipments?: unknown[],
  _activeEffects?: unknown[]
): number {
  return quickCalculatePlayerPowerUnified(protagonist);
}

/**
 * 快速计算敌人战力
 */
export function quickCalculateEnemyPower(
  hp: number,
  attack: number,
  defense: number,
  level: number,
  tier: EnemyTier
): number {
  const tierMultipliers: Record<string, number> = {
    normal: 1.0,
    elite: 1.15,
    miniboss: 1.3,
    boss: 1.5,
  };
  
  const basePower = hp * 0.5 + attack * 2.5 + defense * 2.0;
  const levelBonus = 1 + level * 0.03;
  const tierBonus = tierMultipliers[tier] || 1.0;
  
  return Math.max(1, Math.floor(basePower * levelBonus * tierBonus));
}

/**
 * 从敌人对象构建计算上下文
 * 
 * @param enemy 敌人对象
 * @param world 世界对象（可选，用于应用世界效果）
 * @returns 计算上下文
 */
export function buildContextFromEnemy(
  enemy: import('@/modules/combat/logic/enemy/types').Enemy,
  world?: import('@/core/types').World
): CalculationContext {
  const builder = new ContextBuilder();
  
  // 基础敌人数据（使用默认值）
  const stats = {
    体质: Math.floor(enemy.maxHp / 10),
    灵根: 10,
    悟性: 10,
    幸运: 10,
    意志: enemy.stats.defense,
  };
  
  // 推断敌人等级
  const enemyRealmLevel = Math.min(Math.floor(enemy.level / 10), 7);
  const realmNames = ['炼气', '筑基', '金丹', '元婴', '化神', '渡劫', '大乘'];
  const enemyRealm = realmNames[enemyRealmLevel] || '炼气';
  
  // 构建上下文
  const context: CalculationContext = {
    calculationId: `enemy_${enemy.id}_${Date.now()}`,
    timestamp: Date.now(),
    
    character: {
      id: enemy.id,
      type: 'enemy',
      level: enemy.level,
      realm: enemyRealm,
      realmLevel: enemyRealmLevel + 1,
      baseStats: stats,
    },
    
    equipment: {
      melee: null,
      ranged: null,
      head: null,
      body: null,
      legs: null,
      feet: null,
    },
    
    techniques: [],
    
    world: world ? {
      id: String(world.id),
      type: world.type,
      actualCoefficient: world.actualCoefficient,
      dangers: (world.dangers || []).map(convertWorldDanger),
      opportunities: (world.opportunities || []).map(convertWorldOpportunity),
    } : {
      id: 'default',
      type: '修仙',
      actualCoefficient: 1.0,
      dangers: [],
      opportunities: [],
    },
    
    state: {
      inBattle: true,
      currentHp: enemy.currentHp,
      maxHp: enemy.maxHp,
      currentMp: enemy.currentMp || 50,
      maxMp: enemy.maxMp || 50,
      activeBuffs: [],
      activeEffects: [],
    },
    
    titles: [],
    
    realm: {
      name: enemyRealm,
      level: enemyRealmLevel + 1,
    },
  };
  
  return context;
}

// ══════════════════════════════════════════════════════════════════
// 统一物品系统适配（unified-item-system）
// ══════════════════════════════════════════════════════════════════

/** 从 ResolvedItem 转换为 CalculationContext 装备格式 */
function convertResolvedEquipment(item: ResolvedItem): NonNullable<CalculationContext['equipment']['melee']> {
  return {
    id: item.instanceId,
    name: item.name,
    slot: (item.ext as { equipSlot?: string }).equipSlot || 'melee',
    rarity: item.rarity,
    level: item.level,
    attackBonus: item.actualStats.attackBonus || 0,
    defenseBonus: item.actualStats.defenseBonus || 0,
    power: item.actualStats.power || 0,
    element: item.element || null,
  };
}

/** 从 ResolvedItem 转换为 CalculationContext 功法格式 */
function convertResolvedTechnique(item: ResolvedItem): CalculationContext['techniques'][0] {
  return {
    id: item.instanceId,
    name: item.name,
    type: item.subcategory as 'attack' | 'defense',
    rarity: item.rarity,
    level: item.level,
    power: item.actualStats.power || 0,
    bonus: item.actualStats.bonus || 0,
    element: item.element || 'fire',
  };
}

/** 从主角 slots + items 构建装备/功法列表 */
function getEquippedFromSlots(protagonist: Protagonist): {
  equipmentSlots: Record<string, CalculationContext['equipment']['melee']>;
  techniques: CalculationContext['techniques'];
} {
  const items = protagonist.items || [];
  const slots = protagonist.slots || {};

  const eqSlots: Record<string, CalculationContext['equipment']['melee']> = {};
  const techniques: CalculationContext['techniques'] = [];

  for (const [slotId, instanceId] of Object.entries(slots)) {
    if (!instanceId) continue;
    const instance = findItemByInstance(items, instanceId);
    if (!instance) continue;
    const resolved = resolveItem(instance);

    if (resolved.category === 'equipment') {
      const slotKey = slotId.replace('weapon_', '').replace('armor_', '');
      eqSlots[slotKey] = convertResolvedEquipment(resolved);
    } else if (resolved.category === 'technique') {
      techniques.push(convertResolvedTechnique(resolved));
    }
  }

  return { equipmentSlots: eqSlots, techniques };
}

/** 从统一物品 Protagonist 构建计算上下文（新路径） */
export function buildContextFromUnifiedProtagonist(protagonist: Protagonist): CalculationContext {
  const stats = {
    体质: protagonist.stats.base.体质 + protagonist.stats.growth.体质,
    灵根: protagonist.stats.base.灵根 + protagonist.stats.growth.灵根,
    悟性: protagonist.stats.base.悟性 + protagonist.stats.growth.悟性,
    幸运: protagonist.stats.base.幸运 + protagonist.stats.growth.幸运,
    意志: protagonist.stats.base.意志 + protagonist.stats.growth.意志,
  };

  const { equipmentSlots, techniques } = getEquippedFromSlots(protagonist);

  return {
    calculationId: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: Date.now(),

    character: {
      id: String(protagonist.character.id),
      type: 'protagonist',
      level: protagonist.level,
      realm: protagonist.realm,
      realmLevel: getRealmLevel(protagonist.realm),
      baseStats: stats,
    },

    equipment: {
      melee: equipmentSlots['melee'] || null,
      ranged: equipmentSlots['ranged'] || null,
      head: equipmentSlots['head'] || null,
      body: equipmentSlots['body'] || null,
      legs: equipmentSlots['legs'] || null,
      feet: equipmentSlots['feet'] || null,
    },

    techniques,

    world: {
      id: String(protagonist.world.id),
      type: protagonist.world.type,
      actualCoefficient: protagonist.world.actualCoefficient,
      dangers: (protagonist.world.dangers || []).map(convertWorldDanger),
      opportunities: (protagonist.world.opportunities || []).map(convertWorldOpportunity),
    },

    state: {
      inBattle: false,
      currentHp: protagonist.currentHp,
      maxHp: protagonist.maxHp,
      currentMp: protagonist.currentMp,
      maxMp: protagonist.maxMp,
      activeBuffs: [],
      activeEffects: (protagonist.activeEffects || []).map(convertActiveEffect),
    },

    titles: [],

    realm: {
      name: protagonist.realm,
      level: getRealmLevel(protagonist.realm),
    },
  };
}

/** 快速计算玩家战力（统一物品路径） */
export function quickCalculatePlayerPowerUnified(protagonist: Protagonist): number {
  const stats = {
    体质: protagonist.stats.base.体质 + protagonist.stats.growth.体质,
    灵根: protagonist.stats.base.灵根 + protagonist.stats.growth.灵根,
    悟性: protagonist.stats.base.悟性 + protagonist.stats.growth.悟性,
    幸运: protagonist.stats.base.幸运 + protagonist.stats.growth.幸运,
    意志: protagonist.stats.base.意志 + protagonist.stats.growth.意志,
  };

  const maxHp = protagonist.maxHp || 100;
  const maxMp = protagonist.maxMp || 50;

  const attack = Math.floor(10 + stats.体质 * 2 + protagonist.level);
  const defense = Math.floor(5 + stats.意志 + protagonist.level * 0.5);

  const basePower = 0.5 * maxHp + 0.3 * maxMp + 2.5 * attack + 2.0 * defense;

  const geometricMean = Math.pow(
    stats.体质 * stats.灵根 * stats.悟性 * stats.幸运 * stats.意志, 1 / 5
  );
  const statPower = geometricMean * 8;

  const items = protagonist.items || [];
  const slots = protagonist.slots || {};
  let equipBonus = 0;

  for (const instanceId of Object.values(slots)) {
    if (!instanceId) continue;
    const instance = findItemByInstance(items, instanceId);
    if (!instance) continue;
    const resolved = resolveItem(instance);
    equipBonus += (resolved.actualStats.power || 0)
      + (resolved.actualStats.attackBonus || 0) * 2
      + (resolved.actualStats.defenseBonus || 0) * 1.5;
  }

  const levelBonus = 1 + protagonist.level * 0.03;
  return Math.floor((basePower + statPower + equipBonus) * levelBonus);
}
