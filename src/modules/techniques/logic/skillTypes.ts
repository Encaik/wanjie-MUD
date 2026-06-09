/**
 * 功法技能（法技）与武器技巧（斗技）类型定义
 * 
 * 核心设计：
 * - 功法拥有法技，武器拥有斗技
 * - 技能解锁 ≠ 技能可用，需装备到槽位
 * - 满级10级制，按稀有度不同
 */

import { Element } from '@/modules/combat/logic/restraintSystem';

// ============================================
// 技能标签
// ============================================

/** 技能标签类型 */
export type SkillTag = 
  | 'instant'      // 瞬发
  | 'channeling'   // 引导
  | 'aoe'          // 范围
  | 'dot'          // 持续伤害
  | 'hot'          // 持续治疗
  | 'shield'       // 护盾
  | 'lifesteal'    // 吸血
  | 'execute'      // 斩杀
  | 'combo'        // 连击
  | 'counter';     // 反击

// ============================================
// 技能效果
// ============================================

/** 技能效果类型 */
export type SkillEffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'shield' | 'special';

/** 技能目标类型 */
export type SkillTarget = 'self' | 'single' | 'all' | 'random';

/** 技能效果 */
export interface SkillEffect {
  /** 效果类型 */
  type: SkillEffectType;
  /** 基础数值 */
  baseValue: number;
  /** 属性加成系数 */
  statScaling: number;
  /** 目标类型 */
  target: SkillTarget;
  /** 持续回合（buff/debuff） */
  duration?: number;
  /** 描述文本 */
  description?: string;
}

// ============================================
// 功法技能（法技）
// ============================================

/** 功法技能定义 */
export interface TechniqueSkill {
  /** 技能ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 解锁等级（功法等级达到此值解锁） */
  unlockLevel: number;
  /** 法力消耗 */
  mpCost: number;
  /** 冷却回合数 */
  cooldown: number;
  /** 技能效果 */
  effects: SkillEffect[];
  /** 技能标签 */
  tags: SkillTag[];
  /** 是否为终极技能 */
  isUltimate?: boolean;
}

// ============================================
// 武器技巧（斗技）
// ============================================

/** 技巧触发类型 */
export type TechniqueTriggerType = 'on_attack' | 'on_hit' | 'on_kill' | 'on_crit' | 'passive' | 'active';

/** 技巧触发条件 */
export interface TechniqueTrigger {
  /** 触发类型 */
  type: TechniqueTriggerType;
  /** 触发概率（0-1） */
  chance?: number;
  /** 冷却回合 */
  cooldown?: number;
}

/** 技巧效果类型 */
export type TechniqueEffectType = 'damage_bonus' | 'crit_bonus' | 'lifesteal' | 'element_damage' | 'special';

/** 技巧效果 */
export interface TechniqueEffect {
  /** 效果类型 */
  type: TechniqueEffectType;
  /** 效果数值 */
  value: number;
  /** 关联元素 */
  element?: Element;
  /** 描述文本 */
  description?: string;
}

/** 武器技巧定义 */
export interface WeaponTechnique {
  /** 技巧ID */
  id: string;
  /** 技巧名称 */
  name: string;
  /** 技巧描述 */
  description: string;
  /** 解锁等级（武器等级达到此值解锁） */
  unlockLevel: number;
  /** 触发条件 */
  trigger: TechniqueTrigger;
  /** 效果列表 */
  effects: TechniqueEffect[];
  /** 是否为终极技巧 */
  isUltimate?: boolean;
}

// ============================================
// 技能槽位系统
// ============================================

/** 技能槽位状态 */
export interface SkillSlot {
  /** 槽位索引（0开始） */
  index: number;
  /** 是否已解锁 */
  unlocked: boolean;
  /** 解锁所需物品等级 */
  unlockLevel: number;
  /** 当前装备的技能ID（null表示空槽） */
  equippedSkillId: string | null;
}

// ============================================
// 装备操作结果
// ============================================

/** 装备操作结果 */
export interface EquipResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message?: string;
  /** 错误信息 */
  error?: string;
  /** 提示信息 */
  hint?: string;
  /** 更新后的功法对象（用于触发 React 状态更新） */
  updatedTechnique?: any;
  /** 更新后的装备对象（用于触发 React 状态更新） */
  updatedEquipment?: any;
}

// ============================================
// 稀有度配置
// ============================================

/** 稀有度类型 */
export type ItemRarity = '普通' | '稀有' | '史诗' | '传说' | '神话';

/** 稀有度配置 */
export interface RarityConfig {
  /** 最大等级 */
  maxLevel: number;
  /** 技能/技巧数量范围 */
  skillCount: [number, number];
  /** 技能槽位上限 */
  maxSkillSlots: number;
  /** 契合加成 */
  compatibleBonus: number;
  /** 残本/残片所需数量 */
  fragmentsRequired: number;
}

/** 功法稀有度配置 */
export const TECHNIQUE_RARITY_CONFIG: Record<ItemRarity, RarityConfig> = {
  '普通': {
    maxLevel: 5,
    skillCount: [1, 2],
    maxSkillSlots: 2,
    compatibleBonus: 0.10,
    fragmentsRequired: 3,
  },
  '稀有': {
    maxLevel: 7,
    skillCount: [2, 3],
    maxSkillSlots: 3,
    compatibleBonus: 0.12,
    fragmentsRequired: 4,
  },
  '史诗': {
    maxLevel: 8,
    skillCount: [3, 4],
    maxSkillSlots: 4,
    compatibleBonus: 0.15,
    fragmentsRequired: 5,
  },
  '传说': {
    maxLevel: 9,
    skillCount: [4, 5],
    maxSkillSlots: 5,
    compatibleBonus: 0.18,
    fragmentsRequired: 7,
  },
  '神话': {
    maxLevel: 10,
    skillCount: [5, 6],
    maxSkillSlots: 6,
    compatibleBonus: 0.25,
    fragmentsRequired: 10,
  },
};

/** 武器稀有度配置 */
export const EQUIPMENT_RARITY_CONFIG: Record<ItemRarity, RarityConfig> = {
  '普通': {
    maxLevel: 5,
    skillCount: [1, 2],
    maxSkillSlots: 2,
    compatibleBonus: 0.10,
    fragmentsRequired: 5,
  },
  '稀有': {
    maxLevel: 7,
    skillCount: [2, 3],
    maxSkillSlots: 3,
    compatibleBonus: 0.12,
    fragmentsRequired: 7,
  },
  '史诗': {
    maxLevel: 8,
    skillCount: [3, 4],
    maxSkillSlots: 4,
    compatibleBonus: 0.15,
    fragmentsRequired: 10,
  },
  '传说': {
    maxLevel: 9,
    skillCount: [4, 5],
    maxSkillSlots: 5,
    compatibleBonus: 0.18,
    fragmentsRequired: 15,
  },
  '神话': {
    maxLevel: 10,
    skillCount: [5, 6],
    maxSkillSlots: 6,
    compatibleBonus: 0.25,
    fragmentsRequired: 20,
  },
};

/** 稀有度顺序 */
export const RARITY_ORDER: ItemRarity[] = ['普通', '稀有', '史诗', '传说', '神话'];

/** 稀有度权重（用于掉落概率） */
export const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  '普通': 60,
  '稀有': 25,
  '史诗': 10,
  '传说': 4,
  '神话': 1,
};

// ============================================
// 等级解锁配置
// ============================================

/** 获取指定等级解锁的槽位数量 */
export function getUnlockedSlotCount(level: number, maxSlots: number): number {
  // 每级解锁一个槽位，直到最大值
  return Math.min(level, maxSlots);
}

/** 获取槽位解锁等级 */
export function getSlotUnlockLevel(slotIndex: number): number {
  // 槽位1在等级1解锁，槽位2在等级2解锁，以此类推
  return slotIndex + 1;
}
