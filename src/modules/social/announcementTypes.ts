/**
 * 公告系统类型定义
 * 
 * 关键设计原则：
 * 公告内容由【触发玩家】根据自己的世界观组装成静态文本，
 * 发送到服务端后直接广播，服务端不负责内容生成。
 */

import type { WorldType } from '@/shared/lib/types';

// ========== 公告类型 ==========

/** 公告类型 */
export type AnnouncementType =
  | 'ascension'
  | 'boss'
  | 'pvp'
  | 'item'
  | 'synthesis'
  | 'achievement'
  | 'faction'
  | 'discovery'
  | 'system';

/** 公告优先级 */
export type AnnouncementPriority = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** 游戏事件类型（用于触发公告） */
export enum GameEventType {
  ASCENSION_SUCCESS = 'ascension_success',
  ASCENSION_FAILURE = 'ascension_failure',
  DEFEAT_BOSS = 'defeat_boss',
  PVP_VICTORY = 'pvp_victory',
  OBTAIN_LEGENDARY = 'obtain_legendary',
  OBTAIN_MYTHIC = 'obtain_mythic',
  SYNTHESIS_SUCCESS = 'synthesis_success',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  FACTION_JOIN = 'faction_join',
  FACTION_CONTRIBUTE = 'faction_contribute',
  DISCOVERY = 'discovery',
}

// ========== 公告数据结构 ==========

/** 公告数据（静态文本，已由触发玩家组装完成） */
export interface Announcement {
  id: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;

  // 内容（静态文本，由触发玩家根据自己的世界观组装）
  title: string;
  content: string;
  icon: string; // emoji 图标

  // 来源信息
  playerId: string;
  playerName: string;
  worldType: WorldType;

  // 时间
  timestamp: number;
  expiresAt?: number;

  // 显示配置
  displayDuration: number;
  showPopup: boolean;
  showInChat: boolean;
  soundEffect?: string;

  // 状态（客户端使用）
  read: boolean;
}

/** 客户端发送公告请求 */
export interface AnnouncementRequest {
  type: AnnouncementType;
  priority: AnnouncementPriority;

  // 内容（客户端根据自己的世界观组装）
  title: string;
  content: string;
  icon: string; // emoji 图标

  // 来源信息
  playerId: string;
  playerName: string;
  worldType: WorldType;

  // 显示配置
  displayDuration: number;
  showPopup: boolean;
  showInChat: boolean;
  soundEffect?: string;
}

// ========== 触发配置 ==========

/** 公告触发条件函数 */
export type AnnouncementCondition = (event: GameEvent) => boolean;

/** 公告触发配置（客户端使用） */
export interface AnnouncementTriggerConfig {
  type: AnnouncementType;
  priority: AnnouncementPriority;
  cooldown: number; // 冷却时间（毫秒）
  condition?: AnnouncementCondition; // 触发条件（可选）
  template: {
    title: string;
    icon: string;
  };
}

// ========== 游戏事件 ==========

/** 游戏事件（用于触发公告检测） */
export interface GameEvent {
  type: GameEventType;
  playerId: string;
  playerName: string;
  worldType: WorldType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/** 世界观上下文（用于组装公告内容） */
export interface WorldContext {
  realmName?: string;
  itemName?: string;
  bossName?: string;
  achievementName?: string;
}
