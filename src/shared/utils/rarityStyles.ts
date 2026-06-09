/**
 * 稀有度样式配置
 *
 * 使用全局品质色系统（globals.css --quality-*）的语义化 Token，
 * 对齐 8 级品质色：神话=红(mythic) > 传说=橙(legendary) > 史诗=黄(epic) > 稀有=紫(rare) >
 *               精良=蓝(uncommon) > 优秀=绿(common) > 普通=灰(poor) > 基础=白(basic)
 */
import type { ItemRarity } from '@/shared/lib/types';

/** 稀有度对应的样式 Token — 全部使用 quality-* 语义变量 */
export const RARITY_STYLES: Record<ItemRarity, { border: string; bg: string; text: string; badge: string }> = {
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
  '普通': {
    border: 'border-quality-common',
    bg: 'bg-quality-common/10',
    text: 'text-quality-common',
    badge: 'bg-quality-common/20 text-quality-common',
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
  return RARITY_STYLES[rarity]?.[type] || RARITY_STYLES['普通'][type];
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
