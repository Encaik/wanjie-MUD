/**
 * 世界相关类型定义
 */

import { WorldType, WorldDifficulty } from './base';
import { StatImpact, CharacterStats } from './character';

// 重新导出势力相关类型
export type { Faction, FactionType } from '@/lib/data/factionData';
export { FactionTypeNames, getFactionsByWorld, getFactionById } from '@/lib/data/factionData';

// 境界系统（从 realmData 重新导出）
export type { RealmSystem, RealmTier } from '@/lib/data/realmData';

// 世界影响
export interface WorldImpact {
  description: string;
  impact: StatImpact;
  impactDescription: string;
}

// 世界中的势力信息
export interface WorldFaction {
  id: string;
  name: string;
  type: string;
  description: string;
}

// 世界信息
export interface World {
  id: number;
  name: string;
  type: WorldType;
  description: string;
  powerSystem: string;
  realmSystem: import('@/lib/data/realmData').RealmSystem;
  majorForces: string;
  factions: WorldFaction[];
  worldCoefficient: number;
  difficulty: WorldDifficulty;
  dangers: WorldImpact;
  opportunities: WorldImpact;
}
