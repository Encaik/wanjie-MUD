/**
 * FortuneCell — 机缘地图单格
 *
 * 渲染地形底色 + 节点图标 + 迷雾/已访问状态。
 * ≤200 行
 */

'use client';

import { cn } from '@/shared/utils/cn';

import { getNodeIcon } from '../data/nodeTypeConfig';
import { TERRAIN_ICONS, TERRAIN_NAMES } from '../data/terrainConfig';

import type { TerrainType, NodeType } from '../types';

interface FortuneCellProps {
  /** 地形 */
  terrain: TerrainType;
  /** 节点类型（null = 空格或未知） */
  nodeType: NodeType | null;
  /** 是否在视野内已揭示 */
  isRevealed: boolean;
  /** 是否已被访问过 */
  isVisited: boolean;
  /** 是否是玩家当前位置 */
  isCurrentPosition: boolean;
  /** 节点是否已清除 */
  isCleared?: boolean;
  /** 是否可移动到此格 */
  isMovable: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否隐藏节点 */
  isHidden?: boolean;
}

/** 地形背景色 */
const TERRAIN_BG: Record<TerrainType, string> = {
  plain: 'bg-muted/30',
  forest: 'bg-emerald-900/30',
  cave: 'bg-stone-800/40',
  cliff: 'bg-amber-900/20',
  swamp: 'bg-purple-900/30',
  spring: 'bg-cyan-800/20',
  ruins: 'bg-yellow-800/20',
};

/** 地形边框色 */
const TERRAIN_BORDER: Record<TerrainType, string> = {
  plain: 'border-border/50',
  forest: 'border-emerald-700/40',
  cave: 'border-stone-600/50',
  cliff: 'border-amber-600/40',
  swamp: 'border-purple-600/40',
  spring: 'border-cyan-600/40',
  ruins: 'border-yellow-600/40',
};

/** 节点颜色 */
function getNodeColor(nodeType: NodeType): string {
  const colors: Record<string, string> = {
    enemy: 'text-red-400',
    elite: 'text-red-500',
    miniboss: 'text-orange-400',
    guardian: 'text-rose-400',
    treasure: 'text-yellow-400',
    mineral_vein: 'text-amber-300',
    herb: 'text-green-400',
    scroll_fragment: 'text-blue-300',
    event: 'text-purple-400',
    merchant: 'text-cyan-300',
    altar: 'text-indigo-300',
    challenge: 'text-orange-300',
    portal: 'text-violet-400',
    trap: 'text-red-600',
    fog: 'text-gray-400',
  };
  return colors[nodeType] || 'text-muted-foreground';
}

export function FortuneCell({
  terrain,
  nodeType,
  isRevealed,
  isVisited,
  isCurrentPosition,
  isCleared,
  isMovable,
  onClick,
  isHidden,
}: FortuneCellProps) {
  const terrainName = TERRAIN_NAMES[terrain] || terrain;
  const terrainIcon = TERRAIN_ICONS[terrain] || '';

  // 未揭示 — 迷雾
  if (!isRevealed) {
    return (
      <div
        className={cn(
          'w-9 h-9 border flex items-center justify-center text-xs',
          'bg-muted/50 border-border/30 cursor-default',
          'text-muted-foreground/40'
        )}
        title="未知区域"
      >
        ·
      </div>
    );
  }

  // 已访问过的空格
  if (isVisited && !nodeType) {
    return (
      <div
        className={cn(
          'w-9 h-9 border flex items-center justify-center text-xs',
          TERRAIN_BG[terrain],
          TERRAIN_BORDER[terrain],
          'cursor-default opacity-80'
        )}
        title={`${terrainName} (已探索)`}
      >
        <span className="text-base opacity-60">{terrainIcon}</span>
      </div>
    );
  }

  // 当前玩家位置
  if (isCurrentPosition) {
    return (
      <div
        className={cn(
          'w-9 h-9 border-2 flex items-center justify-center text-xs',
          'bg-primary/30 border-primary ring-1 ring-primary/50',
          'animate-pulse cursor-default'
        )}
        title={`当前位置 — ${terrainName}`}
      >
        <span className="text-lg">🧑</span>
      </div>
    );
  }

  // 未知节点（迷雾节点，未进入）
  if (isHidden) {
    return (
      <div
        className={cn(
          'w-9 h-9 border flex items-center justify-center text-xs',
          TERRAIN_BG[terrain],
          TERRAIN_BORDER[terrain],
          isMovable ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/10' : 'cursor-default'
        )}
        onClick={isMovable ? onClick : undefined}
        title={`${terrainName} — 迷雾笼罩`}
      >
        <span className="text-base">🌫️</span>
      </div>
    );
  }

  // 已清除的节点
  if (isCleared) {
    return (
      <div
        className={cn(
          'w-9 h-9 border flex items-center justify-center text-xs',
          TERRAIN_BG[terrain],
          TERRAIN_BORDER[terrain],
          'cursor-default opacity-60'
        )}
        title={`${terrainName} (已清理)`}
      >
        <span className="text-base opacity-40">{terrainIcon}</span>
      </div>
    );
  }

  // 可见但未访问的节点
  const nodeIcon = nodeType ? getNodeIcon(nodeType) : '';
  const nodeColor = nodeType ? getNodeColor(nodeType) : '';

  return (
    <div
      className={cn(
        'w-9 h-9 border flex items-center justify-center text-xs',
        TERRAIN_BG[terrain],
        TERRAIN_BORDER[terrain],
        isMovable
          ? 'cursor-pointer hover:border-primary/40 hover:scale-105 transition-transform'
          : 'cursor-default'
      )}
      onClick={isMovable ? onClick : undefined}
      title={nodeType ? `${terrainName} — ${nodeType}` : terrainName}
    >
      <span className={cn('text-base', nodeColor)}>
        {nodeIcon || terrainIcon}
      </span>
    </div>
  );
}
