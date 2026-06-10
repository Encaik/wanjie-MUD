/**
 * 战斗对话框组件
 * 
 * 使用弹窗形式呈现战斗，集成新的战斗策略系统
 * 
 * 【设计规范 - 弹窗右上角空位】
 * 所有 DialogContent 必须添加 pt-10 类，预留右上角空位。
 * 原因：shadcn/ui 的 Dialog 组件默认将关闭按钮定位在右上角，
 *       如果不预留空间，标题栏或其他元素可能与关闭按钮重叠。
 *       这是一个强制性的设计约束，请勿移除 pt-10。
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

import {
  Swords,
  Trophy,
  Skull,
  Sparkles,
  Loader2,
  Zap,
  Shield,
  Heart,
  Flame,
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { 
  initInteractiveBattle, 
  initTowerBattle, 
  performPlayerAction, 
  estimateBattleDifficulty 
} from '@/modules/exploration/logic/adventure/adventureBattleIntegration';
import {
  ExtendedBattleState,
  BattleStatistics,
  BattleAction,
  DecisionOption,
  TurnResult,
  TriggeredEvent,
} from '@/modules/combat/logic/battle';
import type { TowerEnemy } from '@/modules/tower/logic/types';
import { Protagonist, CellType, DungeonConfig, BattleResult } from '@/core/types';

import { BattleLogList } from './BattleLogList';
import { CombatantPanel } from './CombatantPanel';
import { DecisionPanel } from './DecisionPanel';
import { RestraintDisplay } from './RestraintDisplay';

/** 战斗阶段 */
type BattlePhase = 'preparing' | 'player_turn' | 'enemy_turn' | 'result';

/** 战斗对话框属性 */
interface BattleDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 玩家数据 */
  protagonist: Protagonist;
  /** 格子类型 */
  cellType: CellType;
  /** 敌人内容描述 */
  enemyContent: string;
  /** 地牢配置 */
  config: DungeonConfig;
  /** 战斗结束回调 */
  onBattleEnd: (result: BattleResult) => void;
  /** 是否自动战斗 */
  autoMode?: boolean;
  /** 切换自动战斗模式回调 */
  onToggleAutoMode?: () => void;
  /** 开发模式：无敌 */
  devInvincible?: boolean;
  /** 塔层楼层（仅塔层战斗） */
  towerFloor?: number;
  /** 塔层敌人数据（仅塔层战斗） */
  towerEnemy?: TowerEnemy;
}

/** 战斗结束结果 */
interface BattleEndResult {
  victory: boolean;
  playerRemainingHp: number;
  playerRemainingMp: number;
  rounds: number;
  statistics: BattleStatistics;
}

export function BattleDialog({
  open,
  onOpenChange,
  protagonist,
  cellType,
  enemyContent,
  config,
  onBattleEnd,
  autoMode = false,
  onToggleAutoMode,
  devInvincible = false,
  towerFloor,
  towerEnemy,
}: BattleDialogProps) {
  // 战斗状态
  const [battleState, setBattleState] = useState<ExtendedBattleState | null>(null);
  const [statistics, setStatistics] = useState<BattleStatistics | null>(null);
  const [decisions, setDecisions] = useState<DecisionOption[]>([]);
  const [phase, setPhase] = useState<BattlePhase>('preparing');
  const [turnResult, setTurnResult] = useState<TurnResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 回合日志
  const [roundLogs, setRoundLogs] = useState<string[]>([]);
  
  // 多敌人系统：选中的敌人索引
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState<number>(0);
  
  // 【修复】使用 ref 跟踪是否已初始化，避免主角数据变化导致战斗重置
  const battleInitializedRef = useRef(false);
  
  // 判断是否为塔层战斗
  const isTowerBattle = towerFloor !== undefined && towerFloor > 0;

  // 难度预估
  const difficulty = battleState
    ? estimateBattleDifficulty(protagonist, cellType, enemyContent, config)
    : 'normal';

  // 初始化战斗
  const initBattle = useCallback(() => {
    if (!open) return;
    
    // 【修复】如果已经初始化过，不再重复初始化
    if (battleInitializedRef.current) {
      return;
    }

    console.log('[BattleDialog] Initializing battle...', { isTowerBattle, towerFloor });

    let result: { state: ExtendedBattleState; statistics: BattleStatistics; decisions: DecisionOption[] };
    
    if (isTowerBattle) {
      // 塔层战斗：使用专用的塔层战斗初始化
      result = initTowerBattle(protagonist, towerFloor!, towerEnemy);
    } else {
      // 普通战斗：使用原有的初始化逻辑
      result = initInteractiveBattle(protagonist, cellType, enemyContent, config);
    }

    setBattleState(result.state);
    setStatistics(result.statistics);
    setDecisions(result.decisions);
    setPhase('player_turn');
    setTurnResult(null);
    setRoundLogs([]);
    
    // 标记为已初始化
    battleInitializedRef.current = true;

    console.log('[BattleDialog] Battle initialized', { 
      enemyCount: result.state.enemies?.length || 1,
      enemyName: result.state.enemyName 
    });
  }, [open, protagonist, cellType, enemyContent, config, isTowerBattle, towerFloor, towerEnemy]);

  // 打开时初始化
  useEffect(() => {
    if (open) {
      initBattle();
    } else {
      // 【修复】关闭时重置初始化标记
      battleInitializedRef.current = false;
    }
  }, [open, initBattle]);

  // 自动战斗模式
  useEffect(() => {
    if (!autoMode || !battleState || !statistics || phase !== 'player_turn' || isProcessing) {
      return;
    }

    if (battleState.isOver) {
      return;
    }

    // 自动选择行动
    const timer = setTimeout(() => {
      if (decisions.length > 0) {
        // 获取所有推荐的行动
        const recommendedActions = decisions.filter(d => d.recommended && !d.disabled);
        
        let action;
        if (recommendedActions.length > 1) {
          // 有多个推荐时，优先选择法技（利用MP），其次选择斗技，最后普通攻击
          const techniqueSkill = recommendedActions.find(d => d.action.type === 'technique_attack');
          const combatSkill = recommendedActions.find(d => d.action.type === 'combat_technique');
          
          // 随机选择，增加多样性（70%选法技，30%选斗技）
          if (techniqueSkill && combatSkill) {
            action = Math.random() < 0.7 ? techniqueSkill.action : combatSkill.action;
          } else {
            action = techniqueSkill?.action || combatSkill?.action || recommendedActions[0].action;
          }
        } else if (recommendedActions.length === 1) {
          action = recommendedActions[0].action;
        } else {
          // 没有推荐时，选择第一个可用行动
          action = decisions.find(d => !d.disabled)?.action;
        }

        if (action) {
          handleAction(action);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [autoMode, battleState, statistics, phase, decisions, isProcessing]);

  // 执行玩家行动
  const handleAction = useCallback(async (action: BattleAction) => {
    if (!battleState || !statistics || isProcessing) return;

    // 多敌人战斗：添加目标敌人索引
    const actionWithTarget: BattleAction = {
      ...action,
      targetEnemyIndex: selectedEnemyIndex,
    };

    setIsProcessing(true);
    setPhase('enemy_turn');

    // 执行回合
    const result = performPlayerAction(actionWithTarget, battleState, statistics);

    // 更新状态
    setBattleState(result.state);
    setStatistics(result.statistics);
    setDecisions(result.decisions);
    setTurnResult(result.result);

    // 添加日志
    const logs: string[] = [];
    if (result.result.playerResult) {
      logs.push(`[玩家] ${result.result.playerResult.message}`);
    }
    if (result.result.enemyResult) {
      logs.push(`[敌人] ${result.result.enemyResult.message}`);
    }
    result.result.events.forEach((e: TriggeredEvent) => {
      logs.push(`[事件] ${e.message}`);
    });
    setRoundLogs(prev => [...prev, ...logs]);

    // 检查战斗结束
    if (result.result.battleOver) {
      setPhase('result');
    } else {
      setPhase('player_turn');
    }

    setIsProcessing(false);
  }, [battleState, statistics, isProcessing]);

  // 处理战斗结束
  const handleBattleEnd = useCallback(() => {
    if (!battleState || !statistics) return;

    const result: BattleResult = {
      victory: battleState.victory ?? false,
      fled: battleState.fled ?? false,
      message: battleState.victory 
        ? '战斗胜利！' 
        : (battleState.fled ? '成功逃离战斗' : '战斗失败'),
      playerHpAfter: battleState.playerCurrentHp,
      playerMpAfter: battleState.playerCurrentMp,
      battleState: battleState as any,
    };

    onBattleEnd(result);
    onOpenChange(false);
  }, [battleState, statistics, onBattleEnd, onOpenChange]);

  // 关闭对话框
  const handleClose = useCallback(() => {
    if (phase === 'result') {
      handleBattleEnd();
    } else if (battleState?.isOver) {
      handleBattleEnd();
    }
    // 战斗中不允许关闭
  }, [phase, battleState, handleBattleEnd]);

  // 渲染准备阶段
  if (!battleState || !statistics) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* 右上角必须预留空位 (pt-10)，避免关闭按钮与其他UI元素重叠 */}
        <DialogContent className="sm:max-w-[600px] pt-10">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">准备战斗...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 战斗是否结束
  const isBattleOver = phase === 'result' || battleState.isOver;
  const isFled = battleState.fled ?? false;

  // 渲染战斗（包含战斗中和战斗结束状态）
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* 右上角必须预留空位 (pt-10)，避免关闭按钮与其他UI元素重叠 */}
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col pt-10 pb-4 px-4 sm:px-6">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {isBattleOver ? (
                // 战斗结束标题 - 简化显示
                <>
                  <Swords className="w-5 h-5 text-muted-foreground" />
                  <span>战斗结束</span>
                </>
              ) : (
                // 战斗中标题
                <>
                  <Swords className="w-5 h-5 text-red-500" />
                  <span>战斗</span>
                  <Badge variant="outline" className="ml-2">
                    回合 {battleState.currentRound}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <Badge
              variant={
                difficulty === 'easy' ? 'secondary' :
                difficulty === 'normal' ? 'default' :
                difficulty === 'hard' ? 'destructive' : 'destructive'
              }
            >
              {difficulty === 'easy' ? '简单' :
               difficulty === 'normal' ? '普通' :
               difficulty === 'hard' ? '困难' : '极难'}
            </Badge>
          </div>
          <DialogDescription>
            {enemyContent}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* 克制关系显示 */}
          {battleState.enemyAttributes && (
            <RestraintDisplay
              playerElement={null}
              playerWeaponCategory={null}
              enemyAttributes={battleState.enemyAttributes}
            />
          )}

          {/* 战斗双方信息 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 玩家面板 */}
            <CombatantPanel
              name={protagonist.character.name}
              level={protagonist.level}
              currentHp={battleState.playerCurrentHp}
              maxHp={battleState.playerMaxHp}
              currentMp={battleState.playerCurrentMp}
              maxMp={battleState.playerMaxMp}
              attack={battleState.playerAttack}
              defense={battleState.playerDefense}
              isPlayer
              buffs={battleState.playerBuffs}
            />

            {/* 敌人面板 - 支持多敌人 */}
            {battleState.enemies && battleState.enemies.length > 0 ? (
              // 多敌人显示 - 使用grid布局
              <div className={`grid ${battleState.enemies.length === 1 ? 'grid-cols-1' : 'grid-cols-1'} gap-2`}>
                {battleState.enemies.map((enemy, index) => (
                  <div
                    key={enemy.id}
                    onClick={() => !isBattleOver && enemy.isAlive && setSelectedEnemyIndex(index)}
                    className={`cursor-pointer transition-all ${
                      !enemy.isAlive ? 'opacity-50' : ''
                    } ${
                      selectedEnemyIndex === index && !isBattleOver
                        ? 'ring-2 ring-primary rounded-lg'
                        : ''
                    }`}
                  >
                    <CombatantPanel
                      name={`${enemy.name}${battleState.enemies!.length > 1 ? ` (${index + 1})` : ''}`}
                      level={enemy.level}
                      currentHp={enemy.currentHp}
                      maxHp={enemy.maxHp}
                      currentMp={enemy.currentMp}
                      maxMp={enemy.maxMp}
                      attack={enemy.attack}
                      defense={enemy.defense}
                      isPlayer={false}
                      attributes={enemy.attributes}
                      buffs={enemy.buffs}
                      tier={enemy.tier}
                      isAlive={enemy.isAlive}
                      isSelected={selectedEnemyIndex === index && !isBattleOver}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // 单敌人显示（兼容旧系统）
              <CombatantPanel
                name={battleState.enemyName}
                level={battleState.enemyLevel}
                currentHp={battleState.enemyCurrentHp}
                maxHp={battleState.enemyMaxHp}
                currentMp={battleState.enemyCurrentMp ?? 0}
                maxMp={battleState.enemyMaxMp ?? 0}
                attack={battleState.enemyAttack}
                defense={battleState.enemyDefense}
                isPlayer={false}
                attributes={battleState.enemyAttributes}
                buffs={battleState.enemyBuffs}
              />
            )}
          </div>

          <Separator />

          {/* 战斗结束显示战斗统计和确认按钮 */}
          {isBattleOver ? (
            <div className="space-y-3">
              {/* 战斗结论 */}
              <div className={`text-center p-3 rounded-lg ${
                battleState.victory 
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900' 
                  : isFled
                    ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {battleState.victory ? (
                    <>
                      <Trophy className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-bold text-green-600">战斗胜利</span>
                    </>
                  ) : isFled ? (
                    <>
                      <Flame className="w-5 h-5 text-orange-600" />
                      <span className="text-lg font-bold text-orange-600">成功逃离</span>
                    </>
                  ) : (
                    <>
                      <Skull className="w-5 h-5 text-red-600" />
                      <span className="text-lg font-bold text-red-600">战斗失败</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {battleState.victory 
                    ? `击败了${battleState.enemyName}，继续前进吧！`
                    : isFled
                      ? '成功脱离战斗，留得青山在'
                      : '被击败了，下次再来吧'}
                </p>
              </div>

              {/* 战斗统计 - 简化显示 */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-muted">
                  <div className="text-muted-foreground">回合</div>
                  <div className="font-bold text-base">{battleState.currentRound}</div>
                </div>
                <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <div className="text-muted-foreground">暴击</div>
                  <div className="font-bold text-base text-yellow-600">{statistics.critCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div className="text-muted-foreground">技能</div>
                  <div className="font-bold text-base text-blue-600">{statistics.skillUseCount}</div>
                </div>
              </div>

              {/* 战斗日志 - 战斗结束时高度更大 */}
              <ScrollArea className="h-[160px] border rounded-md p-2">
                <BattleLogList logs={roundLogs} />
              </ScrollArea>

              {/* 确认按钮 */}
              <Button onClick={handleBattleEnd} className="w-full">
                {battleState.victory ? '领取奖励' : '确定'}
              </Button>
            </div>
          ) : (
            // 战斗中显示操作面板
            <>
              {/* 自动战斗切换 */}
              {onToggleAutoMode && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <span className={`text-xs ${!autoMode ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    手动
                  </span>
                  <button
                    onClick={onToggleAutoMode}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      autoMode ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        autoMode ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <span className={`text-xs ${autoMode ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    自动
                  </span>
                </div>
              )}

              {/* 决策面板 */}
              <DecisionPanel
                decisions={decisions}
                onAction={handleAction}
                disabled={isProcessing || phase !== 'player_turn'}
                autoMode={autoMode}
              />

              {/* 战斗日志 */}
              <ScrollArea className="h-[120px] border rounded-md p-2">
                <BattleLogList logs={roundLogs} />
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
