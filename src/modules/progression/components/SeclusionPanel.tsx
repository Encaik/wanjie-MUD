'use client';

import { useState } from 'react';

import { 
  Lock, 
  Sparkles, 
  Coins, 
  Timer, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/overlay/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/overlay/tooltip';
import { 
  SeclusionType, 
  SECLUSION_CONFIGS, 
  SECLUSION_OUTCOMES,
} from '@/modules/progression/logic/seclusion';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import type { WorldType } from '@/core/types';
import type { ItemInstance } from '@/modules/item/types';
import { getCurrencyAmount } from '@/modules/item/logic';


interface SeclusionPanelProps {
  onSeclusion: (type: SeclusionType) => void;
  disabled?: boolean;
  worldType: WorldType;
  items: ItemInstance[];
  level: number;
  // 可选：显示上次闭关结果
  lastOutcome?: string;
}

// 获取灵石数量（新物品系统）
function getSpiritStoneCount(items: ItemInstance[] | undefined): number {
  if (!items) return 0;
  return getCurrencyAmount(items, 'wanjie:common:spirit_stone');
}

// 获取闭关类型的图标
function getSeclusionIcon(type: SeclusionType) {
  switch (type) {
    case 'minor': return <Timer className="w-4 h-4" />;
    case 'major': return <TrendingUp className="w-4 h-4" />;
    case 'legendary': return <Sparkles className="w-4 h-4" />;
    default: return <Timer className="w-4 h-4" />;
  }
}

// 获取闭关类型的颜色
function getSeclusionColor(type: SeclusionType): string {
  switch (type) {
    case 'minor': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-300';
    case 'major': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 border-purple-300';
    case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 border-gray-300';
  }
}

// 获取效果等级的颜色
function getOutcomeColorClass(outcome: string): string {
  switch (outcome) {
    case 'deviation': return 'text-red-600';
    case 'heart_demon': return 'text-orange-600';
    case 'normal': return 'text-blue-600';
    case 'insight': return 'text-green-600';
    case 'enlightenment': return 'text-purple-600';
    case 'harmony': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
}

export function SeclusionPanel({
  onSeclusion,
  disabled,
  worldType,
  items,
  level,
  lastOutcome,
}: SeclusionPanelProps) {
  const [showHelp, setShowHelp] = useState(false);
  const terminology = getTerminology(worldType);
  const spiritStones = getSpiritStoneCount(items);

  // 获取已解锁的闭关类型
  const getUnlockedTypes = (): SeclusionType[] => {
    const types: SeclusionType[] = [];
    if (level >= SECLUSION_CONFIGS.minor.unlockLevel) types.push('minor');
    if (level >= SECLUSION_CONFIGS.major.unlockLevel) types.push('major');
    if (level >= SECLUSION_CONFIGS.legendary.unlockLevel) types.push('legendary');
    return types;
  };

  const unlockedTypes = getUnlockedTypes();
  const hasAnyUnlocked = unlockedTypes.length > 0;

  // 渲染闭关按钮
  const renderSeclusionButton = (type: SeclusionType) => {
    const config = SECLUSION_CONFIGS[type];
    const isUnlocked = level >= config.unlockLevel;
    const cost = config.baseCost * config.costMultiplier;
    const canAfford = spiritStones >= cost;
    const isDisabled = disabled || !canAfford;

    if (!isUnlocked) {
      return (
        <TooltipProvider key={type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-2 opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {config.unlockLevel}级解锁
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{config.description}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">达到{config.unlockLevel}级后解锁</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        key={type}
        variant="outline"
        className={`h-auto p-2 text-left border-2 hover:ring-2 hover:ring-primary/50 transition-all ${
          canAfford ? getSeclusionColor(type) : 'opacity-60'
        }`}
        onClick={() => onSeclusion(type)}
        disabled={isDisabled}
      >
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {getSeclusionIcon(type)}
              <span className="text-xs font-medium">{config.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {config.multiplier}倍
            </Badge>
          </div>
          
          <p className="text-[10px] opacity-80">{config.description}</p>
          
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-current/20">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3" />
              <span className={canAfford ? '' : 'text-red-500'}>
                {cost} {terminology.resource}
              </span>
            </div>
            <span className="opacity-60">耗时{config.duration}天</span>
          </div>
        </div>
      </Button>
    );
  };

  // 如果没有解锁任何闭关类型，显示提示
  if (!hasAnyUnlocked) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            闭关修炼
            <span className="text-[10px] text-muted-foreground ml-auto">
              {SECLUSION_CONFIGS.minor.unlockLevel}级解锁
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-xs text-muted-foreground text-center py-3">
            <Lock className="w-4 h-4 mx-auto mb-1 opacity-50" />
            <p>达到{SECLUSION_CONFIGS.minor.unlockLevel}级后解锁闭关修炼</p>
            <p className="text-[10px] mt-1">可大幅提升修炼效率，但有随机效果</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            闭关修炼
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="ml-auto p-1 hover:bg-muted rounded-full transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 space-y-2">
          {/* 上次闭关结果显示 */}
          {lastOutcome && (
            <div className="bg-muted/50 rounded px-2 py-1.5 text-[10px] text-center">
              <span className="text-muted-foreground">上次闭关效果: </span>
              <span className={getOutcomeColorClass(lastOutcome)}>
                {SECLUSION_OUTCOMES.find(o => o.outcome === lastOutcome)?.name || '未知'}
              </span>
            </div>
          )}

          {/* 闭关选项 */}
          <div className="space-y-1.5">
            {(['minor', 'major', 'legendary'] as SeclusionType[]).map(renderSeclusionButton)}
          </div>

          {/* 提示 */}
          <div className="text-[10px] text-muted-foreground flex items-start gap-1 pt-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>
              闭关效果随机，可能出现走火入魔、心魔入侵等情况。
              也有机会触发顿悟、天人交感等特殊事件。
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 帮助对话框 */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              闭关修炼说明
            </DialogTitle>
            <DialogDescription className="text-xs">
              消耗更多资源进行深度修炼，获得多倍经验收益
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 text-xs">
            {/* 闭关类型 */}
            <div className="space-y-1.5">
              <h4 className="font-medium">闭关类型</h4>
              {Object.values(SECLUSION_CONFIGS).map(config => (
                <div key={config.type} className="flex items-center justify-between text-[10px] bg-muted/50 rounded px-2 py-1">
                  <span className="font-medium">{config.name}</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{config.multiplier}倍</span>
                    <span>{config.unlockLevel}级解锁</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 闭关效果 */}
            <div className="space-y-1.5">
              <h4 className="font-medium">闭关效果</h4>
              <div className="space-y-1">
                {SECLUSION_OUTCOMES.map(outcome => (
                  <div 
                    key={outcome.outcome} 
                    className={`flex items-center justify-between text-[10px] px-2 py-1 rounded ${
                      outcome.isSpecial ? 'bg-yellow-500/10' : 'bg-muted/30'
                    }`}
                  >
                    <span className={getOutcomeColorClass(outcome.outcome)}>
                      {outcome.name}
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{outcome.probability}%</span>
                      <span>×{outcome.expMultiplier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 计算公式 */}
            <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2">
              <p className="font-medium mb-1">经验计算公式：</p>
              <p>基础经验 × 闭关倍数 × 效果倍数</p>
              <p className="mt-1">例：大闭关 + 天人交感 = 100 × 3.0 = 300倍</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
