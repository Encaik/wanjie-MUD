/**
 * Barrel re-export — 核心游戏类型 + 跨模块便利导出
 *
 * @deprecated 核心类型使用 @/core/types 代替。
 * 跨模块便利导出（Element, Faction 等）建议从对应模块直接导入。
 * 旧路径保留用于向后兼容。
 */

// 核心类型
export * from '@/core/types';

// 跨模块便利导出（向后兼容）
export type { DifficultyLevel } from '@/modules/identity/data/worldData';

export type { FragmentDropData, FragmentDropResult } from '@/modules/crafting/logic/fragmentSystem';

export type { Faction, FactionType } from '@/modules/faction/data/factionData';
export { FactionTypeNames, getFactionsByWorld, getFactionById } from '@/modules/faction/data/factionData';

export type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
export {
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
  ELEMENT_KEYWORDS,
  WEAPON_KEYWORDS,
  getElementIcon,
  getWeaponCategoryIcon,
} from '@/modules/combat/logic/restraintSystem';
