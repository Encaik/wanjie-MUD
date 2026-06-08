/**
 * 适配器模块导出
 */

// 基类和工具
export type { EffectAdapter } from './base';
export { STAT_NAME_MAP, mapStatName, generateEffectId, createBaseEffect } from './base';

// 各效果来源适配器
export { EquipmentAdapter } from './equipmentAdapter';
export { TechniqueAdapter } from './techniqueAdapter';
export { WorldDangerAdapter, WorldOpportunityAdapter } from './worldEffectAdapter';
export { PillAdapter } from './pillAdapter';
export { TitleAdapter } from './titleAdapter';
export { BuffAdapter } from './buffAdapter';
export { RealmAdapter } from './realmAdapter';
export { FactionAdapter, SchoolAdapter } from './factionAdapter';

// 类型导入
import { BuffAdapter } from './buffAdapter';
import { EquipmentAdapter } from './equipmentAdapter';
import { FactionAdapter, SchoolAdapter } from './factionAdapter';
import { PillAdapter } from './pillAdapter';
import { RealmAdapter } from './realmAdapter';
import { TechniqueAdapter } from './techniqueAdapter';
import { TitleAdapter } from './titleAdapter';
import { WorldDangerAdapter, WorldOpportunityAdapter } from './worldEffectAdapter';

import type { EffectAdapter } from './base';
import type { CalculationContext, EquipmentInput, TechniqueInput, WorldEffectInput, ActiveEffectInput, TitleInput, BuffInput, RealmInput, FactionInput, SchoolInput } from '../context/types';
import type { EffectSourceType } from '../types';

// ============================================
// 适配器注册表
// ============================================

/** 所有适配器的映射 */
export const AllAdapters: Record<string, EffectAdapter<unknown>> = {
  equipment: EquipmentAdapter as EffectAdapter<unknown>,
  technique: TechniqueAdapter as EffectAdapter<unknown>,
  world_danger: WorldDangerAdapter as EffectAdapter<unknown>,
  world_opportunity: WorldOpportunityAdapter as EffectAdapter<unknown>,
  pill: PillAdapter as EffectAdapter<unknown>,
  title: TitleAdapter as EffectAdapter<unknown>,
  buff: BuffAdapter as EffectAdapter<unknown>,
  realm: RealmAdapter as EffectAdapter<unknown>,
  faction: FactionAdapter as EffectAdapter<unknown>,
  school: SchoolAdapter as EffectAdapter<unknown>,
};

/**
 * 获取适配器
 */
export function getAdapter(sourceType: EffectSourceType): EffectAdapter<unknown> | undefined {
  return AllAdapters[sourceType];
}
