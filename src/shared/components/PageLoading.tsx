'use client';

import { Sparkles } from 'lucide-react';

interface PageLoadingProps {
  /** 加载提示文字，默认"天道推演中..." */
  message?: string;
  /** 副标题，默认"命运之轮正在编织" */
  subtitle?: string;
}

/**
 * 统一页面加载状态
 *
 * 用于首页 → 世界选择 → 人物选择 → 游戏的过渡加载，
 * 保持一致的视觉风格：旋转光环 + 中心星光 + 中式文案。
 */
export function PageLoading({
  message = '天道推演中...',
  subtitle = '命运之轮正在编织',
}: PageLoadingProps) {
  return (
    <div className="min-h-dvh relative flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 relative z-10">
        {/* 旋转光环 + 中心星光 */}
        <div className="relative">
          <div className="animate-spin w-16 h-16 rounded-full border-2 border-primary/15 border-t-primary/60" />
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary/30" />
        </div>
        {/* 文案 */}
        <div className="text-center space-y-1">
          <p className="text-base font-medium text-foreground font-serif tracking-wide">
            {message}
          </p>
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
