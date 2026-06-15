/**
 * FragmentPage — 碎片面板页面
 *
 * 调用 useEquipment，渲染碎片合成面板。
 */

'use client';

import { FragmentPanel } from '@/modules/equipment/components/FragmentPanel';
import { useEquipment } from '@/views/game/domainHooks/useEquipment';
import { useGameStore } from '@/views/game/state/GameStore';

export function FragmentPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const equipment = useEquipment();

  return (
    <FragmentPanel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fragmentInventory 类型较复杂，与旧 PanelContent 保持一致
      fragmentInventory={p.fragmentInventory ?? { techniques: {}, equipments: {} } as any}
      playerLevel={p.level}
      worldType={p.world.type}
      onSynthesize={(type, rarity, sourceName) => equipment.synthesizeFragment(type, rarity, sourceName)}
    />
  );
}
