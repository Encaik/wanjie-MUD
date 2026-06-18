/**
 * modules/fortune/types.ts — 机缘模块类型定义
 *
 * 定义机缘探索系统的全部类型：主题、地形、节点、地图、会话、事件。
 */

import type { WorldType } from '@/core/types';
import type { ItemInstance } from '@/modules/item/types';

// ============================================
// 机缘主题
// ============================================

/** 机缘主题 ID（预设 + Mod 扩展） */
export type FortuneTypeId =
  | 'spirit_vein'
  | 'ancient_battlefield'
  | 'herb_valley'
  | 'mystic_realm'
  | 'demon_abyss'
  | string; // Mod 扩展

// ============================================
// 地形
// ============================================

/** 地形类型 */
export type TerrainType = 'plain' | 'forest' | 'cave' | 'cliff' | 'swamp' | 'spring' | 'ruins';

/** 地形进入效果 */
export interface TerrainEffect {
  /** 体力消耗 */
  staminaCost: number;
  /** HP 变化比例（负数=扣血，正数=回血） */
  hpChangeRatio: number;
  /** MP 变化比例 */
  mpChangeRatio: number;
  /** 应用临时 Buff/Debuff */
  appliedBuffs?: string[];
}

// ============================================
// 节点
// ============================================

/** 节点分类 */
export type NodeCategory = 'combat' | 'resource' | 'interactive' | 'special';

/** 节点类型 */
export type NodeType =
  | 'enemy' | 'elite' | 'miniboss' | 'guardian'           // 战斗类
  | 'treasure' | 'mineral_vein' | 'herb' | 'scroll_fragment' // 资源类
  | 'event' | 'merchant' | 'altar' | 'challenge'           // 交互类
  | 'portal' | 'trap' | 'fog';                              // 特殊类

/** 节点内容 — 敌人信息 */
export interface EnemyContent {
  name: string;
  level: number;
  tier: 'normal' | 'elite' | 'miniboss' | 'boss';
}

/** 节点内容 — 事件信息 */
export interface EventContent {
  eventId: string;
  eventTitle: string;
  eventDescription: string;
}

/** 节点内容联合 */
export type NodeContent = EnemyContent | EventContent | Record<string, never>;

/** 机缘地图上的单个节点 */
export interface FortuneNode {
  /** 节点类型 */
  type: NodeType;
  /** 节点分类 */
  category: NodeCategory;
  /** 难度系数 */
  difficulty: number;
  /** 该节点奖励倍率 */
  rewardMultiplier: number;
  /** 节点内容 */
  content: NodeContent;
  /** 是否已清除 */
  isCleared: boolean;
  /** 是否为隐藏节点（高望气术才可见） */
  isHidden: boolean;
}

// ============================================
// 地图
// ============================================

/** 网格坐标 */
export interface GridPosition {
  row: number;
  col: number;
}

/** 机缘地图单格 */
export interface FortuneCell {
  /** 地形类型 */
  terrain: TerrainType;
  /** 节点（null 表示空格子） */
  node: FortuneNode | null;
  /** 是否在视野中已揭示 */
  isRevealed: boolean;
  /** 是否已被访问过 */
  isVisited: boolean;
}

/** 一层机缘地图 */
export interface FortuneMap {
  /** 地图唯一 ID */
  id: string;
  /** 机缘主题 */
  fortuneType: FortuneTypeId;
  /** 当前楼层（1-based） */
  depth: number;
  /** 总楼层数 */
  maxDepth: number;
  /** 网格 */
  grid: FortuneCell[][];
  /** 玩家起点 */
  playerStart: GridPosition;
  /** 楼层出口 */
  floorExit: GridPosition;
  /** 当前层奖励倍率 */
  rewardMultiplier: number;
  /** 生成种子 */
  seed: number;
  /** 行数 */
  rows: number;
  /** 列数 */
  cols: number;
}

// ============================================
// 视野
// ============================================

/** 望气术等级 */
export type SenseLevel = 0 | 1 | 2 | 3;

/** 视野内的单格信息 */
export interface VisibleCell {
  position: GridPosition;
  terrain: TerrainType;
  nodeType: NodeType | null;
  nodeCategory: NodeCategory | null;
  /** 模糊信息文本 */
  hint: string;
  /** 是否完全可见（vs 仅知道类型） */
  isFullyVisible: boolean;
  isCleared: boolean;
  isVisited: boolean;
  isHidden: boolean;
}

/** 方向感应提示 */
export interface SenseHint {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  hintType: 'enemy' | 'treasure' | 'danger' | 'mystery' | 'safe';
  text: string;
  confidence: 'vague' | 'clear' | 'precise';
}

// ============================================
// 收获
// ============================================

/** 机缘收获 */
export interface FortuneLoot {
  /** 灵石 */
  spiritStones: number;
  /** 物品实例 */
  items: ItemInstance[];
  /** 碎片 */
  fragments: FragmentGain[];
  /** 经验值 */
  experience: number;
}

/** 碎片获得记录 */
export interface FragmentGain {
  sourceName: string;
  type: 'technique' | 'equipment';
  rarity: string;
  count: number;
}

// ============================================
// 会话
// ============================================

/** 机缘探索会话 */
export interface FortuneSession {
  /** 会话 ID */
  id: string;
  /** 机缘主题 */
  fortuneType: FortuneTypeId;
  /** 当前深度 */
  currentDepth: number;
  /** 最大深度 */
  maxDepth: number;
  /** 当前楼层地图 */
  currentMap: FortuneMap;
  /** 玩家当前位置 */
  playerPosition: GridPosition;
  /** 当前体力 */
  stamina: number;
  /** 最大体力 */
  maxStamina: number;
  /** 累积收获 */
  accumulatedLoot: FortuneLoot;
  /** 当前活跃 Buff ID 列表 */
  activeBuffs: string[];
  /** 已击败敌人数量 */
  enemiesDefeated: number;
  /** 已访问节点数量 */
  nodesVisited: number;
  /** 进入时间戳 */
  startTime: number;
  /** 每层独立收获记录（用于死亡惩罚计算） */
  depthLoots: FortuneLoot[];
  /** 生成种子 */
  seed: number;
}

// ============================================
// 机缘阶段
// ============================================

/** 机缘页面阶段 */
export type FortunePhase = 'hub' | 'exploring' | 'floor_transition' | 'result';

// ============================================
// GameState 切片
// ============================================

/** 机缘 GameState 切片 */
export interface FortuneSlice {
  /** 当前会话（null = 不在机缘中） */
  session: FortuneSession | null;
  /** 页面阶段 */
  phase: FortunePhase;
  /** 上次节点处理结果 */
  lastNodeResult: NodeResult | null;
  /** 楼层过渡数据 */
  floorTransition: FloorTransition | null;
  /** 结算结果 */
  settlement: SettlementResult | null;
  /** 待处理的战斗遭遇（非 null 表示需要弹出战斗对话框） */
  pendingBattle: BattleEncounter | null;
}

// ============================================
// 结果类型
// ============================================

/** 节点处理结果 */
export interface NodeResult {
  /** 是否成功处理 */
  success: boolean;
  /** 节点类型 */
  nodeType: NodeType;
  /** 结果消息 */
  message: string;
  /** 是否需要战斗 */
  requiresBattle: boolean;
  /** 战斗数据（仅战斗类节点） */
  battleData?: BattleEncounter;
  /** 直接奖励（非战斗节点） */
  directRewards?: FortuneLoot;
  /** 玩家 HP 变化 */
  hpChange?: number;
  /** 玩家 MP 变化 */
  mpChange?: number;
  /** 体力变化 */
  staminaChange?: number;
}

/** 战斗遭遇数据 */
export interface BattleEncounter {
  enemyName: string;
  enemyLevel: number;
  enemyTier: 'normal' | 'elite' | 'miniboss' | 'boss';
  nodeType: NodeType;
}

/** 楼层过渡信息 */
export interface FloorTransition {
  /** 当前楼层 */
  currentDepth: number;
  /** 下一楼层预览 */
  nextFloorPreview: FloorPreview | null;
  /** 当前楼层收获 */
  floorLoot: FortuneLoot;
  /** 累积收获 */
  accumulatedLoot: FortuneLoot;
  /** 是否可以继续（已经是最后一层则不能） */
  canContinue: boolean;
}

/** 下一楼层预览 */
export interface FloorPreview {
  depth: number;
  gridSize: number;
  rewardMultiplier: number;
  enemyLevelRange: [number, number];
}

/** 撤退结果 */
export interface RetreatResult {
  /** 保留的收获 */
  retainedLoot: FortuneLoot;
  /** 解锁的扫荡深度 */
  unlockedSweepDepth: number;
}

/** 死亡惩罚 */
export interface DeathPenalty {
  /** 丢失的收获 */
  lostLoot: FortuneLoot;
  /** 保留的收获 */
  retainedLoot: FortuneLoot;
  /** 死亡楼层 */
  deathDepth: number;
  /** 丢失楼层范围文本 */
  penaltyDescription: string;
}

/** 通关奖励 */
export interface CompletionBonus {
  /** 额外灵石 */
  spiritStones: number;
  /** 额外经验 */
  experience: number;
  /** 解锁的扫荡深度 */
  unlockedSweepDepth: number;
}

/** 结算结果 */
export interface SettlementResult {
  /** 结算类型 */
  type: 'retreat' | 'death' | 'completion';
  /** 最终收获 */
  finalLoot: FortuneLoot;
  /** 奖励汇总文本 */
  summary: string;
  /** 解锁信息 */
  unlockInfo?: string;
}

// ============================================
// Mod 事件注入
// ============================================

/** 机缘事件选择项 */
export interface FortuneEventChoice {
  /** 选择文本 */
  text: string;
  /** 选择效果 */
  effects: {
    /** 灵石变化 */
    spiritStones?: number;
    /** 经验变化 */
    experience?: number;
    /** HP 变化 */
    hpChange?: number;
    /** MP 变化 */
    mpChange?: number;
    /** 触发战斗 */
    startBattle?: string;
    /** 获得物品（templateId -> quantity） */
    items?: Record<string, number>;
    /** 获得碎片 */
    fragments?: FragmentGain[];
    /** 施加 Buff */
    buffs?: string[];
  };
  /** 选择结果文本 */
  resultText: string;
}

/** 机缘事件模板（Mod 可注入） */
export interface FortuneEventTemplate {
  /** 事件唯一 ID */
  id: string;
  /** 限定世界类型（undefined = 通用） */
  worldType?: WorldType;
  /** 限定机缘主题（undefined = 通用） */
  fortuneType?: FortuneTypeId;
  /** 最小出现深度 */
  minDepth?: number;
  /** 最大出现深度 */
  maxDepth?: number;
  /** 稀有度 */
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description: string;
  /** 选择项（2-4个） */
  choices: FortuneEventChoice[];
}

// ============================================
// 奖励计算
// ============================================

/** 奖励类别 */
export type RewardCategory = 'spirit_stones' | 'fragments' | 'consumables' | 'materials' | 'balanced' | 'rarity_up' | 'legendary_rate' | 'death_penalty' | 'other';

/** 计算后的奖励 */
export interface CalculatedReward {
  spiritStones: number;
  experience: number;
  items: Array<{ templateId: string; quantity: number }>;
  fragments: FragmentGain[];
  multiplier: number;
}
