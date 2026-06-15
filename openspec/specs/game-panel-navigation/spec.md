# Game Panel Navigation

## Purpose

用"底栏（5 主入口）+ 万界盘（9 功能分 3 组）"替代当前 3 层 15 个 Tab 的功能导航系统。高频操作一键即达，低频操作两步可达。导航视觉风格符合东方玄幻游戏审美。

## Requirements

### Requirement: 底栏常驻 5 个主入口

底栏（PanelNav）SHALL 始终显示 5 个最高频功能入口：修炼、机缘、势力、功法、商店，以及打开万界盘的按钮。

#### Scenario: 底栏渲染

- **WHEN** 游戏主页面桌面端渲染
- **THEN** 底栏渲染在 CenterArea 底部
- **AND** 5 个主入口以 icon + 中文标签形式显示
- **AND** 当前活跃面板对应的入口高亮（金色底部指示线或背景色变化）
- **AND** 底栏最右侧显示 `✦` 万界盘按钮

#### Scenario: 移动端底栏

- **WHEN** 移动端（<768px）渲染
- **THEN** 底栏主入口仅显示 icon（不显示标签），节省空间
- **AND** icon 尺寸适配触摸操作（最小 44x44px 点击区域）
- **AND** 万界盘按钮保留

#### Scenario: 点击主入口切换面板

- **WHEN** 用户点击底栏中的主入口按钮
- **THEN** CenterArea 的内容区切换到对应的功能面板
- **AND** 当前活跃面板状态由 CenterArea 的 `useState(activePanel)` 管理
- **AND** 切换动画为 ~200ms 淡入淡出

### Requirement: 万界盘分组展示剩余功能

万界盘（WanjiePanel）SHALL 以底部滑出面板形式展示剩余 9 个功能，分为三组：炼造（炼丹、炼器、碎片）、武备（技能、试炼）、记载（成就、图鉴、统计）。

#### Scenario: 万界盘打开

- **WHEN** 用户点击底栏的 `✦` 按钮
- **THEN** 万界盘从底部滑入（`translateY` 动画，~300ms）
- **AND** 背景出现半透明蒙层（`bg-black/40`）
- **AND** 内容区略微缩小或变暗以突出层级关系

#### Scenario: 万界盘内容

- **WHEN** 万界盘渲染
- **THEN** 面板内以分组卡片形式展示 9 个功能入口
- **AND** 每组有中文标题（炼造、武备、记载）和装饰分隔线
- **AND** 每个功能入口显示 icon + 中文名称
- **AND** 入口样式与 Design Guide 卡片体系一致（圆角、阴影、hover 效果）

#### Scenario: 万界盘选择面板

- **WHEN** 用户在万界盘中点击某个功能入口
- **THEN** 万界盘关闭（滑出动画）
- **AND** CenterArea 切换到被选中的功能面板
- **AND** 底栏的主入口全部取消高亮（选中的不是主入口）

#### Scenario: 万界盘关闭

- **WHEN** 用户点击背景蒙层或关闭按钮
- **THEN** 万界盘滑出关闭
- **AND** 当前活跃面板保持不变
- **AND** 按 Escape 键也可关闭

### Requirement: 主入口状态提示

底栏主入口 SHALL 支持状态指示器（红点/光点），提示用户该功能中有待处理事项。

#### Scenario: 炼丹进行中提示

- **WHEN** 玩家有炼丹正在进行（`crafting !== null`）
- **THEN** 万界盘按钮显示脉冲光点
- **AND** 光点使用 `animate-ping` 动画

#### Scenario: 可晋升提示

- **WHEN** 势力贡献度满足晋升条件
- **THEN** 势力主入口显示黄色光点

### Requirement: 面板切换保持状态

面板切换 SHALL 保持各面板的内部状态（如滚动位置、输入内容），不因切换而重置。

#### Scenario: 面板状态保持

- **WHEN** 用户从修炼面板切换到势力面板再切回修炼面板
- **THEN** 修炼面板的滚动位置和输入状态保持不变
- **AND** 实现方式：所有面板保持挂载，仅通过 CSS `display` 或条件渲染切换可见性

### Requirement: PanelNav 不包含业务逻辑

PanelNav SHALL 仅负责渲染导航 UI 和接收用户点击，不包含任何游戏业务逻辑。

#### Scenario: PanelNav props

- **WHEN** PanelNav 渲染
- **THEN** 接收 `activePanel`、`onPanelChange`、状态提示 flag 作为 props
- **AND** 不直接调用 `useGameStore()` 或任何领域 Hook
- **AND** 状态提示数据（如 `hasActiveCrafting`、`canPromote`）由父组件 CenterArea 通过领域 Hook 获取后传入
