## Why

对 `src/shared/ui/` 全部 55 个文件进行逐文件审查后发现，9 个自定义组件存在三类系统性问题：(1) `item-tooltip.tsx` 有 50+ 处硬编码 Tailwind 原生色盘类名，直接违反 `globals.css` 的语义化颜色规范；(2) 全部 55 个文件的文本元素零使用 `font-serif`，导致组件在 `body { font-serif }` 之外无法正确继承古典字体；(3) 多个组件呈现通用 SaaS/shadcn 模板的"AI 生成感"，与项目的古典修仙主题脱节。此外 `item-tooltip.tsx` 为 475 行，超出组件 300 行硬限制。

## What Changes

### 主题合规修复
- **item-tooltip.tsx**（475 行 → 拆分）：替换全部 50+ 处 `bg-amber-*`、`text-amber-*`、`border-amber-*`、`bg-blue-*`、`bg-purple-*`、`bg-red-*`、`bg-orange-*`、`bg-green-*`、`bg-cyan-*`、`bg-sky-*`、`bg-gray-*` 为语义化 `quality-*`、`primary`、`secondary`、`muted`、`popover` 等 Token
- **item-tooltip.tsx**：将内部 `RARITY_STYLES` 稀有度颜色映射对齐到 `globals.css` 的全局品质色系统（传说=mythic/红，史诗=legendary/橙，稀有=epic/黄，神话=mythic/红），补充缺失的 精良/优秀/劣质/基础 四档
- 其余 8 个自定义组件已通过审计：无色盘违规

### 字体与属性一致性
- **全部 9 个自定义组件**：在文本展示元素上添加 `font-serif`（当前：0/55 文件使用）
- **3 个缺失 `data-slot`** 的组件补充：`cooldown-button.tsx`、`spinner.tsx`、`item-tooltip.tsx`

### 修仙美学打磨
- **cooldown-button.tsx**：将西式 `bg-black/60` 暗色蒙层替换为修炼主题的墨韵渐变蒙层
- **spinner.tsx**：新增可选 `variant="cultivation"` 气旋 loading 变体
- **item-tooltip.tsx**：添加古典边框、符文风格稀有度徽章、渐变分割线等修仙装饰
- **empty.tsx**：将图标容器颜色从通用 `bg-muted` 改为修炼主题暖色调

### 文件大小合规
- **item-tooltip.tsx**（475 行 → 拆分）：将 `RARITY_STYLES` 配置和 `getRarityStyle` 工具函数提取到 `shared/utils/`，将 `EmptySlotCard`/`BackpackHeader`/`EmptyBackpackHint` 提取为独立组件或合并到现有组件中

## Capabilities

### New Capabilities
- `ui-theme-compliance`: 所有 `src/shared/ui/` 自定义组件仅使用语义化主题 Token（CSS 变量）表达颜色——零硬编码 Tailwind 原生色盘类名；稀有度颜色映射与全局品质色系统一致；所有文本元素使用 `font-serif`；所有组件根元素具有 `data-slot` 属性
- `ui-cultivation-aesthetic`: 自定义 UI 组件具有修仙题材视觉识别——古典中式 loading 状态、tooltip/空状态上的微妙装饰元素、主题化的冷却动画

### Modified Capabilities
<!-- 无现有 spec 级别行为变更 -->

## Impact

- **主要修改**（4 文件）：`item-tooltip.tsx`（拆分+重写样式）、`cooldown-button.tsx`（蒙层+文字样式）、`spinner.tsx`（新增 variant）、`empty.tsx`（图标颜色+font-serif）
- **审计确认**（4 文件，仅添加 font-serif + data-slot）：`kbd.tsx`、`field.tsx`、`input-group.tsx`、`item.tsx`
- **轻微调整**（1 文件）：`button-group.tsx`（仅 font-serif 审计）
- **shadcn 源组件**（46 文件）：不修改
- **可能新增**：`src/shared/utils/rarityStyles.ts`（从 item-tooltip 提取的稀有度配置）
- **无破坏性变更**：所有组件 API（props、exports）保持不变
- **无新依赖**：装饰效果使用现有 Tailwind CSS + `globals.css` 中已定义的关键帧
- **风险**：低——纯视觉/样式变更，无逻辑或 API 修改
