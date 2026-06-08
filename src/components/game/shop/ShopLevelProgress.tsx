/**
 * 商店等级进度组件
 * 
 * 显示商店等级、经验和折扣信息
 */

'use client';

import { Crown, TrendingUp, Gift, ChevronUp } from 'lucide-react';

import { ShopLevelService } from '@/lib/game/shop/shopLevelService';
import { ShopLevelData } from '@/lib/game/shop/types';
import { cn } from '@/utils';


interface ShopLevelProgressProps {
  levelData: ShopLevelData;
  compact?: boolean;
}

export function ShopLevelProgress({
  levelData,
  compact = false,
}: ShopLevelProgressProps) {
  const progress = ShopLevelService.getProgress(levelData);
  const discount = ShopLevelService.getDiscount(levelData);
  const config = ShopLevelService.getLevelConfig(levelData.level);
  const nextFeatures = ShopLevelService.getNextLevelFeatures(levelData);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
          <Crown className="w-3 h-3" />
          <span className="font-medium">Lv.{levelData.level}</span>
        </div>
        {discount > 0 && (
          <span className="text-green-500">-{discount}%</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 等级和折扣 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
            <Crown className="w-4 h-4" />
            <span className="font-bold">Lv.{levelData.level}</span>
          </div>
          <span className="text-xs text-muted-foreground">{config.description}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-500">
            <TrendingUp className="w-3 h-3" />
            <span>永久折扣 -{discount}%</span>
          </div>
        )}
      </div>

      {/* 经验进度条 */}
      {!progress.isMaxLevel && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>经验值</span>
            <span>{progress.currentExp.toLocaleString()} / {progress.nextExp.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
              style={{ width: `${progress.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 下一级预览 */}
      {nextFeatures && nextFeatures.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ChevronUp className="w-3 h-3" />
          <span>下一级解锁: {nextFeatures.join(', ')}</span>
        </div>
      )}

      {/* 最高等级 */}
      {progress.isMaxLevel && (
        <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <Gift className="w-3 h-3" />
          <span>已达最高等级，享受{discount}%永久折扣！</span>
        </div>
      )}

      {/* 周消费 */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>本周消费</span>
        <span>{levelData.weeklySpent.toLocaleString()} 灵石</span>
      </div>
    </div>
  );
}

/** 等级徽章 */
export function LevelBadge({ level }: { level: number }) {
  const colors = [
    'from-gray-500 to-gray-600',
    'from-green-500 to-green-600',
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-yellow-500 to-yellow-600',
    'from-orange-500 to-orange-600',
    'from-red-500 to-red-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-amber-400 to-yellow-500',
  ];

  return (
    <div className={cn(
      'flex items-center justify-center w-6 h-6 rounded-full',
      'bg-gradient-to-br text-white text-[10px] font-bold',
      colors[Math.min(level - 1, 9)]
    )}>
      {level}
    </div>
  );
}
