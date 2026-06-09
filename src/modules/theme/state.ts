/**
 * 主题状态管理
 *
 * 管理主题相关的全局状态：当前世界类型、主题模式、暗色模式开关。
 *
 * @module modules/theme
 */

import type { ThemeSlice, ThemeMode } from './types';

/** 创建默认主题状态 */
export function createInitialThemeState(): ThemeSlice {
  return {
    activeWorldType: null,
    themeMode: 'system',
    isDark: false,
  };
}

/**
 * 根据主题模式和系统偏好判断是否应使用暗色模式
 *
 * @param mode - 用户选择的主题模式
 * @returns 是否应使用暗色模式
 */
export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  // system
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * 切换暗色模式
 *
 * @param current - 当前 isDark 值
 * @returns 新的 isDark 值
 */
export function toggleDark(current: boolean): { isDark: boolean; themeMode: ThemeMode } {
  const newIsDark = !current;
  return {
    isDark: newIsDark,
    themeMode: newIsDark ? 'dark' : 'light',
  };
}
