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
  WorldThemeData,
  ThemeSlice,
  ThemeContextValue,
  StyleLoadCallback,
  StyleErrorCallback,
  StyleUnloadCallback,
} from './types';

// 状态
export { createInitialThemeState, resolveIsDark, toggleDark } from './state';

// 事件
export { worldEvents, applyWorldTheme, clearWorldTheme, subscribeThemeEvents, unsubscribeThemeEvents } from './events';

// 逻辑
export { StyleLoader } from './logic/styleLoader';

// Hooks
export { useTheme, ThemeContext } from './hooks/useTheme';
export {
  useThemeSettings,
  loadThemePrefs,
  saveThemePrefs,
  loadCachedWorldTheme,
  saveCachedWorldTheme,
  applyThemeVariables,
  removeThemeVariables,
  getVarNamesFromThemeData,
  fetchWorldTheme,
} from './hooks/useThemeSettings';

// 组件
export { ThemeProvider } from './components/ThemeProvider';

// 数据
export { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from './data/defaultTheme';
export { THEME_VARIABLE_NAMES, extractHue, expandLightTheme, expandDarkTheme } from './data/themeConfigTemplate';
