/**
 * 图鉴系统 - 事件驱动 + 配置化实现
 * 管理收集物和羁绊加成
 */

import { GameEventType, GameEvent, gameEventManager } from '@/shared/lib/events/eventManager';
import { Technique, Equipment, ItemRarity } from '@/shared/lib/types';

// ============================================
// 配置类型定义
// ============================================

/** 羁绊等级配置 */
export interface BondLevelConfig {
  required: number;
  stats: Record<string, number>;
}

/** 羁绊配置 */
export interface BondConfig {
  id: string;
  name: string;
  type: 'element' | 'weapon';
  description: string;
  keywords: string[];
  levels: BondLevelConfig[];
}

/** 图鉴配置文件结构 */
export interface CollectionConfigFile {
  bonds: BondConfig[];
  rarityBonuses: Record<string, { mult: number }>;
}

// ============================================
// 图鉴系统类
// ============================================

/**
 * 图鉴系统管理器
 * 管理收集物和羁绊激活
 */
export class CollectionSystem {
  private static instance: CollectionSystem | null = null;
  private bondConfigs: Map<string, BondConfig> = new Map();
  private initialized = false;
  private unsubscribers: (() => void)[] = [];
  
  // 收集记录（内存缓存）
  private collectedTechniques: Map<string, Technique> = new Map();
  private collectedEquipments: Map<string, Equipment> = new Map();

  private constructor() {}

  static getInstance(): CollectionSystem {
    if (!CollectionSystem.instance) {
      CollectionSystem.instance = new CollectionSystem();
    }
    return CollectionSystem.instance;
  }

  /**
   * 初始化系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch('/config/collection.json');
      const data: CollectionConfigFile = await response.json();
      
      data.bonds.forEach(config => {
        this.bondConfigs.set(config.id, config);
      });

      this.subscribeToEvents();
      this.initialized = true;
      console.log('[CollectionSystem] Initialized with', this.bondConfigs.size, 'bonds');
    } catch (error) {
      console.error('[CollectionSystem] Failed to initialize:', error);
    }
  }

  /**
   * 使用内联配置初始化
   */
  initializeWithConfig(bonds: BondConfig[]): void {
    if (this.initialized) return;

    bonds.forEach(config => {
      this.bondConfigs.set(config.id, config);
    });

    this.subscribeToEvents();
    this.initialized = true;
  }

  /**
   * 订阅收集事件
   */
  private subscribeToEvents(): void {
    // 监听功法收集
    const unsub1 = gameEventManager.addListener(
      GameEventType.TECHNIQUE_COLLECTED,
      (event) => this.handleTechniqueCollected(event)
    );
    this.unsubscribers.push(unsub1);

    // 监听装备收集
    const unsub2 = gameEventManager.addListener(
      GameEventType.EQUIPMENT_COLLECTED,
      (event) => this.handleEquipmentCollected(event)
    );
    this.unsubscribers.push(unsub2);
  }

  /**
   * 处理功法收集事件
   */
  private handleTechniqueCollected(event: GameEvent<GameEventType.TECHNIQUE_COLLECTED>): void {
    const { techniqueId, techniqueName } = event.payload;
    // 存储收集记录（实际应用中会更新到全局状态）
    console.log('[CollectionSystem] Technique collected:', techniqueName);
  }

  /**
   * 处理装备收集事件
   */
  private handleEquipmentCollected(event: GameEvent<GameEventType.EQUIPMENT_COLLECTED>): void {
    const { equipmentId, equipmentName } = event.payload;
    console.log('[CollectionSystem] Equipment collected:', equipmentName);
  }

  /**
   * 计算羁绊收集数量
   */
  calculateBondCount(
    bond: BondConfig,
    techniqueNames: string[],
    equipmentNames: string[]
  ): number {
    let count = 0;

    // 检查功法
    techniqueNames.forEach(name => {
      if (bond.keywords.some(kw => name.includes(kw))) {
        count++;
      }
    });

    // 检查装备
    equipmentNames.forEach(name => {
      if (bond.keywords.some(kw => name.includes(kw))) {
        count++;
      }
    });

    return count;
  }

  /**
   * 获取羁绊当前等级
   */
  getBondLevel(bond: BondConfig, collectedCount: number): number {
    for (let i = bond.levels.length - 1; i >= 0; i--) {
      if (collectedCount >= bond.levels[i].required) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * 获取羁绊当前加成
   */
  getBondBonus(
    bond: BondConfig,
    collectedCount: number
  ): Record<string, number> {
    const level = this.getBondLevel(bond, collectedCount);
    if (level === 0) return {};

    const levelConfig = bond.levels[level - 1];
    return { ...levelConfig.stats };
  }

  /**
   * 计算所有羁绊状态
   */
  calculateAllBondStatuses(
    techniqueNames: string[],
    equipmentNames: string[]
  ): Array<{
    bondId: string;
    bondName: string;
    bondType: string;
    collectedCount: number;
    level: number;
    bonus: Record<string, number>;
    nextRequired: number | null;
  }> {
    return Array.from(this.bondConfigs.values()).map(bond => {
      const count = this.calculateBondCount(bond, techniqueNames, equipmentNames);
      const level = this.getBondLevel(bond, count);
      const bonus = this.getBondBonus(bond, count);
      
      // 下一级所需数量
      let nextRequired: number | null = null;
      if (level < bond.levels.length) {
        nextRequired = bond.levels[level].required;
      }

      return {
        bondId: bond.id,
        bondName: bond.name,
        bondType: bond.type,
        collectedCount: count,
        level,
        bonus,
        nextRequired,
      };
    });
  }

  /**
   * 获取所有羁绊配置
   */
  getAllBonds(): BondConfig[] {
    return Array.from(this.bondConfigs.values());
  }

  /**
   * 按类型获取羁绊
   */
  getBondsByType(type: 'element' | 'weapon'): BondConfig[] {
    return this.getAllBonds().filter(bond => bond.type === type);
  }

  /**
   * 销毁系统
   */
  destroy(): void {
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
    this.bondConfigs.clear();
    this.collectedTechniques.clear();
    this.collectedEquipments.clear();
    this.initialized = false;
  }
}

// 导出单例
export const collectionSystem = CollectionSystem.getInstance();
