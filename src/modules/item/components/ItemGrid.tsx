'use client';

/**
 * 响应式物品网格容器
 *
 * 根据屏幕宽度自动调整列数：4→5→6→8
 * 含空状态占位显示。
 */

import { type ReactNode } from 'react';

import { Package } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

interface ItemGridProps {
  /** 要渲染的物品 React 节点列表 */
  children: ReactNode;
  /** 空状态提示文字 */
  emptyMessage?: string;
  /** 附加样式 */
  className?: string;
}

export function ItemGrid({ children, emptyMessage = '暂无物品', className }: ItemGridProps) {
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Package className="w-10 h-10 opacity-30" />
        <span className="text-sm">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5',
        'auto-rows-fr',
        className,
      )}
    >
      {children}
    </div>
  );
}
