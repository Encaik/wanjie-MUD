/**
 * 游戏页面入口组件
 * 
 * 使用新的模块化架构重构
 * 
 * 架构说明:
 * - 布局: GameLayout 提供三栏布局（左信息、中功能、右消息）
 * - 功能模块: 各 Tab 功能从 features/ 目录导入
 * - 共享组件: 从 components/shared/ 导入
 */

'use client';

import { useState, useEffect } from 'react';
import { Protagonist, ActionTab, BattleState, DungeonConfig, Technique, TechniqueType, Equipment, EquipmentSlot, ItemDefinition, CraftingState, ForgingState, GameStatistics, CultivationPath, MessageRecord, getFinalStats } from '@/lib/game/types';
import { TimeSystemState } from '@/lib/game/timeSystem';
import { StatusPanel } from '@/components/game/sidebar';
import { MessagePanel } from '@/components/game/shared';
import { BattleResultDialog, BattleDialog } from '@/components/game/battle';
import { GameLayout, GameHeader } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Swords, Sparkles, Building2, RotateCcw, AlertTriangle, Zap, Shield, ShoppingBag, Trophy, BookOpen, LogOut, BarChart3, FlaskConical, Anvil } from 'lucide-react';
import { AlchemyRecipe, PillQuality } from '@/lib/data/alchemyRecipes';
import { ForgeRecipe, EquipmentQuality } from '@/lib/data/forgeRecipes';
import { MentalState, DEFAULT_PROTAGONIST_EXTENSION } from '@/lib/game/typesExtension';

// 直接导入功能面板组件（渐进式迁移）
import { 
  CultivationPanel, 
  SeclusionPanel,
  FactionPanel, 
  AdventurePanel, 
  ShopPanel, 
  TechniquePanel, 
  EquipmentPanel, 
  AchievementPanel, 
  CollectionPanel,
  CultivationPathSelect,
  UpgradePanel,
  StatisticsPanel,
  AlchemyPanel,
  ForgePanel
} from '@/components/game/tabs';

// Tab 配置 - 双行布局
const TAB_CONFIG_ROW1 = [
  { value: 'cultivation', icon: Sparkles, label: '修炼' },
  { value: 'technique', icon: Zap, label: '功法' },
  { value: 'equipment', icon: Shield, label: '装备' },
  { value: 'alchemy', icon: FlaskConical, label: '炼丹' },
  { value: 'forge', icon: Anvil, label: '炼器' },
] as const;

const TAB_CONFIG_ROW2 = [
  { value: 'adventure', icon: Swords, label: '机缘' },
  { value: 'experience', icon: Building2, label: '势力' },
  { value: 'shop', icon: ShoppingBag, label: '商店' },
  { value: 'achievement', icon: Trophy, label: '成就' },
  { value: 'collection', icon: BookOpen, label: '图鉴' },
  { value: 'statistics', icon: BarChart3, label: '统计' },
] as const;

interface GamePageProps {
  protagonist: Protagonist;
  timeSystem?: TimeSystemState | null;
  currentEvent: any;
  adventureGrid: any;
  adventurePosition: any;
  adventureConfig: DungeonConfig | null;
  adventurePhase: 'select' | 'playing';
  lastResult: any;
  currentTab: ActionTab;
  battleState: BattleState | null;
  messages: MessageRecord[];
  totalMessageCount?: number;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
  autoCultivating: boolean;
  lastExploreTime: number;
  adventureLoot?: any[];
  crafting: CraftingState | null;
  forging: ForgingState | null;
  statistics: GameStatistics;
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  availableDifficulties: DungeonConfig[];
  // 回调函数
  onCultivate: () => void;
  onRest: () => void;
  onSeclusion?: (type: 'minor' | 'major' | 'legendary') => void;
  onExplore: () => void;
  onChooseEvent: (index: number) => void;
  onStartAdventure: (config: DungeonConfig) => void;
  onQuickSweep?: (config: DungeonConfig) => void;
  onMoveAdventure: (row: number, col: number) => void;
  onExitAdventure: (isCompleted?: boolean) => void;
  onCloseResult: () => void;
  onTabChange: (tab: ActionTab) => void;
  onUseItem: (itemId: string) => void;
  addMessage: (type: MessageRecord['type'], title: string, content: string, details?: string, rewards?: MessageRecord['rewards']) => void;
  onLoadMoreMessages?: () => Promise<boolean>;
  onReset: () => void;
  onToggleAutoCultivation: () => void;
  onEquipTechnique: (technique: Technique, slotIndex?: number) => void;
  onUnequipTechnique: (type: TechniqueType, slotIndex?: number) => void;
  onEquipEquipment: (equipment: Equipment) => void;
  onUnequipEquipment: (slot: EquipmentSlot) => void;
  onBuyShopItem: (
    itemId: string,
    price: number,
    currencyType: string,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity?: number,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => void;
  onBuyWithContribution?: (itemId: string, price: number) => void;
  onStartCrafting: (recipeId: string, duration: number, quality: PillQuality, success: boolean) => void;
  onFinishCrafting: (recipe: AlchemyRecipe, quality: PillQuality, success: boolean) => void;
  onStartForging: (recipeId: string, duration: number, quality: EquipmentQuality, success: boolean) => void;
  onFinishForging: (recipe: ForgeRecipe, quality: EquipmentQuality, success: boolean) => void;
  onUpgradeTechnique: (targetId: string, materialIds: string[]) => void;
  onUpgradeEquipment: (targetId: string, materialIds: string[]) => void;
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: () => void;
  onExportSave: () => string;
  onImportSave: (jsonString: string) => void;
  onClaimAchievementReward?: (achievementId: string) => void;
  onSelectCultivationPath?: (path: CultivationPath) => void;
  claimTaskReward?: (taskId: string) => { success: boolean; message: string };
  claimDailySalary?: () => { success: boolean; amount: number };
  onAcceptTask?: (taskId: string) => { success: boolean; message: string };
  onSubmitTask?: (taskId: string) => { success: boolean; message: string };
  onRefreshTasks?: () => { success: boolean; message: string };
  onDonate?: (amount: number) => { success: boolean; message: string };
  // 交互式战斗
  activeBattle?: import('@/lib/game/types').ActiveBattleState | null;
  autoBattle?: boolean;
  onBattleEnd?: (result: { victory: boolean; fled?: boolean; playerHpAfter: number; playerMpAfter?: number }) => void;
  onToggleAutoBattle?: () => void;
}

export function GamePage(props: GamePageProps) {
  const {
    protagonist,
    timeSystem,
    currentTab,
    messages,
    totalMessageCount = 0,
    hasMoreMessages = false,
    isLoadingMessages = false,
    battleState,
    autoCultivating,
    availableDifficulties,
    unlockedAchievementIds,
    claimedAchievementIds,
    statistics,
    onTabChange,
    onReset,
    onCloseResult,
    onLoadMoreMessages,
    currentEvent,
    adventureGrid,
    adventurePosition,
    adventureConfig,
    lastResult,
    lastExploreTime,
    crafting,
    forging,
    // 交互式战斗
    activeBattle,
    autoBattle = false,
    onBattleEnd,
    onToggleAutoBattle,
  } = props;

  // 状态管理
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showPathSelect, setShowPathSelect] = useState(false);
  const [showAlchemyDialog, setShowAlchemyDialog] = useState(false);
  const [showForgeDialog, setShowForgeDialog] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<{item: Technique | Equipment; type: 'technique' | 'equipment'} | null>(null);
  
  // 心境状态管理 - 从protagonist读取或使用默认值
  const [mentalState, setMentalState] = useState<MentalState>(
    protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState
  );
  
  // 同步protagonist的mentalState变化
  useEffect(() => {
    if (protagonist.mentalState) {
      setMentalState(protagonist.mentalState);
    }
  }, [protagonist.mentalState]);

  // 头部操作区域
  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      className="text-xs h-8"
      onClick={() => setShowResetConfirm(true)}
    >
      <RotateCcw className="w-3.5 h-3.5 mr-1" />
      重新来过
    </Button>
  );

  // Tab 内容组件
  const TabContent = () => (
    <Tabs value={currentTab} onValueChange={(v) => onTabChange(v as ActionTab)} className="w-full">
      {/* 双行Tab布局 */}
      <div className="flex flex-col gap-1">
        {/* 第一行：修炼系统 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">修炼</span>
          <TabsList className="grid grid-cols-4 h-8 flex-1">
            {TAB_CONFIG_ROW1.map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1 text-xs px-1.5"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* 第二行：探索系统 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">探索</span>
          <TabsList className="grid grid-cols-6 h-8 flex-1">
            {TAB_CONFIG_ROW2.map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1 text-xs px-1"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      <TabsContent value="cultivation" className="mt-3 space-y-3">
        <CultivationPanel
          onCultivate={props.onCultivate}
          onRest={props.onRest}
          worldType={protagonist.world.type}
          inventory={protagonist.inventory}
          activeEffects={protagonist.activeEffects}
          experience={protagonist.experience}
          overflowExperience={protagonist.overflowExperience}
          level={protagonist.level}
          currentHp={protagonist.currentHp}
          maxHp={protagonist.maxHp}
          currentMp={protagonist.currentMp}
          maxMp={protagonist.maxMp}
          autoCultivating={autoCultivating}
          onToggleAutoCultivation={props.onToggleAutoCultivation}
          luck={getFinalStats(protagonist.stats).幸运}
          cultivationPath={protagonist.cultivationPath}
          pathLevel={protagonist.pathLevel}
          onSelectPath={() => setShowPathSelect(true)}
          mentalState={mentalState}
          onMentalStateChange={setMentalState}
        />

        {/* 闭关修炼 */}
        {props.onSeclusion && (
          <SeclusionPanel
            onSeclusion={props.onSeclusion}
            disabled={autoCultivating}
            worldType={protagonist.world.type}
            inventory={protagonist.inventory}
            level={protagonist.level}
          />
        )}
      </TabsContent>

      <TabsContent value="experience" className="mt-3">
        <FactionPanel
          worldType={protagonist.world.type}
          worldFactions={protagonist.world.factions || []}
          currentFactionId={protagonist.factionId}
          factionProgress={protagonist.factionProgress}
          contribution={protagonist.currencies?.contribution}
          onJoinFaction={props.onJoinFaction}
          onLeaveFaction={props.onLeaveFaction}
          onAcceptTask={props.onAcceptTask}
          onSubmitTask={props.onSubmitTask}
          onRefreshTasks={props.onRefreshTasks}
          onClaimDailySalary={props.claimDailySalary}
          spiritStoneCount={protagonist.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity || 0}
          onDonate={props.onDonate}
        />
      </TabsContent>

      <TabsContent value="adventure" className="mt-3">
        {/* 自动战斗开关 */}
        {adventureGrid && adventurePosition && (
          <div className="flex items-center justify-between mb-2 p-2 bg-muted/50 rounded-lg text-xs">
            <span className="text-muted-foreground">战斗模式</span>
            <div className="flex items-center gap-2">
              <span className={autoBattle ? 'text-muted-foreground' : 'text-primary font-medium'}>
                手动
              </span>
              <button
                onClick={() => onToggleAutoBattle?.()}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  autoBattle ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    autoBattle ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
              <span className={autoBattle ? 'text-primary font-medium' : 'text-muted-foreground'}>
                自动
              </span>
            </div>
          </div>
        )}
        <AdventurePanel
          grid={adventureGrid}
          position={adventurePosition}
          config={adventureConfig}
          onStart={props.onExplore}
          onMove={props.onMoveAdventure}
          onExit={() => props.onExitAdventure(false)}
          worldType={protagonist.world.type}
        />
      </TabsContent>

      <TabsContent value="shop" className="mt-3">
        <ShopPanel
          inventory={protagonist.inventory}
          worldType={protagonist.world.type}
          playerLevel={protagonist.level}
          realm={protagonist.realm}
          currencies={{
            spirit_stone: protagonist.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity || 0,
            contribution: protagonist.currencies?.contribution ?? 0,
            sect_point: protagonist.currencies?.sect_point ?? 0,
            honor: protagonist.currencies?.honor_point ?? 0,
            ascension_mark: protagonist.currencies?.ascension_mark ?? 0,
            event_token: protagonist.currencies?.event_token ?? 0,
          }}
          factionId={protagonist.factionProgress?.factionId}
          factionRank={protagonist.factionProgress?.rank}
          onBuy={props.onBuyShopItem}
        />
      </TabsContent>

      <TabsContent value="technique" className="mt-3 h-[calc(100%-3rem)]">
        <TechniquePanel
          techniques={protagonist.techniques}
          equippedAttackTechniques={protagonist.equippedAttackTechniques}
          equippedDefenseTechniques={protagonist.equippedDefenseTechniques}
          onEquip={props.onEquipTechnique}
          onUnequip={props.onUnequipTechnique}
          onUpgrade={(technique) => setUpgradeTarget({ item: technique, type: 'technique' })}
          useGlobalState={false}
        />
      </TabsContent>

      <TabsContent value="equipment" className="mt-3 h-[calc(100%-3rem)]">
        <EquipmentPanel
          equipments={protagonist.equipments}
          equippedMelee={protagonist.equippedMelee}
          equippedRanged={protagonist.equippedRanged}
          equippedHead={protagonist.equippedHead}
          equippedBody={protagonist.equippedBody}
          equippedLegs={protagonist.equippedLegs}
          equippedFeet={protagonist.equippedFeet}
          onEquip={props.onEquipEquipment}
          onUnequip={props.onUnequipEquipment}
          onUpgrade={(equipment) => setUpgradeTarget({ item: equipment, type: 'equipment' })}
        />
      </TabsContent>

      <TabsContent value="alchemy" className="mt-3 h-[calc(100%-3rem)]">
        <AlchemyPanel
          inventory={protagonist.inventory}
          playerLevel={protagonist.level}
          crafting={crafting}
          onStartCrafting={props.onStartCrafting}
          onFinishCrafting={props.onFinishCrafting}
        />
      </TabsContent>

      <TabsContent value="forge" className="mt-3 h-[calc(100%-3rem)]">
        <ForgePanel
          inventory={protagonist.inventory}
          playerLevel={protagonist.level}
          forging={forging}
          onStartForging={props.onStartForging}
          onFinishForging={props.onFinishForging}
        />
      </TabsContent>

      <TabsContent value="achievement" className="mt-3 h-[calc(100%-3rem)]">
        <AchievementPanel
          statistics={statistics}
          unlockedAchievementIds={unlockedAchievementIds}
          claimedAchievementIds={claimedAchievementIds}
          onClaimReward={props.onClaimAchievementReward}
        />
      </TabsContent>

      <TabsContent value="collection" className="mt-3 h-[calc(100%-3rem)]">
        <CollectionPanel
          techniques={protagonist.techniques}
          equipments={protagonist.equipments}
          statistics={statistics}
        />
      </TabsContent>

      <TabsContent value="statistics" className="mt-3 h-[calc(100%-3rem)] overflow-auto">
        <StatisticsPanel
          statistics={statistics}
          protagonist={protagonist}
        />
      </TabsContent>
    </Tabs>
  );

  // 左侧边栏内容
  const leftSidebar = (
    <>
      <StatusPanel 
        protagonist={protagonist}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs h-9"
        onClick={() => setShowResetConfirm(true)}
      >
        <RotateCcw className="w-4 h-4 mr-1.5" />
        重新来过
      </Button>
    </>
  );

  // 右侧边栏内容
  const rightSidebar = (
    <MessagePanel
      messages={messages}
      totalMessageCount={totalMessageCount}
      hasMoreMessages={hasMoreMessages}
      isLoadingMessages={isLoadingMessages}
      onLoadMore={onLoadMoreMessages}
    />
  );

  // 头部内容
  const header = (
    <GameHeader protagonist={protagonist} actions={headerActions} timeSystem={timeSystem} mentalState={mentalState} />
  );

  return (
    <>
      <GameLayout
        header={header}
        leftSidebar={leftSidebar}
        mainContent={<TabContent />}
        rightSidebar={rightSidebar}
      />

      {/* 战斗记录弹窗 */}
      <BattleResultDialog
        open={!!battleState}
        onOpenChange={(open) => {
          if (!open) onCloseResult();
        }}
        battleState={battleState!}
        onClose={onCloseResult}
      />

      {/* 交互式战斗弹窗 */}
      {activeBattle?.isActive && (adventureConfig || activeBattle.source === 'tower') && (() => {
        // 爬塔战斗使用满状态，不影响玩家实际状态
        const battleProtagonist = activeBattle.source === 'tower' 
          ? { ...protagonist, currentHp: protagonist.maxHp, currentMp: protagonist.maxMp }
          : protagonist;
        
        return (
          <BattleDialog
            open={true}
            onOpenChange={(open) => {
              if (!open && onBattleEnd) {
                // 战斗中关闭视为逃跑
                onBattleEnd({ 
                  victory: false, 
                  fled: true,
                  playerHpAfter: protagonist.currentHp,
                  playerMpAfter: protagonist.currentMp,
                });
              }
            }}
            protagonist={battleProtagonist}
            cellType={activeBattle.cellType}
            enemyContent={`${activeBattle.enemyName}(Lv.${activeBattle.enemyLevel})`}
            config={adventureConfig || {
              rows: 5,
              cols: 5,
              difficulty: activeBattle.enemyLevel,
              realmName: '试炼挑战',
              enemyLevelMin: activeBattle.enemyLevel,
              enemyLevelMax: activeBattle.enemyLevel,
              rewardMultiplier: 1,
              portalCount: 0,
            }}
            onBattleEnd={(result) => {
              if (onBattleEnd) {
                onBattleEnd({
                  victory: result.victory,
                  fled: result.fled,
                  playerHpAfter: result.playerHpAfter ?? protagonist.currentHp,
                  playerMpAfter: result.playerMpAfter ?? protagonist.currentMp,
                });
              }
            }}
            autoMode={autoBattle}
            onToggleAutoMode={onToggleAutoBattle}
          />
        );
      })()}

      {/* 流派选择弹窗 */}
      <CultivationPathSelect
        isOpen={showPathSelect}
        onClose={() => setShowPathSelect(false)}
        playerLevel={protagonist.level}
        playerStats={getFinalStats(protagonist.stats)}
        currentPath={protagonist.cultivationPath ?? null}
        worldType={protagonist.world.type}
        pathLevel={protagonist.pathLevel ?? 1}
        onSelectPath={(path) => {
          if (props.onSelectCultivationPath) {
            props.onSelectCultivationPath(path);
          }
          setShowPathSelect(false);
        }}
      />

      {/* 升级面板弹窗 */}
      <Dialog open={!!upgradeTarget} onOpenChange={(open) => !open && setUpgradeTarget(null)}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogTitle className="sr-only">升级面板</DialogTitle>
          {upgradeTarget && (
            <UpgradePanel
              targetItem={upgradeTarget.item}
              allItems={upgradeTarget.type === 'technique' ? protagonist.techniques : protagonist.equipments}
              onClose={() => setUpgradeTarget(null)}
              onConfirm={(targetId, materialIds, type) => {
                if (type === 'technique') {
                  props.onUpgradeTechnique(targetId, materialIds);
                  const upgradedItem = protagonist.techniques.find(t => t.id === targetId);
                  return upgradedItem ? { upgradedItem } : null;
                } else {
                  props.onUpgradeEquipment(targetId, materialIds);
                  const upgradedItem = protagonist.equipments.find(e => e.id === targetId);
                  return upgradedItem ? { upgradedItem } : null;
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 重新开始确认弹窗 */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              确认重新开始
            </DialogTitle>
            <DialogDescription>
              当前角色的所有进度将被清空，包括等级、装备、物品等。确认要重新选择化身吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowResetConfirm(false);
                onReset();
              }}
            >
              确认重开
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
