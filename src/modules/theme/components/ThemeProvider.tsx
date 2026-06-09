/**
 * 组件：ThemeProvider
 *
 * 职责：
 * - 包裹应用根组件，提供主题 Context
 * - 在挂载时设置初始 data-world / data-theme 属性
 * - 监听系统暗色模式偏好变化
 * - 订阅世界切换事件，自动执行主题切换
 *
 * @module modules/theme/components
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from '../hooks/useTheme';
import type { ThemeSlice, ThemeMode } from '../types';
import { createInitialThemeState, resolveIsDark, toggleDark } from '../state';
import { subscribeThemeEvents, unsubscribeThemeEvents } from '../events';
import { applyWorldTheme } from '../events';

/**
 * 应用暗色模式到 DOM
 */
function applyDarkMode(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * ThemeProvider 组件
 *
 * 在 app/layout.tsx 中包裹 children。
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSlice>(() => {
    const initial = createInitialThemeState();
    // 根据系统偏好初始化暗色模式
    return {
      ...initial,
      isDark: resolveIsDark(initial.themeMode),
    };
  });

  // 设置主题模式
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme(prev => ({
      ...prev,
      themeMode: mode,
      isDark: resolveIsDark(mode),
    }));
  }, []);

  // 切换暗色模式
  const toggleDarkMode = useCallback(() => {
    setTheme(prev => ({
      ...prev,
      ...toggleDark(prev.isDark),
    }));
  }, []);

  // 同步暗色模式到 DOM
  useEffect(() => {
    applyDarkMode(theme.isDark);
  }, [theme.isDark]);

  // 订阅主题事件
  useEffect(() => {
    subscribeThemeEvents();
    return () => {
      unsubscribeThemeEvents();
    };
  }, []);

  // 监听系统暗色模式偏好变化
  useEffect(() => {
    if (theme.themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(prev => ({
        ...prev,
        isDark: e.matches,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.themeMode]);

  const value = useMemo(
    () => ({
      theme,
      setThemeMode,
      toggleDarkMode,
    }),
    [theme, setThemeMode, toggleDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
