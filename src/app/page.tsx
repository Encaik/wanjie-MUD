'use client';

// 游戏主页面 - 扩展系统已集成
import { useEffect, useState } from 'react';
import { GameProvider, useGame } from '@/hooks/useGameState';
import { StartScreen } from '@/components/pages/home/StartScreen';
import { CharacterSelect } from '@/components/pages/character-select/CharacterSelect';
import { WorldSelect } from '@/components/pages/world-select/WorldSelect';
import { BackstoryView } from '@/components/pages/backstory/BackstoryView';
import { MainGame } from '@/components/game/layout';
import { OfflineRewardDialog, OfflineProcessResultV2 } from '@/components/game/dialogs';
import { DungeonConfig, MessageRecord } from '@/lib/game/types';

function GameContent() {
  const {
    gameState,
    startNewGame,
    refreshCharacters,
    selectCharacter,
    selectWorld,
    confirmBackstory,
    performCultivation,
    performRest,
    performSeclusion,
    startExperience,
    handleEventChoice,
    startAdventure,
    quickSweep,
    moveInAdventure,
    exitAdventure,
    clearLastResult,
    setCurrentTab,
    useItem,
    addMessage,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMessages,
    getAvailableDifficulties,
    resetGame,
    toggleAutoCultivation,
    equipTechnique,
    unequipTechnique,
    equipEquipment,
    unequipEquipment,
    updateTechnique,
    updateEquipment,
    buyShopItem,
    startCrafting,
    finishCrafting,
    startForging,
    finishForging,
    performUpgradeTechnique,
    performUpgradeEquipment,
    joinFaction,
    leaveFaction,
    claimTaskReward,
    claimDailySalary,
    acceptTask,
    submitTask,
    refreshTasks,
    donate,
    promoteRank,
    performTribulation,
    exportSave,
    synthesizeFragment,
    importSave,
    claimAchievementReward,
    selectCultivationPath,
    clearOfflineResult,
    clearNoviceCompletionDialog,
    clearTutorialCompletionDialog,
    clearDeathState,
    // 交互式战斗
    handleBattleEnd,
    toggleAutoBattle,
    // 飞升系统相关
    challengeGuardian,
    onAscensionBattleEnd,
    onInheritanceConfirm,
    onInheritanceSkip,
    onWorldConfirm,
    onWorldReroll,
    // 开发者模式相关
    devInvincible,
    onToggleDevInvincible,
    devHandlers,
    // 爬塔系统
    challengeTower,
  } = useGame();

  // 客户端挂载状态，避免 hydration 不匹配
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // 服务端渲染时显示加载状态，避免 hydration 不匹配
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // 根据游戏阶段渲染不同界面
  switch (gameState.phase) {
    case 'character-select':
      if (gameState.characters.length === 0) {
        return <StartScreen onStart={startNewGame} onImportSave={importSave} />;
      }
      return (
        <CharacterSelect 
          characters={gameState.characters} 
          onSelect={selectCharacter}
          onRefresh={refreshCharacters}
        />
      );

    case 'world-select':
      return (
        <WorldSelect 
          worlds={gameState.worlds} 
          onSelect={selectWorld} 
        />
      );

    case 'backstory':
      if (!gameState.protagonist) return null;
      return (
        <BackstoryView 
          backstory={gameState.protagonist.backstory} 
          onConfirm={confirmBackstory} 
        />
      );

    case 'playing':
      if (!gameState.protagonist) return null;
      return (
        <MainGame
          protagonist={gameState.protagonist}
          timeSystem={gameState.timeSystem}
          currentEvent={gameState.currentEvent}
          adventureGrid={gameState.adventureGrid}
          adventurePosition={gameState.adventurePosition}
          adventureConfig={gameState.adventureConfig}
          adventurePhase={gameState.adventurePhase}
          adventureSession={gameState.adventureSession}
          lastResult={gameState.lastActionResult}
          currentTab={gameState.currentTab}
          battleState={gameState.battleState}
          messages={gameState.messages}
          totalMessageCount={gameState.totalMessageCount}
          hasMoreMessages={hasMoreMessages}
          isLoadingMessages={isLoadingMessages}
          autoCultivating={gameState.autoCultivating}
          lastExploreTime={gameState.lastExploreTime}
          adventureLoot={gameState.adventureLoot}
          adventureExperience={gameState.adventureExperience}
          crafting={gameState.crafting}
          forging={gameState.forging}
          onCultivate={performCultivation}
          onRest={performRest}
          onSeclusion={performSeclusion}
          onExplore={startExperience}
          onChooseEvent={handleEventChoice}
          onStartAdventure={startAdventure}
          onQuickSweep={quickSweep}
          onMoveAdventure={moveInAdventure}
          onExitAdventure={exitAdventure}
          onCloseResult={clearLastResult}
          onTabChange={setCurrentTab}
          onUseItem={useItem}
          addMessage={addMessage}
          onLoadMoreMessages={loadMoreMessages}
          availableDifficulties={getAvailableDifficulties()}
          onReset={resetGame}
          onToggleAutoCultivation={toggleAutoCultivation}
          onEquipTechnique={equipTechnique}
          onUnequipTechnique={unequipTechnique}
          onEquipEquipment={equipEquipment}
          onUnequipEquipment={unequipEquipment}
          onUpdateTechnique={updateTechnique}
          onUpdateEquipment={updateEquipment}
          onBuyShopItem={buyShopItem}
          onStartCrafting={startCrafting}
          onFinishCrafting={finishCrafting}
          onStartForging={startForging}
          onFinishForging={finishForging}
          onUpgradeTechnique={performUpgradeTechnique}
          onUpgradeEquipment={performUpgradeEquipment}
          onJoinFaction={joinFaction}
          onLeaveFaction={leaveFaction}
          claimTaskReward={claimTaskReward}
          claimDailySalary={claimDailySalary}
          onAcceptTask={acceptTask}
          onSubmitTask={submitTask}
          onRefreshTasks={refreshTasks}
          onDonate={donate}
          onPromoteRank={promoteRank}
          onTribulation={performTribulation}
          onExportSave={exportSave}
          onImportSave={importSave}
          onSynthesizeFragment={synthesizeFragment}
          statistics={gameState.statistics}
          completedTutorialTaskIds={gameState.completedTutorialTaskIds || []}
          unlockedAchievementIds={gameState.unlockedAchievementIds}
          claimedAchievementIds={gameState.claimedAchievementIds}
          onClaimAchievementReward={claimAchievementReward}
          onSelectCultivationPath={selectCultivationPath}
          devInvincible={devInvincible}
          onToggleDevInvincible={onToggleDevInvincible}
          devHandlers={devHandlers}
          // 飞升系统相关
          onChallengeGuardian={challengeGuardian}
          onAscensionBattleEnd={onAscensionBattleEnd}
          onInheritanceConfirm={onInheritanceConfirm}
          onInheritanceSkip={onInheritanceSkip}
          onWorldConfirm={onWorldConfirm}
          onWorldReroll={onWorldReroll}
          ascensionFlow={gameState.ascensionFlow}
          // 新手引导完成弹窗
          showNoviceCompletionDialog={gameState.showNoviceCompletionDialog}
          onCloseNoviceCompletionDialog={clearNoviceCompletionDialog}
          // 新手任务全部完成弹窗
          showTutorialCompletionDialog={gameState.showTutorialCompletionDialog}
          onCloseTutorialCompletionDialog={clearTutorialCompletionDialog}
          // 死亡状态
          deathState={gameState.deathState}
          onClearDeathState={clearDeathState}
          // 交互式战斗
          activeBattle={gameState.activeBattle}
          autoBattle={gameState.autoBattle}
          onBattleEnd={handleBattleEnd}
          onToggleAutoBattle={toggleAutoBattle}
          // 爬塔系统
          onChallengeTower={challengeTower}
        />
      );

    default:
      return <StartScreen onStart={startNewGame} />;
  }
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
      <OfflineRewardDialogHandler />
    </GameProvider>
  );
}

// 离线奖励弹窗处理器
function OfflineRewardDialogHandler() {
  const { gameState, applyOfflineRewards } = useGame();
  // 使用新的离线结果
  return (
    <OfflineRewardDialog 
      offlineResult={gameState.offlineResultV2 || null}
      onClose={applyOfflineRewards} 
    />
  );
}
