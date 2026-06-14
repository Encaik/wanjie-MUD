/**
 * 组件：ThemeSettingsPanel
 *
 * 主题设置面板 — 允许用户切换：
 * - 外观模式（亮色 / 暗色 / 跟随系统）
 * - 配色来源（世界主题 / 默认主题）
 * - 当前主题色块预览
 *
 * @module views/game
 */

'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Palette, Globe } from 'lucide-react';
import { useTheme } from '@/modules/theme/hooks/useTheme';
import type { ThemeMode } from '@/modules/theme';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent } from '@/shared/ui/data-display/card';

/** 外观模式选项配置 */
const MODE_OPTIONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'light', icon: <Sun className="w-4 h-4" />, label: '浅色' },
  { mode: 'dark', icon: <Moon className="w-4 h-4" />, label: '深色' },
  { mode: 'system', icon: <Monitor className="w-4 h-4" />, label: '系统' },
];

/** 预览色块配置（从当前生效的 CSS 变量读取） */
const PREVIEW_VARS = [
  { name: '--primary', label: '主色' },
  { name: '--background', label: '背景' },
  { name: '--foreground', label: '文字' },
  { name: '--accent', label: '强调' },
  { name: '--border', label: '边框' },
] as const;

/**
 * 读取当前 CSS 变量的计算值
 */
function getCssVarValue(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export function ThemeSettingsPanel() {
  const { theme, setThemeMode, toggleDarkMode, setUseWorldTheme } = useTheme();
  // 用本地 state 跟踪预览颜色，在主题变化时更新
  const [, setTick] = useState(0);

  // 主题变化时强制刷新预览
  useEffect(() => {
    setTick(t => t + 1);
  }, [theme.isDark, theme.useWorldTheme, theme.worldThemeData]);

  const previewColors = PREVIEW_VARS.map(v => ({
    ...v,
    value: getCssVarValue(v.name),
  }));

  return (
    <div className="space-y-6">
      {/* 外观模式 */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
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
              className="flex items-center gap-1.5"
            >
              {opt.icon}
              <span className="text-xs">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 配色来源 */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          配色来源
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={theme.useWorldTheme ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUseWorldTheme(true)}
            className="flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            <div className="text-left">
              <div className="text-xs font-medium">世界主题</div>
              <div className="text-[10px] opacity-70 truncate max-w-[120px]">
                {theme.worldThemeData?.displayName || '当前世界'}
              </div>
            </div>
          </Button>
          <Button
            variant={!theme.useWorldTheme ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUseWorldTheme(false)}
            className="flex items-center gap-1.5"
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs">默认主题</span>
          </Button>
        </div>
      </div>

      {/* 主题预览 */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          当前配色预览
        </h3>
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="grid grid-cols-5 gap-2 mb-2">
              {previewColors.map(c => (
                <div key={c.name} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-md border border-border shadow-sm"
                    style={{ backgroundColor: c.value || 'transparent' }}
                  />
                  <span className="text-[9px] text-muted-foreground">{c.label}</span>
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
      </div>

      {/* 快捷暗色切换 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDarkMode}
        className="w-full text-xs"
      >
        {theme.isDark
          ? <><Sun className="w-3.5 h-3.5 mr-1.5" />切换到亮色模式</>
          : <><Moon className="w-3.5 h-3.5 mr-1.5" />切换到暗色模式</>
        }
      </Button>
    </div>
  );
}
