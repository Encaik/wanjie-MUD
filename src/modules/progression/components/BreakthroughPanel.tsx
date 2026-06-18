'use client';

import { TrendingUp, Shield, AlertTriangle } from 'lucide-react';

import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Progress } from '@/shared/ui/feedback/progress';
import type { WorldType } from '@/core/types';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import { getMaxExperience, calculateBreakthroughRate, calculateBreakthroughBoost } from '@/modules/progression/logic/cultivation';
import { computeCoreStats } from '@/modules/progression/logic/demonBreakthrough';
import { getFinalStats } from '@/core/types';
import { MAX_LEVEL } from '@/modules/progression/logic/realmSystem';

interface BreakthroughPanelProps {
  /** 当前等级 */
  level: number;
  /** 当前经验值 */
  experience: number;
  /** 溢出经验值 */
  overflowExperience: number;
  /** 活跃效果列表 */
  activeEffects: import('@/core/types').ActiveEffect[];
  /** 世界类型 */
  worldType: WorldType;
  /** 是否自动修炼中 */
  autoCultivating: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 当前心境护盾层数 */
  mindShield?: number;
  /** 冲击境界回调 */
  onBreakthrough: () => void;
}

/**
 * BreakthroughPanel — 突破入口面板
 *
 * 当经验满足突破条件时显示"冲击境界"按钮，触发心魔突破战流程。
 */
export function BreakthroughPanel({
  level,
  experience,
  overflowExperience,
  activeEffects,
  worldType,
  autoCultivating,
  disabled = false,
  mindShield = 0,
  onBreakthrough,
}: BreakthroughPanelProps) {
  const terminology = getTerminology(worldType);
  const maxExp = getMaxExperience(level);
  const isMaxLevel = level >= MAX_LEVEL;
  const canAttemptBreakthrough = experience >= maxExp && !isMaxLevel;
  const hasOverflow = overflowExperience > 0;

  // 预估突破成功率（显示参考值）
  const breakthroughBoost = calculateBreakthroughBoost(activeEffects);
  const flatStats = { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 };
  const previewRate = canAttemptBreakthrough
    ? calculateBreakthroughRate(level, 50, breakthroughBoost, overflowExperience, maxExp)
    : 0;

  // 心境护盾预估
  const estimatedMindShield = 30 + mindShield * 5 + 50; // 粗略估计 willpower=50

  return (
    <Card className="relative overflow-hidden">
      <CardCornerDecorations />
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-game-tribulation" />
          突破
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-2">
        {/* 满级提示 */}
        {isMaxLevel && (
          <div className="text-xs text-muted-foreground text-center py-2">
            已达最高等级
          </div>
        )}

        {/* 可突破状态 */}
        {canAttemptBreakthrough && (
          <div className="bg-gradient-to-r from-game-tribulation/10 to-game-cultivation/10 p-2 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-game-tribulation">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-medium">可尝试突破</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-game-tribulation/10 text-game-tribulation border-game-tribulation/30">
                {level}级 → {level + 1}级
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">预估成功率</span>
                <span className={`font-bold ${previewRate >= 70 ? 'text-game-recovery' : previewRate >= 40 ? 'text-game-economy' : 'text-game-combat'}`}>
                  {previewRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={previewRate} className="h-1.5" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>心境护盾</span>
              </div>
              <span className="font-medium">{estimatedMindShield}</span>
            </div>

            {mindShield > 0 && (
              <div className="text-[10px] text-game-cultivation">
                修炼积累护盾层数：{mindShield}层
              </div>
            )}

            <Button
              className="w-full h-8 text-xs bg-gradient-to-r from-game-tribulation to-game-cultivation hover:brightness-110"
              onClick={onBreakthrough}
              disabled={disabled || autoCultivating}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              冲击境界
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              将触发心魔突破战——战胜心魔方能突破境界
            </p>
          </div>
        )}

        {/* 经验不足时显示进度 */}
        {!canAttemptBreakthrough && !isMaxLevel && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>突破进度</span>
              <span>{experience}/{maxExp}</span>
            </div>
            <Progress value={(experience / maxExp) * 100} className="h-1.5" />
          </div>
        )}

        {/* 经验溢出警告 */}
        {hasOverflow && !isMaxLevel && (
          <div className="text-xs bg-game-economy/10 text-game-economy p-2 rounded-lg flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            经验溢出 {overflowExperience}，修炼效率降低
          </div>
        )}
      </CardContent>
    </Card>
  );
}
