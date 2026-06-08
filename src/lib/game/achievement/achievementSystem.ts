/**
 * 成就系统 - 事件驱动 + 配置化实现
 * 订阅游戏事件，根据配置判断成就解锁
 */

import { GameEventType, GameEvent, gameEventManager } from '../events/eventManager';
import { GameStatistics, AchievementStatus } from '../types';

// ============================================
// 配置类型定义
// ============================================

/** 成就条件类型 */
export interface AchievementCondition {
  type: 'once' | 'accumulate' | 'accumulate_unique' | 'compare';
  // accumulate/accumulate_unique
  event?: GameEventType;
  field?: string; // 用于 unique 去重 或 compare 字段名
  target?: number;
  // compare
  operator?: '>=' | '>' | '==' | '<' | '<=';
  value?: any;
}

/** 成就奖励 */
export interface AchievementReward {
  experience?: number;
  stats?: Record<string, number>;
  items?: Array<{ id: string; quantity: number }>;
}

/** 成就配置 */
export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  triggerEvent: GameEventType;
  condition: AchievementCondition;
  rewards: AchievementReward;
  rarity: string;
  hidden?: boolean;
}

/** 成就配置文件结构 */
export interface AchievementsConfigFile {
  achievements: AchievementConfig[];
}

// ============================================
// 成就系统类
// ============================================

/**
 * 成就系统管理器
 * 负责加载配置、订阅事件、判断解锁
 */
export class AchievementSystem {
  private static instance: AchievementSystem | null = null;
  private configs: Map<string, AchievementConfig> = new Map();
  private initialized = false;
  private unsubscribers: (() => void)[] = [];

  private constructor() {}

  static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }

  /**
   * 初始化系统：加载配置并订阅事件
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 加载配置文件
      const response = await fetch('/config/achievements.json');
      const data: AchievementsConfigFile = await response.json();
      
      // 存储配置
      data.achievements.forEach(config => {
        this.configs.set(config.id, config);
      });

      // 订阅所有相关事件
      this.subscribeToEvents();

      this.initialized = true;
      console.log('[AchievementSystem] Initialized with', this.configs.size, 'achievements');
    } catch (error) {
      console.error('[AchievementSystem] Failed to initialize:', error);
    }
  }

  /**
   * 使用内联配置初始化（用于SSR或无需fetch的场景）
   */
  initializeWithConfig(configs: AchievementConfig[]): void {
    if (this.initialized) return;

    configs.forEach(config => {
      this.configs.set(config.id, config);
    });

    this.subscribeToEvents();
    this.initialized = true;
  }

  /**
   * 订阅事件
   */
  private subscribeToEvents(): void {
    // 获取所有需要监听的事件类型
    const eventTypes = new Set<GameEventType>();
    this.configs.forEach(config => {
      eventTypes.add(config.triggerEvent);
    });

    // 订阅每个事件
    eventTypes.forEach(eventType => {
      const unsubscriber = gameEventManager.addListener(eventType, (event) => {
        this.handleEvent(event);
      });
      this.unsubscribers.push(unsubscriber);
    });
  }

  /**
   * 处理事件：检查并解锁成就
   */
  private handleEvent(event: GameEvent): void {
    // 找到所有监听此事件的成就配置
    const relevantConfigs = Array.from(this.configs.values()).filter(
      config => config.triggerEvent === event.type
    );

    // 检查每个成就是否可以解锁
    relevantConfigs.forEach(config => {
      // 成就解锁检查会通过回调通知外部状态管理
      // 这里只是触发检查，实际解锁由外部处理
    });
  }

  /**
   * 检查单个成就是否满足解锁条件
   */
  checkAchievement(
    config: AchievementConfig,
    statistics: GameStatistics,
    event?: GameEvent
  ): { unlocked: boolean; progress: number } {
    const condition = config.condition;

    switch (condition.type) {
      case 'once':
        // 单次事件触发即解锁
        return { unlocked: true, progress: 1 };

      case 'compare':
        // 比较字段值
        if (!condition.field || condition.value === undefined) {
          return { unlocked: false, progress: 0 };
        }
        const fieldValue = (event?.payload as any)?.[condition.field];
        const compareResult = this.compareValue(fieldValue, condition.operator || '>=', condition.value);
        return {
          unlocked: compareResult,
          progress: compareResult ? 1 : 0,
        };

      case 'accumulate':
        // 累计计数
        const currentCount = this.getAccumulatedCount(condition.event!, statistics);
        return {
          unlocked: currentCount >= (condition.target || 1),
          progress: currentCount,
        };

      case 'accumulate_unique':
        // 去重累计
        const uniqueCount = this.getUniqueCount(condition.event!, statistics);
        return {
          unlocked: uniqueCount >= (condition.target || 1),
          progress: uniqueCount,
        };

      default:
        return { unlocked: false, progress: 0 };
    }
  }

  /**
   * 比较值
   */
  private compareValue(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case '>=': return value >= target;
      case '>': return value > target;
      case '==': return value === target;
      case '<': return value < target;
      case '<=': return value <= target;
      default: return false;
    }
  }

  /**
   * 获取累计计数
   */
  private getAccumulatedCount(eventType: GameEventType, statistics: GameStatistics): number {
    switch (eventType) {
      case GameEventType.MONSTER_KILLED:
        return statistics.totalEnemiesKilled;
      case GameEventType.BOSS_KILLED:
        return statistics.totalBossKilled;
      case GameEventType.ELITE_KILLED:
        return statistics.totalEliteKilled;
      case GameEventType.ADVENTURE_COMPLETED:
        return statistics.totalAdventuresCompleted;
      case GameEventType.CULTIVATION_DONE:
        return statistics.totalCultivations;
      case GameEventType.TECHNIQUE_COLLECTED:
        return statistics.totalTechniquesCollected;
      case GameEventType.EQUIPMENT_COLLECTED:
        return statistics.totalEquipmentsCollected;
      case GameEventType.LEGENDARY_OBTAINED:
        return statistics.legendaryItemsObtained;
      case GameEventType.REALM_BREAKTHROUGH:
        return statistics.totalBreakthroughs;
      default:
        return 0;
    }
  }

  /**
   * 获取去重计数
   */
  private getUniqueCount(eventType: GameEventType, statistics: GameStatistics): number {
    switch (eventType) {
      case GameEventType.TECHNIQUE_COLLECTED:
        return statistics.collectedTechniqueNames.length;
      case GameEventType.EQUIPMENT_COLLECTED:
        return statistics.collectedEquipmentNames.length;
      default:
        return 0;
    }
  }

  /**
   * 获取所有成就配置
   */
  getAllConfigs(): AchievementConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 获取单个成就配置
   */
  getConfig(id: string): AchievementConfig | undefined {
    return this.configs.get(id);
  }

  /**
   * 计算所有成就状态
   */
  calculateAllStatuses(
    statistics: GameStatistics,
    unlockedIds: string[],
    claimedIds: string[]
  ): AchievementStatus[] {
    return this.getAllConfigs().map(config => {
      const { unlocked, progress } = this.checkAchievement(config, statistics);
      const alreadyUnlocked = unlockedIds.includes(config.id);
      const claimed = claimedIds.includes(config.id);

      return {
        achievementId: config.id,
        unlocked: alreadyUnlocked || unlocked,
        unlockedAt: alreadyUnlocked ? Date.now() : undefined,
        progress: alreadyUnlocked ? config.condition.target || 1 : progress,
        target: config.condition.target || 1,
        // 扩展信息
        claimed,
        canClaim: (alreadyUnlocked || unlocked) && !claimed,
      } as AchievementStatus & { claimed: boolean; canClaim: boolean };
    });
  }

  /**
   * 销毁系统
   */
  destroy(): void {
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
    this.configs.clear();
    this.initialized = false;
  }
}

// 导出单例
export const achievementSystem = AchievementSystem.getInstance();
