# world-select-ui

## Purpose

TBD — see change world-first-selection-flow for full context.

# world-select-ui

沉浸式世界选择界面，采用"万象星盘"主题，消除通用 SaaS 模板感，强化选择命运的仪式感。

## Requirements

### Requirement: 万象星盘主视觉

世界选择界面 SHALL 以"万象星盘"为核心视觉主题，8 个世界以 4 列×2 行卡片网格展示，背景使用 MysticalBackground（stars 变体）营造星图氛围。PC 端优先，移动端自动降级。

#### Scenario: 桌面端星图布局
- **WHEN** 用户在桌面端（宽度 ≥ 1024px）访问世界选择页
- **THEN** 世界卡片 SHALL 以 4 列 × 2 行 grid 布局展示
- **AND** 页面背景 SHALL 使用 MysticalBackground `variant="stars"` 渲染星点粒子和星座连线
- **AND** 鼠标悬停时世界卡片 SHALL 有金边辉光效果（`gold-glow` 关键帧，box-shadow 从 15px 到 30px）和微微上浮（translateY -4px）

#### Scenario: 移动端降级布局
- **WHEN** 用户在移动端（宽度 < 768px）访问世界选择页
- **THEN** 世界 SHALL 以单列垂直滚动列表展示
- **AND** 背景粒子密度 SHALL 降低至 subtle 模式
- **AND** 星座连线 SHALL 隐藏

#### Scenario: 减少动画偏好
- **WHEN** 用户系统设置了 `prefers-reduced-motion`
- **THEN** 背景粒子动画 SHALL 停止（粒子仍显示）
- **AND** 卡片 hover 动画 SHALL 禁用
- **AND** 过渡动画 SHALL duration 设为 0

### Requirement: 世界卡片展示独特视觉主题与装饰元素

每个世界卡片 SHALL 使用与世界观匹配的视觉主题，并包含丰富的东方古典装饰元素：四角隅饰、印章风格 Badge、装饰性分隔线、世界图标作为视觉锚点。

#### Scenario: 修仙世界视觉
- **WHEN** 渲染修仙世界卡片
- **THEN** SHALL 使用金色/琥珀色渐变（`from-amber-500/20 to-yellow-600/10`）
- **AND** 世界图标 ☯ SHALL 以 3rem 大字号居中展示作为视觉锚点
- **AND** 悬停时 SHALL 有金边辉光效果（金色 box-shadow glow）

#### Scenario: 科技世界视觉
- **WHEN** 渲染科技世界卡片
- **THEN** SHALL 使用青色/蓝色渐变（`from-cyan-500/20 to-blue-600/10`）
- **AND** 世界图标 ⬡ SHALL 以 3rem 大字号居中展示
- **AND** 悬停时 SHALL 有青色辉光效果

#### Scenario: 末世世界视觉
- **WHEN** 渲染末世世界卡片
- **THEN** SHALL 使用暗灰/板岩色渐变（`from-zinc-500/20 to-slate-700/10`）
- **AND** 世界图标 ◉ SHALL 以 3rem 大字号居中展示
- **AND** 悬停时 SHALL 有灰白辉光效果

#### Scenario: 四角装饰
- **WHEN** 任意世界卡片渲染
- **THEN** 卡片四角 SHALL 有装饰性几何隅饰（CSS pseudo-element 实现，三角形或如意纹简化版）
- **AND** 隅饰颜色 SHALL 为卡片边框色，opacity 0.4-0.6

#### Scenario: 印章风格 Badge
- **WHEN** 世界难度或类型标签渲染
- **THEN** 难度标签 SHALL 使用印章风格（双线 border、serif 字体、微微旋转 -2deg）
- **AND** 类型标签 SHALL 使用世界对应色彩

#### Scenario: 装饰性分隔
- **WHEN** 卡片标题与内容之间需要分隔
- **THEN** SHALL 使用渐变线 + 菱形符号分隔（如 `── ✦ ──`）

### Requirement: 标题与引导文字有游戏叙事感

页面标题和引导文字 SHALL 使用游戏叙事口吻，而非工具式标签。

#### Scenario: 标题文本
- **WHEN** 世界选择页渲染
- **THEN** 标题 SHALL 为"万象星盘 · 择一方天地"或类似叙事风格文本
- **AND** SHALL NOT 使用"选择你的世界"这类直白标签

#### Scenario: 引导提示
- **WHEN** 用户未选中任何世界时
- **THEN** 页面 SHALL 显示引导文字如"星辰流转，命运之轮已开始转动…选择你将降临的世界"
