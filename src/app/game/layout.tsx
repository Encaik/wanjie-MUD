/**
 * Game Layout — 游戏主界面共享布局
 *
 * 组合 Header + LeftSidebar + GameMenu + {children} + RightSidebar + DialogLayer。
 * 只调用全局基础设施 Hook 和弹窗层需要的领域 Hook。
 * 各功能面板的路由页面通过 {children} 渲染。
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { checkRankPromotion } from '@/core/engine';
import type { MentalState } from '@/core/types';
import { DEFAULT_PROTAGONIST_EXTENSION, getFinalStats } from '@/core/types';
import { BattleDialog } from '@/modules/combat/components/BattleDialog';
import { getFactionById } from '@/modules/faction/data/factionData';
import { getCurrencyAmount } from '@/modules/item/logic';
import { CultivationPathSelect } from '@/modules/progression/components/CultivationPathSelect';
import { CriticalHealthOverlay } from '@/shared/components/CriticalHealthOverlay';
import { DeathDialog } from '@/shared/components/DeathDialog';
import { DialogLayer } from '@/views/game/dialogs/DialogLayer';
import { openDialog } from '@/views/game/dialogs/useDialogController';
import { useAdventure } from '@/views/game/domainHooks/useAdventure';
import { useAscension } from '@/views/game/domainHooks/useAscension';
import { useDevMode } from '@/views/game/domainHooks/useDevMode';
import { useEquipment } from '@/views/game/domainHooks/useEquipment';
import { useFaction } from '@/views/game/domainHooks/useFaction';
import { useGameActions } from '@/views/game/domainHooks/useGameActions';
import { useSaveLoad } from '@/views/game/domainHooks/useSaveLoad';
import { useGameSystems } from '@/views/game/hooks/useGameSystems';
import { GameHeader } from '@/views/game/layout/GameHeader';
import { LeftSidebar } from '@/views/game/layout/LeftSidebar';
import { MobileLayout } from '@/views/game/layout/MobileLayout';
import { RightSidebar } from '@/views/game/layout/RightSidebar';
import { GameMenu } from '@/views/game/navigation/GameMenu';
import { SettingsPanel } from '@/views/game/settings/SettingsPanel';
import { useGameStore } from '@/views/game/state/GameStore';

function getResourceName(worldType: string): string { const names: Record<string,string> = { '修仙': '灵石', '高武': '武晶', '科幻': '能量块', '魔法': '魔晶', '异能': '源能石', '仙界': '仙石', '武侠': '银两', '末世': '补给点' }; return names[worldType] || '灵石'; }
export default function GameLayout({ children }: { children: React.ReactNode }) {
  useGameSystems();

  const { gameState } = useGameStore();
  const router = useRouter();
  const protagonist = gameState.protagonist;

  // 弹窗层需要的领域 Hook（必须在条件判断前调用）
  const adventure = useAdventure();
  const ascension = useAscension();
  const equipment = useEquipment();
  const dev = useDevMode();
  const faction = useFaction();
  const saveLoad = useSaveLoad();
  const gameActions = useGameActions();
  const ascensionBattleEndedRef = useRef(false);

  // 本地 UI 状态
  const [mentalState, setMentalState] = useState<MentalState>(
    DEFAULT_PROTAGONIST_EXTENSION.mentalState,
  );
  const [showSettings, setShowSettings] = useState(false);

  // 同步 mentalState（必须在条件返回前调用）
  useEffect(() => {
    if (protagonist?.mentalState) setMentalState(protagonist.mentalState);
  }, [protagonist?.mentalState]);

  // 顶栏数据（必须在条件返回前调用）
  const activeStatus = useMemo(() => {
    if (gameState.autoCultivating) return '自动修炼中';
    if (gameState.crafting) return '炼丹中';
    if (gameState.forging) return '炼器中';
    return null;
  }, [gameState.autoCultivating, gameState.crafting, gameState.forging]);

  const spiritStones = useMemo(
    () => protagonist ? getCurrencyAmount(protagonist.items, 'wanjie:common:spirit_stone') : 0,
    [protagonist?.items],
  );

  const currencyName = useMemo(
    () => protagonist ? getResourceName(protagonist.world.type) : '灵石',
    [protagonist?.world.type],
  );

  // 如果主角为空（如重开后），重定向到世界选择页
  useEffect(() => {
    if (!protagonist) {
      router.replace('/world-select');
    }
  }, [protagonist, router]);

  // protagonist 为空时渲染加载态（等待重定向）
  if (!protagonist) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">正在返回世界选择...</p>
        </div>
      </div>
    );
  }

  // 状态提示点（依赖 protagonist，放在条件返回之后以使用非空类型）
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
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-2">
          <GameHeader
            world={{ name: protagonist.world.name, type: protagonist.world.type }}
            spiritStones={spiritStones}
            currencyName={currencyName}
            timeSystem={gameState.time}
            activeStatus={activeStatus}
            onSettings={() => setShowSettings(true)}
          />
        </div>
      </header>

      {/* 移动端 */}
      <MobileLayout
        protagonist={protagonist} cultivationPath={protagonist.cultivationPath}
        pathLevel={protagonist.pathLevel} pathExp={protagonist.pathExp}
        mentalState={mentalState} battleState={gameState.battleState}
        onReset={() => openDialog('resetConfirm')}
        onExportSave={saveLoad.exportSave} onImportSave={saveLoad.importSave}
        onCloseResult={adventure.clearLastResult} TabsContentSection={children}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MobileLayout 类型与 protagonist 技术类型不完全匹配，与旧 GameLayout 保持一致
        playerTechniques={protagonist.equippedAttackTechniques.filter(Boolean) as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MobileLayout playerWeapons 类型与旧 GameLayout 保持一致
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
            {/* 顶部标签菜单（均分空间，"更多"内联展开） */}
            <GameMenu statusDots={statusDots} />
            {/* 路由驱动的内容区域 */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 mt-2">
              {children}
            </div>
          </div>
          <div className="col-span-3 h-full overflow-hidden">
            <RightSidebar
              messages={gameState.messages} totalMessageCount={gameState.totalMessageCount}
            />
          </div>
        </div>
      </main>

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DialogLayer devHandlers 类型较复杂，与旧 GameLayout 保持一致
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
    </div>
  );
}
