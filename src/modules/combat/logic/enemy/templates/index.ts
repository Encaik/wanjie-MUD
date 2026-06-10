/**
 * 敌人模板数据
 * 
 * 敌人模板定义了敌人的基础特征，包括：
 * - 基础属性模板
 * - 行为模式
 * - 外观描述
 * - 掉落配置
 */

import { Element } from '@/modules/combat/logic/restraintSystem';
import { EnemyTier } from '../types';
import { WorldType } from '@/core/types';
import { EnemyTemplate, EnemyBehaviorType } from '../types';

// ============================================
// 基础属性模板
// ============================================

/** 属性模板定义 */
export interface AttributeTemplate {
  name: string;
  description: string;
  // 基础属性倍率
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  speedMultiplier: number;
  // 特殊加成
  specialBonus?: {
    criticalRate?: number;
    dodgeRate?: number;
    counterRate?: number;
  };
}

/** 预定义属性模板 */
export const ATTRIBUTE_TEMPLATES: Record<string, AttributeTemplate> = {
  // 均衡型
  balanced: {
    name: '均衡',
    description: '各项属性均衡的敌人',
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    speedMultiplier: 1.0,
  },
  
  // 防御型
  defensive: {
    name: '坚韧',
    description: '高生命值和防御力的敌人',
    hpMultiplier: 1.5,
    attackMultiplier: 0.8,
    defenseMultiplier: 1.3,
    speedMultiplier: 0.9,
  },
  
  // 攻击型
  offensive: {
    name: '凶猛',
    description: '高攻击力的敌人',
    hpMultiplier: 0.9,
    attackMultiplier: 1.4,
    defenseMultiplier: 0.8,
    speedMultiplier: 1.1,
  },
  
  // 速度型
  speedy: {
    name: '迅捷',
    description: '高速度的敌人',
    hpMultiplier: 0.8,
    attackMultiplier: 1.1,
    defenseMultiplier: 0.9,
    speedMultiplier: 1.5,
    specialBonus: {
      dodgeRate: 0.1,
    },
  },
  
  // 精英型
  elite: {
    name: '精英',
    description: '全面提升的精英敌人',
    hpMultiplier: 1.3,
    attackMultiplier: 1.2,
    defenseMultiplier: 1.2,
    speedMultiplier: 1.1,
    specialBonus: {
      criticalRate: 0.05,
      counterRate: 0.05,
    },
  },
  
  // Boss型
  boss: {
    name: 'Boss',
    description: 'Boss级敌人',
    hpMultiplier: 2.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.5,
    speedMultiplier: 0.8,
    specialBonus: {
      criticalRate: 0.1,
      counterRate: 0.1,
    },
  },
};

// ============================================
// 世界敌人模板
// ============================================

/** 人界 - 低级敌人（使用修仙世界） */
const HUMAN_WORLD_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'bandit',
    name: '山贼',
    description: '盘踞在山中的强盗',
    tier: 'normal',
    baseLevelRange: [1, 10],
    attributeTemplate: 'balanced',
    behaviorType: 'aggressive',
    preferredElement: 'fire',
    descriptionTemplate: '一个凶狠的山贼',
    dropRateMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  {
    id: 'wild_wolf',
    name: '野狼',
    description: '荒野中的狼群',
    tier: 'normal',
    baseLevelRange: [1, 8],
    attributeTemplate: 'offensive',
    behaviorType: 'aggressive',
    preferredElement: 'wind',
    descriptionTemplate: '一只嗜血的野狼',
    dropRateMultiplier: 0.8,
    expMultiplier: 0.9,
  },
  {
    id: 'bandit_leader',
    name: '山贼头目',
    description: '山贼的首领',
    tier: 'elite',
    baseLevelRange: [5, 15],
    attributeTemplate: 'elite',
    behaviorType: 'balanced',
    preferredElement: 'fire',
    descriptionTemplate: '山贼头目，实力不俗',
    dropRateMultiplier: 1.5,
    expMultiplier: 1.5,
  },
  {
    id: 'human_boss_martial_artist',
    name: '武道宗师',
    description: '人界最强武者',
    tier: 'boss',
    baseLevelRange: [15, 25],
    attributeTemplate: 'boss',
    behaviorType: 'strategic',
    preferredElement: 'fire',
    descriptionTemplate: '武道宗师，武功高强',
    dropRateMultiplier: 3.0,
    expMultiplier: 3.0,
  },
];

/** 灵界 - 中级敌人（使用仙侠世界） */
const SPIRIT_WORLD_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'spirit_beast',
    name: '灵兽',
    description: '灵气凝聚而成的灵兽',
    tier: 'normal',
    baseLevelRange: [10, 25],
    attributeTemplate: 'balanced',
    behaviorType: 'balanced',
    preferredElement: 'earth',
    descriptionTemplate: '一只由灵气凝聚的灵兽',
    dropRateMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  {
    id: 'fire_sprite',
    name: '火精',
    description: '火焰之精',
    tier: 'normal',
    baseLevelRange: [12, 28],
    attributeTemplate: 'offensive',
    behaviorType: 'aggressive',
    preferredElement: 'fire',
    descriptionTemplate: '一团炽热的火焰之精',
    dropRateMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  {
    id: 'ice_golem',
    name: '冰巨人',
    description: '寒冰凝聚的巨人',
    tier: 'elite',
    baseLevelRange: [18, 32],
    attributeTemplate: 'defensive',
    behaviorType: 'defensive',
    preferredElement: 'ice',
    descriptionTemplate: '寒冰凝聚的巨人，防御惊人',
    dropRateMultiplier: 1.5,
    expMultiplier: 1.5,
  },
  {
    id: 'spirit_boss_elemental_lord',
    name: '元素领主',
    description: '掌控元素的强大存在',
    tier: 'boss',
    baseLevelRange: [30, 45],
    attributeTemplate: 'boss',
    behaviorType: 'strategic',
    preferredElement: 'fire',
    descriptionTemplate: '元素领主，掌控火焰之力',
    dropRateMultiplier: 3.0,
    expMultiplier: 3.0,
  },
];

/** 仙界 - 高级敌人（使用高武世界） */
const IMMORTAL_WORLD_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'fallen_immortal',
    name: '堕仙',
    description: '堕落的仙人',
    tier: 'normal',
    baseLevelRange: [30, 50],
    attributeTemplate: 'balanced',
    behaviorType: 'balanced',
    preferredElement: 'dark',
    descriptionTemplate: '一位堕落的仙人',
    dropRateMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  {
    id: 'celestial_guardian',
    name: '天界守卫',
    description: '守护天界的战士',
    tier: 'elite',
    baseLevelRange: [40, 60],
    attributeTemplate: 'elite',
    behaviorType: 'defensive',
    preferredElement: 'light',
    descriptionTemplate: '天界守卫，忠诚无比',
    dropRateMultiplier: 1.5,
    expMultiplier: 1.5,
  },
  {
    id: 'demon_general',
    name: '魔将',
    description: '魔界的将领',
    tier: 'elite',
    baseLevelRange: [45, 65],
    attributeTemplate: 'offensive',
    behaviorType: 'aggressive',
    preferredElement: 'dark',
    descriptionTemplate: '魔界将领，实力强大',
    dropRateMultiplier: 1.5,
    expMultiplier: 1.5,
  },
  {
    id: 'immortal_boss_celestial_emperor',
    name: '天帝化身',
    description: '天帝的化身',
    tier: 'boss',
    baseLevelRange: [60, 80],
    attributeTemplate: 'boss',
    behaviorType: 'strategic',
    preferredElement: 'light',
    descriptionTemplate: '天帝化身，威压天地',
    dropRateMultiplier: 5.0,
    expMultiplier: 5.0,
  },
];

/** 神界 - 终极敌人（使用魔幻世界） */
const DIVINE_WORLD_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'ancient_god_remnant',
    name: '远古神明残魂',
    description: '远古神明的残留意志',
    tier: 'normal',
    baseLevelRange: [60, 80],
    attributeTemplate: 'balanced',
    behaviorType: 'balanced',
    preferredElement: 'thunder',
    descriptionTemplate: '远古神明的残魂',
    dropRateMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  {
    id: 'chaos_entity',
    name: '混沌生物',
    description: '混沌中的诡异存在',
    tier: 'elite',
    baseLevelRange: [70, 90],
    attributeTemplate: 'offensive',
    behaviorType: 'aggressive',
    preferredElement: 'dark',
    descriptionTemplate: '混沌中的诡异存在',
    dropRateMultiplier: 2.0,
    expMultiplier: 2.0,
  },
  {
    id: 'divine_boss_chaos_lord',
    name: '混沌之主',
    description: '混沌的终极存在',
    tier: 'boss',
    baseLevelRange: [90, 100],
    attributeTemplate: 'boss',
    behaviorType: 'strategic',
    preferredElement: 'dark',
    descriptionTemplate: '混沌之主，毁灭一切',
    dropRateMultiplier: 10.0,
    expMultiplier: 10.0,
  },
];

/** 塔层 - 特殊敌人 */
const TOWER_FLOOR_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'tower_guardian',
    name: '塔层守卫',
    description: '守护塔层的存在',
    tier: 'elite',
    baseLevelRange: [1, 100],
    attributeTemplate: 'elite',
    behaviorType: 'defensive',
    preferredElement: 'earth',
    descriptionTemplate: '塔层守卫，守护着通往上层的道路',
    dropRateMultiplier: 2.0,
    expMultiplier: 2.0,
  },
  {
    id: 'tower_boss_floor_master',
    name: '塔层之主',
    description: '掌管塔层的强大存在',
    tier: 'boss',
    baseLevelRange: [1, 100],
    attributeTemplate: 'boss',
    behaviorType: 'strategic',
    preferredElement: 'light',
    descriptionTemplate: '塔层之主，实力深不可测',
    dropRateMultiplier: 5.0,
    expMultiplier: 5.0,
  },
];

// ============================================
// 模板导出
// ============================================

/** 世界类型到模板分组的映射 */
const WORLD_TEMPLATE_MAP: Record<string, EnemyTemplate[]> = {
  '修仙': HUMAN_WORLD_TEMPLATES,
  '仙侠': SPIRIT_WORLD_TEMPLATES,
  '高武': IMMORTAL_WORLD_TEMPLATES,
  '魔幻': DIVINE_WORLD_TEMPLATES,
};

/** 按世界分组的模板 */
export const ENEMY_TEMPLATES_BY_WORLD: Partial<Record<WorldType, EnemyTemplate[]>> = WORLD_TEMPLATE_MAP;

/** 塔层模板 */
export const TOWER_TEMPLATES = TOWER_FLOOR_TEMPLATES;

/** 所有模板 */
export const ALL_ENEMY_TEMPLATES: EnemyTemplate[] = [
  ...HUMAN_WORLD_TEMPLATES,
  ...SPIRIT_WORLD_TEMPLATES,
  ...IMMORTAL_WORLD_TEMPLATES,
  ...DIVINE_WORLD_TEMPLATES,
  ...TOWER_FLOOR_TEMPLATES,
];

// ============================================
// 模板查询工具
// ============================================

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): EnemyTemplate | undefined {
  return ALL_ENEMY_TEMPLATES.find(t => t.id === id);
}

/**
 * 根据世界获取模板
 */
export function getTemplatesByWorld(world: WorldType): EnemyTemplate[] {
  return WORLD_TEMPLATE_MAP[world] || [];
}

/**
 * 根据等级范围获取模板
 */
export function getTemplatesByLevelRange(
  level: number,
  world?: WorldType
): EnemyTemplate[] {
  const templates = world 
    ? getTemplatesByWorld(world) 
    : ALL_ENEMY_TEMPLATES;
    
  return templates.filter(t => 
    level >= t.baseLevelRange[0] && level <= t.baseLevelRange[1]
  );
}

/**
 * 根据tier获取模板
 */
export function getTemplatesByTier(
  tier: EnemyTier,
  world?: WorldType
): EnemyTemplate[] {
  const templates = world 
    ? getTemplatesByWorld(world) 
    : ALL_ENEMY_TEMPLATES;
    
  return templates.filter(t => t.tier === tier);
}

/**
 * 获取属性模板
 */
export function getAttributeTemplate(id: string): AttributeTemplate {
  return ATTRIBUTE_TEMPLATES[id] || ATTRIBUTE_TEMPLATES.balanced;
}

/**
 * 随机选择适合等级的模板
 */
export function getRandomTemplateForLevel(
  level: number,
  world: WorldType,
  tierWeight?: Record<EnemyTier, number>
): EnemyTemplate | undefined {
  const templates = getTemplatesByLevelRange(level, world);
  if (templates.length === 0) return undefined;
  
  // 默认权重
  const weights = tierWeight || {
    normal: 70,
    elite: 25,
    miniboss: 4,
    boss: 1,
  };
  
  // 按权重分组
  const byTier: Record<string, EnemyTemplate[]> = {};
  for (const t of templates) {
    if (!byTier[t.tier]) byTier[t.tier] = [];
    byTier[t.tier].push(t);
  }
  
  // 计算总权重
  let totalWeight = 0;
  const availableTiers: Array<[EnemyTier, number]> = [];
  
  for (const [tier, weight] of Object.entries(weights) as Array<[EnemyTier, number]>) {
    if (byTier[tier] && byTier[tier].length > 0) {
      totalWeight += weight;
      availableTiers.push([tier, weight]);
    }
  }
  
  if (totalWeight === 0) return templates[0];
  
  // 随机选择tier
  let random = Math.random() * totalWeight;
  for (const [tier, weight] of availableTiers) {
    random -= weight;
    if (random <= 0) {
      const tierTemplates = byTier[tier];
      return tierTemplates[Math.floor(Math.random() * tierTemplates.length)];
    }
  }
  
  return templates[0];
}
