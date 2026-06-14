/**
 * NPC 数据注册中心
 *
 * 管理 Mod 加载的 NPC 定义，供世界观/阵营查询。
 * NPC 数据通过 Mod JSON 文件加载，注册后可供对话、交易、战斗系统使用。
 *
 * @module core/registry
 */

import type { NPCDefinition } from '@/core/types';

export class NPCDataRegistry {
  private static instance: NPCDataRegistry;
  private npcs = new Map<string, NPCDefinition>();

  static getInstance(): NPCDataRegistry {
    if (!NPCDataRegistry.instance) NPCDataRegistry.instance = new NPCDataRegistry();
    return NPCDataRegistry.instance;
  }

  static resetInstance(): void {
    NPCDataRegistry.instance = new NPCDataRegistry();
  }

  /** 注册单个 NPC */
  register(npc: NPCDefinition): void {
    if (this.npcs.has(npc.id)) {
      throw new Error(`NPC ID 冲突: ${npc.id}`);
    }
    this.npcs.set(npc.id, npc);
  }

  /** 批量注册（从 Mod 加载的数组） */
  registerAll(npcs: NPCDefinition[]): void {
    for (const npc of npcs) this.register(npc);
  }

  /** 按 ID 查询单个 NPC */
  getById(id: string): NPCDefinition | undefined {
    return this.npcs.get(id);
  }

  /** 按世界观筛选可用 NPC */
  getByWorldview(worldviewId: string): NPCDefinition[] {
    return Array.from(this.npcs.values())
      .filter(n => !n.worldviewRestrictions || n.worldviewRestrictions.length === 0
        || n.worldviewRestrictions.includes(worldviewId));
  }

  /** 按阵营筛选 NPC */
  getByFaction(factionId: string): NPCDefinition[] {
    return Array.from(this.npcs.values())
      .filter(n => n.factionId === factionId);
  }

  /** 获取所有已注册 NPC */
  getAll(): NPCDefinition[] {
    return Array.from(this.npcs.values());
  }

  /** 已注册 NPC 总数 */
  get count(): number {
    return this.npcs.size;
  }
}
