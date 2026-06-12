'use client';

import { useState } from 'react';

import { Sparkles, Upload, X } from 'lucide-react';

import { MysticalBackground } from '@/shared/components';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

interface StartScreenProps {
  onStart: () => void;
  onImportSave?: (jsonString: string) => void;
}

/**
 * 首页 — "踏入万界"
 *
 * 使用 MysticalBackground（runes）替代内联背景系统，
 * 与选择页共用统一的氛围组件。
 */
export function StartScreen({ onStart, onImportSave }: StartScreenProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = () => {
    setImportError(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            onImportSave?.(content);
          } catch {
            setImportError('导入失败：存档格式无效');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-dvh md:min-h-screen relative overflow-hidden flex items-center justify-center bg-background">
      {/* ===== 符文背景（共享组件） ===== */}
      <MysticalBackground variant="runes" />

      {/* ===== 内容卡片 ===== */}
      <Card
        className="relative z-10 max-w-md w-full mx-4 shadow-2xl border-primary/10"
        style={{ animation: 'fade-in-up 0.8s ease-out forwards' }}
      >
        {/* 顶部渐变光线 */}
        <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {/* 底部渐变光线 */}
        <div className="absolute -bottom-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <CardContent className="pt-10 pb-8 px-8 text-center space-y-7">
          {/* ===== 标题区域 ===== */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2.5">
              <Sparkles
                className="w-5 h-5 text-primary/50"
                style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}
              />
              <h1 className="text-4xl font-bold tracking-[0.15em] text-foreground font-serif">
                万界修行录
              </h1>
              <Sparkles
                className="w-5 h-5 text-primary/50"
                style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}
              />
            </div>
            <p className="text-lg text-muted-foreground tracking-[0.3em] font-serif">
              命运指引，万界归一
            </p>
          </div>

          {/* ===== 装饰分隔 ===== */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-primary/30 text-xs tracking-widest select-none">
              ◆ ◇ ◆
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* ===== 内容区域 ===== */}
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground/80 leading-relaxed tracking-wide">
              万界之门已开启，星辰指引着命运的方向。
              <br />
              择一方天地，书写属于你的不朽传奇。
            </p>

            {/* ===== 开始按钮（带光晕） ===== */}
            <div className="relative pt-1">
              <div
                className="absolute inset-0 rounded-lg bg-primary/15 blur-xl"
                style={{ animation: 'button-glow 3s ease-in-out infinite' }}
              />
              <Button
                size="lg"
                onClick={onStart}
                className="relative w-full text-base font-semibold tracking-[0.15em] font-serif
                  transition-all duration-500
                  hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20
                  active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                踏入万界
              </Button>
            </div>

            {/* ===== 导入存档按钮 ===== */}
            {onImportSave && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleImport}
                className="w-full transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
              >
                <Upload className="w-4 h-4 mr-2" />
                导入存档
              </Button>
            )}

            {/* ===== 导入错误提示 ===== */}
            {importError && (
              <div
                className="flex items-center gap-1.5 p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs"
                style={{ animation: 'fade-in-up 0.4s ease-out forwards' }}
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>{importError}</span>
                <button
                  className="ml-auto p-0.5 rounded hover:bg-destructive/20 transition-colors"
                  onClick={() => setImportError(null)}
                  aria-label="关闭错误提示"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* ===== 底部提示 ===== */}
            <p className="text-xs text-muted-foreground/50 tracking-wide">
              导入存档将覆盖当前游戏进度（消息记录不包含在存档中）
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
