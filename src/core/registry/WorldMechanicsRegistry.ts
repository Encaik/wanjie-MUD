/**
 * 世界机制注册表（WorldMechanicsRegistry）
 *
 * 运行时单例注册表，管理各世界类型的 WorldMechanics 实现。
 * 替代硬编码的 WORLD_MECHANICS 映射表和 Fallback 逻辑。
 *
 * 设计原则：
 * - 单例模式：全局唯一实例
 * - 显式注册：Mod 加载时注册，未注册则报错（不静默降级）
 * - 后注册覆盖：最后写入胜出，覆盖时发出 warn
 *
 * @module shared/lib/registry
 */

import { createLogger } from '@/core/logger';
import type { WorldMechanics } from '@/modules/identity/logic/worlds/types';

/** WorldMechanicsRegistry 日志记录器 */
const log = createLogger('WorldMechanicsRegistry');

// ============================================
// 注册表实现
// ============================================

/**
 * 世界机制注册表
 *
 * 单例类，管理 WorldMechanics 实现的注册和查询。
 *
 * @example
 * ```typescript
 * const registry = WorldMechanicsRegistry.getInstance();
 * registry.register('修仙', cultivationWorld);
 * const mechanics = registry.get('修仙');
 * ```
 */
export class WorldMechanicsRegistry {
  private static instance: WorldMechanicsRegistry | null = null;

  /** 世界机制实现（key: worldTypeId） */
  private mechanics: Map<string, WorldMechanics> = new Map();

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): WorldMechanicsRegistry {
    if (!WorldMechanicsRegistry.instance) {
      WorldMechanicsRegistry.instance = new WorldMechanicsRegistry();
    }
    return WorldMechanicsRegistry.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    WorldMechanicsRegistry.instance = null;
  }

  /**
   * 注册世界机制实现
   *
   * 如果 worldTypeId 已被注册，发出警告并覆盖。
   *
   * @param worldTypeId - 世界类型标识
   * @param mechanics - WorldMechanics 实现
   */
  register(worldTypeId: string, mechanics: WorldMechanics): void {
    if (this.mechanics.has(worldTypeId)) {
      log.warn(`覆盖已注册的世界机制: ${worldTypeId}`);    }
    this.mechanics.set(worldTypeId, mechanics);
  }

  /**
   * 获取世界机制实现
   *
   * @param worldTypeId - 世界类型标识
   * @returns WorldMechanics 实现
   * @throws 如果 worldTypeId 未注册
   */
  get(worldTypeId: string): WorldMechanics {
    const mechanics = this.mechanics.get(worldTypeId);
    if (!mechanics) {
      const available = Array.from(this.mechanics.keys()).join(', ');
      throw new Error(
        `[WorldMechanicsRegistry] 世界机制未注册: "${worldTypeId}"。` +
        `已注册的世界类型: [${available}]`
      );
    }
    return mechanics;
  }

  /**
   * 检查世界类型是否有注册的机制实现
   *
   * @param worldTypeId - 世界类型标识
   * @returns 是否已注册
   */
  has(worldTypeId: string): boolean {
    return this.mechanics.has(worldTypeId);
  }

  /**
   * 获取所有已注册的世界机制
   *
   * @returns Map<worldTypeId, WorldMechanics>
   */
  getAll(): Map<string, WorldMechanics> {
    return new Map(this.mechanics);
  }
}
