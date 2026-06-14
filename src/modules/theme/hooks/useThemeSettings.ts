/**
 * Hook: useThemeSettings
 *
 * 职责：
 * - 管理主题偏好（外观模式 + 配色来源）的 localStorage 读写
 * - 提供 fetchWorldTheme(worldviewId) 从后端获取并缓存世界主题
 * - 提供 applyWorldTheme / removeWorldTheme 直接操作 DOM CSS 变量
 *
 * @module modules/theme
 */

import { useCallback } from 'react';
import type { ThemeMode, WorldThemeData } from '../types';

// ============================================
// localStorage keys & cache version
// ============================================

const THEME_PREFS_KEY = 'theme_prefs';
const WORLD_THEME_CACHE_KEY = 'world_theme_cache';

/** 缓存版本号——修改 themeConfig 后递增，使旧缓存自动失效 */
const THEME_CACHE_VERSION = 2;

/** 带版本号的缓存数据类型 */
interface CachedThemeData extends WorldThemeData {
  _v: number;
}

interface ThemePrefs {
  themeMode: ThemeMode;
  useWorldTheme: boolean;
}

// ============================================
// 偏好读写 (non-hook, 可在 SSR 前使用)
// ============================================

/** 从 localStorage 读取用户主题偏好 */
export function loadThemePrefs(): ThemePrefs {
  if (typeof localStorage === 'undefined') {
    return { themeMode: 'system', useWorldTheme: true };
  }
  try {
    const raw = localStorage.getItem(THEME_PREFS_KEY);
    if (!raw) return { themeMode: 'system', useWorldTheme: true };
    const parsed = JSON.parse(raw);
    return {
      themeMode: parsed.themeMode || 'system',
      useWorldTheme: parsed.useWorldTheme ?? true,
    };
  } catch {
    return { themeMode: 'system', useWorldTheme: true };
  }
}

/** 将用户主题偏好写入 localStorage */
export function saveThemePrefs(prefs: ThemePrefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(THEME_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // 静默失败
  }
}

/** 从 localStorage 读取缓存的世界主题数据，版本不匹配返回 null */
export function loadCachedWorldTheme(): WorldThemeData | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WORLD_THEME_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedThemeData;
    // 版本校验：旧版本缓存自动失效
    if (!data || data._v !== THEME_CACHE_VERSION) {
      localStorage.removeItem(WORLD_THEME_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** 将世界主题数据写入 localStorage 缓存（带内嵌版本号，兼容防 FOUC 脚本） */
export function saveCachedWorldTheme(data: WorldThemeData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const cached: CachedThemeData = { _v: THEME_CACHE_VERSION, ...data };
    localStorage.setItem(WORLD_THEME_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // 静默失败
  }
}

// ============================================
// DOM 操作 (non-hook, 可在 SSR 前使用)
// ============================================

/** 应用世界主题 CSS 变量到 documentElement */
export function applyThemeVariables(vars: Record<string, string> | null | undefined): void {
  if (typeof document === 'undefined') return;
  if (!vars) return;
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}

/** 移除世界主题 CSS 变量，回退到 themes.css 默认值 */
export function removeThemeVariables(varNames: string[]): void {
  if (typeof document === 'undefined') return;
  for (const name of varNames) {
    document.documentElement.style.removeProperty(name);
  }
}

/** 获取所有需要移除的变量名列表（从 worldThemeData 中提取） */
export function getVarNamesFromThemeData(data: WorldThemeData): string[] {
  return Object.keys(data.lightTheme);
}

// ============================================
// API 调用
// ============================================

/** 从后端获取世界主题数据 */
export async function fetchWorldTheme(worldviewId: string): Promise<WorldThemeData | null> {
  try {
    const res = await fetch(`/api/v1/worldviews/${worldviewId}/theme`);
    if (!res.ok) return null;
    const body = await res.json();
    // API 统一响应格式：{ code, data, message } → 解包 data
    return (body?.data ?? body) as WorldThemeData;
  } catch {
    return null;
  }
}

// ============================================
// Hook
// ============================================

/**
 * useThemeSettings — 主题设置管理 Hook
 *
 * 提供保存偏好、获取世界主题、应用/移除 CSS 变量的方法。
 * 这些函数无状态依赖，所以用 useCallback 包装确保引用稳定。
 */
export function useThemeSettings() {
  const savePrefs = useCallback((themeMode: ThemeMode, useWorldTheme: boolean) => {
    saveThemePrefs({ themeMode, useWorldTheme });
  }, []);

  const loadAndApplyWorldTheme = useCallback(async (worldviewId: string) => {
    // 1. 先尝试缓存
    const cached = loadCachedWorldTheme();
    if (cached && cached.worldviewId === worldviewId) {
      return cached;
    }

    // 2. 从后端获取
    const data = await fetchWorldTheme(worldviewId);
    if (data) {
      saveCachedWorldTheme(data);
    }
    return data;
  }, []);

  const applyWorldThemeToDOM = useCallback((data: WorldThemeData, isDark: boolean) => {
    const vars = isDark ? data.darkTheme : data.lightTheme;
    applyThemeVariables(vars);
  }, []);

  const removeWorldThemeFromDOM = useCallback((data: WorldThemeData) => {
    removeThemeVariables(getVarNamesFromThemeData(data));
  }, []);

  return {
    loadThemePrefs,
    savePrefs,
    loadAndApplyWorldTheme,
    applyWorldThemeToDOM,
    removeWorldThemeFromDOM,
    loadCachedWorldTheme,
  };
}
