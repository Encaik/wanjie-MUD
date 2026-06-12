/**
 * 种族注册中心
 *
 * 管理 Mod 加载的种族定义，供世界观通过 racePool 引用。
 *
 * @module core/registry
 */

import type { RaceDefinition } from '@/core/types';

export class RaceRegistry {
  private static instance: RaceRegistry;
  private races = new Map<string, RaceDefinition>();

  static getInstance(): RaceRegistry {
    if (!RaceRegistry.instance) RaceRegistry.instance = new RaceRegistry();
    return RaceRegistry.instance;
  }

  static resetInstance(): void {
    RaceRegistry.instance = new RaceRegistry();
  }

  register(race: RaceDefinition): void {
    if (this.races.has(race.id)) {
      throw new Error(`种族 ID 冲突: ${race.id}`);
    }
    this.races.set(race.id, race);
  }

  /** 批量注册（从 Mod 加载的数组） */
  registerAll(races: RaceDefinition[]): void {
    for (const race of races) this.register(race);
  }

  get(id: string): RaceDefinition | undefined {
    return this.races.get(id);
  }

  /** 按世界观筛选可用种族 */
  getForWorldview(worldviewId: string): RaceDefinition[] {
    return Array.from(this.races.values())
      .filter(r => !r.worldviewRestrictions || r.worldviewRestrictions.length === 0
        || r.worldviewRestrictions.includes(worldviewId));
  }

  getAll(): RaceDefinition[] {
    return Array.from(this.races.values());
  }

  get count(): number {
    return this.races.size;
  }
}
