/**
 * 商店Tab面板（兼容旧版接口）
 * 
 * 包装新版ShopPanel组件，提供向后兼容的接口
 */

'use client';

import { useMemo } from 'react';

import { ShopPanel as NewShopPanel } from '@/components/game/shop';
import { CurrencyService } from '@/lib/game/shop/currencyService';
import { PlayerCurrencies } from '@/lib/game/shop/types';
import { InventoryItem, WorldType } from '@/lib/game/types';

// ============================================
// Props 定义（兼容旧版）
// ============================================

interface ShopPanelProps {
  inventory: InventoryItem[];
  worldType: WorldType;
  playerLevel: number;
  realm: string;
  currencies: PlayerCurrencies;
  factionId?: string | null;
  factionRank?: string;
  hasAscended?: boolean;
  onBuy?: (
    itemId: string,
    price: number,
    currencyType: string,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity?: number,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => void;
}

// ============================================
// 组件实现
// ============================================

export function ShopPanel({
  inventory,
  worldType,
  playerLevel,
  realm,
  currencies,
  factionId,
  factionRank,
  hasAscended,
  onBuy,
}: ShopPanelProps) {
  // 验证货币数据
  const validatedCurrencies = useMemo(() => 
    CurrencyService.validate(currencies),
    [currencies]
  );

  return (
    <NewShopPanel
      playerLevel={playerLevel}
      realm={realm}
      currencies={validatedCurrencies}
      worldType={worldType}
      factionId={factionId}
      factionRank={factionRank}
      hasAscended={hasAscended}
      onBuy={onBuy}
    />
  );
}
