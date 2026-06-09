'use client';

import { ReactNode } from 'react';

/**
 * 空槽位卡片组件
 *
 * 用于展示未装备物品的槽位占位符
 */
interface EmptySlotCardProps {
  label: string;
  icon: ReactNode;
}

export function EmptySlotCard({ label, icon }: EmptySlotCardProps) {
  return (
    <div data-slot="empty-slot-card" className="p-2 rounded-lg border border-border bg-muted/30">
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
}

export function BackpackHeader({ icon, title, count }: BackpackHeaderProps) {
  return (
    <div data-slot="backpack-header" className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1 font-serif">
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
export function EmptyBackpackHint({ message = '暂无物品' }: { message?: string }) {
  return (
    <div data-slot="empty-backpack-hint" className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg font-serif">
      {message}
    </div>
  );
}
