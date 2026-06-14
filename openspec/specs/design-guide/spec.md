# Design Guide

## Purpose

定义万界修行录的统一视觉设计词汇：颜色令牌、字体排版、卡片装饰、动画时序、明暗双主题适配规则。
所有页面的视觉实现 SHALL 遵循本指南。

> 从 `unified-page-design-system` change 同步。

## Requirements

### Requirement: 颜色语义令牌(Color Tokens)

系统 SHALL 定义一套完整的颜色语义令牌，涵盖前景色、背景色、边框色和装饰色，
作为所有页面视觉实现的唯一颜色来源。令牌基于 Tailwind CSS semantic tokens 扩展，
每一类令牌 MUST 在明暗双主题下均通过可读性验证。

#### Scenario: 前景色令牌在明暗主题下均清晰可读

- **WHEN** 使用 `text-foreground`、`text-muted-foreground`、`text-primary` 等前景色令牌
- **THEN** 在 light 主题下对比度 ≥ 4.5:1（正文级）或 ≥ 3:1（大文本级）
- **AND** 在 dark 主题下对比度同样满足上述阈值
- **AND** `text-muted-foreground` 在暗色主题下有明确的背景色支撑

#### Scenario: 装饰色令牌不干扰内容阅读

- **WHEN** 使用 `text-primary/30`、`text-amber-400/20` 等低透明度装饰色
- **THEN** 元素 MUST 设置 `aria-hidden="true"` 或 `pointer-events-none`
- **AND** 装饰色元素不包含对用户决策关键的信息

### Requirement: 字体排版等级(Type Scale)

系统 SHALL 定义 8 级排版等级(display → caption)，每级明确 fontSize、lineHeight、letterSpacing、
fontWeight 和适用场景。所有页面组件 MUST 使用排版等级而非内联 `text-[Npx]` 数值。

#### Scenario: 标题使用 serif + 宽字距

- **WHEN** 页面主标题渲染时
- **THEN** 应用 `font-serif` + `tracking-[0.12em]~tracking-[0.15em]`
- **AND** 响应式字号为 `text-2xl md:text-4xl`

#### Scenario: 正文最小字号不小于 11px

- **WHEN** 任何包含完整句子或段落信息的正文文字渲染
- **THEN** fontSize SHALL ≥ 11px (约 `text-xs` 即 0.75rem)
- **AND** 仅 Badge、印章、时间戳等装饰性短文字（≤4 汉字）可使用 `text-[10px]`

#### Scenario: 禁止使用过小字号

- **WHEN** 样式表中出现 `text-[8px]` 或 `text-[9px]`
- **THEN** ESLint 或构建检查 SHALL 报告警告
- **AND** 仅有明确 `/* decorative */` 注释的装饰性元素可豁免

### Requirement: 卡片装饰体系(Card Decoration)

系统 SHALL 定义四级卡片装饰等级，每级对应一组 Tailwind class 模板。
开发者 MUST 根据使用场景选择对应等级，不允许随意混用。

#### Scenario: 装饰等级选择

- **WHEN** 功能性信息面板（如属性展示、状态卡片）渲染
- **THEN** 使用 Level 1（无装饰）或 Level 2（仅四角隅饰）
- **AND** 装饰元素设置 `aria-hidden="true"`

#### Scenario: 主操作卡片使用全装饰

- **WHEN** 引导用户做核心决策的卡片（如世界选择、角色选择）渲染
- **THEN** 使用 Level 4（四角隅饰 + 渐变光线 + 背景渐变 + hover 辉光）
- **AND** hover 时触发 `shadow-xl` + `-translate-y-1` 微浮效果

### Requirement: 入场动画时序(Animation Timing)

系统 SHALL 使用统一的入场动画模式：`fade-in-up` + stagger delay。
stagger delay 公式为 `index * 0.08s`，首个元素延迟为 0。

#### Scenario: 卡片网格入场动画

- **WHEN** 多个并列卡片同时挂载
- **THEN** 每张卡片应用 `animation: fade-in-up 0.5s ease-out ${index * 0.08}s both`
- **AND** 最后一个卡片的延迟不超过 1.2s

#### Scenario: 持续辉光动画

- **WHEN** 需要营造神秘/灵气氛围的图标或光晕元素渲染
- **THEN** 应用 `animation: pulse-glow 2.5s~5s ease-in-out infinite`
- **AND** 动画仅影响 `opacity` 属性，不触发布局重排

### Requirement: 明暗双主题适配(Dual Theme)

系统 SHALL 确保所有页面组件在 light 和 dark 主题下均功能可用、内容清晰。
使用 Tailwind `dark:` 前缀处理主题差异，禁止仅设计单一主题的样式。

#### Scenario: 暗色主题下卡片背景不透明

- **WHEN** 用户在 dark 主题下浏览任何页面
- **THEN** Card 组件背景色 `bg-card` 为暗色且有足够对比度
- **AND** 卡片内文字（包括 muted-foreground）对比度 ≥ 4.5:1

#### Scenario: 暗色主题下装饰元素降透明度

- **WHEN** 装饰性渐变线、光晕、粒子在 dark 主题下渲染
- **THEN** 透明度降低 20%-30%（相对于 light 主题），避免在暗背景上过度刺眼

### Requirement: 跨页面一致性(Consistency)

所有 5 个页面路由（首页、世界选择、人物选择、背景故事、主游戏）的视觉风格
SHALL 共享同一套 Design Guide 词汇，不允许页面间出现视觉断裂。

#### Scenario: 装饰元素跨页面复用

- **WHEN** 多个页面使用装饰分隔线
- **THEN** MUST 使用统一模板：`<div className="flex items-center gap-4"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />...`
- **AND** 菱形符统一为 `◆ ◇ ◆`，颜色统一为 `text-muted-foreground/20` 或 `text-muted-foreground/30`

#### Scenario: 按钮风格统一

- **WHEN** 任何页面的主行动按钮(Call to Action)渲染
- **THEN** 应用 `font-serif tracking-[0.15em]` + 外发光容器
- **AND** hover 时 `hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20`
- **AND** active 时 `active:scale-[0.98]`
