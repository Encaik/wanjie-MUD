/**
 * FortuneMapView — 机缘地图视图
 *
 * 渲染网格 + 迷雾层 + 视野差异化 + 状态栏。
 * ≤300 行
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/shared/ui/data-display/card';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import type { FortuneSession, VisibleCell, SenseHint } from '../types';
import { getFortuneTypeConfig } from '../data/fortuneTypeConfig';
import { FortuneCell } from './FortuneCell';
import { getMoveCost } from '../logic/terrainSystem';
import { manhattanDistance } from '../logic/mapGenerator';

interface FortuneMapViewProps {
  session: FortuneSession;
  visibleCells: VisibleCell[];
  hints: SenseHint[];
  /** 玩家悟性+灵识得分（用于展示） */
  senseScore: number;
  /** 体力状态文本 */
  staminaText: string;
  /** 体力状态等级 */
  staminaLevel: 'ok' | 'low' | 'critical';
  /** 移动回调 */
  onMove: (row: number, col: number) => void;
  /** 是否是出口位置 */
  isExitPosition: (row: number, col: number) => boolean;
  /** 到达出口回调 */
  onReachExit: () => void;
  /** 退出回调 */
  onExit: () => void;
}

export function FortuneMapView({
  session,
  visibleCells,
  hints,
  senseScore,
  staminaText,
  staminaLevel,
  onMove,
  isExitPosition,
  onReachExit,
  onExit,
}: FortuneMapViewProps) {
  const map = session.currentMap;
  const themeConfig = getFortuneTypeConfig(session.fortuneType);
  const pos = session.playerPosition;

  // 构建可见格子查找表
  const visibleMap = useMemo(() => {
    const m = new Map<string, VisibleCell>();
    for (const vc of visibleCells) {
      m.set(`${vc.position.row},${vc.position.col}`, vc);
    }
    return m;
  }, [visibleCells]);

  // 构建可移动格子
  const movablePositions = useMemo(() => {
    const positions: Array<{ row: number; col: number }> = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r >= 0 && r < map.rows && c >= 0 && c < map.cols) {
        const cost = getMoveCost(map.grid[r][c].terrain);
        if (session.stamina >= cost) {
          positions.push({ row: r, col: c });
        }
      }
    }
    return positions;
  }, [pos, map.grid, map.rows, map.cols, session.stamina]);

  const isMovable = (row: number, col: number) =>
    movablePositions.some(p => p.row === row && p.col === col);

  const handleCellClick = (row: number, col: number) => {
    if (!isMovable(row, col)) return;
    if (isExitPosition(row, col)) {
      onReachExit();
      return;
    }
    onMove(row, col);
  };

  return (
    <div className="space-y-3 p-2">
      {/* 状态栏 */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{themeConfig?.icon} {themeConfig?.name}</Badge>
            <Badge variant="secondary">F{session.currentDepth}/{session.maxDepth}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>望气术 Lv.{Math.min(3, Math.floor(senseScore / 20))}</span>
            <span className={staminaLevel === 'critical' ? 'text-red-400' : staminaLevel === 'low' ? 'text-yellow-400' : ''}>
              ⚡{session.stamina}/{session.maxStamina}
            </span>
            <span>💰{session.accumulatedLoot.spiritStones}</span>
          </div>
        </div>
      </Card>

      {/* 地图网格 */}
      <div className="flex justify-center overflow-auto p-2">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${map.cols}, 36px)`,
            gridTemplateRows: `repeat(${map.rows}, 36px)`,
          }}
        >
          {map.grid.map((row, ri) =>
            row.map((cell, ci) => {
              const key = `${ri},${ci}`;
              const vc = visibleMap.get(key);
              const isCurrentPos = ri === pos.row && ci === pos.col;
              const isExit = isExitPosition(ri, ci);

              return (
                <FortuneCell
                  key={key}
                  terrain={cell.terrain}
                  nodeType={vc?.nodeType || null}
                  isRevealed={vc !== undefined || cell.isRevealed}
                  isVisited={cell.isVisited}
                  isCurrentPosition={isCurrentPos}
                  isCleared={vc?.isCleared || cell.node?.isCleared}
                  isMovable={isMovable(ri, ci)}
                  isHidden={vc?.isHidden}
                  onClick={() => handleCellClick(ri, ci)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* 感应提示 */}
      {hints.length > 0 && (
        <Card className="p-2 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">望气术感应：</p>
          <div className="flex flex-wrap gap-1">
            {hints.map((hint, i) => (
              <Badge
                key={i}
                variant="outline"
                className={hint.confidence === 'precise' ? 'border-primary/50' : hint.confidence === 'clear' ? '' : 'opacity-60'}
              >
                {hint.direction === 'up' ? '↑' : hint.direction === 'down' ? '↓' : hint.direction === 'left' ? '←' : '→'}
                {' '}{hint.text}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          退出机缘
        </Button>
        <span className="text-xs text-muted-foreground self-center">
          {staminaText}
        </span>
      </div>
    </div>
  );
}
