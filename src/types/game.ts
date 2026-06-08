/**
 * 游戏状态相关类型定义
 */

import { GamePhase, ActionTab, AdventurePhase } from './base';
import { Character, CharacterStats } from './character';
import { BattleState, AdventureEvent, AdventureCell, DungeonConfig } from './combat';
import { Equipment } from './equipment';
import { InventoryItem, ActiveEffect, PlayerCurrencies } from './item';
import { Technique } from './technique';
import { World } from './world';

// 消息记录
export interface MessageRecord {
  id: string;
  timestamp: number;
  type: 'success' | 'failure' | 'info' | 'warning';
  title: string;
  content: string;
  details?: string;
  rewards?: {
    stats?: Partial<CharacterStats>;
    statDetails?: { stat: string; base: number; boost: number }[];
    items?: InventoryItem[];
    experience?: number;
    technique?: Technique;
    equipment?: Equipment;
  };
}

// 通用行动结果
export interface ActionResult {
  success?: boolean;
  victory?: boolean;
  message: string;
  statChanges?: Partial<CharacterStats>;
  itemsCost?: InventoryItem[];
  rewards?: {
    stats?: Partial<CharacterStats>;
    items?: InventoryItem[];
    experience?: number;
  };
  battleState?: BattleState;
  breakthroughAttempt?: boolean;
  breakthroughSuccess?: boolean;
}

// 修炼结果
export interface CultivationResult {
  success: boolean;
  message: string;
  statChanges: Partial<CharacterStats>;
  itemsCost?: InventoryItem[];
  canAfford?: boolean;
  breakthroughAttempt?: boolean;
  breakthroughSuccess?: boolean;
  cultivationBoost?: number;
  baseGains?: Partial<CharacterStats>;
  boostGains?: Partial<CharacterStats>;
}

// 炼丹状态
export interface CraftingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: '极品' | '上品' | '中品' | '下品';
  success: boolean;
}

// 炼器状态
export interface ForgingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: '完美' | '优秀' | '精良' | '普通';
  success: boolean;
}

// 主角完整信息
export interface Protagonist {
  character: Character;
  world: World;
  backstory: string;
  level: number;
  realm: string;
  stats: CharacterStats;
  statCapBonuses: Partial<CharacterStats>;
  inventory: InventoryItem[];
  activeEffects: ActiveEffect[];
  experience: number;
  overflowExperience: number;
  // HP/MP系统
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  // 功法系统
  techniques: Technique[];
  equippedAttackTechniques: (Technique | null)[];
  equippedDefenseTechniques: (Technique | null)[];
  // 装备系统
  equipments: Equipment[];
  equippedMelee: Equipment | null;
  equippedRanged: Equipment | null;
  equippedHead: Equipment | null;
  equippedBody: Equipment | null;
  equippedLegs: Equipment | null;
  equippedFeet: Equipment | null;
  // 势力系统
  factionId: string | null;
  factionJoinTime?: number;
  // 扩展系统
  cultivationPath?: import('./base').CultivationPath;
  pathExp?: number;
  pathLevel?: number;
  factionProgress?: import('@/lib/game/typesExtension').FactionProgress;
  currencies?: PlayerCurrencies;
}

// 游戏统计数据
export interface GameStatistics {
  maxLevel: number;
  totalEnemiesKilled: number;
  totalBossKilled: number;
  totalEliteKilled: number;
  totalTechniquesCollected: number;
  totalEquipmentsCollected: number;
  totalAdventuresCompleted: number;
  clearedDifficulties: number[]; // 已通关的机缘难度等级列表
  totalCultivations: number;
  totalBreakthroughs: number;
  totalSpiritStonesEarned: number;
  totalItemsCollected: number;
  totalAlchemyCrafted: number;
  totalForgeCrafted: number;
  playTime: number;
  lastPlayedAt: number;
}

// 默认统计数据
export const DEFAULT_STATISTICS: GameStatistics = {
  maxLevel: 1,
  totalEnemiesKilled: 0,
  totalBossKilled: 0,
  totalEliteKilled: 0,
  totalTechniquesCollected: 0,
  totalEquipmentsCollected: 0,
  totalAdventuresCompleted: 0,
  clearedDifficulties: [], // 已通关的机缘难度等级列表
  totalCultivations: 0,
  totalBreakthroughs: 0,
  totalSpiritStonesEarned: 0,
  totalItemsCollected: 0,
  totalAlchemyCrafted: 0,
  totalForgeCrafted: 0,
  playTime: 0,
  lastPlayedAt: Date.now(),
};

// 成就状态
export type AchievementStatus = 'locked' | 'unlocked' | 'claimed';

// 图鉴状态
export type CollectionStatus = 'undiscovered' | 'discovered' | 'completed';

// 完整游戏状态
export interface GameState {
  phase: GamePhase;
  characters: Character[];
  worlds: World[];
  selectedCharacter: Character | null;
  selectedWorld: World | null;
  protagonist: Protagonist | null;
  currentEvent: AdventureEvent | null;
  lastActionResult: ActionResult | null;
  adventureGrid: AdventureCell[][] | null;
  adventurePosition: { row: number; col: number } | null;
  adventureConfig: DungeonConfig | null;
  adventurePhase: AdventurePhase;
  adventureLoot: InventoryItem[];
  adventureExperience: number; // 待结算经验值
  currentTab: ActionTab;
  battleState: BattleState | null;
  messages: MessageRecord[];
  autoCultivating: boolean;
  lastExploreTime: number;
  totalMessageCount: number;
  crafting: CraftingState | null;
  forging: ForgingState | null;
  statistics: GameStatistics;
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
}
