/**
 * 计算上下文助手
 * 
 * 提供从游戏对象构建计算上下文的便捷方法
 */

import type { Protagonist, Technique, Equipment, ActiveEffect, EnemyTier } from '../../game/types';
import type { CalculationContext, WorldEffectInput } from '../context/types';
import type { WorldDanger, WorldOpportunity } from '../../data/worldEffectsData';
import { ContextBuilder } from '../context/builder';

/**
 * 从主角对象构建计算上下文
 * 
 * @param protagonist 主角对象
 * @returns 计算上下文
 */
export function buildContextFromProtagonist(protagonist: Protagonist): CalculationContext {
  const builder = new ContextBuilder();
  
  // 基础角色数据
  const stats = {
    体质: protagonist.stats.base.体质 + protagonist.stats.growth.体质,
    灵根: protagonist.stats.base.灵根 + protagonist.stats.growth.灵根,
    悟性: protagonist.stats.base.悟性 + protagonist.stats.growth.悟性,
    幸运: protagonist.stats.base.幸运 + protagonist.stats.growth.幸运,
    意志: protagonist.stats.base.意志 + protagonist.stats.growth.意志,
  };
  
  // 构建上下文
  const context: CalculationContext = {
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
      melee: protagonist.equippedMelee ? convertEquipment(protagonist.equippedMelee) : null,
      ranged: protagonist.equippedRanged ? convertEquipment(protagonist.equippedRanged) : null,
      head: protagonist.equippedHead ? convertEquipment(protagonist.equippedHead) : null,
      body: protagonist.equippedBody ? convertEquipment(protagonist.equippedBody) : null,
      legs: protagonist.equippedLegs ? convertEquipment(protagonist.equippedLegs) : null,
      feet: protagonist.equippedFeet ? convertEquipment(protagonist.equippedFeet) : null,
    },
    
    techniques: [
      ...(protagonist.equippedAttackTechniques || []),
      ...(protagonist.equippedDefenseTechniques || []),
    ].filter((t): t is Technique => t !== null).map(convertTechnique),
    
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
  
  return context;
}

/**
 * 转换装备数据格式
 */
function convertEquipment(eq: Equipment): CalculationContext['equipment']['melee'] {
  return {
    id: eq.id,
    name: eq.name,
    slot: eq.slot,
    rarity: eq.rarity,
    level: eq.level,
    attackBonus: eq.attackBonus || 0,
    defenseBonus: eq.defenseBonus || 0,
    power: eq.power || 0,
    element: eq.element || null,
  };
}

/**
 * 转换功法数据格式
 */
function convertTechnique(tech: Technique): CalculationContext['techniques'][0] {
  return {
    id: tech.id,
    name: tech.name,
    type: tech.type,
    rarity: tech.rarity,
    level: tech.level,
    power: tech.power || 0,
    bonus: tech.bonus || 0,
    element: tech.element,
  };
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
  techniques: Technique[] = [],
  equipments: Equipment[] = [],
  activeEffects: ActiveEffect[] = []
): number {
  // 使用旧的计算逻辑（暂时保留兼容）
  // 后续完全迁移后会使用新的计算系统
  
  const equippedTechniques: Technique[] = [
    ...(protagonist.equippedAttackTechniques || []),
    ...(protagonist.equippedDefenseTechniques || [])
  ].filter((t): t is Technique => t !== null && t !== undefined);
  
  const equippedEquipments: Equipment[] = [
    protagonist.equippedMelee,
    protagonist.equippedRanged,
    protagonist.equippedHead,
    protagonist.equippedBody,
    protagonist.equippedLegs,
    protagonist.equippedFeet
  ].filter((e): e is Equipment => e !== null && e !== undefined);
  
  const stats = {
    体质: protagonist.stats.base.体质 + protagonist.stats.growth.体质,
    灵根: protagonist.stats.base.灵根 + protagonist.stats.growth.灵根,
    悟性: protagonist.stats.base.悟性 + protagonist.stats.growth.悟性,
    幸运: protagonist.stats.base.幸运 + protagonist.stats.growth.幸运,
    意志: protagonist.stats.base.意志 + protagonist.stats.growth.意志,
  };
  
  const maxHp = protagonist.maxHp;
  const maxMp = protagonist.maxMp;
  
  // 基础战力
  const hpCoefficient = 0.5;
  const mpCoefficient = 0.3;
  const attackCoefficient = 2.5;
  const defenseCoefficient = 2.0;
  
  // 简化的攻击/防御计算
  const attack = Math.floor(10 + stats.体质 * 2 + protagonist.level);
  const defense = Math.floor(5 + stats.意志 + protagonist.level * 0.5);
  
  const basePower = 
    hpCoefficient * maxHp + 
    mpCoefficient * maxMp + 
    attackCoefficient * attack + 
    defenseCoefficient * defense;
  
  // 属性战力
  const geometricMean = Math.pow(
    stats.体质 * stats.灵根 * stats.悟性 * stats.幸运 * stats.意志,
    1 / 5
  );
  const statCoefficient = 8;
  const statPower = geometricMean * statCoefficient;
  
  // 等级加成
  const levelCoefficient = 0.03;
  const levelBonus = 1 + protagonist.level * levelCoefficient;
  
  // 功法加成
  const techniqueLevels = equippedTechniques.reduce((sum, t) => sum + t.level, 0);
  const techniqueCoefficient = 0.01;
  const techniqueBonus = techniqueLevels * techniqueCoefficient;
  
  // 装备加成
  const rarityMultipliers: Record<string, number> = {
    '传说': 0.15,
    '史诗': 0.10,
    '稀有': 0.06,
    '普通': 0.03,
  };
  
  let equipmentBonus = 0;
  for (const eq of equippedEquipments) {
    const rarityBonus = rarityMultipliers[eq.rarity] || 0.02;
    equipmentBonus += rarityBonus * eq.level;
  }
  
  // 临时增益效果
  let effectBonus = 0;
  for (const effect of activeEffects) {
    if (effect.type === 'combat_boost') {
      effectBonus += effect.value * 0.01;
    } else if (effect.type === 'stat_boost') {
      effectBonus += effect.value * 0.005;
    }
  }
  
  // 总战力计算
  const totalPower = Math.floor(
    (basePower + statPower) * 
    levelBonus * 
    (1 + techniqueBonus) * 
    (1 + equipmentBonus) * 
    (1 + effectBonus)
  );
  
  return Math.max(1, totalPower);
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
  enemy: import('../../game/enemy/types').Enemy,
  world?: import('../../game/types').World
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
