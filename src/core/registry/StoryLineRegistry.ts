/**
 * 故事线注册中心
 *
 * 管理 Mod 和内置模块注入的故事线定义。
 * 单例模式，供 ModLoader、storyEngine 和 UI 使用。
 *
 * @module core/registry
 */

import type { StoryLine, StoryLineType } from '@/core/types';

export class StoryLineRegistry {
  private static instance: StoryLineRegistry;
  private storylines = new Map<string, StoryLine>();

  static getInstance(): StoryLineRegistry {
    if (!StoryLineRegistry.instance) StoryLineRegistry.instance = new StoryLineRegistry();
    return StoryLineRegistry.instance;
  }

  static resetInstance(): void {
    StoryLineRegistry.instance = new StoryLineRegistry();
  }

  /** 注册单个故事线（幂等：已存在则静默跳过） */
  register(storyline: StoryLine): void {
    if (this.storylines.has(storyline.id)) return;
    this.storylines.set(storyline.id, storyline);
  }

  /** 批量注册故事线 */
  registerAll(storylines: StoryLine[]): void {
    for (const s of storylines) this.register(s);
  }

  /** 按 ID 查询故事线 */
  getById(id: string): StoryLine | undefined {
    return this.storylines.get(id);
  }

  /** 获取所有故事线 */
  getAll(): StoryLine[] {
    return Array.from(this.storylines.values());
  }

  /** 按类型筛选 */
  getByType(type: StoryLineType): StoryLine[] {
    return Array.from(this.storylines.values()).filter(s => s.type === type);
  }

  /** 按世界观筛选 */
  getByWorldview(worldviewId: string): StoryLine[] {
    return Array.from(this.storylines.values())
      .filter(s => !s.worldviewRestrictions || s.worldviewRestrictions.length === 0
        || s.worldviewRestrictions.includes(worldviewId));
  }

  /** 查询某个任务所属的故事线 */
  getByQuestId(questId: string): StoryLine[] {
    return Array.from(this.storylines.values()).filter(s => {
      const allNodes = flattenNodes(s.rootNodes);
      return allNodes.some(n => n.type === 'quest_ref' && n.questId === questId);
    });
  }

  get count(): number {
    return this.storylines.size;
  }
}

/** 展平故事线节点树为数组 */
function flattenNodes(nodes: import('@/core/types').StoryNode[]): import('@/core/types').StoryNode[] {
  const result: import('@/core/types').StoryNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...flattenNodes(node.children));
    }
  }
  return result;
}
