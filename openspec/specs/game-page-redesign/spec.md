# Game Page Redesign

## Purpose

按照 Design Guide 视觉词汇统一重设计主游戏页面(MainGame)及其所有子组件：
顶部状态栏、侧边栏面板、Tab 导航栏、功能 Panel、对话框弹窗。确保明暗双主题下内容清晰可读。

> 从 `unified-page-design-system` change 同步。

## Requirements

### Requirement: 主游戏页面背景氛围

主游戏页面(MainGame) SHALL 引入 MysticalBackground 氛围背景，
使用 `variant="runes"` + `intensity="subtle"` 参数，
营造与首页一致的东方玄幻修炼氛围，同时不干扰游戏操作区的内容可读性。

#### Scenario: 背景粒子密度降低

- **WHEN** 主游戏页面渲染背景
- **THEN** 粒子密度为首页的 60%（via `intensity="subtle"`）
- **AND** 仅渲染柔光团 + 浮动符文层，不渲染旋转光晕环

#### Scenario: 背景不影响交互

- **WHEN** 用户点击 Tab、按钮等交互元素
- **THEN** 背景层不拦截任何点击事件（`pointer-events-none`）
- **AND** 背景层不创建新的层叠上下文遮挡下拉菜单/弹窗

### Requirement: 顶部状态栏重设计

GameHeader 组件 SHALL 按照 Design Guide 卡片装饰体系重设计，
外层容器应用四角隅饰 + 顶部渐变光线，内部信息区块用精致分隔线分隔。

#### Scenario: Header 带装饰卡片容器

- **WHEN** 桌面端 GameHeader 渲染
- **THEN** 外层容器应用四角隅饰（`w-3 h-3` border 装饰）
- **AND** 顶部应用渐变光线 `bg-gradient-to-r from-transparent via-primary/20 to-transparent`
- **AND** 区块间使用 `<div className="w-px bg-gradient-to-b from-transparent via-border to-transparent" />` 替代纯色 `bg-border`

#### Scenario: 属性条带刻度标记

- **WHEN** HP/MP/EXP 等进度条渲染
- **THEN** 进度条两端增加微刻度标记（使用 CSS `box-shadow` 或伪元素）
- **AND** 进度条填充色使用渐变（`bg-gradient-to-r`），而非纯色
- **AND** 当前值/最大值数字对比度 ≥ 4.5:1

#### Scenario: 移动端 Header 保持紧凑

- **WHEN** 移动端（<640px）Header 渲染
- **THEN** 四角隅饰缩小至 `w-2 h-2`
- **AND** 装饰线简化（减少渐变分段）
- **AND** 水平方向 padding 减少至 `px-2`

### Requirement: 侧边栏面板卡片化

LeftSidebar 和 RightSidebar 中的功能性面板(StatusPanel、WorldInfoPanel、SaveLoadPanel、
MessagePanel 等) SHALL 使用 Design Guide 卡片装饰 Level 2（四角隅饰），
为每个面板提供独立、清晰的视觉边界。

#### Scenario: 面板使用四角隅饰

- **WHEN** StatusPanel 渲染
- **THEN** 面板容器应用四角隅饰装饰
- **AND** 隅饰颜色使用 `border-primary/20`（与当前活跃主题色协调）

#### Scenario: 面板标题使用装饰分隔线

- **WHEN** 面板标题区域渲染
- **THEN** 标题下方使用渐变分隔线 `bg-gradient-to-r from-transparent via-border/40 to-transparent`
- **AND** 不再使用 `<Separator />` 的纯色水平线

#### Scenario: 无装饰 shadcn 组件保持原样

- **WHEN** ScrollArea、Button variant="outline" 等 shadcn 基础组件渲染
- **THEN** 不额外添加四角隅饰或装饰线
- **AND** 这些基元组件与装饰体系自然共存

### Requirement: 中央操作区(Tab)导航栏重设计

MainGame 的 Tab 导航栏 SHALL 重设计为印章式标签风格：
激活态 Tab 使用渐变底部指示器（`bg-gradient-to-r from-primary/80 to-primary`）
替代默认的 `data-[state=active]:bg-background`。

#### Scenario: Tab 激活态使用渐变指示器

- **WHEN** 用户点击 Tab 触发切换
- **THEN** 激活 Tab 底部显示 2px 渐变指示线
- **AND** 非激活 Tab 使用 `text-muted-foreground`，hover 时使用 `text-foreground`
- **AND** 切换动画使用 CSS transition（`transition-all duration-200`）

#### Scenario: Tab 分类标签保持可见

- **WHEN** Tab 行渲染（修炼/制造/收集三行分组）
- **THEN** 每行左侧分类标签（`text-[10px] text-muted-foreground`）保留但调整颜色为 `text-primary/50 font-serif`
- **AND** 使用印章式样式（`border-[1.5px] rounded-sm px-1.5 py-0`）

### Requirement: 功能面板(Panel)卡片化

所有 `modules/*/components/` 中的功能 Panel 组件(CultivationPanel、AdventurePanel、
FactionPanel、ShopPanel 等) SHALL 在滚动容器外层应用 Design Guide 卡片装饰，
内部逻辑和状态管理保持不变。

#### Scenario: Panel 外层容器装饰

- **WHEN** 任何功能 Panel 渲染（如 CultivationPanel、InventoryPanel）
- **THEN** 外层 Card 容器应用四角隅饰（Level 2）
- **AND** 容器内 `ScrollArea` 保持功能不变
- **AND** 不修改 Panel 的 props 接口

#### Scenario: 空状态展示

- **WHEN** Panel 内容为空（如 InventoryPanel 无物品）
- **THEN** 空状态提示 MUST 使用 ≥ 11px 文字
- **AND** 使用钻石菱形符 `◆ ◇ ◆` 装饰空状态占位区
- **AND** 空状态文字颜色为 `text-muted-foreground/60`（暗色主题下确保对比度）

### Requirement: 对话框与弹窗统一装饰

所有 Dialog、AlertDialog 及自定义弹窗 SHALL 应用顶部渐变光线装饰 +
标题区域 `font-serif` 排版，与选择页卡片风格一致。

#### Scenario: Dialog 顶部渐变光线

- **WHEN** 任何 Dialog 组件渲染
- **THEN** Dialog header 区域顶部应用渐变光线 `bg-gradient-to-r from-transparent via-primary/30 to-transparent`
- **AND** DialogTitle 应用 `font-serif tracking-[0.1em]`

### Requirement: 可读性全局审计

所有页面 SHALL 通过可读性审计，确保：
正文文字 ≥ 11px、背景/前景对比度 ≥ 4.5:1（正文）、
暗色主题下所有文字清晰可见。

#### Scenario: 过小字号修正

- **WHEN** 发现 `text-[8px]` 或 `text-[9px]` 样式的功能性文字（非装饰）
- **THEN** 升级至 `text-[10px]`（装饰标签/印章）或 `text-xs`（正文信息）
- **AND** 如信息密度过高导致溢出，重新设计布局而非缩小字号

#### Scenario: 暗色主题对比度审计

- **WHEN** 在 dark 主题下审计任何页面
- **THEN** 所有 `text-muted-foreground` 文字与背景的对比度 ≥ 4.5:1
- **AND** 低对比度元素（如 `text-muted-foreground/50`）MUST 确认为纯装饰用途
