# 游戏页面文件夹重组设计

## 一、分类原则

按 **UI 区域** 将 `views/game/` 平铺文件分为 7 个功能子目录。每个子目录对应一个明确的 UI 区域，该区域内的所有文件（组件、弹窗、Hook）共置一处。

### 1.1 UI 区域定义

| 子目录 | UI 区域 | 职责 |
|--------|---------|------|
| `state/` | 状态基础设施 | 游戏状态 store、初始值工厂、路由守卫 |
| `layout/` | 页面布局骨架 | 页面整体结构：Header、左/右/中栏、移动端布局 |
| `navigation/` | 面板导航系统 | 底栏导航、面板 ID→组件映射、万界盘弹出层、难度选择 |
| `dialogs/` | 弹窗系统 | 弹窗基础设施（层+控制器）+ 全部弹窗内容组件 |
| `settings/` | 设置功能域 | 设置面板 + 主题设置面板 |
| `cards/` | 信息展示卡片 | 嵌入各处的可复用信息卡片 |
| `hooks/` | 通用页面 Hook | 派生数据选择器、消息添加、系统初始化 |
| `domainHooks/` | 领域功能 Hook | 各玩法领域的 action Hook（已独立，不变） |

### 1.2 归类决策表

| 文件 | → 子目录 | 归类理由 |
|------|---------|---------|
| `GameStore.tsx` | `state/` | 状态存储基础设施，被多页面引用 |
| `initialState.ts` | `state/` | 与 GameStore 紧密耦合 |
| `routeGuard.ts` | `state/` | 状态相关的路由守卫逻辑 |
| `GameHeader.tsx` | `layout/` | 顶部标题栏，页面骨架 |
| `LeftSidebar.tsx` | `layout/` | 左侧边栏，页面骨架 |
| `CenterPanel.tsx` | `layout/` | 中间面板容器，页面骨架 |
| `RightSidebar.tsx` | `layout/` | 右侧边栏，页面骨架 |
| `MobileLayout.tsx` | `layout/` | 移动端布局，页面骨架 |
| `PanelNav.tsx` | `navigation/` | 底栏 5+1 导航按钮 |
| `PanelContent.tsx` | `navigation/` | 面板 ID → 模块组件映射 |
| `WanjiePanel.tsx` | `navigation/` | 万界盘弹出选择器 |
| `DifficultySelect.tsx` | `navigation/` | 机缘面板流中的难度选择步骤 |
| `DialogLayer.tsx` | `dialogs/` | 弹窗渲染基础设施 |
| `useDialogController.ts` | `dialogs/` | 弹窗 open/close 控制器 |
| `UpgradePanel.tsx` | `dialogs/` | 在 DialogLayer 中作为升级弹窗渲染 |
| `InheritanceSelect.tsx` | `dialogs/` | 飞升传承选择弹窗 |
| `WorldReveal.tsx` | `dialogs/` | 飞升世界揭示弹窗 |
| `TribulationDialog.tsx` | `dialogs/` | 天劫弹窗 |
| `CraftingDialog.tsx` | `dialogs/` | 制造弹窗 |
| `OfflineRewardDialog.tsx` | `dialogs/` | 离线奖励弹窗 |
| `RankDetailDialog.tsx` | `dialogs/` | 排名详情弹窗 |
| `ReputationDetailDialog.tsx` | `dialogs/` | 声望详情弹窗 |
| `SettingsPanel.tsx` | `settings/` | 设置面板（inline overlay） |
| `ThemeSettingsPanel.tsx` | `settings/` | 主题设置面板 |
| `StatusPanel.tsx` | `cards/` | 角色状态信息卡片 |
| `WorldInfoPanel.tsx` | `cards/` | 世界信息卡片 |
| `MentalStateCard.tsx` | `cards/` | 心境信息卡片 |
| `SaveLoadPanel.tsx` | `cards/` | 存档管理卡片 |
| `useGameHooks.ts` | `hooks/` | 派生数据选择器 |
| `useAddMessage.ts` | `hooks/` | 消息添加 Hook |
| `useGameSystems.ts` | `hooks/`（已在） | 游戏系统初始化 |

---

## 二、导入路径变更

### 2.1 目录间依赖关系

```
GameLayout.tsx（根）
  ├── state/GameStore         ← 状态
  ├── layout/GameHeader       ← 骨架
  ├── layout/LeftSidebar      ← 骨架（引用 cards/SaveLoadPanel, cards/StatusPanel, cards/WorldInfoPanel）
  ├── layout/RightSidebar     ← 骨架
  ├── layout/MobileLayout     ← 骨架（引用 cards/SaveLoadPanel, cards/StatusPanel）
  ├── navigation/PanelNav     ← 导航
  ├── navigation/PanelContent ← 导航（引用 navigation/DifficultySelect, dialogs/useDialogController）
  ├── navigation/WanjiePanel  ← 导航
  ├── settings/SettingsPanel  ← 设置
  ├── dialogs/DialogLayer     ← 弹窗层（引用 dialogs/ 下各弹窗组件）
  │   ├── dialogs/UpgradePanel
  │   ├── dialogs/InheritanceSelect
  │   ├── dialogs/WorldReveal
  │   └── dialogs/useDialogController
  ├── dialogs/useDialogController ← 弹窗控制
  └── domainHooks/*           ← 领域 Hook（不变）
```

### 2.2 各文件导入变更明细

#### `GameLayout.tsx`（根 → 更新所有子组件导入）

```
'./DialogLayer'           → './dialogs/DialogLayer'
'./GameHeader'            → './layout/GameHeader'
'./GameStore'             → './state/GameStore'
'./LeftSidebar'           → './layout/LeftSidebar'
'./MobileLayout'          → './layout/MobileLayout'
'./PanelContent'          → './navigation/PanelContent'
'./PanelNav'              → './navigation/PanelNav'
'./RightSidebar'          → './layout/RightSidebar'
'./SettingsPanel'         → './settings/SettingsPanel'
'./WanjiePanel'           → './navigation/WanjiePanel'
'./useDialogController'   → './dialogs/useDialogController'
'./domainHooks/useXxx'    → './domainHooks/useXxx'（不变）
```

#### `DialogLayer.tsx` → `dialogs/DialogLayer.tsx`

```
'./InheritanceSelect'     → './InheritanceSelect'（同目录，不变）
'./UpgradePanel'          → './UpgradePanel'（同目录，不变）
'./WorldReveal'           → './WorldReveal'（同目录，不变）
'./useDialogController'   → './useDialogController'（同目录，不变）
```

#### `PanelContent.tsx` → `navigation/PanelContent.tsx`

```
'./DifficultySelect'      → './DifficultySelect'（同目录，不变）
'./useDialogController'   → '../dialogs/useDialogController'
'./PanelNav'              → './PanelNav'（同目录，不变）
```

#### `WanjiePanel.tsx` → `navigation/WanjiePanel.tsx`

```
'./PanelNav'              → './PanelNav'（同目录，不变）
```

#### `LeftSidebar.tsx` → `layout/LeftSidebar.tsx`

```
'./SaveLoadPanel'         → '../cards/SaveLoadPanel'
'./StatusPanel'           → '../cards/StatusPanel'
'./WorldInfoPanel'        → '../cards/WorldInfoPanel'
```

#### `MobileLayout.tsx` → `layout/MobileLayout.tsx`

```
'@/views/game/SaveLoadPanel' → '@/views/game/cards/SaveLoadPanel'
'@/views/game/StatusPanel'   → '@/views/game/cards/StatusPanel'
```

#### `GameStore.tsx` → `state/GameStore.tsx`

```
'./initialState'          → './initialState'（同目录，不变）
```

#### `SettingsPanel.tsx` → `settings/SettingsPanel.tsx`

检查是否引用 `ThemeSettingsPanel`：若引用，变更为 `'./ThemeSettingsPanel'`（同目录）。

### 2.3 外部引用变更（非 `views/game/` 目录）

| 外部文件 | 当前引用 | 变更为 |
|---------|---------|--------|
| `src/shared/components/index.ts` | `@/views/game/GameHeader` | `@/views/game/layout/GameHeader` |
| `src/views/layout/PathAwareProvider.tsx` | `@/views/game/GameStore` | `@/views/game/state/GameStore` |
| `src/app/game/page.tsx` | `@/views/game/GameStore` | `@/views/game/state/GameStore` |
| `src/app/game/page.tsx` | `@/views/game/GameLayout` | 不变（仍在根目录） |
| `src/app/world-select/page.tsx` | `@/views/game/GameStore` | `@/views/game/state/GameStore` |
| `src/app/character-select/page.tsx` | `@/views/game/GameStore` | `@/views/game/state/GameStore` |
| `src/app/backstory/page.tsx` | `@/views/game/GameStore` | `@/views/game/state/GameStore` |
| `src/modules/narrative/hooks/useGameText.ts` | `@/views/game/GameStore` | `@/views/game/state/GameStore` |

---

## 三、各子目录 index.ts

### 3.1 `state/index.ts`

```typescript
export { GameStoreProvider, useGameStore, useGameDispatch } from './GameStore';
export type { GameStoreValue } from './GameStore';
export { createInitialGameState } from './initialState';
export { getRouteGuard } from './routeGuard';
```

### 3.2 `layout/index.ts`

```typescript
export { GameHeader } from './GameHeader';
export { LeftSidebar } from './LeftSidebar';
export { CenterPanel } from './CenterPanel';
export { RightSidebar } from './RightSidebar';
export { MobileLayout } from './MobileLayout';
```

### 3.3 `navigation/index.ts`

```typescript
export { PanelNav } from './PanelNav';
export type { PanelId, PanelNavStatusDots } from './PanelNav';
export { PanelContent } from './PanelContent';
export { DifficultySelect } from './DifficultySelect';
export { WanjiePanel } from './WanjiePanel';
export type { WanjiePanelId } from './WanjiePanel';
```

### 3.4 `dialogs/index.ts`

```typescript
export { DialogLayer } from './DialogLayer';
export { useDialogController, openDialog, closeDialog } from './useDialogController';
export type { DialogType, DialogEntry } from './useDialogController';
export { UpgradePanel } from './UpgradePanel';
export { InheritanceSelect } from './InheritanceSelect';
export { WorldReveal } from './WorldReveal';
export { TribulationDialog } from './TribulationDialog';
export { CraftingDialog } from './CraftingDialog';
export { OfflineRewardDialog } from './OfflineRewardDialog';
export { RankDetailDialog } from './RankDetailDialog';
export { ReputationDetailDialog } from './ReputationDetailDialog';
```

### 3.5 `settings/index.ts`

```typescript
export { SettingsPanel } from './SettingsPanel';
export { ThemeSettingsPanel } from './ThemeSettingsPanel';
```

### 3.6 `cards/index.ts`

```typescript
export { StatusPanel } from './StatusPanel';
export { WorldInfoPanel } from './WorldInfoPanel';
export { MentalStateCard } from './MentalStateCard';
export { SaveLoadPanel } from './SaveLoadPanel';
```

### 3.7 `hooks/index.ts`

```typescript
export { useGameSystems } from './useGameSystems';
export { useAddMessage } from './useAddMessage';
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
```

---

## 四、根级 `views/game/index.ts` 更新

```typescript
// 路由守卫
export { getRouteGuard } from './state/routeGuard';

// 布局组件
export { GameLayout } from './GameLayout';
export { GameHeader } from './layout/GameHeader';
export { LeftSidebar } from './layout/LeftSidebar';
export { CenterPanel } from './layout/CenterPanel';
export { RightSidebar } from './layout/RightSidebar';
export { MobileLayout } from './layout/MobileLayout';

// 面板导航
export { PanelNav } from './navigation/PanelNav';
export type { PanelId, PanelNavStatusDots } from './navigation/PanelNav';
export { WanjiePanel } from './navigation/WanjiePanel';
export type { WanjiePanelId } from './navigation/WanjiePanel';
export { PanelContent } from './navigation/PanelContent';

// 弹窗系统
export { DialogLayer } from './dialogs/DialogLayer';
export { useDialogController, openDialog, closeDialog } from './dialogs/useDialogController';

// 设置
export { SettingsPanel } from './settings/SettingsPanel';

// 信息卡片
export { StatusPanel } from './cards/StatusPanel';
export { WorldInfoPanel } from './cards/WorldInfoPanel';
export { SaveLoadPanel } from './cards/SaveLoadPanel';
export { MentalStateCard } from './cards/MentalStateCard';

// 弹窗组件（保持对外兼容）
export { RankDetailDialog } from './dialogs/RankDetailDialog';
export { ReputationDetailDialog } from './dialogs/ReputationDetailDialog';

// 状态存储
export { GameStoreProvider, useGameStore, useGameDispatch } from './state/GameStore';
export { useAddMessage } from './hooks/useAddMessage';

// 领域 Hook
export {
  useCultivation, useFaction, useEquipment, useAdventure,
  useShop, useCrafting, useAscension, useBattle,
  useInventory as useInventoryActions, useSaveLoad,
  useGameActions, useDevMode,
} from './domainHooks';
export { useGameFlow } from './domainHooks/useGameFlow';

// 派生数据 Hook
export {
  useProtagonist, useProtagonistInfo, useHpMp,
  useStats, useCombatStats, useInventory,
  useTechniques, useTerminology,
} from './hooks/useGameHooks';
```

---

## 五、不需要变更的文件

| 文件 | 原因 |
|------|------|
| `GameLayout.tsx` | 保持在根目录，仅更新内部导入路径 |
| `domainHooks/*` | 已在独立子目录，不引用 views/game 内其他组件 |
| 所有 `modules/` 文件 | 不直接引用 views/game 内的 UI 文件（除 GameStore） |
| 所有 `core/` 文件 | 与视图层无关 |

---

## 六、验证标准

- `pnpm ts-check` — 零类型错误（证明所有导入路径正确）
- `pnpm build` — 静态导出成功
- `pnpm check-sizes` — 无文件超限
- `pnpm lint:strict` — 全质量门通过
