'use client';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/shared/ui/actions/button';
import { cn } from '@/shared/utils';

interface WorldInfoBarProps {
  worldName?: string;
  visualConfig?: {
    icon: string;
    accentColor: string;
    gradientClass: string;
    borderColor: string;
    bgGradient: string;
    colorGradient: string;
  };
  onBack: () => void;
}

/**
 * 世界信息条 — 卷轴题头
 *
 * 展示当前已选世界的信息，带装饰隅角和金线分隔。
 * 叙事化返回按钮："← 返回星盘"。
 */
export function WorldInfoBar({ worldName, visualConfig, onBack }: WorldInfoBarProps) {
  return (
    <div className="relative px-4 py-2.5 bg-muted/20 rounded-lg mb-3">
      {/* ===== 四角隅饰 ===== */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/20 rounded-tl-sm" aria-hidden="true" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/20 rounded-tr-sm" aria-hidden="true" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/20 rounded-bl-sm" aria-hidden="true" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/20 rounded-br-sm" aria-hidden="true" />

      <div className="flex items-center gap-3">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="shrink-0 font-serif tracking-wide text-xs h-7"
          aria-label="返回世界选择"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          返回星盘
        </Button>

        {/* 金线分隔 */}
        <span className="h-4 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" aria-hidden="true" />

        {/* 世界图标 + 名称 */}
        <div className="flex items-center gap-1.5 min-w-0">
          {visualConfig && (
            <span className={cn('text-lg shrink-0', visualConfig.accentColor)} aria-hidden="true">
              {visualConfig.icon}
            </span>
          )}
          <span className="text-sm font-bold text-foreground font-serif tracking-[0.1em] truncate">
            {worldName || '未知世界'}
          </span>
        </div>
      </div>
    </div>
  );
}
