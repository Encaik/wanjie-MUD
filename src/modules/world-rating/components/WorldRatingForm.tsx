/**
 * 组件：WorldRatingForm
 *
 * 五星评分交互组件。接收 worldId 和 worldName 作为 props，通过回调通知评分完成或跳过。
 *
 * @module modules/world-rating/components
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/actions/button';

interface WorldRatingFormProps {
  /** 世界 ID */
  worldId: string;
  /** 世界名称 */
  worldName: string;
  /** 评分完成回调 */
  onRated: (score: number, comment?: string) => void;
  /** 跳过评分回调 */
  onSkip: () => void;
}

/** 星级对应的标签文字 */
const STAR_LABELS = ['很差', '较差', '一般', '不错', '很棒'];

export function WorldRatingForm({ worldId: _worldId, worldName, onRated, onSkip }: WorldRatingFormProps) {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [selectedStar, setSelectedStar] = useState<number>(0);

  const handleStarClick = useCallback((star: number) => {
    setSelectedStar(star);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedStar > 0) {
      onRated(selectedStar);
    }
  }, [selectedStar, onRated]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        为世界「{worldName}」评分
      </p>
      <div className="flex gap-1" role="radiogroup" aria-label="评分星级">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selectedStar === star}
            aria-label={`${star}星`}
            className="text-2xl transition-transform hover:scale-110 focus:outline-none"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
          >
            {star <= (hoveredStar || selectedStar) ? '★' : '☆'}
          </button>
        ))}
      </div>
      {(hoveredStar || selectedStar) > 0 && (
        <span className="text-xs text-muted-foreground">
          {STAR_LABELS[(hoveredStar || selectedStar) - 1]}
        </span>
      )}
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSkip}
        >
          跳过
        </Button>
        <Button
          size="sm"
          disabled={selectedStar === 0}
          onClick={handleSubmit}
        >
          提交评分
        </Button>
      </div>
    </div>
  );
}
