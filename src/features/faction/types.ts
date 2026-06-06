/**
 * 势力模块类型定义
 */

import { WorldType, WorldFaction, FactionProgress } from '@/lib/game/types';

export interface FactionPanelProps {
  worldType: WorldType;
  worldFactions: WorldFaction[];
  currentFactionId: string | null;
  factionProgress?: FactionProgress;
  contribution?: number;
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: () => void;
  onAcceptTask?: (taskId: string) => { success: boolean; message: string };
  onSubmitTask?: (taskId: string) => { success: boolean; message: string };
  onRefreshTasks?: () => { success: boolean; message: string };
  onClaimDailySalary?: () => { success: boolean; amount: number };
  spiritStoneCount?: number;
  onDonate?: (amount: number) => { success: boolean; message: string };
}
