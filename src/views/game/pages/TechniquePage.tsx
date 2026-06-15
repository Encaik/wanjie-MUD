/**
 * TechniquePage — 功法面板页面
 *
 * 调用 useEquipment，渲染功法管理面板。
 */

'use client';

import { TechniquePanel } from '@/modules/techniques/components/TechniquePanel';
import { openDialog } from '@/views/game/dialogs/useDialogController';
import { useEquipment } from '@/views/game/domainHooks/useEquipment';
import { useGameStore } from '@/views/game/state/GameStore';

export function TechniquePage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const equipment = useEquipment();

  return (
    <TechniquePanel
      techniques={p.techniques}
      equippedAttackTechniques={p.equippedAttackTechniques}
      equippedDefenseTechniques={p.equippedDefenseTechniques}
      onEquip={equipment.equipTechnique}
      onUnequip={equipment.unequipTechnique}
      onUpgrade={(t) => openDialog('upgrade', { item: t, type: 'technique' })}
      useGlobalState={false}
    />
  );
}
