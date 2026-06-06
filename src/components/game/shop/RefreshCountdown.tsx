/**
 * 商店刷新倒计时组件
 * 
 * 显示商店刷新倒计时和手动刷新按钮
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/util/utils';
import { ShopType, PlayerCurrencies, CurrencyCost } from '@/lib/game/shop/types';
import { RefreshService } from '@/lib/game/shop/refreshService';
import { CurrencyService } from '@/lib/game/shop/currencyService';
import { Clock, RefreshCw, Zap } from 'lucide-react';

interface RefreshCountdownProps {
  shopType: ShopType;
  currencies: PlayerCurrencies;
  refreshState: {
    lastRefreshTimes: Partial<Record<ShopType, number>>;
    nextRefreshTimes: Partial<Record<ShopType, number>>;
    manualRefreshCounts: Partial<Record<ShopType, number>>;
    dailyResetTime: number;
    shopProductIds: Partial<Record<ShopType, string[]>>;
  };
  onRefresh?: () => void;
  onStateChange?: (newState: any) => void;
}

export function RefreshCountdown({
  shopType,
  currencies,
  refreshState,
  onRefresh,
  onStateChange,
}: RefreshCountdownProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 更新倒计时
  useEffect(() => {
    const updateCountdown = () => {
      const result = RefreshService.getRefreshCountdown(shopType, refreshState);
      setCountdown(result);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [shopType, refreshState]);

  // 检查是否支持刷新
  const supportsRefresh = RefreshService.supportsRefresh(shopType);
  if (!supportsRefresh) {
    return null;
  }

  // 获取手动刷新花费
  const refreshCost = RefreshService.getManualRefreshCost(shopType, refreshState);
  const canAffordRefresh = refreshCost.amount === 0 || CurrencyService.canAfford(currencies, refreshCost);
  const isFreeRefresh = refreshCost.amount === 0;

  // 获取免费刷新次数
  const todayCount = refreshState.manualRefreshCounts[shopType] || 0;
  // 计算免费刷新剩余次数（通过今日刷新次数推算）
  const dailyFreeRefresh = todayCount < 3 ? Math.max(0, 1 - todayCount) : 0;
  const freeRefreshLeft = dailyFreeRefresh;

  // 格式化倒计时显示
  const formatCountdown = () => {
    if (countdown.total <= 0) {
      return '即将刷新';
    }
    if (countdown.hours > 0) {
      return `${countdown.hours}时${countdown.minutes}分后刷新`;
    }
    if (countdown.minutes > 0) {
      return `${countdown.minutes}分${countdown.seconds}秒后刷新`;
    }
    return `${countdown.seconds}秒后刷新`;
  };

  // 处理手动刷新
  const handleManualRefresh = useCallback(() => {
    if (isRefreshing || !canAffordRefresh) return;

    setIsRefreshing(true);
    
    // 调用刷新回调
    if (onRefresh) {
      onRefresh();
    }

    // 模拟刷新动画
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [isRefreshing, canAffordRefresh, onRefresh]);

  const currencyInfo = CurrencyService.getCurrencyInfo(refreshCost.type);

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 rounded-lg">
      {/* 刷新倒计时 */}
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {formatCountdown()}
        </span>
      </div>

      {/* 刷新按钮 */}
      <div className="flex items-center gap-2">
        {/* 免费刷新提示 */}
        {freeRefreshLeft > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <Zap className="w-2.5 h-2.5 mr-0.5" />
            免费×{freeRefreshLeft}
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 text-[11px] px-2',
            isFreeRefresh && 'text-green-500 border-green-500/50 hover:bg-green-500/10'
          )}
          onClick={handleManualRefresh}
          disabled={!canAffordRefresh || isRefreshing}
        >
          <RefreshCw className={cn('w-3 h-3 mr-1', isRefreshing && 'animate-spin')} />
          {isFreeRefresh ? (
            '免费刷新'
          ) : (
            <>
              {currencyInfo.icon} {refreshCost.amount}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/** 紧凑版刷新倒计时 */
export function RefreshCountdownCompact({
  shopType,
  refreshState,
  onRefresh,
}: {
  shopType: ShopType;
  refreshState: RefreshCountdownProps['refreshState'];
  onRefresh?: () => void;
}) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const result = RefreshService.getRefreshCountdown(shopType, refreshState);
      setCountdown(result);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [shopType, refreshState]);

  const supportsRefresh = RefreshService.supportsRefresh(shopType);
  if (!supportsRefresh || countdown.total <= 0) {
    return null;
  }

  const formatTime = () => {
    if (countdown.hours > 0) {
      return `${countdown.hours}h`;
    }
    if (countdown.minutes > 0) {
      return `${countdown.minutes}m`;
    }
    return `${countdown.seconds}s`;
  };

  return (
    <Badge 
      variant="outline" 
      className="text-[10px] cursor-pointer hover:bg-muted/50"
      onClick={onRefresh}
    >
      <RefreshCw className="w-2.5 h-2.5 mr-1" />
      {formatTime()}
    </Badge>
  );
}
