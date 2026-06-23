/**
 * FortunePage — 机缘页面
 *
 * 替换旧 AdventurePage。组合 FortuneHub / FortuneMapView / 过渡弹窗 / 结算面板。
 */

'use client';

import {
  FortuneHub,
  FortuneMapView,
  FloorTransition,
  FortuneResult,
  FortuneBattleDialog,
} from '@/modules/fortune/components';
import { useFortune } from '@/modules/fortune/hooks/useFortune';
import type { FortuneTypeId } from '@/modules/fortune/types';

interface FortunePageProps {
  /** fortune slice */
  fortuneSlice: ReturnType<typeof useFortune>['slice'];
  /** fortune hook 返回的全部方法和状态 */
  fortune: ReturnType<typeof useFortune>;
}

export function FortunePage({ fortuneSlice, fortune }: FortunePageProps) {
  const { phase } = fortuneSlice;

  // 机缘大厅
  if (phase === 'hub') {
    const handleSelect = (typeId: FortuneTypeId) => {
      fortune.startSession(typeId);
    };
    return <FortuneHub playerLevel={1} onSelect={handleSelect} />;
  }

  // 探索中
  if (phase === 'exploring' && fortuneSlice.session) {
    const session = fortuneSlice.session;

    return (
      <>
        <FortuneMapView
          session={session}
          visibleCells={fortune.visibleCells}
          hints={fortune.directionHints}
          senseScore={fortune.senseLevel * 20}
          staminaText={fortune.staminaStatus?.message || ''}
          staminaLevel={fortune.staminaStatus?.status || 'ok'}
          onMove={fortune.moveTo}
          isExitPosition={(row, col) =>
            row === session.currentMap.floorExit.row &&
            col === session.currentMap.floorExit.col
          }
          onReachExit={fortune.reachExit}
          onExit={fortune.retreat}
        />
        {fortuneSlice.pendingBattle && (
          <FortuneBattleDialog
            battle={fortuneSlice.pendingBattle}
            onVictory={() => fortune.handleBattleEnd(true, false)}
            onFlee={() => fortune.handleBattleEnd(false, true)}
          />
        )}
      </>
    );
  }

  // 楼层过渡
  if (phase === 'floor_transition') {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <FloorTransition
          open={true}
          data={fortuneSlice.floorTransition}
          onRetreat={fortune.retreat}
          onContinue={fortune.continueDeeper}
        />
      </div>
    );
  }

  // 结算结果
  if (phase === 'result') {
    return (
      <FortuneResult
        result={fortuneSlice.settlement}
        onBackToHub={fortune.returnToHub}
      />
    );
  }

  // 默认：大厅
  return <FortuneHub playerLevel={1} onSelect={(id) => fortune.startSession(id)} />;
}
