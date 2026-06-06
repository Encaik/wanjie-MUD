'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, AlertTriangle, CheckCircle, XCircle, 
  Sparkles, Heart, TrendingUp, Clock
} from 'lucide-react';
import { TribulationConfig, TribulationState, RealmBottleneck } from '@/lib/game/typesExtension';
import { CharacterStats, getFinalStats } from '@/lib/game/types';

interface TribulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bottleneck: RealmBottleneck;
  tribulationState: TribulationState | null;
  stats: CharacterStats;
  onStartTribulation: () => void;
  onExecutePhase: () => void;
  onComplete: (success: boolean) => void;
}

export function TribulationDialog({
  open,
  onOpenChange,
  bottleneck,
  tribulationState,
  stats,
  onStartTribulation,
  onExecutePhase,
  onComplete,
}: TribulationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartTribulation = () => {
    setIsProcessing(true);
    onStartTribulation();
    setTimeout(() => setIsProcessing(false), 500);
  };

  const handleExecutePhase = async () => {
    setIsProcessing(true);
    onExecutePhase();
    // 延迟一下让用户看到效果
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (tribulationState && !tribulationState.inProgress) {
      onComplete(tribulationState.currentPhase >= tribulationState.totalPhases);
    }
    onOpenChange(false);
  };

  // 渲染瓶颈状态
  if (!tribulationState?.inProgress && !tribulationState?.config) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              境界瓶颈
            </DialogTitle>
            <DialogDescription>
              你遇到了修炼路上的重大瓶颈，需要渡劫才能继续突破。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 瓶颈信息 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">瓶颈类型</span>
                <Badge variant="outline" className="border-purple-500 text-purple-600">
                  {bottleneck.type === 'tribulation' ? '渡劫瓶颈' : 
                   bottleneck.type === 'stats' ? '属性瓶颈' : '悟性瓶颈'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">触发等级</span>
                <span className="text-sm">{bottleneck.level}级</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">剩余尝试</span>
                <span className={`text-sm ${bottleneck.attempts >= bottleneck.maxAttempts - 1 ? 'text-red-500' : ''}`}>
                  {bottleneck.maxAttempts - bottleneck.attempts}次
                </span>
              </div>
            </div>

            {/* 渡劫说明 */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4 text-purple-500" />
                <span>渡劫须知</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• 渡劫将面临天劫考验，需要强大的属性支撑</li>
                <li>• 渡劫失败将损失HP和属性，进入虚弱状态</li>
                <li>• 渡劫成功将大幅提升属性，解锁特殊能力</li>
                <li>• 请确保状态良好后再尝试渡劫</li>
              </ul>
            </div>

            {/* 属性预览 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground">体质</span>
                <span className="float-right font-medium">{getFinalStats(stats).体质}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground">灵根</span>
                <span className="float-right font-medium">{getFinalStats(stats).灵根}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground">悟性</span>
                <span className="float-right font-medium">{getFinalStats(stats).悟性}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground">幸运</span>
                <span className="float-right font-medium">{getFinalStats(stats).幸运}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              准备中
            </Button>
            <Button 
              onClick={handleStartTribulation}
              disabled={isProcessing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Zap className="w-4 h-4 mr-1" />
              开始渡劫
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // 渲染渡劫进行中
  if (tribulationState?.inProgress && tribulationState.config) {
    const config = tribulationState.config;
    const progressPercent = (tribulationState.currentPhase / tribulationState.totalPhases) * 100;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
              <span>{config.name}</span>
              <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            </DialogTitle>
            <DialogDescription className="text-center">
              {config.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 进度显示 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>渡劫进度</span>
                <span className="font-medium">
                  第 {tribulationState.currentPhase} / {tribulationState.totalPhases} 阶段
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            {/* 成功率显示 */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  成功概率
                </span>
                <Badge variant={tribulationState.successRate >= 0.7 ? 'default' : 
                               tribulationState.successRate >= 0.4 ? 'secondary' : 'destructive'}>
                  {(tribulationState.successRate * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    tribulationState.successRate >= 0.7 ? 'bg-green-500' : 
                    tribulationState.successRate >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${tribulationState.successRate * 100}%` }}
                />
              </div>
            </div>

            {/* 当前阶段效果 */}
            <div className="text-center py-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                第 {tribulationState.currentPhase} 阶段
              </div>
              <p className="text-sm text-muted-foreground">
                准备迎接天劫考验...
              </p>
            </div>
          </div>

          <DialogFooter className="flex justify-center">
            <Button 
              onClick={handleExecutePhase}
              disabled={isProcessing}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-w-[200px]"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  渡劫中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  迎接考验
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // 渲染渡劫结果
  if (tribulationState && !tribulationState.inProgress && tribulationState.config) {
    const config = tribulationState.config;
    const success = tribulationState.currentPhase >= tribulationState.totalPhases;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              {success ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">渡劫成功！</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">渡劫失败...</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {success ? (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 space-y-3">
                <div className="text-center mb-4">
                  <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-lg font-bold">恭喜突破境界瓶颈！</p>
                </div>
                
                {/* 奖励显示 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    属性提升
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(config.successReward.statBonus as Record<string, number>).map(([stat, value]) => (
                      <div key={stat} className="bg-green-500/20 rounded p-2 flex justify-between">
                        <span className="capitalize">{stat}</span>
                        <span className="text-green-600 font-bold">+{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {config.successReward.specialEffect && (
                  <div className="bg-yellow-500/20 rounded p-2 text-xs">
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      特殊效果：{config.successReward.specialEffect}
                    </span>
                  </div>
                )}

                {config.successReward.title && (
                  <div className="bg-purple-500/20 rounded p-2 text-xs text-center">
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      获得称号：【{config.successReward.title}】
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg p-4 space-y-3">
                <div className="text-center mb-4">
                  <Heart className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-lg font-bold">渡劫失败，损失惨重</p>
                </div>
                
                {/* 惩罚显示 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">受到惩罚：</p>
                  <div className="space-y-1 text-xs">
                    <div className="bg-red-500/20 rounded p-2">
                      生命值损失：{config.failPenalty.hpLoss * 100}%
                    </div>
                    {Object.keys(config.failPenalty.statLoss).length > 0 && (
                      <div className="bg-red-500/20 rounded p-2">
                        属性损失：{Object.entries(config.failPenalty.statLoss)
                          .map(([k, v]) => `${k} -${v}`)
                          .join(', ')}
                      </div>
                    )}
                    <div className="bg-orange-500/20 rounded p-2">
                      虚弱状态：{config.failPenalty.weaknessTurns}回合修炼效率-50%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
