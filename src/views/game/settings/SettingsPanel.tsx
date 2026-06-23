/**
 * 组件：SettingsPanel
 *
 * 用户偏好设置面板 — 以 Sheet 抽屉形式从右侧滑入，与 DeveloperPanel 共用同一抽屉模式。
 * 包含：
 * - 外观模式切换（浅色 / 深色 / 跟随系统）
 * - 配色来源选择（世界主题 / 默认主题）
 * - 主题色块预览
 * - 快捷暗色切换
 *
 * 可通过外部 open/onOpenChange 控制，也可使用默认的悬浮触发按钮。
 *
 * @module views/game
 */

'use client';

import { useEffect, useState } from 'react';

import { Sun, Moon, Monitor, Palette, Globe, Settings } from 'lucide-react';

import type { ThemeMode } from '@/modules/theme';
import { useTheme } from '@/modules/theme/hooks/useTheme';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent } from '@/shared/ui/data-display/card';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/overlay/sheet';
import { cn } from '@/shared/utils';

/** 外观模式选项配置 */
const MODE_OPTIONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'light', icon: <Sun className="w-4 h-4" />, label: '浅色' },
  { mode: 'dark', icon: <Moon className="w-4 h-4" />, label: '深色' },
  { mode: 'system', icon: <Monitor className="w-4 h-4" />, label: '系统' },
];

/** 预览色块配置 */
const PREVIEW_VARS = [
  { name: '--primary', label: '主色' },
  { name: '--background', label: '背景' },
  { name: '--foreground', label: '文字' },
  { name: '--accent', label: '强调' },
  { name: '--border', label: '边框' },
] as const;

/** 读取 CSS 变量计算值 */
function getCssVarValue(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

interface SettingsPanelProps {
  /** 外部控制开关状态（可选，不传则使用内部 trigger） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 是否显示悬浮触发按钮 */
  showTrigger?: boolean;
}

export function SettingsPanel({ open, onOpenChange, showTrigger = false }: SettingsPanelProps) {
  const { theme, setThemeMode, toggleDarkMode, setUseWorldTheme } = useTheme();
  const [, setTick] = useState(0);

  useEffect(() => {
    setTick(t => t + 1);
  }, [theme.isDark, theme.useWorldTheme, theme.worldThemeData]);

  const previewColors = PREVIEW_VARS.map(v => ({
    ...v,
    value: getCssVarValue(v.name),
  }));

  /** 内部 Sheet 内容 */
  const sheetContent = (
    <SheetContent className="w-[360px] sm:max-w-[360px] p-0 flex flex-col">
      {/* ===== 标题区 ===== */}
      <SheetHeader className="px-5 pt-5 pb-3 border-b relative overflow-hidden">
        {/* 顶部渐变光线 */}
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />
        {/* 四角隅饰 */}
        <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-primary/20 rounded-tl-sm" aria-hidden="true" />
        <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-primary/20 rounded-tr-sm" aria-hidden="true" />
        <SheetTitle className="flex items-center gap-2 text-base font-serif tracking-[0.1em]">
          <Settings className="w-4 h-4 text-primary" />
          <span>偏好设置</span>
        </SheetTitle>
        <SheetDescription className="text-xs">
          调整游戏外观与个人偏好
        </SheetDescription>
      </SheetHeader>

      {/* ===== 内容区 ===== */}
      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-6">
          {/* ---- 外观模式 ---- */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 font-serif tracking-wide">
              <Sun className="w-4 h-4 text-primary" />
              外观模式
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {MODE_OPTIONS.map(opt => (
                <Button
                  key={opt.mode}
                  variant={theme.themeMode === opt.mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setThemeMode(opt.mode)}
                  className="flex items-center gap-1.5 transition-all duration-200"
                >
                  {opt.icon}
                  <span className="text-xs">{opt.label}</span>
                </Button>
              ))}
            </div>
          </section>

          {/* 装饰分隔 */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[10px] text-muted-foreground/30 tracking-widest select-none">◆ ◇ ◆</span>
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          </div>

          {/* ---- 配色来源 ---- */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 font-serif tracking-wide">
              <Palette className="w-4 h-4 text-primary" />
              配色来源
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={theme.useWorldTheme ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseWorldTheme(true)}
                className="flex items-center gap-1.5 transition-all duration-200"
              >
                <Globe className="w-4 h-4" />
                <div className="text-left min-w-0">
                  <div className="text-xs font-medium truncate">世界主题</div>
                  <div className="text-[10px] opacity-70 truncate">
                    {theme.worldThemeData?.displayName || '当前世界'}
                  </div>
                </div>
              </Button>
              <Button
                variant={!theme.useWorldTheme ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseWorldTheme(false)}
                className="flex items-center gap-1.5 transition-all duration-200"
              >
                <Palette className="w-4 h-4" />
                <span className="text-xs">默认主题</span>
              </Button>
            </div>
          </section>

          {/* 装饰分隔 */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <span className="text-[10px] text-muted-foreground/30 tracking-widest select-none">◆ ◇ ◆</span>
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          </div>

          {/* ---- 主题预览 ---- */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 font-serif tracking-wide">
              当前配色预览
            </h3>
            <Card className="relative overflow-hidden border-border/40">
              {/* 四角隅饰 */}
              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/15 rounded-tl-sm" aria-hidden="true" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary/15 rounded-tr-sm" aria-hidden="true" />
              <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary/15 rounded-bl-sm" aria-hidden="true" />
              <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/15 rounded-br-sm" aria-hidden="true" />
              <CardContent className="p-3">
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {previewColors.map(c => (
                    <div key={c.name} className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-md border border-border shadow-sm"
                        style={{ backgroundColor: c.value || 'transparent' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{c.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    theme.isDark ? 'bg-blue-400' : 'bg-amber-400',
                  )} />
                  {theme.isDark ? '暗色模式' : '亮色模式'}
                  {' · '}
                  {theme.useWorldTheme
                    ? (theme.worldThemeData?.displayName || '世界主题')
                    : '默认主题'}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ---- 快捷切换 ---- */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="w-full text-xs transition-all duration-200"
          >
            {theme.isDark
              ? <><Sun className="w-3.5 h-3.5 mr-1.5" />切换到亮色模式</>
              : <><Moon className="w-3.5 h-3.5 mr-1.5" />切换到暗色模式</>
            }
          </Button>
        </div>
      </ScrollArea>

      {/* ===== 底部 ===== */}
      <div className="px-5 py-2 border-t">
        <p className="text-[10px] text-muted-foreground/50 text-center tracking-wide font-serif">
          万界修行录 · 命运指引
        </p>
      </div>
    </SheetContent>
  );

  // 受控模式
  if (open !== undefined && onOpenChange) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {sheetContent}
      </Sheet>
    );
  }

  // 非受控模式（带触发按钮）
  return (
    <Sheet>
      {showTrigger && (
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-20 h-10 w-10 rounded-full border-2 border-primary/20 bg-background/90 backdrop-blur-sm hover:bg-primary/5 shadow-lg z-50 transition-all duration-300 hover:scale-105"
            title="偏好设置"
          >
            <Settings className="h-4 w-4 text-primary/70" />
          </Button>
        </SheetTrigger>
      )}
      {sheetContent}
    </Sheet>
  );
}
