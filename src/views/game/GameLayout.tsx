/**
 * GameLayout — 游戏主页面布局
 *
 * 组合 Header + LeftSidebar + CenterArea（PanelNav + PanelContent + WanjiePanel）+ RightSidebar + DialogLayer。
 * 使用领域 Hook 获取数据和 action，向子组件透传 props。
 */

'use client';

import { useEffect, useRef, useState } from 'react';

import { checkRankPromotion } from '@/core/engine';
import { DEFAULT_PROTAGONIST_EXTENSION, getFinalStats } from '@/core/types';
import type { MentalState } from '@/core/types';
import type { GameState } from '@/core/types';

import { getFactionById } from '@/modules/faction/data/factionData';
import { getRealmName } from '@/modules/progression/data/realmData';
import type { Announcement } from '@/modules/social/announcementTypes';
import { AnnouncementContainer } from '@/modules/social/components';
import { createDefaultTowerProgress } from '@/modules/tower/logic/types';

import { BattleDialog } from '@/modules/combat/components/BattleDialog';
import { CultivationPathSelect } from '@/modules/progression/components/CultivationPathSelect';
import { CriticalHealthOverlay } from '@/shared/components/CriticalHealthOverlay';
import { DeathDialog } from '@/shared/components/DeathDialog';
import { useMultiplayerHttp } from '@/shared/lib/multiplayer/useMultiplayerHttp';

import { useGameSystems } from '@/views/game/hooks/useGameSystems';

import { DialogLayer } from './dialogs/DialogLayer';
import { GameHeader } from './layout/GameHeader';
import { useGameStore } from './state/GameStore';
import { LeftSidebar } from './layout/LeftSidebar';
import { MobileLayout } from './layout/MobileLayout';
import { PanelContent } from './navigation/PanelContent';
import { PanelNav } from './navigation/PanelNav';
import type { PanelId } from './navigation/PanelNav';
import { RightSidebar } from './layout/RightSidebar';
import { SettingsPanel } from './settings/SettingsPanel';
import { WanjiePanel } from './navigation/WanjiePanel';
import { useAdventure } from './domainHooks/useAdventure';
import { useAscension } from './domainHooks/useAscension';
import { useBattle } from './domainHooks/useBattle';
import { useCrafting } from './domainHooks/useCrafting';
import { useCultivation } from './domainHooks/useCultivation';
import { useDevMode } from './domainHooks/useDevMode';
import { useEquipment } from './domainHooks/useEquipment';
import { useFaction } from './domainHooks/useFaction';
import { useGameActions } from './domainHooks/useGameActions';
import { useInventory } from './domainHooks/useInventory';
import { useSaveLoad } from './domainHooks/useSaveLoad';
import { useShop } from './domainHooks/useShop';
import { openDialog } from './dialogs/useDialogController';

export function GameLayout() {
  useGameSystems();

  const { gameState } = useGameStore();
  const protagonist = gameState.protagonist!;

  // 领域 Hook
  const cultivation = useCultivation();
  const adventure = useAdventure();
  const equipment = useEquipment();
  const shop = useShop();
  const crafting = useCrafting();
  const ascension = useAscension();
  const battle = useBattle();
  const inventory = useInventory();
  const saveLoad = useSaveLoad();
  const gameActions = useGameActions();
  const faction = useFaction();
  const dev = useDevMode();

  // 本地 UI 状态
  const [mentalState, setMentalState] = useState<MentalState>(
    protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState,
  );
  const [showSettings, setShowSettings] = useState(false);
  const ascensionBattleEndedRef = useRef(false);
  const [activePanel, setActivePanel] = useState<PanelId | string>('cultivation');
  const [showWanjiePanel, setShowWanjiePanel] = useState(false);

  // 状态提示点
  const statusDots = {
    wanjieDot: !!gameState.crafting || !!gameState.forging,
    factionPromotion: (() => {
      if (protagonist.factionProgress && protagonist.factionId) {
        const f = getFactionById(protagonist.factionId);
        if (f) return checkRankPromotion(protagonist.factionProgress, f.type).canPromote;
      }
      return false;
    })(),
    cultivationAlert: gameState.autoCultivating,
  };

  // 多人游戏
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { leaderboards, onlineCount, setActiveMode } = useMultiplayerHttp({
    playerId: `player-${protagonist.character.id}`,
    playerName: protagonist.character.name,
    worldType: protagonist.world.type,
    level: protagonist.level,
    realm: getRealmName(protagonist.world.realmSystem, protagonist.level),
    combatPower: Math.floor(protagonist.level * 100 + (protagonist.maxHp || 100) + (protagonist.maxMp || 50)),
    statistics: {
      totalEnemiesKilled: gameState.statistics.totalEnemiesKilled || 0,
      totalBossKilled: gameState.statistics.totalBossKilled || 0,
      legendaryItems: gameState.statistics.legendaryItemsObtained || 0,
      adventuresCompleted: gameState.statistics.totalAdventuresCompleted || 0,
    },
    onAnnouncement: (a: Announcement) => setAnnouncements(prev => [a, ...prev].slice(0, 50)),
  });

  // 同步 mentalState
  useEffect(() => {
    if (protagonist.mentalState) setMentalState(protagonist.mentalState);
  }, [protagonist.mentalState]);

  // 面板内容
  const panelContent = (
    <PanelContent
      activePanel={activePanel}
      protagonist={protagonist}
      gameState={gameState}
      mentalState={mentalState}
      onMentalStateChange={setMentalState}
      onCultivate={cultivation.performCultivation}
      onRest={cultivation.performRest}
      onSeclusion={cultivation.performSeclusion}
      onToggleAutoCultivation={cultivation.toggleAutoCultivation}
      onChallengeGuardian={ascension.challengeGuardian}
      onTribulation={ascension.performTribulation}
      startAdventure={adventure.startAdventure}
      quickSweep={adventure.quickSweep}
      moveInAdventure={adventure.moveInAdventure}
      exitAdventure={adventure.exitAdventure}
      getAvailableDifficulties={adventure.getAvailableDifficulties}
      startExperience={adventure.startExperience}
      handleEventChoice={adventure.handleEventChoice}
      equipTechnique={equipment.equipTechnique}
      unequipTechnique={equipment.unequipTechnique}
      equipEquipment={equipment.equipEquipment}
      unequipEquipment={equipment.unequipEquipment}
      updateTechnique={equipment.updateTechnique}
      updateEquipment={equipment.updateEquipment}
      synthesizeFragment={equipment.synthesizeFragment}
      buyShopItem={shop.buyShopItem}
      startCrafting={crafting.startCrafting}
      finishCrafting={crafting.finishCrafting}
      startForging={crafting.startForging}
      finishForging={crafting.finishForging}
      joinFaction={faction.joinFaction}
      leaveFaction={faction.leaveFaction}
      acceptTask={faction.acceptTask}
      submitTask={faction.submitTask}
      refreshTasks={() => faction.refreshTasks() as any}
      claimDailySalary={faction.claimDailySalary}
      promoteRank={faction.promoteRank}
      donate={faction.donate}
      claimAchievementReward={faction.claimAchievementReward}
      challengeTower={battle.challengeTower}
      useItem={inventory.useItem}
    />
  );

  return (
    <div className="min-h-dvh md:h-dvh flex flex-col relative">
      {/* 顶部标题栏 */}
      <header className="shrink-0 z-10 relative border-b shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-card via-muted/80 to-card" />
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/20 rounded-tl-sm" aria-hidden="true" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/20 rounded-tr-sm" aria-hidden="true" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/15 rounded-bl-sm" aria-hidden="true" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/15 rounded-br-sm" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-4">
          <GameHeader protagonist={protagonist} timeSystem={gameState.time} mentalState={mentalState} onSettings={() => setShowSettings(true)} />
        </div>
      </header>

      {/* 移动端 */}
      <MobileLayout
        protagonist={protagonist} cultivationPath={protagonist.cultivationPath}
        pathLevel={protagonist.pathLevel} pathExp={protagonist.pathExp}
        mentalState={mentalState} battleState={gameState.battleState}
        onReset={() => openDialog('resetConfirm')}
        onExportSave={saveLoad.exportSave} onImportSave={saveLoad.importSave}
        onCloseResult={adventure.clearLastResult} TabsContentSection={panelContent}
        playerTechniques={protagonist.equippedAttackTechniques.filter(Boolean) as any[]}
        playerWeapons={{ melee: protagonist.equippedMelee, ranged: protagonist.equippedRanged } as any}
      />

      {/* PC 三栏 */}
      <main className="hidden md:flex flex-1 min-h-0 max-w-7xl mx-auto w-full p-3">
        <div className="grid grid-cols-12 gap-3 h-full w-full">
          <div className="col-span-3 h-full overflow-hidden">
            <LeftSidebar
              protagonist={protagonist} cultivationPath={protagonist.cultivationPath}
              pathLevel={protagonist.pathLevel} pathExp={protagonist.pathExp} mentalState={mentalState}
              onReset={() => openDialog('resetConfirm')}
              onExportSave={saveLoad.exportSave} onImportSave={saveLoad.importSave}
            />
          </div>
          <div className="col-span-6 h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {panelContent}
            </div>
            <div className="shrink-0 pt-2">
              <PanelNav
                activePanel={activePanel === 'cultivation' || activePanel === 'adventure' || activePanel === 'faction' || activePanel === 'technique' || activePanel === 'shop' ? activePanel as PanelId : null}
                onPanelChange={(p) => setActivePanel(p)}
                onWanjieOpen={() => setShowWanjiePanel(true)}
                statusDots={statusDots}
              />
            </div>
          </div>
          <div className="col-span-3 h-full overflow-hidden">
            <RightSidebar
              protagonistId={protagonist.character.id} protagonistName={protagonist.character.name}
              protagonistLevel={protagonist.level} realmSystem={protagonist.world.realmSystem}
              messages={gameState.messages} totalMessageCount={gameState.totalMessageCount}
              leaderboards={leaderboards} onlineCount={onlineCount}
              announcements={announcements} setActiveMode={setActiveMode}
            />
          </div>
        </div>
      </main>

      {/* 万界盘 + 弹窗层 */}
      <WanjiePanel open={showWanjiePanel} onClose={() => setShowWanjiePanel(false)} onPanelSelect={(panel) => setActivePanel(panel)} />

      <CultivationPathSelect
        isOpen={false} onClose={() => {}}
        playerLevel={protagonist.level} playerStats={getFinalStats(protagonist.stats)}
        currentPath={protagonist.cultivationPath ?? null} worldType={protagonist.world.type}
        pathLevel={protagonist.pathLevel ?? 1}
        onSelectPath={(path) => { faction.selectCultivationPath(path); }}
      />

      <DialogLayer
        protagonist={protagonist}
        onReset={saveLoad.resetGame}
        onExitAdventure={adventure.exitAdventure}
        onUpgradeTechnique={equipment.performUpgradeTechnique}
        onUpgradeEquipment={equipment.performUpgradeEquipment}
        devInvincible={dev.devInvincible}
        onToggleDevInvincible={dev.onToggleDevInvincible}
        devHandlers={dev.devHandlers as any}
        onAscensionBattleEnd={ascension.onAscensionBattleEnd}
        onInheritanceConfirm={ascension.onInheritanceConfirm}
        onInheritanceSkip={ascension.onInheritanceSkip}
        onWorldConfirm={ascension.onWorldConfirm}
        onWorldReroll={ascension.onWorldReroll}
        ascensionBattleEndedRef={ascensionBattleEndedRef}
      />

      <CriticalHealthOverlay currentHp={protagonist.currentHp} maxHp={protagonist.maxHp} />
      <DeathDialog deathState={gameState.deathState} onClose={gameActions.clearDeathState} recoveryHp={gameState.deathState?.recoveryHp} />

      {/* 战斗弹窗 */}
      {gameState.activeBattle?.isActive && (gameState.adventureConfig || gameState.activeBattle.source === 'tower') && (() => {
        const bp = gameState.activeBattle.source === 'tower'
          ? { ...protagonist, currentHp: protagonist.maxHp, currentMp: protagonist.maxMp } : protagonist;
        return (
          <BattleDialog open={true}
            onOpenChange={(open) => { if (!open) adventure.handleBattleEnd({ victory: false, fled: true, playerHpAfter: protagonist.currentHp, playerMpAfter: protagonist.currentMp }); }}
            protagonist={bp} cellType={gameState.activeBattle.cellType}
            enemyContent={`${gameState.activeBattle.enemyName}(Lv.${gameState.activeBattle.enemyLevel})`}
            config={gameState.adventureConfig || { rows: 5, cols: 5, difficulty: gameState.activeBattle.enemyLevel, realmName: '试炼挑战', enemyLevelMin: gameState.activeBattle.enemyLevel, enemyLevelMax: gameState.activeBattle.enemyLevel, rewardMultiplier: 1, portalCount: 0 }}
            onBattleEnd={(result) => { adventure.handleBattleEnd({ victory: result.victory, fled: result.fled, playerHpAfter: result.playerHpAfter ?? protagonist.currentHp, playerMpAfter: result.playerMpAfter ?? protagonist.currentMp }); }}
            autoMode={gameState.autoBattle} onToggleAutoMode={adventure.toggleAutoBattle}
            devInvincible={dev.devInvincible} towerFloor={gameState.activeBattle.towerFloor}
            towerEnemy={gameState.activeBattle.towerEnemy} />
        );
      })()}

      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
      <AnnouncementContainer announcement={announcements[0]} maxVisible={3} maxQueue={10} position="top-right" />
    </div>
  );
}
