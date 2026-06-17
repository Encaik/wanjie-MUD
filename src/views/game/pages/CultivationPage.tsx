/**
 * CultivationPage — 修炼面板页面
 *
 * 组合 CultivationPanel + BreakthroughPanel + SeclusionPanel。
 * 新手引导任务已迁移至 QuestPage，背包已迁移至 BackpackPage。
 */

'use client';

import { useState } from 'react';

import { getFinalStats, DEFAULT_PROTAGONIST_EXTENSION } from '@/core/types';
import type { MentalState } from '@/core/types';
import { CultivationPanel } from '@/modules/progression/components/CultivationPanel';
import { BreakthroughPanel } from '@/modules/progression/components/BreakthroughPanel';
import { SeclusionPanel } from '@/modules/progression/components/SeclusionPanel';
import { openDialog } from '@/views/game/dialogs/useDialogController';
import { useCultivation } from '@/views/game/domainHooks/useCultivation';
import { useGameStore } from '@/views/game/state/GameStore';

export function CultivationPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const cultivation = useCultivation();

  const [mentalState, setMentalState] = useState<MentalState>(
    p.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState,
  );

  return (
    <div className="space-y-3">
      <CultivationPanel
        onCultivate={cultivation.performCultivation}
        onRest={cultivation.performRest}
        worldType={p.world.type}
        items={p.items}
        activeEffects={p.activeEffects}
        experience={p.experience}
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
        mentalState={mentalState}
        onMentalStateChange={setMentalState}
      />
      <BreakthroughPanel
        level={p.level}
        experience={p.experience}
        overflowExperience={p.overflowExperience}
        luck={getFinalStats(p.stats).幸运}
        activeEffects={p.activeEffects}
        worldType={p.world.type}
        autoCultivating={gameState.autoCultivating}
        hpFull={p.currentHp >= p.maxHp}
        mpFull={p.currentMp >= p.maxMp}
        onTribulation={() => {}}
        onChallengeGuardian={() => {}}
      />
      <SeclusionPanel
        onSeclusion={cultivation.performSeclusion}
        disabled={gameState.autoCultivating}
        worldType={p.world.type}
        items={p.items}
        level={p.level}
      />
    </div>
  );
}
