/**
 * 统一物品事件定义
 *
 * 替代旧的分散事件：equipment_collected、technique_collected、fragment_collected
 */

import type { ItemInstance } from './types';

/** 物品获得事件 */
export interface ItemObtainedEvent {
  type: 'item_obtained';
  item: ItemInstance;
  source: 'drop' | 'shop' | 'craft' | 'quest' | 'initial';
}

/** 物品使用事件 */
export interface ItemUsedEvent {
  type: 'item_used';
  instanceId: string;
  templateId: string;
  itemName: string;
}

/** 物品装备事件 */
export interface ItemEquippedEvent {
  type: 'item_equipped';
  instanceId: string;
  templateId: string;
  itemName: string;
  slotId: string;
}

/** 物品卸下事件 */
export interface ItemUnequippedEvent {
  type: 'item_unequipped';
  instanceId: string;
  templateId: string;
  itemName: string;
  slotId: string;
}

/** 物品升级事件 */
export interface ItemUpgradedEvent {
  type: 'item_upgraded';
  instanceId: string;
  templateId: string;
  itemName: string;
  fromLevel: number;
  toLevel: number;
}

/** 物品拆解事件 */
export interface ItemFragmentedEvent {
  type: 'item_fragmented';
  instanceId: string;
  templateId: string;
  itemName: string;
  fragmentCount: number;
}

/** 碎片合成事件 */
export interface ItemSynthesizedEvent {
  type: 'item_synthesized';
  templateId: string;
  itemName: string;
  fragmentCount: number;
}

/** 统一物品事件联合类型 */
export type ItemEvent =
  | ItemObtainedEvent
  | ItemUsedEvent
  | ItemEquippedEvent
  | ItemUnequippedEvent
  | ItemUpgradedEvent
  | ItemFragmentedEvent
  | ItemSynthesizedEvent;
