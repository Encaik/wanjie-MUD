'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useGame, getRouteGuard } from '@/views/game/useGameState';
import { StartScreen } from '@/views/home/StartScreen';

export default function HomePage() {
  const router = useRouter();
  const { gameState, startNewGame, importSave } = useGame();
  const redirectedRef = useRef(false);

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

  const handleStart = async () => {
    await startNewGame();
    router.push('/world-select');
  };

  return (
    <StartScreen
      onStart={handleStart}
      onImportSave={importSave}
    />
  );
}
