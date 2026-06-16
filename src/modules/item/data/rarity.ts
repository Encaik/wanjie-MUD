/**
 * 统一稀有度配置
 *
 * 六等制：common → uncommon → rare → epic → legendary → mythic
 * 替代所有旧的 ItemRarity / Quality / QualityTier 体系
 */

import type { Rarity } from '../types';

/** 稀有度完整配置 */
export interface RarityConfig {
  key: Rarity;
  displayName: string;
  color: string;
  /** Tailwind text-* 类名 */
  textClass: string;
  /** Tailwind border-* 类名 */
  borderClass: string;
  /** Tailwind bg-* 类名（带透明度） */
  bgClass: string;
  /** 徽章样式 */
  badgeClass: string;
  /** 最大等级 */
  maxLevel: number;
  /** 技能槽位数量 */
  skillSlots: number;
  /** 碎片合成所需数量 */
  fragmentsRequired: number;
  /** 基础价格 */
  basePrice: number;
  /** 词缀数量范围 [min, max] */
  affixCount: [number, number];
  /** 掉落权重 */
  dropWeight: number;
  /** 属性乘数（baseStats 乘以该值，common 为 1.0） */
  statMultiplier: number;
  /** 升级经验乘数 */
  expMultiplier: number;
  /** 契合加成百分比 */
  compatibleBonus: number;
}

/** 六等稀有度完整配置表 */
export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    key: 'common',
    displayName: '凡品',
    color: '#9CA3AF',
    textClass: 'text-quality-common',
    borderClass: 'border-quality-common',
    bgClass: 'bg-quality-common/10',
    badgeClass: 'bg-quality-common/20 text-quality-common',
    maxLevel: 3,
    skillSlots: 1,
    fragmentsRequired: 3,
    basePrice: 100,
    affixCount: [0, 0],
    dropWeight: 0.50,
    statMultiplier: 1.0,
    expMultiplier: 1.0,
    compatibleBonus: 0.05,
  },
  uncommon: {
    key: 'uncommon',
    displayName: '精良',
    color: '#22C55E',
    textClass: 'text-quality-uncommon',
    borderClass: 'border-quality-uncommon',
    bgClass: 'bg-quality-uncommon/10',
    badgeClass: 'bg-quality-uncommon/20 text-quality-uncommon',
    maxLevel: 5,
    skillSlots: 1,
    fragmentsRequired: 4,
    basePrice: 500,
    affixCount: [1, 1],
    dropWeight: 0.25,
    statMultiplier: 1.3,
    expMultiplier: 1.2,
    compatibleBonus: 0.10,
  },
  rare: {
    key: 'rare',
    displayName: '稀有',
    color: '#3B82F6',
    textClass: 'text-quality-rare',
    borderClass: 'border-quality-rare',
    bgClass: 'bg-quality-rare/10',
    badgeClass: 'bg-quality-rare/20 text-quality-rare',
    maxLevel: 7,
    skillSlots: 2,
    fragmentsRequired: 6,
    basePrice: 2000,
    affixCount: [1, 1],
    dropWeight: 0.15,
    statMultiplier: 1.6,
    expMultiplier: 1.5,
    compatibleBonus: 0.15,
  },
  epic: {
    key: 'epic',
    displayName: '史诗',
    color: '#8B5CF6',
    textClass: 'text-quality-epic',
    borderClass: 'border-quality-epic',
    bgClass: 'bg-quality-epic/10',
    badgeClass: 'bg-quality-epic/20 text-quality-epic',
    maxLevel: 8,
    skillSlots: 2,
    fragmentsRequired: 8,
    basePrice: 8000,
    affixCount: [2, 2],
    dropWeight: 0.07,
    statMultiplier: 2.0,
    expMultiplier: 2.0,
    compatibleBonus: 0.20,
  },
  legendary: {
    key: 'legendary',
    displayName: '传说',
    color: '#F97316',
    textClass: 'text-quality-legendary',
    borderClass: 'border-quality-legendary',
    bgClass: 'bg-quality-legendary/10',
    badgeClass: 'bg-quality-legendary/20 text-quality-legendary',
    maxLevel: 9,
    skillSlots: 3,
    fragmentsRequired: 10,
    basePrice: 30000,
    affixCount: [2, 3],
    dropWeight: 0.025,
    statMultiplier: 2.5,
    expMultiplier: 2.5,
    compatibleBonus: 0.25,
  },
  mythic: {
    key: 'mythic',
    displayName: '神话',
    color: '#EF4444',
    textClass: 'text-quality-mythic',
    borderClass: 'border-quality-mythic',
    bgClass: 'bg-quality-mythic/10',
    badgeClass: 'bg-quality-mythic/20 text-quality-mythic',
    maxLevel: 10,
    skillSlots: 3,
    fragmentsRequired: 12,
    basePrice: 100000,
    affixCount: [3, 3],
    dropWeight: 0.005,
    statMultiplier: 3.0,
    expMultiplier: 3.0,
    compatibleBonus: 0.30,
  },
};

/** 所有稀有度列表（按稀有度递增） */
export const ALL_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

/** 稀有度排序权重（用于排序，数值越大越稀有） */
export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

/** 获取稀有度配置 */
export function getRarityConfig(rarity: Rarity): RarityConfig {
  return RARITY_CONFIG[rarity];
}
