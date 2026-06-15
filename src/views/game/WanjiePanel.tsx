/**
 * WanjiePanel — 万界盘
 *
 * 底部滑出面板，展示 9 个次要功能分三组：炼造、武备、记载。
 * 点击面板 → 关闭 + 切换，点击蒙层 → 关闭。
 */

'use client';

import { useEffect, useRef } from 'react';

import { X, FlaskConical, Anvil, Package, Swords, Landmark, Trophy, BookOpen, BarChart3, Shield } from 'lucide-react';

import { cn } from '@/shared/utils';

import type { PanelId } from './PanelNav';

/** 万界盘中可选的扩展面板 ID */
export type WanjiePanelId = Exclude<PanelId, 'cultivation' | 'adventure' | 'faction' | 'technique' | 'shop'>;

export const WANJIE_GROUPS: { title: string; panels: { id: string; icon: React.ReactNode; label: string }[] }[] = [
  {
    title: '炼造',
    panels: [
      { id: 'alchemy', icon: <FlaskConical className="w-5 h-5" />, label: '炼丹' },
      { id: 'forge', icon: <Anvil className="w-5 h-5" />, label: '炼器' },
      { id: 'fragment', icon: <Package className="w-5 h-5" />, label: '碎片' },
    ],
  },
  {
    title: '武备',
    panels: [
      { id: 'skill', icon: <Swords className="w-5 h-5" />, label: '技能' },
      { id: 'equipment', icon: <Shield className="w-5 h-5" />, label: '装备' },
      { id: 'tower', icon: <Landmark className="w-5 h-5" />, label: '试炼' },
    ],
  },
  {
    title: '记载',
    panels: [
      { id: 'achievement', icon: <Trophy className="w-5 h-5" />, label: '成就' },
      { id: 'collection', icon: <BookOpen className="w-5 h-5" />, label: '图鉴' },
      { id: 'statistics', icon: <BarChart3 className="w-5 h-5" />, label: '统计' },
    ],
  },
];

interface WanjiePanelProps {
  open: boolean;
  onClose: () => void;
  onPanelSelect: (panel: string) => void;
}

export function WanjiePanel({ open, onClose, onPanelSelect }: WanjiePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape 键关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* 蒙层 */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 万界盘 */}
      <div
        ref={panelRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-card/95 backdrop-blur-xl border-t border-border/50',
          'rounded-t-2xl shadow-2xl shadow-black/20',
          'max-w-lg mx-auto',
          'transition-transform duration-300 ease-out',
          'animate-slide-up',
        )}
        role="dialog"
        aria-label="万界盘"
      >
        {/* 手柄 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-base font-serif tracking-[0.1em] text-foreground">✦ 万 界 盘 ✦</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors" aria-label="关闭万界盘">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 pb-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {WANJIE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] text-primary/50 font-serif tracking-wider mb-2 pl-1">
                {group.title}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {group.panels.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onPanelSelect(p.id); onClose(); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl',
                      'bg-muted/50 hover:bg-accent hover:text-accent-foreground',
                      'border border-border/30 hover:border-border/60',
                      'transition-all duration-200',
                    )}
                  >
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {p.icon}
                    </div>
                    <span className="text-[11px] font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
