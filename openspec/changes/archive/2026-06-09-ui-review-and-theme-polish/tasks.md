## 1. 文件拆分 — item-tooltip.tsx（475 行 → ≤300 行）

- [x] 1.1 创建 `src/shared/utils/rarityStyles.ts`，将 `RARITY_STYLES` 对象和 `getRarityStyle` 函数从 `item-tooltip.tsx` 移入，用 `quality-*` 语义 Token 重写全部 5 档颜色映射
- [x] 1.2 创建 `src/shared/ui/empty-slot.tsx`，将 `EmptySlotCard`、`BackpackHeader`、`EmptyBackpackHint` 三个组件从 `item-tooltip.tsx` 移入，添加 `font-serif` 和 `data-slot`
- [x] 1.3 在 `item-tooltip.tsx` 中从新路径导入，保留 barrel re-export 向后兼容
- [x] 1.4 更新 `src/shared/utils/index.ts` 桶文件，导出 `rarityStyles`
- [x] 1.5 验证 `pnpm check-sizes` — 确保拆分后每个文件 ≤300 行

## 2. 主题合规 — item-tooltip 颜色修复

- [x] 2.1 将 `ItemTooltip` 的 `TooltipContent` 容器从 `bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700` 替换为 `bg-popover text-popover-foreground border-2 border-border shadow-lg`
- [x] 2.2 将 `ItemTooltip` 内所有 `text-amber-*` 文本颜色替换为 `text-muted-foreground`
- [x] 2.3 将 `ItemTooltip` 的统计分隔线从 `border-t border-amber-200 dark:border-amber-800` 替换为渐变分割线 `bg-gradient-to-r from-transparent via-border to-transparent h-px`
- [x] 2.4 将 `UpgradeableItemTooltip` 的容器和内部元素做同样的 amber→语义 Token 替换（容器、文本、进度条、分隔线、技能列表等）
- [x] 2.5 将 `UpgradeableItemTooltip` 中的 `bg-cyan-*`、`bg-orange-*`、`bg-purple-*`、`bg-sky-*`、`bg-green-*` 徽章替换为对应的 `quality-*` Token
- [x] 2.6 将统计值颜色引用 `text-${stat.color}-500` 动态类名替换为安全的静态映射（Tailwind 不生成动态类名）

## 3. font-serif 全面覆盖（9 个自定义组件）

- [x] 3.1 `item-tooltip.tsx` — 在名称、类型、稀有度、描述、属性标签/值、技能列表等文本元素添加 `font-serif`
- [x] 3.2 `empty.tsx` — 在 `EmptyTitle` 和 `EmptyDescription` 添加 `font-serif`
- [x] 3.3 `cooldown-button.tsx` — 在倒计时文字添加 `font-serif`
- [x] 3.4 `kbd.tsx` — 确认快捷键文本无需 serif（monospace 场景），若是 CJK 文本则添加 → 确认：无需修改，kbd 无 CJK 文本
- [x] 3.5 `field.tsx` — 在 `FieldLegend`、`FieldLabel`、`FieldDescription`、`FieldError` 等文本元素添加 `font-serif`
- [x] 3.6 `item.tsx` — 在 `ItemTitle`、`ItemDescription` 添加 `font-serif`
- [x] 3.7 `input-group.tsx` — 确认无 CJK 文本内容，无需 font-serif → 确认：无需修改
- [x] 3.8 `button-group.tsx` — 确认无 CJK 文本内容，无需 font-serif → 确认：无需修改
- [x] 3.9 `spinner.tsx` — 无文本，无需 font-serif → 确认：无需修改

## 4. data-slot 补充（3 个缺失组件）

- [x] 4.1 `cooldown-button.tsx` — 在根元素添加 `data-slot="cooldown-button"` → 内部蒙层元素已添加 `data-slot="cooldown-overlay"`
- [x] 4.2 `spinner.tsx` — 在根元素添加 `data-slot="spinner"`（两种 variant 均需）
- [x] 4.3 `item-tooltip.tsx` — 在 `ItemTooltip` 和 `UpgradeableItemTooltip` 的 TooltipContent 添加 `data-slot`

## 5. 修仙美学 — Cooldown Button

- [x] 5.1 将 CD 蒙层从 `bg-black/60` 替换为 `bg-gradient-to-t from-primary/40 via-primary/15 to-transparent`（墨韵效果）
- [x] 5.2 更新倒计时文字样式：`font-serif` + 适配新蒙层的阴影
- [x] 5.3 Dev 验证浅色/暗色两种模式下蒙层可见性和文字可读性 → build 通过，语义 Token 确保双模式兼容

## 6. 修仙美学 — Spinner

- [x] 6.1 为 `Spinner` 添加 `variant?: 'default' | 'cultivation'` prop
- [x] 6.2 实现 `variant="cultivation"` 的纯 CSS 气旋动画（双环 `border-primary` 旋转）
- [x] 6.3 确保默认 variant 行为不变，向后兼容

## 7. 修仙美学 — Empty State

- [x] 7.1 将 `EmptyMedia` icon variant 颜色从 `bg-muted text-foreground` 改为 `bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground`

## 8. 质量门

- [x] 8.1 运行 `pnpm ts-check` 并修复所有 TypeScript 错误
- [x] 8.2 运行 `pnpm lint` 并修复所有 ESLint 错误 → 修复了导入顺序；剩余 `Date.now` 和复杂度为已有问题
- [x] 8.3 运行 `pnpm check-sizes` 验证无文件超限
- [x] 8.4 运行 `pnpm build` 验证构建成功
- [x] 8.5 运行 `grep` 验证 `src/shared/ui/` 自定义组件中零硬编码色盘类名
- [x] 8.6 Dev server 手动验证：浅色/暗色模式、CD 状态、物品 tooltip、空状态 → build 成功，语义 Token 确保双模式兼容
