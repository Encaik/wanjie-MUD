/**
 * 秘境探索系统类型定义
 *
 * 定义迷雾系统、路径提示和探索配置相关的类型。
 */

import type { CellType } from '@/core/types';

// ============================================
// 迷雾系统
// ============================================

/** 迷雾单元格状态 */
export type FogCellState = 'hidden' | 'revealed' | 'visible' | 'visited';

/** 迷雾单元格 */
export interface FogCell {
  /** 行坐标 */
  row: number;
  /** 列坐标 */
  col: number;
  /** 迷雾状态 */
  fogState: FogCellState;
  /** 实际内容类型（hidden 状态下为 undefined） */
  cellType?: CellType;
  /** 模糊提示文本（部分可见时） */
  hint?: string;
  /** 内容是否已被处理（战斗/事件完成等） */
  cleared: boolean;
}

/** 地图探索状态（与地图数据分离） */
export interface RevealedMap {
  /** 已揭示的单元格坐标集（key = "row,col"） */
  revealedCells: Set<string>;
  /** 玩家当前位置 */
  playerPosition: { row: number; col: number };
  /** 地图总行数 */
  totalRows: number;
  /** 地图总列数 */
  totalCols: number;
}

// ============================================
// 路径提示
// ============================================

/** 路径提示类型 */
export type PathHintType = 'danger' | 'treasure' | 'rest' | 'boss' | 'mystery' | 'safe';

/** 方向路径提示 */
export interface PathHint {
  /** 方向（上/下/左/右） */
  direction: 'up' | 'down' | 'left' | 'right';
  /** 目标坐标 */
  targetPosition: { row: number; col: number };
  /** 提示类型 */
  hintType: PathHintType;
  /** 提示文本 */
  text: string;
  /** 该方向路径类型 */
  pathType: 'high_risk' | 'safe' | 'neutral' | 'unknown';
}

/** 路径提示类型文本映射 */
export const PATH_HINT_TEXTS: Record<PathHintType, string[]> = {
  danger: ['前方有强烈的危险气息...', '隐约感到一股杀意...', '黑暗中有不祥的预感...'],
  treasure: ['前方有微弱的光芒闪烁...', '空气中飘来灵石的清香...', '似乎有宝物在前方...'],
  rest: ['前方异常安静...', '感到一阵宁静祥和...', '前方似有灵气汇聚之地...'],
  boss: ['感到强大的压迫感...', '有一股不可忽视的力量...', '前方传来令人窒息的威压...'],
  mystery: ['前方笼罩着神秘的迷雾...', '无法判断前方是什么...', '充满了未知...'],
  safe: ['这条路看起来比较安全...', '前方似乎没什么危险...', '平静的通道...'],
};

// ============================================
// 路径分支配置
// ============================================

/** 路径风险类型 */
export type PathRiskType = 'high_risk' | 'safe' | 'neutral' | 'unknown';

/** 路径生成配置 */
export interface PathConfig {
  /** 路径类型 */
  type: PathRiskType;
  /** 描述文本 */
  description: string;
  /** 敌人概率偏移 */
  enemyProbOffset: number;
  /** 精英概率偏移 */
  eliteProbOffset: number;
  /** 奖励倍率 */
  rewardMultiplier: number;
  /** Boss 出现概率 */
  bossProb: number;
  /** 休息点概率偏移 */
  restProbOffset: number;
}

/** 路径配置表 */
export const PATH_CONFIGS: Record<PathRiskType, PathConfig> = {
  high_risk: {
    type: 'high_risk',
    description: '高风险路径：强敌环伺，但战利品丰厚',
    enemyProbOffset: 0.1,
    eliteProbOffset: 0.1,
    rewardMultiplier: 2.0,
    bossProb: 0.05,
    restProbOffset: -0.05,
  },
  safe: {
    type: 'safe',
    description: '安全路径：怪物稀少，适合休整',
    enemyProbOffset: -0.15,
    eliteProbOffset: -0.1,
    rewardMultiplier: 0.5,
    bossProb: 0,
    restProbOffset: 0.1,
  },
  neutral: {
    type: 'neutral',
    description: '普通路径',
    enemyProbOffset: 0,
    eliteProbOffset: 0,
    rewardMultiplier: 1.0,
    bossProb: 0.02,
    restProbOffset: 0,
  },
  unknown: {
    type: 'unknown',
    description: '未知路径',
    enemyProbOffset: 0,
    eliteProbOffset: 0,
    rewardMultiplier: 1.0,
    bossProb: 0.02,
    restProbOffset: 0,
  },
};

// ============================================
// Boss 配置
// ============================================

/** Boss 放置配置 */
export interface BossPlacementConfig {
  /** 距离边缘的最小距离 */
  minEdgeDistance: number;
  /** 距离玩家起始位置的最小距离 */
  minStartDistance: number;
}

/** Boss 预警状态 */
export interface BossWarningState {
  /** Boss 位置 */
  bossPosition: { row: number; col: number };
  /** 是否已发现 */
  isDiscovered: boolean;
  /** 距离玩家步数 */
  distanceToPlayer: number;
  /** 预警等级 */
  warningLevel: 'none' | 'far' | 'near' | 'imminent';
}

/** Boss 预警等级文本 */
export const BOSS_WARNING_TEXTS: Record<BossWarningState['warningLevel'], string> = {
  none: '',
  far: '',
  near: '感到微弱的压迫感...',
  imminent: '感到强大的压迫感！Boss就在附近！',
};
