/** Barrel export for world-rating module */
export { useWorldRating } from './hooks/useWorldRating';
export { WorldRatingForm } from './components/WorldRatingForm';
export { loadRatings, saveRatings, getRating, getAverageRating, submitRating, getRatedWorldIds, removeRating } from './logic/ratingStorage';
export type { RatingData, WorldRatingsStore } from './types';
export { WORLD_RATINGS_KEY } from './types';
export type { UseWorldRatingReturn } from './hooks/useWorldRating';
