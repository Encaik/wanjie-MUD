/**
 * ratingStorage — 世界评分 localStorage 持久化逻辑
 *
 * 纯函数，不依赖 React 或浏览器 API（localStorage 通过参数注入或内部调用）。
 *
 * @module modules/world-rating/logic
 */

import type { RatingData, WorldRatingsStore } from '../types';
import { WORLD_RATINGS_KEY } from '../types';

/** 从 localStorage 读取评分存储 */
export function loadRatings(): WorldRatingsStore {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WORLD_RATINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as WorldRatingsStore;
  } catch {
    return {};
  }
}

/** 将评分存储写入 localStorage */
export function saveRatings(store: WorldRatingsStore): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(WORLD_RATINGS_KEY, JSON.stringify(store));
  } catch {
    console.error('[WorldRating] 保存评分数据失败');
  }
}

/** 获取指定世界的评分数据 */
export function getRating(worldId: string): RatingData | undefined {
  const store = loadRatings();
  return store[worldId];
}

/** 获取指定世界的平均评分 */
export function getAverageRating(worldId: string): number | undefined {
  const rating = getRating(worldId);
  if (!rating || rating.ratingCount === 0) return undefined;
  return rating.totalScore / rating.ratingCount;
}

/** 提交评分（追加累加） */
export function submitRating(worldId: string, score: number, comment?: string): RatingData {
  const store = loadRatings();
  const existing = store[worldId];

  const updated: RatingData = existing
    ? {
        totalScore: existing.totalScore + score,
        ratingCount: existing.ratingCount + 1,
        lastRated: Date.now(),
        comments: comment
          ? [...(existing.comments ?? []), comment]
          : existing.comments,
      }
    : {
        totalScore: score,
        ratingCount: 1,
        lastRated: Date.now(),
        comments: comment ? [comment] : undefined,
      };

  store[worldId] = updated;
  saveRatings(store);
  return updated;
}

/** 获取所有已评分世界的 ID 列表 */
export function getRatedWorldIds(): string[] {
  const store = loadRatings();
  return Object.keys(store);
}

/** 移除指定世界的评分（用于测试或管理） */
export function removeRating(worldId: string): void {
  const store = loadRatings();
  delete store[worldId];
  saveRatings(store);
}
