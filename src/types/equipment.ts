/**
 * 装备相关类型定义
 */

import { ItemRarity, EquipmentSlot, WorldType } from './base';

// 装备定义
export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  description: string;
  attackBonus: number;
  defenseBonus: number;
  power: number;
  level: number;
  exp: number;
  worldType?: WorldType;
  // 扩展系统
  enhancement?: number;
  refinement?: number;
  affixes?: import('@/lib/data/equipmentAffixData').EquipmentAffix[];
  setId?: string;
}

// 装备词缀 - 重新导出
export type { EquipmentAffix, AffixType, AffixEffect } from '@/lib/data/equipmentAffixData';
