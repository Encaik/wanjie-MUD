/**
 * 统一物品管理器 — 背包增删查改操作
 *
 * 所有函数为纯函数：不修改输入参数，不依赖 React/浏览器 API。
 */

import type { ItemInstance, ItemCategory, Rarity, ResolvedItem } from '../types';
import { getTemplate } from '../data/index';
import { getRarityConfig } from '../data/rarity';

// ══════════════════════════════════════════════════════════════════
// 创建
// ══════════════════════════════════════════════════════════════════

/** 生成唯一实例 ID */
export function generateInstanceId(): string {
  // 使用 crypto.randomUUID() 在浏览器和 Node 18+ 都可用
  return crypto.randomUUID();
}

/**
 * 从模板创建 ItemInstance
 *
 * @param templateId - 物品模板 ID
 * @param overrides - 覆盖的字段
 * @returns 新的 ItemInstance
 */
export function createItemInstance(
  templateId: string,
  overrides: Partial<Pick<ItemInstance, 'level' | 'quantity' | 'element' | 'affixes' | 'isFragment' | 'source'>> = {}
): ItemInstance {
  const template = getTemplate(templateId);
  const resolvedId = template.templateId; // 使用模板的标准 ID（兼容旧 ID 自动映射）
  const rarityConfig = getRarityConfig(template.rarity);

  return {
    instanceId: generateInstanceId(),
    templateId: resolvedId,
    quantity: overrides.quantity ?? 1,
    level: overrides.level ?? 1,
    exp: 0,
    affixes: overrides.affixes ?? [],
    equipped: false,
    equippedInSlot: null,
    equippedSkills: {},
    element: overrides.element ?? template.element,
    isFragment: overrides.isFragment ?? false,
    obtainedAt: Date.now(),
    source: overrides.source ?? 'initial',
  };
}

// ══════════════════════════════════════════════════════════════════
// 增删
// ══════════════════════════════════════════════════════════════════

/**
 * 向背包添加物品（自动堆叠）
 *
 * 对于 maxStack > 1 的物品，优先合并到已有堆叠；
 * 对于 maxStack === 1 的物品（装备/功法/技能），总是创建新实例。
 *
 * @param inventory - 当前背包
 * @param templateId - 物品模板 ID
 * @param quantity - 添加数量
 * @param overrides - 新实例的覆盖字段
 * @returns 更新后的背包
 */
export function addItem(
  inventory: ItemInstance[],
  templateId: string,
  quantity: number,
  overrides?: Partial<Pick<ItemInstance, 'level' | 'element' | 'affixes' | 'isFragment' | 'source'>>
): ItemInstance[] {
  if (quantity <= 0) return inventory;

  const template = getTemplate(templateId);
  const newInventory = inventory.map(i => ({ ...i, equippedSkills: { ...i.equippedSkills } }));

  // 可堆叠物品：优先合并到已有实例
  if (template.maxStack > 1) {
    for (const item of newInventory) {
      if (item.templateId === templateId && item.quantity < template.maxStack && !item.equipped) {
        const room = template.maxStack - item.quantity;
        const toAdd = Math.min(room, quantity);
        item.quantity += toAdd;
        quantity -= toAdd;
        if (quantity <= 0) return newInventory;
      }
    }
  }

  // 不可堆叠或剩余数量：创建新实例
  if (template.maxStack === 1) {
    // 装备/功法/技能：每个都是独立实例
    for (let i = 0; i < quantity; i++) {
      newInventory.push(createItemInstance(templateId, overrides));
    }
  } else {
    // 可堆叠但无可合并实例：创建新堆叠
    while (quantity > 0) {
      const stackQty = Math.min(quantity, template.maxStack);
      newInventory.push(createItemInstance(templateId, { ...overrides, quantity: stackQty }));
      quantity -= stackQty;
    }
  }

  return newInventory;
}

/**
 * 从背包移除物品
 *
 * 如果物品已装备，先卸下再移除。
 *
 * @param inventory - 当前背包
 * @param instanceId - 实例 ID
 * @param quantity - 移除数量
 * @returns 更新后的背包（移除后为空则过滤掉该实例）
 */
export function removeItem(
  inventory: ItemInstance[],
  instanceId: string,
  quantity: number
): ItemInstance[] {
  if (quantity <= 0) return inventory;

  return inventory
    .map(item => {
      if (item.instanceId !== instanceId) return { ...item, equippedSkills: { ...item.equippedSkills } };
      const newQty = item.quantity - quantity;
      if (newQty <= 0) return null;
      return { ...item, quantity: newQty, equippedSkills: { ...item.equippedSkills } };
    })
    .filter((item): item is ItemInstance => item !== null);
}

// ══════════════════════════════════════════════════════════════════
// 堆叠管理
// ══════════════════════════════════════════════════════════════════

/**
 * 拆分堆叠
 *
 * @param inventory - 当前背包
 * @param instanceId - 要拆分的实例 ID
 * @param count - 拆分数量
 * @returns 更新后的背包
 */
export function splitStack(
  inventory: ItemInstance[],
  instanceId: string,
  count: number
): ItemInstance[] {
  if (count <= 0) return inventory;

  return inventory.flatMap(item => {
    if (item.instanceId !== instanceId || item.quantity <= count) return [{ ...item, equippedSkills: { ...item.equippedSkills } }];

    return [
      { ...item, quantity: item.quantity - count, equippedSkills: { ...item.equippedSkills } },
      { ...createItemInstance(item.templateId), quantity: count },
    ];
  });
}

/**
 * 合并堆叠
 *
 * @param inventory - 当前背包
 * @param sourceInstanceId - 要合并的源实例
 * @param targetInstanceId - 目标实例
 * @returns 更新后的背包
 */
export function mergeStacks(
  inventory: ItemInstance[],
  sourceInstanceId: string,
  targetInstanceId: string
): ItemInstance[] {
  const source = inventory.find(i => i.instanceId === sourceInstanceId);
  const target = inventory.find(i => i.instanceId === targetInstanceId);

  if (!source || !target) return inventory;
  if (source.templateId !== target.templateId) return inventory;

  const template = getTemplate(target.templateId);
  const totalQty = source.quantity + target.quantity;
  const room = template.maxStack - target.quantity;

  return inventory
    .map(item => {
      if (item.instanceId === targetInstanceId) {
        const added = Math.min(source.quantity, room);
        return { ...item, quantity: item.quantity + added, equippedSkills: { ...item.equippedSkills } };
      }
      if (item.instanceId === sourceInstanceId) {
        const remaining = source.quantity - room;
        if (remaining <= 0) return null;
        return { ...item, quantity: remaining, equippedSkills: { ...item.equippedSkills } };
      }
      return { ...item, equippedSkills: { ...item.equippedSkills } };
    })
    .filter((item): item is ItemInstance => item !== null);
}

// ══════════════════════════════════════════════════════════════════
// 查询
// ══════════════════════════════════════════════════════════════════

/**
 * 按类别筛选物品
 */
export function getItemsByCategory(inventory: ItemInstance[], category: ItemCategory): ItemInstance[] {
  const tplIds = new Set<string>();
  for (const item of inventory) {
    try {
      const tpl = getTemplate(item.templateId);
      if (tpl.category === category) tplIds.add(item.instanceId);
    } catch { /* 忽略无效 templateId */ }
  }
  return inventory.filter(i => tplIds.has(i.instanceId));
}

/**
 * 获取某模板的总持有数量（含堆叠）
 */
export function getItemCount(inventory: ItemInstance[], templateId: string): number {
  return inventory
    .filter(i => i.templateId === templateId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * 获取货币余额（语法糖）
 */
export function getCurrencyAmount(inventory: ItemInstance[], currencyTemplateId: string): number {
  return getItemCount(inventory, currencyTemplateId);
}

/**
 * 判断是否有足够数量
 */
export function hasEnough(inventory: ItemInstance[], templateId: string, count: number): boolean {
  return getItemCount(inventory, templateId) >= count;
}

/**
 * 按模板 ID 查找实例
 */
export function findItemsByTemplate(inventory: ItemInstance[], templateId: string): ItemInstance[] {
  return inventory.filter(i => i.templateId === templateId);
}

/**
 * 按实例 ID 查找
 */
export function findItemByInstance(inventory: ItemInstance[], instanceId: string): ItemInstance | undefined {
  return inventory.find(i => i.instanceId === instanceId);
}

// ══════════════════════════════════════════════════════════════════
// 解析（合并模板+实例，用于 UI 展示）
// ══════════════════════════════════════════════════════════════════

/**
 * 使用 rarity.multiplier 的等级缩放公式
 */
function levelMultiplier(level: number, rarity: Rarity): number {
  const config = getRarityConfig(rarity);
  // 每级增加 statMultiplier * 0.15
  return config.statMultiplier * (1 + (level - 1) * 0.15);
}

/**
 * 计算升级所需经验
 */
function expToNext(level: number, rarity: Rarity): number {
  const config = getRarityConfig(rarity);
  return Math.round(100 * config.expMultiplier * Math.pow(1.5, level - 1));
}

/**
 * 合并模板和实例数据，生成 UI 友好的完整物品信息
 *
 * @param instance - ItemInstance
 * @returns ResolvedItem（包含模板静态数据 + 实例运行时数据 + 衍生计算值）
 */
export function resolveItem(instance: ItemInstance): ResolvedItem {
  const template = getTemplate(instance.templateId);
  const mult = levelMultiplier(instance.level, template.rarity);

  // 计算当前等级的实际数值
  const actualStats: Record<string, number> = {};
  for (const [key, value] of Object.entries(template.baseStats)) {
    actualStats[key] = Math.round(value * mult);
  }

  // 加上词缀效果
  for (const affix of instance.affixes) {
    for (const [key, value] of Object.entries(affix.effects)) {
      actualStats[key] = (actualStats[key] || 0) + value;
    }
  }

  return {
    instanceId: instance.instanceId,
    templateId: instance.templateId,
    name: template.name,
    description: template.description,
    category: template.category,
    subcategory: template.subcategory,
    rarity: template.rarity,
    quantity: instance.quantity,
    level: instance.level,
    maxLevel: template.maxLevel,
    exp: instance.exp,
    expToNext: expToNext(instance.level, template.rarity),
    equipped: instance.equipped,
    equippedInSlot: instance.equippedInSlot,
    equippedSkills: instance.equippedSkills,
    element: instance.element ?? template.element,
    affixes: instance.affixes,
    isFragment: instance.isFragment,
    obtainedAt: instance.obtainedAt,
    source: instance.source,
    actualStats,
    price: template.price,
    ext: template.ext,
    instance,
    template,
  };
}
