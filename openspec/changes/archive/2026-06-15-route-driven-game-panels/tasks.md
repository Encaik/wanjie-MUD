# Implementation Tasks

## 1. 基础设施 — 注册表 + 菜单 + PanelPage

- [x] 1.1 创建 `src/views/game/navigation/panelRegistry.tsx` — 统一面板注册表，包含 14 个面板的 `PanelDefinition`（id、label、icon、category、group、route），导出 `PANELS`、`PRIMARY_PANELS`、`SECONDARY_PANELS`
- [x] 1.2 创建 `src/views/game/navigation/GameMenu.tsx` — 顶部标签导航组件（≤200 行），渲染 PRIMARY_PANELS 6 个 `<Link>` + "更多"按钮，均分空间，点击"更多"内联展开次要面板
- [x] 1.3 创建 `src/views/game/pages/` 目录 + 14 个 PanelPage 组件：
  - [x] 1.3.1 `CultivationPage.tsx` — 调用 `useCultivation` + `useInventory`
  - [x] 1.3.2 `AdventurePage.tsx` — 调用 `useAdventure`
  - [x] 1.3.3 `FactionPage.tsx` — 调用 `useFaction` + `useAdventure`
  - [x] 1.3.4 `TechniquePage.tsx` — 调用 `useEquipment`
  - [x] 1.3.5 `ShopPage.tsx` — 调用 `useShop`
  - [x] 1.3.6 `EquipmentPage.tsx` — 调用 `useEquipment`
  - [x] 1.3.7 `AlchemyPage.tsx` — 调用 `useCrafting`
  - [x] 1.3.8 `ForgePage.tsx` — 调用 `useCrafting`
  - [x] 1.3.9 `FragmentPage.tsx` — 调用 `useEquipment`
  - [x] 1.3.10 `SkillPage.tsx` — 调用 `useEquipment`
  - [x] 1.3.11 `TowerPage.tsx` — 调用 `useBattle`
  - [x] 1.3.12 `AchievementPage.tsx` — 调用 `useFaction`
  - [x] 1.3.13 `CollectionPage.tsx` — 纯展示，无 Hook
  - [x] 1.3.14 `StatisticsPage.tsx` — 纯展示，无 Hook
- [x] 1.4 更新 `src/views/game/navigation/WanjiePanel.tsx` — 从 `panelRegistry.tsx` 导入 `SECONDARY_PANELS` 按 `group` 分组；`onPanelSelect` 改为 `router.push(route)`；标题改为"更多功能"
- [x] 1.5 创建 `src/views/game/pages/index.ts` — barrel 导出所有 14 个 PanelPage

## 2. 路由层 — page.tsx + layout.tsx

- [x] 2.1 创建 14 个 `src/app/game/<panel>/page.tsx` 路由文件（每个 ≈5 行，import + 渲染 PanelPage）
- [x] 2.2 创建 `src/app/game/layout.tsx` — 从 `GameLayout.tsx` 重构，保留全局 Hook + 弹窗层 Hook，移除领域 Hook 到各 PanelPage，中间栏渲染 GameMenu + {children}
- [x] 2.3 更新 `src/app/game/page.tsx` — 添加默认重定向到 `/game/cultivation`
- [x] 2.4 更新 `src/views/game/state/routeGuard.ts` — `/game` 匹配改为 `currentPath.startsWith('/game')`
- [x] 2.5 更新 `src/views/game/layout/MobileLayout.tsx` — 无需修改（`TabsContentSection={children}` 已在 layout.tsx 中正确传递）

## 3. 删除旧代码

- [x] 3.1 删除 `src/views/game/navigation/PanelNav.tsx`
- [x] 3.2 删除 `src/views/game/navigation/PanelContent.tsx`
- [x] 3.3 删除 `src/views/game/GameLayout.tsx`
- [x] 3.4 更新 `src/views/game/index.ts` — 移除 PanelNav、PanelContent、GameLayout 导出；新增 GameMenu、registry、PanelPage 导出
- [x] 3.5 更新 `src/views/game/navigation/index.ts` — 移除 PanelNav、PanelContent 导出；新增 GameMenu、panelRegistry 导出
- [x] 3.6 全局搜索残留引用 — 零残留

## 4. 验证

- [x] 4.1 运行 `pnpm ts-check` — 零错误（仅 `.next/dev/types/validator.ts` 预存问题）
- [x] 4.2 ESLint 检查 — 仅 2 个预存问题（`set-state-in-effect` + `complexity`，旧 GameLayout 已存在）
- [x] 4.3 手动验证文件结构完整性
