// Shared game components
export { MysticalBackground } from './MysticalBackground';
export type { BgVariant, BgIntensity } from './MysticalBackground';
export { PageLoading } from './PageLoading';
export { GameHeader } from '@/views/game/layout/GameHeader';
export { MessagePanel } from './MessagePanel';
export { MessageItem } from './MessageItem';
export { ResultDisplay } from './ResultDisplay';
export { CharacterInfo, CharacterInfoInline } from './CharacterInfo';
export { RealmTable } from './RealmTable';
export { RadarChart } from './RadarChart';
export type { RadarAxis, RadarSeries } from './RadarChart';
export { ExperiencePanel } from './ExperiencePanel';
export { AdventureLootPanel } from './AdventureLootPanel';
export { DeveloperPanel } from './DeveloperPanel';
// 战斗结果弹窗已迁移到 battle 目录
export { CardCornerDecorations } from './CardCornerDecorations';
export { BattleResultDialog } from '@/modules/combat/components';
