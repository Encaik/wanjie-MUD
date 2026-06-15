/**
 * PanelContent — 面板内容映射
 *
 * 根据 activePanel 渲染对应的功能面板。
 * 从 GameLayout 提取以控制文件大小（<300 行）。
 */

'use client';

import { LogOut } from 'lucide-react';

import { getFinalStats } from '@/core/types';
import type { MentalState, Protagonist } from '@/core/types';
import type { GameState } from '@/core/types';

import { AchievementPanel } from '@/modules/collection/components/AchievementPanel';
import { CollectionPanel } from '@/modules/collection/components/CollectionPanel';
import { StatisticsPanel } from '@/modules/collection/components/StatisticsPanel';
import { AlchemyPanel } from '@/modules/crafting/components/AlchemyPanel';
import { ForgePanel } from '@/modules/crafting/components/ForgePanel';
import { ShopPanel } from '@/modules/economy/components/ShopPanel';
import { EquipmentPanel } from '@/modules/equipment/components/EquipmentPanel';
import { FragmentPanel } from '@/modules/equipment/components/FragmentPanel';
import { InventoryPanel } from '@/modules/equipment/components/InventoryPanel';
import { AdventurePanel } from '@/modules/exploration/components/AdventurePanel';
import { FactionPanel } from '@/modules/faction/components/FactionPanel';
import { CultivationPanel } from '@/modules/progression/components/CultivationPanel';
import { SeclusionPanel } from '@/modules/progression/components/SeclusionPanel';
import { getRealmName } from '@/modules/progression/data/realmData';
import type { SeclusionType } from '@/modules/progression/logic/seclusion';
import { SkillsTab } from '@/modules/techniques/components/SkillsTab';
import { TechniquePanel } from '@/modules/techniques/components/TechniquePanel';
import { TowerPanel } from '@/modules/tower/components/TowerPanel';
import { createDefaultTowerProgress } from '@/modules/tower/logic/types';
import type { TowerEnemy } from '@/modules/tower/logic/types';
import type { Technique, Equipment, EquipmentSlot, TechniqueType, ItemRarity, CultivationPath } from '@/core/types';

import { AdventureLootPanel } from '@/shared/components/AdventureLootPanel';
import { Button } from '@/shared/ui/actions/button';

import { DifficultySelect } from './DifficultySelect';
import { openDialog } from './useDialogController';
import type { PanelId } from './PanelNav';

interface PanelContentProps {
  activePanel: PanelId | string;
  protagonist: Protagonist;
  gameState: GameState;
  mentalState: MentalState;
  onMentalStateChange: (state: MentalState) => void;
  // 领域 action — 由 GameLayout 传入（Phase 4 改为各 Panel 自取）
  onCultivate: () => void;
  onRest: () => void;
  onSeclusion: (type: SeclusionType) => void;
  onToggleAutoCultivation: () => void;
  onChallengeGuardian: () => void;
  onTribulation: () => void;
  // adventure
  startAdventure: (config: any) => void;
  quickSweep: (config: any) => void;
  moveInAdventure: (row: number, col: number) => void;
  exitAdventure: (exitType?: 'completed' | 'stamina_exhausted' | 'quit' | 'fled') => void;
  getAvailableDifficulties: () => any[];
  startExperience: () => void;
  handleEventChoice: (index: number) => void;
  // equipment
  equipTechnique: (t: Technique, slotIndex?: number) => void;
  unequipTechnique: (type: TechniqueType, slotIndex?: number) => void;
  equipEquipment: (e: Equipment) => void;
  unequipEquipment: (slot: EquipmentSlot) => void;
  updateTechnique: (t: Technique) => void;
  updateEquipment: (e: Equipment) => void;
  synthesizeFragment: (type: 'technique' | 'equipment', rarity: ItemRarity, sourceName?: string) => void;
  // shop
  buyShopItem: (...args: any[]) => void;
  // crafting
  startCrafting: (recipeId: string) => void;
  finishCrafting: () => void;
  startForging: (recipeId: string) => void;
  finishForging: () => void;
  // faction
  joinFaction: (factionId: string) => void;
  leaveFaction: () => void;
  acceptTask: (taskId: string, roundType: 'daily' | 'weekly') => { success: boolean; message: string };
  submitTask: (taskId: string, roundType: 'daily' | 'weekly') => { success: boolean; message: string };
  refreshTasks: () => void;
  claimDailySalary: () => { success: boolean; amount: number };
  promoteRank: () => { success: boolean; message: string };
  donate: (amount: number) => { success: boolean; message: string };
  claimAchievementReward: (achievementId: string) => void;
  // battle
  challengeTower: (floor: number, enemy: TowerEnemy) => void;
  // inventory
  useItem: (itemId: string) => void;
}

export function PanelContent({
  activePanel, protagonist, gameState, mentalState, onMentalStateChange,
  onCultivate, onRest, onSeclusion, onToggleAutoCultivation, onChallengeGuardian, onTribulation,
  startAdventure, quickSweep, moveInAdventure, exitAdventure, getAvailableDifficulties,
  startExperience, handleEventChoice,
  equipTechnique, unequipTechnique, equipEquipment, unequipEquipment,
  updateTechnique, updateEquipment, synthesizeFragment,
  buyShopItem,
  startCrafting, finishCrafting, startForging, finishForging,
  joinFaction, leaveFaction, acceptTask, submitTask, refreshTasks,
  claimDailySalary, promoteRank, donate, claimAchievementReward,
  challengeTower, useItem,
}: PanelContentProps) {
  const p = protagonist;
  const gs = gameState;

  switch (activePanel) {
    case 'cultivation':
      return (
        <div className="space-y-3">
          <CultivationPanel
            onCultivate={onCultivate} onRest={onRest}
            onChallengeGuardian={onChallengeGuardian} worldType={p.world.type}
            inventory={p.inventory} activeEffects={p.activeEffects}
            experience={p.experience} overflowExperience={p.overflowExperience}
            level={p.level} currentHp={p.currentHp} maxHp={p.maxHp}
            currentMp={p.currentMp} maxMp={p.maxMp}
            autoCultivating={gs.autoCultivating}
            onToggleAutoCultivation={onToggleAutoCultivation}
            luck={getFinalStats(p.stats).幸运} cultivationPath={p.cultivationPath}
            pathLevel={p.pathLevel} stats={getFinalStats(p.stats)}
            onSelectPath={() => openDialog('pathSelect')}
            onTribulation={onTribulation}
            mentalState={mentalState} onMentalStateChange={onMentalStateChange}
            statistics={gs.statistics} completedTutorialTaskIds={gs.completedTutorialTaskIds || []}
          />
          <SeclusionPanel onSeclusion={onSeclusion} disabled={gs.autoCultivating} worldType={p.world.type} inventory={p.inventory} level={p.level} />
          <InventoryPanel inventory={p.inventory} activeEffects={p.activeEffects} onUseItem={useItem} worldType={p.world.type} className="min-h-[150px] max-h-[300px]" />
        </div>
      );

    case 'adventure':
      return (
        <div className="space-y-3">
          {gs.adventurePhase === 'select' ? (
            <DifficultySelect
              difficulties={getAvailableDifficulties()} playerLevel={p.level}
              playerRealm={getRealmName(p.world.realmSystem, p.level)}
              worldType={p.world.type} onSelect={startAdventure}
              onQuickSweep={quickSweep} protagonist={p}
              totalBossKilled={gs.statistics.totalBossKilled}
              clearedDifficulties={gs.statistics.clearedDifficulties || []}
            />
          ) : (
            <>
              <AdventurePanel grid={gs.adventureGrid} position={gs.adventurePosition}
                config={gs.adventureConfig} adventureSession={gs.adventureSession}
                isBattling={!!gs.activeBattle} onStart={() => {}}
                onMove={moveInAdventure} onExit={() => openDialog('exitAdventure')}
                onForceExit={() => exitAdventure('completed')}
                worldType={p.world.type} />
              <AdventureLootPanel loot={gs.adventureLoot || []} experience={gs.adventureExperience || 0} worldType={p.world.type} />
              <Button variant="outline" className="w-full h-9 text-xs" onClick={() => openDialog('exitAdventure')}>
                <LogOut className="w-4 h-4 mr-1.5" />退出机缘
              </Button>
            </>
          )}
        </div>
      );

    case 'faction':
      return (
        <FactionPanel
          worldType={p.world.type} worldFactions={p.world.factions}
          currentFactionId={p.factionId} factionProgress={p.factionProgress}
          contribution={p.currencies?.contribution ?? 0}
          onJoinFaction={joinFaction} onLeaveFaction={leaveFaction}
          onAcceptTask={acceptTask} onSubmitTask={submitTask}
          onRefreshTasks={() => refreshTasks() as any}
          onClaimDailySalary={claimDailySalary} onPromoteRank={promoteRank}
          spiritStoneCount={p.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity ?? 0}
          onDonate={donate} currentEvent={gs.currentEvent}
          onExplore={startExperience} onChoose={handleEventChoice}
          playerLevel={p.level}
        />
      );

    case 'technique':
      return (
        <TechniquePanel techniques={p.techniques}
          equippedAttackTechniques={p.equippedAttackTechniques}
          equippedDefenseTechniques={p.equippedDefenseTechniques}
          onEquip={equipTechnique} onUnequip={unequipTechnique}
          onUpgrade={(t) => openDialog('upgrade', { item: t, type: 'technique' })}
          useGlobalState={false}
        />
      );

    case 'equipment':
      return (
        <EquipmentPanel equipments={p.equipments}
          equippedMelee={p.equippedMelee} equippedRanged={p.equippedRanged}
          equippedHead={p.equippedHead} equippedBody={p.equippedBody}
          equippedLegs={p.equippedLegs} equippedFeet={p.equippedFeet}
          onEquip={equipEquipment} onUnequip={unequipEquipment}
          onUpgrade={(e) => openDialog('upgrade', { item: e, type: 'equipment' })}
        />
      );

    case 'shop':
      return (
        <ShopPanel inventory={p.inventory} worldType={p.world.type} playerLevel={p.level} realm={p.realm}
          currencies={{
            spirit_stone: p.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity || 0,
            contribution: p.currencies?.contribution ?? 0,
            sect_point: p.currencies?.sect_point ?? 0,
            honor: p.currencies?.honor_point ?? 0,
            ascension_mark: p.currencies?.ascension_mark ?? 0,
            event_token: p.currencies?.event_token ?? 0,
          }}
          factionId={p.factionProgress?.factionId} factionRank={p.factionProgress?.rank}
          onBuy={buyShopItem}
        />
      );

    case 'alchemy':
      return (
        <AlchemyPanel inventory={p.inventory} playerLevel={p.level}
          crafting={gs.crafting} onStartCrafting={startCrafting} onFinishCrafting={finishCrafting} />
      );

    case 'forge':
      return (
        <ForgePanel inventory={p.inventory} playerLevel={p.level}
          forging={gs.forging} onStartForging={startForging} onFinishForging={finishForging} />
      );

    case 'skill':
      return (
        <SkillsTab techniques={p.techniques} equipments={p.equipments}
          equippedMelee={p.equippedMelee} equippedRanged={p.equippedRanged}
          activeTab={'technique'} onTabChange={() => {}}
          onTechniqueChange={updateTechnique} onEquipmentChange={updateEquipment} />
      );

    case 'fragment':
      return (
        <FragmentPanel fragmentInventory={p.fragmentInventory ?? { techniques: {}, equipments: {} } as any}
          playerLevel={p.level} worldType={p.world.type}
          onSynthesize={(type, rarity, sourceName) => synthesizeFragment(type, rarity, sourceName)} />
      );

    case 'tower':
      return (
        <TowerPanel towerProgress={p.towerProgress ?? createDefaultTowerProgress()}
          playerLevel={p.level} worldBalanceStats={p.world.worldStats}
          currentHp={p.currentHp} maxHp={p.maxHp} currentMp={p.currentMp} maxMp={p.maxMp}
          currentStamina={p.stamina ?? 100} maxStamina={p.maxStamina ?? 100}
          disabled={false} onChallenge={(floor, enemy) => challengeTower(floor, enemy)} />
      );

    case 'achievement':
      return (
        <AchievementPanel statistics={gs.statistics} unlockedAchievementIds={gs.unlockedAchievementIds}
          claimedAchievementIds={gs.claimedAchievementIds} onClaimReward={claimAchievementReward} />
      );

    case 'collection':
      return <CollectionPanel techniques={p.techniques} equipments={p.equipments} statistics={gs.statistics} />;

    case 'statistics':
      return <StatisticsPanel statistics={gs.statistics} protagonist={p} />;

    default:
      return null;
  }
}
