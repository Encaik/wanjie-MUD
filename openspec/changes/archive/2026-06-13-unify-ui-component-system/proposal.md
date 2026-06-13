## Why

`src/shared/ui/` 目前混合了 60+ 个 shadcn 组件和 9 个自定义组件，所有文件平铺在一个目录下。自定义组件的组织方式不一致（空状态有3种互不兼容的实现）、颜色使用大量硬编码绕过主题系统（约30+处 `text-green-500`、`bg-blue-100` 等）、组件模式不统一（有的用 CVA 有的不用）。这导致：
- 新功能开发容易"造轮子"，因为找不到可复用的组件
- 主题切换时硬编码色不响应
- 模块组件中各写各的视觉风格，缺乏统一感

需要按类型重组目录结构、建立游戏语义色层、统一组件模式，根除这些不一致。

## What Changes

- **目录重组**：将 `src/shared/ui/` 按组件类型拆分为子目录（actions / data-display / feedback / layout / overlay / forms），保持 `index.ts` barrel 导出兼容
- **游戏语义色层**：在主题系统中新增一套游戏领域语义 CSS 变量（战斗色、修炼色、恢复色、经济色、危险色），消除模块组件中约30+处硬编码 Tailwind 色盘
- **空状态统一**：废弃 `empty-slot.tsx` 和其他内联空状态，统一使用 `empty.tsx` 组件族
- **CVA 统一**：所有自定义组件使用 `class-variance-authority` 定义变体
- **消除重复的品质色映射**：`MessagePanel.tsx`、`ResultDisplay.tsx` 等中的本地映射替换为 `modules/theme/data/rarityStyles.ts` 的统一引用
- **SharedComponents 边界修正**：将游戏机制组件（如 `CooldownButton`）从 `shared/ui/` 迁移到 `shared/components/`，将 UI 基元保持在下层

## Capabilities

### New Capabilities

- `component-directory-organization`: 按 actions / data-display / feedback / layout / overlay / forms 类型重组 shared/ui/ 目录结构，保持 barrel 导出兼容
- `game-domain-semantic-colors`: 新增一套游戏领域语义 CSS 变量（combat / cultivation / recovery / economy / danger），供所有组件使用，消除硬编码 Tailwind 色盘
- `empty-state-unification`: 废弃 `empty-slot.tsx`，统一使用 `empty.tsx` 作为唯一空状态组件族；内联空状态（ProductCard 等）迁移到 Empty 组件
- `shared-ui-components-boundary`: 修正 shared/ui/ 与 shared/components/ 的边界——CooldownButton 迁移到 shared/components/

### Modified Capabilities

- `ui-theme-compliance` (existing): 新增关于目录结构、CVA 使用、游戏领域语义色的要求
- `ui-cultivation-aesthetic` (existing): 对重组后各组件的 `data-slot` 和命名更新

## Impact

- `src/shared/ui/` 目录结构扁平→分层，所有 import 路径需要更新（或通过 barrel 导出保持兼容）
- `src/app/styles/themes.css` 新增约 6 组 CSS 变量（游戏领域色）
- `src/shared/ui/empty-slot.tsx` 废弃
- `src/modules/combat/components/`、`src/modules/progression/components/` 等约 15+ 个模块组件需要将硬编码色替换为语义色
- `src/shared/ui/index.ts` 新增（当前不存在）——对所有自定义组件建立 barrel 导出
