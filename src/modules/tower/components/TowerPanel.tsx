/**
 * 试炼面板组件
 */

'use client';

import { useState } from 'react';

import { 
  Swords, 
  Trophy, 
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Sparkles,
  Package,
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { getRarityBgClass, getRarityColorClass, getRarityBorderClass } from '@/modules/equipment/data/raritySystem';
import { generateTowerEnemy } from '@/modules/tower/logic/towerSystem';
import { 
  TowerProgress, 
  TowerEnemy, 
} from '@/modules/tower/logic/types';
import { WorldType, ItemRarity } from '@/core/types';


interface TowerPanelProps {
  /** 爬塔进度 */
  towerProgress: TowerProgress;
  /** 玩家等级 */
  playerLevel: number;
  /** 世界类型 */
  worldType: WorldType;
  /** 当前HP */
  currentHp: number;
  /** 最大HP */
  maxHp: number;
  /** 当前MP */
  currentMp: number;
  /** 最大MP */
  maxMp: number;
  /** 当前体力 */
  currentStamina: number;
  /** 最大体力 */
  maxStamina: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 挑战回调 */
  onChallenge: (floor: number, enemy: TowerEnemy) => void;
}

export function TowerPanel({
  towerProgress,
  playerLevel,
  worldType,
  currentHp,
  maxHp,
  currentMp,
  maxMp,
  currentStamina,
  maxStamina,
  disabled = false,
  onChallenge,
}: TowerPanelProps) {
  const [showCleared, setShowCleared] = useState(false);
  
  // 处理 clearedFloors 可能是数组或 Set 的情况
  const clearedFloorsSet = towerProgress.clearedFloors instanceof Set 
    ? towerProgress.clearedFloors 
    : new Set<number>(Array.isArray(towerProgress.clearedFloors) ? towerProgress.clearedFloors : []);
  
  const maxFloor = towerProgress.maxClearedFloor;
  const nextFloor = maxFloor + 1;
  
  // 下一层敌人
  const nextFloorEnemy = generateTowerEnemy(nextFloor, playerLevel, worldType);
  
  // 已通关楼层敌人（最近5层）
  const clearedFloorEnemies = [];
  const startFloor = Math.max(1, maxFloor - 4);
  for (let f = maxFloor; f >= startFloor; f--) {
    if (clearedFloorsSet.has(f)) {
      clearedFloorEnemies.push({
        floor: f,
        enemy: generateTowerEnemy(f, playerLevel, worldType),
      });
    }
  }
  
  // TODO: 预期挂机收益待接入 core/time offline.process()

  // 获取敌人类型颜色
  const getEnemyTypeColor = (type: string) => {
    switch (type) {
      case 'boss': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'elite': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };
  
  // 挑战楼层
  const handleChallenge = (floor: number, enemy: TowerEnemy) => {
    onChallenge(floor, enemy);
  };
  
  // 获取品质对应的 Badge 样式
  const getRarityBadgeStyle = (rarity: ItemRarity): string => {
    const bgClass = getRarityBgClass(rarity);
    const textClass = getRarityColorClass(rarity);
    const borderClass = getRarityBorderClass(rarity);
    return `${bgClass} ${textClass} ${borderClass}`;
  };
  
  // 渲染楼层卡片
  const renderFloorCard = (floor: number, enemy: TowerEnemy, cleared: boolean, isNext: boolean = false) => {
    const typeLabel = enemy.isBoss ? 'Boss' : enemy.type === 'elite' ? '精英' : '普通';
    
    return (
      <div 
        key={floor} 
        className={`p-3 rounded-lg border ${
          cleared 
            ? 'bg-muted/30 border-border' 
            : isNext 
              ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
              : 'bg-card border-border'
        }`}
      >
        {/* 楼层标题 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">第{floor}层</span>
            <Badge variant="secondary" className={getEnemyTypeColor(enemy.type)}>
              {typeLabel}
            </Badge>
            {cleared && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {!cleared && floor === nextFloor && (
              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600">
                首通
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Lv.{enemy.level}</span>
        </div>
        
        {/* 敌人名称 */}
        <div className="text-sm font-medium mb-2">{enemy.name}</div>
        
        {/* 敌人属性 */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
          <div>❤️ {enemy.maxHp.toLocaleString()}</div>
          <div>⚔️ {enemy.attack.toLocaleString()}</div>
          <div>🛡️ {enemy.defense.toLocaleString()}</div>
        </div>
        
        {/* 固定奖励 */}
        <div className="p-2 rounded bg-muted/30 mb-2">
          <div className="text-xs font-medium mb-1">奖励</div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {/* 灵石 */}
            <Badge variant="secondary" className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-600">
              <Coins className="w-3 h-3 mr-0.5" />
              {enemy.rewards.spiritStones}
            </Badge>
            
            {/* 经验 */}
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-600">
              <Sparkles className="w-3 h-3 mr-0.5" />
              {enemy.rewards.experience}
            </Badge>
            
            {/* 碎片 */}
            {enemy.rewards.fragments.map((frag, idx) => (
              <Badge key={idx} variant="secondary" className={getRarityBadgeStyle(frag.rarity)}>
                <Package className="w-3 h-3 mr-0.5" />
                {frag.type === 'technique' ? '功法' : '装备'}碎片×{frag.quantity}
              </Badge>
            ))}
            
            {/* 材料 */}
            {enemy.rewards.materials.map((mat, idx) => (
              <Badge key={idx} variant="secondary" className={getRarityBadgeStyle(mat.rarity)}>
                <Package className="w-3 h-3 mr-0.5" />
                材料×{mat.quantity}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* 挑战按钮 */}
        <Button
          size="sm"
          className="w-full"
          onClick={() => handleChallenge(floor, enemy)}
          disabled={disabled || cleared}
          variant={isNext && !cleared ? 'default' : 'outline'}
        >
          <Swords className="w-3.5 h-3.5 mr-1" />
          {cleared ? '已通关' : '开始挑战'}
        </Button>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* 试炼状态概览 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            试炼之塔
          </CardTitle>
          <CardDescription>
            当前最高层: {maxFloor}层 · 下一层: 第{nextFloor}层
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 挂机收益预览 — 待接入 core/time/offline.process() */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" />
              <span>挂机收益将在离线时自动计算（离线时长最多8小时）</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 当前挑战层 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            当前挑战
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFloorCard(nextFloor, nextFloorEnemy, false, true)}
        </CardContent>
      </Card>
      
      {/* 已通关楼层 - 可折叠 */}
      {maxFloor > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowCleared(!showCleared)}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                已通关 ({maxFloor}层)
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {showCleared ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showCleared && (
            <CardContent className="space-y-2 pt-0">
              {clearedFloorEnemies.map(({ floor, enemy }) => 
                renderFloorCard(floor, enemy, true)
              )}
              {maxFloor > 5 && (
                <div className="text-xs text-center text-muted-foreground pt-2">
                  显示最近5层，共通关 {maxFloor} 层
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
