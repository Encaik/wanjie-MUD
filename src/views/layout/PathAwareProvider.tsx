/**
 * PathAwareProvider — 路由感知的 Provider 选择器
 *
 * 根据当前路由决定使用轻量 HomeProvider（首页）或完整 GameStoreProvider（其他页面）。
 * 首页不加载 @/modules/ 游戏逻辑，减少初始 JS bundle。
 */

'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

import { ThemeProvider } from '@/modules/theme';
import { ModInitProvider } from '@/modules/mod/components/ModInitProvider';
import { HomeProvider } from '@/views/home/HomeProvider';
import { PageLoading } from '@/shared/components/PageLoading';

const GameStoreProviderLazy = dynamic(
  () =>
    import('@/views/game/GameStore').then((m) => ({
      default: m.GameStoreProvider,
    })),
  {
    ssr: false,
    loading: () => <PageLoading />,
  },
);

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
            <GameStoreProviderLazy>{children}</GameStoreProviderLazy>
          </Suspense>
        )}
      </ModInitProvider>
    </ThemeProvider>
  );
}
