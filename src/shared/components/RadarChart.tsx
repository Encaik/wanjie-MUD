'use client';

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/data-display/chart';
import type { ChartConfig } from '@/shared/ui/data-display/chart';
import { cn } from '@/shared/utils';

// ============================================
// 类型定义（保持与旧版完全兼容）
// ============================================

/** 雷达图轴定义 */
export interface RadarAxis {
  label: string;
  color?: string;
}

/** 一个数据系列 */
export interface RadarSeries {
  /** 0-1 归一化值，用于多边形顶点位置 */
  values: number[];
  /** tooltip 中显示的原值 */
  rawValues: (string | number)[];
  /** 该系列覆盖的轴索引 */
  axisIndices: number[];
  fillColor: string;
  strokeColor: string;
}

interface RadarChartProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  /** 默认宽度（可用 className 的 max-w 等覆盖） */
  size?: number;
  className?: string;
}

// ============================================
// 组件
// ============================================

/**
 * 雷达图组件 — 基于 recharts + shadcn ChartContainer
 *
 * 内部将 axes + series 接口适配为 recharts RadarChart 格式。
 * 支持多系列叠加、入场动画、明暗主题自动适配、无障碍标注。
 */
export function RadarChart({
  axes,
  series,
  size = 180,
  className,
}: RadarChartProps) {
  const axCount = axes.length;
  if (axCount < 3) return null;

  // ---- 将 axes + series 转换为 recharts data[] ----
  const chartData = axes.map((axis, ai) => {
    const point: Record<string, string | number> = { axis: axis.label };
    series.forEach((s, si) => {
      const vi = s.axisIndices.indexOf(ai);
      if (vi >= 0) {
        point[`s${si}`] = s.values[vi] ?? 0;
        point[`s${si}_raw`] = s.rawValues[vi] ?? s.values[vi] ?? 0;
      } else {
        point[`s${si}`] = 0;
        point[`s${si}_raw`] = 0;
      }
    });
    return point;
  });

  // ---- 构建 shadcn ChartConfig ----
  const chartConfig = series.reduce<ChartConfig>((acc, s, si) => {
    const firstAxisLabel = axes[s.axisIndices[0]]?.label;
    acc[`s${si}`] = {
      label: firstAxisLabel ?? `系列 ${si + 1}`,
      color: s.strokeColor,
    };
    return acc;
  }, {});

  // ---- 轴标签渲染函数 ----
  const renderTick = (props: unknown) => {
    const { payload, x, y, cx } = props as {
      payload?: { value?: string };
      x?: number; y?: number; cx?: number;
    };
    const axisLabel = payload?.value ?? '';
    const axisItem = axes.find(a => a.label === axisLabel);
    const dx = (x ?? 0) - (cx ?? 0);
    const textAnchor = Math.abs(dx) < 2 ? 'middle' : dx > 0 ? 'start' : 'end';

    return (
      <text
        x={x} y={y}
        fill={axisItem?.color ?? 'var(--foreground)'}
        fontSize={axCount > 5 ? 9 : 10}
        fontFamily="var(--font-serif)"
        fontWeight={500}
        textAnchor={textAnchor}
        dominantBaseline="central"
        opacity={0.9}
      >
        {axisLabel}
      </text>
    );
  };

  // ---- tooltip 格式化：显示 rawValues ----
  const renderTooltipValue = (
    _value: unknown,
    name: unknown,
    _item: unknown,
    _index: number,
    payload: unknown,
  ) => {
    const raw = (payload as Record<string, unknown>)?.[`${name}_raw`];
    return (
      <span className="font-mono tabular-nums text-xs">
        {raw !== undefined ? String(raw) : '-'}
      </span>
    );
  };

  return (
    <div
      className={cn(className)}
      style={{ width: size }}
      role="img"
      aria-label={`雷达图：${axes.map(a => a.label).join('、')}`}
    >
      <ChartContainer config={chartConfig} className="aspect-square">
        <RechartsRadar
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 2, left: 10 }}
        >
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="axis" tick={renderTick} />
          <PolarRadiusAxis
            domain={[0, 1]}
            tick={false}
            axisLine={false}
            tickCount={4}
          />
          {series.map((s, si) => (
            <Radar
              key={si}
              dataKey={`s${si}`}
              fill={s.fillColor}
              fillOpacity={0.1}
              stroke={s.strokeColor}
              strokeWidth={1.5}
              animationBegin={si * 150}
              animationDuration={800}
              animationEasing="ease-out"
              dot={{ r: 2, fillOpacity: 0.85, strokeWidth: 0 }}
            />
          ))}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelKey="axis"
                indicator="dot"
                formatter={renderTooltipValue}
              />
            }
          />
        </RechartsRadar>
      </ChartContainer>
    </div>
  );
}
