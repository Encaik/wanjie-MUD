# game-menu-navigation

## Purpose

游戏菜单导航系统 — 位于游戏主界面中间栏顶部的标签式导航栏。固定展示 6 个常用面板标签（修炼/机缘/势力/功法/商店/装备），其余 8 个面板通过"更多"标签触发现有万界盘底部滑出面板。使用 Next.js `<Link>` 组件实现路由跳转，`usePathname()` 判断当前高亮标签。支持面板状态提示点（势力晋升、自动修炼、炼丹炼器进行中）。

## ADDED Requirements

### Requirement: GameMenu 顶部标签导航

中间栏顶部 SHALL 渲染 `GameMenu` 组件，包含 6 个主标签和 1 个"更多"标签。

`GameMenu` SHALL 放在 `layout.tsx` 中 `{children}` 之上。

#### Scenario: 显示 6 个主导航标签

- **WHEN** 游戏主界面渲染
- **THEN** 中间栏顶部 SHALL 显示 6 个标签：修炼、机缘、势力、功法、商店、装备
- **AND** 每个标签 SHALL 包含图标和文字（小屏幕可隐藏文字仅显示图标）
- **AND** 每个标签 SHALL 是 Next.js `<Link>` 指向对应路由

#### Scenario: 当前面板标签高亮

- **WHEN** 用户在 `/game/shop`
- **THEN** "商店"标签 SHALL 显示高亮样式（`bg-primary/10 text-primary border-primary/20`）
- **AND** 其余 5 个标签 SHALL 显示默认样式（`text-muted-foreground`）

#### Scenario: 点击标签跳转

- **WHEN** 用户点击"势力"标签
- **THEN** 浏览器 SHALL 导航到 `/game/faction`
- **AND** 中间区域 SHALL 渲染势力面板内容

### Requirement: "更多"标签触发万界盘

"更多"标签 SHALL 位于主标签之后，点击触发 `WanjiePanel` 底部滑出面板。

`WanjiePanel` 内部的面板数据 SHALL 从 `panelRegistry.ts` 的 `SECONDARY_PANELS` 获取。

#### Scenario: 点击"更多"打开万界盘

- **WHEN** 用户点击"更多"标签
- **THEN** `WanjiePanel` SHALL 从底部滑出
- **AND** 展示 8 个次要面板，按分组排列（炼造/武备/记载）

#### Scenario: 万界盘中选择面板后进行路由跳转

- **WHEN** 用户在万界盘中点击"炼丹"
- **THEN** `WanjiePanel` SHALL 关闭
- **AND** 浏览器 SHALL 导航到 `/game/alchemy`
- **AND** 中间区域 SHALL 渲染炼丹面板内容

#### Scenario: 点击蒙层或按 Escape 关闭万界盘

- **WHEN** 万界盘打开
- **AND** 用户点击蒙层或按 Escape 键
- **THEN** 万界盘 SHALL 关闭
- **AND** URL SHALL 保持不变

### Requirement: 状态提示点

`GameMenu` SHALL 支持在标签上显示状态提示点。

提示点数据 SHALL 通过 `statusDots` props 传入，计算逻辑 SHALL 在 `layout.tsx` 中。

#### Scenario: 势力可晋升时显示黄点

- **WHEN** `statusDots.factionPromotion` 为 `true`
- **THEN** "势力"标签右侧 SHALL 显示黄色脉冲圆点

#### Scenario: 自动修炼中显示脉冲点

- **WHEN** `statusDots.cultivationAlert` 为 `true`
- **THEN** "修炼"标签右侧 SHALL 显示脉冲动画圆点

#### Scenario: 炼丹或炼器进行中显示提示

- **WHEN** `statusDots.wanjieDot` 为 `true`
- **THEN** "更多"标签 SHALL 显示脉冲动画圆点（与当前万界按钮行为一致）

### Requirement: 统一面板注册表

`panelRegistry.ts` SHALL 作为项目中所有面板元数据的唯一数据源。

`GameMenu` 和 `WanjiePanel` SHALL 从 `panelRegistry.ts` 导入面板列表，而非各自维护。

#### Scenario: 注册表定义所有 14 个面板

- **WHEN** 开发者查看 `panelRegistry.ts`
- **THEN** SHALL 包含 6 个 `category: 'primary'` 的面板定义
- **AND** SHALL 包含 8 个 `category: 'secondary'` 的面板定义，带 `group` 字段
- **AND** 每个面板 SHALL 包含 `id`、`label`、`icon`、`category`、`route` 字段

#### Scenario: 面板分类调整只需改注册表

- **WHEN** 开发者决定将"装备"从 primary 改为 secondary
- **THEN** 只需修改 `panelRegistry.ts` 中装备的 `category: 'secondary'`
- **AND** GameMenu 自动只显示 5 个主标签
- **AND** WanjiePanel 自动包含装备

### Requirement: GameMenu 组件 props 接口

`GameMenu` SHALL 接收最小化的 props 接口。

#### Scenario: GameMenu props 定义

- **WHEN** 开发者查看 `GameMenu` 的类型定义
- **THEN** props SHALL 仅包含 `statusDots?: GameMenuStatusDots`
- **AND** `GameMenuStatusDots` SHALL 包含 `factionPromotion?: boolean`、`cultivationAlert?: boolean`、`wanjieDot?: boolean`

## REMOVED Requirements

### Requirement: 移除 PanelNav 组件

`PanelNav.tsx` SHALL 被删除。其功能 SHALL 由 `GameMenu.tsx`（主标签导航）+ `WanjiePanel.tsx`（"更多"下拉面板）替代。

#### Scenario: PanelNav 不再被引用

- **WHEN** 开发者在项目中搜索 `PanelNav`
- **THEN** SHALL NOT 有任何 import 引用（除 barrel 过渡期外）
- **AND** barrel 导出 SHALL 被移除

### Requirement: 移除 PanelContent 组件

`PanelContent.tsx` SHALL 被删除。其 switch-case 面板分发逻辑 SHALL 由 14 个独立 `PanelPage` 组件 + 路由系统替代。

#### Scenario: PanelContent 不再被引用

- **WHEN** 开发者在项目中搜索 `PanelContent`
- **THEN** SHALL NOT 有任何 import 引用（除 barrel 过渡期外）
