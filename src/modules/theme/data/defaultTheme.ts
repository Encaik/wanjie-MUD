/**
 * 默认主题变量配置
 *
 * 导出当前项目 :root 和 .dark 中定义的所有 CSS 变量值作为 typed 常量，
 * 供世界主题作为继承回退使用。
 *
 * @module modules/theme/data
 */

import type { WorldType } from '@/shared/lib/types';
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
  '--background': 'oklch(0.18 0.02 55)',
  '--foreground': 'oklch(0.92 0.015 70)',
  '--card': 'oklch(0.22 0.025 55)',
  '--card-foreground': 'oklch(0.92 0.015 70)',
  '--popover': 'oklch(0.22 0.025 55)',
  '--popover-foreground': 'oklch(0.92 0.015 70)',
  '--primary': 'oklch(0.70 0.12 65)',
  '--primary-foreground': 'oklch(0.15 0.02 55)',
  '--secondary': 'oklch(0.28 0.03 55)',
  '--secondary-foreground': 'oklch(0.88 0.015 70)',
  '--muted': 'oklch(0.25 0.025 55)',
  '--muted-foreground': 'oklch(0.65 0.03 60)',
  '--accent': 'oklch(0.32 0.04 55)',
  '--accent-foreground': 'oklch(0.90 0.015 70)',
  '--border': 'oklch(0.30 0.02 55)',
  '--ring': 'oklch(0.70 0.12 65)',
};
