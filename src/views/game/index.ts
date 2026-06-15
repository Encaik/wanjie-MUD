// 路由守卫
export { getRouteGuard } from './routeGuard';

// 布局组件
export { GameLayout } from './GameLayout';
export { GameHeader } from './GameHeader';
export { LeftSidebar } from './LeftSidebar';
export { CenterPanel } from './CenterPanel';
export { RightSidebar } from './RightSidebar';
export { MobileLayout } from './MobileLayout';
export { SettingsPanel } from './SettingsPanel';
export { StatusPanel } from './StatusPanel';
export { WorldInfoPanel } from './WorldInfoPanel';
export { SaveLoadPanel } from './SaveLoadPanel';
export { MentalStateCard } from './MentalStateCard';
export { RankDetailDialog } from './RankDetailDialog';
export { ReputationDetailDialog } from './ReputationDetailDialog';

// 状态存储
export { GameStoreProvider, useGameStore, useGameDispatch } from './GameStore';
export { useAddMessage } from './useAddMessage';

// 领域 Hook
export {
  useCultivation,
  useFaction,
  useEquipment,
  useAdventure,
  useShop,
  useCrafting,
  useAscension,
  useBattle,
  useInventory as useInventoryActions,
  useSaveLoad,
  useGameActions,
  useDevMode,
} from './domainHooks';
export { useGameFlow } from './domainHooks/useGameFlow';

// 派生数据 Hook
export {
  useProtagonist,
  useProtagonistInfo,
  useHpMp,
  useStats,
  useCombatStats,
  useInventory,
  useTechniques,
  useTerminology,
} from './useGameHooks';

// 导航与弹窗
export { PanelNav } from './PanelNav';
export type { PanelId, PanelNavStatusDots } from './PanelNav';
export { WanjiePanel } from './WanjiePanel';
export type { WanjiePanelId } from './WanjiePanel';
export { PanelContent } from './PanelContent';
export { DialogLayer } from './DialogLayer';
export { useDialogController, openDialog, closeDialog } from './useDialogController';
