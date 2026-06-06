/**
 * 爬塔系统类型定义
 * 
 * 设计原则：
 * 1. 独立成长：爬塔进度独立于主线进度
 * 2. 渐进挑战：难度随层数递增
 * 3. 奖励关联：爬塔层数影响挂机收益
 * 4. 资源产出：作为碎片、材料、灵石的主要来源之一
 */

import { WorldType, ItemRarity, EnemyTier } from '../types';

// ============================================
// 爬塔状态
// ============================================

/**
 * 爬塔状态
 */
export type TowerState = 
  | 'IDLE'        // 空闲
  | 'SELECTING'   // 选择层数
  | 'PREPARING'   // 准备战斗
  | 'BATTLE'      // 战斗中
  | 'VICTORY'     // 胜利
  | 'DEFEAT'      // 失败
  | 'RETREAT'     // 撤退
  | 'CLAIM';      // 领取奖励

// ============================================
// 敌人相关
// ============================================

/**
 * 爬塔敌人
 */
export interface TowerEnemy {
  id: string;
  name: string;
  level: number;
  type: EnemyTier;
  floor: number;
  
  // 属性
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  attack: number;
  defense: number;
  
  // 功法
  techniques: string[];
  
  // Boss标记
  isBoss: boolean;
  
  // 奖励预览
  rewards: TowerRewards;
}

// ============================================
// 奖励系统
// ============================================

/**
 * 碎片掉落
 */
export interface FragmentDrop {
  type: 'technique' | 'equipment';
  rarity: ItemRarity;
  quantity: number;
}

/**
 * 材料掉落
 */
export interface MaterialDrop {
  id: string;
  rarity: ItemRarity;
  quantity: number;
}

/**
 * 爬塔战利品
 */
export interface TowerRewards {
  spiritStones: number;
  fragments: FragmentDrop[];
  materials: MaterialDrop[];
  experience: number;
  isFirstClear?: boolean;
}

// ============================================
// 掉落池系统
// ============================================

/**
 * 掉落池物品
 */
export interface DropPoolItem {
  id: string;
  type: 'fragment' | 'material';
  rarity: ItemRarity;
  quantity: number;
  addedAt: number;       // 添加时间戳
  sourceFloor: number;   // 来源层数
}

/**
 * 掉落池
 */
export interface DropPool {
  items: DropPoolItem[];
  totalSpiritStones: number;
  lastUpdated: number;
}

/**
 * 空掉落池
 */
export function createEmptyDropPool(): DropPool {
  return {
    items: [],
    totalSpiritStones: 0,
    lastUpdated: Date.now(),
  };
}

// ============================================
// 爬塔进度
// ============================================

/**
 * 爬塔进度
 */
export interface TowerProgress {
  /** 当前最高通关层数 */
  maxClearedFloor: number;
  /** 当前可挑战层数 */
  currentFloor: number;
  /** 已通关的层数记录（用于首通判断，序列化后为数组） */
  clearedFloors: Set<number> | number[];
  /** 今日挑战次数 */
  todayAttempts: number;
  /** 上次重置时间 */
  lastResetTime: number;
  /** 掉落池 */
  dropPool: DropPool;
  /** 累计获得灵石 */
  totalSpiritStonesEarned: number;
  /** 累计获得碎片数 */
  totalFragmentsEarned: number;
  /** 累计获得材料数 */
  totalMaterialsEarned: number;
}

/**
 * 创建默认爬塔进度
 */
export function createDefaultTowerProgress(): TowerProgress {
  return {
    maxClearedFloor: 0,
    currentFloor: 1,
    clearedFloors: new Set(),
    todayAttempts: 0,
    lastResetTime: Date.now(),
    dropPool: createEmptyDropPool(),
    totalSpiritStonesEarned: 0,
    totalFragmentsEarned: 0,
    totalMaterialsEarned: 0,
  };
}

// ============================================
// 挂机收益
// ============================================

/**
 * 离线收益
 */
export interface IdleRewards {
  experience: number;
  spiritStones: number;
  hp: number;
  mp: number;
  stamina: number;
  fragments: DropPoolItem[];
  materials: DropPoolItem[];
}

/**
 * 创建空收益
 */
export function createEmptyIdleRewards(): IdleRewards {
  return {
    experience: 0,
    spiritStones: 0,
    hp: 0,
    mp: 0,
    stamina: 0,
    fragments: [],
    materials: [],
  };
}

// ============================================
// 配置常量
// ============================================

/**
 * 爬塔配置
 */
export const TOWER_CONFIG = {
  // === 层数相关 ===
  minFloor: 1,
  maxFloor: 1000,
  bossFloorInterval: 10,
  
  // === 奖励 ===
  spiritStoneBase: 10,
  spiritStonePerFloor: 2,
  fragmentDropBase: 0.05,
  fragmentDropPerFloor: 0.002,
  materialDropRate: 0.3,
  
  // === 掉落池 ===
  dropPoolMaxSize: 100,
  dropPoolExpireDuration: 24 * 60 * 60 * 1000, // 24小时
  
  // === 挂机 ===
  maxOfflineDuration: 8 * 60 * 60 * 1000, // 8小时
  minOfflineDuration: 5 * 60 * 1000, // 5分钟
  offlineEfficiency: 0.3, // 30%
  patrolEfficiency: 0.5, // 50%
  
  // === 恢复 ===
  recoverHpPercentPerHour: 0.15,
  recoverMpPercentPerHour: 0.20,
  staminaRecoverInterval: 5 * 60 * 1000,
  staminaRecoverAmount: 1,
} as const;
