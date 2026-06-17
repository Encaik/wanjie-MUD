/**
 * 统一物品数据索引
 *
 * ALL_TEMPLATES 映射表 + getTemplate() 查询函数
 */

import type { ItemTemplate } from '../types';
import { parseTemplateId } from '../types';
import { CURRENCY_TEMPLATES } from './templates/currency';
import { CONSUMABLE_TEMPLATES } from './templates/consumable';
import { MATERIAL_TEMPLATES } from './templates/material';
import { CULTIVATION_EQUIPMENT_TEMPLATES } from './templates/equipment/cultivation';
import { CULTIVATION_TECHNIQUE_TEMPLATES } from './templates/technique/cultivation';
import { MAGIC_SKILL_TEMPLATES } from './templates/skill/magic';
import { COMBAT_SKILL_TEMPLATES } from './templates/skill/combat';
import { LEGACY_ID_MAP } from './compat';

/** 所有物品模板的平面列表 */
export const ALL_TEMPLATES: ItemTemplate[] = [
  ...CURRENCY_TEMPLATES,
  ...CONSUMABLE_TEMPLATES,
  ...MATERIAL_TEMPLATES,
  ...CULTIVATION_EQUIPMENT_TEMPLATES,
  ...CULTIVATION_TECHNIQUE_TEMPLATES,
  ...MAGIC_SKILL_TEMPLATES,
  ...COMBAT_SKILL_TEMPLATES,
];

/** 模板 ID → 模板 的快速查找映射 */
export const TEMPLATE_MAP: Record<string, ItemTemplate> = {};
for (const tpl of ALL_TEMPLATES) {
  if (TEMPLATE_MAP[tpl.templateId]) {
    console.error(`[ITEM DATA] 重复的 templateId: "${tpl.templateId}"`);
    continue;
  }
  TEMPLATE_MAP[tpl.templateId] = tpl;
}

/**
 * 通过 templateId 查询模板
 *
 * 兼容旧式简单 ID（通过 LEGACY_ID_MAP 自动映射到新三段式 ID）。
 *
 * @param templateId - 模板唯一标识（支持新旧两种格式）
 * @returns ItemTemplate，如果不存在则抛出错误
 */
export function getTemplate(templateId: string): ItemTemplate {
  // 旧 ID → 新 ID 兼容映射
  const resolvedId = LEGACY_ID_MAP[templateId] || templateId;
  const tpl = TEMPLATE_MAP[resolvedId];
  if (!tpl) {
    throw new Error(`[ITEM DATA] 未找到物品模板: "${templateId}"`);
  }
  return tpl;
}

/**
 * 按类别获取模板列表
 */
export function getTemplatesByCategory<T extends ItemTemplate>(
  category: T['category']
): T[] {
  return ALL_TEMPLATES.filter(t => t.category === category) as T[];
}

/**
 * 按世界观获取模板列表
 *
 * 通过解析 templateId 中的 worldview 段过滤：
 * - common 对所有世界观可见
 * - 指定 worldview 仅对该世界观可见
 */
export function getTemplatesByWorldView(worldType: string): ItemTemplate[] {
  return ALL_TEMPLATES.filter(t => {
    const parsed = parseTemplateId(t.templateId);
    if (!parsed) return true; // 非标准 ID，保留兼容
    if (parsed.worldview === 'common') return true;
    return parsed.worldview === worldType;
  });
}

export {
  CURRENCY_TEMPLATES,
  CONSUMABLE_TEMPLATES,
  MATERIAL_TEMPLATES,
  CULTIVATION_EQUIPMENT_TEMPLATES,
  CULTIVATION_TECHNIQUE_TEMPLATES,
  MAGIC_SKILL_TEMPLATES,
  COMBAT_SKILL_TEMPLATES,
};
