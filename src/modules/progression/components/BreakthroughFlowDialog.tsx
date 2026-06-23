'use client';

import { useState, useMemo } from 'react';

import {
  Sparkles, Swords, Brain, Shield, Zap, Heart,
  Target, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Flame,
} from 'lucide-react';

import { getFinalStats } from '@/core/types';
import type { Protagonist, MentalState } from '@/core/types';
import type {
  AttributeCheckResult,
  StrategyChoice,
  RefineBattleResult,
  BreakthroughResult,
  GeneratedDemon,
} from '@/modules/progression/logic/demonBreakthrough';
import {
  forgeDemon,
  executeAttributeCheck,
  generateStrategyChoices,
  executeStrategyChoice,
  simulateRefineBattle,
  computeCoreStats,
} from '@/modules/progression/logic/demonBreakthrough';
import { Button } from '@/shared/ui/actions/button';
import { Badge } from '@/shared/ui/data-display/badge';
import { Progress } from '@/shared/ui/feedback/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/overlay/dialog';

// ============================================
// Props
// ============================================

interface BreakthroughFlowDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 主角数据 */
  protagonist: Protagonist;
  /** 心境状态 */
  mentalState: MentalState;
  /** 突破完成回调 */
  onBreakthroughComplete: (result: {
    success: boolean;
    chosenChoice: StrategyChoice | null;
  }) => void;
}

// ============================================
// 流程步骤
// ============================================

type FlowStep = 'preview' | 'phase1' | 'phase2' | 'phase3' | 'result';

/**
 * BreakthroughFlowDialog — 心魔突破战全屏流程对话框
 *
 * 三阶段心魔突破流程的完整 UI，替代旧的 BreakthroughPanel + TribulationDialog。
 * MVP 版本：阶段三为自动模拟，不包含点击交互。
 */
export function BreakthroughFlowDialog({
  open,
  onOpenChange,
  protagonist,
  mentalState,
  onBreakthroughComplete,
}: BreakthroughFlowDialogProps) {
  const [step, setStep] = useState<FlowStep>('preview');
  const [selectedChoice, setSelectedChoice] = useState<StrategyChoice | null>(null);
  const [phaseResult, setPhaseResult] = useState<BreakthroughResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 生成心魔和阶段一结果（进入阶段一和阶段二时使用）
  const demonData = useMemo(() => {
    const stats = getFinalStats(protagonist.stats);
    const coreStats = computeCoreStats(stats);
    const seed = Date.now() + protagonist.level * 7919;

    const demon = forgeDemon({
      worldType: protagonist.world.type,
      playerLevel: protagonist.level,
      playerCoreStats: coreStats,
      karma: mentalState.karma,
      cultivationPath: protagonist.cultivationPath ?? null,
      seed,
      demonCodex: mentalState.demonCodex ?? [],
    });

    const phase1 = executeAttributeCheck(demon, coreStats, mentalState.demonCodex ?? []);
    const choices = generateStrategyChoices(
      demon,
      coreStats,
      protagonist.cultivationPath ?? null,
    );

    return { demon, phase1, choices, coreStats, seed };
  }, [protagonist, mentalState, open]); // open 变化时重新生成

  // 阶段二选择处理
  const handleChooseStrategy = (choice: StrategyChoice) => {
    setSelectedChoice(choice);
    setIsProcessing(true);

    setTimeout(() => {
      const result = executeStrategyChoice(
        choice,
        demonData.coreStats,
        protagonist.cultivationPath ?? null,
        demonData.seed + 1,
      );

      // 阶段三自动模拟
      const baseMindShield = 30 + (mentalState.mindShield ?? 0) * 5 + demonData.coreStats.willpower;
      const phase3 = simulateRefineBattle({
        physicalATK: demonData.coreStats.physicalATK,
        specialATK: demonData.coreStats.specialATK,
        speed: demonData.coreStats.speed,
        perception: demonData.coreStats.perception,
        mindShield: Math.min(100, baseMindShield),
        duration: 15 + Math.floor(demonData.coreStats.speed * 2),
        maxWeaknesses: 3 + Math.floor(demonData.coreStats.perception / 20),
        items: [],
        finalSkillAvailable: (protagonist.pathLevel ?? 1) >= 5,
        pathType: protagonist.cultivationPath ?? null,
      });

      const demonDefeated = phase3.progress >= 100 && phase3.mindShield > 0;
      const overallSuccess = result.success && demonDefeated;

      const breakthroughResult: BreakthroughResult = {
        success: overallSuccess,
        levelUp: overallSuccess,
        statGains: result.statChanges,
        demonDefeated,
        mindShieldChange: overallSuccess ? -10 : -5,
        stabilityChange: result.stabilityChange,
        demonMemory: {
          demonType: demonData.demon.type,
          name: demonData.demon.name,
          encounters: 1,
          victories: demonDefeated ? 1 : 0,
          lastEncountered: Date.now(),
          lastWorldType: protagonist.world.type,
          isArchNemesis: false,
          consecutiveLosses: demonDefeated ? 0 : 1,
        },
        messages: [
          `【心魔显形】${demonData.demon.name}从你内心深处浮现！`,
          `【属性检定】${demonData.phase1.totalMindDamage > 0 ? `心境受创 -${demonData.phase1.totalMindDamage}` : '全属性压制！心境无损！'}`,
          `【策略选择】${result.message}`,
          `【心魔炼化】${demonDefeated ? '炼化成功！进度 ' + phase3.progress + '%' : '炼化失败，心魔逃脱……'}`,
        ],
        phaseResults: {
          phase1: demonData.phase1,
          phase2: result,
          phase3,
        },
      };

      setPhaseResult(breakthroughResult);
      setStep('phase3');

      // 延迟进入结果
      setTimeout(() => {
        setStep('result');
        setIsProcessing(false);
      }, 2500);
    }, 800);
  };

  // 确认结果并关闭
  const handleConfirmResult = () => {
    if (phaseResult) {
      onBreakthroughComplete({
        success: phaseResult.success,
        chosenChoice: selectedChoice,
      });
    }
    onOpenChange(false);
    resetState();
  };

  const handleStartBreakthrough = () => setStep('phase1');
  const handleProceedToPhase2 = () => setStep('phase2');

  const resetState = () => {
    setStep('preview');
    setSelectedChoice(null);
    setPhaseResult(null);
    setIsProcessing(false);
  };

  // 心魔预览阶段
  if (step === 'preview') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Flame className="w-5 h-5 text-game-mental" />
              冲击境界
            </DialogTitle>
            <DialogDescription>
              心魔将从你的内心深处显现，唯有战胜它才能突破境界。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 突破预览 */}
            <div className="bg-gradient-to-r from-game-mental/10 to-game-cultivation/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">当前等级</span>
                <Badge variant="outline">{protagonist.level}级</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">目标等级</span>
                <Badge variant="default">{protagonist.level + 1}级</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">心境护盾</span>
                <span className="text-sm font-medium">
                  {30 + (mentalState.mindShield ?? 0) * 5 + computeCoreStats(getFinalStats(protagonist.stats)).willpower}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">修炼流派</span>
                <span className="text-sm">
                  {protagonist.cultivationPath ?? '未选择'}
                </span>
              </div>
            </div>

            {/* 心魔提示 */}
            <div className="border border-game-mental/30 rounded-lg p-3 bg-game-mental/5">
              <div className="flex items-center gap-2 text-sm text-game-mental mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">心魔警告</span>
              </div>
              <p className="text-xs text-muted-foreground">
                心魔将根据你的属性发动攻击。意志坚定者能以气势压制心魔，
                智慧卓绝者能看破心魔的本质。请做好心理准备。
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              从长计议
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-game-mental to-game-cultivation hover:brightness-110"
              onClick={handleStartBreakthrough}
            >
              <Swords className="w-4 h-4 mr-1" />
              冲击境界
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 阶段一：属性检定
  if (step === 'phase1') {
    const { demon, phase1 } = demonData;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[480px]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-game-mental">
              <Flame className="w-5 h-5" />
              心魔显形 · 属性检定
            </DialogTitle>
            <DialogDescription>
              {demon.visualPreset.formDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 心魔信息 */}
            <div className="bg-game-mental/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-game-mental">{demon.name}</span>
                <Badge variant="outline" className="text-xs border-game-mental/30">
                  {demon.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{demon.temptation}&rdquo;
              </p>
            </div>

            {/* 三项检定 */}
            <div className="space-y-2">
              {renderCheckRow('物理防御', phase1.checks.physical, <Shield className="w-4 h-4" />)}
              {renderCheckRow('法术防御', phase1.checks.special, <Sparkles className="w-4 h-4" />)}
              {renderCheckRow('意志侵蚀', phase1.checks.will, <Brain className="w-4 h-4" />)}
            </div>

            {/* 总伤害 */}
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">心境总伤害</span>
                <span className={`font-bold text-lg ${
                  phase1.totalMindDamage === 0
                    ? 'text-game-recovery'
                    : phase1.totalMindDamage < 30
                    ? 'text-game-economy'
                    : 'text-game-combat'
                }`}>
                  {phase1.totalMindDamage === 0 ? '完美防御！' : `-${phase1.totalMindDamage}`}
                </span>
              </div>
              {phase1.bonuses.length > 0 && (
                <div className="text-xs text-game-cultivation mt-1">
                  {phase1.bonuses.join(' · ')}
                </div>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-game-mental to-game-cultivation hover:brightness-110"
            onClick={handleProceedToPhase2}
          >
            <Swords className="w-4 h-4 mr-1" />
            进入心魔交锋
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // 阶段二：策略选择
  if (step === 'phase2') {
    const { demon, choices } = demonData;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[480px]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-game-mental" />
              心魔交锋 · 策略选择
            </DialogTitle>
            <DialogDescription>
              &ldquo;{demon.temptation}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {choices.map((choice) => (
              <button
                key={choice.index}
                type="button"
                className={`w-full text-left border rounded-lg p-3 transition-all hover:ring-2 hover:ring-primary/50 ${
                  choice.demonExclusive
                    ? 'border-purple-500/50 bg-purple-500/5'
                    : 'border-border bg-card'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isProcessing && handleChooseStrategy(choice)}
                disabled={isProcessing}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {choice.demonExclusive && (
                      <Flame className="w-3 h-3 inline mr-1 text-purple-500" />
                    )}
                    {choice.text}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      choice.actualRate >= 0.6
                        ? 'border-game-recovery text-game-recovery'
                        : choice.actualRate >= 0.4
                        ? 'border-game-economy text-game-economy'
                        : 'border-game-combat text-game-combat'
                    }`}
                  >
                    {(choice.actualRate * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>检定：{statLabel(choice.statType)} [{choice.statValue}]</span>
                  <span className="text-game-recovery">
                    成功：+{choice.successEffect.stabilityChange}心境
                  </span>
                  <span className="text-game-combat">
                    失败：{choice.failEffect.stabilityChange}心境
                  </span>
                </div>
              </button>
            ))}
          </div>

          {isProcessing && (
            <div className="text-center text-sm text-muted-foreground py-2">
              <Sparkles className="w-4 h-4 inline mr-1 animate-pulse" />
              心魔交锋中...
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // 阶段三：心魔炼化（动画展示）
  if (step === 'phase3' && phaseResult) {
    const { phase3 } = phaseResult.phaseResults;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[480px]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-center justify-center">
              <Zap className="w-5 h-5 text-game-cultivation animate-pulse" />
              心魔炼化
              <Zap className="w-5 h-5 text-game-cultivation animate-pulse" />
            </DialogTitle>
            <DialogDescription className="text-center">
              正在与心魔进行最终对决...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 炼化进度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>炼化进度</span>
                <span className="font-bold">{phase3.progress}%</span>
              </div>
              <Progress
                value={phase3.progress}
                className={`h-3 ${phase3.progress >= 100 ? '[&>div]:bg-game-recovery' : ''}`}
              />
            </div>

            {/* 心境护盾 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>心境护盾</span>
                <span className={`font-bold ${phase3.mindShield < 20 ? 'text-game-combat' : ''}`}>
                  {phase3.mindShield}
                </span>
              </div>
              <Progress
                value={phase3.mindShield}
                className={`h-2 ${phase3.mindShield < 20 ? '[&>div]:bg-game-combat' : '[&>div]:bg-game-cultivation'}`}
              />
            </div>

            {/* 战斗统计 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground">命中弱点</span>
                <span className="float-right font-bold text-game-cultivation">{phase3.weaknessesHit}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground">错失弱点</span>
                <span className="float-right font-bold text-game-combat">{phase3.weaknessesMissed}</span>
              </div>
              {phase3.itemsUsed.length > 0 && (
                <div className="bg-muted/30 rounded p-2 col-span-2">
                  <span className="text-muted-foreground">使用道具</span>
                  <span className="float-right text-game-cultivation">{phase3.itemsUsed.join('、')}</span>
                </div>
              )}
              {phase3.finalSkillUsed && (
                <div className="bg-game-mental/10 rounded p-2 col-span-2 text-center text-game-mental">
                  流派终结技发动！
                </div>
              )}
              {phase3.perfectTriggered && (
                <div className="bg-game-tribulation/10 rounded p-2 col-span-2 text-center text-game-tribulation font-bold">
                  ⚡ 完美炼化！一击毙命！
                </div>
              )}
            </div>

            {/* 战斗日志 */}
            {phase3.battleLog.length > 0 && (
              <div className="bg-muted/20 rounded-lg p-2 max-h-24 overflow-y-auto text-xs space-y-1">
                {phase3.battleLog.map((log, i) => (
                  <p key={i} className="text-muted-foreground">{log}</p>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 结果展示
  if (step === 'result' && phaseResult) {
    const success = phaseResult.success;
    const ps = phaseResult.phaseResults;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center text-lg">
              {success ? (
                <>
                  <CheckCircle className="w-6 h-6 text-game-recovery" />
                  <span className="text-game-recovery">突破成功！</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-game-combat" />
                  <span className="text-game-combat">突破失败...</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {success ? (
              <div className="bg-gradient-to-r from-game-recovery/10 to-game-cultivation/10 rounded-lg p-4 space-y-3">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-game-recovery mx-auto mb-1" />
                  <p className="text-lg font-bold">
                    {protagonist.level}级 → {protagonist.level + 1}级
                  </p>
                  <p className="text-sm text-muted-foreground">
                    你战胜了{phaseResult.demonMemory.name}，成功突破境界！
                  </p>
                </div>

                {Object.keys(phaseResult.statGains).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-game-cultivation">属性提升</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(phaseResult.statGains).map(([stat, value]) => (
                        <Badge key={stat} variant="outline" className="border-game-recovery text-game-recovery text-xs">
                          {stat} +{value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-game-recovery/20 rounded p-2 text-xs">
                  <span className="text-muted-foreground">心境变化：</span>
                  <span className={phaseResult.stabilityChange >= 0 ? 'text-game-recovery' : 'text-game-combat'}>
                    {phaseResult.stabilityChange >= 0 ? '+' : ''}{phaseResult.stabilityChange} 稳定度
                  </span>
                </div>
              </div>
            ) : phaseResult.demonDefeated ? (
              <div className="bg-gradient-to-r from-game-economy/10 to-game-cultivation/10 rounded-lg p-4 text-center space-y-2">
                <Heart className="w-12 h-12 text-game-economy mx-auto" />
                <p className="font-bold">心魔被削弱了，但未能突破</p>
                <p className="text-sm text-muted-foreground">
                  虽然未能突破境界，但你成功削弱了心魔，下次突破时它将更弱。
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-game-combat/10 to-game-mental/10 rounded-lg p-4 text-center space-y-2">
                <AlertTriangle className="w-12 h-12 text-game-combat mx-auto" />
                <p className="font-bold text-game-combat">心魔反噬！</p>
                <p className="text-sm text-muted-foreground">
                  心魔趁虚而入，你的心境受到了严重损伤。建议打坐冥想恢复后再尝试。
                </p>
                <p className="text-xs text-game-combat">
                  心境稳定度 {phaseResult.stabilityChange >= 0 ? '+' : ''}{phaseResult.stabilityChange}
                </p>
              </div>
            )}

            {/* 阶段统计 */}
            <div className="grid grid-cols-3 gap-1 text-xs text-center">
              <div className={`rounded p-1.5 ${ps.phase1.totalMindDamage === 0 ? 'bg-game-recovery/10 text-game-recovery' : 'bg-game-combat/10 text-game-combat'}`}>
                检定 {ps.phase1.totalMindDamage === 0 ? '✓' : `-${ps.phase1.totalMindDamage}`}
              </div>
              <div className={`rounded p-1.5 ${ps.phase2.success ? 'bg-game-recovery/10 text-game-recovery' : 'bg-game-combat/10 text-game-combat'}`}>
                策略 {ps.phase2.success ? '✓' : '✗'}
              </div>
              <div className={`rounded p-1.5 ${ps.phase3.progress >= 100 ? 'bg-game-recovery/10 text-game-recovery' : 'bg-game-combat/10 text-game-combat'}`}>
                炼化 {ps.phase3.progress}%
              </div>
            </div>
          </div>

          <Button
            className={`w-full ${
              success
                ? 'bg-gradient-to-r from-game-recovery to-game-cultivation'
                : ''
            }`}
            onClick={handleConfirmResult}
          >
            确认
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

// ============================================
// 辅助渲染函数
// ============================================

/** 渲染单项检定行 */
function renderCheckRow(
  label: string,
  check: { playerValue: number; demonValue: number; damage: number; passed: boolean },
  icon: React.ReactNode,
) {
  return (
    <div className={`rounded-lg p-2 border ${check.passed ? 'border-game-recovery/30 bg-game-recovery/5' : 'border-game-combat/30 bg-game-combat/5'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-sm">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={`text-xs font-bold ${check.passed ? 'text-game-recovery' : 'text-game-combat'}`}>
          {check.passed ? '通过' : `-${check.damage}`}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>你：{check.playerValue}</span>
        <span className="text-game-mental">vs</span>
        <span>心魔：{check.demonValue}</span>
      </div>
    </div>
  );
}

/** 策略属性类型标签 */
function statLabel(statType: string): string {
  switch (statType) {
    case 'willpower': return '意志';
    case 'intelligence': return '悟性';
    case 'physicalATK': return '体质攻击';
    case 'specialATK': return '灵根攻击';
    default: return statType;
  }
}
