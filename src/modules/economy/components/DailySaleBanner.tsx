/**
 * 特卖横幅组件
 * 
 * 显示限时特卖商品，支持滚动展示
 */

'use client';

import { useState, useEffect } from 'react';

import { Flame, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

import { getRarityStyle } from '@/modules/theme/data/rarityStyles';
import { CurrencyService } from '@/modules/economy/logic/shop/currencyService';
import { DailySaleService } from '@/modules/economy/logic/shop/dailySaleService';
import { getProductConfig } from '@/modules/economy/logic/shop/productConfigs';
import { DailySaleData, SaleProduct, PlayerCurrencies } from '@/modules/economy/logic/shop/types';
import { cn } from '@/shared/utils';



interface DailySaleBannerProps {
  saleData: DailySaleData;
  currencies: PlayerCurrencies;
  onPurchase: (productId: string) => void;
}

export function DailySaleBanner({
  saleData,
  currencies,
  onPurchase,
}: DailySaleBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // 更新倒计时
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(DailySaleService.getRemainingSeconds(saleData));
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [saleData]);

  // 自动滚动
  useEffect(() => {
    if (saleData.products.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % saleData.products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [saleData.products.length]);

  if (saleData.products.length === 0) return null;

  const currentProduct = saleData.products[currentIndex];
  const productConfig = getProductConfig(currentProduct.productId);

  if (!productConfig) return null;

  const canAfford = (currencies[currentProduct.currency] ?? 0) >= currentProduct.salePrice;
  const isPurchased = currentProduct.purchased;
  const currencyInfo = CurrencyService.getCurrencyInfo(currentProduct.currency);

  const handlePrev = () => {
    setCurrentIndex(prev => 
      prev === 0 ? saleData.products.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % saleData.products.length);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-orange-500/30 bg-gradient-to-r from-orange-950/30 via-red-950/20 to-orange-950/30">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-orange-500/20">
        <div className="flex items-center gap-2 text-orange-500">
          <Flame className="w-4 h-4 animate-pulse" />
          <span className="font-medium text-sm">限时特卖</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{DailySaleService.formatRemainingTime(countdown)}</span>
        </div>
      </div>

      {/* 商品展示 */}
      <div className="flex items-center p-3">
        {/* 左箭头 */}
        {saleData.products.length > 1 && (
          <button
            onClick={handlePrev}
            className="shrink-0 p-1 hover:bg-muted/50 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* 商品信息 */}
        <div className="flex-1 flex items-center gap-3 px-2">
          {/* 商品图标/名称 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-medium truncate',
                getRarityStyle(productConfig.definition.rarity, 'text')
              )}>
                {productConfig.definition.name}
              </span>
              <span className="px-1 text-[10px] bg-red-500 text-white rounded font-bold">
                -{currentProduct.discount}%
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {productConfig.definition.description}
            </div>
          </div>

          {/* 价格 */}
          <div className="text-right shrink-0">
            <div className="text-[10px] line-through text-muted-foreground">
              {currentProduct.originalPrice}
            </div>
            <div className={cn('font-bold', currencyInfo.colorClass)}>
              {currencyInfo.icon} {currentProduct.salePrice}
            </div>
          </div>

          {/* 购买按钮 */}
          <button
            onClick={() => !isPurchased && canAfford && onPurchase(currentProduct.productId)}
            disabled={isPurchased || !canAfford}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              isPurchased
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : canAfford
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isPurchased ? '已购买' : canAfford ? '购买' : '不足'}
          </button>
        </div>

        {/* 右箭头 */}
        {saleData.products.length > 1 && (
          <button
            onClick={handleNext}
            className="shrink-0 p-1 hover:bg-muted/50 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* 指示器 */}
      {saleData.products.length > 1 && (
        <div className="flex justify-center gap-1 pb-2">
          {saleData.products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'w-4 bg-orange-500'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 简洁版特卖提示 */
export function SaleMiniBanner({
  saleData,
  onClick,
}: {
  saleData: DailySaleData;
  onClick: () => void;
}) {
  const availableCount = saleData.products.filter(p => !p.purchased).length;
  const maxDiscount = Math.max(...saleData.products.map(p => p.discount));

  if (saleData.products.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-orange-500/10 to-red-500/10',
        'border border-orange-500/20 hover:border-orange-500/40',
        'transition-all cursor-pointer'
      )}
    >
      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
      <span className="text-sm font-medium text-orange-500">
        今日特卖 最高{maxDiscount}%OFF
      </span>
      <span className="text-xs text-muted-foreground">
        {availableCount}件待购
      </span>
    </button>
  );
}
