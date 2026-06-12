/**
 * 天赋注册中心
 *
 * 管理 Mod 加载的天赋定义，支持按种族/世界观/稀有度查询。
 *
 * @module core/registry
 */

import type { TalentDefinition, TalentRarity } from '@/core/types';

export class TalentRegistry {
  private static instance: TalentRegistry;
  private talents = new Map<string, TalentDefinition>();

  static getInstance(): TalentRegistry {
    if (!TalentRegistry.instance) TalentRegistry.instance = new TalentRegistry();
    return TalentRegistry.instance;
  }

  static resetInstance(): void {
    TalentRegistry.instance = new TalentRegistry();
  }

  register(talent: TalentDefinition): void {
    if (this.talents.has(talent.id)) {
      throw new Error(`天赋 ID 冲突: ${talent.id}`);
    }
    this.talents.set(talent.id, talent);
  }

  /** 批量注册 */
  registerAll(data: Record<string, Omit<TalentDefinition, 'id'>>): void {
    for (const [id, talent] of Object.entries(data)) {
      this.register({ ...talent, id } as TalentDefinition);
    }
  }

  get(id: string): TalentDefinition | undefined {
    return this.talents.get(id);
  }

  /** 按种族 ID 筛选可用天赋 */
  getForRace(raceId: string): TalentDefinition[] {
    return Array.from(this.talents.values())
      .filter(t => !t.raceRestrictions || t.raceRestrictions.length === 0
        || t.raceRestrictions.includes(raceId));
  }

  /** 按稀有度筛选 */
  getByRarity(rarity: TalentRarity): TalentDefinition[] {
    return Array.from(this.talents.values()).filter(t => t.rarity === rarity);
  }

  getAll(): TalentDefinition[] {
    return Array.from(this.talents.values());
  }

  get count(): number {
    return this.talents.size;
  }
}
