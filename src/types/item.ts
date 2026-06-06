/**
 * 道具相关类型定义
 */

import { ItemType, ItemRarity, EffectType } from './base';

// 道具效果
export interface ItemEffect {
  type: EffectType;
  value: number;
  duration?: number;
  description: string;
}

// 道具定义
export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  effects: ItemEffect[];
  stackable: boolean;
  maxStack: number;
  worldTypes?: import('./base').WorldType[];
}

// 背包道具实例
export interface InventoryItem {
  definition: ItemDefinition;
  quantity: number;
  remainingUses?: number;
}

// 活跃效果（正在生效的道具效果）
export interface ActiveEffect {
  itemId: string;
  itemName: string;
  type: EffectType;
  value: number;
  remainingCount: number;
}

// 玩家货币（完整定义请使用 import { PlayerCurrencies } from '@/lib/game/shop/types'）
export interface PlayerCurrencies {
  spirit_stone?: number; // 灵石
  contribution: number; // 势力贡献点
  sect_point?: number; // 宗门积分
  honor_point?: number; // 荣誉值
  ascension_mark?: number; // 飞升印记
  event_token?: number; // 活动代币
}
