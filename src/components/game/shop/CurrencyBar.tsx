/**
 * 货币栏组件
 * 
 * 横向展示玩家的所有货币（完整显示，带文本名称）
 */

'use client';

import { getResourceName } from '@/lib/game/items';
import { CurrencyService } from '@/lib/game/shop/currencyService';
import { PlayerCurrencies, CurrencyType, CURRENCY_CONFIGS } from '@/lib/game/shop/types';
import { WorldType } from '@/lib/game/types';
import { cn } from '@/utils';

interface CurrencyBarProps {
  currencies: PlayerCurrencies;
  worldType?: WorldType;
  compact?: boolean;
  className?: string;
}

/** 所有货币类型（按重要性排序） */
const ALL_CURRENCIES: CurrencyType[] = [
  'spirit_stone',
  'contribution',
  'sect_point',
  'honor',
  'ascension_mark',
  'event_token',
];

export function CurrencyBar({
  currencies,
  worldType,
  compact = false,
  className,
}: CurrencyBarProps) {
  const renderCurrency = (type: CurrencyType) => {
    const config = CURRENCY_CONFIGS[type];
    const amount = currencies[type] ?? 0;
    const formatted = CurrencyService.format(amount);
    const colorClass = CurrencyService.getColorClass(type);
    
    // 根据世界类型获取货币名称（主要是灵石类货币）
    const displayName = type === 'spirit_stone' && worldType 
      ? getResourceName(worldType) 
      : config.name;

    return (
      <div
        key={type}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50',
          compact ? 'text-[10px]' : 'text-xs'
        )}
        title={`${displayName}: ${amount.toLocaleString()}`}
      >
        <span>{config.icon}</span>
        <span className="text-muted-foreground whitespace-nowrap">{displayName}</span>
        <span className={cn('font-medium', colorClass)}>{formatted}</span>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {ALL_CURRENCIES.map(renderCurrency)}
    </div>
  );
}

/** 单个货币显示组件 */
export function CurrencyDisplay({
  type,
  amount,
  showName = false,
  size = 'normal',
}: {
  type: CurrencyType;
  amount: number;
  showName?: boolean;
  size?: 'small' | 'normal' | 'large';
}) {
  const config = CURRENCY_CONFIGS[type];
  const formatted = CurrencyService.format(amount);
  const colorClass = CurrencyService.getColorClass(type);

  const sizeClasses = {
    small: 'text-[10px]',
    normal: 'text-xs',
    large: 'text-sm',
  };

  return (
    <div
      className={cn('flex items-center gap-1', sizeClasses[size])}
      title={`${config.name}: ${amount.toLocaleString()}`}
    >
      <span>{config.icon}</span>
      {showName && <span className="text-muted-foreground">{config.name}:</span>}
      <span className={cn('font-medium', colorClass)}>{formatted}</span>
    </div>
  );
}
