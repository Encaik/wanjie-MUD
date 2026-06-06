/**
 * 战斗相关类型定义
 */

import { EnemyTier } from './base';
import { CharacterStats } from './character';
import { InventoryItem } from './item';

// 战斗记录
export interface BattleLog {
  round: number;
  attacker: 'player' | 'enemy';
  action: string;
  damage?: number;
  heal?: number;
  special?: string;
}

// 战斗状态
export interface BattleState {
  enemyName: string;
  enemyMaxHp: number;
  enemyCurrentHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemyLevel: number;
  enemyRealm: string;
  enemyTier?: EnemyTier;
  enemyCombatPower: number;
  playerMaxHp: number;
  playerCurrentHp: number;
  playerMaxMp: number;
  playerCurrentMp: number;
  playerAttack: number;
  playerDefense: number;
  playerCombatPower: number;
  logs: BattleLog[];
  currentRound: number;
  isOver: boolean;
  victory?: boolean;
}

// 机缘战斗结果
export interface BattleResult {
  victory: boolean;
  message: string;
  battleState?: BattleState;
  rewards?: {
    stats?: Partial<CharacterStats>;
    items?: InventoryItem[];
    experience?: number;
    technique?: import('./technique').Technique;
    equipment?: import('./equipment').Equipment;
  };
  hpRestored?: number;
  mpRestored?: number;
  playerHpAfter?: number;
  playerMpAfter?: number;
}

// 历练事件选项
export interface EventChoice {
  text: string;
  effects: {
    stats?: Partial<CharacterStats>;
    items?: InventoryItem[];
    experience?: number;
    special?: string;
  };
  result: string;
  battle?: {
    enemyType: 'enemy' | 'boss';
    levelOffset?: number;
  };
}

// 历练事件
export interface AdventureEvent {
  id: number;
  title: string;
  description: string;
  choices: EventChoice[];
}

// 机缘冒险格子
export interface AdventureCell {
  type: import('./base').CellType;
  cleared: boolean;
  content?: string;
  portalTarget?: { row: number; col: number };
  visited?: boolean;
}

// 秘境难度配置
export interface DungeonConfig {
  rows: number;
  cols: number;
  difficulty: number;
  realmName: string;
  enemyLevelMin: number;
  enemyLevelMax: number;
  rewardMultiplier: number;
  portalCount: number;
  difficultyLevel?: 'easy' | 'normal' | 'hard' | 'nightmare';
  requiredPower?: number;
}
