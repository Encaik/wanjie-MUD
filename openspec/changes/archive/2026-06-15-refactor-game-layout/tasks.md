# 实施任务

## Phase 1：拆分 God Context（基础设施，无 UI 变化）

此阶段完成后，`pnpm ts-check` 和 `pnpm build` 应通过，游戏功能保持不变。

### 1.1 创建 GameStore

- [x] 新建 `src/views/game/GameStore.tsx`
  - 创建 `GameStoreProvider`：内部使用 `useState<GameState>`，暴露 `gameState` + `dispatch`
  - 导出 `useGameStore()`：返回 `{ gameState, dispatch }`
  - 导出 `useGameDispatch()`：仅返回 `dispatch`
  - 初始化逻辑从 `useGameState.tsx` 的 `GameProvider` 迁移（localStorage 恢复 + 默认值）
  - 消息分页状态（`hasMoreMessages`、`isLoadingMessages`）作为 store 的附加字段
- [x] 新建 `src/views/game/useAddMessage.ts`
  - 从 `useGameState.tsx` 提取 `addMessageInternal` 函数
  - 导出 `useAddMessage()` Hook

### 1.2 提取领域 Hook

每个领域 Hook 从 `useGameState.tsx` 中提取对应 action 函数，改为从 GameStore 自取状态。action 内部逻辑不变。

- [x] 新建 `src/views/game/domainHooks/useCultivation.ts` — `performCultivation`、`performRest`、`toggleAutoCultivation`、`selectCultivationPath`、`performTribulation`
- [x] 新建 `src/views/game/domainHooks/useFaction.ts` — `joinFaction`、`leaveFaction`、`donate`、`promoteRank`、`acceptTask`、`submitTask`、`refreshTasks`、`claimTaskReward`、`claimDailySalary`
- [x] 新建 `src/views/game/domainHooks/useEquipment.ts` — `equipTechnique`、`unequipTechnique`、`equipEquipment`、`unequipEquipment`、`updateTechnique`、`updateEquipment`、`performUpgradeTechnique`、`performUpgradeEquipment`、`synthesizeFragment`
- [x] 新建 `src/views/game/domainHooks/useAdventure.ts` — `startAdventure`、`quickSweep`、`moveInAdventure`、`exitAdventure`、`startExperience`、`handleEventChoice`、`getAvailableDifficulties`
- [x] 新建 `src/views/game/domainHooks/useShop.ts` — `buyShopItem`、`buyWithContribution`
- [x] 新建 `src/views/game/domainHooks/useCrafting.ts` — `startCrafting`、`finishCrafting`、`startForging`、`finishForging`
- [x] 新建 `src/views/game/domainHooks/useAscension.ts` — `challengeGuardian`、`onAscensionBattleEnd`、`onInheritanceConfirm`、`onInheritanceSkip`、`onWorldConfirm`、`onWorldReroll`（含飞升流程状态机）
- [x] 新建 `src/views/game/domainHooks/useBattle.ts` — `handleBattleEnd`、`toggleAutoBattle`、`challengeTower`
- [x] 新建 `src/views/game/domainHooks/useInventory.ts` — `useItem`
- [x] 新建 `src/views/game/domainHooks/useSaveLoad.ts` — `exportSave`、`importSave`、`resetGame`
- [x] 新建 `src/views/game/domainHooks/useAchievement.ts` — `claimAchievementReward`
- [x] 新建 `src/views/game/domainHooks/useDevMode.ts` — `devInvincible`、`onToggleDevInvincible`、`devHandlers`

### 1.3 改造现有模块 Hook

- [x] 改造 `src/modules/progression/hooks/useCultivation.ts`：参数从 `(state, setState, addMessage)` 改为从 GameStore 自取
- [x] 改造 `src/modules/exploration/hooks/useAdventure.ts`：同上
- [x] 改造 `src/modules/faction/hooks/useFaction.ts`：同上
- [x] 改造 `src/modules/ascension/hooks/useAscension.ts`：同上
- [x] 改造 `src/modules/progression/hooks/useSeclusion.ts`：同上

### 1.4 更新 useGameState.tsx

- [x] 将 `GameProvider` 改为组合 `GameStoreProvider` + 保留 `GameContext` 作为过渡
- [x] 重新导出所有领域 Hook 的 action，保持 `GameContextType` 接口临时兼容
- [x] 标记 `GameContextType` 为 `@deprecated`，提示迁移到领域 Hook

### 1.5 验证

- [x] 运行 `pnpm ts-check` 确保无类型错误
- [x] 运行 `pnpm build` 确保构建成功
- [x] 运行 `pnpm test` 确保现有测试通过
- [x] 手动验证：修炼、战斗、势力、商店、飞升等核心功能正常

---

## Phase 2：重写页面布局（拆分 MainGame）

此阶段完成后，`MainGame.tsx` 被删除，`GameLayout.tsx` 承担布局职责。

### 2.1 重写 page.tsx

- [x] 重写 `src/app/game/page.tsx`（~30 行）
  - 只做路由守卫，不传任何 action prop
  - 仅传递 `protagonist` 给 GameLayout（用于渲染条件）

### 2.2 重写 GameLayout

- [x] 重写 `src/views/game/GameLayout.tsx`（~120 行）
  - 组合 GameStoreProvider + Header + LeftSidebar + CenterArea + RightSidebar + DialogLayer
  - 不再接收 action props
  - 使用领域 Hook 获取跨区域共享的状态（如 `activeBattle` 用于战斗弹窗）
  - 保留移动端/桌面端响应式布局逻辑

### 2.3 改造 Header 和各侧栏

- [x] 改造 `GameHeader.tsx`：通过 `useGameStore()` 获取主角数据，不再通过 props
- [x] 改造 `LeftSidebar.tsx`：通过 `useGameStore()` + `useSaveLoad()` 获取数据
- [x] 改造 `RightSidebar.tsx`：通过 `useMessages()`、`useMultiplayer()` 获取数据

### 2.4 删除 MainGame.tsx

- [x] 删除 `src/views/game/MainGame.tsx`（1023 行）
- [x] 更新 `src/views/game/index.ts` 导出

### 2.5 验证

- [x] 运行 `pnpm ts-check`、`pnpm build`、`pnpm test`
- [x] 手动验证：三栏布局正确、响应式切换正常、核心功能可操作

---

## Phase 3：新功能导航（底栏 + 万界盘）

### 3.1 创建 PanelNav 组件

- [x] 新建 `src/views/game/PanelNav.tsx`（~100 行）
  - 5 个主入口按钮（修炼、机缘、势力、功法、商店）
  - 万界盘触发按钮（`✦` 图标）
  - 主入口状态提示（红点/光点）
  - 响应式：桌面端 icon + 标签，移动端仅 icon

### 3.2 创建 WanjiePanel 组件

- [x] 新建 `src/views/game/WanjiePanel.tsx`（~120 行）
  - 底部滑出面板，带蒙层
  - 三组功能卡片：炼造（炼丹、炼器、碎片）、武备（技能、试炼）、记载（成就、图鉴、统计）
  - 滑入/滑出动画（~300ms）
  - 点击面板 → 关闭 + 切换，点击蒙层 → 关闭

### 3.3 重写 CenterPanel/CenterArea

- [x] 重写 `src/views/game/CenterPanel.tsx` → `CenterArea`
  - 管理 `activePanel` 状态
  - 使用 `PANEL_MAP` 映射渲染活跃面板
  - 面板保持挂载（切换不丢失状态）
  - 集成 PanelNav + WanjiePanel
  - 从领域 Hook 获取状态提示数据

### 3.4 移除旧 Tab 系统

- [x] 从 `TabsContentSection`（原 MainGame 内嵌函数）中提取面板渲染逻辑到 `CenterArea`
- [x] 移除 3 层 Tab 的 `TabsList` / `TabsTrigger` / `TabsContent` 结构

### 3.5 验证

- [x] 运行 `pnpm ts-check`、`pnpm build`、`pnpm test`
- [x] 手动验证：底栏 5 入口正常切换、万界盘展开/关闭正常、面板状态保持

---

## Phase 4：弹窗管理 + UI 状态下放

### 4.1 创建弹窗管理

- [x] 新建 `src/views/game/useDialogController.ts`（~60 行）
  - 弹窗注册表（模块级变量，避免重渲染）
  - `open(type, props?)` / `close(type)` API
  - 同类型弹窗覆盖逻辑
- [x] 新建 `src/views/game/DialogLayer.tsx`（~80 行）
  - 读取注册表，渲染所有活跃弹窗
  - `DIALOG_MAP` 映射弹窗 type → 组件
  - 自动处理 `onOpenChange` → `close`

### 4.2 迁移各弹窗到触发组件

- [x] 重置确认弹窗 → `LeftSidebar.tsx` 内部管理
- [x] 退出机缘确认弹窗 → `AdventurePanel` 内部管理
- [x] 升级面板弹窗 → `TechniquePanel` / `EquipmentPanel` 各自通过 `open('upgrade', ...)` 触发
- [x] 流派选择弹窗 → `CultivationPanel` 内部管理
- [x] 设置面板 → `GameHeader` 通过 `open('settings')` 触发
- [x] 开发者面板 → `GameHeader` 或独立入口通过 `open('dev')` 触发
- [x] 飞升流程弹窗 → `useAscensionFlow()` 内部管理（使用 open/close 或内部状态）
- [x] 死亡弹窗 → `useDeathState()` Hook 管理
- [x] 战斗弹窗 → `useBattle()` Hook 管理

### 4.3 UI 状态下放

- [x] `mentalState` 从 MainGame 移除 → `CultivationPanel` 直接读取 `protagonist.mentalState`
- [x] `upgradeTarget` 从 MainGame 移除 → 通过 `open('upgrade', { item, type })` 传递
- [x] `skillTabActiveTab` 从 MainGame 移除 → `SkillsTab` 内部 `useState`
- [x] `announcements` 从 MainGame 移除 → `useMultiplayer()` Hook 管理
- [x] `showPathSelect` 从 MainGame 移除 → `CultivationPanel` 内部 `useState`
- [x] `ascensionBattleEndedRef` 从 MainGame 移除 → `useAscensionFlow()` 内部 `useRef`
- [x] `isExplorationComplete` 从 MainGame 移除 → `AdventurePanel` 内部 `useMemo`

### 4.4 清理 GameDialogs

- [x] 删除 `src/views/game/GameDialogs.tsx`（342 行，弹窗已分散到各组件）
- [x] 删除 `src/views/game/types.ts` 中 `GameContextType` 类型

### 4.5 最终验证

- [x] 运行 `pnpm lint:strict` 全套质量门
- [x] 运行 `pnpm ts-check`、`pnpm build`、`pnpm test`
- [x] 运行 `pnpm check-sizes` 确认无文件超限
- [x] 手动全流程测试：首页 → 选择世界 → 选择人物 → 游戏主页 → 各功能操作 → 飞升流程
- [x] 移动端响应式测试
