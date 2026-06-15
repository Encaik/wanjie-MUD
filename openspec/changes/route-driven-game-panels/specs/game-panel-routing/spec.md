# game-panel-routing

## Purpose

游戏面板路由系统 — 将 14 个功能面板从客户端 `useState` 切换改为 Next.js App Router 路由驱动。每个面板有独立 URL（`/game/<panel>`），支持浏览器前进/后退、深链和刷新保持状态。每个面板页面自管领域 Hook 调用，消除跨面板 props 透传。

## ADDED Requirements

### Requirement: 面板 URL 路由

每个游戏功能面板 SHALL 拥有独立的 URL 路径 `/game/<panel>`。

`/game` SHALL 重定向到 `/game/cultivation`（默认面板）。

#### Scenario: 访问修炼面板

- **WHEN** 用户在浏览器导航到 `/game/cultivation`
- **AND** 用户已登录（`gameState.protagonist` 存在）
- **THEN** 页面 SHALL 显示修炼面板内容（CultivationPanel + SeclusionPanel + InventoryPanel）
- **AND** URL SHALL 保持为 `/game/cultivation`

#### Scenario: 默认面板重定向

- **WHEN** 用户在浏览器导航到 `/game`
- **AND** 用户已登录
- **THEN** 浏览器 SHALL 重定向到 `/game/cultivation`

#### Scenario: 无效面板返回 404

- **WHEN** 用户导航到 `/game/nonexistent`
- **THEN** Next.js SHALL 返回 404 页面

#### Scenario: 浏览器后退恢复面板

- **WHEN** 用户从修炼切换到机缘（`/game/cultivation` → `/game/adventure`）
- **AND** 用户点击浏览器后退按钮
- **THEN** URL SHALL 恢复为 `/game/cultivation`
- **AND** 页面 SHALL 显示修炼面板内容

#### Scenario: 未登录用户访问游戏面板

- **WHEN** 用户导航到 `/game/cultivation`
- **AND** `gameState.protagonist` 不存在
- **THEN** 路由守卫 SHALL 重定向到 `/character-select`（如有已选世界）或 `/world-select`（如有世界列表）或 `/`

### Requirement: 独立路由文件夹结构

每个面板 SHALL 在 `src/app/game/<panel>/` 下有独立的 `page.tsx` 文件。

`page.tsx` SHALL 仅做导入和渲染，业务逻辑 SHALL 放在 `src/views/game/pages/<Name>Page.tsx` 中。

#### Scenario: 修炼路由文件结构

- **WHEN** 开发者查看 `src/app/game/cultivation/`
- **THEN** SHALL 存在 `page.tsx` 文件
- **AND** `page.tsx` SHALL import 并渲染 `CultivationPage` from `@/views/game/pages/CultivationPage`

#### Scenario: 新增面板只需新建路由文件夹

- **WHEN** 开发者需要新增一个面板（如"邮件"）
- **THEN** 只需创建 `app/game/mail/page.tsx` + `views/game/pages/MailPage.tsx` + 在 `panelRegistry.ts` 中注册
- **AND** SHALL NOT 需要修改 `layout.tsx` 或任何现有面板页面

### Requirement: 面板页面自管 Hook 调用

每个 `PanelPage` 组件 SHALL 仅调用自己需要的领域 Hook。

`PanelPage` SHALL NOT 接收来自 `layout.tsx` 的领域 action props。

#### Scenario: 修炼页面只调用修炼 Hook

- **WHEN** CultivationPage 渲染
- **THEN** SHALL 调用 `useCultivation()` 获取修炼相关 action
- **AND** SHALL 调用 `useInventory()` 获取物品使用 action
- **AND** SHALL NOT 调用 `useAdventure()`、`useShop()` 等其他领域 Hook

#### Scenario: 机缘页面只调用机缘相关 Hook

- **WHEN** AdventurePage 渲染
- **THEN** SHALL 调用 `useAdventure()` 获取探险相关 action
- **AND** SHALL 调用 `useBattle()` 获取战斗相关 action
- **AND** SHALL NOT 调用 `useCultivation()`、`useCrafting()` 等无关 Hook

### Requirement: 游戏路由守卫适配嵌套路由

路由守卫 `getRouteGuard()` SHALL 将 `/game/*` 所有路径视为游戏页面。

#### Scenario: /game/cultivation 通过守卫

- **WHEN** `getRouteGuard('/game/cultivation', state)` 被调用
- **AND** `state.protagonist` 存在
- **THEN** SHALL 返回 `null`（允许访问）

#### Scenario: /game/shop 无主角被拦截

- **WHEN** `getRouteGuard('/game/shop', state)` 被调用
- **AND** `state.protagonist` 不存在
- **THEN** SHALL 返回重定向路径（非 null）

### Requirement: GameLayout 重构为 layout.tsx

`src/app/game/layout.tsx` SHALL 包含共享壳：Header、Sidebars、GameMenu、DialogLayer、BattleDialog。

`layout.tsx` SHALL NOT 调用任何领域 Hook（`useCultivation`、`useAdventure` 等）。

`layout.tsx` SHALL 调用 `useGameSystems()`、`useMultiplayerHttp()`、`useGameStore()`、`useSaveLoad()`（全局基础设施）。

#### Scenario: layout.tsx 不调用领域 Hook

- **WHEN** 开发者审查 `app/game/layout.tsx`
- **THEN** SHALL NOT import `useCultivation`、`useAdventure`、`useEquipment`、`useShop`、`useCrafting`、`useAscension`、`useBattle`、`useFaction`、`useDevMode`
- **AND** 所有领域 Hook 调用 SHALL 在各 `PanelPage` 中

## REMOVED Requirements

无（全新系统）。
