/**
 * Mod 模块类型定义
 *
 * @module modules/mod
 */

/** Mod 加载阶段 */
export type ModLoadPhase = 'idle' | 'loading' | 'ready' | 'error';

/** 非致命警告 */
export interface ModLoadWarning {
  id: string;
  name: string;
  error: string;
}

/** Mod 加载状态 */
export interface ModLoaderState {
  /** 加载阶段 */
  phase: ModLoadPhase;
  /** 加载进度 */
  progress: { current: number; total: number };
  /** 致命错误消息（required Mod 失败时） */
  fatalError: string | null;
  /** 非致命警告列表 */
  warnings: ModLoadWarning[];
}
