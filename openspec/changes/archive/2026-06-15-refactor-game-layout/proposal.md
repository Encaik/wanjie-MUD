## Why

当前游戏主页面存在四个相互加剧的结构性问题，导致代码难以维护、页面响应迟缓、新人无法快速定位逻辑：

1. **上帝 Context**：`useGameState.tsx` 长达 2204 行，`GameContextType` 暴露 100+ 方法。任何消费 Context 的组件都会在任意 action 变化时重渲染。所有业务逻辑（修炼、战斗、装备、势力、炼丹、飞升……）耦合在一个 Provider 中，无法按需加载，无法独立测试。

2. **巨型组件**：`MainGame.tsx` 达 1023 行（超 300 行限制 3.4 倍），内部定义了 600 行的 `TabsContentSection` JSX 闭包，管理了 10+ 个弹窗的显隐状态，连接了多人游戏 HTTP 轮询，编排了飞升流程的多个阶段。`page.tsx` 必须从 Context 解构 124 个 props 传给 MainGame，是纯粹的"传声筒"。

3. **Tab 导航混乱**：15 个功能面板用 3 层 Tab 组织，分类命名"修炼/制造/收集"语义不准确——势力归在"制造"下、试炼归在"收集"下都不合理。三行 Tab 占用 120px+ 垂直空间，压缩了实际内容区域。

4. **UI 状态污染**：`mentalState`、`upgradeTarget`、`skillTabActiveTab`、`announcements` 等 UI 临时状态托管在 MainGame 中，飞升流程的 ref 标志（`ascensionBattleEndedRef`）也放在页面组件。这些状态本应属于各自的 Panel 或功能 Hook。

## What Changes

- **拆分上帝 Context**：`useGameState.tsx`（2204 行）重构为轻量 `GameStore`（仅暴露 `gameState` + `dispatch`，~50 行）+ 多个领域 action Hook（`useCultivation`、`useFaction`、`useEquipment`、`useAdventure`、`useShop`、`useCrafting`、`useAscension`、`useBattle`、`useInventory` 等，每个 ~100-200 行）。各模块已有的参数式 Hook（`useGameCultivation({ state, setState, addMessage })`）转为自取式 Hook（从 GameStore 读取），任何组件均可独立调用。

- **重写 page.tsx**：从 126 行（解构 100+ 字段 + 透传 124 个 props）缩减至 ~30 行纯路由守卫，不再传递任何 action prop。

- **重写 GameLayout**：替代 MainGame.tsx（1023 行），职责仅为布局骨架（Header + LeftSidebar + Center + RightSidebar + DialogLayer），不包含任何业务逻辑或 UI 状态。

- **重新设计功能导航**：用"底栏（5 个主入口：修炼、机缘、势力、功法、商店）+ 万界盘（剩余 9 个功能分三组：炼造、武备、记载，从底部滑出）"替代当前 3 层 Tab。高频操作一键即达，低频操作两步可达。

- **弹窗管理解耦**：新增 `useDialogController` + `DialogLayer` 模式，各 Panel 自己 open/close 弹窗，GameLayout 只负责渲染层。飞升流程的多步骤弹窗由 `useAscensionFlow()` 自管理。

- **UI 状态下放**：`mentalState`、`upgradeTarget`、`skillTabActiveTab`、`announcements` 等从 MainGame 移至各自 Panel/Hook 内部管理。

## Capabilities

### New Capabilities

- `game-store-split`: 上帝 Context 拆分为 GameStore + 领域 action Hook 体系。GameStore 仅提供 `gameState`（只读状态树）和 `dispatch`（不可变更新）。领域 Hook 从 GameStore 自取状态，导出该领域的 action 函数。
- `game-panel-navigation`: 底栏（5 主入口）+ 万界盘（9 功能分 3 组）的功能面板导航系统，替代当前 3 层 Tab。包含底栏主入口状态提示（红点/光点）。
- `game-dialog-layer`: 声明式弹窗管理层，`useDialogController` 提供 `open`/`close` API，`DialogLayer` 统一渲染活跃弹窗。各 Panel 自行管理弹窗生命周期。

### Modified Capabilities

- `game-page-redesign`: 原 spec 关注视觉重设计（四角隅饰、渐变线、可读性审计），本次变更在此视觉基础上进行架构重构，不改动视觉规范。MainGame.tsx 被 GameLayout.tsx + PanelNav.tsx + DialogLayer.tsx 替换。
- `design-guide`: 新增导航组件（底栏、万界盘、DialogLayer）的视觉规范，需与现有设计词汇保持一致。

## Impact

- **受影响文件**: `src/app/game/page.tsx`（重写）、`src/views/game/MainGame.tsx`（删除，逻辑分散）、`src/views/game/useGameState.tsx`（重写为 GameStore + 拆分到各领域 Hook）、`src/views/game/types.ts`（大幅精简）、`src/views/game/GameLayout.tsx`（重写）、`src/views/game/GameHeader.tsx`（改为自取数据）、`src/views/game/LeftSidebar.tsx`（改为自取数据）、`src/views/game/RightSidebar.tsx`（改为自取数据）、`src/views/game/CenterPanel.tsx`（重写，集成导航）
- **新增文件**: `src/views/game/GameStore.tsx`、`src/views/game/PanelNav.tsx`、`src/views/game/WanjiePanel.tsx`（万界盘）、`src/views/game/DialogLayer.tsx`、`src/views/game/useDialogController.ts`、各领域 Hook 文件（如现有模块 Hook 不足则新增）
- **受影响模块 Hook**: `src/modules/progression/hooks/useCultivation.ts`、`src/modules/exploration/hooks/useAdventure.ts`、`src/modules/faction/hooks/useFaction.ts`、`src/modules/combat/hooks/useBattle.ts`、`src/modules/ascension/hooks/useAscension.ts` 等 — 参数从 `(state, setState, addMessage)` 改为从 GameStore 自取
- **不受影响**: 所有 `modules/*/logic/` 纯函数、`modules/*/data/` 数据、`modules/*/components/` 面板组件（props 接口不变）、`core/` 所有系统
- **破坏性**: 无——组件 props 接口保持兼容，仅内部数据获取方式改变
