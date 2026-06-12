/**
 * Hook: useTheme
 *
 * 读取当前主题状态 + 提供手动切换函数。
 * 必须在 ThemeProvider 内部使用。
 *
 * @module modules/theme
 */

'use client';

import { createContext, useContext } from 'react';
import type { ThemeContextValue } from '../types';
import { createInitialThemeState } from '../state';

/** 主题 Context */
export const ThemeContext = createContext<ThemeContextValue>({
  theme: createInitialThemeState(),
  setThemeMode: () => {},
  toggleDarkMode: () => {},
  setUseWorldTheme: () => {},
});

/**
 * 使用主题 Context
 *
 * @returns 主题状态和操作方法
 * @throws 如果在 ThemeProvider 外部调用
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context;
}
