/**
 * 商品卡片组件
 * 
 * 显示单个商品的信息和购买按钮
 */

'use client';

import { ShopProduct, PlayerCurrencies, CurrencyType } from '@/lib/game/shop/types';
import { CurrencyService } from '@/lib/game/shop/currencyService';
import { getRarityStyle } from '@/components/ui/item-tooltip';
import { cn } from '@/lib/util/utils';
import { Sparkles, Lock, Check, Clock } from 'lucide-react';

interface ProductCardProps {
  product: ShopProduct;
  currencies: PlayerCurrencies;
  viewMode?: 'grid' | 'list';
  showDiscount?: boolean;
  onSelect: () => void;
  onQuickBuy?: () => void;
}

export function ProductCard({
  product,
  currencies,
  viewMode = 'grid',
  showDiscount = true,
  onSelect,
  onQuickBuy,
}: ProductCardProps) {
  const canAfford = CurrencyService.canAfford(currencies, product.price);
  const isSoldOut = product.purchaseLimit && product.purchased >= product.purchaseLimit.limit;
  const canPurchase = canAfford && !isSoldOut && product.unlocked;
  const remaining = product.purchaseLimit
    ? product.purchaseLimit.limit - product.purchased
    : Infinity;

  const currencyInfo = CurrencyService.getCurrencyInfo(product.price.type);

  // 商品类型显示名称
  const typeDisplay: Record<string, string> = {
    item: '物品',
    technique: '功法',
    equipment: '装备',
    fragment: '碎片',
    special: '特殊',
  };

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all',
          canPurchase ? 'hover:border-primary/50 hover:bg-muted/30' : 'opacity-60 cursor-not-allowed',
          isSoldOut && 'opacity-30',
          getRarityStyle(product.definition.rarity, 'border')
        )}
        onClick={() => canPurchase && onSelect()}
      >
        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium truncate', getRarityStyle(product.definition.rarity, 'text'))}>
              {product.definition.name}
            </span>
            {product.discount && showDiscount && (
              <span className="px-1 text-[10px] bg-red-500/20 text-red-500 rounded">
                -{product.discount.value}%
              </span>
            )}
            {isSoldOut && (
              <span className="px-1 text-[10px] bg-muted text-muted-foreground rounded">
                已售罄
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {product.definition.description}
          </div>
        </div>

        {/* 价格和限购 */}
        <div className="flex items-center gap-3 shrink-0">
          {product.purchaseLimit && (
            <span className="text-[10px] text-muted-foreground">
              {product.purchased}/{product.purchaseLimit.limit}
            </span>
          )}
          <div className={cn('flex items-center gap-1 text-sm font-medium', currencyInfo.colorClass)}>
            <span>{currencyInfo.icon}</span>
            <span>{product.price.amount}</span>
          </div>
        </div>
      </div>
    );
  }

  // 网格视图
  return (
    <div
      className={cn(
        'relative p-2 rounded-lg border cursor-pointer transition-all',
        canPurchase ? 'hover:border-primary/50 hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed',
        isSoldOut && 'opacity-30',
        getRarityStyle(product.definition.rarity, 'border'),
        getRarityStyle(product.definition.rarity, 'bg')
      )}
      onClick={() => canPurchase && onSelect()}
    >
      {/* 折扣标签 */}
      {product.discount && showDiscount && (
        <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded shadow-sm">
          -{product.discount.value}%
        </div>
      )}

      {/* 已售罄遮罩 */}
      {isSoldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <span className="text-xs text-muted-foreground">已售罄</span>
        </div>
      )}

      {/* 未解锁遮罩 */}
      {!product.unlocked && !isSoldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* 商品内容 */}
      <div className="text-center">
        {/* 商品名称 */}
        <div className={cn(
          'text-[11px] font-medium truncate',
          getRarityStyle(product.definition.rarity, 'text')
        )}>
          {product.definition.name}
        </div>

        {/* 价格 */}
        <div className="flex items-center justify-center gap-0.5 mt-1">
          {product.originalPrice && (
            <span className="line-through text-[9px] text-muted-foreground mr-1">
              {product.originalPrice}
            </span>
          )}
          <span className={cn('text-[10px] font-medium', currencyInfo.colorClass)}>
            {currencyInfo.icon} {product.price.amount}
          </span>
        </div>

        {/* 限购信息 */}
        {product.purchaseLimit && (
          <div className={cn(
            'flex items-center justify-center gap-1 mt-1 text-[9px]',
            remaining <= 1 ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {remaining > 0 ? (
              <>
                <Clock className="w-2.5 h-2.5" />
                <span>{product.purchased}/{product.purchaseLimit.limit}</span>
              </>
            ) : (
              <Check className="w-2.5 h-2.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 商品空状态 */
export function ProductEmptyState({ message = '暂无商品' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Sparkles className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

/** 商店锁定状态 */
export function ShopLockedState({ 
  icon, 
  name, 
  unlockDescription 
}: { 
  icon: string; 
  name: string; 
  unlockDescription: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3 opacity-50">{icon}</div>
      <div className="text-lg font-medium mb-1">{name}</div>
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <Lock className="w-3 h-3" />
        {unlockDescription}
      </div>
    </div>
  );
}
