/**
 * 组件：ThemeProvider
 *
 * 职责：
 * - 包裹应用根组件，提供主题 Context
 * - 在挂载时读取 localStorage 偏好 + 缓存 → 立即应用主题（防 FOUC）
 * - 世界主题通过 API 获取、setProperty 注入、removeProperty 回退
 * - 监听系统暗色模式偏好变化
 * - 订阅世界切换事件
 *
 * @module modules/theme/components
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from '../hooks/useTheme';
import type { ThemeSlice, ThemeMode } from '../types';
import { createInitialThemeState, resolveIsDark, toggleDark } from '../state';
import { subscribeThemeEvents, unsubscribeThemeEvents, setOnWorldChanged } from '../events';
import {
  loadThemePrefs,
  saveThemePrefs,
  loadCachedWorldTheme,
  saveCachedWorldTheme,
  applyThemeVariables,
  removeThemeVariables,
  fetchWorldTheme,
} from '../hooks/useThemeSettings';

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
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSlice>(() => {
    const initial = createInitialThemeState();
    const prefs = loadThemePrefs();
    // 立即应用暗色模式（防止水合闪烁）
    const isDark = resolveIsDark(prefs.themeMode);
    applyDarkMode(isDark);
    // 立即应用缓存的世界主题
    const cached = loadCachedWorldTheme();
    if (prefs.useWorldTheme && cached) {
      const themeVars = isDark ? cached.darkTheme : cached.lightTheme;
      if (themeVars) {
        applyThemeVariables(themeVars);
      }
    }
    return {
      ...initial,
      themeMode: prefs.themeMode,
      isDark,
      useWorldTheme: prefs.useWorldTheme,
      worldThemeData: cached,
      themeLoading: false,
    };
  });

  // 用于追踪已加载的世界 ID，避免重复请求
  const loadedWorldviewId = useRef<string | null>(null);

  // 设置主题模式
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme(prev => {
      const newIsDark = resolveIsDark(mode);
      saveThemePrefs({ themeMode: mode, useWorldTheme: prev.useWorldTheme });
      return {
        ...prev,
        themeMode: mode,
        isDark: newIsDark,
      };
    });
  }, []);

  // 切换暗色模式
  const toggleDarkMode = useCallback(() => {
    setTheme(prev => {
      const { isDark: newIsDark, themeMode: newMode } = toggleDark(prev.isDark);
      saveThemePrefs({ themeMode: newMode, useWorldTheme: prev.useWorldTheme });
      return {
        ...prev,
        isDark: newIsDark,
        themeMode: newMode,
      };
    });
  }, []);

  // 切换世界主题 / 默认主题
  const setUseWorldTheme = useCallback((use: boolean) => {
    setTheme(prev => {
      saveThemePrefs({ themeMode: prev.themeMode, useWorldTheme: use });
      return { ...prev, useWorldTheme: use };
    });
  }, []);

  // 加载并应用世界主题
  const loadWorldTheme = useCallback(async (worldviewId: string) => {
    // 避免重复加载同一世界观
    if (loadedWorldviewId.current === worldviewId) return;

    setTheme(prev => ({ ...prev, themeLoading: true }));
    loadedWorldviewId.current = worldviewId;

    try {
      // 尝试缓存优先
      const cached = loadCachedWorldTheme();
      if (cached && cached.worldviewId === worldviewId) {
        setTheme(prev => ({ ...prev, worldThemeData: cached, themeLoading: false }));
        return;
      }

      // 从后端获取
      const data = await fetchWorldTheme(worldviewId);
      if (data) {
        saveCachedWorldTheme(data);
        setTheme(prev => ({ ...prev, worldThemeData: data, themeLoading: false }));
      } else {
        setTheme(prev => ({ ...prev, worldThemeData: null, themeLoading: false }));
      }
    } catch {
      setTheme(prev => ({ ...prev, worldThemeData: null, themeLoading: false }));
    }
  }, []);

  // === 副作用：同步暗色模式到 DOM ===
  useEffect(() => {
    applyDarkMode(theme.isDark);
  }, [theme.isDark]);

  // === 副作用：世界主题变量注入/移除 ===
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (theme.useWorldTheme && theme.worldThemeData) {
      const vars = theme.isDark
        ? theme.worldThemeData.darkTheme
        : theme.worldThemeData.lightTheme;
      if (vars) {
        applyThemeVariables(vars);
      }
    } else if (theme.worldThemeData?.lightTheme) {
      // 用户关闭了世界主题 → 移除注入的变量
      removeThemeVariables(Object.keys(theme.worldThemeData.lightTheme));
    }
  }, [theme.useWorldTheme, theme.isDark, theme.worldThemeData]);

  // === 副作用：订阅主题事件 + 注册世界切换回调 ===
  useEffect(() => {
    subscribeThemeEvents();
    // 将 loadWorldTheme 注册为世界切换回调
    setOnWorldChanged((worldviewId: string) => {
      loadWorldTheme(worldviewId);
    });
    return () => {
      unsubscribeThemeEvents();
      setOnWorldChanged(null);
    };
  }, [loadWorldTheme]);

  // === 副作用：监听系统暗色模式偏好 ===
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
      setUseWorldTheme,
    }),
    [theme, setThemeMode, toggleDarkMode, setUseWorldTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
