/**
 * PanelNav — 底栏功能导航
 *
 * 5 个主入口（修炼、机缘、势力、功法、商店）+ 万界盘按钮。
 * 职责：纯 UI 渲染 + 点击回调，不含业务逻辑。
 */

'use client';

import { Sparkles, Swords, Building2, Zap, ShoppingBag, MoreHorizontal } from 'lucide-react';

import { cn } from '@/shared/utils';

export type PanelId = 'cultivation' | 'adventure' | 'faction' | 'technique' | 'shop';

export const MAIN_PANELS: { id: PanelId; icon: React.ReactNode; label: string }[] = [
  { id: 'cultivation', icon: <Sparkles className="w-4 h-4" />, label: '修炼' },
  { id: 'adventure', icon: <Swords className="w-4 h-4" />, label: '机缘' },
  { id: 'faction', icon: <Building2 className="w-4 h-4" />, label: '势力' },
  { id: 'technique', icon: <Zap className="w-4 h-4" />, label: '功法' },
  { id: 'shop', icon: <ShoppingBag className="w-4 h-4" />, label: '商店' },
];

export interface PanelNavStatusDots {
  /** 万界盘按钮上显示脉冲光点（如炼丹进行中） */
  wanjieDot?: boolean;
  /** 势力入口显示晋升提示点 */
  factionPromotion?: boolean;
  /** 修炼入口显示提示点 */
  cultivationAlert?: boolean;
}

interface PanelNavProps {
  activePanel: PanelId | null;
  onPanelChange: (panel: PanelId) => void;
  onWanjieOpen: () => void;
  statusDots?: PanelNavStatusDots;
}

export function PanelNav({ activePanel, onPanelChange, onWanjieOpen, statusDots }: PanelNavProps) {
  return (
    <nav className="flex items-center gap-1 p-1.5 rounded-lg bg-card/80 border border-border/50 shadow-sm backdrop-blur-sm">
      {MAIN_PANELS.map(p => (
        <button
          key={p.id}
          onClick={() => onPanelChange(p.id)}
          title={p.label}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            activePanel === p.id
              ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
              : 'text-muted-foreground border border-transparent',
          )}
        >
          {p.icon}
          <span className="hidden sm:inline">{p.label}</span>
          {p.id === 'faction' && statusDots?.factionPromotion && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
          )}
          {p.id === 'cultivation' && statusDots?.cultivationAlert && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      ))}

      {/* 分隔 */}
      <div className="w-px h-6 bg-border/50 mx-0.5" />

      {/* 万界盘按钮 */}
      <button
        onClick={onWanjieOpen}
        title="万界盘"
        className={cn(
          'relative flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-200',
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent',
        )}
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">万界</span>
        {statusDots?.wanjieDot && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </button>
    </nav>
  );
}
