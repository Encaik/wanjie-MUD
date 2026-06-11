/**
 * 主题解析器 — 纯函数
 *
 * 世界类型 → 主题配置的映射逻辑。
 * 根据当前世界类型、暗色模式状态、已加载 Mod 返回最终 CSS 变量集合。
 *
 * @module modules/theme/logic
 */

import type { WorldType } from '@/core/types';
import type { WorldTheme, ThemeVariableOverrides } from '../types';
import { WORLD_DATA_ATTR_MAP, WORLD_DISPLAY_NAMES } from '../data/defaultTheme';

/**
 * 根据世界类型获取对应的主题配置
 *
 * @deprecated 世界主题数据已迁移到后端 API（GET /api/v1/worldviews/[id]/theme），
 *  前端不再维护硬编码主题。返回 undefined，请使用 hooks/useThemeSettings 替代。
 *
 * @param _worldType - 世界类型
 * @returns undefined（兼容旧 API）
 */
export function getWorldTheme(_worldType: WorldType): WorldTheme | undefined {
  return undefined;
}

/**
 * 获取世界类型对应的 data-world 属性值
 *
 * @param worldType - 世界类型
 * @returns data-world 属性值（英文 kebab-case）
 */
export function getDataWorldValue(worldType: WorldType): string {
  return WORLD_DATA_ATTR_MAP[worldType] || 'cultivation';
}

/**
 * 获取世界类型的中文显示名
 *
 * @param worldType - 世界类型
 * @returns 中文显示名
 */
export function getWorldDisplayName(worldType: WorldType): string {
  return WORLD_DISPLAY_NAMES[worldType] || '未知世界';
}

/**
 * 合并主题变量覆盖
 *
 * 按优先级合并：默认值 → 世界主题 → Mod 覆盖。
 * 后一个对象的值覆盖前一个对象的同名 key。
 *
 * @param base - 基础变量（默认主题）
 * @param overrides - 覆盖变量列表（按优先级从低到高）
 * @returns 合并后的变量映射
 */
export function mergeThemeOverrides(
  base: ThemeVariableOverrides,
  ...overrides: (ThemeVariableOverrides | undefined)[]
): ThemeVariableOverrides {
  const result: ThemeVariableOverrides = { ...base };
  for (const override of overrides) {
    if (!override) continue;
    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}
