## Context

当前项目中，开始页面(`StartScreen`)、世界选择页(`WorldSelect`)、人物选择页(`CharacterSelect`)、背景故事页(`BackstoryView`) 已形成一套高度一致的东方玄幻视觉设计语言。这套语言通过以下组件与模式实现：

- `MysticalBackground` — 三变体(runes/stars/destiny)分层粒子背景
- 四角隅饰 + 渐变光线 Card 装饰体系
- `fade-in-up` 序列入场动画 + `pulse-glow` 持续辉光
- 钻石菱形符 `◆ ◇ ◆` 分隔装饰
- 印章式 Badge（旋转、边框、稀有度配色）
- `font-serif` + `tracking-[0.12em~0.15em]` 中文字符间距排版
- `bg-gradient-to-r from-transparent via-primary/N to-transparent` 渐变装饰线

主游戏页面(`MainGame`、`GameHeader`、各侧边栏、Tab 区域)及其他未统一页面尚未纳入此语言，存在：
- 视觉风格割裂（功能页缺乏东方玄幻氛围装饰）
- 部分区域字号偏小（`text-[8px]`、`text-[9px]`）
- 暗色主题下部分文字对比度不足
- 缺少统一的卡片装饰规范

## Goals / Non-Goals

**Goals:**
1. 从现有高质量页面提取完整 Design Guide，产出 `design.md` 作为唯一视觉真相源
2. 定义颜色令牌(Tokens)、字体排版等级(Type Scale)、卡片装饰层级、动画规范、明暗主题适配规则
3. 建立可读性强制约束——最小字号、最低对比度阈值
4. 将主游戏页面及其所有子组件按 Design Guide 统一重设计
5. 确保所有改动在明暗双主题下均清晰可读

**Non-Goals:**
- 不修改 shadcn/ui 源文件（`components/ui/`、`shared/ui/` 中由 shadcn CLI 管理的组件）
- 不改动游戏逻辑、状态管理、数据流
- 不引入新的 UI 组件库或 CSS 框架
- 不重新设计游戏的核心玩法交互流程

## Decisions

### 决策 1：Design Guide 内容结构

采用 Google Design Doc 风格，将设计系统分为五个独立章节，每章可独立引用。

| 章节 | 内容 | 源依据 |
|------|------|--------|
| 1. 颜色语义令牌 | primary/muted/destructive 语义 + 暗色映射表 | Tailwind semantic tokens + 现有页面实际使用 |
| 2. 字体排版等级 | 8 级排版（display → caption），每级定义 fontSize/lineHeight/letterSpacing/fontWeight | 现有页面实际字号抽样 + 可读性审计 |
| 3. 卡片装饰体系 | 四级装饰（无装饰 / 隅饰 / 隅饰+渐变光线 / 全装饰含背景渐变），对应使用场景 | WorldCard、CharacterCard、BackstoryView 的 Card |
| 4. 动画规范 | 入场动画时序（fade-in-up + stagger delay）、辉光动画（pulse-glow）、交互动画（hover/active） | StartScreen、WorldSelect 的 style animation |
| 5. 可读性约束 | 最小正文 11px、辅助文字 10px（印章等装饰性文字除外）、前景/背景对比度 ≥ 4.5:1（正文）、≥ 3:1（大文本 18px+） | WCAG AA 标准 |

**替代方案**: 使用 Storybook 或 Figma 作为设计系统载体 → 被否决，因为项目当前无 Figma 工作流，Storybook 引入成本高且与 Tailwind 工作流不一致。Markdown Design Guide 直接可被 AI Agent 引用，与 CLAUDE.md 规则体系一致。

### 决策 2：颜色令牌不重新定义，基于现有 Tailwind semantic tokens 扩展

项目已使用 Tailwind CSS 的 `--primary`、`--muted-foreground` 等 semantic tokens（shadcn 风格）。Design Guide **不重新定义**底层 CSS 变量，而是：

1. **明确现有 token 的语义使用场景**（如 `text-muted-foreground` 用于辅助描述文字，`text-foreground` 用于标题）
2. **定义游戏专属语义颜色**（如 `world-accent`、`danger-high`、`fortune-green` 等已在使用中的模式）
3. **建立明暗主题下每个 token 的可读性校验规则**

**替代方案**: 自建一套全新的 CSS 变量体系（`--wj-*`）→ 被否决，增加迁移成本和维护负担，与 Tailwind/shadcn 工作流冲突。

### 决策 3：卡片装饰采用组合式 Tailwind class 模式（非组件包装）

不创建 `<DecoratedCard>` 包装组件，而是提供装饰 class 组合模板。原因：

- shadcn Card 组件保持纯净，不引入自定义逻辑
- 装饰样式通过 `className` 组合，灵活度最高
- 降低抽象层级，新开发者可直接从 Design Guide 复制模板

每个装饰等级对应一个代码模板（含完整的 JSX 和 Tailwind class），在 Design Guide 中以代码块形式呈现。

**替代方案**: 创建 `MysticalCard` 组件包装 shadcn Card → 被否决，因为不同页面装饰需求差异大，一个组件难以覆盖所有变体；但可评估在 `shared/components/` 中提供可选装饰辅助。

### 决策 4：动画全部使用项目已有的全局 CSS keyframes（不引入新动画库）

项目已在 `globals.css` 中定义了 `fade-in-up`、`pulse-glow`、`star-twinkle`、`float`、`glow-rotate`、`constellation-fade`、`button-glow` 等关键帧。Design Guide 只规范这些已有动画的使用场景和时序参数，不新增依赖。

### 决策 5：字号与对比度强制约束

通过 Design Guide 建立硬性规则，后续通过 ESLint 规则或 CI 检查强制执行：

```
最小字号规则（装饰性文字除外）：
- 正文（body）: ≥ 11px (text-xs 为 12px，text-xs 即为最小正文字号)
- 辅助信息（caption）: ≥ 10px（仅用于 Badge、印章、时间戳等极短文字）
- 禁止使用 text-[8px]、text-[9px] 作为正文信息展示

对比度规则：
- 正文前景/背景对比度 ≥ 4.5:1
- 大文本（≥18px bold 或 ≥24px）对比度 ≥ 3:1
- 所有使用 text-muted-foreground 的元素在暗色主题下必须有背景色支撑
```

**替代方案**: 使用 Tailwind 的 `text-xs` (12px) 作为绝对最小 → 被否决，因为游戏面板信息密度高，`text-[10px]` 在印章、标签等短文字场景合理，需要精确控制而非一刀切。

### 决策 6：主游戏页面重设计策略——渐进增强

主游戏页面复杂度高（15+ Tab Panel、4 栏布局、移动端适配），不适合一次性全部重写。策略：

1. **外层容器**优先——先统一页面背景（引入 MysticalBackground subtle variant）、顶部 Header 装饰、侧边栏卡片化
2. **Tab 导航栏**——用印章式标签 + 渐变指示器替换当前样式
3. **各功能 Panel**——逐个对齐卡片装饰体系
4. **移动端**——同步应用装饰（控制装饰密度，避免在小屏上过于拥挤）

每一步独立可验证，不影响游戏功能。

## Risks / Trade-offs

- **[性能风险] MysticalBackground 在主游戏页面持续运行** → Mitigation: 使用 `intensity="subtle"` 降低粒子密度 60%，主游戏页面仅渲染 1 层柔光 + 少量符文（不渲染全部粒子层）；实测 `MysticalBackground` 仅使用 CSS animation，无 JS 运行时开销
- **[信息密度 vs 装饰冲突] 游戏面板信息密度高，过多装饰可能干扰阅读** → Mitigation: 装饰等级分四级，功能性面板使用"无装饰"或"仅隅饰"等级；装饰元素统一使用 `pointer-events-none` + `aria-hidden="true"`
- **[移动端适配] 装饰元素在小屏上可能挤压内容空间** → Mitigation: 装饰元素使用百分比定位 + `overflow-hidden`；四角隅饰在移动端缩小至 `w-2.5 h-2.5`
- **[兼容性] 部分游戏面板由 modules/ 中的组件实现，修改需要跨模块协调** → Mitigation: 视觉层修改不改变组件 props 接口，仅调整 className；不影响模块自治性

## Open Questions

1. **MysticalBackground 是否需要新增 variant？** 主游戏页面可能适合一个新的 `cultivation` variant（修炼氛围——灵气流动线条 + 微光粒子），需在实际实现时由视觉验证决定。当前计划复用 `runes` + `intensity="subtle"`。
2. **ESLint 字号/对比度检查规则是否作为本变更的一部分？** 理想情况下应包含，但取决于实现复杂度。如 ESLint 规则开发耗时过长，可作为独立 follow-up 变更。
