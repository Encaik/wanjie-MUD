## Why

当前游戏主界面的中间区域存在三个结构性问题：

1. **无路由感知** — 面板切换使用 `useState(activePanel)`，URL 始终为 `/game`。无法深链到特定面板（如 `/game/shop`），无法使用浏览器前进/后退，刷新后丢失面板状态。

2. **Props 地狱** — `GameLayout` 调用全部 13 个领域 Hook，通过 `PanelContent` 的 100+ 行 props 接口透传给 14 个 switch case。每个面板被迫接收所有不相关的回调，新增面板需要同时修改 `GameLayout`、`PanelContent`、`PanelNav` 三个文件。

3. **导航位置不佳** — `PanelNav` 位于中间栏底部，用户需要视线下移才能切换功能。"万界盘"作为底部滑出面板承载 9 个次要功能，与主导航在空间上割裂。

## What Changes

- **路由驱动面板**：`/game/[panel]` 改为独立路由文件夹（`/game/cultivation/page.tsx` 等 14 个），每个面板页自己调用领域 Hook，URL 即面板状态
- **顶部标签菜单 GameMenu**：新建 `GameMenu` 组件置于中间栏顶部，6 个固定主标签（修炼/机缘/势力/功法/商店/装备）+ "更多"标签触发万界盘
- **万界盘保留**：`WanjiePanel` 组件保留，触发入口从独立"万界"按钮改为 GameMenu 的"更多"标签
- **删除旧导航**：移除 `PanelNav`、`PanelContent`，`GameLayout` 重构为 `layout.tsx`（共享壳：Header + Sidebars + Menu + Dialogs）
- **统一面板注册表**：新增 `panelRegistry.ts`，14 个面板的元数据（ID、图标、标签、分类、路由）在一处定义，GameMenu 和 WanjiePanel 共享引用
- **一次性迁移**：不保留旧代码，不写兼容层，全部重写

## Capabilities

### New Capabilities
- `game-panel-routing`: 游戏面板路由系统 — 14 个独立路由，每个面板页自管 Hook 调用，URL 可深链
- `game-menu-navigation`: 游戏菜单导航 — 顶部标签栏，6 主标签 + "更多"触发万界盘，路由高亮，状态提示点

### Modified Capabilities
无（纯 UI 层重构，不涉及模块内的业务逻辑变更）

## Impact

- **删除** `src/views/game/navigation/PanelNav.tsx`（被 GameMenu 替代）
- **删除** `src/views/game/navigation/PanelContent.tsx`（被各 PanelPage 替代）
- **重构** `src/views/game/GameLayout.tsx` → `src/app/game/layout.tsx`（共享壳，移除 PanelContent/PanelNav）
- **修改** `src/views/game/navigation/WanjiePanel.tsx`（入口名称从"万界"改为"更多"，去独立分隔线按钮）
- **修改** `src/views/game/state/routeGuard.ts`（适配 `/game/*` 嵌套路由）
- **新增** `src/app/game/{cultivation,adventure,faction,technique,shop,equipment,alchemy,forge,fragment,skill,tower,achievement,collection,statistics}/page.tsx`（14 个路由页面）
- **新增** `src/views/game/navigation/GameMenu.tsx`（顶部标签导航）
- **新增** `src/views/game/navigation/panelRegistry.ts`（统一面板注册表）
- **新增** `src/views/game/pages/` 目录（14 个 PanelPage 组件）
- **更新** 所有相关 barrel `index.ts` 导出
