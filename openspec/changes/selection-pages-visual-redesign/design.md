## Context

### 背景
万界修行录当前有三个顺序页面：首页（StartScreen）→ 世界选择（WorldSelect）→ 人物选择（CharacterSelect）→ 背景故事。首页已实现丰富的东方玄幻氛围（浮动符文、光点粒子、旋转光晕、"万界"水印），但选择页退化为标准 shadcn 卡片网格，视觉体验严重割裂。

### 约束
- **五层架构**：新代码必须遵循 `app/` → `views/` → `modules/` → `core/` → `shared/` 的层次
- **文件大小**：组件 ≤300 行，Hook ≤200 行
- **语义颜色**：使用 `bg-background`、`text-foreground` 等 Token，禁止硬编码色值
- **禁止在旧目录新增文件**：`hooks/`、`lib/`、`components/game/`、`contexts/` 迁移过渡期只读
- **TypeScript 严格**：无 `any`、所有函数有类型标注
- **PC 优先**：桌面端主要设计目标，移动端降级适配

### 技术栈
- Tailwind CSS v4 + `tw-animate-css`
- shadcn/ui（Card、Button、Badge、Tooltip）
- CSS 自定义属性主题系统（`themes.css` tokens）
- Noto Serif SC 衬线字体
- 世界观视觉配置由后端 API 提供（`World.visualConfig`）

## Goals / Non-Goals

**Goals:**
- 将首页的氛围系统（粒子、光晕、水印）抽象为可复用背景组件
- 为世界选择和人物选择页注入东方古典装饰（四角隅饰、印章 Badge、金边辉光、命星之镜、经脉图）
- 统一三页的视觉语言——暖色书卷气 + 金泥星图 + 朱砂点缀
- PC 端优先，4 列×2 行舒展布局
- 丰富但不杂乱——动画有节制、装饰有层次、hover 反馈精致

**Non-Goals:**
- 不改变数据流和状态管理（`useGame()`、`useCharacterTemplates()` 不变）
- 不修改 API 路由或后端逻辑
- 不触及背景故事页（backstory）——本次仅限选择页
- 不引入新的第三方动画库或字体
- 不改变世界类型/视觉配置的数据结构（World.visualConfig 保持不变）

## Decisions

### 决策 1：MysticalBackground 放在 `shared/components/`

**选择**：放在 `shared/components/MysticalBackground.tsx`，作为跨页面通用组件。

**理由**：
- 三页（首页、世界选择、人物选择）共享同一套背景系统
- 按 CLAUDE.md 决策树：跨模块通用 UI 组件 → `shared/components/`
- 组件仅输出视觉效果，不包含业务逻辑，不依赖 `modules/`

**替代方案**：
- 放在 `core/` — 不合理，`core/` 禁止 React 组件
- 放在 `modules/` — 不合理，单一模块不应拥有跨视图的 UI 基础设施
- 放在 `views/` 中重复代码 — 违反 DRY 原则

### 决策 2：卡片拆分为独立组件

**选择**：`WorldCard.tsx` 和 `CharacterCard.tsx` 作为独立文件，从主视图组件中抽离。

**理由**：
- 当前 `WorldSelect.tsx`（182 行）和 `CharacterSelect.tsx`（262 行）已经接近上限
- 增加装饰元素后复杂度显著上升，拆分避免超限
- 独立卡片组件可单独优化 hover 动画和粒子吸附逻辑

**组件树**：
```
WorldSelect.tsx (~150 行)
  ├── MysticalBackground (stars)
  ├── 标题区 (inline)
  └── WorldCard[] (~250 行 each, ≤300)

CharacterSelect.tsx (~180 行)
  ├── MysticalBackground (destiny)
  ├── WorldInfoBar (重构, ~80 行)
  ├── 标题区 (inline)
  └── CharacterCard[] (~280 行 each, ≤300)
```

### 决策 3：装饰边框用 CSS pseudo-element 而非 SVG

**选择**：四角隅饰使用 `::before`/`::after` + CSS border 几何形，印章效果用 CSS 实现。

**理由**：
- CSS pseudo-element 不增加 DOM 节点，性能更好
- 纯 CSS 印章效果（双线 border + rotate + serif）已经足够精致
- 避免为简单装饰引入 SVG 内联或额外文件

**替代方案**：
- SVG 内联纹样 — 更精细但增加 DOM 复杂度，且需要为每种世界类型准备不同 SVG
- Canvas 绘制 — 过度工程化，不利于响应式

**印章 Badge 实现**：
```css
.seal-badge {
  border: 1.5px double currentColor;
  border-radius: 2px;
  font-family: var(--font-serif);
  transform: rotate(-2deg);
  letter-spacing: 0.1em;
}
```

### 决策 4：卡片 hover 粒子吸附效果用 CSS mask 而非 JS mousemove

**选择**：使用 CSS `radial-gradient` mask 在卡片 hover 时显示更亮/更大的背景粒子，而非 JavaScript 追踪鼠标移动粒子。

**理由**：
- 纯 CSS 方案性能远优于 JS mousemove 事件
- CSS mask 利用 GPU 合成，不触发重排
- "粒子吸附"的视觉效果可以通过卡片下柔光增亮 + 卡片内渐变变亮模拟

**实现思路**：
- 卡片 hover 时：`box-shadow` 金边辉光 + `transform: translateY(-4px)` + 背景渐变 opacity 从 0.2→0.35
- 卡片下方的柔光团通过 `transition: opacity 300ms` 联动

**替代方案**：
- JS mousemove 驱动粒子位置 — 交互更真实但性能开销大，PC 优先场景下可接受但不是必须
- 后续迭代可加入 JS 增强方案

### 决策 5：一步踏入 vs 两步确认

**选择**：点击世界卡片直接 `onSelect(world)` 进入角色选择，取消两步确认流程。

**理由**：
- 现有 spec 的两步确认增加了不必要的交互步数
- 用户已在世界卡片上看到足够信息做决定
- 仪式感通过动画和视觉效果（辉光过渡、页面切换动画）保留，不依赖阻塞步骤
- Genshin Impact 等高品质游戏采用单步选择模式

### 决策 6：动画系统扩展路径

**选择**：在 `animations.css` 新增 keyframes，在 `base.css` 的 `@layer utilities` 新增对应工具类。

**理由**：
- 保持现有 CSS 架构不变（`animations.css` = 定义，`base.css` = 工具类）
- 新增动画与现有 `pulse-glow`、`fade-in-up`、`float` 等共存

**新增 keyframes**：
| 名称 | 用途 | 页面 |
|------|------|------|
| `star-twinkle` | 星点不规则闪烁 | 世界选择、人物选择 |
| `constellation-fade` | 星座连线渐显 | 世界选择 |
| `gold-glow` | 金边辉光（hover） | 世界选择、人物选择 |
| `spirit-rise` | 灵气粒子升腾 | 人物选择 |

## Risks / Trade-offs

- **[粒子性能]** 60-100 个星点 + 动画在低端设备可能卡顿 → PC 优先减轻风险；`prefers-reduced-motion` 降级；使用 `will-change: transform, opacity` 优化合成层
- **[视觉过载]** 丰富路线可能导致页面过于花哨 → 所有装饰元素使用低 opacity (0.04-0.4)，多图层但弱对比；印章 Badge 仅在特定标签使用
- **[移动端适配]** 4 列布局在手机端不行 → 响应式降级：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`，移动端减半粒子
- **[文件大小]** CharacterCard 可能接近 300 行限制 → 如超过则进一步拆分为子组件（StatBars、DestinyMirror、TalentSeals）

## Open Questions

1. **首页 StartScreen 是否需要同步重构以使用 MysticalBackground？** — 逻辑上应该，但增加变更范围。建议本次先提取组件并让首页引用，确保三页统一。
2. **命星之镜是否需要根据种族变化视觉？** — 当前用性别区分暖/冷色调，种族信息仅显示文字。后续可扩展为种族图标。
3. **卡片选择时的过渡动画？** — 点击卡片进入下一页时是否需要全屏过渡效果（如星盘旋转、粒子汇聚）？建议本次用 Next.js 默认路由过渡，后续迭代增强。
