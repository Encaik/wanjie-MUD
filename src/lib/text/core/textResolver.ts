/**
 * 文案系统 - 文案解析器
 * 
 * 根据世界观加载对应文案，解析占位符
 */

import { 
  TextResolveResult,
  TextResolverConfig,
  ValueContext,
} from './types';
import { WorldType } from '../../game/types';
import { getWorldTexts, WorldTextDefinition } from '../worlds';

// ============================================
// 文案键类型（从世界观结构推导）
// ============================================

/**
 * 文案分类
 */
export type TextCategory = 
  | 'combat'
  | 'cultivation'
  | 'resource'
  | 'item'
  | 'dungeon'
  | 'ui'
  | 'breakthrough'
  | 'message';

/**
 * 文案键格式：category.key
 * 例如：combat.victory, cultivation.success
 */
export type TextKey = 
  | `combat.${keyof WorldTextDefinition['combat']}`
  | `cultivation.${keyof WorldTextDefinition['cultivation']}`
  | `resource.${keyof WorldTextDefinition['resource']}`
  | `item.${keyof WorldTextDefinition['item']}`
  | `dungeon.${keyof WorldTextDefinition['dungeon']}`
  | `ui.${keyof WorldTextDefinition['ui']}`
  | `breakthrough.${keyof WorldTextDefinition['breakthrough']}`
  | `message.${keyof WorldTextDefinition['message']}`
  // 术语和属性
  | `term.${keyof WorldTextDefinition['terminology']}`
  | `stat.${keyof WorldTextDefinition['stats']}`
  // 流派文案：path.{body|sword|spell|alchemy|demon}.{name|description|ultimateName|ultimateDesc|ultimateEffect}
  | `path.body.name`
  | `path.body.description`
  | `path.body.ultimateName`
  | `path.body.ultimateDesc`
  | `path.body.ultimateEffect`
  | `path.sword.name`
  | `path.sword.description`
  | `path.sword.ultimateName`
  | `path.sword.ultimateDesc`
  | `path.sword.ultimateEffect`
  | `path.spell.name`
  | `path.spell.description`
  | `path.spell.ultimateName`
  | `path.spell.ultimateDesc`
  | `path.spell.ultimateEffect`
  | `path.alchemy.name`
  | `path.alchemy.description`
  | `path.alchemy.ultimateName`
  | `path.alchemy.ultimateDesc`
  | `path.alchemy.ultimateEffect`
  | `path.demon.name`
  | `path.demon.description`
  | `path.demon.ultimateName`
  | `path.demon.ultimateDesc`
  | `path.demon.ultimateEffect`;

// ============================================
// 文案解析器
// ============================================

/**
 * 文案解析器类
 * 
 * 职责：
 * 1. 根据世界观获取文案模板
 * 2. 解析占位符并注入值
 */
export class TextResolver {
  private config: TextResolverConfig;
  
  constructor(config: TextResolverConfig = {}) {
    this.config = {
      strict: config.strict ?? false,
      placeholderStart: config.placeholderStart ?? '{',
      placeholderEnd: config.placeholderEnd ?? '}',
    };
  }
  
  /**
   * 解析文案
   * 
   * @param key 文案键
   * @param params 手动传入的参数
   * @param context 值上下文
   * @returns 解析后的文案
   */
  resolve(
    key: string, 
    params: Record<string, any> = {},
    context: ValueContext
  ): string {
    const result = this.resolveWithDetails(key, params, context);
    
    if (!result.success && this.config.strict) {
      throw new Error(
        `文案解析失败: ${key}, 未解析的占位符: ${result.unresolvedPlaceholders?.join(', ')}`
      );
    }
    
    return result.text;
  }
  
  /**
   * 解析文案（带详细信息）
   */
  resolveWithDetails(
    key: string,
    params: Record<string, any> = {},
    context: ValueContext
  ): TextResolveResult {
    // 1. 获取世界观文案
    const worldTexts = getWorldTexts(context.worldType);
    
    // 2. 根据键获取文案模板
    let text = this.getTextTemplate(key, worldTexts);
    
    if (text === undefined) {
      return {
        text: key,
        success: false,
        unresolvedPlaceholders: [key],
      };
    }
    
    // 3. 提取占位符
    const placeholders = this.extractPlaceholders(text);
    
    // 4. 解析每个占位符
    const unresolved: string[] = [];
    
    for (const placeholder of placeholders) {
      const value = this.resolvePlaceholder(placeholder, params, context, worldTexts);
      
      if (value !== undefined) {
        text = text.replace(
          `${this.config.placeholderStart}${placeholder}${this.config.placeholderEnd}`,
          String(value)
        );
      } else {
        unresolved.push(placeholder);
      }
    }
    
    return {
      text,
      success: unresolved.length === 0,
      unresolvedPlaceholders: unresolved.length > 0 ? unresolved : undefined,
    };
  }
  
  /**
   * 根据键获取文案模板
   */
  private getTextTemplate(key: string, worldTexts: WorldTextDefinition): string | undefined {
    const parts = key.split('.');
    
    if (parts.length === 2) {
      // 标准两段式键：category.field
      const [category, subKey] = parts as [string, string];
      
      switch (category) {
        case 'term':
          return (worldTexts.terminology as any)[subKey];
        case 'stat':
          return (worldTexts.stats as any)[subKey];
        case 'combat':
          return (worldTexts.combat as any)[subKey];
        case 'cultivation':
          return (worldTexts.cultivation as any)[subKey];
        case 'resource':
          return (worldTexts.resource as any)[subKey];
        case 'item':
          return (worldTexts.item as any)[subKey];
        case 'dungeon':
          return (worldTexts.dungeon as any)[subKey];
        case 'ui':
          return (worldTexts.ui as any)[subKey];
        case 'breakthrough':
          return (worldTexts.breakthrough as any)[subKey];
        case 'message':
          return (worldTexts.message as any)[subKey];
        default:
          return undefined;
      }
    } else if (parts.length === 3) {
      // 三段式键：path.{pathId}.field
      const [category, pathId, field] = parts;
      
      if (category === 'path' && pathId in worldTexts.paths) {
        const pathData = (worldTexts.paths as any)[pathId];
        return pathData?.[field];
      }
    }
    
    return undefined;
  }
  
  /**
   * 提取占位符
   */
  private extractPlaceholders(text: string): string[] {
    const { placeholderStart, placeholderEnd } = this.config;
    const regex = new RegExp(
      `\\${placeholderStart}(\\w+)\\${placeholderEnd}`, 
      'g'
    );
    const matches: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    // 去重
    return [...new Set(matches)];
  }
  
  /**
   * 解析单个占位符
   * 
   * 优先级：手动参数 > 术语/属性 > undefined
   */
  private resolvePlaceholder(
    name: string,
    params: Record<string, any>,
    context: ValueContext,
    worldTexts: WorldTextDefinition
  ): string | number | undefined {
    // 1. 检查手动参数
    if (name in params) {
      return params[name];
    }
    
    // 2. 检查术语
    if (name in worldTexts.terminology) {
      return (worldTexts.terminology as any)[name];
    }
    
    // 3. 检查属性名（带 stat 前缀）
    const statName = name.replace(/^stat/, '').toLowerCase();
    const statKey = Object.keys(worldTexts.stats).find(
      k => k.toLowerCase() === statName
    );
    if (statKey) {
      return (worldTexts.stats as any)[statKey];
    }
    
    // 4. 未找到
    return undefined;
  }
  
  /**
   * 检查文案键是否存在
   */
  hasKey(key: string): boolean {
    const [category, subKey] = key.split('.') as [string, string | undefined];
    if (!subKey) return false;
    
    const validCategories = [
      'term', 'stat', 'combat', 'cultivation', 
      'resource', 'item', 'dungeon', 'ui', 
      'breakthrough', 'message'
    ];
    
    return validCategories.includes(category);
  }
}

// ============================================
// 全局解析器实例
// ============================================

/**
 * 默认解析器实例
 */
export const textResolver = new TextResolver();

/**
 * 快捷解析方法
 */
export function resolveText(
  key: string,
  params: Record<string, any> = {},
  context: ValueContext
): string {
  return textResolver.resolve(key, params, context);
}
