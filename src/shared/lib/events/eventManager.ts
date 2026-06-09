/**
 * 事件管理器 - 事件驱动架构核心
 * 单例模式，管理游戏内所有事件的发布和订阅
 */

// ============================================
// 事件类型定义
// ============================================

/** 事件类型枚举 */
export enum GameEventType {
  // 战斗相关
  MONSTER_KILLED = 'monster_killed',           // 击杀怪物
  BOSS_KILLED = 'boss_killed',                 // 击杀Boss
  ELITE_KILLED = 'elite_killed',               // 击杀精英

  // 收集相关
  ITEM_COLLECTED = 'item_collected',           // 获得道具
  TECHNIQUE_COLLECTED = 'technique_collected', // 获得功法
  EQUIPMENT_COLLECTED = 'equipment_collected', // 获得装备

  // 进度相关
  LEVEL_UP = 'level_up',                       // 等级提升
  REALM_BREAKTHROUGH = 'realm_breakthrough',   // 境界突破
  ADVENTURE_COMPLETED = 'adventure_completed', // 完成秘境
  CULTIVATION_DONE = 'cultivation_done',       // 完成修炼

  // 特殊事件
  LEGENDARY_OBTAINED = 'legendary_obtained',   // 获得传说品质物品
  FULL_EQUIPPED = 'full_equipped',             // 全身装备
  TECHNIQUE_MAX_LEVEL = 'technique_max_level', // 功法满级
  EQUIPMENT_MAX_LEVEL = 'equipment_max_level', // 装备满级

  // 世界/主题相关
  WORLD_CHANGED = 'world_changed',             // 世界切换
}

/** 事件数据类型映射 */
export interface EventPayloadMap {
  [GameEventType.MONSTER_KILLED]: {
    enemyName: string;
    enemyTier: 'normal' | 'elite' | 'miniboss' | 'boss';
    enemyLevel: number;
  };
  [GameEventType.BOSS_KILLED]: {
    bossName: string;
    bossLevel: number;
  };
  [GameEventType.ELITE_KILLED]: {
    eliteName: string;
    eliteLevel: number;
  };
  [GameEventType.ITEM_COLLECTED]: {
    itemId: string;
    itemName: string;
    itemType: string;
    rarity: string;
  };
  [GameEventType.TECHNIQUE_COLLECTED]: {
    techniqueId: string;
    techniqueName: string;
    techniqueType: 'attack' | 'defense';
    rarity: string;
    level: number;
  };
  [GameEventType.EQUIPMENT_COLLECTED]: {
    equipmentId: string;
    equipmentName: string;
    slot: string;
    rarity: string;
    level: number;
  };
  [GameEventType.LEVEL_UP]: {
    oldLevel: number;
    newLevel: number;
  };
  [GameEventType.REALM_BREAKTHROUGH]: {
    oldRealm: string;
    newRealm: string;
  };
  [GameEventType.ADVENTURE_COMPLETED]: {
    dungeonName: string;
    difficulty: string;
    rewards: any;
  };
  [GameEventType.CULTIVATION_DONE]: {
    statGains: Record<string, number>;
    breakthroughAttempt: boolean;
    breakthroughSuccess: boolean;
  };
  [GameEventType.LEGENDARY_OBTAINED]: {
    itemType: 'technique' | 'equipment' | 'item';
    itemName: string;
  };
  [GameEventType.FULL_EQUIPPED]: {
    equippedSlots: string[];
  };
  [GameEventType.TECHNIQUE_MAX_LEVEL]: {
    techniqueId: string;
    techniqueName: string;
  };
  [GameEventType.EQUIPMENT_MAX_LEVEL]: {
    equipmentId: string;
    equipmentName: string;
  };
  [GameEventType.WORLD_CHANGED]: {
    worldType: import('@/shared/lib/types').WorldType;
    previousWorldType?: import('@/shared/lib/types').WorldType;
  };
}

/** 通用事件数据类型 */
export type GameEvent<T extends GameEventType = GameEventType> = {
  type: T;
  timestamp: number;
  payload: EventPayloadMap[T];
};

/** 事件监听器类型 */
export type EventListener<T extends GameEventType = GameEventType> = (
  event: GameEvent<T>
) => void;

// ============================================
// 事件管理器
// ============================================

/**
 * 游戏事件管理器（单例）
 * 负责事件的发布、订阅和管理
 */
class EventManager {
  private static instance: EventManager | null = null;
  private listeners: Map<GameEventType, Set<EventListener>> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize = 100;

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param listener 监听器函数
   * @returns 取消订阅函数
   */
  addListener<T extends GameEventType>(
    eventType: T,
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener as EventListener);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(eventType)?.delete(listener as EventListener);
    };
  }

  /**
   * 批量订阅多个事件
   * @param configs 事件配置数组
   * @returns 取消所有订阅的函数
   */
  addListeners(
    configs: Array<{ event: GameEventType; listener: EventListener }>
  ): () => void {
    const unsubscribers = configs.map(({ event, listener }) =>
      this.addListener(event, listener)
    );
    return () => unsubscribers.forEach(fn => fn());
  }

  /**
   * 触发事件
   * @param eventType 事件类型
   * @param payload 事件数据
   */
  triggerEvent<T extends GameEventType>(
    eventType: T,
    payload: EventPayloadMap[T]
  ): void {
    const event: GameEvent<T> = {
      type: eventType,
      timestamp: Date.now(),
      payload,
    };

    // 记录事件历史
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 通知所有监听器
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[EventManager] Listener error for ${eventType}:`, error);
        }
      });
    }
  }

  /** 获取事件历史 */
  getEventHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  /** 清空事件历史 */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /** 移除某事件类型的所有监听器 */
  removeAllListeners(eventType?: GameEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /** 获取某事件类型的监听器数量 */
  getListenerCount(eventType: GameEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

// 导出单例实例
export const gameEventManager = EventManager.getInstance();

// 导出便捷方法
export const triggerEvent = gameEventManager.triggerEvent.bind(gameEventManager);
export const addListener = gameEventManager.addListener.bind(gameEventManager);
