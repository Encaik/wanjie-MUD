/**
 * 稀有度样式配置（主题模块权威来源）
 *
 * 使用全局品质色系统（8 级）的语义化 Token。
 * 品质从高到低：神话(mythic) > 传说(legendary) > 史诗(epic) > 稀有(rare) >
 *               精良(uncommon) > 优秀(common) > 普通(poor) > 基础(basic)
 *
 * @module modules/theme/data
 */
import type { ItemRarity } from '@/shared/lib/types';

/** 扩展稀有度类型（未来 ItemRarity 可能扩展为 8 级） */
export type ExtendedRarity = ItemRarity | '精良' | '优秀' | '劣质' | '基础';

/** 稀有度对应的样式 Token — 全部使用 quality-* 语义变量 */
export const RARITY_STYLES: Record<ExtendedRarity, { border: string; bg: string; text: string; badge: string }> = {
  '神话': {
    border: 'border-quality-mythic',
    bg: 'bg-quality-mythic/10',
    text: 'text-quality-mythic',
    badge: 'bg-quality-mythic/20 text-quality-mythic',
  },
  '传说': {
    border: 'border-quality-legendary',
    bg: 'bg-quality-legendary/10',
    text: 'text-quality-legendary',
    badge: 'bg-quality-legendary/20 text-quality-legendary',
  },
  '史诗': {
    border: 'border-quality-epic',
    bg: 'bg-quality-epic/10',
    text: 'text-quality-epic',
    badge: 'bg-quality-epic/20 text-quality-epic',
  },
  '稀有': {
    border: 'border-quality-rare',
    bg: 'bg-quality-rare/10',
    text: 'text-quality-rare',
    badge: 'bg-quality-rare/20 text-quality-rare',
  },
  '精良': {
    border: 'border-quality-uncommon',
    bg: 'bg-quality-uncommon/10',
    text: 'text-quality-uncommon',
    badge: 'bg-quality-uncommon/20 text-quality-uncommon',
  },
  '优秀': {
    border: 'border-quality-common',
    bg: 'bg-quality-common/10',
    text: 'text-quality-common',
    badge: 'bg-quality-common/20 text-quality-common',
  },
  '普通': {
    border: 'border-quality-poor',
    bg: 'bg-quality-poor/10',
    text: 'text-quality-poor',
    badge: 'bg-quality-poor/20 text-quality-poor',
  },
  '劣质': {
    border: 'border-quality-poor',
    bg: 'bg-quality-poor/10',
    text: 'text-quality-poor',
    badge: 'bg-quality-poor/20 text-quality-poor',
  },
  '基础': {
    border: 'border-quality-basic',
    bg: 'bg-quality-basic/10',
    text: 'text-quality-basic',
    badge: 'bg-quality-basic/20 text-quality-basic',
  },
};

/**
 * 获取指定稀有度的样式类名
 *
 * @param rarity - 物品稀有度
 * @param type - 样式类型（border/bg/text/badge）
 * @returns 对应的 Tailwind CSS 类名字符串
 */
export function getRarityStyle(
  rarity: ItemRarity,
  type: 'border' | 'bg' | 'text' | 'badge' = 'border',
): string {
  return (RARITY_STYLES as Record<string, { border: string; bg: string; text: string; badge: string }>)[rarity]?.[type]
    || RARITY_STYLES['普通'][type];
}

/**
 * 统计值颜色静态映射
 *
 * 替换 item-tooltip 中 `text-${stat.color}-500` 动态类名
 * （Tailwind 不会为动态拼接的类名生成 CSS）
 */
export const STAT_COLOR_MAP: Record<string, string> = {
  red: 'text-quality-mythic',
  orange: 'text-quality-legendary',
  yellow: 'text-quality-epic',
  purple: 'text-quality-rare',
  blue: 'text-quality-uncommon',
  green: 'text-quality-common',
  gray: 'text-quality-poor',
  white: 'text-quality-basic',
};

/**
 * 根据颜色名称获取统计值颜色类名
 *
 * @param color - 颜色名称（如 "red"、"blue"）
 * @returns 对应的 quality-* 文本颜色类名，未匹配时返回默认色
 */
export function getStatColor(color?: string): string {
  if (color && STAT_COLOR_MAP[color]) {
    return STAT_COLOR_MAP[color];
  }
  return 'text-muted-foreground';
}
