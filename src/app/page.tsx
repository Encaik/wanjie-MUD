'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useHomeGame } from '@/views/home/HomeProvider';
import { getRouteGuard } from '@/views/game/routeGuard';
import { StartScreen } from '@/views/home/StartScreen';
import { PageLoading } from '@/shared/components/PageLoading';

export default function HomePage() {
  const router = useRouter();
  const { gameState, startNewGame, importSave } = useHomeGame();
  const redirectedRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);

  // 同步计算重定向目标，在 useEffect 中执行跳转（渲染 null 避免闪烁）
  const redirectTo = getRouteGuard('/', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // 需要重定向时不渲染页面内容
  if (redirectTo) return null;

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
