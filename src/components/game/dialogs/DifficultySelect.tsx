'use client';

import { useState, useEffect } from 'react';

import { Swords, Map, AlertTriangle, Star, Zap, Lock, Battery, BatteryLow, BatteryMedium, BatteryFull, Timer, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDungeonInfo } from '@/lib/game/utils/terminology';
import { DungeonConfig, WorldType, Protagonist } from '@/lib/game/types';




interface DifficultySelectProps {
  difficulties: DungeonConfig[];
  playerLevel: number;
  playerRealm?: string;
  worldType: WorldType;
  onSelect: (config: DungeonConfig) => void;
  onQuickSweep?: (config: DungeonConfig) => void;
  protagonist?: Protagonist;
  totalBossKilled?: number; // 击败Boss次数
  clearedDifficulties?: number[]; // 已通关的难度等级列表
}

// 体力图标映射
const getStaminaIcon = (current: number, max: number, cost: number) => {
  const ratio = current / max;
  const enough = current >= cost;
  
  if (!enough) {
    return <BatteryLow className="w-4 h-4 text-red-500" />;
  }
  if (ratio >= 0.7) {
    return <BatteryFull className="w-4 h-4 text-green-500" />;
  }
  if (ratio >= 0.3) {
    return <BatteryMedium className="w-4 h-4 text-yellow-500" />;
  }
  return <BatteryLow className="w-4 h-4 text-orange-500" />;
};

// 计算体力恢复倒计时（秒）
const getStaminaRecoveryTime = (lastRecover: number, maxStamina: number, currentStamina: number): number => {
  if (currentStamina >= maxStamina) return 0;
  // 每5分钟恢复1点体力
  const timeSinceLastRecover = Date.now() - lastRecover;
  const recoveryInterval = 5 * 60 * 1000; // 5分钟
  const timeUntilNextRecovery = recoveryInterval - (timeSinceLastRecover % recoveryInterval);
  return Math.ceil(timeUntilNextRecovery / 1000);
};

export function DifficultySelect({ 
  difficulties, 
  playerLevel, 
  playerRealm, 
  worldType, 
  onSelect,
  onQuickSweep,
  protagonist,
  totalBossKilled = 0,
  clearedDifficulties = []
}: DifficultySelectProps) {
  const dungeonInfo = getDungeonInfo(worldType);
  const [staminaRecoveryTime, setStaminaRecoveryTime] = useState(0);
  
  // 获取体力信息
  const currentStamina = protagonist?.stamina ?? 100;
  const maxStamina = protagonist?.maxStamina ?? 100;
  const lastStaminaRecover = protagonist?.lastStaminaRecover ?? Date.now();
  
  // 更新体力恢复倒计时
  useEffect(() => {
    const updateRecoveryTime = () => {
      const time = getStaminaRecoveryTime(lastStaminaRecover, maxStamina, currentStamina);
      setStaminaRecoveryTime(time);
    };
    
    updateRecoveryTime();
    const interval = setInterval(updateRecoveryTime, 1000);
    return () => clearInterval(interval);
  }, [lastStaminaRecover, maxStamina, currentStamina]);
  
  // 格式化倒计时显示
  const formatRecoveryTime = (seconds: number): string => {
    if (seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          选择{dungeonInfo.name}难度
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>当前境界：{playerRealm || `Lv.${playerLevel}`}</span>
          <span className="flex items-center gap-2">
            {getStaminaIcon(currentStamina, maxStamina, 10)}
            <span className={currentStamina < 20 ? 'text-red-500' : ''}>
              体力：{currentStamina}/{maxStamina}
            </span>
          </span>
        </div>
        
        {/* 体力恢复倒计时 */}
        {currentStamina < maxStamina && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1">
            <Timer className="w-3 h-3" />
            <span>下点体力恢复: {formatRecoveryTime(staminaRecoveryTime)}</span>
          </div>
        )}
        
        <div className="grid gap-2">
          {difficulties.map((config, index) => {
            const isUnlocked = config.isUnlocked !== false; // 默认解锁
            const isDangerous = config.enemyLevelMax > playerLevel + 5;
            const staminaCost = config.staminaCost || 10;
            const hasEnoughStamina = currentStamina >= staminaCost;
            
            // 【V2修改】扫荡解锁条件：通关过该难度的机缘（通过 difficulty 等级判断）
            const hasCleared = clearedDifficulties.includes(config.difficulty);
            const canQuickSweep = hasCleared && hasEnoughStamina && isUnlocked;
            
            // 推荐逻辑：等级接近且未通关过
            const isRecommended = isUnlocked && !hasCleared && 
              config.enemyLevelMin <= playerLevel && 
              config.enemyLevelMax >= playerLevel - 5;
            
            return (
              <div
                key={index}
                className={`border rounded-lg p-3 transition-colors ${
                  isUnlocked 
                    ? 'hover:bg-muted/30' 
                    : 'opacity-50 bg-muted/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
                    {config.realmName}
                    {!isUnlocked && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        <Lock className="w-3 h-3 mr-1" />
                        Lv.{config.difficulty}解锁
                      </Badge>
                    )}
                    {hasCleared && (
                      <Badge variant="outline" className="ml-2 text-[10px] bg-green-500/10 border-green-500/30 text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已通关
                      </Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    {isUnlocked && isDangerous && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        危险
                      </Badge>
                    )}
                    {isRecommended && (
                      <Badge className="text-[10px] bg-green-500">
                        推荐
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Map className="w-3 h-3" />
                    {config.rows}x{config.cols}
                  </span>
                  <span>敌人: Lv.{config.enemyLevelMin}-{config.enemyLevelMax}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    x{config.rewardMultiplier.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Battery className="w-3 h-3 text-amber-500" />
                    消耗: {staminaCost}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && onSelect(config)}
                  >
                    {!isUnlocked ? (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        未解锁
                      </>
                    ) : (
                      <>
                        <Swords className="w-3 h-3 mr-1" />
                        进入
                      </>
                    )}
                  </Button>
                  <Button
                    variant={canQuickSweep ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    disabled={!canQuickSweep || !onQuickSweep}
                    onClick={() => canQuickSweep && onQuickSweep?.(config)}
                  >
                    {canQuickSweep ? (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        扫荡 ({staminaCost}体力)
                      </>
                    ) : !hasCleared ? (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        需通关解锁
                      </>
                    ) : (
                      <>
                        <BatteryLow className="w-3 h-3 mr-1" />
                        体力不足
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        {difficulties.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            暂无可选难度
          </div>
        )}
      </CardContent>
    </Card>
  );
}
