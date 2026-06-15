/**
 * CultivationPage — 修炼面板页面
 *
 * 调用 useCultivation + useInventory，渲染修炼/闭关/物品面板。
 */

'use client';

import { useState } from 'react';

import { getFinalStats, DEFAULT_PROTAGONIST_EXTENSION } from '@/core/types';
import type { MentalState } from '@/core/types';
import { InventoryPanel } from '@/modules/equipment/components/InventoryPanel';
import { CultivationPanel } from '@/modules/progression/components/CultivationPanel';
import { SeclusionPanel } from '@/modules/progression/components/SeclusionPanel';
import { openDialog } from '@/views/game/dialogs/useDialogController';
import { useCultivation } from '@/views/game/domainHooks/useCultivation';
import { useInventory } from '@/views/game/domainHooks/useInventory';
import { useGameStore } from '@/views/game/state/GameStore';

export function CultivationPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const cultivation = useCultivation();
  const inventory = useInventory();

  const [mentalState, setMentalState] = useState<MentalState>(
    p.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState,
  );

  return (
    <div className="space-y-3">
      <CultivationPanel
        onCultivate={cultivation.performCultivation}
        onRest={cultivation.performRest}
        onChallengeGuardian={() => {}} // 飞升相关由 layout 层 DialogLayer 处理
        worldType={p.world.type}
        inventory={p.inventory}
        activeEffects={p.activeEffects}
        experience={p.experience}
        overflowExperience={p.overflowExperience}
        level={p.level}
        currentHp={p.currentHp}
        maxHp={p.maxHp}
        currentMp={p.currentMp}
        maxMp={p.maxMp}
        autoCultivating={gameState.autoCultivating}
        onToggleAutoCultivation={cultivation.toggleAutoCultivation}
        luck={getFinalStats(p.stats).幸运}
        cultivationPath={p.cultivationPath}
        pathLevel={p.pathLevel}
        stats={getFinalStats(p.stats)}
        onSelectPath={() => openDialog('pathSelect')}
        onTribulation={() => {}} // 飞升相关
        mentalState={mentalState}
        onMentalStateChange={setMentalState}
        statistics={gameState.statistics}
        completedTutorialTaskIds={gameState.completedTutorialTaskIds || []}
      />
      <SeclusionPanel
        onSeclusion={cultivation.performSeclusion}
        disabled={gameState.autoCultivating}
        worldType={p.world.type}
        inventory={p.inventory}
        level={p.level}
      />
      <InventoryPanel
        inventory={p.inventory}
        activeEffects={p.activeEffects}
        onUseItem={inventory.useItem}
        worldType={p.world.type}
        className="min-h-[150px] max-h-[300px]"
      />
    </div>
  );
}
