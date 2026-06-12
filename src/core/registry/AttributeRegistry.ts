/**
 * 属性注册中心
 *
 * 管理 Mod 加载的属性模板，以 key 为索引的扁平结构。
 * 世界观通过 attributes: string[] 引用 key，从此注册中心查找模板。
 *
 * @module core/registry
 */

import type { AttributeTemplate } from '@/core/types';

/**
 * 属性注册中心（单例）
 */
export class AttributeRegistry {
  private static instance: AttributeRegistry;
  private templates = new Map<string, AttributeTemplate>();

  static getInstance(): AttributeRegistry {
    if (!AttributeRegistry.instance) {
      AttributeRegistry.instance = new AttributeRegistry();
    }
    return AttributeRegistry.instance;
  }

  static resetInstance(): void {
    AttributeRegistry.instance = new AttributeRegistry();
  }

  /** 注册单个属性模板 */
  register(key: string, template: AttributeTemplate): void {
    if (this.templates.has(key)) {
      throw new Error(`属性 key 冲突: ${key} 已注册`);
    }
    this.templates.set(key, { ...template, key });
  }

  /** 批量注册（从 Mod 加载的 { key: template } 对象）。已存在的 key 跳过并告警 */
  registerAll(data: Record<string, Omit<AttributeTemplate, 'key'>>): void {
    for (const [key, template] of Object.entries(data)) {
      if (this.templates.has(key)) {
        // 不同属性集可能共享同名属性，跳过而非报错
        continue;
      }
      this.register(key, template as AttributeTemplate);
    }
  }

  /** 按 key 获取模板 */
  get(key: string): AttributeTemplate | undefined {
    return this.templates.get(key);
  }

  /** 按 keys 数组获取模板列表 */
  resolveAll(keys: string[]): AttributeTemplate[] {
    return keys
      .map(k => this.templates.get(k))
      .filter((t): t is AttributeTemplate => t !== undefined);
  }

  getAll(): AttributeTemplate[] {
    return Array.from(this.templates.values());
  }

  has(key: string): boolean {
    return this.templates.has(key);
  }

  get count(): number {
    return this.templates.size;
  }
}
