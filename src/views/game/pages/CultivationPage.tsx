/**
 * CultivationPage — 修炼面板页面
 *
 * 组合 CultivationPanel + BreakthroughPanel + SeclusionPanel。
 * 管理心魔突破战流程对话框的打开/关闭。
 */

'use client';

import { useState, useCallback } from 'react';

import { getFinalStats, DEFAULT_PROTAGONIST_EXTENSION } from '@/core/types';
import type { MentalState } from '@/core/types';
import { CultivationPanel } from '@/modules/progression/components/CultivationPanel';
import { BreakthroughPanel } from '@/modules/progression/components/BreakthroughPanel';
import { BreakthroughFlowDialog } from '@/modules/progression/components/BreakthroughFlowDialog';
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

  // 突破对话框状态
  const [breakthroughOpen, setBreakthroughOpen] = useState(false);

  const handleOpenBreakthrough = useCallback(() => {
    setBreakthroughOpen(true);
  }, []);

  const handleBreakthroughComplete = useCallback((result: { success: boolean; chosenChoice: import('@/modules/progression/logic/demonBreakthrough').StrategyChoice | null }) => {
    // 通过 hook 执行突破结果，更新游戏状态
    cultivation.performBreakthrough(result.chosenChoice);
    setBreakthroughOpen(false);
  }, [cultivation]);

  return (
    <div className="space-y-3">
      <CultivationPanel
        onCultivate={cultivation.performCultivation}
        onRest={cultivation.performRest}
        worldType={p.world.type}
        worldviewId={p.world.worldviewId}
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
        activeEffects={p.activeEffects}
        worldType={p.world.type}
        autoCultivating={gameState.autoCultivating}
        mindShield={mentalState.mindShield ?? 0}
        onBreakthrough={handleOpenBreakthrough}
      />

      <SeclusionPanel
        onSeclusion={cultivation.performSeclusion}
        disabled={gameState.autoCultivating}
        worldType={p.world.type}
        worldviewId={p.world.worldviewId}
        items={p.items}
        level={p.level}
      />

      {/* 心魔突破战对话框 */}
      <BreakthroughFlowDialog
        open={breakthroughOpen}
        onOpenChange={setBreakthroughOpen}
        protagonist={p}
        mentalState={mentalState}
        onBreakthroughComplete={handleBreakthroughComplete}
      />
    </div>
  );
}
