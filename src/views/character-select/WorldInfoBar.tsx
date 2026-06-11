'use client';

import { ArrowLeft } from 'lucide-react';

import { STAT_KEYS } from '@/modules/identity/data/statDisplayNames';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';

interface WorldInfoBarProps {
  worldName: string;
  /** 世界视觉配置（图标、配色），由 World 对象携带 */
  visualConfig: {
    icon: string;
    accentColor: string;
    gradientClass: string;
    borderColor: string;
    bgGradient: string;
    colorGradient: string;
  };
  /** 属性显示名映射（内部键 → 显示名），由 World 对象携带 */
  statDisplayNames: Record<string, string>;
  onBack: () => void;
}

export function WorldInfoBar({ worldName, visualConfig, statDisplayNames, onBack }: WorldInfoBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border rounded-lg mb-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0" aria-label="返回选择世界">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Button>

      <span className={cn('text-lg', visualConfig.accentColor)} aria-hidden="true">
        {visualConfig.icon}
      </span>
      <span className="text-sm font-semibold text-foreground font-serif">{worldName}</span>

      <div className="flex-1" />

      <div className="flex gap-1 flex-wrap">
        {STAT_KEYS.map((key) => (
          <Badge key={key} variant="secondary" className="text-[10px]">
            {statDisplayNames?.[key] || key}
          </Badge>
        ))}
      </div>
    </div>
  );
}
