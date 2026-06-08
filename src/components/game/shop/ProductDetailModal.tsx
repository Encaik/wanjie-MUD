/**
 * 商品详情弹窗
 * 
 * 显示商品详细信息，支持批量购买和收藏功能
 */

'use client';

import { useState, useEffect } from 'react';

import { Minus, Plus, Heart, ShoppingCart, Lock, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getRarityStyle } from '@/components/ui/item-tooltip';
import { CurrencyService } from '@/lib/game/shop/currencyService';
import { ShopLevelService } from '@/lib/game/shop/shopLevelService';
import { ShopProduct, PlayerCurrencies, CurrencyType, ProductEffect } from '@/lib/game/shop/types';
import { cn } from '@/lib/util/utils';


interface ProductDetailModalProps {
  product: ShopProduct | null;
  isOpen: boolean;
  currencies: PlayerCurrencies;
  shopLevel: number;
  favorites: string[];
  onClose: () => void;
  onPurchase: (quantity: number) => void;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  currencies,
  shopLevel,
  favorites,
  onClose,
  onPurchase,
  onToggleFavorite,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const isFavorite = product ? favorites.includes(product.id) : false;

  // 重置数量
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const canAfford = CurrencyService.canAfford(currencies, product.price);
  const isSoldOut = product.purchaseLimit && product.purchased >= product.purchaseLimit.limit;
  const maxPurchase = product.purchaseLimit
    ? Math.min(product.purchaseLimit.limit - product.purchased, 99)
    : 99;
  const totalPrice = product.price.amount * quantity;
  const canBuyTotal = (currencies[product.price.type] ?? 0) >= totalPrice;
  const currencyInfo = CurrencyService.getCurrencyInfo(product.price.type);

  const handlePurchase = () => {
    if (!canBuyTotal || isSoldOut) return;
    onPurchase(quantity);
    onClose();
  };

  const rarityLabels: Record<string, string> = {
    '普通': 'common',
    '稀有': 'rare',
    '史诗': 'epic',
    '传说': 'legendary',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={getRarityStyle(product.definition.rarity, 'text')}>
              {product.definition.name}
            </span>
            {product.discount && (
              <Badge variant="destructive" className="text-[10px]">
                -{product.discount.value}%
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {product.definition.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 商品效果 */}
          {product.definition.effects && product.definition.effects.length > 0 && (
            <div className="space-y-1">
              {product.definition.effects.map((effect, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{effect.label}</span>
                  <span className={cn(
                    'font-medium',
                    effect.color === 'red' && 'text-red-500',
                    effect.color === 'green' && 'text-green-500',
                    effect.color === 'blue' && 'text-blue-500',
                    effect.color === 'purple' && 'text-purple-500',
                    effect.color === 'yellow' && 'text-yellow-500',
                    effect.color === 'orange' && 'text-orange-500',
                    effect.color === 'cyan' && 'text-cyan-500',
                  )}>
                    {effect.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 购买条件 */}
          {product.conditions && product.conditions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">购买条件</div>
              {product.conditions.map((condition, index) => {
                const passed = true; // 简化判断
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      passed ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {passed ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {condition.description}
                  </div>
                );
              })}
            </div>
          )}

          {/* 限购信息 */}
          {product.purchaseLimit && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {product.purchaseLimit.type === 'daily' && '每日限购'}
                {product.purchaseLimit.type === 'weekly' && '每周限购'}
                {product.purchaseLimit.type === 'monthly' && '每月限购'}
                {product.purchaseLimit.type === 'lifetime' && '终身限购'}
              </span>
              <span className={cn(
                product.purchased >= product.purchaseLimit.limit ? 'text-red-500' : 'text-foreground'
              )}>
                {product.purchased}/{product.purchaseLimit.limit}
              </span>
            </div>
          )}

          {/* 价格显示 */}
          <div className="flex items-center justify-between py-2 border-t border-b">
            <span className="text-muted-foreground">单价</span>
            <div className="flex items-center gap-2">
              {product.originalPrice && (
                <span className="line-through text-muted-foreground text-sm">
                  {product.originalPrice}
                </span>
              )}
              <span className={cn('font-medium', currencyInfo.colorClass)}>
                {currencyInfo.icon} {product.price.amount}
              </span>
            </div>
          </div>

          {/* 数量选择 */}
          {!isSoldOut && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">购买数量</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setQuantity(Math.min(maxPurchase, quantity + 1))}
                  disabled={quantity >= maxPurchase}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* 总价 */}
          {!isSoldOut && quantity > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">总价</span>
              <span className={cn('font-medium', currencyInfo.colorClass)}>
                {currencyInfo.icon} {totalPrice.toLocaleString()}
              </span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            {onToggleFavorite && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onToggleFavorite(product.id)}
                className="shrink-0"
              >
                <Heart
                  className={cn('h-4 w-4', isFavorite && 'fill-red-500 text-red-500')}
                />
              </Button>
            )}
            
            <Button
              className="flex-1"
              onClick={handlePurchase}
              disabled={!canBuyTotal || isSoldOut || !product.unlocked}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isSoldOut ? '已售罄' : !canBuyTotal ? '货币不足' : '购买'}
            </Button>
          </div>

          {/* 货币不足提示 */}
          {!canBuyTotal && !isSoldOut && (
            <div className="text-xs text-center text-red-500 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {currencyInfo.name}不足，还差 {(totalPrice - (currencies[product.price.type] ?? 0)).toLocaleString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
