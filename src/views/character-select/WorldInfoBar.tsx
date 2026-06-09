'use client';

import { ArrowLeft } from 'lucide-react';

import { useStatLabels } from '@/modules/identity/hooks/useStatLabels';
import { getWorldVisualConfig } from '@/shared/lib/registry';
import type { WorldType } from '@/shared/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';

interface WorldInfoBarProps {
  worldName: string;
  worldType: WorldType;
  onBack: () => void;
}

export function WorldInfoBar({ worldName, worldType, onBack }: WorldInfoBarProps) {
  const { displayNames } = useStatLabels(worldType);
  const visualConfig = getWorldVisualConfig(worldType);

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
        {displayNames.map((name, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">
            {name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
