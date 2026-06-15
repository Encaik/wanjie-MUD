'use client';

import { Globe, Scroll, Sparkles, User } from 'lucide-react';

import type { WorldType } from '@/core/types'; // 仅用于 confirmText 类型签名
import { useStatLabels } from '@/modules/identity/hooks/useStatLabels';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent } from '@/shared/ui/data-display/card';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import { cn, useDebounce } from '@/shared/utils';

interface BackstoryProps {
  backstory: string;
  onConfirm: () => void;
  /** 角色名 */
  characterName?: string;
  /** 世界名 */
  worldName?: string;
  /** 世界类型 */
  worldType?: WorldType;
  /** 世界属性显示名映射 */
  statDisplayNames?: Record<string, string>;
  /** 世界视觉配置 */
  visualConfig?: {
    icon: string;
    accentColor: string;
    gradientClass: string;
    borderColor: string;
    bgGradient: string;
    colorGradient: string;
  };
}

// 世界风味确认按钮文案
const confirmText: Record<WorldType, string> = {
  '修仙': '踏上仙途', '仙侠': '踏上仙途',
  '高武': '踏入江湖', '武侠': '踏入江湖',
  '科技': '启动征程', '魔幻': '启程冒险',
  '异能': '觉醒启程', '末世': '踏入废土',
};

/** 安全获取确认按钮文案 */
function safeConfirmText(worldType?: string): string {
  return confirmText[(worldType ?? '修仙') as WorldType] ?? '开启旅程';
}

// ============================================
// 文本格式化（保留原有逻辑）
// ============================================

function formatText(text: string): React.ReactNode {
  const processBookTitles = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /《(.+?)》/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(processQuotes(str.slice(lastIndex, match.index)));
      parts.push(<span key={key++} className="text-primary font-medium">《{match[1]}》</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) parts.push(processQuotes(str.slice(lastIndex)));
    return parts.length > 0 ? parts : str;
  };

  const processQuotes = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /(?:「(.+?)」|"(.+?)"|"(.+?)")/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(processNumbers(str.slice(lastIndex, match.index)));
      const quoteContent = match[1] || match[2] || match[3];
      parts.push(<span key={key++} className="text-amber-600 dark:text-amber-400 italic">「{quoteContent}」</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) parts.push(processNumbers(str.slice(lastIndex)));
    return parts.length > 0 ? parts : str;
  };

  const processNumbers = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /(\d+(?:\.\d+)?(?:年|岁|天|月|日|个|次|倍|成|分|层|阶|级|品)?)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index));
      parts.push(<span key={key++} className="text-blue-600 dark:text-blue-400 font-medium tabular-nums">{match[1]}</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex));
    return parts.length > 0 ? parts : str;
  };

  return processBookTitles(text);
}

/**
 * 背景故事页 — "宿命之章"
 *
 * 展示角色背景故事，带四角隅饰的故事卷轴卡片和叙事化标题。
 * 背景由全局 BackgroundLayout 统一提供。
 */
export function BackstoryView({
  backstory, onConfirm, characterName, worldName, worldType = '修仙', visualConfig, statDisplayNames,
}: BackstoryProps) {
  const paragraphs = backstory.split('\n\n').filter(p => p.trim());
  const { displayNames } = useStatLabels(statDisplayNames);
  const debouncedConfirm = useDebounce(onConfirm, 600);

  return (
    <div className="min-h-dvh md:min-h-screen relative flex items-center justify-center">
      <div className="w-full max-w-5xl relative z-10 flex flex-col px-4 sm:px-6 py-6">
        {/* ===== 叙事化标题 ===== */}
        <div className="text-center mb-4 shrink-0" style={{ animation: 'fade-in-up 0.6s ease-out forwards' }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <Scroll
              className="w-5 h-5 text-primary/40"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            />
            <span className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground font-serif tracking-[0.12em] mb-1.5">
            宿命之章
          </h1>

          {characterName && worldName && (
            <p className="text-muted-foreground text-sm tracking-wide">
              <span className="text-foreground/80 font-semibold font-serif">{characterName}</span>
              <span className="mx-2 text-muted-foreground/40">·</span>
              <span className="text-muted-foreground/60">踏入</span>
              {visualConfig && (
                <span className={cn('mx-1 text-base', visualConfig.accentColor)}>{visualConfig.icon}</span>
              )}
              <span className="text-foreground/80 font-semibold font-serif">{worldName}</span>
            </p>
          )}

          {/* 装饰线 */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-[8px] text-muted-foreground/20">◆</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◇</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◆</span>
          </div>
        </div>

        {/* ===== 角色+世界双卡片 ===== */}
        {(characterName || worldName) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 shrink-0"
            style={{ animation: 'fade-in-up 0.5s ease-out 0.15s both' }}>
            {/* 角色卡片 */}
            {characterName && (
              <Card className="relative border-primary/10 bg-primary/[0.03] overflow-hidden">
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/20 rounded-tl-sm" aria-hidden="true" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/20 rounded-tr-sm" aria-hidden="true" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/20 rounded-bl-sm" aria-hidden="true" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/20 rounded-br-sm" aria-hidden="true" />
                <CardContent className="p-3 flex items-center gap-3">
                  <User className="w-5 h-5 text-primary/50 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-serif">命运之子</div>
                    <div className="text-sm font-semibold text-foreground font-serif tracking-wide truncate">
                      {characterName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* 世界卡片 */}
            {worldName && (
              <Card className="relative border-primary/10 bg-primary/[0.03] overflow-hidden">
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/20 rounded-tl-sm" aria-hidden="true" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/20 rounded-tr-sm" aria-hidden="true" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/20 rounded-bl-sm" aria-hidden="true" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/20 rounded-br-sm" aria-hidden="true" />
                <CardContent className="p-3 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary/50 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground font-serif">降临之地</div>
                    <div className="text-sm font-semibold text-foreground font-serif tracking-wide truncate">
                      {visualConfig && (
                        <span className={cn('mr-1.5', visualConfig.accentColor)}>{visualConfig.icon}</span>
                      )}
                      {worldName}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {displayNames.slice(0, 3).map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] px-1 font-serif">{name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== 故事卷轴卡片 ===== */}
        <Card
          className="relative flex-1 min-h-0 border-border/40 shadow-lg overflow-hidden"
          style={{ animation: 'fade-in-up 0.5s ease-out 0.3s both' }}
        >
          {/* 四角隅饰 */}
          <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/25 rounded-tl-sm" aria-hidden="true" />
          <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/25 rounded-tr-sm" aria-hidden="true" />
          <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/25 rounded-bl-sm" aria-hidden="true" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/25 rounded-br-sm" aria-hidden="true" />

          {/* 顶部渐变光线 */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

          <CardContent className="p-4 sm:p-6 md:p-8 h-full">
            <ScrollArea className="h-full md:h-auto">
              <div className="space-y-5 md:flex md:flex-col md:justify-center md:min-h-full md:py-4">
                {paragraphs.map((paragraph, index) => (
                  <div key={index}>
                    <p className={cn(
                      'leading-relaxed text-foreground/85',
                      index === 0
                        ? 'text-base sm:text-lg md:text-xl font-medium text-foreground'
                        : 'text-sm sm:text-base md:text-lg',
                    )}>
                      {formatText(paragraph)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ===== 确认按钮 ===== */}
        <div
          className="text-center mt-5 shrink-0"
          style={{ animation: 'fade-in-up 0.5s ease-out 0.45s both' }}
        >
          <div className="relative inline-block">
            <div
              className="absolute inset-0 rounded-lg bg-primary/10 blur-xl"
              style={{ animation: 'button-glow 3s ease-in-out infinite' }}
            />
            <Button
              size="lg"
              onClick={debouncedConfirm}
              className="relative font-serif tracking-[0.15em] transition-all duration-500
                hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {safeConfirmText(worldType)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
