# Implementation Tasks

## 1. 基础设施 — 注册表 + 菜单 + PanelPage

- [ ] 1.1 创建 `src/views/game/navigation/panelRegistry.ts` — 统一面板注册表，包含 14 个面板的 `PanelDefinition`（id、label、icon、category、group、route），导出 `PANELS`、`PRIMARY_PANELS`、`SECONDARY_PANELS`
- [ ] 1.2 创建 `src/views/game/navigation/GameMenu.tsx` — 顶部标签导航组件（≤200 行），渲染 PRIMARY_PANELS 6 个 `<Link>` + "更多"按钮，`usePathname()` 高亮，`statusDots` props 渲染提示点
- [ ] 1.3 创建 `src/views/game/pages/` 目录 + 14 个 PanelPage 组件：
  - [ ] 1.3.1 `CultivationPage.tsx` — 调用 `useCultivation` + `useInventory`，渲染 CultivationPanel + SeclusionPanel + InventoryPanel
  - [ ] 1.3.2 `AdventurePage.tsx` — 调用 `useAdventure` + `useBattle`，渲染 DifficultySelect / AdventurePanel + AdventureLootPanel + 退出按钮
  - [ ] 1.3.3 `FactionPage.tsx` — 调用 `useFaction`，渲染 FactionPanel
  - [ ] 1.3.4 `TechniquePage.tsx` — 调用 `useEquipment`，渲染 TechniquePanel
  - [ ] 1.3.5 `ShopPage.tsx` — 调用 `useShop`，渲染 ShopPanel
  - [ ] 1.3.6 `EquipmentPage.tsx` — 调用 `useEquipment`，渲染 EquipmentPanel
  - [ ] 1.3.7 `AlchemyPage.tsx` — 调用 `useCrafting`，渲染 AlchemyPanel
  - [ ] 1.3.8 `ForgePage.tsx` — 调用 `useCrafting`，渲染 ForgePanel
  - [ ] 1.3.9 `FragmentPage.tsx` — 调用 `useEquipment`，渲染 FragmentPanel
  - [ ] 1.3.10 `SkillPage.tsx` — 调用 `useEquipment`，渲染 SkillsTab
  - [ ] 1.3.11 `TowerPage.tsx` — 调用 `useBattle`，渲染 TowerPanel
  - [ ] 1.3.12 `AchievementPage.tsx` — 调用 `useFaction`（claimAchievementReward），渲染 AchievementPanel
  - [ ] 1.3.13 `CollectionPage.tsx` — 渲染 CollectionPanel（纯展示，无 Hook）
  - [ ] 1.3.14 `StatisticsPage.tsx` — 渲染 StatisticsPanel（纯展示，无 Hook）
- [ ] 1.4 更新 `src/views/game/navigation/WanjiePanel.tsx` — 移除内部 `WANJIE_GROUPS` 硬编码，改为从 `panelRegistry.ts` 导入 `SECONDARY_PANELS` 并按 `group` 字段分组；`onPanelSelect` 回调改为接收路由字符串，内部使用 `router.push(route)`；触发按钮文本从"万界"改为"更多"
- [ ] 1.5 创建 `src/views/game/pages/index.ts` — barrel 导出所有 14 个 PanelPage

## 2. 路由层 — page.tsx + layout.tsx

- [ ] 2.1 创建 14 个 `src/app/game/<panel>/page.tsx` 路由文件：
  - [ ] 2.1.1 `cultivation/page.tsx` → import CultivationPage
  - [ ] 2.1.2 `adventure/page.tsx` → import AdventurePage
  - [ ] 2.1.3 `faction/page.tsx` → import FactionPage
  - [ ] 2.1.4 `technique/page.tsx` → import TechniquePage
  - [ ] 2.1.5 `shop/page.tsx` → import ShopPage
  - [ ] 2.1.6 `equipment/page.tsx` → import EquipmentPage
  - [ ] 2.1.7 `alchemy/page.tsx` → import AlchemyPage
  - [ ] 2.1.8 `forge/page.tsx` → import ForgePage
  - [ ] 2.1.9 `fragment/page.tsx` → import FragmentPage
  - [ ] 2.1.10 `skill/page.tsx` → import SkillPage
  - [ ] 2.1.11 `tower/page.tsx` → import TowerPage
  - [ ] 2.1.12 `achievement/page.tsx` → import AchievementPage
  - [ ] 2.1.13 `collection/page.tsx` → import CollectionPage
  - [ ] 2.1.14 `statistics/page.tsx` → import StatisticsPage
- [ ] 2.2 创建 `src/app/game/layout.tsx` — 从 `GameLayout.tsx` 重构：
  - [ ] 2.2.1 保留全局 Hook：`useGameSystems()`、`useMultiplayerHttp()`、`useGameStore()`、`useSaveLoad()`
  - [ ] 2.2.2 移除所有领域 Hook 调用（`useCultivation`、`useAdventure` 等）及其 import
  - [ ] 2.2.3 保留 `mentalState` useState + `showSettings` useState + `showWanjiePanel` useState
  - [ ] 2.2.4 计算 `statusDots`（wanjieDot、factionPromotion、cultivationAlert）
  - [ ] 2.2.5 中间栏：渲染 `<GameMenu statusDots={statusDots} />` + `<div className="flex-1 overflow-y-auto">{children}</div>`
  - [ ] 2.2.6 保留 Header、Sidebars、DialogLayer、BattleDialog、WanjiePanel 等共享壳
  - [ ] 2.2.7 WanjiePanel 的 `onPanelSelect` 改为 `(route) => router.push(route)`
  - [ ] 2.2.8 BattleDialog 的 `handleBattleEnd` 保持现有逻辑，通过 `gameState` 同步
- [ ] 2.3 更新 `src/app/game/page.tsx` — 添加默认重定向到 `/game/cultivation`（保留路由守卫逻辑）
- [ ] 2.4 更新 `src/views/game/state/routeGuard.ts` — `/game` 匹配改为 `currentPath.startsWith('/game')`
- [ ] 2.5 更新 `src/views/game/layout/MobileLayout.tsx` — 移除 PanelNav 相关 props，MobileLayout 内部暂时保持 `activePanel` state 驱动的面板切换（移动端后续统一）

## 3. 删除旧代码

- [ ] 3.1 删除 `src/views/game/navigation/PanelNav.tsx`
- [ ] 3.2 删除 `src/views/game/navigation/PanelContent.tsx`
- [ ] 3.3 删除 `src/views/game/GameLayout.tsx`
- [ ] 3.4 更新 `src/views/game/index.ts` — 移除 PanelNav、PanelContent、GameLayout 的导出；新增 GameMenu、PANELS、PRIMARY_PANELS、SECONDARY_PANELS、各 PanelPage 的导出
- [ ] 3.5 更新 `src/views/game/navigation/index.ts` — 移除 PanelNav、PanelContent 导出；新增 GameMenu、panelRegistry 导出
- [ ] 3.6 全局搜索 `PanelNav`、`PanelContent`、`GameLayout` import 引用，确认全部清除或更新
- [ ] 3.7 全局搜索 `activePanel` 相关残留代码（在非 MobileLayout 的文件中），确认全部清除

## 4. 验证

- [ ] 4.1 运行 `pnpm ts-check` 确保零类型错误
- [ ] 4.2 运行 `pnpm build` 确保静态导出构建成功
- [ ] 4.3 运行 `pnpm lint:strict` 确保 ESLint + 文件大小检查通过
- [ ] 4.4 手动验证路由跳转：修炼→机缘→势力→...→更多→炼丹，确认每个面板正确渲染
- [ ] 4.5 手动验证浏览器前进/后退按钮正确切换面板
- [ ] 4.6 手动验证刷新页面后面板状态保持（URL 不变）
- [ ] 4.7 手动验证状态提示点：势力可晋升黄点、自动修炼脉冲点、炼丹炼器脉冲点
