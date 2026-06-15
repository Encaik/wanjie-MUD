# 实施任务

## Phase 1：创建子目录与桶文件

此阶段只创建目录和空的 `index.ts`，不影响任何现有代码。

### 1.1 创建子目录

- [x] 创建 `src/views/game/state/`
- [x] 创建 `src/views/game/layout/`
- [x] 创建 `src/views/game/navigation/`
- [x] 创建 `src/views/game/dialogs/`
- [x] 创建 `src/views/game/settings/`
- [x] 创建 `src/views/game/cards/`

### 1.2 创建桶文件（空占位）

- [x] 创建 `src/views/game/state/index.ts`
- [x] 创建 `src/views/game/layout/index.ts`
- [x] 创建 `src/views/game/navigation/index.ts`
- [x] 创建 `src/views/game/dialogs/index.ts`
- [x] 创建 `src/views/game/settings/index.ts`
- [x] 创建 `src/views/game/cards/index.ts`
- [x] 创建 `src/views/game/hooks/index.ts`（新增）

### 1.3 验证

- [x] 运行 `pnpm ts-check` 确认无错误

---

## Phase 2：按子目录分批移动文件并更新内部导入

每批移动完成后立即 `pnpm ts-check`。

### 2.1 移动 `state/` 文件

- [x] 移动 `GameStore.tsx` → `state/GameStore.tsx`（内部引用 `'./initialState'` 变为同目录，不变）
- [x] 移动 `initialState.ts` → `state/initialState.ts`
- [x] 移动 `routeGuard.ts` → `state/routeGuard.ts`
- [x] 更新 `state/index.ts`：导出 `GameStoreProvider`、`useGameStore`、`useGameDispatch`、`createInitialGameState`、`getRouteGuard`
- [x] `pnpm ts-check`

### 2.2 移动 `layout/` 文件

- [x] 移动 `GameHeader.tsx` → `layout/GameHeader.tsx`
- [x] 移动 `CenterPanel.tsx` → `layout/CenterPanel.tsx`
- [x] 移动 `RightSidebar.tsx` → `layout/RightSidebar.tsx`
- [x] 移动 `LeftSidebar.tsx` → `layout/LeftSidebar.tsx`
  - 更新内部导入：`'./SaveLoadPanel'` → `'../cards/SaveLoadPanel'`
  - 更新内部导入：`'./StatusPanel'` → `'../cards/StatusPanel'`
  - 更新内部导入：`'./WorldInfoPanel'` → `'../cards/WorldInfoPanel'`
- [x] 移动 `MobileLayout.tsx` → `layout/MobileLayout.tsx`
  - 更新内部导入：`'@/views/game/SaveLoadPanel'` → `'@/views/game/cards/SaveLoadPanel'`
  - 更新内部导入：`'@/views/game/StatusPanel'` → `'@/views/game/cards/StatusPanel'`
- [x] 更新 `layout/index.ts`：导出全部 5 个组件
- [x] `pnpm ts-check`

### 2.3 移动 `navigation/` 文件

- [x] 移动 `PanelNav.tsx` → `navigation/PanelNav.tsx`
- [x] 移动 `WanjiePanel.tsx` → `navigation/WanjiePanel.tsx`
  - 内部导入 `'./PanelNav'` 变为同目录，不变
- [x] 移动 `DifficultySelect.tsx` → `navigation/DifficultySelect.tsx`
- [x] 移动 `PanelContent.tsx` → `navigation/PanelContent.tsx`
  - 更新内部导入：`'./useDialogController'` → `'../dialogs/useDialogController'`
  - 内部导入 `'./DifficultySelect'`、`'./PanelNav'` 变为同目录，不变
- [x] 更新 `navigation/index.ts`：导出全部 4 个组件 + 类型
- [x] `pnpm ts-check`

### 2.4 移动 `dialogs/` 文件

- [x] 移动 `useDialogController.ts` → `dialogs/useDialogController.ts`
- [x] 移动 `DialogLayer.tsx` → `dialogs/DialogLayer.tsx`
  - 内部导入全部变为同目录（`'./InheritanceSelect'`、`'./UpgradePanel'`、`'./WorldReveal'`、`'./useDialogController'`），不变
- [x] 移动 `UpgradePanel.tsx` → `dialogs/UpgradePanel.tsx`
- [x] 移动 `InheritanceSelect.tsx` → `dialogs/InheritanceSelect.tsx`
- [x] 移动 `WorldReveal.tsx` → `dialogs/WorldReveal.tsx`
- [x] 移动 `TribulationDialog.tsx` → `dialogs/TribulationDialog.tsx`
- [x] 移动 `CraftingDialog.tsx` → `dialogs/CraftingDialog.tsx`
- [x] 移动 `OfflineRewardDialog.tsx` → `dialogs/OfflineRewardDialog.tsx`
- [x] 移动 `RankDetailDialog.tsx` → `dialogs/RankDetailDialog.tsx`
- [x] 移动 `ReputationDetailDialog.tsx` → `dialogs/ReputationDetailDialog.tsx`
- [x] 更新 `dialogs/index.ts`：导出全部 10 个文件
- [x] `pnpm ts-check`

### 2.5 移动 `settings/` 和 `cards/` 文件

- [x] 移动 `SettingsPanel.tsx` → `settings/SettingsPanel.tsx`
  - 检查是否引用 `ThemeSettingsPanel`，若是则改为 `'./ThemeSettingsPanel'`
- [x] 移动 `ThemeSettingsPanel.tsx` → `settings/ThemeSettingsPanel.tsx`
- [x] 更新 `settings/index.ts`：导出 2 个组件
- [x] 移动 `StatusPanel.tsx` → `cards/StatusPanel.tsx`
- [x] 移动 `WorldInfoPanel.tsx` → `cards/WorldInfoPanel.tsx`
- [x] 移动 `MentalStateCard.tsx` → `cards/MentalStateCard.tsx`
- [x] 移动 `SaveLoadPanel.tsx` → `cards/SaveLoadPanel.tsx`
- [x] 更新 `cards/index.ts`：导出 4 个组件
- [x] `pnpm ts-check`

### 2.6 移动 `hooks/` 文件（根 → hooks/）

- [x] 移动 `useGameHooks.ts` → `hooks/useGameHooks.ts`
- [x] 移动 `useAddMessage.ts` → `hooks/useAddMessage.ts`
- [x] 更新 `hooks/index.ts`：导出 `useGameSystems`、`useAddMessage`、以及 `useGameHooks` 的全部导出
- [x] `pnpm ts-check`

---

## Phase 3：更新根级文件和外部引用

### 3.1 更新 `GameLayout.tsx`（根目录）

更新所有子组件导入路径：

```diff
- './DialogLayer'          → './dialogs/DialogLayer'
- './GameHeader'           → './layout/GameHeader'
- './GameStore'            → './state/GameStore'
- './LeftSidebar'          → './layout/LeftSidebar'
- './MobileLayout'         → './layout/MobileLayout'
- './PanelContent'         → './navigation/PanelContent'
- './PanelNav'             → './navigation/PanelNav'
- './RightSidebar'         → './layout/RightSidebar'
- './SettingsPanel'        → './settings/SettingsPanel'
- './WanjiePanel'          → './navigation/WanjiePanel'
- './useDialogController'  → './dialogs/useDialogController'
```

- [x] 更新 GameLayout.tsx 的所有子组件导入
- [x] `pnpm ts-check`

### 3.2 更新 `views/game/index.ts`

- [x] 按 design.md §四 更新所有导出路径
- [x] 确保原有所有导出项均可通过桶文件访问
- [x] `pnpm ts-check`

### 3.3 更新外部引用

- [x] `src/shared/components/index.ts`：`'@/views/game/GameHeader'` → `'@/views/game/layout/GameHeader'`
- [x] `src/views/layout/PathAwareProvider.tsx`：`'@/views/game/GameStore'` → `'@/views/game/state/GameStore'`
- [x] `src/app/game/page.tsx`：`'@/views/game/GameStore'` → `'@/views/game/state/GameStore'`
- [x] `src/app/world-select/page.tsx`：同上
- [x] `src/app/character-select/page.tsx`：同上
- [x] `src/app/backstory/page.tsx`：同上
- [x] `src/modules/narrative/hooks/useGameText.ts`：同上
- [x] `pnpm ts-check`

---

## Phase 4：最终验证

### 4.1 类型与构建

- [x] 运行 `pnpm ts-check` — 零类型错误
- [x] 运行 `pnpm build` — 静态导出成功

### 4.2 代码质量

- [x] 运行 `pnpm check-sizes` — 无文件超限
- [x] 运行 `pnpm lint:strict` — 全质量门通过

### 4.3 功能冒烟

- [x] `pnpm dev` 启动开发服务器
- [x] 首页加载正常 → 选择世界 → 选择人物 → 进入游戏页
- [x] 游戏页面布局正确（Header + 三栏 + 底栏导航）
- [x] 面板切换正常（修炼、机缘、势力、功法、商店 5 个主入口）
- [x] 万界盘弹出/关闭正常
- [x] 各弹窗正常（设置、升级、重置确认、天劫、制造等）
- [x] 移动端布局正常
