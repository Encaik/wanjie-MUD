/**
 * WorldProviderRegistry — 世界提供者注册中心
 *
 * 单例类，管理所有已注册的 WorldProvider。游戏代码通过此注册中心获取世界来源，
 * 不直接依赖具体的随机生成器或模板加载器。
 *
 * @module shared/lib/world/WorldProviderRegistry
 */

import type { WorldProvider, WorldProviderType } from './types';

export class WorldProviderRegistry {
  private static instance: WorldProviderRegistry | null = null;

  /** 已注册的提供者（key: providerId） */
  private providers: Map<string, WorldProvider> = new Map();

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): WorldProviderRegistry {
    if (!WorldProviderRegistry.instance) {
      WorldProviderRegistry.instance = new WorldProviderRegistry();
    }
    return WorldProviderRegistry.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    WorldProviderRegistry.instance = null;
  }

  /**
   * 注册提供者
   *
   * @param provider - 要注册的提供者
   * @throws 如果 providerId 已存在
   */
  register(provider: WorldProvider): void {
    if (this.providers.has(provider.id)) {
      const existing = this.providers.get(provider.id)!;
      throw new Error(
        `[WorldProviderRegistry] Provider ID 冲突: "${provider.id}"。` +
        `已注册的 provider: "${existing.name}"，尝试注册: "${provider.name}"`,
      );
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * 注销提供者
   *
   * @param id - 提供者 ID
   */
  unregister(id: string): void {
    this.providers.delete(id);
  }

  /**
   * 获取指定 ID 的提供者
   *
   * @param id - 提供者 ID
   * @returns 提供者实例，未找到返回 undefined
   */
  get(id: string): WorldProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * 获取所有已注册的提供者
   *
   * @returns 提供者数组
   */
  getAll(): WorldProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 按类型过滤提供者
   *
   * @param type - 提供者类型
   * @returns 匹配类型的提供者数组
   */
  getByType(type: WorldProviderType): WorldProvider[] {
    return this.getAll().filter(p => p.type === type);
  }

  /**
   * 检查提供者是否已注册
   *
   * @param id - 提供者 ID
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * 获取已注册提供者总数
   */
  get count(): number {
    return this.providers.size;
  }
}
