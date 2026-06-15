/**
 * 默认主题变量配置
 *
 * 导出当前项目 :root 和 .dark 中定义的所有 CSS 变量值作为 typed 常量，
 * 供世界主题作为继承回退使用。
 *
 * @module modules/theme/data
 */

import type { WorldType } from '@/core/types';
import type { ThemeVariableOverrides } from '../types';

/**
 * 世界类型 → data-world 属性值的映射
 */
export const WORLD_DATA_ATTR_MAP: Record<WorldType, string> = {
  '修仙': 'cultivation',
  '高武': 'martial',
  '科技': 'tech',
  '魔幻': 'magic',
  '异能': 'esper',
  '仙侠': 'immortal',
  '武侠': 'wuxia',
  '末世': 'apocalypse',
};

/**
 * 世界类型的中文显示名
 */
export const WORLD_DISPLAY_NAMES: Record<WorldType, string> = {
  '修仙': '修仙世界',
  '高武': '高武世界',
  '科技': '科技世界',
  '魔幻': '魔幻世界',
  '异能': '异能世界',
  '仙侠': '仙侠世界',
  '武侠': '武侠世界',
  '末世': '末世世界',
};

/**
 * 默认主题变量值（亮色）
 *
 * 与 themes.css 中的 :root 值保持同步。
 * 世界主题未覆盖的变量从此处继承。
 */
export const DEFAULT_LIGHT_THEME: ThemeVariableOverrides = {
  '--background': 'oklch(0.96 0.012 75)',
  '--foreground': 'oklch(0.22 0.035 55)',
  '--card': 'oklch(0.99 0.006 75)',
  '--card-foreground': 'oklch(0.22 0.035 55)',
  '--popover': 'oklch(0.99 0.006 75)',
  '--popover-foreground': 'oklch(0.22 0.035 55)',
  '--primary': 'oklch(0.50 0.10 60)',
  '--primary-foreground': 'oklch(0.98 0.01 75)',
  '--secondary': 'oklch(0.92 0.02 70)',
  '--secondary-foreground': 'oklch(0.30 0.04 55)',
  '--muted': 'oklch(0.94 0.015 72)',
  '--muted-foreground': 'oklch(0.45 0.03 60)',
  '--accent': 'oklch(0.88 0.04 70)',
  '--accent-foreground': 'oklch(0.25 0.04 55)',
  '--border': 'oklch(0.88 0.02 70)',
  '--ring': 'oklch(0.50 0.10 60)',
};

/**
 * 默认主题变量值（暗色）
 */
export const DEFAULT_DARK_THEME: ThemeVariableOverrides = {
  '--background': 'oklch(0.82 0.06 78)',
  '--foreground': 'oklch(0.22 0.035 55)',
  '--card': 'oklch(0.88 0.05 76)',
  '--card-foreground': 'oklch(0.22 0.035 55)',
  '--popover': 'oklch(0.93 0.04 74)',
  '--popover-foreground': 'oklch(0.20 0.04 55)',
  '--primary': 'oklch(0.48 0.16 58)',
  '--primary-foreground': 'oklch(0.97 0.02 65)',
  '--secondary': 'oklch(0.85 0.04 72)',
  '--secondary-foreground': 'oklch(0.28 0.04 55)',
  '--muted': 'oklch(0.86 0.035 74)',
  '--muted-foreground': 'oklch(0.42 0.035 62)',
  '--accent': 'oklch(0.80 0.06 70)',
  '--accent-foreground': 'oklch(0.25 0.05 55)',
  '--border': 'oklch(0.78 0.05 72)',
  '--ring': 'oklch(0.48 0.16 58)',
};
