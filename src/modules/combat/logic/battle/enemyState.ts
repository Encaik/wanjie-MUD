/**
 * 多敌人战斗状态管理
 * 
 * 设计原则：
 * 1. 支持多敌人战斗
 * 2. 保持与单敌人的兼容性
 * 3. 清晰的行动顺序管理
 */

import type { EnemyTier } from '@/core/types';
import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import { EnemyAttributes } from '@/modules/combat/logic/restraintSystem';

import { BattleSkill } from './types';

// ============================================
// 战斗敌人状态
// ============================================

/** 战斗中的敌人状态 */
export interface BattleEnemy {
  /** 敌人唯一ID */
  id: string;
  /** 敌人名称 */
  name: string;
  /** 敌人等级 */
  level: number;
  /** 敌人类型 */
  tier: EnemyTier;
  
  // 属性
  /** 最大HP */
  maxHp: number;
  /** 当前HP */
  currentHp: number;
  /** 最大MP */
  maxMp: number;
  /** 当前MP */
  currentMp: number;
  /** 攻击力 */
  attack: number;
  /** 防御力 */
  defense: number;
  
  // 战斗状态
  /** 是否存活 */
  isAlive: boolean;
  /** 是否被眩晕 */
  isStunned: boolean;
  /** 眩晕剩余回合 */
  stunRounds: number;
  
  // 技能
  /** 可用技能 */
  skills: BattleSkill[];
  /** 技能冷却 Map */
  skillCooldowns: Map<string, number>;
  
  // Buff/Debuff
  /** 身上的Buff/Debuff */
  buffs: BattleEnemyBuff[];
  
  // 属性
  /** 敌人属性（元素、武器类型） */
  attributes: EnemyAttributes;
  
  // 战斗数据
  /** 对玩家造成的总伤害 */
  totalDamageDealt: number;
  /** 受到的总伤害 */
  totalDamageTaken: number;
}

/** 敌人Buff */
export interface BattleEnemyBuff {
  /** Buff ID */
  id: string;
  /** Buff名称 */
  name: string;
  /** 影响的属性 */
  stat: 'attack' | 'defense' | 'speed' | 'all';
  /** 固定值 */
  value: number;
  /** 百分比 */
  percent?: number;
  /** 剩余回合 */
  remainingRounds: number;
  /** 来源 */
  source: string;
}

// ============================================
// 行动顺序
// ============================================

/** 行动顺序条目 */
export interface TurnOrderEntry {
  /** 行动者类型 */
  actorType: 'player' | 'enemy';
  /** 敌人索引（仅敌人行动时有效） */
  enemyIndex?: number;
  /** 敌人ID（仅敌人行动时有效） */
  enemyId?: string;
  /** 速度值 */
  speed: number;
  /** 是否已行动 */
  acted: boolean;
}

// ============================================
// 辅助函数
// ============================================

/** 创建战斗敌人 */
export function createBattleEnemy(
  id: string,
  name: string,
  level: number,
  tier: EnemyTier,
  maxHp: number,
  attack: number,
  defense: number,
  skills: BattleSkill[] = [],
  attributes: EnemyAttributes,
  maxMp: number = 0
): BattleEnemy {
  return {
    id,
    name,
    level,
    tier,
    maxHp,
    currentHp: maxHp,
    maxMp,
    currentMp: maxMp,
    attack,
    defense,
    isAlive: true,
    isStunned: false,
    stunRounds: 0,
    skills,
    skillCooldowns: new Map(),
    buffs: [],
    attributes,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
  };
}

/** 获取存活敌人列表 */
export function getAliveEnemies(enemies: BattleEnemy[]): BattleEnemy[] {
  return enemies.filter(e => e.isAlive && e.currentHp > 0);
}

/** 获取存活敌人数量 */
export function getAliveEnemyCount(enemies: BattleEnemy[]): number {
  return getAliveEnemies(enemies).length;
}

/** 检查所有敌人是否已死亡 */
export function areAllEnemiesDefeated(enemies: BattleEnemy[]): boolean {
  return getAliveEnemyCount(enemies) === 0;
}

/** 计算行动顺序（基于速度） */
export function calculateTurnOrder(
  playerSpeed: number,
  enemies: BattleEnemy[]
): TurnOrderEntry[] {
  const entries: TurnOrderEntry[] = [];
  
  // 添加玩家
  entries.push({
    actorType: 'player',
    speed: playerSpeed,
    acted: false,
  });
  
  // 添加存活的敌人
  enemies.forEach((enemy, index) => {
    if (enemy.isAlive) {
      // 速度 = 基础速度 + 等级 * 0.5
      const baseSpeed = 10 + enemy.level * 0.5;
      const buffSpeed = enemy.buffs
        .filter(b => b.stat === 'speed' || b.stat === 'all')
        .reduce((sum, b) => sum + b.value + (b.percent ? baseSpeed * b.percent : 0), 0);
      
      entries.push({
        actorType: 'enemy',
        enemyIndex: index,
        enemyId: enemy.id,
        speed: baseSpeed + buffSpeed,
        acted: false,
      });
    }
  });
  
  // 按速度降序排列
  return entries.sort((a, b) => b.speed - a.speed);
}

/** 获取下一个行动者 */
export function getNextActor(turnOrder: TurnOrderEntry[]): TurnOrderEntry | null {
  return turnOrder.find(entry => !entry.acted) || null;
}

/** 重置行动顺序（新回合） */
export function resetTurnOrder(turnOrder: TurnOrderEntry[]): TurnOrderEntry[] {
  return turnOrder.map(entry => ({ ...entry, acted: false }));
}

/** 更新敌人技能冷却 */
export function updateEnemySkillCooldowns(enemy: BattleEnemy): void {
  const newCooldowns = new Map<string, number>();
  enemy.skillCooldowns.forEach((remaining, skillId) => {
    if (remaining > 1) {
      newCooldowns.set(skillId, remaining - 1);
    }
  });
  enemy.skillCooldowns = newCooldowns;
}

/** 更新敌人Buff */
export function updateEnemyBuffs(enemy: BattleEnemy): void {
  enemy.buffs = enemy.buffs
    .map(buff => ({ ...buff, remainingRounds: buff.remainingRounds - 1 }))
    .filter(buff => buff.remainingRounds > 0);
}

/** 应用伤害到敌人 */
export function applyDamageToEnemy(enemy: BattleEnemy, damage: number): void {
  enemy.currentHp = Math.max(0, enemy.currentHp - damage);
  enemy.totalDamageTaken += damage;
  if (enemy.currentHp <= 0) {
    enemy.isAlive = false;
  }
}

/** 应用治疗到敌人 */
export function applyHealToEnemy(enemy: BattleEnemy, healing: number): void {
  if (!enemy.isAlive) return;
  enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + healing);
}

/** 获取敌人总攻击力（含Buff） */
export function getEnemyTotalAttack(enemy: BattleEnemy): number {
  let attack = enemy.attack;
  enemy.buffs.forEach(buff => {
    if (buff.stat === 'attack' || buff.stat === 'all') {
      attack += buff.value;
      if (buff.percent) {
        attack += enemy.attack * buff.percent;
      }
    }
  });
  return Math.max(1, Math.floor(attack));
}

/** 获取敌人总防御力（含Buff） */
export function getEnemyTotalDefense(enemy: BattleEnemy): number {
  let defense = enemy.defense;
  enemy.buffs.forEach(buff => {
    if (buff.stat === 'defense' || buff.stat === 'all') {
      defense += buff.value;
      if (buff.percent) {
        defense += enemy.defense * buff.percent;
      }
    }
  });
  return Math.max(0, Math.floor(defense));
}
