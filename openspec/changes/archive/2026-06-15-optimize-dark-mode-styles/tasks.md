# 任务列表：优化暗色模式样式配色

## Phase 1: CSS 变量值更新

### Task 1.1: 更新基础语义色（背景/文本/卡片/弹出层）

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

替换背景层、卡片层、弹出层的 CSS 变量值。目标：建立三层明度梯度（背景 0.16 → 卡片 0.24 → 弹出层 0.32）。

```css
.dark {
  /* 背景层 */
  --background: oklch(0.16 0.015 60);
  --foreground: oklch(0.91 0.02 65);

  /* 卡片层 */
  --card: oklch(0.24 0.03 60);
  --card-foreground: oklch(0.91 0.02 65);

  /* 弹出层 */
  --popover: oklch(0.32 0.04 60);
  --popover-foreground: oklch(0.91 0.02 65);
}
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 暗色模式下背景与卡片的视觉区分明显
- [x] 弹出层（如 tooltip、dialog）比卡片更亮

### Task 1.2: 更新主色/次要色/柔和色/强调色

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

更新主色调、次要色、柔和色、强调色及其前景色：

```css
/* 主色调 */
--primary: oklch(0.68 0.13 65);
--primary-foreground: oklch(0.13 0.03 55);

/* 次要色 */
--secondary: oklch(0.30 0.035 60);
--secondary-foreground: oklch(0.80 0.03 65);

/* 柔和色 */
--muted: oklch(0.28 0.03 60);
--muted-foreground: oklch(0.75 0.04 65);

/* 强调色 */
--accent: oklch(0.36 0.05 60);
--accent-foreground: oklch(0.90 0.02 65);

/* 危险色 */
--destructive: oklch(0.68 0.20 25);
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] `muted-foreground` 文本在暗色卡片上可清晰阅读（14px 宋体 CJK）
- [x] `secondary-foreground` 与 `foreground` 有视觉区分
- [x] 主色按钮在暗色背景下可见且协调

### Task 1.3: 更新边框/输入/聚焦环

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

```css
/* 边框与输入 */
--border: oklch(0.38 0.03 60);
--input: oklch(0.28 0.03 60);
--ring: oklch(0.68 0.13 65);
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 暗色模式下输入框边框清晰可见
- [x] 卡片/面板边框可见

### Task 1.4: 更新图表色

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

```css
/* 图表色 */
--chart-1: oklch(0.72 0.12 55);
--chart-2: oklch(0.62 0.15 40);
--chart-3: oklch(0.68 0.10 75);
--chart-4: oklch(0.53 0.08 55);
--chart-5: oklch(0.58 0.06 70);
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 雷达图等图表组件在暗色下可读（如有使用图表色的组件）

### Task 1.5: 更新侧边栏色

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

```css
/* 侧边栏 */
--sidebar: oklch(0.18 0.025 60);
--sidebar-foreground: oklch(0.90 0.02 65);
--sidebar-primary: oklch(0.68 0.13 65);
--sidebar-primary-foreground: oklch(0.13 0.03 55);
--sidebar-accent: oklch(0.30 0.045 60);
--sidebar-accent-foreground: oklch(0.88 0.02 65);
--sidebar-border: oklch(0.38 0.03 60);
--sidebar-ring: oklch(0.68 0.13 65);
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 侧边栏在暗色模式下与主内容区视觉区分

### Task 1.6: 更新品质颜色

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

```css
/* 品质颜色 */
--quality-mythic: oklch(0.72 0.20 25);
--quality-legendary: oklch(0.74 0.16 55);
--quality-epic: oklch(0.85 0.12 90);
--quality-rare: oklch(0.65 0.18 300);
--quality-uncommon: oklch(0.65 0.13 250);
--quality-common: oklch(0.68 0.10 145);
--quality-poor: oklch(0.56 0.02 70);
--quality-basic: oklch(0.78 0.01 75);
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 8 级品质文字在暗色卡片背景上都可辨读
- [x] 黄色（epic）在暗色下不刺眼
- [x] 灰色（poor）在暗色下仍然可见

### Task 1.7: 更新游戏领域色

**文件**: `src/app/styles/themes.css` → `.dark { }` 块

```css
/* 游戏领域色 */
--game-combat: oklch(0.70 0.16 25);
--game-cultivation: oklch(0.65 0.14 265);
--game-recovery: oklch(0.68 0.11 145);
--game-economy: oklch(0.73 0.12 75);
--game-mental: oklch(0.65 0.14 310);
--game-tribulation: oklch(0.72 0.12 45);

/* 游戏领域色背景（15% 不透明度） */
--game-combat-bg: oklch(0.70 0.16 25 / 0.15);
--game-cultivation-bg: oklch(0.65 0.14 265 / 0.15);
--game-recovery-bg: oklch(0.68 0.11 145 / 0.15);
--game-economy-bg: oklch(0.73 0.12 75 / 0.15);
--game-mental-bg: oklch(0.65 0.14 310 / 0.15);
--game-tribulation-bg: oklch(0.72 0.12 45 / 0.15);
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 6 个领域色在暗色背景下鲜艳但不刺眼
- [x] 领域色背景标签在暗色卡片上可辨读

## Phase 2: 基础样式强化

### Task 2.1: 确保 body 基础字号并优化暗色字体渲染

**文件**: `src/app/styles/base.css`

在 body 样式中增加基准字号和抗锯齿：

```css
body {
  @apply bg-background text-foreground font-serif;
  font-size: 1rem;                          /* 确保 16px 基准 */
  -webkit-font-smoothing: antialiased;      /* 暗色模式下 CJK 渲染优化 */
  -moz-osx-font-smoothing: grayscale;
}
```

**验收标准**:
- [x] `pnpm build` 成功
- [x] 页面基准字号不低于 16px（DevTools 验证）

## Phase 3: 同步与验证

### Task 3.1: 同步 TypeScript 默认主题常量

**文件**: `src/modules/theme/data/defaultTheme.ts`

检查 `DEFAULT_DARK_THEME` 中是否有与 CSS 变量重复定义的常量值。如有差异，同步更新为 design.md 中的新值。

**验收标准**:
- [x] `pnpm ts-check` 通过
- [x] 暗色模式下的默认主题与 CSS `.dark` 值的视觉一致（不依赖世界主题时）

### Task 3.2: 视觉回归检查

手动在浏览器中验证以下场景（暗色模式）：

**页面级**:
- [x] 首页（`/`）：标题、描述、按钮可读
- [x] 角色选择页（`/select`）：角色卡片信息可读
- [x] 世界选择页（`/world`）：世界卡片信息可读
- [x] 游戏主页面（`/game`）：所有面板可读
- [x] 设置面板（`/game` → 设置）：主题设置 UI 可读

**组件级**:
- [x] 品质徽章（9 级）：文字与背景对比度充足
- [x] 物品提示框（Tooltip）：正文和数值可读
- [x] 表单输入框：边框可见，占位文字可读
- [x] 按钮（主要/次要/危险/幽灵变体）：文字与背景对比度充足
- [x] Tab 切换指示器：活跃态可见
- [x] 滚动条：可见
- [x] Toast 通知：文字可读
- [x] 雷达图：各轴标签和数值可读

**边界场景**:
- [x] 暗色模式 + 启用世界主题（如科技世界冷蓝暗色 + 优化后默认暗色不冲突）
- [x] 暗色模式 + 关闭世界主题（回退到优化后的默认暗色）

### Task 3.3: 质量门检查

```bash
pnpm lint          # ESLint 通过
pnpm ts-check      # TypeScript 类型检查通过
pnpm build         # 构建成功
pnpm check-sizes   # 文件大小检查通过（themes.css 不应超过限制）
```

**验收标准**:
- [x] 所有命令零错误

## 依赖关系

```
Phase 1 (Task 1.1 ~ 1.7)  可以一起完成（同一个文件的不同区块）
    │
    ▼
Phase 2 (Task 2.1)        独立于 Phase 1，可以并行
    │
    ▼
Phase 3 (Task 3.1)        依赖 Phase 1
    │
    ▼
Phase 3 (Task 3.2, 3.3)   依赖 Phase 1 + Phase 2
```

## 影响范围（实际变更）

| 文件 | 变更类型 | 风险 |
|------|----------|------|
| `src/app/styles/themes.css` | 40+ 行变量值替换 + `muted-foreground` 提升至 L=0.75 | 低 |
| `src/app/styles/base.css` | 3 行新增（font-size + font-smoothing） | 极低 |
| `src/modules/theme/data/defaultTheme.ts` | DEFAULT_DARK_THEME 全部值同步更新 | 极低 |
| `src/modules/theme/data/themeConfigTemplate.ts` | expandDarkTheme 硬编码辅助值同步 | 极低 |
| `src/shared/components/RadarChart.tsx` | SVG 轴标签 9→11px + tooltip 对比度 + 网格可见性 | 低 |
| `src/views/character-select/CharacterCard.tsx` | 雷达图子标签 9→11px + 不透明度 50→80% | 低 |
| `src/views/game/StatusPanel.tsx` | 数值标签 9→10px + muted/70→muted/85 | 低 |
| `mods/wanjie-core/data/worldview/*.json` (8 文件) | 各世界观暗色主题 16 变量值全部更新 | 低（仅改值） |

## 变更总结

### 默认暗色主题（themes.css + defaultTheme.ts）
- **三层明度梯度**: background (L=0.16) → card (L=0.24, +8%) → popover (L=0.32, +8%)
- **三级文本层次**: foreground (L=0.91) → secondary-fg (L=0.80) → muted-fg (L=0.75)
- **边框可视性**: border L 从 0.30 提升至 0.38
- **温暖感**: 全局色度从 0.02-0.04 提升至 0.03-0.06
- **品质色**: 暗色下降饱和、微提明度
- **游戏领域色**: 微调色相和明度

### 8 个世界观暗色主题
- 每个世界观应用相同的层次梯度公式
- 保留各世界独特色相（修仙暖金/科技冷蓝/高武紅橙/魔幻紫/异能蓝紫/仙侠青绿/武侠棕褐/末世灰褐）
- `muted-foreground` 统一提升至 L≈0.73

### 组件级修复
- **RadarChart**: SVG 轴标签 9px→11px、默认色改用 `--foreground`、tooltip 标签 10px→11px 且改用 `text-foreground/80`、网格透明度提升
- **CharacterCard**: 雷达图子标签 9px→11px、`text-muted-foreground/50`→`/80`
- **StatusPanel**: 属性变化徽章 9px→10px、基础值/成长值不透明度 70%→85%、功法/装备加成网格 9px→10px

### 质量门
- [x] `pnpm ts-check` 零错误
- [x] `pnpm build` 构建成功
- [x] ESLint 无新增错误（已有的 import/order 等为旧问题）
