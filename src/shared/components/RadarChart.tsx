'use client';

import { useState, useCallback } from 'react';

import { cn } from '@/shared/utils';

/** 雷达图轴定义 */
export interface RadarAxis {
  label: string;
  color?: string;
}

/** 一个数据系列 */
export interface RadarSeries {
  values: number[];
  rawValues: (string | number)[];
  axisIndices: number[];
  fillColor: string;
  strokeColor: string;
}

interface RadarChartProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  size?: number;
  gridColor?: string;
  labelColor?: string;
  className?: string;
}

/**
 * 雷达图组件 — 多系列叠加 + 整体 hover tooltip
 *
 * hover 多边形区域时弹出浮层，一次性展示该系列所有轴的值。
 */
export function RadarChart({
  axes,
  series,
  size = 180,
  gridColor = 'var(--border)',
  labelColor = 'var(--muted-foreground)',
  className,
}: RadarChartProps) {
  const axCount = axes.length;
  const [hoveredSeries, setHoveredSeries] = useState<RadarSeries | null>(null);
  const clearHover = useCallback(() => setHoveredSeries(null), []);

  if (axCount < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  const labelRadius = radius + 16;
  const GRID_LEVELS = [0.33, 0.66, 1.0];

  const point = (axisIndex: number, r: number): [number, number] => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axCount;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const polygonPoints = (axisIndices: number[], values: number[]): string => {
    return axisIndices
      .map((ai, vi) => {
        const v = Math.min(1, Math.max(0, values[vi] ?? 0));
        const [px, py] = point(ai, radius * v);
        return `${px.toFixed(2)},${py.toFixed(2)}`;
      })
      .join(' ');
  };

  /** 构建 tooltip 行数据 */
  const tooltipRows = hoveredSeries
    ? hoveredSeries.axisIndices.map((ai, vi) => ({
        label: axes[ai]?.label ?? '',
        color: axes[ai]?.color ?? hoveredSeries.strokeColor,
        value: hoveredSeries.rawValues[vi] ?? '',
      }))
    : [];

  return (
    <div className={cn('relative inline-block', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`雷达图：${axes.map(a => a.label).join('、')}`}
      >
        {/* 网格 */}
        {GRID_LEVELS.map((level, li) => (
          <polygon
            key={li}
            points={Array.from({ length: axCount }, (_, i) => {
              const [px, py] = point(i, radius * level);
              return `${px.toFixed(2)},${py.toFixed(2)}`;
            }).join(' ')}
            fill="none"
            stroke={gridColor}
            strokeWidth={li === 2 ? 1 : 0.6}
            opacity={li === 2 ? 0.5 : 0.3}
          />
        ))}

        {/* 轴线 */}
        {Array.from({ length: axCount }, (_, i) => {
          const [ex, ey] = point(i, radius);
          return (
            <line
              key={i}
              x1={cx.toFixed(2)} y1={cy.toFixed(2)}
              x2={ex.toFixed(2)} y2={ey.toFixed(2)}
              stroke={gridColor} strokeWidth={0.5} opacity={0.25}
            />
          );
        })}

        {/* 数据系列 */}
        {series.map((s, si) => (
          <g key={si}>
            {/* 可见填充多边形 */}
            <polygon
              points={polygonPoints(s.axisIndices, s.values)}
              fill={s.fillColor} fillOpacity={0.1}
              stroke={s.strokeColor} strokeWidth={1.5} strokeOpacity={0.75}
              className="transition-all duration-500"
            />
            {/* 不可见 hover 热区（同形状多边形，大 stroke 方便命中） */}
            <polygon
              points={polygonPoints(s.axisIndices, s.values)}
              fill={s.fillColor} fillOpacity={0}
              stroke="transparent" strokeWidth={18}
              className="cursor-crosshair transition-all duration-500"
              onMouseEnter={() => setHoveredSeries(s)}
              onMouseLeave={clearHover}
            />
            {/* 数据点 */}
            {s.axisIndices.map((ai, vi) => {
              const v = Math.min(1, Math.max(0, s.values[vi] ?? 0));
              const [px, py] = point(ai, radius * v);
              return (
                <g key={vi}>
                  <circle
                    cx={px.toFixed(2)} cy={py.toFixed(2)} r={3}
                    fill={s.strokeColor} fillOpacity={0.85}
                    className="transition-all duration-500 pointer-events-none"
                  />
                  <circle
                    cx={px.toFixed(2)} cy={py.toFixed(2)} r={5}
                    fill="none" stroke={s.strokeColor}
                    strokeWidth={0.5} strokeOpacity={0.3}
                    className="pointer-events-none"
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* 轴标签 */}
        {axes.map((axis, i) => {
          const [lx, ly] = point(i, labelRadius);
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axCount;
          const anchor = angle > -0.15 && angle < 0.15 ? 'middle' : angle > 0 ? 'start' : 'end';
          const dy = Math.abs(angle + Math.PI / 2) < 0.3 || Math.abs(angle - 3 * Math.PI / 2) < 0.3
            ? '-0.3em' : '0.3em';

          return (
            <text
              key={`label-${i}`}
              x={lx.toFixed(2)} y={ly.toFixed(2)}
              textAnchor={anchor} dominantBaseline="middle" dy={dy}
              fontSize="11" fontFamily="var(--font-serif)"
              fill={axis.color ?? 'var(--foreground)'}
              className="font-medium pointer-events-none opacity-85"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      {/* ===== 整体 hover tooltip — 一次性展示所有值 ===== */}
      {hoveredSeries && (
        <div
          className={cn(
            'absolute z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'pointer-events-none',
            'rounded-xl border border-border/60',
            'bg-popover/95 backdrop-blur-sm',
            'shadow-xl shadow-black/5',
            'px-3 py-2 min-w-[120px]',
            'animate-in fade-in-0 zoom-in-95 duration-150',
          )}
        >
          {/* 小三角指示器 */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover/95 border-l border-t border-border/60" />

          <div className="space-y-1">
            {tooltipRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-foreground/80 font-serif">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.label}
                </span>
                <span className="text-xs font-bold text-foreground tabular-nums font-mono">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
