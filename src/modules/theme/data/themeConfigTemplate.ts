/**
 * 主题配置迁移模板
 *
 * 提供从 DEFAULT_LIGHT_THEME / DEFAULT_DARK_THEME 导出的完整变量名列表，
 * 以及从旧 worldThemes.ts 中的 7 变量扩展到完整 15+ 变量的辅助函数。
 *
 * 用途：
 * 1. 仅用于一次性数据迁移——将 8 个世界观的 themeConfig 写入后端 JSON
 * 2. 迁移完成后本文件可删除，但保留作为新世界观作者的主题模板参照
 *
 * @module modules/theme/data
 */

import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from './defaultTheme';

/** 世界主题应覆盖的完整 CSS 变量名列表（按语义分组） */
export const THEME_VARIABLE_NAMES = Object.keys(DEFAULT_LIGHT_THEME) as string[];

/** 从亮色覆盖中获取核心色相，用于推导缺失变量 */
export interface ThemeCoreColors {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  border: string;
  ring: string;
  primaryForeground: string;
}

/**
 * 从 7 个核心变量的 oklch 值中提取色相（hue）
 *
 * 格式：oklch(lightness chroma hue)
 * 返回归一化后的色相值，用于生成 card/muted/secondary 等衍生色
 */
export function extractHue(oklchValue: string): number {
  const match = oklchValue.match(/oklch\([\d.]+ [\d.]+ ([\d.]+)\)/);
  return match ? parseFloat(match[1]) : 75; // 默认暖色相
}

/**
 * 从核心变量生成完整的亮色主题变量集
 *
 * card/popover 在 background 基础上微调亮度
 * secondary/muted 在 primary 基础上降低饱和度和亮度
 */
export function expandLightTheme(core: ThemeCoreColors): Record<string, string> {
  const hue = extractHue(core.primary);
  const bgHue = extractHue(core.background);
  return {
    '--background': core.background,
    '--foreground': core.foreground,
    '--card': `oklch(0.99 0.006 ${bgHue})`,
    '--card-foreground': core.foreground,
    '--popover': `oklch(0.99 0.006 ${bgHue})`,
    '--popover-foreground': core.foreground,
    '--primary': core.primary,
    '--primary-foreground': core.primaryForeground,
    '--secondary': `oklch(0.92 0.02 ${hue})`,
    '--secondary-foreground': `oklch(0.30 0.04 ${hue})`,
    '--muted': `oklch(0.94 0.015 ${bgHue})`,
    '--muted-foreground': `oklch(0.45 0.03 ${hue})`,
    '--accent': core.accent,
    '--accent-foreground': `oklch(0.25 0.04 ${hue})`,
    '--border': core.border,
    '--input': `oklch(0.92 0.015 ${bgHue})`,
    '--ring': core.ring,
  };
}

/**
 * 从核心变量生成完整的暗色主题变量集
 */
export function expandDarkTheme(core: ThemeCoreColors): Record<string, string> {
  const hue = extractHue(core.primary);
  const bgHue = extractHue(core.background);
  return {
    '--background': core.background,
    '--foreground': core.foreground,
    '--card': `oklch(0.22 0.025 ${bgHue})`,
    '--card-foreground': core.foreground,
    '--popover': `oklch(0.22 0.025 ${bgHue})`,
    '--popover-foreground': core.foreground,
    '--primary': core.primary,
    '--primary-foreground': core.primaryForeground,
    '--secondary': `oklch(0.28 0.03 ${hue})`,
    '--secondary-foreground': `oklch(0.88 0.015 ${bgHue})`,
    '--muted': `oklch(0.25 0.025 ${bgHue})`,
    '--muted-foreground': `oklch(0.65 0.03 ${hue})`,
    '--accent': core.accent,
    '--accent-foreground': `oklch(0.90 0.015 ${bgHue})`,
    '--border': core.border,
    '--input': `oklch(0.25 0.025 ${bgHue})`,
    '--ring': core.ring,
  };
}
