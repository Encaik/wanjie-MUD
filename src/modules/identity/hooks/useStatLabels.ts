/**
 * Hook: useStatLabels
 *
 * 职责：为组件提供当前世界的属性标签，统一替换硬编码属性名。
 * 依赖模块：identity/data/statDisplayNames
 */
import { useMemo } from 'react';

import { getStatLabels, type StatKey } from '../data/statDisplayNames';

export interface StatLabelsResult {
  /** 属性键到显示名的映射：{ '体质': '体能', '灵根': '智力', ... } */
  labels: Record<string, string>;
  /** 内部属性键列表：['体质', '灵根', '悟性', '幸运', '意志'] */
  statKeys: StatKey[];
  /** 当前世界的属性显示名列表：['体能', '智力', '反应', '技术', '魅力'] */
  displayNames: string[];
  /** 根据内部键获取显示名 */
  getLabel: (statKey: string) => string;
}

/**
 * 获取当前世界的属性标签
 *
 * @param statDisplayNames - 从 World 对象获取的显示名映射（如 world.statDisplayNames）
 * @returns 属性标签映射和辅助方法
 */
export function useStatLabels(statDisplayNames?: Record<string, string>): StatLabelsResult {
  return useMemo(() => {
    const { labels, statKeys, displayNames } = getStatLabels(statDisplayNames);

    return {
      labels,
      statKeys,
      displayNames,
      getLabel: (statKey: string) => labels[statKey] || statKey,
    };
  }, [statDisplayNames]);
}
