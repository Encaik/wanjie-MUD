# startup-loading-integration

## Purpose

将 Mod 加载进度展示从独立的全屏遮罩层整合进首页 StartScreen 组件中，消除加载完成到首页展示之间的视觉闪烁。

## ADDED Requirements

### Requirement: Mod 加载进度在首页内嵌展示

Mod 加载进度 SHALL 在 StartScreen 组件内部展示，而非使用独立的 `ModLoadingOverlay` 全屏遮罩。StartScreen 接收 `modLoadState` prop，在 Mod 处于 `loading` 阶段时展示加载动画和进度条，替换"踏入万界"按钮区域。

#### Scenario: Mod 加载中展示进度
- **WHEN** 应用启动且 Mod 加载阶段为 `loading`
- **THEN** StartScreen SHALL 保持背景装饰（符文、光点），但将中间的卡片内容替换为加载进度指示器
- **AND** 加载进度指示器 SHALL 显示"正在加载世界数据..."文案、当前进度数字（N/M）和进度条

#### Scenario: Mod 加载完成后平滑过渡到首页
- **WHEN** Mod 加载阶段从 `loading` 变为 `ready`
- **THEN** StartScreen SHALL 在不闪烁的情况下过渡到"踏入万界"按钮界面
- **AND** 过渡动画 SHALL 使用淡入效果（fade-in），持续不超过 500ms

#### Scenario: Mod 加载失败时展示错误信息
- **WHEN** Mod 加载阶段变为 `error`
- **THEN** StartScreen SHALL 在卡片区域展示错误信息和"刷新页面"按钮
- **AND** 错误信息 SHALL 包含失败 Mod 的名称

### Requirement: ModInitProvider 不再包裹全屏遮罩

`ModInitProvider` SHALL NOT 自行渲染全屏遮罩。它 SHALL 仅负责调用 `useModLoader()` 并通过 Context 将加载状态向下传递，让子组件自行决定如何展示加载状态。

#### Scenario: ModInitProvider 传递状态
- **WHEN** Mod 加载状态发生变化
- **THEN** ModInitProvider SHALL 通过 React Context 或 props 将 `ModLoaderState` 传递给子组件
- **AND** 不再渲染任何 `fixed inset-0` 的全屏遮罩元素

### Requirement: 首页路由集成 Mod 加载状态

首页路由（`app/page.tsx`）SHALL 从 `useModLoader` 获取 Mod 加载状态，并在 Mod 未就绪时阻止跳转到世界选择。

#### Scenario: Mod 未加载完成时点击开始
- **WHEN** 用户在 Mod 加载期间点击"踏入万界"
- **THEN** 按钮 SHALL 处于禁用状态
- **AND** 按钮文案 SHALL 显示"正在加载..."或类似提示

#### Scenario: Mod 加载完成后方可开始
- **WHEN** Mod 加载阶段为 `ready`
- **THEN** "踏入万界"按钮 SHALL 恢复可点击状态
