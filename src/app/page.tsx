'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { PageLoading } from '@/shared/components/PageLoading';
import { getRouteGuard } from '@/views/game/routeGuard';
import { useHomeGame } from '@/views/home/HomeProvider';
import { StartScreen } from '@/views/home/StartScreen';

export default function HomePage() {
  const router = useRouter();
  const { gameState, startNewGame, importSave } = useHomeGame();
  const redirectedRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);

  // 路由守卫在 useEffect 中执行，避免 SSR/客户端渲染不一致导致的水合不匹配
  // 服务端和客户端首次渲染始终展示 StartScreen，状态恢复后再判断重定向
  useEffect(() => {
    if (redirectedRef.current) return;
    const redirectTo = getRouteGuard('/', gameState);
    if (redirectTo) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [gameState, router]);

  // 正在跳转到世界选择页时显示加载态
  if (isStarting) {
    return <PageLoading message="万界之门开启中..." subtitle="天地法则正在编织" />;
  }

  const handleStart = async () => {
    setIsStarting(true);
    await startNewGame();
    // startNewGame 内部已保存状态到 localStorage 并执行 router.push('/world-select')
  };

  return (
    <StartScreen
      onStart={handleStart}
      onImportSave={importSave}
    />
  );
}
