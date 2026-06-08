'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StartScreenProps {
  onStart: () => void;
  onImportSave?: (jsonString: string) => void;
}

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
      {/* "万界" 背景字 - 层级在背景之上，卡片之下 */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="absolute text-[75vw] font-bold text-nowrap text-muted-foreground/20 font-serif tracking-wider"
        >
          万界
        </span>
      </div>

      {/* 内容卡片 */}
      <Card className="relative z-10 max-w-md w-full mx-4 shadow-lg">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          {/* 标题区域 */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-widest text-foreground">
              万界修行录
            </h1>
            <p className="text-lg text-muted-foreground tracking-wide">
              命运指引，万界归一
            </p>
          </div>

          {/* 简短说明 */}
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            在万界宇宙中，八位命运之子即将踏上各自的修行之路。
            选择你的化身，降临一方世界，开启属于你的传说。
          </p>

          {/* 开始按钮 */}
          <Button
            size="lg"
            onClick={onStart}
            className="w-full transition-all duration-300"
          >
            开启命运之门
          </Button>

          {/* 导入存档按钮 */}
          {onImportSave && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleImport}
              className="w-full transition-all duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              导入存档
            </Button>
          )}

          {/* 导入错误提示 */}
          {importError && (
            <div className="flex items-center gap-1.5 p-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs">
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

          <p className="text-xs text-muted-foreground/60">
            导入存档将覆盖当前游戏进度（消息记录不包含在存档中）
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
