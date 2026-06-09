## Context

`src/shared/ui/` 包含 55 个文件，其中 9 个为自定义组件，46 个为 shadcn 源组件（不可修改）。

### 逐文件审查结果

**9 个自定义组件审计：**

| # | 文件 | 行数 | 硬编码颜色 | data-slot | font-serif | AI味 |
|---|------|------|-----------|-----------|------------|------|
| 1 | `item-tooltip.tsx` | 475 ❌ | 50+ 处 ❌ | 缺失 ❌ | 无 ❌ | 严重 🔴 |
| 2 | `cooldown-button.tsx` | 87 ✅ | 无 ✅ | 缺失 ❌ | 无 ❌ | 明显 🟡 |
| 3 | `spinner.tsx` | 16 ✅ | 无 ✅ | 缺失 ❌ | N/A | 明显 🟡 |
| 4 | `empty.tsx` | 104 ✅ | 无 ✅ | 全有 ✅ | 无 ❌ | 中等 🟡 |
| 5 | `kbd.tsx` | 28 ✅ | 无 ✅ | 全有 ✅ | 无 ❌ | 轻微 ⚪ |
| 6 | `field.tsx` | 249 ✅ | 无 ✅ | 全有 ✅ | 无 ❌ | 轻微 ⚪ |
| 7 | `input-group.tsx` | 171 ✅ | 无 ✅ | 全有 ✅ | N/A | 轻微 ⚪ |
| 8 | `button-group.tsx` | 83 ✅ | 无 ✅ | 全有 ✅ | N/A | 轻微 ⚪ |
| 9 | `item.tsx` | 194 ✅ | 无 ✅ | 全有 ✅ | 无 ❌ | 轻微 ⚪ |

**关键发现：**
- `item-tooltip.tsx` 475 行，超过组件 300 行硬限制
- 0/55 文件使用 `font-serif` 类
- 3/9 自定义组件缺失 `data-slot` 属性
- 仅 `item-tooltip.tsx` 存在颜色违规（50+ 处），其余 8 个均使用语义 Token

### 现有主题系统

`globals.css` 定义了完整的语义化颜色系统（米色/墨色双主题），使用 `oklch()` 色彩空间。8 级品质色通过 `@theme inline` 映射为 Tailwind 类名（`text-quality-mythic`、`bg-quality-epic/20` 等）。正文默认 `font-family: "Noto Serif SC"`。

## Goals / Non-Goals

**Goals:**
1. 消除 `item-tooltip.tsx` 中 50+ 处硬编码 Tailwind 原生色盘类名
2. 将稀有度颜色映射对齐到全局 `--quality-*` CSS 变量系统（9 级全量覆盖）
3. 拆分 `item-tooltip.tsx`（475→≤300 行），提取 `RARITY_STYLES` 到 `shared/utils/`
4. 为全部 9 个自定义组件的文本元素添加 `font-serif`
5. 为 3 个缺失组件补充 `data-slot`
6. 为 cooldown-button、spinner、item-tooltip、empty 添加修仙题材视觉识别

**Non-Goals:**
- 不修改 46 个 shadcn 源组件
- 不添加新 npm 依赖
- 不改变任何组件 API（props、exports）
- 不重新设计游戏面板或 views

## Decisions

### D1: item-tooltip 拆分策略

475 行需拆分为 ≤300 行的多个文件：

```
src/shared/utils/rarityStyles.ts   ← RARITY_STYLES + getRarityStyle（~50 行）
src/shared/ui/item-tooltip.tsx     ← ItemTooltip + UpgradeableItemTooltip（保留，~280 行）
src/shared/ui/empty-slot.tsx       ← EmptySlotCard + BackpackHeader + EmptyBackpackHint（~80 行）
```

`index.ts` barrel 重导出保持向后兼容。

**Alternatives considered:**
- 提取到 `modules/` 下 → 拒绝：这些是跨模块 UI 组件
- 保持一个文件忽略限制 → 拒绝：违反核心约束 `MUST` 规则

### D2: 颜色映射策略

将 `RARITY_STYLES` 对象中的硬编码色盘替换为 `quality-*` Token：

```typescript
// Before (违规):
'史诗': { bg: 'bg-purple-500/10', text: 'text-purple-700...', badge: 'bg-purple-200...' }

// After (合规):
'史诗': { border: 'border-quality-legendary', bg: 'bg-quality-legendary/10', 
          text: 'text-quality-legendary', badge: 'bg-quality-legendary/20 text-quality-legendary' }
```

注意：`ItemRarity` 类型目前仅定义 5 个值（普通/稀有/史诗/传说/神话）。需要：
- 将 "稀有" 从蓝色改为 `quality-epic`（黄色）——与全局品质系统对齐
- 补充缺失的 4 档（精良/优秀/劣质/基础）进入映射表作为兜底

**风险**：如果 `ItemRarity` 类型被 TypeScript 限制为仅 5 个值，则无法在映射表中添加 9 档。→ 处理方式：在 `getRarityStyle` 的 fallback 逻辑中覆盖未定义档位，映射表保持与类型一致。

### D3: font-serif 添加策略

尽管 `<body>` 有 `font-sans`...等等，让我确认。实际上 `globals.css` 设置的是 `body { font-serif }`。但 Tailwind 的 `@layer base` 重置可能导致组件内文本不使用 serif。

在以下位置添加 `font-serif`：
- 明确展示 CJK 文本的元素（tooltip 名称/描述/属性、empty 标题/描述、cooldown 倒计时）
- 不添加到纯图标/按钮/输入框（它们应继承系统字体）

### D4: Cooldown Button 墨韵效果

```tsx
// 替换 bg-black/60 蒙层为墨韵渐变
<div 
  className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/15 to-transparent pointer-events-none z-10"
  style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
/>
```

倒计时文字：`font-serif text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`

### D5: Spinner 气旋变体

纯 CSS 双环旋转动画（不使用新依赖）：
```tsx
if (variant === 'cultivation') {
  return (
    <div role="status" aria-label="Loading" data-slot="spinner" className={cn('relative size-4', className)} {...props}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
    </div>
  )
}
```

### D6: Item Tooltip 装饰元素

- 边框：`border-2 border-border shadow-lg` + `bg-popover text-popover-foreground`（替换 amber 色系）
- 分割线：`<div className="bg-gradient-to-r from-transparent via-border to-transparent h-px" />`（替换 `border-t border-amber-200`）
- 稀有度徽章：使用 `quality-*` 颜色 + `font-serif`，保持简洁不加额外装饰（避免超出行数限制）

## Risks / Trade-offs

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 拆分后导入路径变更导致引用断裂 | 低 | 高 | barrel re-export 保持旧路径可用 |
| `ItemRarity` 类型仅 5 值无法映射 9 档 | 中 | 低 | fallback 逻辑覆盖未定义档位，不强制改类型 |
| 颜色变更在暗色模式下可读性降低 | 低 | 中 | 所有改动使用 `dark:` 变体 + 语义 Token，dev 双模式验证 |
| 墨韵蒙层在浅色主题下可见度不足 | 中 | 低 | 使用 `from-primary/40` 确保足够对比度 |

## Open Questions

1. 稀有度 "稀有" 当前映射为蓝色，但全局品质系统 `--quality-epic` 为黄色——这是一个 breaking visual change，是否符合预期？→ 设计决策：对齐全局系统，黄色更符合"稀有=金色"的直觉
2. `EmptySlotCard`/`BackpackHeader`/`EmptyBackpackHint` 应提取到 `shared/ui/` 还是 `shared/components/`？→ `shared/ui/empty-slot.tsx`，与其他自定义 UI 组件一致
