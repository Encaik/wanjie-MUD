'use client';

import {  useState, useEffect, useRef } from 'react';

import {  Sparkles, AlertTriangle, Coins, Play, Square, Moon, Swords, TrendingUp, Droplets, Zap, Flame, Shield, Wand2, Heart, Swords as SwordIcon, Brain, CloudLightning, FlaskConical, Anvil, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

import {  Badge } from '@/shared/ui/data-display/badge';
import {  Button } from '@/shared/ui/actions/button';
import {  Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import {  Progress } from '@/shared/ui/feedback/progress';
import {  CULTIVATION_PATHS } from '@/modules/progression/data/cultivationPathData';
import {  TRIBULATION_CONFIGS, getNextTribulationLevel } from '@/modules/ascension/data/tribulationData';
import {  getMaxExperience, calculateBreakthroughRate, calculateBreakthroughBoost, calculateCultivationBoost } from '@/modules/progression/logic/cultivation';
import {  
  checkRealmBottleneck,
  attemptBreakthrough,
  startTribulation,
  executeTribulationPhase,
  calculateTribulationReward,
  calculateTribulationPenalty,
  calculateMentalEffect,
  checkDemonTrigger,
  getDemonEvent,
  processDemonChoice
} from '@/core/engine';
import {  MAX_LEVEL } from '@/modules/progression/logic/realmSystem';
import {  
  TUTORIAL_TASKS, 
  checkTutorialProgress, 
  TutorialTask 
} from '@/modules/faction/logic';
import {  getTerminology } from '@/modules/narrative/logic/terminology';
import { FlatStats, WorldType, InventoryItem, ActiveEffect, CultivationPath, CharacterStats, GameStatistics } from '@/core/types';
import {  
  RealmBottleneck, 
  TribulationState, 
  MentalState, 
  DemonEncounter,
  DEFAULT_PROTAGONIST_EXTENSION 
} from '@/core/types';


interface CultivationPanelProps {
  onCultivate: () => void;
  onCultivateWithStrategy?: (strategy: 'steady' | 'aggressive' | 'insight') => void;
  cultivationCooldown?: number | null;
  insightMarks?: number;
  onRest: () => void;
  onChallengeGuardian?: () => void;
  onSelectPath?: () => void;
  disabled?: boolean;
  worldType: WorldType;
  inventory: InventoryItem[];
  activeEffects?: ActiveEffect[];
  experience: number;
  overflowExperience: number;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  autoCultivating: boolean;
  onToggleAutoCultivation: () => void;
  luck?: number;
  // 流派相关
  cultivationPath?: CultivationPath | null;
  pathLevel?: number;
  // 属性相关
  stats?: FlatStats;
  // 突破相关回调
  onBreakthrough?: (success: boolean) => void;
  // 渡劫回调
  onTribulation?: () => void;
  // 心境状态 - 从外部传入
  mentalState?: MentalState;
  onMentalStateChange?: (mentalState: MentalState) => void;
  // 统计数据 - 用于新手引导
  statistics?: GameStatistics;
  // 已完成的新手任务ID列表
  completedTutorialTaskIds?: string[];
}

// 获取灵石数量
function getSpiritStoneCount(inventory: InventoryItem[] | undefined): number {
  if (!inventory) return 0;
  const item = inventory.find(i => i.definition.id === 'spirit_stone');
  return item ? item.quantity : 0;
}

// 获取流派图标
function getPathIcon(pathType: string) {
  switch (pathType) {
    case 'body': return <Shield className="w-3.5 h-3.5" />;
    case 'sword': return <Swords className="w-3.5 h-3.5" />;
    case 'spell': return <Sparkles className="w-3.5 h-3.5" />;
    case 'alchemy': return <Zap className="w-3.5 h-3.5" />;
    case 'demon': return <Flame className="w-3.5 h-3.5" />;
    default: return <Sparkles className="w-3.5 h-3.5" />;
  }
}

// 获取流派颜色
function getPathColor(pathType: string) {
  switch (pathType) {
    case 'body': return 'text-game-combat bg-game-combat/10 border-game-combat/30';
    case 'sword': return 'text-game-tribulation bg-game-tribulation/10 border-game-tribulation/30';
    case 'spell': return 'text-game-cultivation bg-game-cultivation/10 border-game-cultivation/30';
    case 'alchemy': return 'text-game-recovery bg-game-recovery/10 border-game-recovery/30';
    case 'demon': return 'text-game-mental bg-game-mental/10 border-game-mental/30';
    default: return 'text-muted-foreground bg-muted/30 border-muted';
  }
}

export function CultivationPanel({
  onCultivate,
  onCultivateWithStrategy,
  cultivationCooldown,
  insightMarks = 0,
  onRest,
  onChallengeGuardian,
  onSelectPath,
  disabled,
  worldType,
  inventory,
  activeEffects = [],
  experience,
  overflowExperience,
  level,
  currentHp,
  maxHp,
  currentMp,
  maxMp,
  autoCultivating,
  onToggleAutoCultivation,
  luck = 10,
  cultivationPath,
  pathLevel = 1,
  stats,
  onBreakthrough,
  onTribulation,
  mentalState: externalMentalState,
  onMentalStateChange,
  statistics,
  completedTutorialTaskIds = [],
}: CultivationPanelProps) {
  // 心境状态 - 优先使用外部传入的，否则使用内部管理
  const [internalMentalState, setInternalMentalState] = useState<MentalState>(
    DEFAULT_PROTAGONIST_EXTENSION.mentalState
  );
  
  // 使用外部或内部状态
  const mentalState = externalMentalState ?? internalMentalState;
  
  // 统一的状态更新函数
  const updateMentalState = (updater: (prev: MentalState) => MentalState) => {
    const newState = updater(mentalState);
    if (onMentalStateChange) {
      onMentalStateChange(newState);
    } else {
      setInternalMentalState(newState);
    }
  };
  
  // 记录上一次的经验值，用于检测修炼变化
  const prevExpRef = useRef(experience);
  
  // 当经验值增加时（修炼），随机改变心境
  useEffect(() => {
    if (experience > prevExpRef.current) {
      // 修炼时心境有几率变化
      const changeChance = Math.random();
      if (changeChance < 0.3) {
        // 30%几率心境稳定度变化
        const change = Math.floor(Math.random() * 11) - 5; // -5到+5的变化
        updateMentalState(prev => ({
          ...prev,
          stability: Math.max(0, Math.min(100, prev.stability + change)),
          lastChangeTime: Date.now()
        }));
      }
      
      // 检查是否触发心魔
      const { triggered } = checkDemonTrigger(mentalState, cultivationPath || null);
      if (triggered) {
        // 增加心魔概率
        updateMentalState(prev => ({
          ...prev,
          demonChance: Math.min(0.5, prev.demonChance + 0.01)
        }));
      }
    }
    prevExpRef.current = experience;
  }, [experience, cultivationPath, mentalState]);
  
  // 境界瓶颈状态
  const [realmBottleneck, setRealmBottleneck] = useState<RealmBottleneck>({
    isActive: false,
    type: null,
    level: 0,
    requirements: {},
    attempts: 0,
    maxAttempts: 3
  });
  
  // 渡劫状态
  const [tribulationState, setTribulationState] = useState<TribulationState>({
    inProgress: false,
    config: null,
    currentPhase: 0,
    totalPhases: 3,
    successRate: 0
  });
  
  // 心魔事件状态
  const [currentDemon, setCurrentDemon] = useState<DemonEncounter | null>(null);
  const [demonResult, setDemonResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDemonDialog, setShowDemonDialog] = useState(false);
  
  const terminology = getTerminology(worldType);
  const spiritStones = getSpiritStoneCount(inventory);
  const maxExp = getMaxExperience(level);
  // 只要经验值>=最大值就可以尝试突破，溢出经验不影响显示
  const canAttemptBreakthrough = experience >= maxExp;
  const hasEnoughStones = spiritStones >= 20;
  const isMaxLevel = level >= MAX_LEVEL;
  
  // 计算突破概率 - 只要经验值>=最大值就显示
  const breakthroughBoost = calculateBreakthroughBoost(activeEffects);
  const cultivationBoost = calculateCultivationBoost(activeEffects);
  const breakthroughRate = experience >= maxExp
    ? calculateBreakthroughRate(level, luck, breakthroughBoost, overflowExperience, maxExp)
    : 0;
  
  // 计算心境效率影响
  const mentalEffect = calculateMentalEffect(mentalState.stability);
  
  // 检查是否需要渡劫（只有达到渡劫等级时才显示）
  const nextTribLevel = getNextTribulationLevel(level);
  const needsTribulation = nextTribLevel !== null && level >= nextTribLevel && experience >= maxExp;
  
  // 检查心魔触发
  const handleDemonCheck = () => {
    const { triggered } = checkDemonTrigger(mentalState, cultivationPath || null);
    if (triggered) {
      const demon = getDemonEvent();
      setCurrentDemon(demon);
      setDemonResult(null);
      setShowDemonDialog(true);
    }
  };
  
  // 处理心魔选择
  const handleDemonChoice = (choiceIndex: number) => {
    if (!currentDemon || !stats) return;
    const result = processDemonChoice(currentDemon, choiceIndex, stats);
    setDemonResult(result);
    updateMentalState(prev => ({
      ...prev,
      stability: Math.max(0, Math.min(100, prev.stability + result.stabilityChange)),
      demonChance: Math.max(0, prev.demonChance + (result.success ? -0.05 : result.demonChanceChange / 100))
    }));
  };
  
  // 关闭心魔对话框
  const closeDemonDialog = () => {
    setShowDemonDialog(false);
    setCurrentDemon(null);
    setDemonResult(null);
  };
  
  // 找到丹药效果
  const breakthroughEffect = activeEffects.find(e => e.type === 'breakthrough_boost');
  const cultivationEffect = activeEffects.find(e => e.type === 'cultivation_boost');
  
  // 状态恢复相关
  const needsRest = currentHp < maxHp || currentMp < maxMp;
  const hasEnoughStonesForRest = spiritStones >= 5;
  
  // 天道挑战条件：满级且HP/MP满
  const canChallengeGuardian = isMaxLevel && currentHp >= maxHp && currentMp >= maxMp;
  
  // 获取流派配置（CULTIVATION_PATHS 是 Record 类型）
  const pathConfig = cultivationPath ? CULTIVATION_PATHS[cultivationPath] : null;

  return (
    <Card>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          {terminology.practice}
          {autoCultivating && (
            <span className="text-[10px] text-primary animate-pulse ml-auto">自动修炼中...</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 新手引导任务面板 */}
        {statistics && (() => {
          // 创建一个临时 protagonist 对象用于检查任务进度
          const tempProtagonist = {
            level,
            activeEffects,
            statistics,
          } as any;
          
          // 使用持久化的已完成任务列表，确保任务进度正确显示
          const { completedTasks, currentTask, progress } = checkTutorialProgress(
            tempProtagonist, 
            statistics,
            completedTutorialTaskIds
          );
          
          // 所有任务完成后隐藏面板
          if (progress >= 1) return null;
          
          return (
            <div className="bg-gradient-to-r from-game-cultivation/10 to-game-mental/10 rounded-lg p-2 border border-game-cultivation/30">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-game-cultivation">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>新手引导</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {completedTasks.length}/{TUTORIAL_TASKS.length}
                </Badge>
              </div>
              
              {/* 进度条 */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-game-cultivation to-game-mental rounded-full transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              
              {/* 当前任务 */}
              {currentTask && (
                <div className="bg-card rounded p-2 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <Circle className="w-3 h-3 text-game-cultivation mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">
                        {currentTask.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {currentTask.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-game-cultivation bg-game-cultivation/10 px-1.5 py-0.5 rounded">
                    💡 {currentTask.hint}
                  </div>
                </div>
              )}
              
              {/* 已完成任务列表 */}
              {completedTasks.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {TUTORIAL_TASKS.filter(t => completedTasks.includes(t.id)).map(task => (
                    <div key={task.id} className="flex items-center gap-1 text-[10px] text-game-recovery">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span className="line-through">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        
        {/* 流派信息区域 - 点击可查看详情 */}
        {pathConfig ? (
          <button
            type="button"
            className={`w-full text-left border rounded-lg p-2 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${getPathColor(pathConfig.id)}`}
            onClick={onSelectPath}
            disabled={disabled}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {getPathIcon(pathConfig.id)}
                <span className="text-xs font-medium">{pathConfig.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px]">
                  Lv.{pathLevel}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {pathConfig.skills[0]?.name || '基础技能'}
                </Badge>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{pathConfig.description}</p>
            <p className="text-[10px] text-primary/70 mt-1 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              点击查看流派详情
            </p>
          </button>
        ) : (
          <Button 
            variant="outline"
            className="w-full h-8 text-xs border-dashed border-2" 
            onClick={onSelectPath}
            disabled={disabled}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            选择修炼流派
          </Button>
        )}
        
        {/* 满级天道挑战区域 */}
        {isMaxLevel && (
          <div className="border-2 border-game-tribulation/30 rounded-lg p-2 bg-gradient-to-r from-game-tribulation/10 to-game-cultivation/10">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-game-tribulation">
                <Swords className="w-3.5 h-3.5" />
                <span>天道</span>
              </div>
              <span className="text-[10px] text-muted-foreground">满级挑战</span>
            </div>
            <Button
              variant="default"
              className="w-full h-8 text-xs bg-gradient-to-r from-game-tribulation to-game-cultivation hover:brightness-110"
              onClick={onChallengeGuardian}
              disabled={disabled || !canChallengeGuardian || autoCultivating}
            >
              <Swords className="w-3 h-3 mr-1" />
              {canChallengeGuardian ? '挑战天道' : '需满状态挑战'}
            </Button>
            {!canChallengeGuardian && (
              <div className="text-[10px] text-center text-muted-foreground mt-1">
                请先恢复至满状态
              </div>
            )}
          </div>
        )}

        {/* 突破提示与概率显示 */}
        {canAttemptBreakthrough && !isMaxLevel && (
          <div className="bg-gradient-to-r from-game-tribulation/10 to-game-cultivation/10 p-2 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-game-tribulation">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-medium">可尝试突破</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-game-tribulation/10 text-game-tribulation border-game-tribulation/30">
                {level}级 → {level + 1}级
              </Badge>
            </div>
            
            {/* 突破概率显示 */}
            <div className="bg-card rounded p-1.5 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">突破成功率</span>
                <span className={`font-bold ${breakthroughRate >= 70 ? 'text-game-recovery' : breakthroughRate >= 40 ? 'text-game-economy' : 'text-game-combat'}`}>
                  {breakthroughRate.toFixed(1)}%
                </span>
              </div>
              
              {/* 概率进度条 */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    breakthroughRate >= 70 ? 'bg-game-recovery' : breakthroughRate >= 40 ? 'bg-game-economy' : 'bg-game-combat'
                  }`}
                  style={{ width: `${Math.min(breakthroughRate, 100)}%` }}
                />
              </div>
              
              {/* 丹药加成显示 */}
              {breakthroughEffect && (
                <div className="flex items-center gap-1 text-[10px] text-game-cultivation">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{breakthroughEffect.itemName}加成 +{breakthroughEffect.value}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 经验溢出警告 */}
        {overflowExperience > 0 && !isMaxLevel && (
          <div className="text-xs bg-game-economy/10 text-game-economy p-2 rounded-lg flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            经验溢出 {overflowExperience}，修炼效率降低
          </div>
        )}

        {/* 修炼区域 - 非满级时显示 */}
        {!isMaxLevel && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>消耗资源修炼</span>
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-game-economy" />
                <span className={hasEnoughStones ? '' : 'text-game-combat'}>20 {terminology.resource}</span>
              </div>
            </div>
            
            {/* 修炼丹药加成显示 */}
            {cultivationEffect && (
              <div className="flex items-center gap-1 text-[10px] text-game-cultivation bg-game-cultivation/10 px-2 py-1 rounded">
                <Zap className="w-2.5 h-2.5" />
                <span>{cultivationEffect.itemName}：修炼效果+{cultivationEffect.value}%（剩余{cultivationEffect.remainingCount}次）</span>
              </div>
            )}
            
            {/* 冷却提示 */}
            {cultivationCooldown && cultivationCooldown > Date.now() ? (
              <div className="text-[10px] text-game-tribulation text-center">
                冥想冷却中，剩余 {Math.ceil((cultivationCooldown - Date.now()) / 1000)} 秒
              </div>
            ) : null}

            {/* 顿悟印记 */}
            {insightMarks > 0 && (
              <div className="text-[10px] text-game-mental text-center">
                ✦ 顿悟印记：{insightMarks} 枚（集齐3枚可兑换）
              </div>
            )}

            {/* 修炼策略选择 */}
            {onCultivateWithStrategy ? (
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => onCultivateWithStrategy('steady')}
                    disabled={disabled || !hasEnoughStones || autoCultivating}
                    title="消耗20灵石，标准收益，失败返半"
                  >
                    稳健
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    variant="secondary"
                    onClick={() => onCultivateWithStrategy('aggressive')}
                    disabled={disabled || spiritStones < 40 || autoCultivating}
                    title="消耗40灵石，高收益高风险，有意外突破可能"
                  >
                    激进
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    variant="outline"
                    onClick={() => onCultivateWithStrategy('insight')}
                    disabled={disabled || autoCultivating || (cultivationCooldown && cultivationCooldown > Date.now()) || false}
                    title="不消耗灵石，极低成功率，可获得顿悟印记"
                  >
                    顿悟
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-8 text-xs"
                    onClick={onCultivate}
                    disabled={disabled || !hasEnoughStones || autoCultivating}
                  >
                    传统{terminology.practice}
                  </Button>
                  <Button
                    className={`h-8 text-xs px-3 ${autoCultivating ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                    variant={autoCultivating ? 'destructive' : 'outline'}
                    onClick={onToggleAutoCultivation}
                    disabled={disabled || !hasEnoughStones}
                  >
                    {autoCultivating ? (
                      <>
                        <Square className="w-3 h-3 mr-1" />
                        停止
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        自动
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-8 text-xs"
                  onClick={onCultivate}
                  disabled={disabled || !hasEnoughStones || autoCultivating}
                >
                  开始{terminology.practice}
                </Button>
                <Button
                  className={`h-8 text-xs px-3 ${autoCultivating ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  variant={autoCultivating ? 'destructive' : 'outline'}
                  onClick={onToggleAutoCultivation}
                  disabled={disabled || !hasEnoughStones}
                >
                  {autoCultivating ? (
                    <>
                      <Square className="w-3 h-3 mr-1" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      自动
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 恢复区域 */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>休生养息，恢复状态</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-game-economy" />
              <span className={hasEnoughStonesForRest ? '' : 'text-game-combat'}>5 {terminology.resource}</span>
            </div>
          </div>
          <Button 
            variant="secondary"
            className="w-full h-8 text-xs" 
            onClick={onRest}
            disabled={disabled || !hasEnoughStonesForRest || !needsRest || autoCultivating}
          >
            <Moon className="w-3 h-3 mr-1" />
            {needsRest ? '恢复状态' : '状态已满'}
          </Button>
        </div>

        {/* 心魔概率警告 - 当有风险时显示 */}
        {mentalState.demonChance > 0 && (
          <div className="border-t pt-2">
            <div className="flex items-center justify-between text-[10px] bg-game-mental/10 rounded px-2 py-1.5">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-game-mental" />
                <span className="text-game-mental">心魔概率</span>
              </div>
              <span className="font-medium text-game-mental">
                {(mentalState.demonChance * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* 渡劫提示区域 - 当达到渡劫等级时显示 */}
        {needsTribulation && !isMaxLevel && (
          <div className="border-2 border-game-tribulation/30 rounded-lg p-2 bg-gradient-to-r from-game-tribulation/10 to-game-combat/10">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-game-tribulation">
                <CloudLightning className="w-3.5 h-3.5" />
                <span>天劫将至</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-game-combat text-game-combat">
                境界瓶颈
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              你的修为已达到瓶颈，需要渡劫才能继续突破。
            </p>
            <Button
              variant="outline"
              className="w-full h-7 text-xs border-game-tribulation text-game-tribulation hover:bg-game-tribulation/10"
              disabled={disabled || autoCultivating || !onTribulation}
              onClick={onTribulation}
            >
              <CloudLightning className="w-3 h-3 mr-1" />
              准备渡劫
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
