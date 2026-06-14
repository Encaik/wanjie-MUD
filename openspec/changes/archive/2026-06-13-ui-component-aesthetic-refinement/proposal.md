## Why

`src/shared/ui/` 中 55 个组件当前使用 shadcn 默认样式参数——统一 `rounded-md` 圆角、扁平 `bg-primary` 填充、标准 `shadow-sm` 阴影。没有材质层次、没有装饰锚点、没有东方古典美学的视觉引用。每个组件在功能上都正确，但在视觉上缺乏"作品感"，这是"AI 味"的来源——精致但无个性。

## What Changes

- **圆角策略重设计**：从"全局统一圆角"改为"选择性圆角"——弹窗/卡片保留柔和角，按钮/输入框采用更小的圆角（`rounded-sm`），部分容器保留直角形成视觉对比
- **边框层次系统**：引入双边框、内描边（`inset`）、装饰性分隔线，给组件增加雕刻感和纸张感，不再一条 `border-border` 平铺到底
- **材质感背景**：对 `card`、`dialog`、`popover` 等浮层组件增加微妙的线性渐变底色（`bg-gradient-to-b from-card via-card to-muted/30`），模拟纸张/绢帛的微妙色调变化，替代纯扁平填充
- **交互反馈升级**：hover/active 状态从简单的透明度变化改为带有位移、边框发光、水波纹结合，增加操作的"手感"
- **装饰性细节**：为 dialog 头部、card header、item 行等添加古典风格的装饰元素（如顶部细金线 `h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent`）
- **阴影系统精细化**：重新定义阴影 token 值，从标准 Tailwind 阴影改为暖色偏光的自定义阴影（`oklch` 色相偏暖）

## Capabilities

### New Capabilities

- `rounded-corner-strategy`: 从统一圆角改为选择性差异化圆角策略，不同类型组件使用不同圆角值
- `border-hierarchy-system`: 引入多层级边框系统（外框、内描边、装饰线），替代单一的 `border-border`
- `material-surface-texture`: 为卡片、弹窗等浮层组件增加微妙材质感渐变背景
- `refined-interaction-feedback`: 升级 hover/active/focus 交互反馈（位移、发光、水波纹）
- `decorative-detail-elements`: 添加古典风格装饰元素（金线、分隔线、角标）
- `custom-shadow-system`: 从标准 Tailwind 阴影改为暖色偏光阴影 token 体系

### Modified Capabilities

- `visual-standards` (existing): 更新圆角策略、阴影系统、交互反馈标准
- `ui-cultivation-aesthetic` (existing): 新增对按钮、卡片、输入框的具体装饰要求

## Impact

- `src/app/styles/tokens.css`：`--radius-*` token 值调整，`--shadow-*` token 全部重定义
- `src/app/styles/animations.css`：新增装饰性动画 keyframes
- `src/shared/ui/actions/button.tsx`：交互反馈升级
- `src/shared/ui/data-display/card.tsx`：材质感背景 + 装饰头部
- `src/shared/ui/overlay/dialog.tsx`：装饰头部 + 新阴影
- `src/shared/ui/data-display/item.tsx`：悬浮交互 + 装饰分隔线
- `src/shared/ui/feedback/empty.tsx`：材质感容器
- `src/shared/ui/forms/*`：输入框 focus 状态重设计
- `src/shared/ui/overlay/tooltip.tsx`、`popover.tsx` 等浮层：新阴影 + 边框
