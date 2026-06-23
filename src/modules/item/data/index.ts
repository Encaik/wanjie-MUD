/**
 * 统一物品数据索引
 *
 * 合并 built-in 通用物品（wanjie:common:*）与 Mod 注册的世界观物品（wanjie-core:<worldview>:*）。
 * ItemRegistry 在 Mod 加载时异步填充，getTemplate() 等查询函数支持惰性求值。
 */

import { ItemRegistry } from '@/core/registry/ItemRegistry';
import type { ItemTemplateData } from '@/core/types';


import { parseTemplateId } from '../types';
import { CONSUMABLE_TEMPLATES } from './templates/consumable';
import { CURRENCY_TEMPLATES } from './templates/currency';
import { MATERIAL_TEMPLATES } from './templates/material';

import type { ItemTemplate } from '../types';

/** Built-in 通用物品模板（wanjie:common:*） */
const BUILTIN_TEMPLATES: ItemTemplateData[] = [
  ...CURRENCY_TEMPLATES,
  ...CONSUMABLE_TEMPLATES,
  ...MATERIAL_TEMPLATES,
];

// ─── 惰性缓存 ───

let _allTemplatesCache: ItemTemplateData[] | null = null;
let _templateMapCache: Record<string, ItemTemplateData> | null = null;

/** 使缓存失效（Mod 加载完成后调用） */
export function invalidateTemplateCache(): void {
  _allTemplatesCache = null;
  _templateMapCache = null;
  _cachedItemRegistrySize = -1;
}

let _cachedItemRegistrySize = -1;

function buildAllTemplates(): ItemTemplateData[] {
  const registry = ItemRegistry.getInstance();
  const modTemplates = registry.getAll();
  return [...BUILTIN_TEMPLATES, ...modTemplates];
}

function getTemplateMap(): Record<string, ItemTemplateData> {
  // Mod 注入新物品后自动刷新缓存
  const currentSize = ItemRegistry.getInstance().count;
  if (_templateMapCache && currentSize !== _cachedItemRegistrySize) {
    _templateMapCache = null;
    _allTemplatesCache = null;
  }
  if (!_templateMapCache) {
    _templateMapCache = {};
    const all = buildAllTemplates();
    for (const tpl of all) {
      if (_templateMapCache[tpl.templateId]) {
        console.error(`[ITEM DATA] 重复的 templateId: "${tpl.templateId}"`);
        continue;
      }
      _templateMapCache[tpl.templateId] = tpl;
    }
    _cachedItemRegistrySize = currentSize;
  }
  return _templateMapCache;
}

/** 所有物品模板的平面列表（惰性求值，含 Mod 注入） */
export function getAllTemplates(): ItemTemplateData[] {
  if (!_allTemplatesCache) {
    _allTemplatesCache = buildAllTemplates();
  }
  return _allTemplatesCache;
}

/**
 * 通过 templateId 查询模板
 *
 * 查找顺序：built-in 通用物品 → ItemRegistry 中的 Mod 物品。
 *
 * @param templateId - 三段式模板唯一标识（如 "wanjie:common:spirit_stone"）
 * @returns ItemTemplate，如果不存在则抛出错误
 */
export function getTemplate(templateId: string): ItemTemplate {
  const map = getTemplateMap();
  const tpl = map[templateId];
  if (!tpl) {
    throw new Error(`[ITEM DATA] 未找到物品模板: "${templateId}"`);
  }
  return tpl as ItemTemplate;
}

/** 检查模板是否存在（不抛异常） */
export function hasTemplate(templateId: string): boolean {
  return templateId in getTemplateMap();
}


/**
 * 按类别获取模板列表
 */
export function getTemplatesByCategory<T extends ItemTemplate>(
  category: T['category']
): T[] {
  return getAllTemplates().filter(t => t.category === category) as T[];
}

/**
 * 按世界观获取模板列表
 *
 * 通过解析 templateId 中的 worldview 段过滤：
 * - common 对所有世界观可见
 * - 指定 worldview 仅对该世界观可见
 */
export function getTemplatesByWorldView(worldType: string): ItemTemplate[] {
  return getAllTemplates().filter(t => {
    const parsed = parseTemplateId(t.templateId);
    if (!parsed) return true;
    if (parsed.worldview === 'common') return true;
    return parsed.worldview === worldType;
  }) as ItemTemplate[];
}

export {
  CURRENCY_TEMPLATES,
  CONSUMABLE_TEMPLATES,
  MATERIAL_TEMPLATES,
};
