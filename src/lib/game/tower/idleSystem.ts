/**
 * 离线挂机系统
 * 
 * 核心设计：
 * - 离线时获得固定奖励：货币（灵石）、经验、物品（碎片/材料）
 * - 奖励基于玩家等级和爬塔层数计算
 * - 不区分挂机模式，统一计算
 * 
 * 奖励计算：
 * 1. 灵石 = (基础值 + 等级系数 × 层数系数) × 小时数 × 效率
 * 2. 经验值 = (基础值 + 等级系数) × 小时数 × 效率 × 层数加成
 * 3. 物品掉落 = 基于层数的固定掉落
 */

import { WorldType, ItemRarity } from '../types';
import {
  IdleRewards,
  DropPool,
  DropPoolItem,
  TOWER_CONFIG,
  createEmptyIdleRewards,
} from './types';

// ============================================
// 类型定义
// ============================================

/**
 * 离线处理结果
 */
export interface OfflineProcessResult {
  /** 离线时长（毫秒） */
  offlineDuration: number;
  /** 离线时长描述 */
  offlineDurationText: string;
  /** 收益 */
  rewards: IdleRewards;
  /** 体力恢复 */
  staminaRecovered: number;
  /** 当前体力（恢复后） */
  currentStamina: number;
}

// ============================================
// 工具函数
// ============================================

/**
 * 格式化离线时长
 */
export function formatOfflineDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}天${remainingHours}小时`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes}分钟`;
  }
  
  if (minutes > 0) {
    return `${minutes}分钟`;
  }
  
  return `${seconds}秒`;
}

/**
 * 获取世界收益系数
 */
function getWorldMultiplier(worldType: WorldType): number {
  const multipliers: Record<WorldType, number> = {
    '修仙': 1.0,
    '高武': 1.0,
    '科技': 0.9,
    '魔幻': 1.1,
    '异能': 1.0,
    '仙侠': 1.0,
    '武侠': 0.95,
    '末世': 1.05,
  };
  return multipliers[worldType] || 1.0;
}

// ============================================
// 核心计算函数
// ============================================

/**
 * 计算挂机收益参数
 */
export interface IdleCalculationParams {
  playerLevel: number;
  worldType: WorldType;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  currentStamina: number;
  maxStamina: number;
  maxFloor: number;
  dropPool: DropPool;
  offlineDuration: number;
}

/**
 * 计算离线挂机收益
 * 
 * 统一计算：灵石、经验、物品掉落
 */
export function calculateIdleRewards(params: IdleCalculationParams): IdleRewards {
  const config = TOWER_CONFIG;
  const { offlineDuration } = params;
  
  // 有效时长（上限保护）
  const effectiveDuration = Math.min(offlineDuration, config.maxOfflineDuration);
  
  // 检查最小时长
  if (effectiveDuration < config.minOfflineDuration) {
    return createEmptyIdleRewards();
  }
  
  const hours = effectiveDuration / (60 * 60 * 1000);
  const worldMultiplier = getWorldMultiplier(params.worldType);
  const maxFloor = Math.max(params.maxFloor, 1); // 至少按1层计算
  
  // ============================================
  // 1. 灵石奖励
  // ============================================
  // 灵石 = (基础值 + 等级 × 系数 + 层数 × 系数) × 小时数 × 效率
  const baseSpiritStones = config.spiritStoneBase;
  const levelBonus = params.playerLevel * 5;
  const floorBonus = maxFloor * 10;
  const spiritStones = Math.floor(
    (baseSpiritStones + levelBonus + floorBonus) * hours * config.offlineEfficiency * worldMultiplier
  );
  
  // ============================================
  // 2. 经验值奖励
  // ============================================
  // 经验 = (基础值 + 等级系数) × 小时数 × 效率 × 层数加成
  const baseExp = config.spiritStoneBase + params.playerLevel * config.spiritStonePerFloor;
  const expFloorBonus = 1 + Math.floor(maxFloor / 10) * 0.1;
  const experience = Math.floor(
    baseExp * hours * config.offlineEfficiency * worldMultiplier * expFloorBonus
  );
  
  // ============================================
  // 3. HP/MP 恢复
  // ============================================
  const hpRecoverRate = config.recoverHpPercentPerHour * hours;
  const hpGain = Math.min(
    params.maxHp - params.currentHp,
    Math.floor(params.maxHp * hpRecoverRate)
  );
  
  const mpRecoverRate = config.recoverMpPercentPerHour * hours;
  const mpGain = Math.min(
    params.maxMp - params.currentMp,
    Math.floor(params.maxMp * mpRecoverRate)
  );
  
  // ============================================
  // 4. 体力恢复
  // ============================================
  const staminaRecoveries = Math.floor(
    effectiveDuration / config.staminaRecoverInterval
  ) * config.staminaRecoverAmount;
  const staminaGain = Math.min(
    params.maxStamina - params.currentStamina,
    staminaRecoveries
  );
  
  // ============================================
  // 5. 物品掉落（碎片/材料）
  // ============================================
  const fragments: DropPoolItem[] = [];
  const materials: DropPoolItem[] = [];
  
  // 基于层数计算固定掉落
  // 每小时掉落次数 = 层数 / 20（最少1次，最多10次）
  const dropsPerHour = Math.min(Math.max(Math.floor(maxFloor / 20), 1), 10);
  const totalDrops = Math.floor(dropsPerHour * hours);
  
  const now = Date.now();
  
  for (let i = 0; i < totalDrops; i++) {
    // 品质基于层数
    const rarityFloorBonus = Math.floor(maxFloor / 50);
    const rarities: ItemRarity[] = ['普通', '稀有', '史诗', '传说', '神话'];
    const maxRarityIndex = Math.min(rarityFloorBonus, rarities.length - 1);
    const rarityIndex = Math.floor(Math.random() * (maxRarityIndex + 1));
    const rarity = rarities[rarityIndex];
    
    // 70% 碎片，30% 材料
    if (Math.random() < 0.7) {
      fragments.push({
        id: `fragment_${now}_${i}`,
        type: 'fragment',
        rarity,
        quantity: 1,
        addedAt: now,
        sourceFloor: maxFloor,
      });
    } else {
      materials.push({
        id: `material_${now}_${i}`,
        type: 'material',
        rarity,
        quantity: 1,
        addedAt: now,
        sourceFloor: maxFloor,
      });
    }
  }
  
  return {
    experience,
    spiritStones,
    hp: Math.max(0, hpGain),
    mp: Math.max(0, mpGain),
    stamina: Math.max(0, staminaGain),
    fragments,
    materials,
  };
}

// ============================================
// 预期收益计算（用于UI展示）
// ============================================

/**
 * 计算预期挂机收益（8小时）
 */
export function estimateIdleRewards(
  playerLevel: number,
  worldType: WorldType,
  maxFloor: number
): IdleRewards {
  const mockParams: IdleCalculationParams = {
    playerLevel,
    worldType,
    currentHp: 0,
    maxHp: 1000,
    currentMp: 0,
    maxMp: 500,
    currentStamina: 0,
    maxStamina: 100,
    maxFloor,
    dropPool: { items: [], totalSpiritStones: 0, lastUpdated: Date.now() },
    offlineDuration: TOWER_CONFIG.maxOfflineDuration,
  };
  
  return calculateIdleRewards(mockParams);
}

// ============================================
// 离线处理入口
// ============================================

/**
 * 处理离线时间
 */
export function processOfflineTime(
  params: IdleCalculationParams
): OfflineProcessResult {
  const offlineDuration = Math.min(
    params.offlineDuration,
    TOWER_CONFIG.maxOfflineDuration
  );
  
  const rewards = calculateIdleRewards({
    ...params,
    offlineDuration,
  });
  
  // 体力恢复
  const staminaRecovered = rewards.stamina;
  const currentStamina = params.currentStamina + rewards.stamina;
  
  return {
    offlineDuration,
    offlineDurationText: formatOfflineDuration(offlineDuration),
    rewards,
    staminaRecovered,
    currentStamina,
  };
}
