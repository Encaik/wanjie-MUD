/**
 * 文案系统 - 类型定义
 * 
 * 核心类型定义，支持多世界观文案管理
 */

import { WorldType } from '@/core/types';

// ============================================
// 文案键类型
// ============================================

/**
 * 文案键
 * 
 * 从世界观文案结构推导，格式：category.key
 */
export type TextKey = string;

// ============================================
// 文案解析器接口
// ============================================

/**
 * 值上下文
 */
export interface ValueContext {
  /** 游戏状态 */
  gameState?: any;
  /** 主角数据 */
  protagonist?: any;
  /** 世界类型 */
  worldType: WorldType;
  /** 额外参数 */
  extras?: Record<string, any>;
}

/**
 * 文案解析结果
 */
export interface TextResolveResult {
  /** 解析后的文案 */
  text: string;
  /** 是否成功 */
  success: boolean;
  /** 未解析的占位符 */
  unresolvedPlaceholders?: string[];
}

/**
 * 文案解析器配置
 */
export interface TextResolverConfig {
  /** 是否严格模式（遇到未解析的占位符时报错） */
  strict?: boolean;
  /** 占位符开始标记 */
  placeholderStart?: string;
  /** 占位符结束标记 */
  placeholderEnd?: string;
}

// ============================================
// React Hook 接口
// ============================================

/**
 * useText Hook 返回值
 */
export interface UseTextResult {
  /** 解析文案的方法 */
  t: (key: TextKey, params?: Record<string, any>) => string;
  /** 当前世界类型 */
  worldType: WorldType;
  /** 是否已初始化 */
  isReady: boolean;
}
