/**
 * Contexts 统一导出
 * 
 * 提供全局状态管理的 Context
 */

// Protagonist Context
export {
  ProtagonistProvider,
  useProtagonistContext,
  useProtagonist,
  useInventory,
  useActiveEffects,
  useCultivationPath,
  useMentalState,
  useFactionProgress,
  useExploreCooldown,
  type ProtagonistContextValue,
} from './ProtagonistContext';

// Game Actions Context
export {
  GameActionsProvider,
  useGameActionsContext,
  useCultivationActions,
  useAdventureActions,
  useEquipmentActions,
  useFactionActions,
  useShopActions,
  useAscensionActions as useShopAscensionActions,
  type GameActions,
} from './GameActionsContext';

// WorldText Context
export {
  WorldTextProvider,
  useWorldText,
} from './WorldTextContext';

// Ascension Context
export {
  AscensionProvider,
  useAscensionContext,
  useAscensionFlow,
  useIsInAscension,
  useAscensionActions,
} from './AscensionContext';
