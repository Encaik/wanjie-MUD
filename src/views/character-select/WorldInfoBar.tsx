'use client';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/shared/ui/button';
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

export function WorldInfoBar({ worldName, visualConfig, onBack }: WorldInfoBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border rounded-lg mb-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0" aria-label="返回选择世界">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Button>

      {visualConfig && (
        <span className={cn('text-lg', visualConfig.accentColor)} aria-hidden="true">
          {visualConfig.icon}
        </span>
      )}
      <span className="text-sm font-semibold text-foreground font-serif">{worldName || '未知世界'}</span>
    </div>
  );
}
