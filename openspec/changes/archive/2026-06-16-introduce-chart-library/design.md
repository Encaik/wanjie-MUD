## Context

项目已有 `recharts@2.15.4` 和 shadcn 风格的图表包装器 `src/shared/ui/data-display/chart.tsx`（导出 `ChartContainer`、`ChartTooltip`、`ChartTooltipContent`、`ChartLegend` 等）。该包装器提供 CSS 变量主题系统、`ResponsiveContainer` 响应式容器、以及明/暗模式自动适配。但目前无任何代码使用它。

手写 SVG `RadarChart`（`src/shared/components/RadarChart.tsx`，217 行）在 `CharacterCard` 中被使用，渲染经脉五维和核心四维两个小尺寸雷达图。组件设计为多系列叠加，但实际只用单系列。

`src/shared/ui/feedback/progress.tsx` 基于 Radix UI Progress 的 `Progress` 组件已存在并在 6+ 处使用，但 `StatisticsPanel` 中仍有一个手写 `ProgressBar`（约 35 行）。

## Goals / Non-Goals

**Goals:**
- 将 `RadarChart` 改为基于 recharts 实现，外观专业、支持动画和主题
- 保持 `RadarChart` 的外部接口兼容，使 `CharacterCard` 无需修改
- 消除 `StatisticsPanel` 中的手写 `ProgressBar`，统一使用 Radix UI `Progress`
- 不引入新依赖（recharts 已安装）

**Non-Goals:**
- 不改变 `chart.tsx` 的实现（shadcn 组件，只读）
- 不改变 `CharacterCard` 的布局或数据逻辑
- 不在本次变更中新增其他图表（折线图、柱状图等）
- 不改变 `Progress` 组件本身

## Decisions

### Decision 1: RadarChart 实现策略

**选择**: 用 recharts 的 `<RadarChart>` + `<PolarGrid>` + `<PolarAngleAxis>` + `<Radar>` 替代手写 SVG，包裹在已有的 `ChartContainer` 中。

**组件结构**（重写后）:
```
ChartContainer (shadcn wrapper → ResponsiveContainer)
  └── RadarChart (recharts)
        ├── PolarGrid (3 层同心多边形)
        ├── PolarAngleAxis (轴标签，颜色按 axis.color)
        └── Radar[] (每个 series 一个 <Radar>)
              └── 动画：animationBegin 错开，duration=800
```

**对外接口保持不变**:
```typescript
export interface RadarAxis { label: string; color?: string; }
export interface RadarSeries {
  values: number[];        // 0-1 归一化值
  rawValues: (string | number)[];  // tooltip 显示原值
  axisIndices: number[];
  fillColor: string;
  strokeColor: string;
}
export function RadarChart({ axes, series, size, className }: RadarChartProps)
```

**数据适配**: recharts 的 `RadarChart` 期望 data 数组 + dataKey 映射。需要在组件内部将 `axes` + `series` 转换为 recharts 格式：
```typescript
// 构造 recharts data 数组
const chartData = axes.map((axis, ai) => {
  const point: Record<string, number | string> = { axis: axis.label };
  series.forEach((s, si) => {
    const vi = s.axisIndices.indexOf(ai);
    point[`series${si}`] = vi >= 0 ? s.values[vi] : 0;
  });
  return point;
});
```

**理由**: recharts 的 `RadarChart` 提供动画、无障碍、主题适配，且项目已安装。保持接口兼容避免改动 2 个调用方。

### Decision 2: Tooltip 策略

**选择**: 使用 recharts 默认 tooltip + 自定义 `ChartTooltipContent`（来自已有 chart.tsx），而非之前的手写绝对定位 tooltip。

**配置**: 使用 `ChartConfig` 定义每个 series 的颜色和标签。tooltip 自动显示所有 series 在当前轴上的值。

**理由**: chart.tsx 的 `ChartTooltipContent` 已经处理好明暗主题、布局、格式化——无需重新发明。避免了手写 tooltip 的定位和主题问题。

### Decision 3: 尺寸与响应式

**选择**: `ChartContainer` 内部用 `ResponsiveContainer` 实现 `aspectRatio={1}`（正方形），通过外层 `className` 控制实际宽度。`size` prop 映射为外层容器的 `width` + `height` 约束。

```tsx
<div className={cn(className)} style={{ width: size, height: size }}>
  <ChartContainer config={chartConfig}>
    <RadarChart data={chartData}>
      ...
    </RadarChart>
  </ChartContainer>
</div>
```

**理由**: 当前雷达图在小卡片中使用（105px/95px 宽），`ResponsiveContainer` 确保在任何尺寸下正确渲染。`aspectRatio={1}` 保证正圆形网格。

### Decision 4: 网格与轴线样式

**选择**: 使用 recharts `PolarGrid` 的 `polarAngles` 和 `polarRadius` 自动生成，不使用自定义 SVG 多边形。网格线颜色通过 `chart.tsx` 已有的 CSS 变量 `--border` 控制。

**轴标签**: 使用 `PolarAngleAxis`，`tick` 渲染为自定义 label：
```tsx
<PolarAngleAxis
  dataKey="axis"
  tick={({ payload, cx, cy, ...rest }) => (
    <text ... fill={axis.color}>{payload.value}</text>
  )}
/>
```

**理由**: recharts 的 `PolarGrid` 自动处理网格层级和角度——无需手写三角函数。CSS 变量主题适配由 `chart.tsx` 已有的样式规则覆盖。

### Decision 5: 进度条统一

**选择**: 直接删除 `StatisticsPanel` 中的内联 `ProgressBar` 函数，替换为已存在的 `Progress` 组件。

**变更前**:
```tsx
// 约 35 行手写组件
function ProgressBar({ label, current, max, color }) { ... }

// 使用
<ProgressBar label="成就领取" current={claimed} max={unlocked} color="emerald" />
```

**变更后**:
```tsx
import { Progress } from '@/shared/ui/feedback/progress';

// 使用（保留 label 和数字展示，底层用 Progress）
<div className="space-y-1">
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">成就领取</span>
    <span className="tabular-nums">{claimed}/{unlocked}</span>
  </div>
  <Progress value={percent} className="h-1.5" />
</div>
```

**理由**: 不需要额外的包装组件——调用处直接组合 `Progress` + label/数字即可。`StatisticsPanel` 只有一处使用点，不值得创建新组件。

### Decision 6: 文件大小影响

| 文件 | 变更前 | 变更后（预估） | 限制 |
|------|--------|---------------|------|
| `RadarChart.tsx` | 217 行 | ~140 行 | 300 |
| `StatisticsPanel.tsx` | 减去 ~35 行内联组件 | 无净新增 | 300 |

**理由**: recharts 组件代码更少（网格、轴、动画都由库处理），且功能更强。

## Risks / Trade-offs

- **[风险] recharts RadarChart 在小尺寸下的表现**: recharts 的 `RadarChart` 在 100-130px 下可能文字拥挤。缓解：用 `tick={{ fontSize: 9 }}` 和调整 `cx/cy/outerRadius` 确保可读性。
- **[取舍] 动画初始状态**: 移除手写 tooltip 的 hover 热区大 `strokeWidth` 技巧——recharts 的 tooltip 默认行为可能让移动端 hover 稍难触发。缓解：小尺寸下 tooltip 保持 `cursor: pointer`，使用 recharts 的 `cursor` prop。
- **[风险] recharts 的 RadarChart 组件成熟度**: recharts 的雷达图不如折线图常用。缓解：recharts 2.x 的 `RadarChart` 已稳定，项目已有版本是 2.15.4（2025 年发布）。
- **[取舍] 不保留手写 SVG 的"热区多边形"交互**: 手写版有一个不可见的大 stroke 多边形作为 hover 目标——recharts 原生 tooltip 行为不同（基于数据点）。对用户来说体验基本等价。

## Migration Plan

1. **Phase 1 — 重写 RadarChart**: 创建基于 recharts 的新实现，删除手写 SVG 代码
2. **Phase 2 — 替换 ProgressBar**: StatisticsPanel 改用共享 Progress 组件
3. **Phase 3 — 验证**: 构建、类型检查、lint、视觉验证

## Open Questions

- 无
