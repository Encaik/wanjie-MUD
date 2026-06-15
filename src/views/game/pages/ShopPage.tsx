/**
 * ShopPage — 商店面板页面
 *
 * 调用 useShop，渲染商店面板。
 */

'use client';

import { ShopPanel } from '@/modules/economy/components/ShopPanel';
import { useShop } from '@/views/game/domainHooks/useShop';
import { useGameStore } from '@/views/game/state/GameStore';

export function ShopPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const shop = useShop();

  return (
    <ShopPanel
      inventory={p.inventory}
      worldType={p.world.type}
      playerLevel={p.level}
      realm={p.realm}
      currencies={{
        spirit_stone: p.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity || 0,
        contribution: p.currencies?.contribution ?? 0,
        sect_point: p.currencies?.sect_point ?? 0,
        honor: p.currencies?.honor_point ?? 0,
        ascension_mark: p.currencies?.ascension_mark ?? 0,
        event_token: p.currencies?.event_token ?? 0,
      }}
      factionId={p.factionProgress?.factionId}
      factionRank={p.factionProgress?.rank}
      onBuy={shop.buyShopItem}
    />
  );
}
