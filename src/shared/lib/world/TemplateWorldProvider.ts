/**
 * TemplateWorldProvider — 固化世界模板提供者
 *
 * 实现 WorldProvider 接口（type='template'），从 WorldTemplate 的确定值
 * 直接组装 World 实例，不经过随机池选取。
 *
 * @module shared/lib/world
 */

import type { World, WorldType } from '@/shared/lib/types';
import type { WorldTemplate } from './types';
import type { WorldProvider, WorldProviderMetadata } from './types';
import { createWorldId } from './identity';

/**
 * 固化世界模板提供者
 *
 * 每个提供者绑定到一个 mod 的 worldTemplates 列表。
 * 通过 templateId 作为 seed 参数来生成世界。
 */
export class TemplateWorldProvider implements WorldProvider {
  readonly type = 'template' as const;
  readonly id: string;
  readonly name: string;
  private templates: WorldTemplate[];

  constructor(id: string, name: string, templates: WorldTemplate[]) {
    this.id = id;
    this.name = name;
    this.templates = templates;
  }

  /** 添加模板（用于增量注册） */
  addTemplate(template: WorldTemplate): void {
    this.templates.push(template);
  }

  /** 获取所有模板 */
  getTemplates(): readonly WorldTemplate[] {
    return this.templates;
  }

  generateWorld(seed: string, _ascensionCount: number = 0): World {
    const template = this.templates.find(t => t.id === seed);
    if (!template) {
      throw new Error(
        `[TemplateWorldProvider] 模板 "${seed}" 在提供者 "${this.id}" 中不存在`
      );
    }
    return {
      ...template.world,
      id: createWorldId(this.id, 'tpl', template.id),
      ratingScore: 0,
    };
  }

  generateWorlds(seeds: string[], ascensionCount: number = 0): World[] {
    return seeds.map(s => this.generateWorld(s, ascensionCount));
  }

  getMetadata(): WorldProviderMetadata {
    return {
      id: this.id,
      name: this.name,
      type: 'template',
      worldCount: this.templates.length,
      worldTypes: [...new Set(this.templates.map(t => t.world.type))],
      templateIds: this.templates.map(t => t.id),
    };
  }
}
