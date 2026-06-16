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
import { subscribeThemeEvents, unsubscribeThemeEvents, setOnWorldChanged, setOnNewGameStarted } from '../events';
import {
  loadThemePrefs,
  saveThemePrefs,
  loadCachedWorldTheme,
  saveCachedWorldTheme,
  applyThemeVariables,
  removeThemeVariables,
  fetchWorldTheme,
  getVarNamesFromThemeData,
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
    if (loadedWorldviewId.current === worldviewId) return;

    setTheme(prev => ({ ...prev, themeLoading: true }));
    loadedWorldviewId.current = worldviewId;

    try {
      const cached = loadCachedWorldTheme();
      if (cached && cached.worldviewId === worldviewId) {
        setTheme(prev => ({ ...prev, worldThemeData: cached, themeLoading: false }));
        return;
      }

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

    if (theme.useWorldTheme) {
      if (theme.worldThemeData) {
        const vars = theme.isDark
          ? theme.worldThemeData.darkTheme
          : theme.worldThemeData.lightTheme;
        if (vars) applyThemeVariables(vars);
      } else {
        // 回退：无主题数据 → localStorage 缓存 → API 推断
        const cached = loadCachedWorldTheme();
        if (cached) {
          const vars = theme.isDark ? cached.darkTheme : cached.lightTheme;
          if (vars) {
            applyThemeVariables(vars);
            setTheme(prev => ({ ...prev, worldThemeData: cached }));
          }
        } else if (window.location.pathname.includes('/game')) {
          // 仅在游戏页面推断 worldviewId
          let worldviewId: string | null =
            document.documentElement.getAttribute('data-world');
          if (!worldviewId) {
            try {
              const gs = JSON.parse(localStorage.getItem('gameState') || 'null');
              worldviewId = gs?.protagonist?.world?.worldviewId || null;
            } catch { /* ignore */ }
          }
          if (worldviewId) {
            fetchWorldTheme(worldviewId).then(data => {
              if (data) {
                saveCachedWorldTheme(data);
                const vars2 = theme.isDark ? data.darkTheme : data.lightTheme;
                if (vars2) applyThemeVariables(vars2);
                setTheme(prev => ({ ...prev, worldThemeData: data }));
              }
            });
          }
        }
      }
    } else if (theme.worldThemeData?.lightTheme) {
      removeThemeVariables(getVarNamesFromThemeData(theme.worldThemeData));
    } else {
      const cached = loadCachedWorldTheme();
      if (cached?.lightTheme) removeThemeVariables(Object.keys(cached.lightTheme));
    }
  }, [theme.useWorldTheme, theme.isDark, theme.worldThemeData]);

  // === 副作用：订阅主题事件 + 注册回调 ===
  useEffect(() => {
    subscribeThemeEvents();

    // 世界切换回调：加载新世界主题 + 自动启用世界主题
    setOnWorldChanged((worldviewId: string) => {
      // 每次世界切换（新游戏），重置为使用世界主题（覆盖之前用户的手动设置）
      setTheme(prev => {
        saveThemePrefs({ themeMode: prev.themeMode, useWorldTheme: true });
        return { ...prev, useWorldTheme: true };
      });
      loadWorldTheme(worldviewId);
    });

    // 新游戏开始回调：清除旧世界主题的 CSS 变量和状态
    setOnNewGameStarted(() => {
      setTheme(prev => {
        // 移除旧世界主题的 CSS 变量
        if (prev.worldThemeData) {
          removeThemeVariables(getVarNamesFromThemeData(prev.worldThemeData));
        }
        return { ...prev, worldThemeData: null };
      });
      // 重置已加载的世界 ID，确保下次 world_changed 时重新加载
      loadedWorldviewId.current = null;
    });

    return () => {
      unsubscribeThemeEvents();
      setOnWorldChanged(null);
      setOnNewGameStarted(null);
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
