/**
 * 功法相关类型定义
 */

import { ItemRarity, TechniqueType, WorldType } from './base';

// 功法定义
export interface Technique {
  id: string;
  name: string;
  type: TechniqueType;
  rarity: ItemRarity;
  description: string;
  power: number;
  bonus: number;
  level: number;
  exp: number;
  mpCost: number;
  worldType?: WorldType;
  // 扩展系统
  proficiency?: number;
  proficiencyLevel?: import('@/lib/game/typesExtension').ProficiencyLevel;
}

// 升级材料
export interface UpgradeMaterial {
  id: string;
  name: string;
  type: import('./base').UpgradeableItemType;
  rarity: ItemRarity;
  level: number;
  exp: number;
  expValue: number;
}
