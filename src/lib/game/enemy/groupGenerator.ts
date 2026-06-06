/**
 * 敌人组生成器
 * 
 * 核心职责：
 * 1. 生成敌人组（1vN战斗支持）
 * 2. 计算行动顺序
 * 3. 管理敌人组配置
 */

import { WorldType } from '../types';
import {
  EnemyGroup,
  EnemyGroupConfig,
  TurnOrderEntry,
  EnemyGroupType,
  ENEMY_GROUP_CONFIG,
  Enemy,
} from './types';
import {
  generateEnemy,
} from './generator';

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

// ============================================
// 敌人组生成
// ============================================

/**
 * 敌人组生成配置
 */
export interface GroupGeneratorConfig {
  worldType: WorldType;
  targetLevel: number;
  groupType?: EnemyGroupType;
  difficultyMultiplier?: number;
}

/**
 * 生成敌人组
 */
export function generateEnemyGroup(config: GroupGeneratorConfig): EnemyGroup {
  const {
    worldType,
    targetLevel,
    groupType = 'patrol',
    difficultyMultiplier = 1.0,
  } = config;
  
  // 获取组配置
  const groupConfig = ENEMY_GROUP_CONFIG[groupType];
  
  // 生成敌人
  const enemies = generateEnemiesForGroup(
    worldType,
    targetLevel,
    groupConfig,
    difficultyMultiplier
  );
  
  // 计算行动顺序
  const turnOrder = calculateTurnOrder(enemies);
  
  // 生成组描述
  const description = generateGroupDescription(groupType, enemies);
  
  return {
    enemies,
    turnOrder,
    currentTurnIndex: 0,
    groupType,
    description,
    totalExp: enemies.reduce((sum, e) => sum + e.expMultiplier * e.level * 10, 0),
  };
}

/**
 * 为组生成敌人
 */
function generateEnemiesForGroup(
  worldType: WorldType,
  targetLevel: number,
  config: EnemyGroupConfig,
  difficultyMultiplier: number
): Enemy[] {
  const enemies: Enemy[] = [];
  
  // 生成普通敌人
  const normalCount = randomInt(config.normalCount.min, config.normalCount.max);
  for (let i = 0; i < normalCount; i++) {
    enemies.push(generateEnemy({
      worldType,
      targetLevel,
      tier: 'normal',
      difficultyMultiplier,
    }));
  }
  
  // 生成精英敌人
  const eliteCount = randomInt(config.eliteCount.min, config.eliteCount.max);
  for (let i = 0; i < eliteCount; i++) {
    enemies.push(generateEnemy({
      worldType,
      targetLevel,
      tier: 'elite',
      difficultyMultiplier: difficultyMultiplier * 1.2,
    }));
  }
  
  // 生成小Boss
  const minibossCount = randomInt(config.minibossCount.min, config.minibossCount.max);
  for (let i = 0; i < minibossCount; i++) {
    enemies.push(generateEnemy({
      worldType,
      targetLevel,
      tier: 'miniboss',
      difficultyMultiplier: difficultyMultiplier * 1.5,
    }));
  }
  
  // 生成Boss
  const bossCount = randomInt(config.bossCount.min, config.bossCount.max);
  for (let i = 0; i < bossCount; i++) {
    enemies.push(generateEnemy({
      worldType,
      targetLevel,
      tier: 'boss',
      difficultyMultiplier: difficultyMultiplier * 2.0,
    }));
  }
  
  return enemies;
}

/**
 * 计算行动顺序
 * 
 * 基于速度值排序，速度相同时随机决定
 */
export function calculateTurnOrder(enemies: Enemy[]): TurnOrderEntry[] {
  const entries: TurnOrderEntry[] = enemies.map((enemy, index) => ({
    enemyId: enemy.id,
    enemyIndex: index,
    speed: enemy.stats.speed,
    baseSpeed: enemy.stats.speed,
    acted: false,
  }));
  
  // 按速度排序（降序）
  entries.sort((a, b) => {
    // 速度相同时，随机决定
    if (a.speed === b.speed) {
      return Math.random() - 0.5;
    }
    return b.speed - a.speed;
  });
  
  return entries;
}

/**
 * 生成组描述
 */
function generateGroupDescription(
  groupType: EnemyGroupType,
  enemies: Enemy[]
): string {
  const count = enemies.length;
  const hasBoss = enemies.some(e => e.tier === 'boss');
  const hasElite = enemies.some(e => e.tier === 'elite' || e.tier === 'miniboss');
  
  const typeDescriptions: Record<EnemyGroupType, string> = {
    patrol: '巡逻的敌人',
    elite: '精英小队',
    miniboss: '强大的敌人',
    boss: 'Boss战',
    ambush: '伏击的敌人',
  };
  
  let description = typeDescriptions[groupType] || '敌人';
  
  if (hasBoss) {
    description = `Boss战：${enemies.find(e => e.tier === 'boss')?.name || 'Boss'}`;
  } else if (hasElite) {
    description = `精英小队（${count}个敌人）`;
  } else if (count > 1) {
    description = `敌人小队（${count}个敌人）`;
  } else {
    description = enemies[0]?.name || '敌人';
  }
  
  return description;
}

// ============================================
// 特殊组生成
// ============================================

/**
 * 生成巡逻组
 */
export function generatePatrolGroup(
  worldType: WorldType,
  targetLevel: number
): EnemyGroup {
  return generateEnemyGroup({
    worldType,
    targetLevel,
    groupType: 'patrol',
  });
}

/**
 * 生成精英组
 */
export function generateEliteGroup(
  worldType: WorldType,
  targetLevel: number
): EnemyGroup {
  return generateEnemyGroup({
    worldType,
    targetLevel,
    groupType: 'elite',
  });
}

/**
 * 生成小Boss战
 */
export function generateMinibossBattle(
  worldType: WorldType,
  targetLevel: number
): EnemyGroup {
  return generateEnemyGroup({
    worldType,
    targetLevel,
    groupType: 'miniboss',
  });
}

/**
 * 生成Boss战
 */
export function generateBossBattle(
  worldType: WorldType,
  targetLevel: number
): EnemyGroup {
  return generateEnemyGroup({
    worldType,
    targetLevel,
    groupType: 'boss',
  });
}

/**
 * 生成伏击组
 */
export function generateAmbushGroup(
  worldType: WorldType,
  targetLevel: number
): EnemyGroup {
  return generateEnemyGroup({
    worldType,
    targetLevel,
    groupType: 'ambush',
  });
}

// ============================================
// 行动顺序管理
// ============================================

/**
 * 获取当前行动的敌人
 */
export function getCurrentActingEnemy(group: EnemyGroup): Enemy | undefined {
  if (group.turnOrder.length === 0) return undefined;
  
  // 找到第一个未行动的敌人
  for (const entry of group.turnOrder) {
    if (!entry.acted) {
      return group.enemies[entry.enemyIndex];
    }
  }
  
  return undefined;
}

/**
 * 标记敌人已行动
 */
export function markEnemyActed(group: EnemyGroup, enemyId: string): EnemyGroup {
  const newTurnOrder = group.turnOrder.map(entry => {
    if (entry.enemyId === enemyId) {
      return { ...entry, acted: true };
    }
    return entry;
  });
  
  return {
    ...group,
    turnOrder: newTurnOrder,
  };
}

/**
 * 检查是否所有敌人都已行动
 */
export function isAllEnemiesActed(group: EnemyGroup): boolean {
  return group.turnOrder.every(entry => entry.acted);
}

/**
 * 重置行动状态（新回合开始）
 */
export function resetTurnOrder(group: EnemyGroup): EnemyGroup {
  const newTurnOrder = group.turnOrder.map(entry => ({
    ...entry,
    acted: false,
  }));
  
  return {
    ...group,
    turnOrder: newTurnOrder,
    currentTurnIndex: 0,
  };
}

/**
 * 移除已击败的敌人
 */
export function removeDefeatedEnemy(
  group: EnemyGroup,
  enemyId: string
): EnemyGroup {
  // 找到敌人索引
  const enemyIndex = group.enemies.findIndex(e => e.id === enemyId);
  if (enemyIndex === -1) return group;
  
  // 移除敌人
  const newEnemies = group.enemies.filter(e => e.id !== enemyId);
  
  // 移除行动顺序条目
  const newTurnOrder = group.turnOrder
    .filter(entry => entry.enemyId !== enemyId)
    .map(entry => ({
      ...entry,
      enemyIndex: entry.enemyIndex > enemyIndex 
        ? entry.enemyIndex - 1 
        : entry.enemyIndex,
    }));
  
  return {
    ...group,
    enemies: newEnemies,
    turnOrder: newTurnOrder,
    description: generateGroupDescription(group.groupType, newEnemies),
  };
}

/**
 * 检查敌人组是否已被击败
 */
export function isGroupDefeated(group: EnemyGroup): boolean {
  return group.enemies.length === 0;
}

// ============================================
// 冷却管理
// ============================================

/**
 * 更新敌人组的技能冷却
 */
export function updateGroupCooldowns(group: EnemyGroup): EnemyGroup {
  const newEnemies = group.enemies.map(enemy => {
    const newCooldowns: Record<string, number> = {};
    
    for (const [skillId, cooldown] of Object.entries(enemy.skillCooldowns)) {
      if (cooldown > 1) {
        newCooldowns[skillId] = cooldown - 1;
      }
    }
    
    return {
      ...enemy,
      skillCooldowns: newCooldowns,
    };
  });
  
  return {
    ...group,
    enemies: newEnemies,
  };
}

/**
 * 设置技能冷却
 */
export function setSkillCooldown(
  group: EnemyGroup,
  enemyId: string,
  skillId: string,
  cooldown: number
): EnemyGroup {
  const newEnemies = group.enemies.map(enemy => {
    if (enemy.id === enemyId) {
      return {
        ...enemy,
        skillCooldowns: {
          ...enemy.skillCooldowns,
          [skillId]: cooldown,
        },
      };
    }
    return enemy;
  });
  
  return {
    ...group,
    enemies: newEnemies,
  };
}

// ============================================
// 塔层敌人组
// ============================================

/**
 * 生成塔层敌人组
 */
export function generateTowerEnemyGroup(
  floorNumber: number
): EnemyGroup {
  // 每5层有小Boss，每10层有Boss
  const isBossFloor = floorNumber % 10 === 0;
  const isMinibossFloor = floorNumber % 5 === 0 && !isBossFloor;
  
  // 塔层等级
  const baseLevel = Math.floor(floorNumber * 0.8) + 1;
  
  // 塔层难度随高度增加
  const difficultyMultiplier = 1 + (floorNumber * 0.02);
  
  // 塔层默认使用仙侠世界
  if (isBossFloor) {
    return generateEnemyGroup({
      worldType: '仙侠',
      targetLevel: baseLevel,
      groupType: 'boss',
      difficultyMultiplier,
    });
  }
  
  if (isMinibossFloor) {
    return generateEnemyGroup({
      worldType: '仙侠',
      targetLevel: baseLevel,
      groupType: 'miniboss',
      difficultyMultiplier,
    });
  }
  
  return generateEnemyGroup({
    worldType: '仙侠',
    targetLevel: baseLevel,
    groupType: 'patrol',
    difficultyMultiplier,
  });
}
