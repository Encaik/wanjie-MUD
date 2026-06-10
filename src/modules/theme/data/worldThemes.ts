/**
 * 世界主题配置数据
 *
 * 定义 8 种世界的差异化主题变量。
 * 每种世界覆盖 7 个关键 CSS 变量，暗色主题提供对应的暗色变体。
 *
 * 设计理念：
 * - 修仙：温暖古典的琥珀棕
 * - 高武：热血战斗的深红色
 * - 科技：冷峻高效的科技蓝
 * - 魔幻：神秘深邃的魔法紫
 * - 异能：前卫活力的青绿色
 * - 仙侠：飘逸出尘的金白色
 * - 武侠：质朴刚健的墨绿色
 * - 末世：荒凉求生的锈橙色
 *
 * @module modules/theme/data
 */

import type { WorldType } from '@/core/types';
import type { WorldTheme } from '../types';
import { WORLD_DATA_ATTR_MAP, WORLD_DISPLAY_NAMES } from './defaultTheme';

/** 8 种世界的主题配置（亮色 + 暗色） */
export const WORLD_THEMES: WorldTheme[] = [
  {
    worldType: '修仙',
    dataWorldValue: WORLD_DATA_ATTR_MAP['修仙'],
    displayName: WORLD_DISPLAY_NAMES['修仙'],
    lightOverrides: {
      '--primary': 'oklch(0.50 0.10 60)',
      '--primary-foreground': 'oklch(0.98 0.01 75)',
      '--accent': 'oklch(0.88 0.04 70)',
      '--background': 'oklch(0.96 0.012 75)',
      '--foreground': 'oklch(0.22 0.035 55)',
      '--border': 'oklch(0.85 0.03 70)',
      '--ring': 'oklch(0.55 0.10 60)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.70 0.12 65)',
      '--primary-foreground': 'oklch(0.15 0.02 55)',
      '--accent': 'oklch(0.32 0.04 55)',
      '--background': 'oklch(0.18 0.02 55)',
      '--foreground': 'oklch(0.92 0.015 70)',
      '--border': 'oklch(0.28 0.03 55)',
      '--ring': 'oklch(0.70 0.12 65)',
    },
  },
  {
    worldType: '高武',
    dataWorldValue: WORLD_DATA_ATTR_MAP['高武'],
    displayName: WORLD_DISPLAY_NAMES['高武'],
    lightOverrides: {
      '--primary': 'oklch(0.48 0.18 20)',
      '--primary-foreground': 'oklch(0.98 0.01 20)',
      '--accent': 'oklch(0.82 0.06 25)',
      '--background': 'oklch(0.95 0.01 30)',
      '--foreground': 'oklch(0.18 0.02 20)',
      '--border': 'oklch(0.80 0.02 30)',
      '--ring': 'oklch(0.50 0.18 20)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.65 0.18 22)',
      '--primary-foreground': 'oklch(0.12 0.01 20)',
      '--accent': 'oklch(0.30 0.05 25)',
      '--background': 'oklch(0.15 0.02 25)',
      '--foreground': 'oklch(0.90 0.01 30)',
      '--border': 'oklch(0.28 0.03 25)',
      '--ring': 'oklch(0.68 0.18 22)',
    },
  },
  {
    worldType: '科技',
    dataWorldValue: WORLD_DATA_ATTR_MAP['科技'],
    displayName: WORLD_DISPLAY_NAMES['科技'],
    lightOverrides: {
      '--primary': 'oklch(0.50 0.13 245)',
      '--primary-foreground': 'oklch(0.98 0.01 245)',
      '--accent': 'oklch(0.85 0.03 240)',
      '--background': 'oklch(0.96 0.005 250)',
      '--foreground': 'oklch(0.18 0.015 250)',
      '--border': 'oklch(0.82 0.015 245)',
      '--ring': 'oklch(0.55 0.13 245)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.68 0.12 245)',
      '--primary-foreground': 'oklch(0.12 0.01 245)',
      '--accent': 'oklch(0.25 0.03 240)',
      '--background': 'oklch(0.16 0.01 245)',
      '--foreground': 'oklch(0.90 0.01 245)',
      '--border': 'oklch(0.26 0.02 245)',
      '--ring': 'oklch(0.72 0.12 245)',
    },
  },
  {
    worldType: '魔幻',
    dataWorldValue: WORLD_DATA_ATTR_MAP['魔幻'],
    displayName: WORLD_DISPLAY_NAMES['魔幻'],
    lightOverrides: {
      '--primary': 'oklch(0.50 0.17 300)',
      '--primary-foreground': 'oklch(0.98 0.01 300)',
      '--accent': 'oklch(0.85 0.05 295)',
      '--background': 'oklch(0.95 0.01 290)',
      '--foreground': 'oklch(0.18 0.02 290)',
      '--border': 'oklch(0.82 0.02 295)',
      '--ring': 'oklch(0.55 0.17 300)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.68 0.16 300)',
      '--primary-foreground': 'oklch(0.12 0.01 300)',
      '--accent': 'oklch(0.26 0.05 295)',
      '--background': 'oklch(0.15 0.015 295)',
      '--foreground': 'oklch(0.90 0.01 290)',
      '--border': 'oklch(0.24 0.03 295)',
      '--ring': 'oklch(0.72 0.16 300)',
    },
  },
  {
    worldType: '异能',
    dataWorldValue: WORLD_DATA_ATTR_MAP['异能'],
    displayName: WORLD_DISPLAY_NAMES['异能'],
    lightOverrides: {
      '--primary': 'oklch(0.50 0.10 170)',
      '--primary-foreground': 'oklch(0.98 0.01 170)',
      '--accent': 'oklch(0.85 0.04 165)',
      '--background': 'oklch(0.96 0.005 175)',
      '--foreground': 'oklch(0.18 0.015 175)',
      '--border': 'oklch(0.82 0.015 170)',
      '--ring': 'oklch(0.55 0.10 170)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.68 0.10 170)',
      '--primary-foreground': 'oklch(0.12 0.01 170)',
      '--accent': 'oklch(0.25 0.04 165)',
      '--background': 'oklch(0.16 0.01 170)',
      '--foreground': 'oklch(0.90 0.01 170)',
      '--border': 'oklch(0.26 0.02 170)',
      '--ring': 'oklch(0.72 0.10 170)',
    },
  },
  {
    worldType: '仙侠',
    dataWorldValue: WORLD_DATA_ATTR_MAP['仙侠'],
    displayName: WORLD_DISPLAY_NAMES['仙侠'],
    lightOverrides: {
      '--primary': 'oklch(0.60 0.08 90)',
      '--primary-foreground': 'oklch(0.20 0.02 80)',
      '--accent': 'oklch(0.88 0.03 85)',
      '--background': 'oklch(0.97 0.003 90)',
      '--foreground': 'oklch(0.20 0.02 85)',
      '--border': 'oklch(0.85 0.02 85)',
      '--ring': 'oklch(0.65 0.08 90)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.75 0.08 90)',
      '--primary-foreground': 'oklch(0.15 0.02 80)',
      '--accent': 'oklch(0.30 0.03 85)',
      '--background': 'oklch(0.18 0.01 85)',
      '--foreground': 'oklch(0.92 0.01 85)',
      '--border': 'oklch(0.28 0.02 85)',
      '--ring': 'oklch(0.78 0.08 90)',
    },
  },
  {
    worldType: '武侠',
    dataWorldValue: WORLD_DATA_ATTR_MAP['武侠'],
    displayName: WORLD_DISPLAY_NAMES['武侠'],
    lightOverrides: {
      '--primary': 'oklch(0.42 0.08 145)',
      '--primary-foreground': 'oklch(0.98 0.01 145)',
      '--accent': 'oklch(0.82 0.03 140)',
      '--background': 'oklch(0.95 0.01 135)',
      '--foreground': 'oklch(0.18 0.02 140)',
      '--border': 'oklch(0.78 0.02 140)',
      '--ring': 'oklch(0.45 0.08 145)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.60 0.08 145)',
      '--primary-foreground': 'oklch(0.12 0.01 140)',
      '--accent': 'oklch(0.24 0.03 140)',
      '--background': 'oklch(0.15 0.015 140)',
      '--foreground': 'oklch(0.90 0.01 135)',
      '--border': 'oklch(0.24 0.02 140)',
      '--ring': 'oklch(0.65 0.08 145)',
    },
  },
  {
    worldType: '末世',
    dataWorldValue: WORLD_DATA_ATTR_MAP['末世'],
    displayName: WORLD_DISPLAY_NAMES['末世'],
    lightOverrides: {
      '--primary': 'oklch(0.44 0.08 45)',
      '--primary-foreground': 'oklch(0.98 0.01 40)',
      '--accent': 'oklch(0.75 0.03 40)',
      '--background': 'oklch(0.93 0.005 50)',
      '--foreground': 'oklch(0.20 0.01 45)',
      '--border': 'oklch(0.78 0.015 45)',
      '--ring': 'oklch(0.48 0.08 45)',
    },
    darkOverrides: {
      '--primary': 'oklch(0.60 0.08 45)',
      '--primary-foreground': 'oklch(0.12 0.01 40)',
      '--accent': 'oklch(0.22 0.03 40)',
      '--background': 'oklch(0.13 0.01 45)',
      '--foreground': 'oklch(0.88 0.01 45)',
      '--border': 'oklch(0.22 0.015 45)',
      '--ring': 'oklch(0.64 0.08 45)',
    },
  },
];

/** 快速查询的 Map 索引 */
export const worldThemeMap: Map<WorldType, WorldTheme> = new Map(
  WORLD_THEMES.map(theme => [theme.worldType, theme])
);
