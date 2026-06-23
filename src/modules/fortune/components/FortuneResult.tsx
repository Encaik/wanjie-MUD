/**
 * FortuneResult — 机缘结算面板
 *
 * 展示撤退/死亡/通关后的最终收获。
 * ≤200 行
 */

'use client';

import { Button } from '@/shared/ui/actions/button';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';

import type { SettlementResult } from '../types';

interface FortuneResultProps {
  /** 结算结果 */
  result: SettlementResult | null;
  /** 回到大厅回调 */
  onBackToHub: () => void;
}

function SettlementIcon({ type }: { type: SettlementResult['type'] }) {
  switch (type) {
    case 'retreat': return '🏃';
    case 'death': return '💀';
    case 'completion': return '🏆';
  }
}

function SettlementTitle({ type }: { type: SettlementResult['type'] }) {
  switch (type) {
    case 'retreat': return '安全撤退';
    case 'death': return '战斗失败';
    case 'completion': return '机缘通关！';
  }
}

function SettlementColor({ type }: { type: SettlementResult['type'] }) {
  switch (type) {
    case 'retreat': return 'border-yellow-500/30';
    case 'death': return 'border-red-500/30';
    case 'completion': return 'border-primary/50';
  }
}

export function FortuneResult({ result, onBackToHub }: FortuneResultProps) {
  if (!result) return null;

  return (
    <div className="flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${SettlementColor({ type: result.type })}`}>
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">
            {SettlementIcon({ type: result.type })}
          </div>
          <CardTitle>{SettlementTitle({ type: result.type })}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {result.summary}
          </p>

          {/* 收获详单 */}
          <div className="space-y-2 p-3 bg-muted/30 rounded">
            <div className="flex justify-between text-sm">
              <span>灵石</span>
              <span className="font-semibold text-yellow-400">
                +{result.finalLoot.spiritStones}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>经验</span>
              <span className="font-semibold text-blue-400">
                +{result.finalLoot.experience}
              </span>
            </div>
            {result.finalLoot.items.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>物品</span>
                <span>{result.finalLoot.items.length} 件</span>
              </div>
            )}
            {result.finalLoot.fragments.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm">碎片</span>
                {result.finalLoot.fragments.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs ml-2">
                    {f.sourceName} ×{f.count}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 解锁信息 */}
          {result.unlockInfo && (
            <div className="p-2 bg-primary/10 rounded text-sm text-center">
              🔓 {result.unlockInfo}
            </div>
          )}

          <Button onClick={onBackToHub} className="w-full">
            返回机缘大厅
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
