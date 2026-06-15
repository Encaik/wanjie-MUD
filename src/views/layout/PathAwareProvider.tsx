/**
 * PathAwareProvider — 路由感知的 Provider 选择器
 *
 * 根据当前路由决定使用轻量 HomeProvider（首页）或完整 GameProvider（其他页面）。
 * 首页不加载 @/modules/ 游戏逻辑，减少初始 JS bundle 约 80%。
 */

'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

import { ThemeProvider } from '@/modules/theme';
import { ModInitProvider } from '@/modules/mod/components/ModInitProvider';
import { HomeProvider } from '@/views/home/HomeProvider';
import { PageLoading } from '@/shared/components/PageLoading';

// ============================================
// 懒加载完整 GameProvider（仅非首页路由需要）
// ============================================

const GameProviderLazy = dynamic(
  () =>
    import('@/views/game/useGameState').then((m) => ({
      default: m.GameProvider,
    })),
  {
    ssr: false,
    loading: () => <PageLoading />,
  },
);

// ============================================
// 组件
// ============================================

/**
 * 路由感知 Provider
 *
 * - 首页 `/` → HomeProvider（轻量，不加载游戏引擎）
 * - 其他路由 → GameProviderLazy（完整游戏状态管理）
 */
export function PathAwareProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <ThemeProvider>
      <ModInitProvider>
        {isHomePage ? (
          <HomeProvider>{children}</HomeProvider>
        ) : (
          <Suspense fallback={<PageLoading />}>
            <GameProviderLazy>{children}</GameProviderLazy>
          </Suspense>
        )}
      </ModInitProvider>
    </ThemeProvider>
  );
}
