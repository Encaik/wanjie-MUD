/**
 * 世界提供者类型定义
 *
 * 定义 WorldProvider 接口、WorldTemplate 成品世界、WorldProviderMetadata 等核心类型。
 *
 * @module shared/lib/world/types
 */

import type { World } from '@/core/types';

// ============================================
// WorldProvider — 世界来源抽象接口
// ============================================

/** 世界提供者类型 */
export type WorldProviderType = 'random';

/** 世界提供者抽象接口 */
export interface WorldProvider {
  /** 提供者唯一标识（如 "wanjie-core"） */
  readonly id: string;
  /** 提供者显示名称 */
  readonly name: string;
  /** 提供者类型：随机生成器或固化模板 */
  readonly type: WorldProviderType;
  /**
   * 生成单个世界
   *
   * @param seed - 世界种子
   * @param ascensionCount - 飞升次数
   * @param worldviewId - 可选的世界观 ID（用于从特定世界观生成）
   */
  generateWorld(seed: string, ascensionCount: number, worldviewId?: string): World;
  /**
   * 批量生成世界
   *
   * @param seeds - 种子数组
   * @param ascensionCount - 飞升次数
   * @param worldviewId - 可选的世界观 ID
   */
  generateWorlds(seeds: string[], ascensionCount: number, worldviewId?: string): World[];
  /** 获取提供者元数据 */
  getMetadata(): WorldProviderMetadata;
}

/** 世界提供者元数据 */
export interface WorldProviderMetadata {
  id: string;
  name: string;
  type: WorldProviderType;
  /** 可提供的世界数量（-1 表示无限制） */
  worldCount: number;
  /** 涵盖的世界观类型 */
  worldTypes: string[];
}

// ============================================
// WorldPool — 混合池类型
// ============================================

/** 世界池来源标记 */
export type WorldPoolSource = 'rated' | 'random';

/** 世界池条目（混合池引擎的输出） */
export interface WorldPoolEntry {
  /** 世界实例 */
  world: World;
  /** 来源类型 */
  source: WorldPoolSource;
  /** 评分信息（仅 rated 来源有值） */
  rating?: {
    average: number;
    count: number;
  };
}

/** 世界池配置 */
export interface WorldPoolConfig {
  /** 来源比例 */
  sourceRatio: {
    /** 已评分高分世界占比，默认 0.6 */
    rated: number;
    /** 随机新世界占比，默认 0.4 */
    random: number;
  };
  /** 平均评分 >= 此值才算"高分"，默认 3.5 */
  highScoreThreshold: number;
  /** 最终产出世界数量，默认 8 */
  poolSize: number;
}

/** 默认世界池配置 */
export const DEFAULT_WORLD_POOL_CONFIG: WorldPoolConfig = {
  sourceRatio: { rated: 0.6, random: 0.4 },
  highScoreThreshold: 3.5,
  poolSize: 8,
};

// ============================================
// 评分存储类型（避免 shared/ 依赖 modules/）
// ============================================

/** 单个世界的评分数据 */
export interface RatingData {
  totalScore: number;
  ratingCount: number;
  lastRated: number;
  comments?: string[];
}

/** 评分存储映射（worldId → RatingData） */
export type WorldRatingsMap = Record<string, RatingData>;
