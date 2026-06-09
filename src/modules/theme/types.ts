/**
 * 主题模块 — 类型定义
 *
 * 定义主题配置、世界主题、主题模式等核心类型。
 *
 * @module modules/theme
 */

import type { WorldType } from '@/shared/lib/types';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** 世界主题变量覆盖（CSS 自定义属性名 → 值） */
export interface ThemeVariableOverrides {
  /** CSS 变量名（含 -- 前缀，如 "--primary"）→ oklch() 值 */
  [cssVar: string]: string;
}

/** 世界主题配置 */
export interface WorldTheme {
  /** 世界类型标识（与 gameState.protagonist.world.type 对应） */
  worldType: WorldType;
  /** 用于 data-world 属性的值（英文 kebab-case） */
  dataWorldValue: string;
  /** 显示名称 */
  displayName: string;
  /** 亮色主题变量覆盖 */
  lightOverrides: ThemeVariableOverrides;
  /** 暗色主题变量覆盖（可选，不提供时从 .dark 继承） */
  darkOverrides?: ThemeVariableOverrides;
}

/** 主题状态 Slice（用于全局状态管理） */
export interface ThemeSlice {
  /** 当前活动的世界类型 */
  activeWorldType: WorldType | null;
  /** 用户选择的主题模式 */
  themeMode: ThemeMode;
  /** 是否处于暗色模式（由 themeMode + system preference 计算得出） */
  isDark: boolean;
}

/** 主题 Context 暴露的值 */
export interface ThemeContextValue {
  /** 当前主题状态 */
  theme: ThemeSlice;
  /** 手动设置主题模式 */
  setThemeMode: (mode: ThemeMode) => void;
  /** 切换亮色/暗色 */
  toggleDarkMode: () => void;
}

/** 样式加载回调类型 */
export type StyleLoadCallback = (modId: string) => void;
export type StyleErrorCallback = (modId: string, error: Error) => void;
export type StyleUnloadCallback = (modId: string) => void;
