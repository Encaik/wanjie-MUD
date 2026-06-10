/**
 * 丹药境界处理模块
 * 
 * 处理丹药使用时的境界限制：
 * 1. 境界匹配：正常效果
 * 2. 境界过低（丹药高于玩家）：效果减半，有负面效果
 * 3. 境界过高（丹药低于玩家）：效果仅 10%，无负面效果
 */

import { Protagonist, StatKey, GrowthStats } from '@/core/types';
import { RealmSystem } from '@/modules/progression/data/realmData';

// 境界等级定义（用于比较）
// 数字越大，境界越高
export const REALM_TIERS = [
  '炼气', '筑基', '金丹', '元婴', '化神',
  '炼虚', '合体', '大乘', '渡劫', '仙人'
];

// 常见境界关键词映射到等级
const REALM_KEYWORDS: Record<string, number> = {
  // 修仙境界
  '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5,
  '炼虚': 6, '合体': 7, '大乘': 8, '渡劫': 9,
  '地仙': 10, '天仙': 11, '仙王': 12,
  
  // 高武境界
  '武徒': 1, '武士': 2, '武师': 3, '武将': 4, '武王': 5,
  '武皇': 6, '武帝': 7, '武圣': 8, '武神': 9, '武尊': 10,
  
  // 魔法境界
  '魔法学徒': 1, '见习法师': 2, '初级法师': 3, '中级法师': 4, '高级法师': 5,
  '大法师': 6, '魔导师': 7, '大魔导师': 8, '法圣': 9, '法神': 10,
  
  // 通用境界关键词
  '一阶': 1, '二阶': 2, '三阶': 3, '四阶': 4, '五阶': 5,
  '六阶': 6, '七阶': 7, '八阶': 8, '九阶': 9, '十阶': 10,
  '一重': 1, '二重': 2, '三重': 3, '四重': 4, '五重': 5,
  '六重': 6, '七重': 7, '八重': 8, '九重': 9, '圆满': 10,
};

// 丹药境界限制类型
export interface PillRealmRestriction {
  /** 最低适用境界等级（1-10） */
  minRealmLevel: number;
  /** 最高适用境界等级（1-10） */
  maxRealmLevel: number;
  /** 境界描述（用于显示） */
  realmDescription?: string;
}

// 丹药使用结果类型
export interface PillUseResult {
  /** 效果倍率（0-1） */
  effectMultiplier: number;
  /** 是否有负面效果 */
  hasSideEffect: boolean;
  /** 负面效果描述 */
  sideEffectMessage?: string;
  /** 负面效果数值 */
  sideEffect?: {
    stats?: Partial<GrowthStats>;
    hpLoss?: number;
    mpLoss?: number;
  };
  /** 结果消息 */
  message: string;
}

/**
 * 从境界名称中提取境界等级
 * @param realmName 境界名称（如"炼气期"、"金丹后期"等）
 * @param realmSystem 境界系统配置
 * @returns 境界等级（1-10）
 */
export function getRealmLevelFromName(
  realmName: string,
  realmSystem?: RealmSystem
): number {
  // 如果有境界系统配置，尝试从中获取等级
  if (realmSystem) {
    for (let i = 0; i < realmSystem.tiers.length; i++) {
      const tier = realmSystem.tiers[i];
      if (realmName.includes(tier.name)) {
        return i + 1;
      }
    }
  }
  
  // 使用关键词匹配
  for (const [keyword, level] of Object.entries(REALM_KEYWORDS)) {
    if (realmName.includes(keyword)) {
      return level;
    }
  }
  
  // 默认返回 1
  return 1;
}

/**
 * 从主角等级推算境界等级
 * @param level 主角等级
 * @returns 境界等级（1-10）
 */
export function getRealmLevelFromPlayerLevel(level: number): number {
  // 每 10 级对应一个大境界
  return Math.min(10, Math.ceil(level / 10));
}

/**
 * 获取主角当前境界等级
 * @param protagonist 主角数据
 * @returns 境界等级（1-10）
 */
export function getPlayerRealmLevel(protagonist: Protagonist): number {
  // 首先尝试从 realm 字段获取
  if (protagonist.realm) {
    const realmLevel = getRealmLevelFromName(
      protagonist.realm,
      protagonist.world.realmSystem
    );
    if (realmLevel > 0) return realmLevel;
  }
  
  // 其次从等级推算
  return getRealmLevelFromPlayerLevel(protagonist.level);
}

/**
 * 计算丹药使用效果
 * @param protagonist 主角数据
 * @param pillRealmLevel 丹药适用境界等级
 * @returns 使用结果
 */
export function calculatePillEffect(
  protagonist: Protagonist,
  pillRealmLevel: number
): PillUseResult {
  const playerRealmLevel = getPlayerRealmLevel(protagonist);
  const levelDiff = pillRealmLevel - playerRealmLevel;
  
  // 境界匹配（相差 1 以内）
  if (Math.abs(levelDiff) <= 1) {
    return {
      effectMultiplier: 1.0,
      hasSideEffect: false,
      message: '丹药效果正常发挥',
    };
  }
  
  // 境界过低（丹药高于玩家 2+ 个境界）
  if (levelDiff >= 2) {
    // 效果减半
    const effectMultiplier = 0.5;
    
    // 30% 概率出现负面效果
    const hasSideEffect = Math.random() < 0.3;
    
    if (hasSideEffect) {
      // 随机生成负面效果
      const sideEffect: PillUseResult['sideEffect'] = {};
      
      // 随机减少属性
      const statsAffected: StatKey[] = ['体质', '灵根', '悟性', '意志', '幸运'];
      const affectedStat = statsAffected[Math.floor(Math.random() * statsAffected.length)];
      const reduction = Math.floor(Math.random() * 3) + 1; // 1-3 点
      sideEffect.stats = { [affectedStat]: -reduction };
      
      return {
        effectMultiplier,
        hasSideEffect: true,
        sideEffect,
        sideEffectMessage: `药力过于霸道，${affectedStat}受损 ${reduction} 点！`,
        message: `境界不足以驾驭此丹药，效果减半，且出现反噬！`,
      };
    }
    
    return {
      effectMultiplier,
      hasSideEffect: false,
      message: `境界不足以完全驾驭此丹药，效果减半`,
    };
  }
  
  // 境界过高（丹药低于玩家 2+ 个境界）
  if (levelDiff <= -2) {
    return {
      effectMultiplier: 0.1,
      hasSideEffect: false,
      message: `此丹药对你的境界而言效果微乎其微`,
    };
  }
  
  // 相差 2 个境界的情况
  if (levelDiff === 2) {
    return {
      effectMultiplier: 0.7,
      hasSideEffect: Math.random() < 0.15,
      message: `勉强能使用此丹药，效果略有折扣`,
    };
  }
  
  if (levelDiff === -2) {
    return {
      effectMultiplier: 0.3,
      hasSideEffect: false,
      message: `此丹药对你来说效果有限`,
    };
  }
  
  return {
    effectMultiplier: 1.0,
    hasSideEffect: false,
    message: '丹药效果正常发挥',
  };
}

/**
 * 根据丹药配方等级计算适用境界等级
 * @param unlockLevel 丹药解锁等级
 * @returns 境界等级（1-10）
 */
export function getPillRealmLevel(unlockLevel: number): number {
  // 丹药的适用境界等级基于解锁等级
  // 低级丹药（1-10级解锁）-> 境界 1-2
  // 中级丹药（11-20级解锁）-> 境界 2-4
  // 高级丹药（21-30级解锁）-> 境界 4-6
  // 顶级丹药（31+级解锁）-> 境界 6+
  return Math.min(10, Math.ceil(unlockLevel / 10) + 1);
}

/**
 * 获取丹药境界描述
 * @param realmLevel 境界等级
 * @returns 境界描述
 */
export function getPillRealmDescription(realmLevel: number): string {
  const descriptions: Record<number, string> = {
    1: '炼气期适用',
    2: '筑基期适用',
    3: '金丹期适用',
    4: '元婴期适用',
    5: '化神期适用',
    6: '炼虚期适用',
    7: '合体期适用',
    8: '大乘期适用',
    9: '渡劫期适用',
    10: '仙人适用',
  };
  
  return descriptions[realmLevel] || `第${realmLevel}阶适用`;
}
