'use client';

import { AlertTriangle, CloudLightning, Droplets, Swords, TrendingUp } from 'lucide-react';

import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import type { ActiveEffect, WorldType } from '@/core/types';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import { getMaxExperience, calculateBreakthroughRate, calculateBreakthroughBoost } from '@/modules/progression/logic/cultivation';
import { getNextTribulationLevel } from '@/modules/ascension/data/tribulationData';
import { MAX_LEVEL } from '@/modules/progression/logic/realmSystem';

interface BreakthroughPanelProps {
  /** 当前等级 */
  level: number;
  /** 当前经验值 */
  experience: number;
  /** 溢出经验值 */
  overflowExperience: number;
  /** 幸运值 */
  luck: number;
  /** 活跃效果列表 */
  activeEffects: ActiveEffect[];
  /** 世界类型（用于术语） */
  worldType: WorldType;
  /** 是否自动修炼中 */
  autoCultivating: boolean;
  /** 是否禁用操作 */
  disabled?: boolean;
  /** 渡劫回调 */
  onTribulation?: () => void;
  /** 挑战天道回调 */
  onChallengeGuardian?: () => void;
  /** 当前HP和MP是否已满（用于天道挑战判断） */
  hpFull?: boolean;
  mpFull?: boolean;
}

/**
 * BreakthroughPanel — 突破、渡劫、天道挑战面板
 *
 * 从 CultivationPanel 拆分出的独立子系统，
 * 负责突破概率显示、经验溢出警告、渡劫提示和满级天道挑战。
 */
export function BreakthroughPanel({
  level,
  experience,
  overflowExperience,
  luck,
  activeEffects,
  worldType,
  autoCultivating,
  disabled = false,
  onTribulation,
  onChallengeGuardian,
  hpFull = true,
  mpFull = true,
}: BreakthroughPanelProps) {
  const terminology = getTerminology(worldType);
  const maxExp = getMaxExperience(level);
  const isMaxLevel = level >= MAX_LEVEL;
  const canAttemptBreakthrough = experience >= maxExp;
  const hasOverflow = overflowExperience > 0;

  // 计算突破概率
  const breakthroughBoost = calculateBreakthroughBoost(activeEffects);
  const breakthroughRate = canAttemptBreakthrough
    ? calculateBreakthroughRate(level, luck, breakthroughBoost, overflowExperience, maxExp)
    : 0;

  // 丹药加成
  const breakthroughEffect = activeEffects.find(e => e.type === 'breakthrough_boost');

  // 渡劫判断
  const nextTribLevel = getNextTribulationLevel(level);
  const needsTribulation = nextTribLevel !== null && level >= nextTribLevel && canAttemptBreakthrough;

  // 天道挑战条件
  const canChallengeGuardian = isMaxLevel && hpFull && mpFull;

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
        {/* 满级天道挑战 */}
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
        {hasOverflow && !isMaxLevel && (
          <div className="text-xs bg-game-economy/10 text-game-economy p-2 rounded-lg flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            经验溢出 {overflowExperience}，修炼效率降低
          </div>
        )}

        {/* 渡劫提示区域 */}
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
