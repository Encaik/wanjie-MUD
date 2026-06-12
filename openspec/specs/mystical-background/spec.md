# mystical-background

## Purpose

可配置的东方玄幻氛围背景系统，将首页浮动符文/粒子/光晕效果抽象为跨页面复用的共享组件，支撑从首页到选择页的连贯视觉旅程。

## Requirements

### Requirement: 背景系统支持三种场景变体

MysticalBackground 组件 SHALL 支持 `variant` prop，取值为 `runes`、`stars`、`destiny`，每种变体提供不同的氛围元素组合。所有变体 SHALL 共享柔光团、旋转光晕环基础层。

#### Scenario: runes 变体（首页）
- **WHEN** MysticalBackground 以 `variant="runes"` 渲染
- **THEN** SHALL 显示 8 个浮动汉字符文（道、法、修、仙、灵、气、天、地）
- **AND** SHALL 显示 8 个散布光点粒子（2-3px，primary 色）
- **AND** SHALL 显示中央柔光团（500px × 500px，blur-3xl，opacity 0.04）
- **AND** SHALL 显示旋转光晕环（650px × 650px，border，12s 旋转）
- **AND** SHALL 显示巨大水印文字（当前页面主题文字，opacity 0.04-0.06）

#### Scenario: stars 变体（世界选择）
- **WHEN** MysticalBackground 以 `variant="stars"` 渲染
- **THEN** SHALL 显示 60-80 个星点粒子（1-4px，金色/琥珀色为主，含少量朱砂暖红）
- **AND** SHALL 显示 8-12 条星座连线（隐约金线连接星点，opacity 0.15-0.3）
- **AND** SHALL 显示 3-4 个柔光团（位置对应卡片区域，颜色联动世界类型）
- **AND** SHALL 显示水印文字"万象"
- **AND** SHALL NOT 显示浮动汉字符文

#### Scenario: destiny 变体（人物选择）
- **WHEN** MysticalBackground 以 `variant="destiny"` 渲染
- **THEN** SHALL 显示 80-100 个光点粒子（以金色为主，密度高于 stars）
- **AND** SHALL 显示隐约命运之线（更细更密的金色连线，opacity 0.08-0.15）
- **AND** SHALL 显示 2 个大型柔光团（位置对应卡片区域中心）
- **AND** SHALL 显示水印文字"命运"
- **AND** SHALL NOT 显示浮动汉字符文

### Requirement: 粒子动画使用东方玄幻风格的关键帧

所有背景粒子 SHALL 使用专为东方玄幻氛围设计的关键帧动画，而非通用 CSS 动画。

#### Scenario: 星光闪烁
- **WHEN** 星点粒子渲染（stars/destiny 变体）
- **THEN** 每个星点 SHALL 使用 `star-twinkle` 关键帧
- **AND** 动画 SHALL 包含不规则明灭（opacity 0.2→0.8→0.2→0.6）、缩放变化（scale 1→1.3→0.8→1.1）
- **AND** 每个星点 SHALL 有独立的动画延迟（0-4s 随机）

#### Scenario: 星座连线渐显
- **WHEN** 星座连线渲染（stars 变体）
- **THEN** 连线 SHALL 使用 `constellation-fade` 关键帧
- **AND** 线条 SHALL 从透明渐显至 opacity 0.15-0.3

#### Scenario: 符文浮动
- **WHEN** 浮动符文渲染（runes 变体）
- **THEN** 符文 SHALL 使用 `float` 关键帧（translateY ±12px + rotate ±2deg）
- **AND** 每个符文 SHALL 有独立的动画时长（6.5-9s）和延迟

### Requirement: 背景系统支持动画降级

背景系统 SHALL 尊重用户的 `prefers-reduced-motion` 系统设置。

#### Scenario: 减少动画
- **WHEN** 用户系统设置了 `prefers-reduced-motion: reduce`
- **THEN** 所有粒子动画 SHALL 停止（animation: none）
- **AND** 光晕旋转 SHALL 停止
- **AND** 符文浮动 SHALL 停止
- **AND** 粒子仍然显示（不隐藏），仅移除动画

### Requirement: 背景系统作为共享组件存在

MysticalBackground 组件 SHALL 放置在 `shared/components/` 目录，作为跨页面复用的通用组件。

#### Scenario: 组件位置
- **WHEN** 搜索 MysticalBackground 的源码位置
- **THEN** SHALL 位于 `src/shared/components/MysticalBackground.tsx`
- **AND** SHALL 通过 `src/shared/components/index.ts` 导出

#### Scenario: 组件不依赖 modules/
- **WHEN** 检查 MysticalBackground 的导入
- **THEN** SHALL NOT 依赖任何 `modules/` 或 `views/` 中的代码
- **AND** 仅依赖 `shared/` 和 React

### Requirement: 背景系统提供强度控制

MysticalBackground SHALL 支持 `intensity` prop 以控制粒子密度和光效强度。

#### Scenario: 强度级别
- **WHEN** `intensity="subtle"`（默认值）
- **THEN** 粒子数量 SHALL 为基准值的 60%
- **AND** 柔光 opacity SHALL 降低至基准值的 50%

#### Scenario: 全强度
- **WHEN** `intensity="full"`
- **THEN** 粒子数量 SHALL 为基准值的 100%
- **AND** 所有图层 SHALL 以完整强度渲染
