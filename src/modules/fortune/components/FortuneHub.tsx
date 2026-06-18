/**
 * FortuneHub — 机缘大厅
 *
 * 展示所有可用的机缘主题卡片，支持锁定/解锁状态。
 * ≤300 行
 */

'use client';

import { Card, CardContent } from '@/shared/ui/data-display/card';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { getAvailableFortuneTypes } from '../data/fortuneTypeConfig';
import type { FortuneTypeId } from '../types';

interface FortuneHubProps {
  /** 玩家等级 */
  playerLevel: number;
  /** 选择机缘主题回调 */
  onSelect: (fortuneType: FortuneTypeId) => void;
}

/** 难度星星 */
function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  );
}

/** 奖励偏好标签 */
function BonusTags({ bonuses }: { bonuses: Record<string, number> }) {
  const labels: Record<string, string> = {
    spirit_stones: '灵石×2',
    fragments: '碎片×2',
    consumables: '丹药×2',
    materials: '材料×1.5',
    rarity_up: '稀有度+1',
    legendary_rate: '传说×3',
    balanced: '均衡',
    death_penalty: '风险×2',
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(bonuses).map(([key, _val]) => {
        const label = labels[key];
        if (!label || key === 'other' || key === 'death_penalty') return null;
        return (
          <Badge key={key} variant="secondary" className="text-xs">
            {label}
          </Badge>
        );
      })}
    </div>
  );
}

export function FortuneHub({ playerLevel, onSelect }: FortuneHubProps) {
  const availableTypes = getAvailableFortuneTypes(playerLevel);

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">机缘大厅</h2>
        <p className="text-sm text-muted-foreground mt-1">
          选择一处机缘进行探索，不同机缘产出侧重不同
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableTypes.map((config) => (
          <Card
            key={config.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{config.name}</h3>
                    <Stars count={config.difficultyStars} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">
                {config.description}
              </p>

              <BonusTags bonuses={config.rewardBonuses} />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{config.minDepth}-{config.maxDepth}层</span>
                <span>推荐 Lv.{config.minPlayerLevel}+</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => onSelect(config.id)}
              >
                进入机缘
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableTypes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无可用的机缘</p>
          <p className="text-sm mt-1">提升等级后解锁更多机缘主题</p>
        </div>
      )}
    </div>
  );
}
