'use client';

import { CheckCircle2, XCircle, Package } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent } from '@/shared/ui/data-display/card';
import { ActionResult } from '@/core/types';


interface ResultDisplayProps {
  result: ActionResult | null;
  onClose: () => void;
}

export function ResultDisplay({ result, onClose }: ResultDisplayProps) {
  if (!result) return null;

  const isSuccess = result.success !== false && result.victory !== false;

  return (
    <Card className={`border-2 ${isSuccess ? 'border-game-recovery/50' : 'border-game-combat/50'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          {isSuccess ? (
            <CheckCircle2 className="w-6 h-6 text-game-recovery shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-game-combat shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {result.message}
            </div>
          </div>
        </div>

        {/* 突破提示 */}
        {result.breakthroughAttempt && (
          <div className={`text-xs p-3 rounded mb-4 ${result.breakthroughSuccess ? 'bg-game-economy/10' : 'bg-game-combat/10'}`}>
            {result.breakthroughSuccess ? (
              <p className="text-game-economy font-medium">
                恭喜！突破成功，你的境界提升了！
              </p>
            ) : (
              <p className="text-game-combat">
                突破失败，需要更多准备或服用突破丹药。
              </p>
            )}
          </div>
        )}

        {/* 消耗的道具 */}
        {result.itemsCost && result.itemsCost.length > 0 && (
          <div className="text-xs bg-game-combat/10 p-3 rounded mb-4">
            <p className="text-game-combat mb-1">消耗道具：</p>
            <div className="flex flex-wrap gap-1">
              {result.itemsCost.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-game-combat">
                  {item.definition.name} x{item.quantity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 奖励详情 */}
        {result.rewards && (
          <div className="text-xs bg-muted/30 p-3 rounded mb-4 space-y-2">
            {result.rewards.stats && Object.keys(result.rewards.stats).length > 0 && (
              <div>
                <span className="text-muted-foreground">属性变化：</span>
                {Object.entries(result.rewards.stats).map(([key, value]) => (
                  <Badge key={key} variant="outline" className={Number(value) > 0 ? 'text-game-recovery border-game-recovery/50' : 'text-game-combat border-game-combat/50'} style={{marginLeft: '4px'}}>
                    {key} {Number(value) > 0 ? '+' : ''}{value}
                  </Badge>
                ))}
              </div>
            )}
            {result.rewards.items && result.rewards.items.length > 0 && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  获得物品：
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.rewards.items.map((item, idx) => (
                    <Badge key={idx} className="bg-game-cultivation/20 text-game-cultivation">
                      {item.definition.name} x{item.quantity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {result.rewards.experience && (
              <div>
                <Badge className="bg-game-cultivation/20 text-game-cultivation">
                  经验 +{result.rewards.experience}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* 直接的属性变化（旧格式兼容） */}
        {result.statChanges && Object.keys(result.statChanges).length > 0 && !result.rewards?.stats && (
          <div className="text-xs bg-muted/30 p-3 rounded mb-4">
            <div>
              <span className="text-muted-foreground">属性变化：</span>
              {Object.entries(result.statChanges).map(([key, value]) => (
                <Badge key={key} variant="outline" className={Number(value) > 0 ? 'text-game-recovery border-game-recovery/50' : 'text-game-combat border-game-combat/50'} style={{marginLeft: '4px'}}>
                  {key} {Number(value) > 0 ? '+' : ''}{value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onClose}>
          确定
        </Button>
      </CardContent>
    </Card>
  );
}
