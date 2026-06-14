import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { ModInitProvider } from '@/modules/mod/components/ModInitProvider';
import { ThemeProvider } from '@/modules/theme';
import { GameProvider } from '@/views/game/useGameState';

import type { Metadata } from 'next';

import './globals.css';

/** 防 FOUC 内联脚本 — 在 React 水合前同步恢复主题 */
const THEME_FLICKER_GUARD = `
(function() {
  try {
    // 1. 读取用户偏好
    var prefs = JSON.parse(localStorage.getItem('theme_prefs') || '{}');
    var themeMode = prefs.themeMode || 'system';
    var useWorld = prefs.useWorldTheme !== false;

    // 2. 判断暗色模式
    var isDark = themeMode === 'dark' ||
      (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    // 3. 应用缓存的世界主题（兼容带 _v 版本号的新格式）
    if (useWorld) {
      var cache = JSON.parse(localStorage.getItem('world_theme_cache') || 'null');
      if (cache && cache.lightTheme && cache.darkTheme) {
        var vars = isDark ? cache.darkTheme : cache.lightTheme;
        if (vars) {
          for (var key in vars) {
            if (vars.hasOwnProperty(key)) {
              document.documentElement.style.setProperty(key, vars[key]);
            }
          }
        }
      }
    }
  } catch(e) {}
})();
`.replace(/\n\s*/g, '');

export const metadata: Metadata = {
  title: {
    default: '万界修行录 | 文字修仙游戏',
    template: '%s | 万界修行录',
  },
  description:
    '万界修行录 - 一款简约的文字修仙游戏。选择你的角色，降临不同世界，开启修行之旅。',
  keywords: ['文字游戏', '修仙游戏', 'RPG', '万界修行录', '文字冒险'],
  openGraph: {
    title: '万界修行录 | 文字修仙游戏',
    description: '选择你的化身，降临万界宇宙，开启属于你的修行传说。',
    siteName: '万界修行录',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_FLICKER_GUARD }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ModInitProvider>
            <GameProvider>{children}</GameProvider>
          </ModInitProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
