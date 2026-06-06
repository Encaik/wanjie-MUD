/**
 * 修炼模块类型定义
 */

import { WorldType, InventoryItem, ActiveEffect, CultivationPath, CharacterStats } from '@/lib/game/types';

export interface CultivationPanelProps {
  onCultivate: () => void;
  onRest: () => void;
  onChallengeGuardian?: () => void;
  onSelectPath?: () => void;
  disabled?: boolean;
  worldType: WorldType;
  inventory: InventoryItem[];
  activeEffects?: ActiveEffect[];
  experience: number;
  overflowExperience: number;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  autoCultivating: boolean;
  onToggleAutoCultivation: () => void;
  luck?: number;
  cultivationPath?: CultivationPath | null;
  pathLevel?: number;
  stats?: CharacterStats;
  onBreakthrough?: (success: boolean) => void;
  onOpenAlchemy?: () => void;
  onOpenForge?: () => void;
  isCrafting?: boolean;
  isForging?: boolean;
}
