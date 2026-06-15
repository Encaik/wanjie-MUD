/**
 * GameMenu — 顶部标签导航
 *
 * 位于游戏主界面中间栏顶部，7 个按钮均分空间（6 主标签 + "更多"）。
 * 点击"更多"在菜单下方展开次要面板，再次点击或点击面板后收起。
 * 使用 Next.js Link + usePathname 实现路由跳转和高亮。
 */

'use client';

import { useState, useMemo } from 'react';

import { MoreHorizontal, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/utils';

import { PRIMARY_PANELS, SECONDARY_PANELS } from './panelRegistry';

/** 状态提示点 */
export interface GameMenuStatusDots {
  factionPromotion?: boolean;
  cultivationAlert?: boolean;
  wanjieDot?: boolean;
}

interface GameMenuProps {
  statusDots?: GameMenuStatusDots;
}

export function GameMenu({ statusDots }: GameMenuProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  // 按分组整理次要面板
  const groupedSecondary = useMemo(() => {
    const groups: Record<string, typeof SECONDARY_PANELS> = {};
    for (const p of SECONDARY_PANELS) {
      const g = p.group ?? '其他';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return Object.entries(groups);
  }, []);

  const toggleExpanded = () => setExpanded(prev => !prev);

  return (
    <nav className="shrink-0 rounded-lg bg-card/80 border border-border/50 shadow-sm backdrop-blur-sm overflow-hidden transition-all duration-300">
      {/* 主标签行 — 均分空间 */}
      <div className="flex items-stretch p-1.5">
        {PRIMARY_PANELS.map(p => (
          <Link
            key={p.id}
            href={p.route}
            title={p.label}
            onClick={() => setExpanded(false)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200',
              'hover:bg-accent hover:text-accent-foreground',
              pathname === p.route
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
          </Link>
        ))}

        {/* "更多"按钮 — 同样均分 */}
        <button
          onClick={toggleExpanded}
          title={expanded ? '收起' : '更多'}
          className={cn(
            'flex-1 relative flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200',
            'border border-transparent',
            expanded
              ? 'bg-primary/10 text-primary shadow-sm border-primary/20'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <MoreHorizontal className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{expanded ? '收起' : '更多'}</span>
          {statusDots?.wanjieDot && (
            <span className="absolute top-1 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </button>
      </div>

      {/* 展开的次要面板行 */}
      <div
        className={cn(
          'transition-all duration-300 ease-out overflow-hidden',
          expanded ? 'max-h-80 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-3 pb-3 pt-0 space-y-2">
          {groupedSecondary.map(([groupTitle, panels]) => (
            <div key={groupTitle}>
              <span className="text-[10px] text-primary/50 font-serif tracking-wider pl-1">
                {groupTitle}
              </span>
              <div className="flex gap-1.5 mt-1">
                {panels.map(p => (
                  <Link
                    key={p.id}
                    href={p.route}
                    onClick={() => setExpanded(false)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200',
                      'bg-muted/50 hover:bg-accent hover:text-accent-foreground',
                      'border border-border/30 hover:border-border/60',
                      pathname === p.route && 'bg-primary/10 text-primary border-primary/20',
                    )}
                  >
                    {p.icon}
                    <span className="hidden sm:inline">{p.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
