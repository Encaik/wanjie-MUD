## Why

角色选择界面的雷达图使用纯手写 SVG 实现（`src/shared/components/RadarChart.tsx`），外观粗糙、缺乏专业感。项目已安装 `recharts@2.15.4` 并有 shadcn 风格的 `ChartContainer` 包装器（`src/shared/ui/data-display/chart.tsx`），但该包装器未被任何代码使用。`StatisticsPanel` 中存在一份手写 `ProgressBar`，而项目已有基于 Radix UI 的 `Progress` 组件（被 6 个以上游戏弹窗使用）。

问题：
- 手写 SVG 雷达图无法利用 recharts 的动画、响应式、暗黑模式主题、无障碍等能力
- 两份进度条实现：手工 `ProgressBar` 和 Radix UI `Progress` 并存，违反"同一份内容只在一处存在"原则
- `chart.tsx` 封装好的 shadcn 图表基础设施闲置，未发挥价值

## What Changes

### 雷达图迁移到 recharts
- 用 recharts `RadarChart` + shadcn `ChartContainer` 重写雷达图组件，替代手写 SVG 实现
- 保留同样的对外接口（`RadarAxis`、`RadarSeries`、`RadarChart`）以最小化调用方改动
- 添加 recharts 动画（`<Radar>` 多边形入场动画、`fade-in` tooltip）
- 使用 CSS 变量适配明/暗主题

### 进度条统一
- `StatisticsPanel` 中的手写 `ProgressBar` 替换为 `shared/ui/feedback/progress.tsx` 的 `Progress` 组件
- 删除内联 `ProgressBar` 函数

### 无破坏性变更
- `CharacterCard` 中雷达图的使用方式不变（同样的 props 接口）
- 雷达图视觉上更精致，但数据展示逻辑不变
- 进度条功能等价

## Capabilities

### Modified Capabilities
- `radar-chart`: 从手写 SVG 迁移到 recharts + shadcn ChartContainer，保持外部接口兼容
- `progress-bar`: StatisticsPanel 使用统一的 Radix UI Progress 组件

## Impact

- **文件变更**：
  - `src/shared/components/RadarChart.tsx` — 重写，约 140 行（原 217 行）
  - `src/modules/collection/components/StatisticsPanel.tsx` — 删除内联 ProgressBar，改用共享 Progress
- **零新增文件**：复用已有 chart.tsx 和 progress.tsx
- **零删除文件**
- **调用方不变**：`CharacterCard.tsx` 无需任何代码修改（接口兼容）
