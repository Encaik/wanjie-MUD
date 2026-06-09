/**
 * Hook: useWorldRating
 *
 * 提供评分读写和状态管理。
 *
 * @module modules/world-rating/hooks
 */

import { useCallback, useMemo, useState } from 'react';
import { loadRatings, submitRating, getAverageRating } from '../logic/ratingStorage';
import type { WorldRatingsStore, RatingData } from '../types';

export interface UseWorldRatingReturn {
  /** 所有评分数据 */
  ratings: WorldRatingsStore;
  /** 获取指定世界的平均评分 */
  getScore: (worldId: string) => number | undefined;
  /** 提交评分 */
  rate: (worldId: string, score: number, comment?: string) => RatingData;
  /** 重新加载评分 */
  reload: () => void;
}

export function useWorldRating(): UseWorldRatingReturn {
  const [ratings, setRatings] = useState<WorldRatingsStore>(loadRatings);

  const reload = useCallback(() => {
    setRatings(loadRatings());
  }, []);

  const getScore = useCallback(
    (worldId: string) => getAverageRating(worldId),
    [],
  );

  const rate = useCallback(
    (worldId: string, score: number, comment?: string) => {
      const result = submitRating(worldId, score, comment);
      setRatings(loadRatings()); // 重新加载最新数据
      return result;
    },
    [],
  );

  return useMemo(
    () => ({ ratings, getScore, rate, reload }),
    [ratings, getScore, rate, reload],
  );
}
