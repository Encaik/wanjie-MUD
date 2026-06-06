/**
 * 机缘模块类型定义
 */

import { AdventureCell, WorldType, DungeonConfig, ActionResult, BattleState, InventoryItem } from '@/lib/game/types';

export interface AdventurePanelProps {
  grid: AdventureCell[][] | null;
  position: { row: number; col: number } | null;
  config: DungeonConfig | null;
  onStart: () => void;
  onMove: (row: number, col: number) => void;
  onExit: () => void;
  onForceExit?: () => void;
  disabled?: boolean;
  worldType: WorldType;
}
