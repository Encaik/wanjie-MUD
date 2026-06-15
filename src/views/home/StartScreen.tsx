'use client';

import { useState } from 'react';

import { Sparkles, Upload, X } from 'lucide-react';

import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent } from '@/shared/ui/data-display/card';
import { useDebounce } from '@/shared/utils';

interface StartScreenProps {
  onStart: () => void;
  onImportSave?: (jsonString: string) => void;
}

/**
 * 首页 — "踏入万界"
 *
 * 背景由全局 BackgroundLayout 统一提供。
 */
export function StartScreen({ onStart, onImportSave }: StartScreenProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const debouncedStart = useDebounce(onStart, 600);

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
    <div className="min-h-dvh md:min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* ===== 内容卡片 ===== */}
      <Card
        className="relative z-10 max-w-lg w-full mx-4 shadow-2xl border-primary/10 overflow-hidden"
        style={{ animation: 'fade-in-up 0.8s ease-out forwards' }}
      >
        {/* 顶部流光 */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

        {/* 左下角装饰光晕 */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
        {/* 右上角装饰光晕 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="pt-6 pb-5 px-8 text-center space-y-5">
          {/* ===== Logo 区域 ===== */}
          <div className="flex flex-col items-center gap-3">
            {/* 微微光晕衬托 logo */}
            <div className="relative">
              <div className="absolute inset-4 bg-primary/10 rounded-full blur-3xl" />
              <img
                src="/img/logo-transparent.png"
                alt="万界修行录"
                className="h-48 w-auto relative select-none pointer-events-none"
              />
            </div>
            <p className="text-sm text-muted-foreground/50 tracking-[0.35em] font-serif">
              命运指引，万界归一
            </p>
          </div>

          {/* ===== 装饰分隔 ===== */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-border/70 to-transparent" />
            <span className="text-primary/20 text-xs select-none">◇</span>
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-border/70 to-transparent" />
          </div>

          {/* ===== 内容区域 ===== */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground/60 leading-relaxed tracking-wide">
              万界之门已开启，星辰指引着命运的方向。
              <br />
              择一方天地，书写属于你的不朽传奇。
            </p>

            {/* ===== 开始按钮（九宫格边框 + 光晕） ===== */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-[4px] bg-primary/15 blur-xl"
                style={{ animation: 'button-glow 3s ease-in-out infinite' }}
              />
              <Button
                size="lg"
                onClick={debouncedStart}
                className="relative w-full text-base font-semibold tracking-[0.15em] font-serif
                  nine-slice-border rounded-[4px] h-auto py-2.5
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
                variant="ghost"
                size="sm"
                onClick={handleImport}
                className="w-full text-xs text-muted-foreground/50 hover:text-foreground hover:bg-transparent transition-colors"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                导入存档
              </Button>
            )}

            {/* ===== 导入错误提示 ===== */}
            {importError && (
              <div
                className="flex items-center gap-1.5 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs"
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
            {onImportSave && (
              <p className="text-[10px] text-muted-foreground/25 tracking-wide">
                导入存档将覆盖当前游戏进度（消息记录不包含在存档中）
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
