## Context

当前 `src/shared/ui/` 的 55 个组件直接使用 shadcn 默认样式参数。`tokens.css` 定义了完整的语义 token 体系但视觉值基于 Tailwind 默认值。圆角全部在 `0.5rem` 附近，阴影为中性灰，背景为纯色填充。组件视觉上没有层次感和材质感，也没有任何与修仙题材相关的视觉引用。

## Goals / Non-Goals

**Goals:**
- 重新定义 `tokens.css` 中的圆角、阴影视觉基线参数
- 为基础组件（button、card、dialog、input、item、tooltip 等）增加材质层次感
- 引入克制但有辨识度的装饰性细节（分割线、边框层次）
- 交互反馈从纯透明度变化升级为有"手感"的位移/发光组合
- 所有改动通过 CSS token 值和 Tailwind 类实现，不引入第三方依赖

**Non-Goals:**
- 不改动游戏领域面板的布局结构（如 CultivationPanel、EquipmentPanel）
- 不增加运行时 JS 开销（纯 CSS 装饰）
- 不改动已确立的 7 分类目录结构
- 不改变组件的 ARIA 和无障碍属性
- 不重构组件逻辑，只改视觉样式

## Decisions

### Decision 1: 圆角策略 — 差异化，不统一

不再一刀切 `rounded-md`，按组件类型分配不同圆角值：

| 组件类型 | 目标圆角 | 当前值 | 原因 |
|---------|---------|--------|------|
| Button / Input / Badge | `rounded-sm` (0.375rem) | `rounded-md` (0.5rem) | 操作元素用偏锐角，更利落 |
| Card / Dialog / Sheet | `rounded-xl` (0.75rem) | `rounded-xl` / `rounded-lg` | 容器保留柔和感不变 |
| Tooltip / Popover | `rounded-lg` (0.5rem) | `rounded-md` | 浮层比容器略小 |
| Separator / Divider | 直角 | 直角 | 分割线天然直角 |
| Sidebar / Navigation | `rounded-none` 或 `rounded-sm` | `rounded-md` | 导航用直角更端正 |

通过修改各组件的 `cva` 或 `className` 中的 `rounded-*` 类实现，不改动 `--radius` CSS 变量（保持全局一致性）。

### Decision 2: 边框层次 — 双边框 + 内描边

```
当前：
  border border-border           ← 一条线平铺

目标：
  外框: border border-border/80  ← 稍有透明度的外框
  内描边: inset shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]  ← 左上内发光
  装饰底线: 卡片/弹窗头部下加 bg-gradient-to-r from-transparent via-border to-transparent h-px
```

- Card 和 Dialog：外框保持 `border-border`，增加 `shadow-[inset_0_1px_0_var(--border)]` 左上高光线
- Button：增加 `shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]` 内高光，模拟凸起质感
- Input focus：从 `ring-[3px]` 改为 `ring-2` + 内阴影，更细腻

### Decision 3: 材质感背景 — 微渐变叠层

Flat `bg-card` 改成两层叠合，产生纸张/绢帛的微妙颜色变化：

```typescript
// Card 当前:
"bg-card text-card-foreground flex flex-col gap-2 rounded-xl border py-3 shadow-sm"

// Card 目标:
"bg-gradient-to-b from-card via-card to-muted/20 text-card-foreground flex flex-col gap-2 rounded-xl border py-3 shadow-sm"
```

同样的处理应用到 Dialog、Sheet、Popover、Tooltip 的 `bg-popover`：
```typescript
"bg-gradient-to-b from-popover via-popover to-muted/10 text-popover-foreground ..."
```

**依据**: 从顶到底的 2-3% 亮度渐变就能打破纯扁平感，但不会被感知为"渐变"。

### Decision 4: 阴影系统 — 暖色偏光

`tailwindcss` 默认阴影是中性灰（`rgba(0,0,0,...)`），修改为暖褐色偏光，与米色主题色调一致：

```css
/* 当前 */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

/* 目标 */
--shadow-md: 0 4px 6px -1px oklch(0.3 0.04 55 / 0.12), 0 2px 4px -2px oklch(0.3 0.04 55 / 0.08);
```

所有 `--shadow-*` token 的色相从 0（中性灰）改为 55（暖褐），明度和透明度相应调整。暗色模式下阴影色相不变但明度降低。

### Decision 5: 交互反馈 — 位移 + 发光

```
Button hover:   translateY(-1px) + box-shadow 增强  代替 scale 缩放
Card hover:     border-color 从 border-border → border-primary/30 + 微弱 shadow 增强
Item hover:     左侧 2px 实色指示条 + 背景色 1% 变化
Input focus:    ring-2 border-primary/50 + 内阴影
```

**依据**: 缩放动效 (`scale`) 是 shadcn 默认的"AI 味"来源之一。改用纵向微位移 + 阴影变化，模拟纸张被拾起的物理感。

### Decision 6: 装饰性元素 — 克制，不堆砌

只加三种装饰元素，且只用于容器类组件（Card / Dialog / Item）：

1. **顶部装饰线**：CardHeader 和 DialogHeader 底部：`h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent`
2. **Item 行装饰**：每行左侧可选 `border-l-2` 色彩指示条（用 `quality-*` 或 `game-*` 色）
3. **激活指示器**：TabsTrigger active 状态底部：`shadow-[inset_0_-2px_0_var(--primary)]` 替代 `bg-background`

## Risks / Trade-offs

- **[Risk] 材质感渐变在暗色模式下不可见** → `.dark` 中 `to-muted/20` 调整为 `to-muted/30` 提高可见度
- **[Risk] 交互反馈变化被用户感知为"卡顿"** → 所有过渡保持 `duration-150` 至 `duration-200`，不过度
- **[Risk] 双边框/内描边影响组件高度计算** → 用 `shadow-[inset_...]` 而非实 border，不改变布局
- **[Risk] 改动面广（15+ 组件）** → 从核心 5 个组件（Button/Card/Dialog/Input/Item）先做，验证后再扩展到其余组件

## Migration Plan

```
Phase 1 — Token 层（无视觉变化，为后续打基础）
  1. 重新定义 tokens.css 中的 --shadow-* 值为暖色偏光
  2. animations.css 新增装饰性 keyframes（如 border-pulse, shimmer）

Phase 2 — 核心 5 组件（有视觉变化）
  3. Button：圆角调整 + 内高光阴影 + 新交互反馈
  4. Card：材质感渐变 + 装饰头部线 + 内描边
  5. Dialog：材质感渐变 + 装饰头部线 + 新阴影
  6. Input：focus 状态重设计 + 圆角调整
  7. Item：悬浮左侧指示条 + 装饰分隔线

Phase 3 — 扩展组件
  8. Tooltip / Popover / Sheet：材质感渐变 + 新阴影
  9. Tabs：激活指示器改为下划线式
  10. Badge / Select / 其他表单组件：圆角一致化

Phase 4 — 验证
  11. 全量 ts-check + build
  12. 多主题（暗色 + 世界主题）视觉回归
```
