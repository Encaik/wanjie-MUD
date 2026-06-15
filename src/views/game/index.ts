// 路由守卫
export { getRouteGuard } from './state/routeGuard';

// 布局组件
export { GameHeader } from './layout/GameHeader';
export { LeftSidebar } from './layout/LeftSidebar';
export { CenterPanel } from './layout/CenterPanel';
export { RightSidebar } from './layout/RightSidebar';
export { MobileLayout } from './layout/MobileLayout';

// 面板导航
export { GameMenu, WanjiePanel, PANELS, PRIMARY_PANELS, SECONDARY_PANELS } from './navigation';
export type { GameMenuStatusDots, PanelDefinition } from './navigation';

// 弹窗系统
export { DialogLayer } from './dialogs/DialogLayer';
export { useDialogController, openDialog, closeDialog } from './dialogs/useDialogController';

// 设置
export { SettingsPanel } from './settings/SettingsPanel';

// PanelPage 页面组件
export {
  CultivationPage,
  AdventurePage,
  FactionPage,
  TechniquePage,
  ShopPage,
  EquipmentPage,
  AlchemyPage,
  ForgePage,
  FragmentPage,
  SkillPage,
  TowerPage,
  AchievementPage,
  CollectionPage,
  StatisticsPage,
} from './pages';

// 信息卡片
export { StatusPanel } from './cards/StatusPanel';
export { WorldInfoPanel } from './cards/WorldInfoPanel';
export { SaveLoadPanel } from './cards/SaveLoadPanel';
export { MentalStateCard } from './cards/MentalStateCard';

// 弹窗组件
export { RankDetailDialog } from './dialogs/RankDetailDialog';
export { ReputationDetailDialog } from './dialogs/ReputationDetailDialog';

// 状态存储
export { GameStoreProvider, useGameStore, useGameDispatch } from './state/GameStore';
export { useAddMessage } from './hooks/useAddMessage';

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
} from './hooks/useGameHooks';
