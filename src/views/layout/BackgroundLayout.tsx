'use client';

import { useMemo } from 'react';

import { usePathname } from 'next/navigation';

import { MysticalBackground } from '@/shared/components';
import type { BgVariant, BgIntensity } from '@/shared/components/MysticalBackground';
import { useResolutionScale } from '@/shared/utils/resolution-scale';

// ============================================
// 路由 → 背景变体映射
// ============================================

/** 路由路径到背景变体的白名单映射 */
const ROUTE_VARIANT_MAP: Record<string, BgVariant> = {
  '/': 'runes',
  '/world-select': 'stars',
  '/character-select': 'destiny',
  '/backstory': 'fated',
  '/game': 'runes',
};

/** 需要 subtle 强度的路由 */
const SUBTLE_ROUTES = new Set(['/game']);

/**
 * 将路由路径映射为背景变体
 *
 * 未匹配路径默认返回 `runes`（首页氛围）。
 */
function pathnameToVariant(pathname: string): BgVariant {
  return ROUTE_VARIANT_MAP[pathname] ?? 'runes';
}

/**
 * 判断当前路由是否需要 subtle 强度
 */
function pathnameNeedsSubtle(pathname: string): boolean {
  return SUBTLE_ROUTES.has(pathname);
}

// ============================================
// 组件
// ============================================

/**
 * 全局背景布局层
 *
 * 在 `app/layout.tsx` 中包裹 `children`，统一渲染 `MysticalBackground`。
 * 背景组件在路由切换时保持挂载（不卸载），动画不重启。
 *
 * 通过 `usePathname()` 感知当前路由，自动切换背景变体；
 * 通过 `useResolutionScale()` 获取缩放系数，适配不同分辨率。
 *
 * @example
 * // app/layout.tsx
 * <GameProvider>
 *   <BackgroundLayout>{children}</BackgroundLayout>
 * </GameProvider>
 */
export function BackgroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scaleFactor = useResolutionScale();

  const variant = useMemo(() => pathnameToVariant(pathname), [pathname]);
  const intensity: BgIntensity = pathnameNeedsSubtle(pathname) ? 'subtle' : 'full';
  const isHomePage = pathname === '/';

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <MysticalBackground
        variant={variant}
        intensity={intensity}
        scaleFactor={scaleFactor}
        minimal={isHomePage}
      />
      {children}
    </div>
  );
}
