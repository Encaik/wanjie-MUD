/**
 * 属性显示名映射
 *
 * 根据世界观将内部属性键（体质/灵根/悟性/幸运/意志）映射为对应的显示名。
 * 显示名数据从 World.statDisplayNames 读取，由后端 API 返回。
 */

/** 内部属性键 */
export type StatKey = '体质' | '灵根' | '悟性' | '幸运' | '意志';

/** 所有内部属性键列表 */
export const STAT_KEYS: StatKey[] = ['体质', '灵根', '悟性', '幸运', '意志'];

/** 兜底显示名 */
const DEFAULT_STAT_DISPLAY: Record<StatKey, string> = {
  '体质': '体质',
  '灵根': '灵根',
  '悟性': '悟性',
  '幸运': '幸运',
  '意志': '意志',
};

/**
 * 获取单个属性的世界显示名
 *
 * @param statKey - 内部属性键
 * @param statDisplayNames - 从 World 对象获取的显示名映射
 * @returns 世界对应的属性显示名
 */
export function getStatDisplayName(statKey: string, statDisplayNames?: Record<string, string>): string {
  if (statDisplayNames?.[statKey]) {
    return statDisplayNames[statKey];
  }
  return DEFAULT_STAT_DISPLAY[statKey as StatKey] || statKey;
}

/**
 * 获取当前世界的完整属性标签映射
 *
 * @param statDisplayNames - 从 World 对象获取的显示名映射
 * @returns { labels, statKeys, displayNames }
 */
export function getStatLabels(statDisplayNames?: Record<string, string>): {
  labels: Record<string, string>;
  statKeys: StatKey[];
  displayNames: string[];
} {
  const labels: Record<string, string> = {};
  for (const key of STAT_KEYS) {
    labels[key] = statDisplayNames?.[key] || DEFAULT_STAT_DISPLAY[key];
  }

  return {
    labels,
    statKeys: [...STAT_KEYS],
    displayNames: STAT_KEYS.map(k => labels[k]),
  };
}
