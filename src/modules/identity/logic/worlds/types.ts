/**
 * 世界独特机制类型定义
 *
 * 定义 WorldMechanics 接口，每种世界类型提供不同的核心玩法循环。
 * 通过策略模式隔离世界差异化逻辑。
 */

// ============================================
// 修炼行为
// ============================================

/** 世界特定修炼参数 */
export interface WorldCultivationParams {
  /** 修炼消耗资源名称 */
  resourceName: string;
  /** 修炼行为名称 */
  actionName: string;
  /** 基础灵石消耗（稳健） */
  baseCost: number;
  /** 是否使用标准修炼公式 */
  useStandardFormula: boolean;
  /** 自定义成功率修正 */
  successRateModifier: number;
}

// ============================================
// 战斗行为
// ============================================

/** 世界特定战斗参数 */
export interface WorldCombatParams {
  /** 战斗资源名称（如真气/内力/法力） */
  mpName: string;
  /** 招式系统的名称 */
  abilityName: string;
  /** 普通攻击名称 */
  basicAttackName: string;
}

// ============================================
// 探索行为
// ============================================

/** 世界特定探索参数 */
export interface WorldExplorationParams {
  /** 探索行为名称 */
  exploreName: string;
  /** 是否支持特殊地图机制 */
  hasSpecialMechanics: boolean;
  /** 额外生存资源（末世等） */
  survivalResources?: {
    name: string;
    maxValue: number;
    dailyConsumption: number;
  }[];
}

// ============================================
// WorldMechanics 接口
// ============================================

/** 世界机制接口 —— 每种世界类型提供自己的实现 */
export interface WorldMechanics {
  /** 世界类型标识 */
  worldType: string;

  /** 获取修炼相关参数 */
  getCultivationParams: () => WorldCultivationParams;

  /** 获取战斗相关参数 */
  getCombatParams: () => WorldCombatParams;

  /** 获取探索相关参数 */
  getExplorationParams: () => WorldExplorationParams;

  /** 获取独特机制描述（用于 UI 展示） */
  getUniqueMechanicDescription: () => UniqueMechanicInfo;
}

/**
 * 世界机制纯数据配置
 *
 * 替代手写 WorldMechanics TS 文件，所有世界机制的差异通过 JSON 数据注入。
 * WorldMechanics 对象由 buildWorldMechanics() 根据此配置自动构造。
 */
export interface MechanicsConfig {
  /** 世界类型标识 */
  worldType: string;
  /** 修炼参数 */
  cultivation: WorldCultivationParams;
  /** 战斗参数 */
  combat: WorldCombatParams;
  /** 探索参数 */
  exploration: WorldExplorationParams;
  /** 独特机制描述 */
  uniqueMechanic: UniqueMechanicInfo;
}

/** 独特机制信息（用于 UI 展示） */
export interface UniqueMechanicInfo {
  /** 机制名称 */
  name: string;
  /** 机制描述 */
  description: string;
  /** 图标名称（对应 Lucide icon） */
  icon: string;
}
