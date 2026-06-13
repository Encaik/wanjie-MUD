'use client';

import { ReactNode } from 'react';

import { cn } from '@/shared/utils';

/**
 * 空槽位卡片组件
 *
 * 用于展示未装备物品的槽位占位符
 */
interface EmptySlotCardProps {
  label: string;
  icon: ReactNode;
  className?: string;
}

export function EmptySlotCard({ label, icon, className }: EmptySlotCardProps) {
  return (
    <div
      data-slot="empty-slot-card"
      className={cn(
        "p-2 rounded-lg border border-border bg-muted/30",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="shrink-0 text-muted-foreground">{icon}</div>
        <div className="text-xs text-muted-foreground font-serif">{label}</div>
      </div>
    </div>
  );
}

/**
 * 背包区域标题组件
 *
 * 用于背包中各分类区块的标题行
 */
interface BackpackHeaderProps {
  icon: ReactNode;
  title: string;
  count: number;
  className?: string;
}

export function BackpackHeader({ icon, title, count, className }: BackpackHeaderProps) {
  return (
    <div
      data-slot="backpack-header"
      className={cn(
        "text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1 font-serif",
        className,
      )}
    >
      {icon}
      {title} ({count})
    </div>
  );
}

/**
 * 空背包提示组件
 *
 * 背包中某分类无物品时显示的占位提示
 */
export function EmptyBackpackHint({
  message = '暂无物品',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      data-slot="empty-backpack-hint"
      className={cn(
        "text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg font-serif",
        className,
      )}
    >
      {message}
    </div>
  );
}
