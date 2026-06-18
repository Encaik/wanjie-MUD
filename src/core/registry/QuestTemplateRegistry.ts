/**
 * 任务模板注册中心
 *
 * 统一管理内置和 Mod 注册的 QuestTemplate。
 * 位于 core/ 因为 ModLoader（core/mod/）在加载阶段需要注册模板。
 *
 * 单例模式，全局唯一入口。
 *
 * @module core/registry
 */

import type { QuestTemplate } from '@/core/types';

export class QuestTemplateRegistry {
  private static instance: QuestTemplateRegistry;
  private templates = new Map<string, QuestTemplate>();

  static getInstance(): QuestTemplateRegistry {
    if (!QuestTemplateRegistry.instance) {
      QuestTemplateRegistry.instance = new QuestTemplateRegistry();
    }
    return QuestTemplateRegistry.instance;
  }

  /** 重置实例（仅用于测试） */
  static resetInstance(): void {
    QuestTemplateRegistry.instance = new QuestTemplateRegistry();
  }

  /** 注册单个模板（幂等：已存在则静默跳过） */
  register(template: QuestTemplate): void {
    if (this.templates.has(template.templateId)) return;
    this.templates.set(template.templateId, template);
  }

  /** 批量注册模板 */
  registerAll(templates: QuestTemplate[]): void {
    for (const t of templates) {
      this.register(t);
    }
  }

  /** 按 ID 获取模板 */
  get(id: string): QuestTemplate | undefined {
    return this.templates.get(id);
  }

  /** 获取所有已注册模板 */
  getAll(): QuestTemplate[] {
    return Array.from(this.templates.values());
  }

  /** 按世界观筛选（空限制 = 全世界可见） */
  getAllForWorldview(worldviewId: string): QuestTemplate[] {
    return Array.from(this.templates.values())
      .filter(t =>
        !t.worldviewRestrictions
        || t.worldviewRestrictions.length === 0
        || t.worldviewRestrictions.includes(worldviewId),
      );
  }

  /** 按板块 ID 获取模板列表 */
  getByBoardId(boardId: string): QuestTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.boardIds?.includes(boardId));
  }

  /** 按故事线 ID 获取模板列表 */
  getByStorylineId(storylineId: string): QuestTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.storylineId === storylineId);
  }

  /** 获取模板总数 */
  get size(): number {
    return this.templates.size;
  }
}
