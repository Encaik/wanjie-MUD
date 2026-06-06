'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Heart, Brain, Sparkles, AlertTriangle, 
  CheckCircle, XCircle, TrendingUp, TrendingDown,
  Shield, Zap
} from 'lucide-react';
import { MentalState, DemonEncounter, DemonChoice } from '@/lib/game/typesExtension';
import { CharacterStats, getFinalStats, LegacyStats } from '@/lib/game/types';
import { useState } from 'react';

interface MentalStateCardProps {
  mentalState: MentalState;
  cultivationPath: string | null;
  onMeditate?: () => void;
}

export function MentalStateCard({
  mentalState,
  cultivationPath,
  onMeditate,
}: MentalStateCardProps) {
  const { stability, karma, demonChance, mentalBuffs } = mentalState;
  
  // 心境状态判断
  const getStabilityStatus = () => {
    if (stability >= 80) return { text: '心境澄明', color: 'text-green-600', effect: '修炼效率+10%' };
    if (stability >= 50) return { text: '心境平稳', color: 'text-blue-600', effect: '正常修炼' };
    if (stability >= 30) return { text: '心境动摇', color: 'text-yellow-600', effect: '修炼效率-10%' };
    return { text: '心境不稳', color: 'text-red-600', effect: '修炼效率-20%，心魔概率+10%' };
  };

  const status = getStabilityStatus();
  const isDemonPath = cultivationPath === 'demon';

  return (
    <Card className="border-2">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-primary" />
          心境状态
          {isDemonPath && (
            <Badge variant="outline" className="text-[10px] border-purple-500 text-purple-600">
              魔修加成
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 心境稳定度 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">心境稳定度</span>
            <span className={`font-medium ${status.color}`}>{status.text}</span>
          </div>
          <Progress value={stability} className="h-2" />
          <div className="text-[10px] text-muted-foreground text-right">
            {stability}/100 • {status.effect}
          </div>
        </div>

        {/* 业力值 */}
        <div className="flex items-center justify-between text-xs bg-muted/30 rounded p-1.5">
          <div className="flex items-center gap-1">
            {karma >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className="text-muted-foreground">业力值</span>
          </div>
          <span className={`font-medium ${karma >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {karma >= 0 ? '+' : ''}{karma}
          </span>
        </div>

        {/* 心魔概率 */}
        {(demonChance > 0 || stability < 50) && (
          <div className="flex items-center justify-between text-xs bg-orange-500/10 rounded p-1.5">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span className="text-orange-700 dark:text-orange-300">心魔概率</span>
            </div>
            <span className="font-medium text-orange-600">
              {(demonChance * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* 心境Buff */}
        {mentalBuffs.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">心境效果</span>
            <div className="flex flex-wrap gap-1">
              {mentalBuffs.map(buff => (
                <Badge 
                  key={buff.id}
                  variant="outline"
                  className={`text-[10px] ${
                    buff.effect === 'positive' 
                      ? 'border-green-500 text-green-600' 
                      : 'border-red-500 text-red-600'
                  }`}
                >
                  {buff.name} ({buff.duration})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 冥想按钮 */}
        {onMeditate && stability < 80 && (
          <Button 
            variant="outline" 
            className="w-full h-7 text-xs mt-1"
            onClick={onMeditate}
          >
            <Brain className="w-3 h-3 mr-1" />
            打坐冥想
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// 心魔事件对话框
interface DemonEncounterDialogProps {
  open: boolean;
  demon: DemonEncounter | null;
  stats: CharacterStats;
  onChoice: (choiceIndex: number) => void;
  result: { success: boolean; message: string } | null;
}

export function DemonEncounterDialog({
  open,
  demon,
  stats,
  onChoice,
  result,
}: DemonEncounterDialogProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  if (!demon) return null;

  const handleChoice = (index: number) => {
    setSelectedChoice(index);
    onChoice(index);
  };

  const getSuccessRate = (choice: DemonChoice): number => {
    let rate = choice.successRate;
    const finalStats = getFinalStats(stats);
    Object.entries(choice.statModifiers).forEach(([stat, modifier]) => {
      const statValue = finalStats[stat as keyof LegacyStats] || 0;
      rate += statValue * modifier;
    });
    return Math.min(0.9, Math.max(0.1, rate));
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[450px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            心魔来袭：{demon.name}
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/80">
            {demon.description}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">选择你的应对方式：</p>
            {demon.choices.map((choice, index) => {
              const successRate = getSuccessRate(choice);
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full h-auto py-3 px-3 flex flex-col items-start gap-2"
                  onClick={() => handleChoice(index)}
                  disabled={selectedChoice !== null}
                >
                  <span className="text-sm">{choice.text}</span>
                  <div className="w-full flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">成功率</span>
                    <span className={`font-medium ${
                      successRate >= 0.6 ? 'text-green-600' : 
                      successRate >= 0.4 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center">
            {result.success ? (
              <div className="space-y-3">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  战胜心魔！
                </p>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  被心魔侵蚀...
                </p>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
