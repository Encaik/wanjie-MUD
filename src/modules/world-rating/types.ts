/**
 * 世界评分系统类型定义
 *
 * @module modules/world-rating
 */

import type { RatingData, WorldRatingsMap } from '@/core/world/types';

/** 评分存储（key: worldId, value: RatingData） */
export type WorldRatingsStore = WorldRatingsMap;

/** localStorage 存储键 */
export const WORLD_RATINGS_KEY = 'world-ratings';

export type { RatingData };
