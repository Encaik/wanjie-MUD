/**
 * 世界数据配置文件
 * 定义每个世界的基础属性和数值设定
 * 玩家和敌人的数值都基于世界的属性进行计算
 */

import { WorldViewRegistry } from '@/core/registry';
import { WorldType, CellType, EnemyTier, WorldDifficulty } from '@/core/types';

// 重新导出 EnemyTier（从 types 导入）
export type { EnemyTier } from '@/core/types';

/**
 * 世界类型权威列表
 *
 * 从 WorldDataRegistry 获取已注册的世界类型。
 * 不再硬编码——所有世界类型通过 Mod 加载。
 */
export function getWorldTypes(): WorldType[] {
  return WorldViewRegistry.getInstance().getAllIds() as WorldType[];
}

/**
 * 获取所有已注册的世界观 ID 列表
 * 新代码应使用此函数，替代 getWorldTypes()
 */
export function getWorldviewIds(): string[] {
  return WorldViewRegistry.getInstance().getAllIds();
}

// ============================================
// 世界基础数值配置
// 世界数据定义
// ============================================

/* * @deprecated 数据已迁移到 mods/wanjie-core 的 WorldViewRegistry。 */
// ============================================
// 难度系数配置
// ============================================

/**
 * 难度系数配置
 * 用于调整敌人数值，不同难度只通过系数影响
 */
export const DIFFICULTY_MULTIPLIERS = {
  /** 简单难度 */
  easy: {
    hpMultiplier: 0.8,
    attackMultiplier: 0.85,
    defenseMultiplier: 0.85,
    expMultiplier: 0.9,
    rewardMultiplier: 0.8,
  },
  /** 普通难度 */
  normal: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    expMultiplier: 1.0,
    rewardMultiplier: 1.0,
  },
  /** 困难难度 */
  hard: {
    hpMultiplier: 1.3,
    attackMultiplier: 1.2,
    defenseMultiplier: 1.2,
    expMultiplier: 1.3,
    rewardMultiplier: 1.5,
  },
  /** 噩梦难度 */
  nightmare: {
    hpMultiplier: 1.8,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.5,
    expMultiplier: 1.8,
    rewardMultiplier: 2.5,
  },
};

export type DifficultyLevel = keyof typeof DIFFICULTY_MULTIPLIERS;

// ============================================
// 辅助函数
// ============================================

/**
 * 获取世界数据
 */
// getWorldData 等查询函数已删除。
// 前端所需世界数据通过后端 API 返回的 World / Protagonist 对象获取
// （protagonist.world.worldStats 包含 WorldBalanceStats 数值）。

// ============================================
// 敌人分级系统
// ============================================

/**
 * 敌人分级配置
 * 
 * 设计理念：
 * - 普通(enemy)：最菜的怪，和主角成长曲线差不多，玩家裸装可轻松击败
 * - 精英(elite)：比普通强，玩家需要一些功法或装备优势
 * - 小Boss(miniboss)：需要较好的功法和装备才能击败
 * - Boss：最强，需要满级功法和传说装备才能击败
 * 
 * 功法加成范围：
 * - 普通功法：3-8% / 稀有功法：8-15% / 史诗功法：15-25% / 传说功法：25-40%
 * - 3个功法槽位，最高加成约 120%
 * 
 * 装备加成范围：
 * - 普通装备：2-5% / 稀有装备：5-10% / 史诗装备：10-20% / 传说装备：20-35%
 * - 攻击槽位（近战+远程）：最高加成约 70%
 * - 防御槽位（头+身+腿+脚）：最高加成约 140%
 * 
 * 总加成上限：
 * - 攻击：约 190%（功法120% + 装备70%）
 * - 防御：约 260%（功法120% + 装备140%）
 * 
 * 新设计：敌人拥有独立的指数成长曲线，分级系数合理调整
 * - 低等级敌人接近玩家属性，高等级敌人逐渐拉开差距
 * - Boss需要接近的等级和较好的功法/装备才能挑战
 */
/**
 * 敌人分级配置项类型
 */
export interface EnemyTierConfigItem {
  name: string;
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  expMultiplier: number;
  rewardMultiplier: number;
  dropChance: {
    technique: number;
    equipment: number;
  };
  variance: number;
}

/**
 * 敌人分级配置
 * 
 * 设计理念：
 * - 敌人使用与玩家完全相同的属性公式
 * - 敌人等级决定其"裸装"属性
 * - 分级系数模拟敌人的"功法/装备加成"
 * 
 * 玩家加成参考：
 * - 功法加成：普通 5-10%，稀有 10-20%，史诗 20-35%，传说 35-50%
 * - 装备加成：普通 5-10%，稀有 10-20%，史诗 20-35%，传说 35-50%
 * - 全身满装：约 1.5-2.0 倍裸装属性
 * 
 * 敌人分级设计（新）：
 * - 普通：相当于玩家裸装水平，系数 0.9-1.0
 * - 精英：相当于玩家有基础功法，系数 1.1-1.2
 * - 小Boss：相当于玩家有较好功法装备，系数 1.4-1.6
 * - Boss：相当于玩家有顶级功法装备，系数 1.8-2.2
 */
export const ENEMY_TIER_CONFIG: Record<string, EnemyTierConfigItem> = {
  /** 普通敌人 - 相当于玩家裸装水平（用于机缘系统） */
  normal: {
    name: '普通',
    hpMultiplier: 0.95,       // 略低于玩家裸装
    attackMultiplier: 0.95,
    defenseMultiplier: 0.9,
    expMultiplier: 1.0,
    rewardMultiplier: 1.0,
    dropChance: {
      technique: 0.08,
      equipment: 0.12,
    },
    variance: 0.15,
  },
  
  /** 精英敌人 - 相当于玩家有基础功法 */
  elite: {
    name: '精英',
    hpMultiplier: 1.15,       // 约 15% 加成
    attackMultiplier: 1.15,
    defenseMultiplier: 1.1,
    expMultiplier: 1.8,
    rewardMultiplier: 1.8,
    dropChance: {
      technique: 0.18,
      equipment: 0.25,
    },
    variance: 0.1,
  },
  
  /** 小Boss - 相当于玩家有较好功法装备 */
  miniboss: {
    name: '小Boss',
    hpMultiplier: 1.5,        // 约 50% 加成
    attackMultiplier: 1.4,
    defenseMultiplier: 1.35,
    expMultiplier: 3.5,
    rewardMultiplier: 3.0,
    dropChance: {
      technique: 0.5,
      equipment: 0.6,
    },
    variance: 0.05,
  },
  
  /** Boss - 相当于玩家有顶级功法装备 */
  boss: {
    name: 'Boss',
    hpMultiplier: 2.0,        // 顶级装备功法约 100% 加成
    attackMultiplier: 1.7,
    defenseMultiplier: 1.6,
    expMultiplier: 6.0,
    rewardMultiplier: 5.0,
    dropChance: {
      technique: 1.0,
      equipment: 1.0,
    },
    variance: 0.0,  // Boss不浮动
  },
  
  /** 新手Boss - 用于低难度机缘(<=10)，确保新手能击败 */
  newbie_boss: {
    name: '新手Boss',
    hpMultiplier: 1.2,        // 比玩家裸装略高
    attackMultiplier: 1.1,
    defenseMultiplier: 1.0,
    expMultiplier: 4.0,
    rewardMultiplier: 3.0,
    dropChance: {
      technique: 0.8,
      equipment: 0.8,
    },
    variance: 0.1,
  },
  
  // ============================================
  // 塔层系统专用配置
  // ============================================
  
  /** 塔层普通敌人 - 从第1层开始就有挑战性
   * 
   * 设计理念：
   * - 玩家有功法+装备双层百分比加成（约1.21倍攻击）
   * - 敌人需要更高的倍率来平衡
   * - 塔层敌人应该比玩家略强，形成挑战
   */
  tower_normal: {
    name: '塔层守卫',
    hpMultiplier: 1.8,        // 略高于玩家（玩家约1.0倍HP）
    attackMultiplier: 1.6,    // 高于玩家的1.21倍（功法+装备加成）
    defenseMultiplier: 1.5,   // 高于玩家的1.21倍
    expMultiplier: 1.2,
    rewardMultiplier: 1.5,
    dropChance: {
      technique: 0.10,
      equipment: 0.15,
    },
    variance: 0.08,  // 塔层敌人浮动较小
  },
  
  /** 塔层精英敌人 - 明显强于玩家 */
  tower_elite: {
    name: '塔层精英',
    hpMultiplier: 2.2,        // 明显高于玩家
    attackMultiplier: 2.0,
    defenseMultiplier: 1.8,
    expMultiplier: 2.5,
    rewardMultiplier: 2.5,
    dropChance: {
      technique: 0.25,
      equipment: 0.35,
    },
    variance: 0.06,
  },
  
  /** 塔层Boss - 需要策略才能击败 */
  tower_boss: {
    name: '塔层Boss',
    hpMultiplier: 3.5,        // 需要高级装备才能应对
    attackMultiplier: 2.8,
    defenseMultiplier: 2.5,
    expMultiplier: 8.0,
    rewardMultiplier: 6.0,
    dropChance: {
      technique: 1.0,
      equipment: 1.0,
    },
    variance: 0.0,
  },
} as const;

/**
 * 根据格子类型获取敌人等级
 */
export function getEnemyTierFromCellType(cellType: CellType): EnemyTier {
  switch (cellType) {
    case 'boss':
      return 'boss';
    case 'miniboss':
      return 'miniboss';
    case 'elite':
      return 'elite';
    default:
      return 'normal';
  }
}

/**
 * 获取敌人等级配置
 */
export function getEnemyTierConfig(tier: EnemyTier) {
  return ENEMY_TIER_CONFIG[tier];
}

/**
 * 新手区域敌人配置（所有类型）
 * 用于难度<=10的区域，确保新手能击败
 * 
 * 设计思路：新手区域敌人应该比玩家裸装更弱，让玩家能轻松获胜
 */
export const NEWBIE_ENEMY_TIER_CONFIG: Record<EnemyTier, EnemyTierConfigItem> = {
  normal: {
    name: '新手普通',
    hpMultiplier: 0.7,        // 比玩家裸装更弱
    attackMultiplier: 0.75,
    defenseMultiplier: 0.7,
    expMultiplier: 0.8,
    rewardMultiplier: 0.8,
    dropChance: {
      technique: 0.05,
      equipment: 0.08,
    },
    variance: 0.1,
  },
  elite: {
    name: '新手精英',
    hpMultiplier: 0.85,       // 接近玩家裸装
    attackMultiplier: 0.9,
    defenseMultiplier: 0.85,
    expMultiplier: 1.2,
    rewardMultiplier: 1.2,
    dropChance: {
      technique: 0.12,
      equipment: 0.18,
    },
    variance: 0.1,
  },
  miniboss: {
    name: '新手小Boss',
    hpMultiplier: 1.0,        // 与玩家裸装持平
    attackMultiplier: 1.0,
    defenseMultiplier: 0.95,
    expMultiplier: 2.0,
    rewardMultiplier: 1.8,
    dropChance: {
      technique: 0.4,
      equipment: 0.5,
    },
    variance: 0.05,
  },
  boss: {
    name: '新手Boss',
    hpMultiplier: 1.15,       // 比玩家裸装略高
    attackMultiplier: 1.05,
    defenseMultiplier: 1.0,
    expMultiplier: 3.0,
    rewardMultiplier: 2.5,
    dropChance: {
      technique: 0.6,
      equipment: 0.6,
    },
    variance: 0.05,
  },
};

/**
 * 获取有效的敌人等级配置（考虑难度调整）
 * 新手区域(难度<=10)的敌人使用更低的属性乘数
 * 
 * 【塔层系统支持】
 * - difficultyLevel > 10 且为浮点数时，视为塔层难度
 * - 塔层使用专用的敌人配置（tower_normal, tower_elite, tower_boss）
 * - 难度越高，额外加成越多
 * 
 * 【平衡性说明】
 * - 玩家有功法+装备双层百分比加成（约1.21倍）
 * - 塔层敌人基础倍率已考虑这一点（1.5-1.6倍起）
 * - 额外难度加成用于高层挑战
 */
export function getEffectiveEnemyTierConfig(
  tier: EnemyTier, 
  difficultyLevel: number = 1
): EnemyTierConfigItem {
  // 新手区域的所有敌人都使用简化配置
  if (difficultyLevel <= 10 && Number.isInteger(difficultyLevel)) {
    return NEWBIE_ENEMY_TIER_CONFIG[tier];
  }
  
  // 塔层系统：使用专用配置 + 难度加成
  // difficultyLevel 范围：1.0 - 10.0
  if (difficultyLevel > 1) {
    // 选择塔层专用配置
    let towerConfigKey: string;
    if (tier === 'boss') {
      towerConfigKey = 'tower_boss';
    } else if (tier === 'elite') {
      towerConfigKey = 'tower_elite';
    } else {
      towerConfigKey = 'tower_normal';
    }
    
    const baseConfig = ENEMY_TIER_CONFIG[towerConfigKey];
    
    // 难度额外加成（在塔层基础配置上叠加）
    // difficulty 1.0 -> 额外加成 0%
    // difficulty 2.0 -> 额外加成 10%
    // difficulty 3.0 -> 额外加成 20%
    // difficulty 5.0 -> 额外加成 40%
    // difficulty 10.0 -> 额外加成 90%
    const extraMultiplier = 1 + (difficultyLevel - 1) * 0.1;
    
    return {
      name: `${baseConfig.name} Lv.${Math.floor(difficultyLevel)}`,
      hpMultiplier: baseConfig.hpMultiplier * extraMultiplier,
      attackMultiplier: baseConfig.attackMultiplier * extraMultiplier,
      defenseMultiplier: baseConfig.defenseMultiplier * extraMultiplier,
      expMultiplier: baseConfig.expMultiplier,
      rewardMultiplier: baseConfig.rewardMultiplier * (1 + (difficultyLevel - 1) * 0.12),
      dropChance: baseConfig.dropChance,
      variance: baseConfig.variance,
    };
  }
  
  return ENEMY_TIER_CONFIG[tier];
}
