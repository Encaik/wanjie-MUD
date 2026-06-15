/**
 * WanjiePanel — 万界盘
 *
 * 底部滑出面板，展示次要功能面板（从 panelRegistry 获取）。
 * 点击面板 → 关闭 + router.push(route)，点击蒙层 → 关闭。
 * 通过 GameMenu 的"更多"按钮触发。
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';


import { cn } from '@/shared/utils';

import { SECONDARY_PANELS } from './panelRegistry';

import type { PanelDefinition } from './panelRegistry';

interface WanjiePanelProps {
  open: boolean;
  onClose: () => void;
}

export function WanjiePanel({ open, onClose }: WanjiePanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // 按 group 分组
  const groupedPanels = useMemo(() => {
    const groups: Record<string, PanelDefinition[]> = {};
    for (const p of SECONDARY_PANELS) {
      const g = p.group ?? '其他';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return groups;
  }, []);

  // 面板点击 → 路由跳转 + 关闭
  const handlePanelSelect = (route: string) => {
    router.push(route);
    onClose();
  };

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
        aria-label="更多功能"
      >
        {/* 手柄 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-base font-serif tracking-[0.1em] text-foreground">✦ 更 多 功 能 ✦</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors" aria-label="关闭">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 pb-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {Object.entries(groupedPanels).map(([groupTitle, panels]) => (
            <div key={groupTitle}>
              <h3 className="text-[10px] text-primary/50 font-serif tracking-wider mb-2 pl-1">
                {groupTitle}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {panels.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePanelSelect(p.route)}
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
