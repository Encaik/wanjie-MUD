/**
 * AdventurePage — 机缘面板页面
 *
 * 调用 useAdventure + useBattle，渲染难度选择/探索网格/战利品面板。
 */

'use client';

import { LogOut } from 'lucide-react';

import { AdventurePanel } from '@/modules/exploration/components/AdventurePanel';
import { getRealmName } from '@/modules/progression/data/realmData';
import { AdventureLootPanel } from '@/shared/components/AdventureLootPanel';
import { Button } from '@/shared/ui/actions/button';
import { openDialog } from '@/views/game/dialogs/useDialogController';
import { useAdventure } from '@/views/game/domainHooks/useAdventure';
import { DifficultySelect } from '@/views/game/navigation/DifficultySelect';
import { useGameStore } from '@/views/game/state/GameStore';

export function AdventurePage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const adventure = useAdventure();

  if (gameState.adventurePhase === 'select') {
    return (
      <DifficultySelect
        difficulties={adventure.getAvailableDifficulties()}
        playerLevel={p.level}
        playerRealm={getRealmName(p.world.realmSystem, p.level)}
        worldType={p.world.type}
        onSelect={adventure.startAdventure}
        onQuickSweep={adventure.quickSweep}
        protagonist={p}
        totalBossKilled={gameState.statistics.totalBossKilled}
        clearedDifficulties={gameState.statistics.clearedDifficulties || []}
      />
    );
  }

  return (
    <div className="space-y-3">
      <AdventurePanel
        grid={gameState.adventureGrid}
        position={gameState.adventurePosition}
        config={gameState.adventureConfig}
        adventureSession={gameState.adventureSession}
        isBattling={!!gameState.activeBattle}
        onStart={() => {}}
        onMove={adventure.moveInAdventure}
        onExit={() => openDialog('exitAdventure')}
        onForceExit={() => adventure.exitAdventure('completed')}
        worldType={p.world.type}
      />
      <AdventureLootPanel
        loot={gameState.adventureLoot || []}
        experience={gameState.adventureExperience || 0}
        worldType={p.world.type}
      />
      <Button variant="outline" className="w-full h-9 text-xs" onClick={() => openDialog('exitAdventure')}>
        <LogOut className="w-4 h-4 mr-1.5" />退出机缘
      </Button>
    </div>
  );
}
