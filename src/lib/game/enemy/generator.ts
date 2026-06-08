/**
 * 敌人生成器
 * 
 * 核心职责：
 * 1. 根据模板生成敌人实例
 * 2. 应用难度系数调整属性
 * 3. 生成敌人的功法、装备和技能
 * 4. 计算最终属性（使用统一的三层架构）
 */

import {
  WorldType,
  EnemyTier,
} from '../types';
import {
  generateEnemyTechniqueEquipment,
  EnemyTechniqueEquipmentResult,
} from './techniqueEquipment';
import {
  getRandomTemplateForLevel,
  getTemplateById,
  getAttributeTemplate,
} from './templates';
import {
  Enemy,
  EnemyTemplate,
  DIFFICULTY_CONFIG,
  TIER_EQUIPMENT_CONFIG,
} from './types';
import { calculateStats } from '../stats/calculator';

// ============================================
// 工具函数
// ============================================

/**
 * 生成唯一ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机小数
 */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 按权重随机选择元素
 */
function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) return key;
  }
  
  return entries[0][0];
}

// ============================================
// 核心生成函数
// ============================================

/**
 * 敌人生成配置
 */
export interface EnemyGeneratorConfig {
  worldType: WorldType;
  targetLevel: number;
  tier?: EnemyTier;
  templateId?: string;
  difficultyMultiplier?: number;
}

/**
 * 生成单个敌人
 */
export function generateEnemy(config: EnemyGeneratorConfig): Enemy {
  const {
    worldType,
    targetLevel,
    tier,
    templateId,
    difficultyMultiplier = 1.0,
  } = config;
  
  // 1. 选择模板
  let template: EnemyTemplate | undefined;
  if (templateId) {
    template = getTemplateById(templateId);
  }
  if (!template) {
    const tierWeights = tier ? { [tier]: 100 } as Record<EnemyTier, number> : undefined;
    template = getRandomTemplateForLevel(targetLevel, worldType, tierWeights);
  }
  if (!template) {
    throw new Error(`No suitable enemy template found for level ${targetLevel} in world ${worldType}`);
  }
  
  // 2. 计算实际等级
  const levelRange = template.baseLevelRange;
  const actualLevel = randomInt(
    Math.max(levelRange[0], targetLevel - 3),
    Math.min(levelRange[1], targetLevel + 2)
  );
  
  // 3. 获取难度配置
  const difficultyConfig = DIFFICULTY_CONFIG[template.tier];
  
  // 4. 随机难度系数（基于tier配置的范围）
  const baseDifficulty = randomFloat(
    difficultyConfig.difficultyRange.min,
    difficultyConfig.difficultyRange.max
  );
  
  // 应用额外难度倍率
  const finalDifficulty = baseDifficulty * difficultyMultiplier;
  
  // 5. 生成功法装备
  const techEquip = generateEnemyTechniqueEquipment(
    template.tier,
    actualLevel,
    worldType
  );
  
  // 6. 计算属性（使用统一的三层架构）
  const attrTemplate = getAttributeTemplate(template.attributeTemplate);
  const stats = calculateEnemyStats(
    actualLevel,
    finalDifficulty,
    attrTemplate,
    techEquip,
    worldType
  );
  
  // 7. 生成敌人描述
  const description = generateEnemyDescription(template, actualLevel);
  
  // 8. 构建敌人对象
  const enemy: Enemy = {
    id: generateId('enemy'),
    name: template.name,
    description,
    level: actualLevel,
    tier: template.tier,
    templateId: template.id,
    
    // 属性
    stats,
    
    // 战斗状态
    currentHp: stats.maxHp,
    maxHp: stats.maxHp,
    currentMp: stats.maxMp,
    maxMp: stats.maxMp,
    
    // 功法装备
    techniques: techEquip.techniques,
    equipments: techEquip.equipments,
    
    // 技能
    skills: techEquip.skills,
    skillCooldowns: {},
    
    // AI
    behaviorType: template.behaviorType,
    
    // 难度系数
    difficultyMultiplier: finalDifficulty,
    
    // 元素倾向
    preferredElement: template.preferredElement,
    
    // 掉落
    dropRateMultiplier: template.dropRateMultiplier * difficultyConfig.dropMultiplier,
    expMultiplier: template.expMultiplier * difficultyConfig.expMultiplier,
    
    // 奖励
    expReward: Math.floor(actualLevel * 10 * template.expMultiplier * difficultyConfig.expMultiplier),
    goldReward: Math.floor(actualLevel * 5 * template.dropRateMultiplier * difficultyConfig.dropMultiplier),
  };
  
  return enemy;
}

/**
 * 计算敌人属性
 * 
 * 三层架构：
 * - 基础属性层：等级基础值
 * - 世界调整层：世界系数
 * - 个体调整层：难度系数 + 属性模板 + 功法装备
 */
function calculateEnemyStats(
  level: number,
  difficulty: number,
  attrTemplate: ReturnType<typeof getAttributeTemplate>,
  techEquip: EnemyTechniqueEquipmentResult,
  worldType: WorldType
): Enemy['stats'] {
  // 使用统一的属性计算器
  // 难度系数作为个体调整
  const baseStats = calculateStats({
    level,
    worldType,
    
    // 个体调整：难度系数
    difficultyMultiplier: difficulty,
    
    // 属性模板倍率
    hpMultiplier: attrTemplate.hpMultiplier,
    attackMultiplier: attrTemplate.attackMultiplier,
    defenseMultiplier: attrTemplate.defenseMultiplier,
    speedMultiplier: attrTemplate.speedMultiplier,
    
    // 功法装备加成
    bonusHp: techEquip.statBonus.hp,
    bonusAttack: techEquip.statBonus.attack,
    bonusDefense: techEquip.statBonus.defense,
    bonusMp: techEquip.statBonus.mp,
  });
  
  return {
    ...baseStats,
  };
}

/**
 * 生成敌人描述
 */
function generateEnemyDescription(template: EnemyTemplate, level: number): string {
  const templates = [
    template.descriptionTemplate,
    `${template.description}（等级${level}）`,
    `一个${template.name}，看起来很有威胁`,
  ];
  
  return templates.find(t => t) || `${template.name}`;
}

// ============================================
// 批量生成
// ============================================

/**
 * 批量生成配置
 */
export interface BatchGenerateConfig {
  worldType: WorldType;
  targetLevel: number;
  count: number;
  tierDistribution?: Record<EnemyTier, number>;
}

/**
 * 批量生成敌人
 */
export function generateEnemies(config: BatchGenerateConfig): Enemy[] {
  const {
    worldType,
    targetLevel,
    count,
    tierDistribution = { normal: 70, elite: 25, miniboss: 4, boss: 1 },
  } = config;
  
  const enemies: Enemy[] = [];
  
  for (let i = 0; i < count; i++) {
    // 随机选择tier
    const tier = weightedRandom(tierDistribution);
    
    enemies.push(generateEnemy({
      worldType,
      targetLevel,
      tier,
    }));
  }
  
  return enemies;
}

// ============================================
// 特殊生成
// ============================================

/**
 * 生成精英敌人
 */
export function generateEliteEnemy(
  worldType: WorldType,
  targetLevel: number
): Enemy {
  return generateEnemy({
    worldType,
    targetLevel,
    tier: 'elite',
    difficultyMultiplier: 1.2,
  });
}

/**
 * 生成小Boss
 */
export function generateMiniboss(
  worldType: WorldType,
  targetLevel: number
): Enemy {
  return generateEnemy({
    worldType,
    targetLevel,
    tier: 'miniboss',
    difficultyMultiplier: 1.5,
  });
}

/**
 * 生成Boss
 */
export function generateBoss(
  worldType: WorldType,
  targetLevel: number
): Enemy {
  return generateEnemy({
    worldType,
    targetLevel,
    tier: 'boss',
    difficultyMultiplier: 2.0,
  });
}

/**
 * 生成塔层敌人
 */
export function generateTowerEnemy(
  floorNumber: number,
  tier: EnemyTier = 'normal'
): Enemy {
  // 塔层等级：每层+1级，每10层+5级
  const baseLevel = Math.floor(floorNumber * 0.8) + 1;
  
  // 塔层难度随高度增加
  const difficultyMultiplier = 1 + (floorNumber * 0.02);
  
  // 塔层默认使用仙侠世界
  return generateEnemy({
    worldType: '仙侠',
    targetLevel: baseLevel,
    tier,
    difficultyMultiplier,
  });
}

/**
 * 生成塔层Boss
 */
export function generateTowerBoss(floorNumber: number): Enemy {
  return generateTowerEnemy(floorNumber, 'boss');
}

// ============================================
// 敌人刷新
// ============================================

/**
 * 刷新敌人状态（用于战斗开始时）
 */
export function refreshEnemy(enemy: Enemy): Enemy {
  return {
    ...enemy,
    currentHp: enemy.stats.maxHp,
    currentMp: enemy.stats.maxMp,
    skillCooldowns: {},
  };
}

/**
 * 刷新多个敌人
 */
export function refreshEnemies(enemies: Enemy[]): Enemy[] {
  return enemies.map(refreshEnemy);
}
