/**
 * 客户端公告配置
 * 
 * 定义哪些游戏事件会触发全服公告，以及公告的模板配置
 */

import { AnnouncementEventType, type AnnouncementType, type AnnouncementPriority, type AnnouncementTriggerConfig, type AnnouncementGameEvent } from '@/modules/social/announcementTypes';

/**
 * 公告触发规则配置
 * 
 * 规则说明：
 * - type: 公告类型
 * - priority: 公告优先级
 * - cooldown: 冷却时间（毫秒），同类型/同玩家需要间隔多久才能再次触发
 * - condition: 触发条件（可选，用于更细粒度的控制）
 */
export const ANNOUNCEMENT_TRIGGERS: Record<AnnouncementEventType, AnnouncementTriggerConfig> = {
  // ========== 飞升相关 ==========
  
  [AnnouncementEventType.ASCENSION_SUCCESS]: {
    type: 'ascension',
    priority: 'legendary',
    cooldown: 0, // 飞升公告无冷却
    template: {
      title: '飞升成功',
      icon: '🌅',
    },
  },
  
  [AnnouncementEventType.ASCENSION_FAILURE]: {
    type: 'ascension',
    priority: 'epic',
    cooldown: 60000, // 1分钟冷却
    template: {
      title: '飞升失败',
      icon: '💥',
    },
  },
  
  // ========== 战斗相关 ==========
  
  [AnnouncementEventType.DEFEAT_BOSS]: {
    type: 'boss',
    priority: 'epic',
    cooldown: 300000, // 5分钟冷却
    condition: (event: AnnouncementGameEvent) => {
      // 只有击败高等级 Boss 才公告
      return (event.data?.bossLevel as number) >= 50;
    },
    template: {
      title: 'Boss 击杀',
      icon: '⚔️',
    },
  },
  
  [AnnouncementEventType.PVP_VICTORY]: {
    type: 'pvp',
    priority: 'rare',
    cooldown: 300000, // 5分钟冷却
    condition: (event: AnnouncementGameEvent) => {
      // 只有击败高战力玩家才公告
      return (event.data?.enemyCombatPower as number) >= 100000;
    },
    template: {
      title: 'PVP 胜利',
      icon: '🏆',
    },
  },
  
  // ========== 物品相关 ==========
  
  [AnnouncementEventType.OBTAIN_LEGENDARY]: {
    type: 'item',
    priority: 'legendary',
    cooldown: 0, // 传说物品无冷却
    template: {
      title: '获得传说物品',
      icon: '✨',
    },
  },
  
  [AnnouncementEventType.OBTAIN_MYTHIC]: {
    type: 'item',
    priority: 'mythic',
    cooldown: 0, // 神话物品无冷却
    template: {
      title: '获得神话物品',
      icon: '🌟',
    },
  },
  
  [AnnouncementEventType.SYNTHESIS_SUCCESS]: {
    type: 'synthesis',
    priority: 'rare',
    cooldown: 180000, // 3分钟冷却
    condition: (event: AnnouncementGameEvent) => {
      // 只有合成史诗及以上品质才公告
      return ['epic', 'legendary', 'mythic'].includes(event.data?.itemQuality as string);
    },
    template: {
      title: '合成成功',
      icon: '🔨',
    },
  },
  
  // ========== 成就相关 ==========
  
  [AnnouncementEventType.ACHIEVEMENT_UNLOCK]: {
    type: 'achievement',
    priority: 'rare',
    cooldown: 60000, // 1分钟冷却
    condition: (event: AnnouncementGameEvent) => {
      // 只有解锁稀有及以上成就才公告
      return event.data?.achievementRarity !== 'common';
    },
    template: {
      title: '成就解锁',
      icon: '🏅',
    },
  },
  
  // ========== 势力相关 ==========
  
  [AnnouncementEventType.FACTION_JOIN]: {
    type: 'faction',
    priority: 'common',
    cooldown: 0,
    template: {
      title: '加入势力',
      icon: '🏛️',
    },
  },
  
  [AnnouncementEventType.FACTION_CONTRIBUTE]: {
    type: 'faction',
    priority: 'common',
    cooldown: 600000, // 10分钟冷却
    condition: (event: AnnouncementGameEvent) => {
      // 只有高贡献才公告
      return (event.data?.contribution as number) >= 1000;
    },
    template: {
      title: '势力贡献',
      icon: '💎',
    },
  },
  
  // ========== 其他 ==========
  
  [AnnouncementEventType.DISCOVERY]: {
    type: 'discovery',
    priority: 'rare',
    cooldown: 300000, // 5分钟冷却
    template: {
      title: '发现秘境',
      icon: '🗺️',
    },
  },
};

/**
 * 公告类型配置
 */
export const ANNOUNCEMENT_TYPE_CONFIG: Record<AnnouncementType, {
  color: string;
  bgClass: string;
  textClass: string;
}> = {
  ascension: {
    color: '#FFD700',
    bgClass: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
    textClass: 'text-yellow-400',
  },
  boss: {
    color: '#FF4500',
    bgClass: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
    textClass: 'text-red-400',
  },
  pvp: {
    color: '#9400D3',
    bgClass: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
    textClass: 'text-purple-400',
  },
  item: {
    color: '#00CED1',
    bgClass: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
    textClass: 'text-cyan-400',
  },
  synthesis: {
    color: '#32CD32',
    bgClass: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
    textClass: 'text-green-400',
  },
  achievement: {
    color: '#FFD700',
    bgClass: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20',
    textClass: 'text-amber-400',
  },
  faction: {
    color: '#4169E1',
    bgClass: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
    textClass: 'text-blue-400',
  },
  discovery: {
    color: '#20B2AA',
    bgClass: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20',
    textClass: 'text-teal-400',
  },
  system: {
    color: '#808080',
    bgClass: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
    textClass: 'text-gray-400',
  },
};

/**
 * 公告优先级配置
 */
export const ANNOUNCEMENT_PRIORITY_CONFIG: Record<AnnouncementPriority, {
  duration: number; // 显示时长（毫秒）
  animation: 'none' | 'slide' | 'pulse' | 'glow';
}> = {
  common: {
    duration: 5000,
    animation: 'slide',
  },
  rare: {
    duration: 7000,
    animation: 'slide',
  },
  epic: {
    duration: 10000,
    animation: 'pulse',
  },
  legendary: {
    duration: 15000,
    animation: 'glow',
  },
  mythic: {
    duration: 20000,
    animation: 'glow',
  },
};

/**
 * 检查事件是否应该触发公告
 */
export function shouldTriggerAnnouncement(event: AnnouncementGameEvent): boolean {
  const config = ANNOUNCEMENT_TRIGGERS[event.type];
  if (!config) return false;
  
  // 检查条件
  if (config.condition && !config.condition(event)) {
    return false;
  }
  
  return true;
}

/**
 * 获取公告配置
 */
export function getAnnouncementConfig(eventType: AnnouncementEventType): AnnouncementTriggerConfig | undefined {
  return ANNOUNCEMENT_TRIGGERS[eventType];
}
