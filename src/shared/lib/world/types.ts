/**
 * 世界提供者类型定义
 *
 * 定义 WorldProvider 接口、WorldTemplate 成品世界、WorldProviderMetadata 等核心类型。
 *
 * @module shared/lib/world/types
 */

import type { World } from '@/shared/lib/types';

// ============================================
// WorldProvider — 世界来源抽象接口
// ============================================

/** 世界提供者类型 */
export type WorldProviderType = 'random' | 'template';

/** 世界提供者抽象接口 */
export interface WorldProvider {
  /** 提供者唯一标识（如 "wanjie-core"） */
  readonly id: string;
  /** 提供者显示名称 */
  readonly name: string;
  /** 提供者类型：随机生成器或固化模板 */
  readonly type: WorldProviderType;
  /** 生成单个世界 */
  generateWorld(seed: string, ascensionCount: number): World;
  /** 批量生成世界 */
  generateWorlds(seeds: string[], ascensionCount: number): World[];
  /** 获取提供者元数据 */
  getMetadata(): WorldProviderMetadata;
}

/** 世界提供者元数据 */
export interface WorldProviderMetadata {
  id: string;
  name: string;
  type: WorldProviderType;
  /** 可提供的世界数量（template 为固定数量，random 为 -1 表示无限制） */
  worldCount: number;
  /** 涵盖的世界类型 */
  worldTypes: string[];
  /** 模板 ID 列表（仅 template 类型） */
  templateIds?: string[];
}

// ============================================
// WorldTemplate — 固化成品世界模板
// ============================================

/**
 * 固化世界模板（"成品世界"）
 *
 * 与 WorldTypeData（配方/池）明确区分：
 * - WorldTypeData：包含名称池、描述池、危险池等，供随机生成器从中选取组合
 * - WorldTemplate：所有字段为确定值，等价于一个已经生成好的 World（减去系统分配字段）
 */
export interface WorldTemplate {
  /** 模板唯一 ID */
  id: string;
  /** 模板创建时的游戏版本号（必填，semver 格式） */
  gameVersion: string;
  /** 完整的世界数据（不含 id 和 ratingScore，由系统分配） */
  world: Omit<World, 'id' | 'ratingScore'>;
  /** 是否锁定评分不被低分淘汰（可选） */
  protected?: boolean;
  /** 模板标签（可选） */
  tags?: string[];
  /** 模板作者（可选） */
  author?: string;
  /** 预览文案（可选） */
  previewText?: string;
}

// ============================================
// WorldPool — 混合池类型
// ============================================

/** 世界池来源标记 */
export type WorldPoolSource = 'rated' | 'random' | 'template';

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
  /** 版本兼容性（仅 template 来源有值） */
  versionCompatibility?: import('@/shared/config/version').VersionCompatibility;
}

/** 世界池配置 */
export interface WorldPoolConfig {
  /** 第一级：来源比例 */
  sourceRatio: {
    /** 已评分高分世界占比，默认 0.6 */
    rated: number;
    /** 随机新世界占比，默认 0.4 */
    random: number;
  };
  /** 第二级：随机来源内部比例 */
  randomSourceRatio: {
    /** mod 随机生成器占比，默认 0.7 */
    modRandom: number;
    /** mod 固化模板占比，默认 0.3 */
    modTemplate: number;
  };
  /** 平均评分 >= 此值才算"高分"，默认 3.5 */
  highScoreThreshold: number;
  /** 最终产出世界数量，默认 8 */
  poolSize: number;
}

/** 默认世界池配置 */
export const DEFAULT_WORLD_POOL_CONFIG: WorldPoolConfig = {
  sourceRatio: { rated: 0.6, random: 0.4 },
  randomSourceRatio: { modRandom: 0.7, modTemplate: 0.3 },
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
