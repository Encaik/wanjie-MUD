/**
 * 主题模块 — 统一导出
 *
 * 模块职责：管理全局主题状态、世界→主题绑定、运行时主题切换。
 *
 * @module modules/theme
 */

// 类型
export type {
  ThemeMode,
  ThemeVariableOverrides,
  WorldTheme,
  ThemeSlice,
  ThemeContextValue,
  StyleLoadCallback,
  StyleErrorCallback,
  StyleUnloadCallback,
} from './types';

// 状态
export { createInitialThemeState, resolveIsDark, toggleDark } from './state';

// 事件
export { applyWorldTheme, clearWorldTheme, subscribeThemeEvents, unsubscribeThemeEvents } from './events';

// 逻辑
export { getWorldTheme, getDataWorldValue, getWorldDisplayName, mergeThemeOverrides } from './logic/themeResolver';
export { StyleLoader } from './logic/styleLoader';

// Hooks
export { useTheme, ThemeContext } from './hooks/useTheme';

// 组件
export { ThemeProvider } from './components/ThemeProvider';

// 数据
export { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME, WORLD_DATA_ATTR_MAP, WORLD_DISPLAY_NAMES } from './data/defaultTheme';
export { worldThemeMap } from './data/worldThemes';
