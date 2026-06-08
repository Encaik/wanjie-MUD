'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

import { Swords, Gem, Skull, HelpCircle, Coffee, Crown, Map, Flag, Sparkles, Compass, Zap, Timer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { getAdjacentCells } from '@/lib/game/adventure';
import { STAMINA_CONFIG, getCooldownRemaining } from '@/lib/game/adventure/adventureStamina';
import { getDungeonInfo, getTerminology } from '@/lib/game/terminology';
import { AdventureCell, WorldType, DungeonConfig, CellType, AdventureSessionState } from '@/lib/game/types';

interface AdventurePanelProps {
  grid: AdventureCell[][] | null;
  position: { row: number; col: number } | null;
  config: DungeonConfig | null;
  /** 行动力会话状态 */
  adventureSession?: AdventureSessionState | null;
  /** 是否正在战斗中（用于避免战斗中弹出行动力耗尽对话框） */
  isBattling?: boolean;
  onStart: () => void;
  onMove: (row: number, col: number) => void;
  onExit: () => void;
  onForceExit?: () => void;
  disabled?: boolean;
  worldType: WorldType;
}

// 有效格子类型（不计入探索度的格子：empty和portal）
const EXPLORABLE_CELL_TYPES: CellType[] = ['treasure', 'enemy', 'elite', 'miniboss', 'boss', 'event', 'rest'];

// 格子类型颜色 - 统一使用主题色
const cellTypeColors: Record<string, string> = {
  empty: 'bg-muted/30 border-border/50',
  treasure: 'bg-yellow-500/25 border-yellow-500/60',
  enemy: 'bg-red-500/25 border-red-500/60',
  elite: 'bg-red-600/30 border-red-600/70',
  miniboss: 'bg-orange-500/30 border-orange-500/70',
  event: 'bg-purple-500/25 border-purple-500/60',
  rest: 'bg-green-500/25 border-green-500/60',
  boss: 'bg-orange-600/35 border-orange-600/80',
  portal: 'bg-cyan-500/25 border-cyan-500/60',
};

// 格子类型图标
const cellTypeIcons: Record<string, React.ReactNode> = {
  empty: '',
  treasure: <Gem className="w-3 h-3" />,
  enemy: <Skull className="w-3 h-3" />,
  elite: <Skull className="w-3 h-3" />,
  miniboss: <Crown className="w-3 h-3" />,
  event: <HelpCircle className="w-3 h-3" />,
  rest: <Coffee className="w-3 h-3" />,
  boss: <Crown className="w-3.5 h-3.5" />,
  portal: <Sparkles className="w-3 h-3" />,
};

// 计算探索度
function calculateExplorationProgress(grid: AdventureCell[][]): { explored: number; total: number; percentage: number } {
  let explored = 0;
  let total = 0;

  for (const row of grid) {
    for (const cell of row) {
      // 只计算有效格子（排除empty和portal）
      if (EXPLORABLE_CELL_TYPES.includes(cell.type)) {
        total++;
        if (cell.visited || cell.cleared) {
          explored++;
        }
      }
    }
  }

  const percentage = total > 0 ? Math.floor((explored / total) * 100) : 0;
  return { explored, total, percentage };
}

export function AdventurePanel({ 
  grid, 
  position, 
  config,
  adventureSession,
  isBattling,
  onStart, 
  onMove, 
  onExit,
  onForceExit,
  disabled, 
  worldType,
}: AdventurePanelProps) {
  // 使用统一的术语系统
  const dungeonInfo = getDungeonInfo(worldType);
  const terminology = getTerminology(worldType);
  
  // 探索完成对话框状态
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const hasShownDialogRef = useRef(false);
  
  // 冷却时间倒计时
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  // 更新冷却倒计时
  useEffect(() => {
    if (!adventureSession?.lastExitTime) {
      setCooldownSeconds(0);
      return;
    }
    
    const updateCooldown = () => {
      const remaining = getCooldownRemaining(adventureSession.lastExitTime);
      setCooldownSeconds(remaining);
    };
    
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [adventureSession?.lastExitTime]);

  // 计算探索度
  const explorationProgress = useMemo(() => {
    if (!grid) return { explored: 0, total: 0, percentage: 0 };
    return calculateExplorationProgress(grid);
  }, [grid]);

  // 当探索度达到100%时显示对话框（只显示一次）
  useEffect(() => {
    if (explorationProgress.percentage === 100 && !hasShownDialogRef.current && grid && position) {
      hasShownDialogRef.current = true;
      setShowCompletionDialog(true);
    }
  }, [explorationProgress.percentage, grid, position]);

  // 重置对话框状态（当进入新地图时）
  useEffect(() => {
    if (!grid) {
      hasShownDialogRef.current = false;
      setShowCompletionDialog(false);
    }
  }, [grid]);

  // 检查相邻格子中是否有可战斗的敌人
  const hasFightableEnemy = useMemo(() => {
    if (!grid || !position) return false;
    const adjacent = getAdjacentCells(grid, position);
    return adjacent.some(cell => {
      const cellData = grid[cell.row][cell.col];
      // 检查是否是敌人格子且未被清理
      return ['enemy', 'elite', 'miniboss', 'boss'].includes(cellData.type) && !cellData.cleared;
    });
  }, [grid, position]);

  // 如果没有开始冒险
  if (!grid || !position) {
    return (
      <Card>
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            {dungeonInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {dungeonInfo.desc}
          </p>
          
          {/* 冷却时间提示 */}
          {cooldownSeconds > 0 && (
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-xs">
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-muted-foreground">冷却中</span>
              </div>
              <span className="text-blue-500">{cooldownSeconds}秒</span>
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={onStart} 
            disabled={disabled || cooldownSeconds > 0}
          >
            {cooldownSeconds > 0 ? `冷却中 (${cooldownSeconds}秒)` : `进入${dungeonInfo.name}`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 获取可移动的相邻格子
  const adjacentCells = getAdjacentCells(grid, position);
  
  // 计算动态格子大小
  const rows = grid.length;
  const cols = grid[0]?.length || 1;

  // 处理探索完成退出（直接退出，不需要确认）
  const handleCompletionExit = () => {
    setShowCompletionDialog(false);
    // 使用强制退出（跳过确认）
    if (onForceExit) {
      onForceExit();
    } else {
      onExit();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              {dungeonInfo.name}
            </div>
            {config && (
              <Badge variant="outline" className="text-[10px]">
                {config.realmName} | {rows}x{cols}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 space-y-2">
          {/* 行动力条 */}
          {adventureSession && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">行动力</span>
                  <span className={adventureSession.currentStamina === 0 ? 'text-red-500 font-bold' : ''}>
                    {adventureSession.currentStamina}/{adventureSession.maxStamina}
                  </span>
                </div>
                <Progress 
                  value={(adventureSession.currentStamina / adventureSession.maxStamina) * 100} 
                  className="h-1.5"
                />
              </div>
              {adventureSession.currentStamina === 0 && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                  行动力耗尽
                </Badge>
              )}
            </div>
          )}
          
          {/* 当前位置和探索度 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Compass className="w-3 h-3" />
              <span>探索度</span>
              <Badge 
                variant={explorationProgress.percentage === 100 ? "default" : "secondary"} 
                className="text-[10px] h-4"
              >
                {explorationProgress.percentage}%
              </Badge>
            </div>
            <Badge variant="secondary">
              <Flag className="w-3 h-3 mr-1" />
              ({position.row + 1}, {position.col + 1})
            </Badge>
          </div>

          {/* 地图网格 - 点击移动，允许重复访问，全宽自适应 */}
          <div className="w-full">
            <div 
              className="border rounded-lg p-2 bg-muted/10 w-full"
            >
              <div 
                className="grid w-full gap-[2px]"
                style={{ 
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                }}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isCurrentPosition = position.row === rowIndex && position.col === colIndex;
                    const isAdjacent = adjacentCells.some(c => c.row === rowIndex && c.col === colIndex);
                    const isVisited = cell.visited;
                    
                    // 统一使用浅色风格
                    let cellClass = cellTypeColors[cell.type] || cellTypeColors.empty;
                    
                    if (isCurrentPosition) {
                      // 当前位置：主题色高亮
                      cellClass = 'bg-primary/80 text-primary-foreground border-primary ring-2 ring-primary/50';
                    } else if (isVisited) {
                      // 已访问：降低透明度，但保持可点击样式
                      cellClass += ' opacity-50';
                    }
                    
                    // 可移动格子：添加高亮边框和可点击样式
                    if (isAdjacent && !isCurrentPosition) {
                      cellClass += ' ring-2 ring-primary/40 cursor-pointer hover:ring-primary/60 hover:opacity-100 transition-all';
                    }

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`flex items-center justify-center rounded-sm text-[10px] border transition-all relative aspect-[5/5] ${
                          (isAdjacent && !isCurrentPosition) ? 'cursor-pointer' : ''
                        } ${cellClass}`}
                        onClick={() => {
                          // 允许移动到相邻格子（包括已访问过的格子）
                          if (isAdjacent && !isCurrentPosition) {
                            onMove(rowIndex, colIndex);
                          }
                        }}
                        title={cell.content || (isVisited ? '已探索' : '未探索')}
                      >
                        {isCurrentPosition ? (
                          <Flag className="w-3 h-3" />
                        ) : isVisited ? (
                          <>
                            {cellTypeIcons[cell.type] && (
                              <span className="opacity-70">{cellTypeIcons[cell.type]}</span>
                            )}
                          </>
                        ) : (
                          <span className="opacity-80">{cellTypeIcons[cell.type]}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500/25 border border-yellow-500/60 rounded-sm"></div>
              <span>宝箱</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500/25 border border-red-500/60 rounded-sm"></div>
              <span>{terminology.enemy}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500/25 border border-purple-500/60 rounded-sm"></div>
              <span>事件</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/25 border border-green-500/60 rounded-sm"></div>
              <span>休息</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-cyan-500/25 border border-cyan-500/60 rounded-sm"></div>
              <span>传送</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500/25 border border-orange-500/60 rounded-sm"></div>
              <span>Boss</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 探索完成确认对话框 */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              探索完成！
            </DialogTitle>
            <DialogDescription>
              恭喜！当前探索度已达 <span className="text-primary font-bold">100%</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            你已探索了所有可探索的格子。是否现在退出秘境领取战利品？
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCompletionDialog(false)}
              className="flex-1"
            >
              继续探索
            </Button>
            <Button 
              onClick={handleCompletionExit}
              className="flex-1"
            >
              退出秘境
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
