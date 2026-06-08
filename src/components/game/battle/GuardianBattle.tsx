'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { 
  Swords, Heart, Shield, Zap, Trophy, Skull, 
  Sparkles, User, SwordsIcon, AlertTriangle, Loader2
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { WORLD_GUARDIANS, ASCENSION_CONFIG } from '@/lib/data/ascensionData';
import { 
  createGuardianBattleState, 
  executeBattleRound,
} from '@/lib/game/ascensionLogic';
import { BattleState, BattleLog, Protagonist, getFinalStats } from '@/lib/game/types';
import { GuardianBattleState } from '@/lib/game/typesExtension';

// 战斗结果类型
interface BattleResult {
  victory: boolean;
  turnsUsed: number;
  remainingHpPercent: number;
  phasesCleared: number;
}

interface GuardianBattleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protagonist: Protagonist;
  onBattleEnd: (result: BattleResult) => void;
  devInvincible?: boolean;
}

type BattlePhase = 'preparing' | 'fighting' | 'result';

// AI 决策：选择最优行动
function chooseAction(battleState: BattleState, guardianState: GuardianBattleState): 'attack' | 'skill' | 'defend' {
  const playerHpPercent = battleState.playerCurrentHp / battleState.playerMaxHp;
  const guardianHpPercent = guardianState.guardianCurrentHp / guardianState.guardianMaxHp;
  const mpPercent = battleState.playerCurrentMp / battleState.playerMaxMp;
  
  if (playerHpPercent < 0.3 && mpPercent > 0.2) return 'defend';
  if (mpPercent > 0.3 && guardianHpPercent < 0.4) return 'skill';
  if (mpPercent > 0.5 && Math.random() > 0.6) return 'skill';
  if (playerHpPercent < 0.6 && Math.random() > 0.7) return 'defend';
  return 'attack';
}

export function GuardianBattle({
  open,
  onOpenChange,
  protagonist,
  onBattleEnd,
  devInvincible = false,
}: GuardianBattleProps) {
  // 核心状态
  const [phase, setPhase] = useState<BattlePhase>('preparing');
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [guardianState, setGuardianState] = useState<GuardianBattleState | null>(null);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  
  // 使用 ref 存储战斗结果
  const battleResultRef = useRef<BattleResult | null>(null);
  const battleEndedRef = useRef(false);
  const isProcessingRef = useRef(false);

  const worldType = protagonist.world.type;
  const guardianConfig = WORLD_GUARDIANS[worldType];

  // 初始化战斗
  const initBattle = useCallback(() => {
    console.log('[GuardianBattle] Initializing battle...');
    
    // 重置所有状态
    battleEndedRef.current = false;
    battleResultRef.current = null;
    isProcessingRef.current = false;
    
    const newGuardianState = createGuardianBattleState(protagonist);
    const newBattleState: BattleState = {
      enemyName: newGuardianState.guardianName,
      enemyMaxHp: newGuardianState.guardianMaxHp,
      enemyCurrentHp: newGuardianState.guardianCurrentHp,
      enemyAttack: newGuardianState.guardianAttack,
      enemyDefense: newGuardianState.guardianDefense,
      enemyLevel: protagonist.level,
      enemyRealm: protagonist.realm,
      enemyCombatPower: newGuardianState.guardianAttack * 10 + newGuardianState.guardianDefense * 5,
      playerMaxHp: protagonist.maxHp,
      playerCurrentHp: protagonist.currentHp,
      playerMaxMp: protagonist.maxMp,
      playerCurrentMp: protagonist.currentMp,
      playerAttack: Math.floor(10 + protagonist.level * 2 + getFinalStats(protagonist.stats).体质),
      playerDefense: Math.floor(5 + protagonist.level + getFinalStats(protagonist.stats).意志 * 0.8),
      playerCombatPower: getFinalStats(protagonist.stats).体质 * 10 + getFinalStats(protagonist.stats).灵根 * 8,
      logs: [],
      currentRound: 1,
      isOver: false,
    };
    
    setGuardianState(newGuardianState);
    setBattleState(newBattleState);
    setLogs([]);
    setPhase('fighting');
    
    console.log('[GuardianBattle] Battle initialized');
  }, [protagonist]);

  // 自动战斗逻辑
  useEffect(() => {
    if (phase !== 'fighting') return;
    if (!battleState || !guardianState) return;
    if (battleEndedRef.current) return;
    if (battleState.isOver) return;
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    const timer = setTimeout(() => {
      const action = chooseAction(battleState, guardianState);
      const result = executeBattleRound(battleState, guardianState, action, devInvincible);
      
      setBattleState(result.battleState);
      setGuardianState(result.guardianState);
      
      const newLogs: BattleLog[] = [result.log];
      if (result.guardianLog) newLogs.push(result.guardianLog);
      setLogs(prev => [...prev, ...newLogs]);
      
      if (result.isOver) {
        battleEndedRef.current = true;
        
        battleResultRef.current = {
          victory: result.victory ?? false,
          turnsUsed: result.battleState.currentRound,
          remainingHpPercent: result.battleState.playerCurrentHp / result.battleState.playerMaxHp,
          phasesCleared: result.guardianState.currentPhase,
        };
        
        console.log('[GuardianBattle] Battle ended, result:', battleResultRef.current);
        
        setTimeout(() => {
          console.log('[GuardianBattle] Setting phase to result');
          setPhase('result');
        }, 800);
      }
      
      isProcessingRef.current = false;
    }, 600);

    return () => {
      clearTimeout(timer);
      isProcessingRef.current = false;
    };
  }, [phase, battleState, guardianState, devInvincible]);

  // 处理结果确认 - 关键修复：先回调，再关闭
  const handleResultConfirm = useCallback(() => {
    const result = battleResultRef.current;
    console.log('[GuardianBattle] handleResultConfirm, result:', result);
    
    if (!result) {
      console.error('[GuardianBattle] No battle result!');
      onOpenChange(false);
      return;
    }
    
    // 关键：先调用回调，再关闭弹窗
    // 这样可以确保 InheritanceSelect 在 GuardianBattle 关闭之前就准备好
    console.log('[GuardianBattle] Calling onBattleEnd');
    onBattleEnd(result);
    
    console.log('[GuardianBattle] Closing dialog');
    onOpenChange(false);
  }, [onBattleEnd, onOpenChange]);

  // 监听 open 状态
  useEffect(() => {
    if (open && phase === 'preparing') {
      initBattle();
    }
    if (!open) {
      // 重置状态
      setPhase('preparing');
      setBattleState(null);
      setGuardianState(null);
      setLogs([]);
      battleEndedRef.current = false;
      battleResultRef.current = null;
    }
  }, [open, phase, initBattle]);

  // ============ 渲染部分 ============

  // 准备阶段
  if (phase === 'preparing') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Swords className="w-6 h-6 text-red-500" />
              <span>天道挑战</span>
              <Swords className="w-6 h-6 text-red-500" />
            </DialogTitle>
            <DialogDescription className="text-center">
              准备挑战世界边界的守护者
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="animate-pulse">
              <SwordsIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <p className="text-lg">正在召唤天道...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 战斗阶段
  if (phase === 'fighting' && battleState && guardianState) {
    const playerHpPercent = (battleState.playerCurrentHp / battleState.playerMaxHp) * 100;
    const guardianHpPercent = (guardianState.guardianCurrentHp / guardianState.guardianMaxHp) * 100;
    
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[600px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Skull className="w-5 h-5 text-red-500" />
              <span>{guardianState.guardianName}</span>
              <Badge variant="outline" className="text-xs">
                {guardianState.guardianTitle}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-center text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              自动战斗中 - 第 {guardianState.currentPhase} 阶段 / 回合 {battleState.currentRound}/{ASCENSION_CONFIG.battle.maxTurns}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 守卫信息 */}
            <Card className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-200 dark:border-red-900">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-red-500" />
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {guardianState.guardianName}
                  </span>
                  <Badge variant="destructive" className="text-[10px]">
                    阶段 {guardianState.currentPhase}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.max(0, guardianState.guardianCurrentHp)} / {guardianState.guardianMaxHp}
                </span>
              </div>
              <Progress 
                value={Math.max(0, guardianHpPercent)} 
                className="h-3 bg-red-100 dark:bg-red-950"
              />
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-red-500" />
                  攻击: {guardianState.guardianAttack}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-orange-500" />
                  防御: {guardianState.guardianDefense}
                </span>
              </div>
              
              {guardianState.currentPhase === 1 && logs.length === 0 && (
                <div className="mt-3 p-2 bg-red-500/20 rounded text-center text-sm italic">
                  "{guardianConfig.battleCries.start}"
                </div>
              )}
              {guardianState.currentPhase === 2 && logs.filter(l => l.special === 'phase2').length === 0 && (
                <div className="mt-3 p-2 bg-orange-500/20 rounded text-center text-sm italic">
                  "{guardianConfig.battleCries.phase2}"
                </div>
              )}
            </Card>

            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="h-px flex-1 bg-border" />
              <span className="px-4 font-bold text-muted-foreground">VS</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* 玩家信息 */}
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-900">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-green-600 dark:text-green-400">你</span>
                  <Badge variant="outline" className="text-[10px]">
                    Lv.{protagonist.level}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.max(0, battleState.playerCurrentHp)} / {battleState.playerMaxHp}
                </span>
              </div>
              <Progress 
                value={Math.max(0, playerHpPercent)} 
                className="h-3 bg-green-100 dark:bg-green-950"
              />
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-green-500" />
                  攻击: {battleState.playerAttack}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  防御: {battleState.playerDefense}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-pink-500" />
                  MP: {battleState.playerCurrentMp}/{battleState.playerMaxMp}
                </span>
              </div>
            </Card>

            {/* 战斗日志 */}
            {logs.length > 0 && (
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  战斗记录
                </div>
                {logs.slice(-8).map((log, idx) => (
                  <div 
                    key={idx}
                    className={`text-xs py-0.5 px-1.5 rounded ${
                      log.attacker === 'player' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <span className="text-muted-foreground mr-1">R{log.round}</span>
                    {log.action}
                    {log.damage && <span className="ml-1 text-red-500">-{log.damage}</span>}
                    {log.heal && <span className="ml-1 text-green-500">+{log.heal}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 结果阶段
  if (phase === 'result') {
    const result = battleResultRef.current;
    
    if (!result) {
      console.error('[GuardianBattle] Result phase but no result!');
      return null;
    }
    
    const { victory, turnsUsed, remainingHpPercent } = result;
    const guardianName = guardianState?.guardianName || '天道守护者';
    
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              {victory ? (
                <>
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <span className="text-green-600 dark:text-green-400">挑战成功！</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">挑战失败...</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {victory ? (
              <div className="bg-gradient-to-br from-yellow-500/20 to-green-500/20 rounded-lg p-6 text-center">
                <Sparkles className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <p className="text-lg font-bold mb-2">
                  你击败了【{guardianName}】！
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  世界壁垒已突破，飞升即将开始...
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-500/20 rounded p-2">
                    <span className="text-muted-foreground">战斗回合</span>
                    <span className="block font-bold text-green-600">{turnsUsed}</span>
                  </div>
                  <div className="bg-green-500/20 rounded p-2">
                    <span className="text-muted-foreground">剩余HP</span>
                    <span className="block font-bold text-green-600">
                      {(remainingHpPercent * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg p-6 text-center">
                <Skull className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <p className="text-lg font-bold mb-2">
                  你被【{guardianName}】击败了...
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  飞升失败，需要恢复后再次挑战
                </p>
                
                <div className="bg-red-500/20 rounded p-3 text-left text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HP损失</span>
                    <span className="text-red-500">-30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">心境下降</span>
                    <span className="text-red-500">-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">冷却时间</span>
                    <span className="text-orange-500">24小时</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={handleResultConfirm} 
              className="w-full"
              type="button"
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
