/**
 * EquipmentPage — 装备面板页面
 *
 * 调用 useEquipment，渲染装备管理面板。
 */

'use client';

import { EquipmentPanel } from '@/modules/equipment/components/EquipmentPanel';
import { openDialog } from '@/views/game/dialogs/useDialogController';
import { useEquipment } from '@/views/game/domainHooks/useEquipment';
import { useGameStore } from '@/views/game/state/GameStore';

export function EquipmentPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const equipment = useEquipment();

  return (
    <EquipmentPanel
      equipments={p.equipments}
      equippedMelee={p.equippedMelee}
      equippedRanged={p.equippedRanged}
      equippedHead={p.equippedHead}
      equippedBody={p.equippedBody}
      equippedLegs={p.equippedLegs}
      equippedFeet={p.equippedFeet}
      onEquip={equipment.equipEquipment}
      onUnequip={equipment.unequipEquipment}
      onUpgrade={(e) => openDialog('upgrade', { item: e, type: 'equipment' })}
    />
  );
}
