/**
 * 品质颜色工具函数
 * 
 * 品质从高到低：红(mythic) > 橙(legendary) > 黄(epic) > 紫(rare) > 蓝(uncommon) > 绿(common) > 灰(poor) > 白(basic)
 */

import { Quality, ImpactLevel } from '@/core/types';

/**
 * 获取品质对应的 Tailwind 类名
 * @param quality 品质类型
 * @returns 包含背景、文字、边框颜色的类名字符串
 */
export function getQualityClasses(quality: Quality): {
  bg: string;
  text: string;
  border: string;
  badge: string; // 完整的 Badge 样式
} {
  const classes: Record<Quality, { bg: string; text: string; border: string; badge: string }> = {
    mythic: {
      bg: 'bg-quality-mythic/20',
      text: 'text-quality-mythic',
      border: 'border-quality-mythic/50',
      badge: 'bg-quality-mythic/20 text-quality-mythic border-quality-mythic/50',
    },
    legendary: {
      bg: 'bg-quality-legendary/20',
      text: 'text-quality-legendary',
      border: 'border-quality-legendary/50',
      badge: 'bg-quality-legendary/20 text-quality-legendary border-quality-legendary/50',
    },
    epic: {
      bg: 'bg-quality-epic/25',
      text: 'text-quality-epic',
      border: 'border-quality-epic/50',
      badge: 'bg-quality-epic/25 text-quality-epic border-quality-epic/50',
    },
    rare: {
      bg: 'bg-quality-rare/20',
      text: 'text-quality-rare',
      border: 'border-quality-rare/50',
      badge: 'bg-quality-rare/20 text-quality-rare border-quality-rare/50',
    },
    uncommon: {
      bg: 'bg-quality-uncommon/20',
      text: 'text-quality-uncommon',
      border: 'border-quality-uncommon/50',
      badge: 'bg-quality-uncommon/20 text-quality-uncommon border-quality-uncommon/50',
    },
    common: {
      bg: 'bg-quality-common/20',
      text: 'text-quality-common',
      border: 'border-quality-common/50',
      badge: 'bg-quality-common/20 text-quality-common border-quality-common/50',
    },
    poor: {
      bg: 'bg-quality-poor/20',
      text: 'text-quality-poor',
      border: 'border-quality-poor/50',
      badge: 'bg-quality-poor/20 text-quality-poor border-quality-poor/50',
    },
    basic: {
      bg: 'bg-quality-basic/30',
      text: 'text-quality-basic',
      border: 'border-quality-basic/50',
      badge: 'bg-quality-basic/30 text-quality-basic border-quality-basic/50',
    },
  };

  return classes[quality];
}

/**
 * 将旧的 ImpactLevel 映射到新的 Quality
 * ImpactLevel 是 Quality 的子集
 */
export function impactLevelToQuality(level: ImpactLevel): Quality {
  const mapping: Record<ImpactLevel, Quality> = {
    legendary: 'legendary',
    epic: 'epic',
    rare: 'rare',
    uncommon: 'uncommon',
    common: 'common',
  };
  return mapping[level];
}

/**
 * 根据数值影响判断品质
 * @param totalImpact 总影响值（正数为增益，负数为减益）
 * @returns 品质类型
 */
export function getQualityByImpact(totalImpact: number): Quality {
  if (totalImpact >= 15) return 'mythic';
  if (totalImpact >= 10) return 'legendary';
  if (totalImpact >= 5) return 'epic';
  if (totalImpact >= 2) return 'rare';
  if (totalImpact >= 0) return 'uncommon';
  if (totalImpact >= -3) return 'common';
  if (totalImpact >= -8) return 'poor';
  return 'basic';
}

/**
 * 属性名称显示映射（中文）
 */
export const StatDisplayNames: Record<string, string> = {
  体质: '体质',
  灵根: '灵根',
  悟性: '悟性',
  幸运: '幸运',
  意志: '意志',
};
