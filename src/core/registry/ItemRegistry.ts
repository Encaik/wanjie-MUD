/**
 * 物品模板注册中心
 *
 * 管理 Mod 加载的物品模板定义，以 templateId 为索引。
 * 物品数据通过 Mod JSON 文件加载，注册后供物品系统查询。
 *
 * @module core/registry
 */

import type { ItemTemplateData } from '@/core/types';

/**
 * 物品模板注册中心（单例）
 *
 * 设计原则：
 * - 单例模式：全局唯一实例
 * - 只管理 ItemTemplateData：不包含业务逻辑
 * - 类型安全：所有 API 使用精确的 TypeScript 类型
 */
export class ItemRegistry {
  private static instance: ItemRegistry;
  private templates = new Map<string, ItemTemplateData>();

  static getInstance(): ItemRegistry {
    if (!ItemRegistry.instance) ItemRegistry.instance = new ItemRegistry();
    return ItemRegistry.instance;
  }

  static resetInstance(): void {
    ItemRegistry.instance = new ItemRegistry();
  }

  /** 注册单个物品模板 */
  register(template: ItemTemplateData): void {
    if (this.templates.has(template.templateId)) {
      throw new Error(`物品模板 ID 冲突: "${template.templateId}"，已有同名模板注册`);
    }
    this.templates.set(template.templateId, template);
  }

  /** 批量注册（从 Mod 加载的数组） */
  registerAll(templates: ItemTemplateData[]): void {
    for (const tpl of templates) this.register(tpl);
  }

  /** 按 templateId 查询单个模板 */
  getById(id: string): ItemTemplateData | undefined {
    return this.templates.get(id);
  }

  /** 获取所有已注册模板 */
  getAll(): ItemTemplateData[] {
    return Array.from(this.templates.values());
  }

  /** 已注册模板总数 */
  get count(): number {
    return this.templates.size;
  }
}
