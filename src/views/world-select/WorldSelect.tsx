'use client';

import { Compass } from 'lucide-react';

import type { World } from '@/core/types';

import { WorldCard } from './WorldCard';

interface WorldSelectProps {
  worlds: World[];
  onSelect: (world: World) => void;
}

/**
 * 世界选择页 — "万象星盘"
 *
 * 以星图卡片网格展示 8 个世界，营造东方古典星图氛围。
 * PC 端 4 列 × 2 行，移动端自动降级。
 * 背景由全局 BackgroundLayout 统一提供。
 */
export function WorldSelect({ worlds, onSelect }: WorldSelectProps) {
  return (
    <div className="min-h-dvh md:min-h-screen relative flex items-center justify-center">
      <div className="relative w-full max-w-7xl mx-auto p-4 md:p-8 z-10">
        {/* ===== 标题区 ===== */}
        <div className="text-center mb-6" style={{ animation: 'fade-in-up 0.6s ease-out forwards' }}>
          {/* 装饰线 + 菱形符 */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <Compass
              className="w-5 h-5 text-primary/40"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            />
            <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground font-serif tracking-[0.12em] mb-1.5">
            万象星盘<span className="text-primary/40 text-xl mx-2">·</span>择一方天地
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm tracking-wide">
            星辰流转，命运之轮已开始转动…选择你将降临的世界
          </p>

          {/* 底部装饰线 */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-[8px] text-muted-foreground/20">◆</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◇</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◆</span>
          </div>
        </div>

        {/* ===== 世界卡片网格：PC 4列 × 2行 ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {worlds.map((world, index) => (
            <WorldCard
              key={world.id}
              world={world}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
