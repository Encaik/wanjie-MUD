## Context

`src/shared/ui/` 现有目录结构将所有 60+ 组件平铺在同一层级。其中有约 9 个自定义组件（非 shadcn 标准）与 shadcn 组件混杂。模块组件（约15+ 个文件）中存在约 30+ 处硬编码 Tailwind 色盘类名，绕过已有的 CSS 变量主题系统。另有 3 种互不兼容的空状态实现。

当前主题架构已有良好基础：
- `tokens.css` — 设计令牌桥接（`@theme inline`声明）
- `themes.css` — :root 默认值 + .dark 暗色值 + API 动态注入机制
- `rarityStyles.ts` — 8 级品质色语义映射

本设计在此之上修正目录结构、新增游戏领域语义色层、统一组件模式。

## Goals / Non-Goals

**Goals:**
- 按类型分组的目录结构，使组件容易被发现和复用
- 游戏领域语义 CSS 变量，消除模块组件中的所有硬编码 Tailwind 色盘
- 统一空状态组件族（单一入口）
- 所有自定义组件统一使用 CVA 定义变体
- 删除 `empty-slot.tsx`，迁移内联空状态
- CooldownButton 迁移到 `shared/components/`
- 全局 barrel 导出保持 import 兼容性

**Non-Goals:**
- 不修改 shadcn 原始组件（`src/shared/ui/` 中 95% 的 shadcn 文件不动）
- 不改动核心架构规则（五层模型不动）
- 不引入新的第三方 UI 依赖
- 不涉及后端或 API 变更
- 不改动 `modules/theme/` 主题系统主体逻辑

## Decisions

### Decision 1: 目录结构 — 按组件类型分组，shadcn 文件原地不动

**方案**: 只有自定义组件（约 9 个）移动分类到子目录。shadcn 标准组件文件留原位。

```
src/shared/ui/
├── index.ts                 ← barrel 导出（所有自定义组件 + shadcn 重导出）
├── button.tsx               ← shadcn (原地不动)
├── card.tsx                 ← shadcn (原地不动)
├── dialog.tsx               ← shadcn (原地不动)
├── ... (其余 50+ shadcn 文件原地不动)
│
├── actions/                 ← 交互型组件
│   ├── button-group.tsx
│   └── index.ts
│
├── data-display/            ← 数据显示型组件
│   ├── item.tsx
│   ├── tabs.tsx
│   └── index.ts
│
├── feedback/                ← 反馈状态组件
│   ├── spinner.tsx
│   ├── empty.tsx
│   └── index.ts
│
├── layout/                  ← 布局容器
│   └── (目前无，预留)
│
├── overlay/                 ← 浮层组件
│   ├── item-tooltip.tsx
│   └── upgradeable-item-tooltip.tsx
│
└── forms/                   ← 表单组件
    ├── field.tsx
    ├── input-group.tsx
    └── index.ts
```

**依据**: shadcn 文件数量多且版本迭代可能覆盖重写，混入子目录后升级麻烦。自定义组件少（9 个），按功能分组清晰度远超扁平。
**备选**: 所有文件按类型分组。否决理由：shadcn 升级时路径变化会引发大量无意义 diff。

### Decision 2: 游戏语义色 — 在 themes.css 中新增 CSS 变量，不修改 Tailwind token 层

在 `themes.css` 的 `:root` 和 `.dark` 块中新增如下 CSS 变量：

```css
:root {
  /* 现有变量保持不变... */

  /* 新增：游戏领域色 */
  --game-combat: oklch(0.55 0.18 25);          /* 战斗-赤红 */
  --game-cultivation: oklch(0.55 0.12 260);    /* 修炼-灵蓝 */
  --game-recovery: oklch(0.60 0.12 145);       /* 恢复-翠绿 */
  --game-economy: oklch(0.65 0.14 85);         /* 经济-金黄 */
  --game-danger: oklch(0.55 0.20 25);          /* 危险-赤红（复用 destructive 色系） */
  --game-mental: oklch(0.55 0.15 310);         /* 心境-紫韵 */
  --game-tribulation: oklch(0.55 0.16 50);     /* 渡劫-橙雷 */

  /* 领域色淡色版（10% 不透明度基准，用于背景/边框） */
  --game-combat-bg: oklch(0.55 0.18 25 / 0.1);
  --game-cultivation-bg: oklch(0.55 0.12 260 / 0.1);
  /* ... 依此类推 */
}
```

同时在 `tokens.css` 中桥接：
```css
@theme inline {
  --color-game-combat: var(--game-combat);
  --color-game-cultivation: var(--game-cultivation);
  --color-game-recovery: var(--game-recovery);
  --color-game-economy: var(--game-economy);
  --color-game-danger: var(--game-danger);
  --color-game-mental: var(--game-mental);
  --color-game-tribulation: var(--game-tribulation);
}
```

**依据**: 不和已有 `primary/destructive` 冲突，而是补充游戏领域色彩语言。`oklch` 与现有主题系统一致。
**备选**: 在 Tailwind 的 @theme 中用已有色（`yellow`, `red` 等）。否决理由：失去语义化，字段名不表达"这是修炼用途"。

### Decision 3: CVA 统一 — 所有自定义组件逐步采用 class-variance-authority

**模式**: 每个自定义组件定义一个 `xxxVariants` 常量，包含 `variants` 和 `defaultVariants`，支持变体（variant/size）扩展。

```tsx
// ✅ 标准模式
const feedbackVariants = cva("flex items-center gap-2 rounded-md", {
  variants: {
    variant: { default: "bg-muted", success: "bg-game-recovery-bg" },
    size: { default: "p-3", sm: "p-2" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

**不要求一次性改造完成**：优先在本次涉及的文件（空状态、样式修复）中采用 CVA，遗留组件在后续迭代中逐步迁移。

**依据**: `button.tsx` 和 `item.tsx` 已使用 CVA，社区普遍采用。
**备选**: 用 props 条件拼接 className。否决理由：类型安全弱、变体组合爆炸时难维护。

### Decision 4: 空状态统一 — Empty 组件族作为唯一入口

- `empty.tsx`（现有的组件族）保留并作为标准
- `empty-slot.tsx` 中的 `EmptySlotCard` / `BackpackHeader` / `EmptyBackpackHint` 迁移到 `empty.tsx`（作为 ExpandedEmptySlot 等扩展形态，或拆成独立组件后复用 Empty 的子部件）
- `ProductCard.tsx` 的 `ProductEmptyState` 和 `ShopLockedState` 改为使用 `Empty` 组件
- `DifficultySelect.tsx` 的内联空状态改为使用 `Empty`

**依据**: 减少重复模式，发现一处即可复用。
**备选**: 保留三个不同的空状态体系。否决理由：测试了"发现困难"这个核心问题。

### Decision 5: CooldownButton 迁移到 shared/components/

`CooldownButton` 包含游戏机制（冷却逻辑、百分比残影），不是纯 UI 基元。迁移到 `shared/components/` 与 `MessagePanel`、`ResultDisplay` 同级。

路径变更: `@/shared/ui/cooldown-button` → `@/shared/components/CooldownButton`

在 `shared/ui/index.ts` 中保留重定向导出（过渡期）或直接更新所有 imports。选择后者（直接更新 imports），不留过渡兼容。

**依据**: 五层架构中 `shared/ui/` 是 UI 基元层，含游戏机制逻辑的组件应放 `shared/components/`。
**备选**: 留原地。否决理由：架构规则明确禁止在 shared/ui/ 放自定义游戏逻辑。

## Risks / Trade-offs

- **[Risk] 大量 import 路径更新导致冲突** → barrel 导出（`shared/ui/index.ts`）先行，让新旧路径同时可用一期
- **[Risk] 游戏语义色值在暗色模式下不够明显** → `.dark` 块中提高明度，与品质色的处理一致
- **[Risk] 一次性改动面太大** → 分 3 轮执行：目录重组 + barrel → 语义色注入 → 硬编码替换 + 空状态统一
- **[Risk] 空状态替换后视觉与原有不一致** → 所有 Empty 变体与旧的实现并排走视觉回归确认

## Migration Plan

```
Round 1 — 基础设施（无视觉变化）
  1. 新建子目录结构和 barrel 导出（index.ts）
  2. 复制自定义组件到子目录（保留原位置文件）
  3. 更新所有内部 import 指向子目录
  4. 新增游戏语义色 CSS 变量

Round 2 — 组件重构（有视觉变化）
  5. 废弃 empty-slot.tsx，迁移到 empty.tsx 扩展
  6. CooldownButton 迁移到 shared/components/
  7. 更新引用这些组件的所有消费者

Round 3 — 硬编码消除（有视觉变化）
  8. 逐个模块组件将硬编码色替换为游戏语义色
  9. 消除 MessagePanel.tsx / ResultDisplay.tsx 中的本地品质色映射
  10. ProductCard 等内联空状态替换为 Empty 组件
```
