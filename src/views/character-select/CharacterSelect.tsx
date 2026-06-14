'use client';

import { Sparkles, Users } from 'lucide-react';

import type { WorldType, AttributeTemplate } from '@/core/types';
import type { CharacterTemplate } from '@/modules/identity/hooks';
import { MysticalBackground } from '@/shared/components';
import { Button } from '@/shared/ui/actions/button';

import { CharacterCard } from './CharacterCard';
import { WorldInfoBar } from './WorldInfoBar';

interface CharacterSelectProps {
  characters: CharacterTemplate[];
  onSelect: (index: number) => void;
  worldType?: WorldType;
  worldName?: string;
  visualConfig?: { icon: string; accentColor: string; gradientClass: string; borderColor: string; bgGradient: string; colorGradient: string };
  attributeDefinitions?: AttributeTemplate[];
  attributeCount?: number;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

/**
 * 人物选择页 — "命运之契"
 *
 * 八位命运之子如命星悬浮于天道之中。使用 MysticalBackground（destiny）
 * 营造金色光点汇聚、命运之线交织的氛围。
 */
export function CharacterSelect({
  characters, onSelect, worldName, visualConfig, attributeDefinitions, loading, error, onBack,
}: CharacterSelectProps) {
  const maleCount = characters.filter(c => c.gender === '男').length;
  const femaleCount = characters.filter(c => c.gender === '女').length;

  // ── loading 状态 ──
  if (loading) {
    return (
      <div className="min-h-dvh bg-background relative flex items-center justify-center p-4">
        <MysticalBackground variant="destiny" intensity="subtle" />
        <div className="flex flex-col items-center gap-5 relative z-10">
          <div className="relative">
            <div className="animate-spin w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary/30 animate-pulse" />
          </div>
          <p className="text-base font-medium text-foreground font-serif tracking-wide">天道推演中...</p>
          <p className="text-xs text-muted-foreground">命运之轮正在编织天命之子的命格</p>
        </div>
      </div>
    );
  }

  // ── error 状态 ──
  if (error) {
    return (
      <div className="min-h-dvh bg-background relative flex items-center justify-center p-4">
        <MysticalBackground variant="destiny" intensity="subtle" />
        <div className="flex flex-col items-center gap-4 text-center relative z-10">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-destructive/50" />
          </div>
          <p className="text-destructive font-medium font-serif">天命紊乱: {error}</p>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>返回星盘</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background relative flex items-center justify-center p-4 md:p-8">
      {/* ===== 命运背景 ===== */}
      <MysticalBackground variant="destiny" />

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* ===== WorldInfoBar ===== */}
        {worldName && visualConfig && onBack && (
          <WorldInfoBar worldName={worldName} visualConfig={visualConfig} onBack={onBack} />
        )}

        {/* ===== 标题区 ===== */}
        <div className="text-center mb-6" style={{ animation: 'fade-in-up 0.6s ease-out forwards' }}>
          {/* 装饰线 */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <Sparkles
              className="w-5 h-5 text-primary/35"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            />
            <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground font-serif tracking-[0.12em] mb-1.5">
            命运之契<span className="text-primary/40 text-xl mx-2">·</span>谁将踏入此界
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm tracking-wide mb-2">
            天道推演，八位命运之子静待抉择
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-serif">
              <Users className="w-3 h-3" />♂ {maleCount} 人
            </span>
            <span className="text-border/40">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-pink-400 font-serif">
              <Users className="w-3 h-3" />♀ {femaleCount} 人
            </span>
          </div>

          {/* 底部装饰线 */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-[8px] text-muted-foreground/20">◆</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◇</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◆</span>
          </div>
        </div>

        {/* ===== 角色卡片网格 ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {characters.map((character, index) => (
            <CharacterCard
              key={character.index}
              character={character}
              index={index}
              onSelect={onSelect}
              visualConfig={visualConfig}
              attributeDefinitions={attributeDefinitions}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
