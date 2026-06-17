'use client';

import { Sparkles, Coins, Play, Square, Moon, Swords, Zap, Flame, Shield, AlertTriangle } from 'lucide-react';

import { CardCornerDecorations } from '@/shared/components';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { CULTIVATION_PATHS } from '@/modules/progression/data/cultivationPathData';
import { useMentalState } from '@/modules/progression/hooks/useMentalState';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import type { ActiveEffect, WorldType, CultivationPath, FlatStats, MentalState } from '@/core/types';
import type { ItemInstance } from '@/modules/item/types';
import { getCurrencyAmount } from '@/modules/item/logic';

interface CultivationPanelProps {
  onCultivate: () => void;
  onCultivateWithStrategy?: (strategy: 'steady' | 'aggressive' | 'insight') => void;
  cultivationCooldown?: number | null;
  insightMarks?: number;
  onRest: () => void;
  onSelectPath?: () => void;
  disabled?: boolean;
  worldType: WorldType;
  items: ItemInstance[];
  activeEffects?: ActiveEffect[];
  experience: number;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  autoCultivating: boolean;
  onToggleAutoCultivation: () => void;
  luck?: number;
  cultivationPath?: CultivationPath | null;
  pathLevel?: number;
  stats?: FlatStats;
  mentalState?: MentalState;
  onMentalStateChange?: (mentalState: MentalState) => void;
}

/** 获取灵石数量（新物品系统） */
function getSpiritStoneCount(items: ItemInstance[] | undefined): number {
  if (!items) return 0;
  return getCurrencyAmount(items, 'wanjie:common:spirit_stone');
}

/** 获取流派图标 */
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

/** 获取流派颜色 */
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

/**
 * CultivationPanel — 修炼操作面板
 *
 * 负责修炼操作、流派选择、恢复/休息和心魔警告。
 * 突破/渡劫/天道挑战 → BreakthroughPanel
 * 新手引导任务 → QuestPanel
 */
export function CultivationPanel({
  onCultivate,
  onCultivateWithStrategy,
  cultivationCooldown,
  insightMarks = 0,
  onRest,
  onSelectPath,
  disabled,
  worldType,
  items,
  activeEffects = [],
  experience,
  currentHp,
  maxHp,
  currentMp,
  maxMp,
  autoCultivating,
  onToggleAutoCultivation,
  cultivationPath,
  pathLevel = 1,
  mentalState: externalMentalState,
  onMentalStateChange,
}: CultivationPanelProps) {
  const { mentalState } = useMentalState({
    externalMentalState,
    onMentalStateChange,
    experience,
    cultivationPath,
  });

  const terminology = getTerminology(worldType);
  const spiritStones = getSpiritStoneCount(items);
  const hasEnoughStones = spiritStones >= 20;
  const hasEnoughStonesForRest = spiritStones >= 5;
  const needsRest = currentHp < maxHp || currentMp < maxMp;

  const cultivationEffect = activeEffects.find(e => e.type === 'cultivation_boost');
  const pathConfig = cultivationPath ? CULTIVATION_PATHS[cultivationPath] : null;

  return (
    <Card className="relative overflow-hidden">
      <CardCornerDecorations />
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
        {/* 流派信息区域 */}
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
                <Badge variant="outline" className="text-[10px]">Lv.{pathLevel}</Badge>
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

        {/* 修炼区域 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>消耗资源修炼</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-game-economy" />
              <span className={hasEnoughStones ? '' : 'text-game-combat'}>20 {terminology.resource}</span>
            </div>
          </div>

          {cultivationEffect && (
            <div className="flex items-center gap-1 text-[10px] text-game-cultivation bg-game-cultivation/10 px-2 py-1 rounded">
              <Zap className="w-2.5 h-2.5" />
              <span>
                {cultivationEffect.itemName}：修炼效果+{cultivationEffect.value}%
                （剩余{cultivationEffect.remainingCount}次）
              </span>
            </div>
          )}

          {cultivationCooldown && cultivationCooldown > Date.now() ? (
            <div className="text-[10px] text-game-tribulation text-center">
              冥想冷却中，剩余 {Math.ceil((cultivationCooldown - Date.now()) / 1000)} 秒
            </div>
          ) : null}

          {insightMarks > 0 && (
            <div className="text-[10px] text-game-mental text-center">
              ✦ 顿悟印记：{insightMarks} 枚（集齐3枚可兑换）
            </div>
          )}

          {/* 修炼策略选择 */}
          {onCultivateWithStrategy ? (
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1">
                <Button size="sm" className="h-7 text-[10px]"
                  onClick={() => onCultivateWithStrategy('steady')}
                  disabled={disabled || !hasEnoughStones || autoCultivating}
                  title="消耗20灵石，标准收益，失败返半">稳健</Button>
                <Button size="sm" className="h-7 text-[10px]" variant="secondary"
                  onClick={() => onCultivateWithStrategy('aggressive')}
                  disabled={disabled || spiritStones < 40 || autoCultivating}
                  title="消耗40灵石，高收益高风险，有意外突破可能">激进</Button>
                <Button size="sm" className="h-7 text-[10px]" variant="outline"
                  onClick={() => onCultivateWithStrategy('insight')}
                  disabled={disabled || autoCultivating || !!(cultivationCooldown && cultivationCooldown > Date.now())}
                  title="不消耗灵石，极低成功率，可获得顿悟印记">顿悟</Button>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 h-8 text-xs" onClick={() => onCultivate()}
                  disabled={disabled || !hasEnoughStones || autoCultivating}>
                  传统{terminology.practice}</Button>
                <Button className={`h-8 text-xs px-3 ${autoCultivating ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  variant={autoCultivating ? 'destructive' : 'outline'}
                  onClick={onToggleAutoCultivation} disabled={disabled || !hasEnoughStones}>
                  {autoCultivating ? <><Square className="w-3 h-3 mr-1" />停止</> : <><Play className="w-3 h-3 mr-1" />自动</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1 h-8 text-xs" onClick={() => onCultivate()}
                disabled={disabled || !hasEnoughStones || autoCultivating}>
                开始{terminology.practice}</Button>
              <Button className={`h-8 text-xs px-3 ${autoCultivating ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                variant={autoCultivating ? 'destructive' : 'outline'}
                onClick={onToggleAutoCultivation} disabled={disabled || !hasEnoughStones}>
                {autoCultivating ? <><Square className="w-3 h-3 mr-1" />停止</> : <><Play className="w-3 h-3 mr-1" />自动</>}
              </Button>
            </div>
          )}
        </div>

        {/* 恢复区域 */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>休生养息，恢复状态</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-game-economy" />
              <span className={hasEnoughStonesForRest ? '' : 'text-game-combat'}>5 {terminology.resource}</span>
            </div>
          </div>
          <Button variant="secondary" className="w-full h-8 text-xs" onClick={onRest}
            disabled={disabled || !hasEnoughStonesForRest || !needsRest || autoCultivating}>
            <Moon className="w-3 h-3 mr-1" />
            {needsRest ? '恢复状态' : '状态已满'}
          </Button>
        </div>

        {/* 心魔概率警告 */}
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
      </CardContent>
    </Card>
  );
}
