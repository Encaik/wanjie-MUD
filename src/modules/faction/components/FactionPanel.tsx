'use client';

import { useState, useEffect } from 'react';

import { 
  Building2, 
  Users, 
  ScrollText, 
  Quote, 
  CheckCircle2,
  AlertCircle,
  LogOut,
  Shield,
  Star,
  Gift,
  Clock,
  Coins,
  RefreshCw,
  Plus,
  Send,
  Target,
  Zap,
  Sun,
  TrendingUp,
  Crown,
  Compass,
  Sparkles,
  AlertTriangle,
  Swords,
  Package,
  Timer,
  ChevronRight,
  Flame,
  Gem,
  FlaskConical,
  Hammer,
} from 'lucide-react';

import { RankDetailDialog, ReputationDetailDialog } from '@/views/game';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Progress } from '@/shared/ui/progress';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { 
  getFactionsByWorld, 
  getFactionById, 
  calculateFactionBonuses,
} from '@/modules/faction/data/factionData';
import { WorldType, Faction, FactionTypeNames, WorldFaction } from '@/shared/lib/types';
import { 
  TaskRoundState, 
  CommissionState, 
  CommissionProgress,
  FactionProgress,
  ReputationLevel,
} from '@/shared/lib/types';
import { 
  REPUTATION_LEVELS,
  DAILY_TASK_ROUND,
  WEEKLY_TASK_ROUND,
  getReputationLevel,
  getRanksByFactionType,
  FactionRankConfig,
  getTaskConfig,
  FactionTaskConfig,
  COMMISSION_QUALITY_CONFIG,
  CommissionQuality,
} from '@/modules/faction/data/factionProgressData';
import { checkRankPromotion } from '@/core/engine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Slider } from '@/shared/ui/slider';


interface FactionPanelProps {
  worldType: WorldType;
  worldFactions: WorldFaction[];
  currentFactionId: string | null;
  factionProgress?: FactionProgress | null;
  contribution?: number;
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: () => void;
  // 任务轮次系统（V2）
  onAcceptTask?: (taskId: string, roundType: 'daily' | 'weekly') => { success: boolean; message: string };
  onSubmitTask?: (taskId: string, roundType: 'daily' | 'weekly') => { success: boolean; message: string };
  // 委托系统（V2）
  onAcceptCommission?: (commissionId: string) => { success: boolean; message: string };
  onSubmitCommission?: (commissionId: string) => { success: boolean; message: string };
  onRefreshCommissions?: (useFree: boolean) => { success: boolean; message: string };
  // 其他操作
  onClaimDailySalary?: () => { success: boolean; amount: number };
  onPromoteRank?: () => { success: boolean; message: string };
  spiritStoneCount?: number;
  onDonate?: (amount: number) => { success: boolean; message: string };
  playerLevel?: number;
  // 废弃属性（保持向后兼容）
  onRefreshTasks?: () => { success: boolean; message: string };
  currentEvent?: unknown;
  onExplore?: () => void;
  onChoose?: (index: number) => void;
  lastExploreTime?: number;
}

// 势力类型图标
const factionTypeIcons: Record<string, React.ReactNode> = {
  sect: <Shield className="w-3.5 h-3.5" />,
  empire: <Building2 className="w-3.5 h-3.5" />,
  guild: <Users className="w-3.5 h-3.5" />,
  alliance: <Users className="w-3.5 h-3.5" />,
  academy: <ScrollText className="w-3.5 h-3.5" />,
  clan: <Users className="w-3.5 h-3.5" />,
};

// 委托品质配置
const commissionQualityConfig: Record<CommissionQuality, { 
  color: string; 
  bg: string; 
  border: string; 
  icon: React.ReactNode;
  label: string;
}> = {
  common: { 
    color: 'text-gray-500', 
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/30',
    icon: <Package className="w-2.5 h-2.5" />,
    label: '普通'
  },
  elite: { 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30',
    icon: <Swords className="w-2.5 h-2.5" />,
    label: '精英'
  },
  rare: { 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30',
    icon: <Gem className="w-2.5 h-2.5" />,
    label: '稀有'
  },
  legendary: { 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30',
    icon: <Sparkles className="w-2.5 h-2.5" />,
    label: '传说'
  },
};

// 任务难度颜色
const difficultyColors: Record<string, string> = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/30',
  normal: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  hard: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  nightmare: 'text-red-500 bg-red-500/10 border-red-500/30',
};

export function FactionPanel({
  worldType,
  worldFactions,
  currentFactionId,
  factionProgress,
  contribution = 0,
  onJoinFaction,
  onLeaveFaction,
  onAcceptTask,
  onSubmitTask,
  onAcceptCommission,
  onSubmitCommission,
  onRefreshCommissions,
  onClaimDailySalary,
  onPromoteRank,
  spiritStoneCount = 0,
  onDonate,
  playerLevel = 1,
}: FactionPanelProps) {
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [donateAmount, setDonateAmount] = useState(100);
  const [activeTab, setActiveTab] = useState<'tasks' | 'commissions'>('tasks');
  const [, setForceUpdate] = useState(0);
  
  // 每秒更新倒计时显示
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 获取当前世界的势力列表
  const allFactions = getFactionsByWorld(worldType);
  const factions = worldFactions.length > 0 
    ? worldFactions.map(wf => allFactions.find(f => f.id === wf.id)).filter(Boolean) as Faction[]
    : allFactions;
  const currentFaction = currentFactionId ? getFactionById(currentFactionId) : null;
  
  // 获取当前职位信息
  const getCurrentRankInfo = (): FactionRankConfig | null => {
    if (!factionProgress || !currentFaction) return null;
    const ranks = getRanksByFactionType(currentFaction.type);
    return ranks.find(r => r.id === factionProgress.rank) || ranks[0];
  };
  
  // 检查是否可以晋升
  const checkPromotion = (): { canPromote: boolean; nextRank: FactionRankConfig | null } => {
    if (!factionProgress || !currentFaction) return { canPromote: false, nextRank: null };
    const result = checkRankPromotion(factionProgress, currentFaction.type);
    if (result.canPromote && result.newRank) {
      const ranks = getRanksByFactionType(currentFaction.type);
      const nextRank = ranks.find(r => r.id === result.newRank);
      return { canPromote: true, nextRank: nextRank || null };
    }
    return { canPromote: false, nextRank: null };
  };
  
  // 获取势力加成显示
  // 支持传入 faction 参数，用于显示未加入势力的潜在加成
  const getFactionBonusesDisplay = (faction?: Faction | null): { label: string; value: number; icon: React.ReactNode }[] => {
    const targetFaction = faction || currentFaction;
    if (!targetFaction) return [];
    
    const bonuses = calculateFactionBonuses(targetFaction.id);
    const result: { label: string; value: number; icon: React.ReactNode }[] = [];
    
    // 标签映射（支持更多加成类型）
    const labelMap: Record<string, { label: string; icon: React.ReactNode }> = {
      // 战斗属性
      attack: { label: '攻击', icon: <Swords className="w-2.5 h-2.5" /> },
      defense: { label: '防御', icon: <Shield className="w-2.5 h-2.5" /> },
      maxHp: { label: '生命', icon: <Flame className="w-2.5 h-2.5" /> },
      maxMp: { label: '法力', icon: <Sparkles className="w-2.5 h-2.5" /> },
      evasion: { label: '闪避', icon: <Zap className="w-2.5 h-2.5" /> },
      critChance: { label: '暴击', icon: <Star className="w-2.5 h-2.5" /> },
      critDamage: { label: '暴伤', icon: <Star className="w-2.5 h-2.5" /> },
      speed: { label: '速度', icon: <Zap className="w-2.5 h-2.5" /> },
      damageReduction: { label: '减伤', icon: <Shield className="w-2.5 h-2.5" /> },
      hpRegen: { label: '回血', icon: <Flame className="w-2.5 h-2.5" /> },
      mpRegen: { label: '回蓝', icon: <Sparkles className="w-2.5 h-2.5" /> },
      strength: { label: '力量', icon: <Swords className="w-2.5 h-2.5" /> },
      holyDamage: { label: '神圣', icon: <Sparkles className="w-2.5 h-2.5" /> },
      equipmentBonus: { label: '装备', icon: <Shield className="w-2.5 h-2.5" /> },
      startingGold: { label: '初始灵石', icon: <Coins className="w-2.5 h-2.5" /> },
      // 修炼相关
      cultivationSpeed: { label: '修炼', icon: <Flame className="w-2.5 h-2.5" /> },
      breakthroughChance: { label: '突破', icon: <TrendingUp className="w-2.5 h-2.5" /> },
      breakthroughHp: { label: '突破生命', icon: <Flame className="w-2.5 h-2.5" /> },
      mentalStability: { label: '心境', icon: <Sparkles className="w-2.5 h-2.5" /> },
      magicMastery: { label: '魔法精通', icon: <Sparkles className="w-2.5 h-2.5" /> },
      // 资源相关
      dropRateBonus: { label: '掉落', icon: <Package className="w-2.5 h-2.5" /> },
      expBonus: { label: '经验', icon: <TrendingUp className="w-2.5 h-2.5" /> },
      shopDiscount: { label: '折扣', icon: <Coins className="w-2.5 h-2.5" /> },
      rewardBonus: { label: '奖励', icon: <Star className="w-2.5 h-2.5" /> },
      alchemySuccess: { label: '炼丹', icon: <FlaskConical className="w-2.5 h-2.5" /> },
      pillQuality: { label: '丹药品质', icon: <FlaskConical className="w-2.5 h-2.5" /> },
      pillDiscount: { label: '丹药折扣', icon: <Coins className="w-2.5 h-2.5" /> },
      pillEffect: { label: '丹药效果', icon: <FlaskConical className="w-2.5 h-2.5" /> },
      forgeSuccess: { label: '锻造', icon: <Hammer className="w-2.5 h-2.5" /> },
      equipQuality: { label: '装备品质', icon: <Shield className="w-2.5 h-2.5" /> },
      researchSpeed: { label: '研究', icon: <TrendingUp className="w-2.5 h-2.5" /> },
      craftingSuccess: { label: '制造', icon: <Hammer className="w-2.5 h-2.5" /> },
      creditBonus: { label: '信用', icon: <Coins className="w-2.5 h-2.5" /> },
      salary: { label: '俸禄', icon: <Coins className="w-2.5 h-2.5" /> },
      taskRewardBonus: { label: '任务奖励', icon: <Star className="w-2.5 h-2.5" /> },
      explorationBonus: { label: '探索', icon: <Compass className="w-2.5 h-2.5" /> },
      researchBonus: { label: '研究效率', icon: <TrendingUp className="w-2.5 h-2.5" /> },
      spellDiscount: { label: '法术折扣', icon: <Coins className="w-2.5 h-2.5" /> },
      tradeBonus: { label: '交易', icon: <Coins className="w-2.5 h-2.5" /> },
      infoBonus: { label: '情报', icon: <ScrollText className="w-2.5 h-2.5" /> },
      treasureFind: { label: '宝物', icon: <Star className="w-2.5 h-2.5" /> },
      amplifierBonus: { label: '增幅', icon: <Sparkles className="w-2.5 h-2.5" /> },
      // 技能加成
      skillBonus: { label: '技能', icon: <Sparkles className="w-2.5 h-2.5" /> },
      allSkillBonus: { label: '全技能', icon: <Sparkles className="w-2.5 h-2.5" /> },
      abilityDamage: { label: '异能', icon: <Sparkles className="w-2.5 h-2.5" /> },
      damageBonus: { label: '伤害', icon: <Swords className="w-2.5 h-2.5" /> },
      // 特殊能力
      firstStrikeChance: { label: '先手', icon: <Zap className="w-2.5 h-2.5" /> },
      counterChance: { label: '反击', icon: <Swords className="w-2.5 h-2.5" /> },
      counterDamage: { label: '反击伤害', icon: <Swords className="w-2.5 h-2.5" /> },
      debuffChance: { label: '减益', icon: <Shield className="w-2.5 h-2.5" /> },
      attackDebuff: { label: '攻击削弱', icon: <Swords className="w-2.5 h-2.5" /> },
      battleStartShield: { label: '开局护盾', icon: <Shield className="w-2.5 h-2.5" /> },
      reviveOnce: { label: '复活', icon: <Flame className="w-2.5 h-2.5" /> },
      natureHeal: { label: '自然恢复', icon: <Flame className="w-2.5 h-2.5" /> },
      autoDodge: { label: '自动闪避', icon: <Zap className="w-2.5 h-2.5" /> },
      holyHeal: { label: '治疗', icon: <Flame className="w-2.5 h-2.5" /> },
      damage: { label: '伤害', icon: <Swords className="w-2.5 h-2.5" /> },
    };
    
    for (const [key, value] of Object.entries(bonuses)) {
      if (value > 0) {
        const mapping = labelMap[key];
        if (mapping) {
          result.push({ label: mapping.label, value, icon: mapping.icon });
        } else {
          // 未映射的属性，使用原始key
          result.push({ label: key, value, icon: <Sparkles className="w-2.5 h-2.5" /> });
        }
      }
    }
    
    return result;
  };
  
  const currentRankInfo = getCurrentRankInfo();
  const promotionInfo = checkPromotion();
  const factionBonuses = getFactionBonusesDisplay();
  
  // 处理加入势力
  const handleJoinFaction = (faction: Faction) => {
    setSelectedFaction(faction);
    setShowJoinDialog(true);
  };
  
  // 确认加入势力
  const confirmJoinFaction = () => {
    if (selectedFaction) {
      onJoinFaction(selectedFaction.id);
    }
    setShowJoinDialog(false);
    setSelectedFaction(null);
  };
  
  // 处理退出势力
  const handleLeaveFaction = () => {
    setShowLeaveDialog(true);
  };
  
  // 确认退出势力
  const confirmLeaveFaction = () => {
    onLeaveFaction();
    setShowLeaveDialog(false);
  };
  
  // 处理捐献
  const handleDonate = () => {
    if (onDonate && donateAmount > 0) {
      const result = onDonate(donateAmount);
      if (result.success) {
        setShowDonateDialog(false);
        setDonateAmount(100);
      }
    }
  };

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 渲染任务轮次状态
  const renderTaskRoundStatus = (round: TaskRoundState, roundType: 'daily' | 'weekly') => {
    const config = roundType === 'daily' ? DAILY_TASK_ROUND : WEEKLY_TASK_ROUND;
    // 确保 roundLimit 有有效值（兼容旧存档）
    const roundLimit = round.roundLimit || config.maxTasksPerRound;
    const isCooldownActive = round.roundCooldownEnd && Date.now() < round.roundCooldownEnd;
    const cooldownRemaining = isCooldownActive ? (round.roundCooldownEnd || 0) - Date.now() : 0;
    
    return (
      <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-xs font-medium">
            {roundType === 'daily' ? <Sun className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>{roundType === 'daily' ? '日常轮次' : '周常轮次'}</span>
          </div>
          <Badge variant="outline" className="text-[9px]">
            {round.completedInRound}/{roundLimit}
          </Badge>
        </div>
        
        <Progress 
          value={(round.completedInRound / roundLimit) * 100} 
          className="h-1.5 mb-1"
        />
        
        {isCooldownActive ? (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
            <Timer className="w-2.5 h-2.5" />
            <span>轮次冷却: {formatTime(cooldownRemaining)}</span>
          </div>
        ) : round.completedInRound >= roundLimit ? (
          <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>本轮已完成，等待重置</span>
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground">
            还可完成 {roundLimit - round.completedInRound} 个任务
          </div>
        )}
      </div>
    );
  };

  // 渲染任务卡片（V2）
  const renderTaskCard = (taskId: string, round: TaskRoundState, roundType: 'daily' | 'weekly') => {
    const taskConfig = getTaskConfig(taskId);
    if (!taskConfig) return null;
    
    const progress = round.acceptedTasks[taskId];
    const isAccepted = progress?.accepted;
    const isCompleted = progress?.completed;
    const isSubmitted = progress?.submitted;
    const currentProgress = progress?.current || 0;
    const target = progress?.target || taskConfig.requirements[0]?.count || 1;
    
    // 检查轮次是否可用
    // 确保 roundLimit 有有效值（兼容旧存档）
    const roundLimit = round.roundLimit || (roundType === 'daily' ? 5 : 10);
    const isRoundCooldown = round.roundCooldownEnd && Date.now() < round.roundCooldownEnd;
    const isRoundFull = round.completedInRound >= roundLimit;
    const canAct = !isRoundCooldown && !isRoundFull;
    
    return (
      <div 
        key={taskId}
        className={`p-2 rounded-lg border transition-all ${
          isSubmitted 
            ? 'opacity-50 bg-muted/20 border-border' 
            : isCompleted
            ? 'bg-green-500/5 border-green-500/30'
            : isAccepted
            ? 'bg-primary/5 border-primary/30'
            : 'bg-card border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-medium">{taskConfig.name}</span>
              <Badge variant="outline" className={`text-[9px] ${difficultyColors[taskConfig.difficulty]}`}>
                {taskConfig.difficulty === 'easy' ? '简单' : taskConfig.difficulty === 'normal' ? '普通' : taskConfig.difficulty === 'hard' ? '困难' : '噩梦'}
              </Badge>
              <Badge variant="outline" className="text-[9px] text-muted-foreground">
                {taskConfig.type === 'daily' ? '日常' : '周常'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {taskConfig.description}
            </p>
            
            {/* 进度条 */}
            {isAccepted && !isSubmitted && (
              <div className="mt-1">
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <span className="text-muted-foreground">{taskConfig.requirements[0]?.description}</span>
                  <span className={isCompleted ? 'text-green-500' : ''}>
                    {currentProgress}/{target}
                  </span>
                </div>
                <Progress value={(currentProgress / target) * 100} className="h-1" />
              </div>
            )}
            
            {/* 奖励显示 */}
            <div className="flex items-center gap-2 mt-1 text-[9px]">
              <span className="text-yellow-500 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5" />
                {taskConfig.rewards.reputation}声望
              </span>
              <span className="text-amber-500 flex items-center gap-0.5">
                <Coins className="w-2.5 h-2.5" />
                {taskConfig.rewards.contribution}贡献
              </span>
              {taskConfig.rewards.experience && (
                <span className="text-blue-500 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />
                  {taskConfig.rewards.experience}修为
                </span>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="shrink-0">
            {!isAccepted && !isSubmitted && (
              <Button
                variant="outline"
                size="sm"
                className="h-5 text-[10px] px-1.5"
                onClick={() => onAcceptTask?.(taskId, roundType)}
                disabled={!onAcceptTask || !canAct}
              >
                <Plus className="w-2.5 h-2.5 mr-0.5" />
                接取
              </Button>
            )}
            {isAccepted && isCompleted && !isSubmitted && (
              <Button
                variant="default"
                size="sm"
                className="h-5 text-[10px] px-1.5 bg-green-500 hover:bg-green-600"
                onClick={() => onSubmitTask?.(taskId, roundType)}
                disabled={!onSubmitTask}
              >
                <Send className="w-2.5 h-2.5 mr-0.5" />
                提交
              </Button>
            )}
            {isSubmitted && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {isAccepted && !isCompleted && (
              <Badge variant="outline" className="text-[9px] text-primary border-primary">
                进行中
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染委托卡片
  const renderCommissionCard = (commissionId: string, progress: CommissionProgress) => {
    // 从 commissionId 解析品质信息（简化处理）
    const quality: CommissionQuality = commissionId.includes('legendary') ? 'legendary' 
      : commissionId.includes('rare') ? 'rare' 
      : commissionId.includes('elite') ? 'elite' 
      : 'common';
    
    const config = commissionQualityConfig[quality];
    const isAccepted = progress.accepted;
    const isCompleted = progress.completed;
    const isSubmitted = progress.submitted;
    const currentProgress = progress.current || 0;
    const target = progress.target || 1;
    const isExpired = progress.expiresAt && Date.now() > progress.expiresAt;
    
    // 获取品质奖励配置
    const rewardConfig = COMMISSION_QUALITY_CONFIG[quality];
    
    return (
      <div 
        key={commissionId}
        className={`p-2 rounded-lg border transition-all ${
          isSubmitted 
            ? 'opacity-50 bg-muted/20 border-border' 
            : isExpired && !isSubmitted
            ? 'opacity-50 bg-red-500/5 border-red-500/30'
            : isCompleted
            ? 'bg-green-500/5 border-green-500/30'
            : isAccepted
            ? 'bg-primary/5 border-primary/30'
            : 'bg-card border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant="outline" className={`text-[9px] ${config.bg} ${config.color} ${config.border}`}>
                {config.icon}
                <span className="ml-0.5">{config.label}</span>
              </Badge>
              <span className="text-xs font-medium">委托任务</span>
            </div>
            
            {/* 进度条 */}
            {isAccepted && !isSubmitted && (
              <div className="mt-1">
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <span className="text-muted-foreground">任务进度</span>
                  <span className={isCompleted ? 'text-green-500' : ''}>
                    {currentProgress}/{target}
                  </span>
                </div>
                <Progress value={(currentProgress / target) * 100} className="h-1" />
              </div>
            )}
            
            {/* 奖励显示 */}
            <div className="flex items-center gap-2 mt-1 text-[9px]">
              <span className="text-yellow-500 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5" />
                +{rewardConfig.reputationBase}声望
              </span>
              <span className="text-amber-500 flex items-center gap-0.5">
                <Coins className="w-2.5 h-2.5" />
                +{rewardConfig.contributionBase}贡献
              </span>
            </div>
            
            {/* 过期时间 */}
            {progress.expiresAt && !isSubmitted && !isExpired && (
              <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-0.5">
                <Timer className="w-2 h-2" />
                剩余: {formatTime(progress.expiresAt - Date.now())}
              </div>
            )}
            
            {isExpired && !isSubmitted && (
              <div className="text-[9px] text-red-500 mt-0.5 flex items-center gap-0.5">
                <AlertTriangle className="w-2 h-2" />
                已过期
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="shrink-0">
            {!isAccepted && !isSubmitted && !isExpired && (
              <Button
                variant="outline"
                size="sm"
                className="h-5 text-[10px] px-1.5"
                onClick={() => onAcceptCommission?.(commissionId)}
                disabled={!onAcceptCommission}
              >
                <Plus className="w-2.5 h-2.5 mr-0.5" />
                接取
              </Button>
            )}
            {isAccepted && isCompleted && !isSubmitted && !isExpired && (
              <Button
                variant="default"
                size="sm"
                className="h-5 text-[10px] px-1.5 bg-green-500 hover:bg-green-600"
                onClick={() => onSubmitCommission?.(commissionId)}
                disabled={!onSubmitCommission}
              >
                <Send className="w-2.5 h-2.5 mr-0.5" />
                提交
              </Button>
            )}
            {isSubmitted && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {isAccepted && !isCompleted && !isExpired && (
              <Badge variant="outline" className="text-[9px] text-primary border-primary">
                进行中
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 pt-2 shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-primary" />
          势力
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden pt-0 pb-2">
        {/* 当前势力信息 */}
        {currentFaction ? (
          <>
            <div className="shrink-0 p-2 rounded-lg border bg-primary/5 border-primary/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {factionTypeIcons[currentFaction.type]}
                  <span className="font-medium text-primary text-sm">{currentFaction.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {FactionTypeNames[currentFaction.type]}
                </Badge>
              </div>
              
              {/* 势力特性（加成） */}
              {factionBonuses.length > 0 && (
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-2">
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mb-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span className="font-medium">势力特性</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {factionBonuses.map((bonus, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[9px] h-4 cursor-help bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                            {bonus.icon}
                            <span className="ml-0.5">{bonus.label} +{bonus.value}%</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {currentFaction.name} 提供的 {bonus.label} 加成
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 职位面板 */}
              {currentRankInfo && (
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">职位</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {currentRankInfo.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mb-1.5">
                    {currentRankInfo.description}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {currentRankInfo.benefits.map((benefit, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[9px] h-4 cursor-help bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400">
                            {benefit.type === 'discount' && `${benefit.value}%折扣`}
                            {benefit.type === 'salary' && `${benefit.value}灵石`}
                            {benefit.type === 'access' && '特权'}
                            {benefit.type === 'skill' && '技能'}
                            {benefit.type === 'special' && '特殊'}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {benefit.description}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  {factionProgress && (
                    <div className="mt-2">
                      <RankDetailDialog
                        factionType={currentFaction.type}
                        currentRank={factionProgress.rank}
                        currentReputation={factionProgress.reputation}
                        onPromote={onPromoteRank ? () => onPromoteRank() : undefined}
                        trigger={
                          <Button variant="outline" size="sm" className="w-full h-5 text-[10px]">
                            <Crown className="w-2.5 h-2.5 mr-1" />
                            职位详情
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* 声望和贡献点 */}
              {factionProgress && (
                <div className="flex gap-2 mb-1.5">
                  <ReputationDetailDialog
                    currentReputation={factionProgress.reputation}
                    trigger={
                      <div className="flex-1 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1 text-[10px]">
                            <Star className="w-2.5 h-2.5 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400">声望</span>
                          </div>
                          <span className={`text-xs font-bold ${REPUTATION_LEVELS[getReputationLevel(factionProgress.reputation)].color}`}>
                            {REPUTATION_LEVELS[getReputationLevel(factionProgress.reputation)].name}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          当前: {factionProgress.reputation} 点
                        </div>
                      </div>
                    }
                  />
                  <div className="flex-1 p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-400">
                        <Coins className="w-2.5 h-2.5" />
                        <span>贡献</span>
                      </div>
                      <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                        {contribution}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 操作按钮行 */}
              <div className="flex gap-1.5 flex-wrap">
                {onDonate && spiritStoneCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-6 text-[10px] min-w-[80px]"
                    onClick={() => setShowDonateDialog(true)}
                  >
                    <Coins className="w-2.5 h-2.5 mr-1" />
                    捐献
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-muted-foreground"
                  onClick={handleLeaveFaction}
                >
                  <LogOut className="w-2.5 h-2.5 mr-0.5" />
                  退出
                </Button>
              </div>
            </div>
            
            {/* 任务/委托 Tab 区域 */}
            <div className="flex-1 min-h-0 mt-1.5">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tasks' | 'commissions')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 h-6 shrink-0">
                  <TabsTrigger value="tasks" className="text-[10px]">
                    <ScrollText className="w-2.5 h-2.5 mr-1" />
                    任务轮次
                  </TabsTrigger>
                  <TabsTrigger value="commissions" className="text-[10px]">
                    <Compass className="w-2.5 h-2.5 mr-1" />
                    势力委托
                  </TabsTrigger>
                </TabsList>
                
                {/* 任务轮次 Tab */}
                <TabsContent value="tasks" className="flex-1 min-h-0 mt-1.5">
                  {factionProgress && (
                    <ScrollArea className="h-full">
                      <div className="space-y-1.5 pr-1">
                        {/* 日常轮次状态 */}
                        {renderTaskRoundStatus(factionProgress.dailyRound, 'daily')}
                        
                        {/* 日常任务列表 */}
                        <div className="space-y-1">
                          {/* 已接取的日常任务 */}
                          {Object.entries(factionProgress.dailyRound.acceptedTasks)
                            .filter(([_, p]) => p.accepted && !p.submitted)
                            .map(([taskId, progress]) => 
                              renderTaskCard(taskId, factionProgress.dailyRound, 'daily')
                            )
                          }
                          {/* 可接取的日常任务 */}
                          {factionProgress.dailyRound.availableTasks.map(taskId => 
                            renderTaskCard(taskId, factionProgress.dailyRound, 'daily')
                          )}
                        </div>
                        
                        {/* 周常轮次状态 */}
                        <div className="mt-3">
                          {renderTaskRoundStatus(factionProgress.weeklyRound, 'weekly')}
                        </div>
                        
                        {/* 周常任务列表 */}
                        <div className="space-y-1">
                          {/* 已接取的周常任务 */}
                          {Object.entries(factionProgress.weeklyRound.acceptedTasks)
                            .filter(([_, p]) => p.accepted && !p.submitted)
                            .map(([taskId, progress]) => 
                              renderTaskCard(taskId, factionProgress.weeklyRound, 'weekly')
                            )
                          }
                          {/* 可接取的周常任务 */}
                          {factionProgress.weeklyRound.availableTasks.map(taskId => 
                            renderTaskCard(taskId, factionProgress.weeklyRound, 'weekly')
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                {/* 委托 Tab */}
                <TabsContent value="commissions" className="flex-1 min-h-0 mt-1.5">
                  {factionProgress && (
                    <ScrollArea className="h-full">
                      <div className="space-y-1.5 pr-1">
                        {/* 委托状态 */}
                        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 text-xs font-medium">
                              <Compass className="w-3 h-3" />
                              <span>今日委托</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                已完成: {factionProgress.commissions.todayCompleted}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                刷新: {factionProgress.commissions.dailyFreeRefresh - factionProgress.commissions.todayRefreshUsed}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 刷新按钮 */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-6 text-[10px] mb-2"
                          onClick={() => onRefreshCommissions?.(true)}
                          disabled={!onRefreshCommissions || factionProgress.commissions.todayRefreshUsed >= factionProgress.commissions.dailyFreeRefresh}
                        >
                          <RefreshCw className="w-2.5 h-2.5 mr-1" />
                          刷新委托 ({factionProgress.commissions.dailyFreeRefresh - factionProgress.commissions.todayRefreshUsed}次免费)
                        </Button>
                        
                        {/* 委托列表 */}
                        <div className="space-y-1">
                          {Object.entries(factionProgress.commissions.commissions).map(([commissionId, progress]) => 
                            renderCommissionCard(commissionId, progress)
                          )}
                          
                          {Object.keys(factionProgress.commissions.commissions).length === 0 && (
                            <div className="text-center text-muted-foreground text-xs py-4">
                              <Compass className="w-6 h-6 mx-auto mb-1 opacity-50" />
                              <p>暂无委托</p>
                              <p className="text-[10px]">点击刷新获取新委托</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="shrink-0 p-3 rounded-lg border border-dashed border-muted-foreground/30 text-center mb-2">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                加入势力获取任务和奖励
              </p>
            </div>
            
            {/* 势力列表 */}
            <div className="flex-1 min-h-0">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                可选势力
              </div>
              <ScrollArea className="h-full">
                <div className="space-y-1.5 pr-1">
                  {factions.map((faction) => {
                    const potentialBonuses = getFactionBonusesDisplay(faction);
                    return (
                    <div
                      key={faction.id}
                      className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all"
                      onClick={() => handleJoinFaction(faction)}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          {factionTypeIcons[faction.type]}
                          <span className="text-xs font-medium">{faction.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px]">
                          {FactionTypeNames[faction.type]}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">
                        {faction.description}
                      </p>
                      {/* 显示势力特性（潜在加成） */}
                      {potentialBonuses.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2" />
                            特性:
                          </span>
                          {potentialBonuses.slice(0, 4).map((bonus, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="text-[10px] h-3.5 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                            >
                              {bonus.icon}
                              <span className="ml-0.5">{bonus.label}+{bonus.value}%</span>
                            </Badge>
                          ))}
                          {potentialBonuses.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{potentialBonuses.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* 加入势力确认对话框 */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-primary" />
              加入势力
            </DialogTitle>
            <DialogDescription className="text-xs">
              确定要加入「{selectedFaction?.name}」吗？
            </DialogDescription>
          </DialogHeader>
          {selectedFaction && (
            <div className="space-y-2 py-2">
              <p className="text-xs text-muted-foreground">
                {selectedFaction.description}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Quote className="w-2.5 h-2.5" />
                <span className="italic">{selectedFaction.motto}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowJoinDialog(false)}>
              取消
            </Button>
            <Button size="sm" onClick={confirmJoinFaction}>
              确认加入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 捐献对话框 */}
      <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-primary" />
              捐献灵石
            </DialogTitle>
            <DialogDescription className="text-xs">
              捐献灵石可以获得贡献点（1灵石 = 1贡献点）
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">当前灵石:</span>
              <span className="font-medium">{spiritStoneCount}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">捐献数量:</span>
                <span className="font-medium text-primary">{donateAmount}</span>
              </div>
              <Slider
                value={[donateAmount]}
                onValueChange={(value) => setDonateAmount(value[0])}
                max={Math.min(spiritStoneCount, 10000)}
                min={10}
                step={10}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-6 text-[10px]"
                  onClick={() => setDonateAmount(100)}
                >
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-6 text-[10px]"
                  onClick={() => setDonateAmount(500)}
                >
                  500
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-6 text-[10px]"
                  onClick={() => setDonateAmount(Math.min(spiritStoneCount, 1000))}
                >
                  1000
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-6 text-[10px]"
                  onClick={() => setDonateAmount(Math.min(spiritStoneCount, 10000))}
                >
                  最大
                </Button>
              </div>
            </div>
            <div className="p-2 rounded bg-primary/5 text-[10px] text-muted-foreground">
              可获得贡献点: <span className="font-medium text-primary">{donateAmount}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDonateDialog(false)}>
              取消
            </Button>
            <Button 
              size="sm" 
              onClick={handleDonate}
              disabled={donateAmount <= 0 || donateAmount > spiritStoneCount}
            >
              确认捐献
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
