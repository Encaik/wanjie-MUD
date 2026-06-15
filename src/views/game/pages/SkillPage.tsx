/**
 * SkillPage — 技能面板页面
 *
 * 调用 useEquipment，渲染技能管理面板。
 */

'use client';

import { SkillsTab } from '@/modules/techniques/components/SkillsTab';
import { useEquipment } from '@/views/game/domainHooks/useEquipment';
import { useGameStore } from '@/views/game/state/GameStore';

export function SkillPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const equipment = useEquipment();

  return (
    <SkillsTab
      techniques={p.techniques}
      equipments={p.equipments}
      equippedMelee={p.equippedMelee}
      equippedRanged={p.equippedRanged}
      activeTab={'technique'}
      onTabChange={() => {}}
      onTechniqueChange={equipment.updateTechnique}
      onEquipmentChange={equipment.updateEquipment}
    />
  );
}
