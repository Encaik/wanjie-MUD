'use client';

import { createContext, useContext, ReactNode, useCallback } from 'react';
import type { ActionTab, DungeonConfig, Technique, TechniqueType, Equipment, EquipmentSlot, ItemDefinition, InventoryItem, MessageRecord } from '@/lib/game/types';
import type { CultivationPath } from '@/lib/game/typesExtension';
import type { AlchemyRecipe, PillQuality } from '@/lib/data/alchemyRecipes';
import type { ForgeRecipe, EquipmentQuality } from '@/lib/data/forgeRecipes';

/**
 * Game Actions Context
 * 用于封装所有游戏操作方法，减少 props 传递
 */

// 游戏操作类型定义
export interface GameActions {
  // 基础操作
  onCultivate: () => void;
  onRest: () => void;
  onExplore: () => void;
  onChooseEvent: (index: number) => void;
  onStartAdventure: (config: DungeonConfig) => void;
  onMoveAdventure: (row: number, col: number) => void;
  onExitAdventure: (isCompleted?: boolean) => void;
  onCloseResult: () => void;
  onTabChange: (tab: ActionTab) => void;
  onUseItem: (itemId: string) => void;
  onReset: () => void;

  // 修炼相关
  onToggleAutoCultivation: () => void;
  onSelectCultivationPath?: (path: CultivationPath) => void;
  onTribulation?: () => { success: boolean; message: string };

  // 装备相关
  onEquipTechnique: (technique: Technique, slotIndex?: number) => void;
  onUnequipTechnique: (type: TechniqueType, slotIndex?: number) => void;
  onEquipEquipment: (equipment: Equipment) => void;
  onUnequipEquipment: (slot: EquipmentSlot) => void;

  // 商店相关
  onBuyShopItem: (itemId: string, price: number, type: 'item' | 'technique' | 'equipment', itemData?: ItemDefinition) => void;
  onBuyWithContribution?: (itemId: string, price: number) => void;

  // 炼丹/炼器相关
  onStartCrafting: (recipeId: string, duration: number, quality: PillQuality, success: boolean) => void;
  onFinishCrafting: (recipe: AlchemyRecipe, quality: PillQuality, success: boolean) => void;
  onStartForging: (recipeId: string, duration: number, quality: EquipmentQuality, success: boolean) => void;
  onFinishForging: (recipe: ForgeRecipe, quality: EquipmentQuality, success: boolean) => void;

  // 升级相关
  onUpgradeTechnique: (targetId: string, materialIds: string[]) => void;
  onUpgradeEquipment: (targetId: string, materialIds: string[]) => void;

  // 势力相关
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: () => void;
  claimTaskReward?: (taskId: string) => { success: boolean; message: string };
  claimDailySalary?: () => { success: boolean; amount: number };
  onAcceptTask?: (taskId: string) => { success: boolean; message: string };
  onSubmitTask?: (taskId: string) => { success: boolean; message: string };
  onRefreshTasks?: () => { success: boolean; message: string };
  onDonate?: (amount: number) => { success: boolean; message: string };
  onPromoteRank?: () => { success: boolean; message: string };

  // 飞升系统
  onChallengeGuardian?: () => void;
  onAscensionBattleEnd?: (result: { victory: boolean; turnsUsed: number; remainingHpPercent: number; phasesCleared: number }) => void;
  onInheritanceConfirm?: (choice: { techniqueId: string | null; equipmentId: string | null; spiritStonesPercent: number }) => void;
  onInheritanceSkip?: () => void;
  onWorldConfirm?: (newWorld?: any) => void;
  onWorldReroll?: () => void;

  // 成就相关
  onClaimAchievementReward?: (achievementId: string) => void;

  // 消息
  addMessage: (type: MessageRecord['type'], title: string, content: string, details?: string, rewards?: MessageRecord['rewards']) => void;
}

// 创建 Context
const GameActionsContext = createContext<GameActions | null>(null);

// Provider Props
interface GameActionsProviderProps {
  children: ReactNode;
  actions: GameActions;
}

/**
 * Game Actions Provider
 * 封装所有游戏操作方法
 */
export function GameActionsProvider({ children, actions }: GameActionsProviderProps) {
  return (
    <GameActionsContext.Provider value={actions}>
      {children}
    </GameActionsContext.Provider>
  );
}

/**
 * 使用 Game Actions Context
 */
export function useGameActionsContext() {
  const context = useContext(GameActionsContext);
  if (!context) {
    throw new Error('useGameActionsContext must be used within GameActionsProvider');
  }
  return context;
}

// 便捷 Hooks

/**
 * 修炼操作
 */
export function useCultivationActions() {
  const actions = useGameActionsContext();
  return {
    onCultivate: actions.onCultivate,
    onRest: actions.onRest,
    onToggleAutoCultivation: actions.onToggleAutoCultivation,
    onSelectCultivationPath: actions.onSelectCultivationPath,
    onTribulation: actions.onTribulation,
  };
}

/**
 * 机缘操作
 */
export function useAdventureActions() {
  const actions = useGameActionsContext();
  return {
    onExplore: actions.onExplore,
    onChooseEvent: actions.onChooseEvent,
    onStartAdventure: actions.onStartAdventure,
    onMoveAdventure: actions.onMoveAdventure,
    onExitAdventure: actions.onExitAdventure,
  };
}

/**
 * 装备操作
 */
export function useEquipmentActions() {
  const actions = useGameActionsContext();
  return {
    onEquipTechnique: actions.onEquipTechnique,
    onUnequipTechnique: actions.onUnequipTechnique,
    onEquipEquipment: actions.onEquipEquipment,
    onUnequipEquipment: actions.onUnequipEquipment,
    onUpgradeTechnique: actions.onUpgradeTechnique,
    onUpgradeEquipment: actions.onUpgradeEquipment,
  };
}

/**
 * 势力操作
 */
export function useFactionActions() {
  const actions = useGameActionsContext();
  return {
    onJoinFaction: actions.onJoinFaction,
    onLeaveFaction: actions.onLeaveFaction,
    claimTaskReward: actions.claimTaskReward,
    claimDailySalary: actions.claimDailySalary,
    onAcceptTask: actions.onAcceptTask,
    onSubmitTask: actions.onSubmitTask,
    onRefreshTasks: actions.onRefreshTasks,
    onDonate: actions.onDonate,
    onPromoteRank: actions.onPromoteRank,
  };
}

/**
 * 商店操作
 */
export function useShopActions() {
  const actions = useGameActionsContext();
  return {
    onBuyShopItem: actions.onBuyShopItem,
    onBuyWithContribution: actions.onBuyWithContribution,
  };
}

/**
 * 飞升操作
 */
export function useAscensionActions() {
  const actions = useGameActionsContext();
  return {
    onChallengeGuardian: actions.onChallengeGuardian,
    onAscensionBattleEnd: actions.onAscensionBattleEnd,
    onInheritanceConfirm: actions.onInheritanceConfirm,
    onInheritanceSkip: actions.onInheritanceSkip,
    onWorldConfirm: actions.onWorldConfirm,
    onWorldReroll: actions.onWorldReroll,
  };
}
